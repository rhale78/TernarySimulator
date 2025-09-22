/**
 * Balanced Ternary Assembler
 * Converts assembly language to machine code
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
    global.TernaryUtils = ternaryModule.TernaryUtils;
}

class TernaryAssembler {
    constructor() {
        this.labels = new Map();
        this.references = new Map();
        this.constants = new Map();
        this.currentAddress = 0;
        
        // Instruction opcodes (matches CPU instruction set)
        this.opcodes = {
            'NOP': 0,
            'LDA': 1, 'STA': 2, 'LDX': 3, 'STX': 4, 'MOV': 5,
            'ADD': 10, 'SUB': 11, 'MUL': 12, 'INC': 13, 'DEC': 14,
            'AND': 20, 'OR': 21, 'NOT': 22, 'SHL': 23, 'SHR': 24,
            'CMP': 30, 'JMP': 31, 'JZ': 32, 'JP': 33, 'JN': 34, 'JSR': 35, 'RTS': 36,
            'PSH': 40, 'POP': 41,
            'IN': 50, 'OUT': 51,
            'HLT': -13  // Fits in 3 trits
        };

        // Register names
        this.registers = {
            'ACC': 0, 'IX': 1, 'PC': 2, 'SP': 3, 'FLAGS': 4,
            'R1': 5, 'R2': 6, 'R3': 7
        };

        // Addressing modes
        this.addressingModes = {
            IMMEDIATE: 0,    // #value
            DIRECT: 1,       // address
            INDIRECT: 2,     // (address)
            INDEXED: 3,      // address,X
            RELATIVE: 4      // +/-offset
        };
    }

    // Main assembly function
    assemble(sourceCode, startAddress = 0) {
        this.reset();
        this.currentAddress = startAddress;
        
        try {
            // First pass: collect labels and constants
            const lines = this.preprocessSource(sourceCode);
            this.firstPass(lines);
            
            // Second pass: generate machine code
            const machineCode = this.secondPass(lines);
            
            return {
                success: true,
                machineCode: machineCode,
                labels: Object.fromEntries(this.labels),
                startAddress: startAddress,
                endAddress: this.currentAddress - 1
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                line: error.line || 0
            };
        }
    }

    reset() {
        this.labels.clear();
        this.references.clear();
        this.constants.clear();
        this.currentAddress = 0;
    }

    preprocessSource(sourceCode) {
        const lines = sourceCode.split('\n');
        const processed = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Remove comments
            const commentIndex = line.indexOf(';');
            if (commentIndex >= 0) {
                line = line.substring(0, commentIndex).trim();
            }
            
            // Skip empty lines
            if (line.length === 0) continue;
            
            processed.push({
                number: i + 1,
                original: lines[i],
                text: line
            });
        }

        return processed;
    }

    firstPass(lines) {
        this.currentAddress = 0;

        for (let lineInfo of lines) {
            const line = lineInfo.text;
            
            try {
                // Check for labels
                if (line.includes(':')) {
                    const parts = line.split(':');
                    const label = parts[0].trim();
                    this.labels.set(label, this.currentAddress);
                    
                    // Process rest of line if it contains an instruction
                    if (parts.length > 1 && parts[1].trim().length > 0) {
                        this.processInstruction(parts[1].trim());
                        this.currentAddress++;
                    }
                } else if (line.startsWith('.')) {
                    // Handle assembler directives
                    this.processDirective(line);
                } else if (line.length > 0) {
                    // Regular instruction
                    this.processInstruction(line);
                    this.currentAddress++;
                }
            } catch (error) {
                error.line = lineInfo.number;
                throw error;
            }
        }
    }

    secondPass(lines) {
        this.currentAddress = 0;
        const machineCode = [];

        for (let lineInfo of lines) {
            const line = lineInfo.text;
            
            try {
                // Check for labels
                if (line.includes(':')) {
                    const parts = line.split(':');
                    
                    // Process rest of line if it contains an instruction
                    if (parts.length > 1 && parts[1].trim().length > 0) {
                        const instruction = this.assembleInstruction(parts[1].trim());
                        machineCode.push({
                            address: this.currentAddress,
                            instruction: instruction,
                            source: lineInfo.original
                        });
                        this.currentAddress++;
                    }
                } else if (line.startsWith('.')) {
                    // Handle assembler directives that generate data
                    const data = this.processDirectiveForData(line);
                    if (data) {
                        machineCode.push({
                            address: this.currentAddress,
                            instruction: data,
                            source: lineInfo.original
                        });
                        this.currentAddress++;
                    }
                } else if (line.length > 0) {
                    // Regular instruction
                    const instruction = this.assembleInstruction(line);
                    machineCode.push({
                        address: this.currentAddress,
                        instruction: instruction,
                        source: lineInfo.original
                    });
                    this.currentAddress++;
                }
            } catch (error) {
                error.line = lineInfo.number;
                throw error;
            }
        }

        return machineCode;
    }

    processInstruction(line) {
        // Just validate the instruction syntax for first pass
        const parts = line.trim().split(/\s+/);
        const mnemonic = parts[0].toUpperCase();
        
        if (!this.opcodes.hasOwnProperty(mnemonic)) {
            throw new Error(`Unknown instruction: ${mnemonic}`);
        }
    }

    processDirective(line) {
        const parts = line.trim().split(/\s+/);
        const directive = parts[0].toLowerCase();
        
        switch (directive) {
            case '.org':
                // Set origin address
                if (parts.length < 2) throw new Error('.org requires an address');
                this.currentAddress = this.parseValue(parts[1]);
                break;
            
            case '.equ':
                // Define constant
                if (parts.length < 3) throw new Error('.equ requires name and value');
                this.constants.set(parts[1], this.parseValue(parts[2]));
                break;
            
            case '.db':
                // Define byte (tryte) - reserve space
                this.currentAddress++;
                break;
            
            case '.dw':
                // Define word (2 trytes) - reserve space
                this.currentAddress += 2;
                break;
            
            case '.ds':
                // Define space - reserve multiple locations
                if (parts.length < 2) throw new Error('.ds requires a count');
                this.currentAddress += this.parseValue(parts[1]);
                break;
        }
    }

    processDirectiveForData(line) {
        const parts = line.trim().split(/\s+/);
        const directive = parts[0].toLowerCase();
        
        switch (directive) {
            case '.db':
                // Define byte (tryte)
                if (parts.length < 2) throw new Error('.db requires a value');
                return new Tryte(this.parseValue(parts[1]));
            
            case '.dw':
                // Define word - return first tryte, second will be processed next
                if (parts.length < 2) throw new Error('.dw requires a value');
                const value = this.parseValue(parts[1]);
                return new Tryte(value & 0x1FF); // Lower 9 bits
            
            default:
                return null;
        }
    }

    assembleInstruction(line) {
        const parts = line.trim().split(/\s+/);
        const mnemonic = parts[0].toUpperCase();
        
        if (!this.opcodes.hasOwnProperty(mnemonic)) {
            throw new Error(`Unknown instruction: ${mnemonic}`);
        }

        const opcode = this.opcodes[mnemonic];
        let operand = 0;
        let isImmediate = false;

        // Parse operand if present
        if (parts.length > 1) {
            const operandStr = parts[1];
            
            // Check for immediate addressing
            if (operandStr.startsWith('#')) {
                isImmediate = true;
                operand = this.parseValue(operandStr.substring(1));
            } else {
                operand = this.parseValue(operandStr);
            }
        }

        // Encode instruction with addressing mode
        return this.encodeInstruction(opcode, operand, isImmediate);
    }

    parseOperand(operandStr) {
        operandStr = operandStr.trim();
        
        // Immediate value: #value
        if (operandStr.startsWith('#')) {
            return this.parseValue(operandStr.substring(1));
        }
        
        // Indirect addressing: (address)
        if (operandStr.startsWith('(') && operandStr.endsWith(')')) {
            const addr = operandStr.substring(1, operandStr.length - 1);
            return this.parseValue(addr);
        }
        
        // Indexed addressing: address,X
        if (operandStr.includes(',X')) {
            const addr = operandStr.substring(0, operandStr.indexOf(',X'));
            return this.parseValue(addr);
        }
        
        // Direct addressing: just the address
        return this.parseValue(operandStr);
    }

    parseValue(valueStr) {
        valueStr = valueStr.trim();
        
        // Check if it's a defined constant
        if (this.constants.has(valueStr)) {
            return this.constants.get(valueStr);
        }
        
        // Check if it's a label (only in second pass)
        if (this.labels.has(valueStr)) {
            return this.labels.get(valueStr);
        }
        
        // Try to parse as decimal number
        const decimal = parseInt(valueStr, 10);
        if (!isNaN(decimal)) {
            return decimal;
        }
        
        // Try to parse as balanced ternary
        if (TernaryUtils && TernaryUtils.isValidTernaryString(valueStr)) {
            return new BalancedTernary(valueStr).toDecimal();
        }
        
        // Try to parse as binary (0b prefix)
        if (valueStr.startsWith('0b')) {
            return parseInt(valueStr.substring(2), 2);
        }
        
        // Try to parse as hex (0x prefix)
        if (valueStr.startsWith('0x')) {
            return parseInt(valueStr.substring(2), 16);
        }
        
        // If it's not a known label, return 0 for now (will be resolved in second pass)
        return 0;
    }

    encodeInstruction(opcode, operand, isImmediate = false) {
        // Encoding: 
        // - For immediate: encode the value directly in operand field
        // - For direct: encode the address in operand field
        // - First 3 trits: opcode
        // - Last 3 trits: operand value or address
        
        const opcodeTrits = new BalancedTernary(opcode).toWidth(3).trits;
        const operandTrits = new BalancedTernary(operand).toWidth(3).trits;
        
        const instruction = [...opcodeTrits, ...operandTrits];
        return new Tryte(instruction);
    }

    // Create example programs
    static getExampleProgram() {
        return `; Simple Balanced Ternary Program
; Adds two numbers and displays result

.org 0          ; Start at address 0

start:
    LDA #10     ; Load 10 into accumulator
    ADD #20     ; Add 20 to accumulator
    STA result  ; Store result
    OUT         ; Output result
    HLT         ; Halt program

result:
    .db 0       ; Storage for result

; Another example: Loop counter
loop_start:
    LDA #5      ; Load counter
loop:
    DEC         ; Decrement counter
    JZ done     ; Jump if zero
    JMP loop    ; Jump back to loop
done:
    HLT         ; End program
`;
    }

    static getSimpleIOExample() {
        return `; I/O Example
; Reads input and echoes it back

.org 0

main:
    IN          ; Read input to accumulator
    OUT         ; Output accumulator
    JMP main    ; Loop forever

    HLT         ; Should never reach here
`;
    }

    static getStackExample() {
        return `; Stack Example
; Demonstrates subroutine calls

.org 0

main:
    LDA #42     ; Load test value
    JSR print_num ; Call subroutine
    HLT         ; End program

print_num:
    PSH         ; Push accumulator to stack
    OUT         ; Output the number
    POP         ; Pop back from stack
    RTS         ; Return from subroutine

.org 100       ; Stack starts at address 100
stack_start:
`;
    }

    // Disassembler - convert machine code back to assembly
    disassemble(machineCode, startAddress = 0) {
        const lines = [];
        let address = startAddress;
        
        // Reverse opcode lookup
        const reverseOpcodes = {};
        for (let [mnemonic, opcode] of Object.entries(this.opcodes)) {
            reverseOpcodes[opcode] = mnemonic;
        }

        for (let instruction of machineCode) {
            if (instruction instanceof Tryte) {
                // Decode instruction
                const trits = instruction.trits;
                const opcode = new BalancedTernary([trits[0], trits[1], trits[2]]).toDecimal();
                const operand = new BalancedTernary([trits[3], trits[4], trits[5]]);
                
                const mnemonic = reverseOpcodes[opcode] || `UNKNOWN(${opcode})`;
                const operandStr = operand.toDecimal() !== 0 ? ` ${operand.toDecimal()}` : '';
                
                lines.push(`${address.toString().padStart(6, '0')}: ${mnemonic}${operandStr}`);
            } else {
                lines.push(`${address.toString().padStart(6, '0')}: DATA ${instruction.toString()}`);
            }
            
            address++;
        }

        return lines.join('\n');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernaryAssembler };
}