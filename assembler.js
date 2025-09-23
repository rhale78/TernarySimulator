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
        this.macros = new Map();
        this.conditionalStack = [];
        this.currentAddress = 0;
        
        // Instruction opcodes (optimized for 3-trit range -13 to +13)
        this.opcodes = {
            'NOP': 0,
            // Core data movement
            'LDA': 1, 'STA': 2, 'LDX': 3, 'STX': 4, 'MOV': 5,
            // Core arithmetic 
            'ADD': 6, 'SUB': 7, 'MUL': 8, 'DIV': 50, 'MOD': 51, 'INC': 9, 'DEC': 10,
            // Core logical
            'AND': 11, 'OR': 12, 'XOR': 52, 'NOT': 13,
            // Bit/Trit operations  
            'SHL': 53, 'SHR': 54, 'ROL': 55, 'ROR': 56,
            // Control flow
            'CMP': -1, 'JMP': -2, 'JZ': -3, 'JP': -4, 'JN': -5, 
            'JNZ': 57, 'JC': 58, 'JNC': 59, 'JSR': -6, 'RTS': -7,
            'CALL': 60, 'RET': 61, // x86-style aliases
            // Stack and I/O
            'PSH': -8, 'POP': -9, 'IN': -10, 'OUT': -11,
            // Essential new instructions  
            'LDX1': -12, // Load index register 1
            'HLT': -13,  // Halt instruction
            
            // Extended word operations (using 2-trit opcodes for broader range)
            // Note: These require special handling as they exceed 3-trit range
            'LDAW': 14,  // Load Accumulator Word (12 trits)
            'STAW': 15,  // Store Accumulator Word
            'ADDW': 16,  // Add Word
            'SUBW': 17,  // Subtract Word
            'MULW': 18,  // Multiply Word
            
            // Triple-word operations  
            'LDAT': 19,  // Load Accumulator Triple-word (18 trits)
            'STAT': 20,  // Store Accumulator Triple-word
            'ADDT': 21,  // Add Triple-word
            'SUBT': 22,  // Subtract Triple-word
            'MULT': 23,  // Multiply Triple-word
            
            // Memory block operations
            'MOVC': 24,  // Memory copy block
            'MOVW': 25,  // Move word block
            'MOVT': 26,  // Move triple-word block
            'CLRB': 27,  // Clear block
            
            // Floating-point operations
            'FLDA': 28,  // Load float to FPU
            'FSTA': 29,  // Store float from FPU
            'FADD': 30,  // Float add
            'FSUB': 31,  // Float subtract
            'FMUL': 32,  // Float multiply
            'FDIV': 33,  // Float divide
            'FCMP': 34,  // Float compare
            'FMOD': 35,  // Set FPU mode (ternary/binary)
            
            // Enhanced interrupt operations
            'SEI': 36,   // Set interrupt flag (enable)
            'CLI': 37,   // Clear interrupt flag (disable)
            'RTI': 38,   // Return from interrupt
            'SWI': 39,   // Software interrupt
            'MSK': 40,   // Mask interrupt
            'UMK': 41,   // Unmask interrupt
            'SML': 42,   // Set mask level
            
            // Memory Management Unit operations
            'MPG': 43,   // Enable/disable paging
            'MPT': 44,   // Set protection level
            'MAP': 45,   // Map virtual page
            'UMP': 46,   // Unmap virtual page
            'FLT': 47,   // Flush TLB
            'LVA': 48,   // Load from virtual address
            'SVA': 49    // Store to virtual address
        };

        // Register names
        this.registers = {
            'ACC': 0, 'IX': 1, 'IX1': 14, 'IX2': 15, 'IX3': 16, 'PC': 2, 'SP': 3, 'FLAGS': 4,
            'R1': 5, 'R2': 6, 'R3': 7, 'R4': 8, 'R5': 9, 'R6': 10, 'R7': 11, 'R8': 12, 'R9': 13,
            // Extended registers
            'ACCW': 20, 'ACCT': 21, 'W1': 22, 'W2': 23, 'T1': 24, 'T2': 25,
            // FPU registers
            'F0': 30, 'F1': 31, 'F2': 32, 'F3': 33, 'FE0': 34, 'FE1': 35, 'FACC': 36, 'FACCX': 37,
            'B0': 40, 'B1': 41, 'B2': 42, 'B3': 43, 'BACC': 44
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
        this.macros.clear();
        this.conditionalStack = [];
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

        // Expand macros and handle conditional assembly
        return this.expandMacrosAndConditionals(processed);
    }

    expandMacrosAndConditionals(lines) {
        // Pre-scan for .equ directives to make constants available for conditional evaluation
        this.preScanConstants(lines);
        
        const expanded = [];
        const conditionalStack = [];
        let skipUntilEndif = false;
        let currentMacro = null;

        for (let lineInfo of lines) {
            const line = lineInfo.text;
            
            // Handle macro definition
            if (line.startsWith('.macro')) {
                currentMacro = this.startMacroDefinition(line);
                continue;
            }
            
            if (line === '.endm') {
                if (currentMacro) {
                    this.endMacroDefinition(currentMacro);
                    currentMacro = null;
                }
                continue;
            }
            
            // If we're in a macro definition, collect lines
            if (currentMacro) {
                currentMacro.body.push(lineInfo);
                continue;
            }
            
            // Handle conditional assembly
            if (line.startsWith('.ifdef') || line.startsWith('.ifndef') || line.startsWith('.if')) {
                const shouldInclude = this.evaluateConditional(line);
                conditionalStack.push({ shouldInclude, hasElse: false });
                skipUntilEndif = !shouldInclude;
                continue;
            }
            
            if (line === '.else') {
                if (conditionalStack.length > 0) {
                    const current = conditionalStack[conditionalStack.length - 1];
                    current.hasElse = true;
                    skipUntilEndif = current.shouldInclude; // Flip the condition
                }
                continue;
            }
            
            if (line === '.endif') {
                if (conditionalStack.length > 0) {
                    conditionalStack.pop();
                    skipUntilEndif = conditionalStack.some(cond => !cond.shouldInclude);
                }
                continue;
            }
            
            // Skip lines if we're in a false conditional
            if (skipUntilEndif) continue;
            
            // Handle macro invocation
            const parts = line.trim().split(/\s+/);
            if (this.macros.has(parts[0])) {
                const expandedLines = this.expandMacro(parts[0], parts.slice(1), lineInfo.number);
                expanded.push(...expandedLines);
                continue;
            }
            
            // Regular line
            expanded.push(lineInfo);
        }

        return expanded;
    }

    preScanConstants(lines) {
        // Scan for .equ directives to populate constants for conditional evaluation
        for (let lineInfo of lines) {
            const line = lineInfo.text;
            if (line.startsWith('.equ')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    this.constants.set(parts[1], this.parseValue(parts[2]));
                }
            }
        }
    }

    startMacroDefinition(line) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 2) throw new Error('.macro requires a name');
        
        const name = parts[1];
        const parameters = parts.slice(2);
        
        return {
            name: name,
            parameters: parameters,
            body: []
        };
    }

    endMacroDefinition(macroDef) {
        this.macros.set(macroDef.name, {
            parameters: macroDef.parameters,
            body: macroDef.body
        });
    }

    expandMacro(name, args, lineNumber) {
        const macro = this.macros.get(name);
        const expanded = [];
        
        for (let lineInfo of macro.body) {
            let line = lineInfo.text;
            
            // Replace parameters with arguments
            for (let i = 0; i < macro.parameters.length; i++) {
                const param = macro.parameters[i];
                const arg = args[i] || '';
                line = line.replace(new RegExp(`\\b${param}\\b`, 'g'), arg);
            }
            
            expanded.push({
                number: lineNumber,
                original: `; macro ${name}: ${lineInfo.original}`,
                text: line
            });
        }
        
        return expanded;
    }

    evaluateConditional(line) {
        const parts = line.trim().split(/\s+/);
        const directive = parts[0];
        
        switch (directive) {
            case '.ifdef':
                if (parts.length < 2) throw new Error('.ifdef requires a symbol name');
                return this.constants.has(parts[1]) || this.labels.has(parts[1]);
                
            case '.ifndef':
                if (parts.length < 2) throw new Error('.ifndef requires a symbol name');
                return !this.constants.has(parts[1]) && !this.labels.has(parts[1]);
                
            case '.if':
                if (parts.length < 2) throw new Error('.if requires an expression');
                // Simple expression evaluation - can be enhanced
                const expr = parts.slice(1).join(' ');
                return this.evaluateSimpleExpression(expr);
        }
        
        return false;
    }

    evaluateSimpleExpression(expr) {
        // Simple expression evaluator for constants
        // Supports: number comparisons, defined() function
        
        if (expr.match(/^defined\(\s*(\w+)\s*\)$/)) {
            const symbol = expr.match(/^defined\(\s*(\w+)\s*\)$/)[1];
            return this.constants.has(symbol) || this.labels.has(symbol);
        }
        
        // Simple numeric comparison
        const match = expr.match(/^(\w+|\d+)\s*([><=!]+)\s*(\w+|\d+)$/);
        if (match) {
            const [, left, op, right] = match;
            const leftVal = this.getValue(left);
            const rightVal = this.getValue(right);
            
            switch (op) {
                case '>': return leftVal > rightVal;
                case '<': return leftVal < rightVal;
                case '>=': return leftVal >= rightVal;
                case '<=': return leftVal <= rightVal;
                case '==': return leftVal == rightVal;
                case '!=': return leftVal != rightVal;
            }
        }
        
        // Default to true for simple symbols
        const value = this.getValue(expr);
        return value !== 0;
    }

    getValue(token) {
        if (token.match(/^-?\d+$/)) {
            return parseInt(token);
        }
        
        if (this.constants.has(token)) {
            return this.constants.get(token);
        }
        
        return 0; // Undefined symbols default to 0
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
            
            case '.align':
                // Align to boundary
                if (parts.length < 2) throw new Error('.align requires a boundary value');
                const boundary = this.parseValue(parts[1]);
                const remainder = this.currentAddress % boundary;
                if (remainder !== 0) {
                    this.currentAddress += boundary - remainder;
                }
                break;
                
            case '.rept':
                // Repeat directive - should be handled in preprocessing
                throw new Error('.rept directive should be preprocessed');
                
            case '.endr':
                // End repeat directive
                throw new Error('.endr directive should be preprocessed');
                
            // Conditional assembly directives are handled in preprocessing
            case '.ifdef':
            case '.ifndef':
            case '.if':
            case '.else':
            case '.endif':
                // These are handled in preprocessing
                break;
                
            // Macro directives are handled in preprocessing
            case '.macro':
            case '.endm':
                // These are handled in preprocessing
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
                
            case '.ascii':
                // Define ASCII string - return array of character codes
                if (parts.length < 2) throw new Error('.ascii requires a string');
                const stringMatch = line.match(/"([^"]*)"/);
                if (!stringMatch) throw new Error('.ascii requires a quoted string');
                const str = stringMatch[1];
                // Return first character, subsequent characters handled in second pass
                return str.length > 0 ? new Tryte(str.charCodeAt(0)) : null;
            
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
        
        // Indexed addressing: address,X or address,IX1 or address,IX2 or address,IX3
        const indexPatterns = [',X', ',IX', ',IX1', ',IX2', ',IX3'];
        for (const pattern of indexPatterns) {
            if (operandStr.includes(pattern)) {
                const addr = operandStr.substring(0, operandStr.indexOf(pattern));
                return this.parseValue(addr);
            }
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

    static getMacroExample() {
        return `; Macro Example
; Demonstrates macro definition and usage

.equ RESULT_ADDR 100
.equ LOOP_COUNT 5

; Define a macro to load and add a value
.macro LOAD_ADD addr value
    LDA addr
    ADD #value
    STA addr
.endm

; Define a macro for conditional jump
.macro JUMP_IF_ZERO label
    CMP #0
    JZ label
.endm

.org 0

main:
    ; Initialize result
    LDA #0
    STA RESULT_ADDR
    
    ; Use macro to add values
    LOAD_ADD RESULT_ADDR 10
    LOAD_ADD RESULT_ADDR 20
    LOAD_ADD RESULT_ADDR 5
    
    ; Load final result
    LDA RESULT_ADDR
    
    ; Use conditional macro
    JUMP_IF_ZERO zero_result
    
    OUT    ; Output non-zero result
    HLT
    
zero_result:
    LDA #999  ; Error indicator
    OUT
    HLT
`;
    }

    static getConditionalExample() {
        return `; Conditional Assembly Example
; Demonstrates conditional compilation

.equ DEBUG 1
.equ VERSION 2

.org 0

main:
    LDA #10
    
.ifdef DEBUG
    ; Debug version includes extra output
    OUT
    LDA #77  ; Debug marker
    OUT
.endif

.if VERSION > 1
    ; Version 2+ features
    ADD #5
.else
    ; Version 1 features
    ADD #3
.endif

    STA result
    OUT
    HLT

result:
    .db 0
`;
    }

    static getAdvancedDirectivesExample() {
        return `; Advanced Directives Example
; Demonstrates .ascii, .align, and other directives

.org 0

main:
    LDA #hello_msg
    JSR print_string
    HLT

print_string:
    ; Simple string printing routine
    OUT
    RTS

.align 8   ; Align to 8-tryte boundary

hello_msg:
    .ascii "Hello World!"
    .db 0      ; Null terminator

.align 4   ; Align data section

data_section:
    .dw 1000   ; 16-bit value
    .db 42     ; 8-bit value
    .ds 10     ; Reserve 10 bytes
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