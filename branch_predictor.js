/**
 * Branch Prediction Unit for Ternary CPU
 * Implements various branch prediction algorithms
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

class BranchPredictor {
    constructor(type = 'bimodal', size = 256) {
        this.type = type;
        this.size = size;
        this.stats = {
            predictions: 0,
            correct: 0,
            incorrect: 0,
            accuracy: 0
        };
        
        // Initialize predictor based on type
        this.initializePredictor();
    }
    
    initializePredictor() {
        switch (this.type) {
            case 'static':
                this.prediction = 'not-taken'; // Always predict not taken
                break;
                
            case 'bimodal':
                // 2-bit saturating counter per entry
                this.table = new Array(this.size).fill(0); // 0=strongly not taken, 3=strongly taken
                break;
                
            case 'gshare':
                // Global history + branch address XOR
                this.globalHistory = 0;
                this.historyLength = 8;
                this.table = new Array(this.size).fill(0);
                break;
                
            case 'tournament':
                // Tournament predictor with local and global predictors
                this.localTable = new Array(this.size).fill(0);
                this.globalTable = new Array(this.size).fill(0);
                this.choiceTable = new Array(this.size).fill(0); // 0=use local, 1=use global
                this.globalHistory = 0;
                this.localHistories = new Array(this.size).fill(0);
                break;
                
            default:
                this.type = 'bimodal';
                this.table = new Array(this.size).fill(0);
        }
    }
    
    // Predict if branch will be taken
    predict(branchAddress, instruction) {
        this.stats.predictions++;
        
        switch (this.type) {
            case 'static':
                return this.predictStatic(instruction);
                
            case 'bimodal':
                return this.predictBimodal(branchAddress);
                
            case 'gshare':
                return this.predictGshare(branchAddress);
                
            case 'tournament':
                return this.predictTournament(branchAddress);
                
            default:
                return false; // Not taken
        }
    }
    
    predictStatic(instruction) {
        // Simple heuristics for static prediction
        const opcode = instruction.toString();
        
        // Loop-like instructions are more likely to be taken
        if (opcode.includes('JN') || opcode.includes('JZ')) {
            return false; // Loop exit conditions typically not taken
        }
        
        // Conditional jumps typically not taken
        return false;
    }
    
    predictBimodal(branchAddress) {
        const index = this.getIndex(branchAddress);
        const counter = this.table[index];
        
        // 2-bit saturating counter: 0,1 = not taken, 2,3 = taken
        return counter >= 2;
    }
    
    predictGshare(branchAddress) {
        const addressBits = this.getIndex(branchAddress);
        const historyBits = this.globalHistory & ((1 << this.historyLength) - 1);
        const index = (addressBits ^ historyBits) % this.size;
        
        const counter = this.table[index];
        return counter >= 2;
    }
    
    predictTournament(branchAddress) {
        const index = this.getIndex(branchAddress);
        const choice = this.choiceTable[index];
        
        if (choice >= 2) {
            // Use global predictor
            const globalIndex = (index ^ this.globalHistory) % this.size;
            return this.globalTable[globalIndex] >= 2;
        } else {
            // Use local predictor
            const localHistory = this.localHistories[index];
            const localIndex = localHistory % this.size;
            return this.localTable[localIndex] >= 2;
        }
    }
    
    // Update predictor with actual outcome
    update(branchAddress, taken, instruction) {
        const predicted = this.lastPrediction;
        
        if (predicted === taken) {
            this.stats.correct++;
        } else {
            this.stats.incorrect++;
        }
        
        this.stats.accuracy = this.stats.correct / this.stats.predictions;
        
        switch (this.type) {
            case 'static':
                // No update needed for static predictor
                break;
                
            case 'bimodal':
                this.updateBimodal(branchAddress, taken);
                break;
                
            case 'gshare':
                this.updateGshare(branchAddress, taken);
                break;
                
            case 'tournament':
                this.updateTournament(branchAddress, taken);
                break;
        }
    }
    
    updateBimodal(branchAddress, taken) {
        const index = this.getIndex(branchAddress);
        
        if (taken) {
            this.table[index] = Math.min(3, this.table[index] + 1);
        } else {
            this.table[index] = Math.max(0, this.table[index] - 1);
        }
    }
    
    updateGshare(branchAddress, taken) {
        const addressBits = this.getIndex(branchAddress);
        const historyBits = this.globalHistory & ((1 << this.historyLength) - 1);
        const index = (addressBits ^ historyBits) % this.size;
        
        if (taken) {
            this.table[index] = Math.min(3, this.table[index] + 1);
        } else {
            this.table[index] = Math.max(0, this.table[index] - 1);
        }
        
        // Update global history
        this.globalHistory = ((this.globalHistory << 1) | (taken ? 1 : 0)) & 
                            ((1 << this.historyLength) - 1);
    }
    
    updateTournament(branchAddress, taken) {
        const index = this.getIndex(branchAddress);
        
        // Get predictions from both predictors
        const globalIndex = (index ^ this.globalHistory) % this.size;
        const globalPred = this.globalTable[globalIndex] >= 2;
        
        const localHistory = this.localHistories[index];
        const localIndex = localHistory % this.size;
        const localPred = this.localTable[localIndex] >= 2;
        
        // Update choice table
        if (globalPred !== localPred) {
            if (globalPred === taken) {
                // Global was correct, favor it
                this.choiceTable[index] = Math.min(3, this.choiceTable[index] + 1);
            } else {
                // Local was correct, favor it
                this.choiceTable[index] = Math.max(0, this.choiceTable[index] - 1);
            }
        }
        
        // Update both predictors
        if (taken) {
            this.globalTable[globalIndex] = Math.min(3, this.globalTable[globalIndex] + 1);
            this.localTable[localIndex] = Math.min(3, this.localTable[localIndex] + 1);
        } else {
            this.globalTable[globalIndex] = Math.max(0, this.globalTable[globalIndex] - 1);
            this.localTable[localIndex] = Math.max(0, this.localTable[localIndex] - 1);
        }
        
        // Update histories
        this.globalHistory = ((this.globalHistory << 1) | (taken ? 1 : 0)) & 
                            ((1 << this.historyLength) - 1);
        this.localHistories[index] = ((this.localHistories[index] << 1) | (taken ? 1 : 0)) & 
                                    ((1 << this.historyLength) - 1);
    }
    
    // Get table index from branch address
    getIndex(branchAddress) {
        if (typeof branchAddress === 'object' && branchAddress.toDecimal) {
            return branchAddress.toDecimal() % this.size;
        } else if (typeof branchAddress === 'number') {
            return branchAddress % this.size;
        } else {
            return 0;
        }
    }
    
    // Store prediction for later verification
    storePrediction(prediction) {
        this.lastPrediction = prediction;
        return prediction;
    }
    
    // Get prediction statistics
    getStats() {
        return {
            type: this.type,
            size: this.size,
            predictions: this.stats.predictions,
            correct: this.stats.correct,
            incorrect: this.stats.incorrect,
            accuracy: this.stats.accuracy,
            missRate: 1 - this.stats.accuracy
        };
    }
    
    // Reset predictor state
    reset() {
        this.stats = {
            predictions: 0,
            correct: 0,
            incorrect: 0,
            accuracy: 0
        };
        
        this.initializePredictor();
    }
    
    // Check if instruction is a branch
    static isBranchInstruction(instruction) {
        if (!instruction || typeof instruction.toString !== 'function') {
            return false;
        }
        
        const instrStr = instruction.toString();
        const branchOpcodes = ['JMP', 'JZ', 'JP', 'JN', 'JNZ', 'JC', 'JNC', 'JSR', 'CALL'];
        
        return branchOpcodes.some(opcode => instrStr.includes(opcode));
    }
    
    // Calculate target address for branch (simplified)
    static calculateTarget(currentAddress, instruction, operand) {
        // In a real implementation, this would decode the instruction
        // and calculate the actual branch target
        if (typeof operand === 'number') {
            return operand;
        } else if (operand && operand.toDecimal) {
            return operand.toDecimal();
        }
        
        return currentAddress + 1; // Default to next instruction
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BranchPredictor };
}