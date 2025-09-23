/**
 * Balanced Ternary CPU Instruction Pipeline
 * Implements fetch, decode, execute, write-back pipeline stages
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

/**
 * Pipeline Stage States
 */
const PipelineStages = {
    FETCH: 'FETCH',
    DECODE: 'DECODE', 
    EXECUTE: 'EXECUTE',
    WRITEBACK: 'WRITEBACK'
};

/**
 * Pipeline Instruction Representation
 */
class PipelineInstruction {
    constructor() {
        this.pc = null;                 // Program counter when fetched
        this.rawInstruction = null;     // Raw instruction from memory
        this.opcode = null;            // Decoded opcode
        this.operand = null;           // Decoded operand
        this.instructionRef = null;    // Reference to instruction implementation
        this.result = null;            // Execution result
        this.writeTarget = null;       // Where to write the result
        this.completed = false;        // Instruction completed
        this.stalled = false;          // Instruction stalled due to dependency
        this.hazard = null;           // Type of hazard detected
    }
}

/**
 * Instruction Pipeline Manager
 * Manages 4-stage pipeline: Fetch -> Decode -> Execute -> Write-back
 */
class InstructionPipeline {
    constructor(cpu) {
        this.cpu = cpu;
        this.enabled = false;          // Pipeline enabled/disabled
        
        // Pipeline stages - each can hold one instruction
        this.stages = {
            [PipelineStages.FETCH]: null,
            [PipelineStages.DECODE]: null,
            [PipelineStages.EXECUTE]: null,
            [PipelineStages.WRITEBACK]: null
        };
        
        // Pipeline statistics
        this.stats = {
            totalInstructions: 0,
            stallCycles: 0,
            hazardCount: 0,
            throughput: 0
        };
        
        // Hazard detection
        this.dataHazards = new Set();
        this.controlHazards = new Set();
        
        // Pipeline control
        this.stalled = false;
        this.flushing = false;
    }
    
    /**
     * Enable/disable pipeline
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.flush();
        }
    }
    
    /**
     * Execute one pipeline cycle
     */
    tick() {
        if (!this.enabled || this.cpu.halted) {
            return;
        }
        
        // Process stages in reverse order to avoid conflicts
        this.tickWriteBack();
        this.tickExecute();
        this.tickDecode();
        this.tickFetch();
        
        // Update statistics
        this.updateStats();
    }
    
    /**
     * Fetch Stage: Get next instruction from memory
     */
    tickFetch() {
        // Don't fetch if pipeline is stalled or fetch stage is occupied
        if (this.stalled || this.stages[PipelineStages.FETCH] || this.flushing) {
            return;
        }
        
        const pc = this.cpu.registers.get('pc');
        
        // Check breakpoints
        if (this.cpu.breakpoints.has(pc.toString())) {
            this.cpu.running = false;
            console.log(`Breakpoint hit at ${pc.toString()}`);
            return;
        }
        
        try {
            // Create new pipeline instruction
            const pipelineInstr = new PipelineInstruction();
            pipelineInstr.pc = new TernaryAddress(pc.toDecimal(), 9);
            
            // Fetch from ROM or memory
            if (this.cpu.romChip && this.cpu.romChip.isInRange(pc)) {
                pipelineInstr.rawInstruction = this.cpu.romChip.read(pc);
            } else {
                pipelineInstr.rawInstruction = this.cpu.memory.read(pc);
            }
            
            // Place in fetch stage
            this.stages[PipelineStages.FETCH] = pipelineInstr;
            
            // Increment PC for next fetch
            this.cpu.registers.set('pc', pc.increment());
            
        } catch (error) {
            console.error(`Fetch error: ${error.message}`);
        }
    }
    
    /**
     * Decode Stage: Decode instruction and check for hazards
     */
    tickDecode() {
        const fetchedInstr = this.stages[PipelineStages.FETCH];
        
        // Move instruction from fetch to decode
        if (fetchedInstr && !this.stages[PipelineStages.DECODE]) {
            this.stages[PipelineStages.DECODE] = fetchedInstr;
            this.stages[PipelineStages.FETCH] = null;
        }
        
        const instr = this.stages[PipelineStages.DECODE];
        if (!instr) return;
        
        try {
            // Decode instruction
            const trits = instr.rawInstruction.trits;
            while (trits.length < 6) {
                trits.push(0);
            }
            
            const opcodeTrits = [trits[0] || 0, trits[1] || 0, trits[2] || 0];
            const operandTrits = [trits[3] || 0, trits[4] || 0, trits[5] || 0];
            
            instr.opcode = new BalancedTernary(opcodeTrits).toDecimal();
            instr.operand = new BalancedTernary(operandTrits).toDecimal();
            
            // Find instruction implementation
            for (let [mnemonic, instrImpl] of Object.entries(this.cpu.instructions)) {
                if (instrImpl.opcode === instr.opcode) {
                    instr.instructionRef = instrImpl;
                    break;
                }
            }
            
            // Check for hazards
            this.detectHazards(instr);
            
            // If hazard detected, stall pipeline
            if (instr.hazard) {
                this.stalled = true;
                this.stats.stallCycles++;
                this.stats.hazardCount++;
                return;
            }
            
        } catch (error) {
            console.error(`Decode error: ${error.message}`);
        }
    }
    
    /**
     * Execute Stage: Execute the instruction
     */
    tickExecute() {
        const decodedInstr = this.stages[PipelineStages.DECODE];
        
        // Move instruction from decode to execute (if not stalled)
        if (decodedInstr && !this.stages[PipelineStages.EXECUTE] && !this.stalled) {
            this.stages[PipelineStages.EXECUTE] = decodedInstr;
            this.stages[PipelineStages.DECODE] = null;
        }
        
        const instr = this.stages[PipelineStages.EXECUTE];
        if (!instr) return;
        
        try {
            // Special handling for halt instruction
            if (instr.opcode === -13) {
                this.cpu.halt();
                instr.completed = true;
                return;
            }
            
            // Special handling for control flow instructions
            if (this.isControlFlowInstruction(instr.opcode)) {
                this.handleControlFlow(instr);
            } else {
                // Execute regular instruction
                if (instr.instructionRef) {
                    instr.instructionRef.execute(instr.operand);
                    instr.completed = true;
                }
            }
            
        } catch (error) {
            console.error(`Execute error: ${error.message}`);
        }
    }
    
    /**
     * Write-back Stage: Commit results and finish instruction
     */
    tickWriteBack() {
        const executedInstr = this.stages[PipelineStages.EXECUTE];
        
        // Move instruction from execute to writeback
        if (executedInstr && !this.stages[PipelineStages.WRITEBACK]) {
            this.stages[PipelineStages.WRITEBACK] = executedInstr;
            this.stages[PipelineStages.EXECUTE] = null;
        }
        
        const instr = this.stages[PipelineStages.WRITEBACK];
        if (!instr) return;
        
        try {
            // Instruction is already executed, just finish up
            if (instr.completed) {
                this.stats.totalInstructions++;
                
                // Clear any related hazards
                this.clearHazards(instr);
                
                // Clear writeback stage
                this.stages[PipelineStages.WRITEBACK] = null;
                
                // Resume pipeline if stalled
                if (this.stalled) {
                    this.stalled = false;
                }
            }
            
        } catch (error) {
            console.error(`Write-back error: ${error.message}`);
        }
    }
    
    /**
     * Detect data and control hazards
     */
    detectHazards(instr) {
        // Check for data hazards (read-after-write)
        if (this.hasDataHazard(instr)) {
            instr.hazard = 'DATA';
            return;
        }
        
        // Check for control hazards (branches, jumps)
        if (this.hasControlHazard(instr)) {
            instr.hazard = 'CONTROL';
            return;
        }
        
        instr.hazard = null;
    }
    
    /**
     * Check for data hazards
     */
    hasDataHazard(instr) {
        // Check if this instruction reads from a register that's being written
        // by an instruction in execute or writeback stage
        const executingInstr = this.stages[PipelineStages.EXECUTE];
        
        if (executingInstr && this.instructionsConflict(executingInstr, instr)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check for control hazards
     */
    hasControlHazard(instr) {
        // Control hazards occur with branch/jump instructions
        return this.isControlFlowInstruction(instr.opcode);
    }
    
    /**
     * Check if two instructions conflict (data hazard)
     */
    instructionsConflict(instr1, instr2) {
        // Simplified conflict detection - assume ACC conflicts
        // In a real implementation, this would check actual register dependencies
        return this.writesToRegister(instr1) && this.readsFromRegister(instr2);
    }
    
    /**
     * Check if instruction writes to a register
     */
    writesToRegister(instr) {
        const writingOpcodes = [1, 6, 7, 8, 9, 10, 11, 12, 13]; // LDA, ADD, SUB, MUL, INC, DEC, AND, OR, NOT
        return writingOpcodes.includes(instr.opcode);
    }
    
    /**
     * Check if instruction reads from a register
     */
    readsFromRegister(instr) {
        const readingOpcodes = [2, 6, 7, 8, 11, 12, -1]; // STA, ADD, SUB, MUL, AND, OR, CMP
        return readingOpcodes.includes(instr.opcode);
    }
    
    /**
     * Check if instruction is control flow
     */
    isControlFlowInstruction(opcode) {
        const controlOpcodes = [-2, -3, -4, -5, -6, -7]; // JMP, JZ, JP, JN, JSR, RTS
        return controlOpcodes.includes(opcode);
    }
    
    /**
     * Handle control flow instructions
     */
    handleControlFlow(instr) {
        // Execute the control flow instruction
        if (instr.instructionRef) {
            instr.instructionRef.execute(instr.operand);
        }
        
        // Flush pipeline due to control flow change
        this.flush();
        instr.completed = true;
    }
    
    /**
     * Clear hazards related to an instruction
     */
    clearHazards(instr) {
        // Remove any data hazards this instruction might have caused
        this.dataHazards.delete(instr);
    }
    
    /**
     * Flush the pipeline (clear all stages)
     */
    flush() {
        this.flushing = true;
        this.stages[PipelineStages.FETCH] = null;
        this.stages[PipelineStages.DECODE] = null;
        // Don't flush execute/writeback stages - let them complete
        this.flushing = false;
        this.stalled = false;
    }
    
    /**
     * Update pipeline statistics
     */
    updateStats() {
        // Calculate throughput (instructions per cycle)
        const totalCycles = this.stats.totalInstructions + this.stats.stallCycles;
        this.stats.throughput = totalCycles > 0 ? this.stats.totalInstructions / totalCycles : 0;
    }
    
    /**
     * Get pipeline state for debugging
     */
    getState() {
        const state = {};
        for (let [stage, instr] of Object.entries(this.stages)) {
            if (instr) {
                state[stage] = {
                    pc: instr.pc ? instr.pc.toString() : 'N/A',
                    opcode: instr.opcode,
                    operand: instr.operand,
                    hazard: instr.hazard,
                    completed: instr.completed
                };
            } else {
                state[stage] = null;
            }
        }
        return {
            enabled: this.enabled,
            stalled: this.stalled,
            flushing: this.flushing,
            stages: state,
            stats: { ...this.stats }
        };
    }
    
    /**
     * Reset pipeline
     */
    reset() {
        this.flush();
        this.stats = {
            totalInstructions: 0,
            stallCycles: 0,
            hazardCount: 0,
            throughput: 0
        };
        this.dataHazards.clear();
        this.controlHazards.clear();
        this.stalled = false;
        this.flushing = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        InstructionPipeline,
        PipelineInstruction,
        PipelineStages
    };
}