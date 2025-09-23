/**
 * Balanced Ternary CPU Implementation
 * Implements ALU, registers, and instruction execution
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.DoubleWord = ternaryModule.DoubleWord;
    global.TripleWord = ternaryModule.TripleWord;
    global.TernaryAddress = ternaryModule.TernaryAddress;
    global.TernaryUtils = ternaryModule.TernaryUtils;
    
    // Import ternary components for ALU
    const ternaryGatesModule = require('./ternary_gates.js');
    global.TernaryAND = ternaryGatesModule.TernaryAND;
    global.TernaryOR = ternaryGatesModule.TernaryOR;
    global.TernaryComparator = ternaryGatesModule.TernaryComparator;
    global.TernaryHalfAdder = ternaryGatesModule.TernaryHalfAdder;
    global.TernaryFullAdder = ternaryGatesModule.TernaryFullAdder;
    global.TernaryRippleCarryAdder = ternaryGatesModule.TernaryRippleCarryAdder;
    global.TernaryShiftRegister = ternaryGatesModule.TernaryShiftRegister;
    global.TernaryMultiplier = ternaryGatesModule.TernaryMultiplier;
    global.TernaryMemoryCell = ternaryGatesModule.TernaryMemoryCell;
    
    // Import clock and microcode systems
    const clocksModule = require('./clocks.js');
    global.ClockManager = clocksModule.ClockManager;
    
    const microcodeModule = require('./microcode.js');
    global.MicrocodeEngine = microcodeModule.MicrocodeEngine;
    
    const interruptsModule = require('./interrupts.js');
    global.InterruptVectorTable = interruptsModule.InterruptVectorTable;
    global.InterruptController = interruptsModule.InterruptController;
    global.ROMChip = interruptsModule.ROMChip;
    
    const pipelineModule = require('./pipeline.js');
    global.InstructionPipeline = pipelineModule.InstructionPipeline;
    
    const fpuModule = require('./fpu.js');
    global.TernaryFloat = fpuModule.TernaryFloat;
    global.BinaryFloat = fpuModule.BinaryFloat;
    global.FloatingPointUnit = fpuModule.FloatingPointUnit;
    
    const mmuModule = require('./mmu.js');
    global.MemoryManagementUnit = mmuModule.MemoryManagementUnit;
    global.MemorySegment = mmuModule.MemorySegment;
    global.PageTableEntry = mmuModule.PageTableEntry;
    global.ProtectionModes = mmuModule.ProtectionModes;
}

class TernaryALU {
    constructor() {
        this.lastOperation = null;
        this.lastResult = null;
        // Trit-based flags: -1 (negative), 0 (neutral/false), 1 (positive/true)
        this.flags = {
            zero: 0,      // -1: not zero, 0: neutral, 1: zero
            positive: 0,  // -1: not positive, 0: neutral, 1: positive
            negative: 0,  // -1: not negative, 0: neutral, 1: negative
            overflow: 0,  // -1: underflow, 0: no overflow, 1: overflow
            carry: 0      // -1: borrow, 0: no carry, 1: carry
        };
        
        // Initialize component-based arithmetic units for true ternary emulation
        this._initializeComponents();
    }
    
    // Initialize component-based arithmetic units
    _initializeComponents() {
        // Import ternary components if available
        if (typeof TernaryRippleCarryAdder !== 'undefined') {
            this.adder = new TernaryRippleCarryAdder(6);
            this.multiplier = new TernaryMultiplier(6);
            this.andGate = new TernaryAND();
            this.orGate = new TernaryOR();
            this.comparator = new TernaryComparator();
            this.componentsAvailable = true;
        } else {
            this.componentsAvailable = false;
        }
    }

    // Update flags based on result
    updateFlags(result) {
        const decimal = result.toDecimal();
        
        // Set flags as trits: 1 for true condition, 0 for neutral, -1 for opposite
        this.flags.zero = decimal === 0 ? 1 : 0;
        this.flags.positive = decimal > 0 ? 1 : (decimal < 0 ? -1 : 0);
        this.flags.negative = decimal < 0 ? 1 : (decimal > 0 ? -1 : 0);
        
        // Check for overflow/underflow (result exceeds tryte range)
        if (decimal > Tryte.MAX_VALUE) {
            this.flags.overflow = 1;  // Overflow
        } else if (decimal < Tryte.MIN_VALUE) {
            this.flags.overflow = -1; // Underflow
        } else {
            this.flags.overflow = 0;  // No overflow
        }
    }

    // Arithmetic operations
    add(a, b) {
        this.lastOperation = 'ADD';
        const result = a.add(b);
        this.lastResult = new Tryte(result.trits);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    subtract(a, b) {
        this.lastOperation = 'SUB';
        const result = a.subtract(b);
        this.lastResult = new Tryte(result.trits);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    multiply(a, b) {
        this.lastOperation = 'MUL';
        const result = a.multiply(b);
        this.lastResult = new Tryte(result.trits);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    divide(a, b) {
        this.lastOperation = 'DIV';
        const result = a.divide(b);
        this.lastResult = new Tryte(result.trits);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    modulo(a, b) {
        this.lastOperation = 'MOD';
        const result = a.modulo(b);
        this.lastResult = new Tryte(result.trits);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    // Logical operations
    and(a, b) {
        this.lastOperation = 'AND';
        const result = a.and(b);
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    or(a, b) {
        this.lastOperation = 'OR';
        const result = a.or(b);
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    not(a) {
        this.lastOperation = 'NOT';
        const result = a.not();
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    xor(a, b) {
        this.lastOperation = 'XOR';
        const result = a.xor(b);
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    // Rotation operations
    rotateLeft(a, positions = 1) {
        this.lastOperation = 'ROL';
        const result = a.rotateLeft(positions);
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    rotateRight(a, positions = 1) {
        this.lastOperation = 'ROR';
        const result = a.rotateRight(positions);
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    // Shift operations
    shiftLeft(a, positions = 1) {
        this.lastOperation = 'SHL';
        const result = a.shiftLeft(positions);
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    shiftRight(a, positions = 1) {
        this.lastOperation = 'SHR';
        const result = a.shiftRight(positions);
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    // Comparison
    compare(a, b) {
        this.lastOperation = 'CMP';
        const result = a.subtract(b);
        this.updateFlags(result);
        this.lastResult = result;
        return a.compare(b);
    }

    // Increment/Decrement
    increment(a) {
        this.lastOperation = 'INC';
        const result = a.add(1);
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    decrement(a) {
        this.lastOperation = 'DEC';
        const result = a.subtract(1);
        this.lastResult = new Tryte(result);
        this.updateFlags(this.lastResult);
        return this.lastResult;
    }

    // Get flags as a tryte
    getFlagsAsTrits() {
        // Encode flags as ternary trits: [zero, positive, negative, carry, overflow, reserved]
        const flags = [
            this.flags.zero,
            this.flags.positive,
            this.flags.negative,
            this.flags.carry,
            this.flags.overflow,
            0 // Reserved
        ];
        return new Tryte(flags);
    }

    // Set flags from tryte
    setFlagsFromTrits(tryte) {
        const trits = tryte.trits;
        this.flags.zero = trits[0];
        this.flags.positive = trits[1];
        this.flags.negative = trits[2];
        this.flags.carry = trits[3];
        this.flags.overflow = trits[4];
    }

    // Helper methods to check flags in trit format
    isZero() { return this.flags.zero === 1; }
    isPositive() { return this.flags.positive === 1; }
    isNegative() { return this.flags.negative === 1; }
    hasOverflow() { return this.flags.overflow === 1; }
    hasUnderflow() { return this.flags.overflow === -1; }
    hasCarry() { return this.flags.carry === 1; }
    hasBorrow() { return this.flags.carry === -1; }
}

class TernaryRegisters {
    constructor() {
        this.pc = new TernaryAddress(0, 9);  // Program Counter
        this.acc = new Tryte(0);             // Accumulator
        this.ix = new Tryte(0);              // Index Register
        this.sp = new TernaryAddress(0, 9);  // Stack Pointer
        this.flags = new Tryte(0);           // Flags Register
        
        // Additional index registers for indexed addressing
        this.ix1 = new Tryte(0);             // Index Register 1
        this.ix2 = new Tryte(0);             // Index Register 2
        this.ix3 = new Tryte(0);             // Index Register 3
        
        // Extended general purpose registers (9 total)
        this.r1 = new Tryte(0);              // General purpose register 1
        this.r2 = new Tryte(0);              // General purpose register 2
        this.r3 = new Tryte(0);              // General purpose register 3
        this.r4 = new Tryte(0);              // General purpose register 4
        this.r5 = new Tryte(0);              // General purpose register 5
        this.r6 = new Tryte(0);              // General purpose register 6
        this.r7 = new Tryte(0);              // General purpose register 7
        this.r8 = new Tryte(0);              // General purpose register 8
        this.r9 = new Tryte(0);              // General purpose register 9
        
        // Word and Triple-word extended registers
        this.accw = new DoubleWord(0);       // Word accumulator (12 trits)
        this.acct = new TripleWord(0);       // Triple-word accumulator (18 trits)
        this.w1 = new DoubleWord(0);         // Word register 1
        this.w2 = new DoubleWord(0);         // Word register 2
        this.t1 = new TripleWord(0);         // Triple-word register 1
        this.t2 = new TripleWord(0);         // Triple-word register 2
    }

    // Get register by name
    get(name) {
        switch (name.toLowerCase()) {
            case 'pc': return this.pc;
            case 'acc': return this.acc;
            case 'ix': return this.ix;
            case 'ix1': return this.ix1;
            case 'ix2': return this.ix2;
            case 'ix3': return this.ix3;
            case 'sp': return this.sp;
            case 'flags': return this.flags;
            case 'r1': return this.r1;
            case 'r2': return this.r2;
            case 'r3': return this.r3;
            case 'r4': return this.r4;
            case 'r5': return this.r5;
            case 'r6': return this.r6;
            case 'r7': return this.r7;
            case 'r8': return this.r8;
            case 'r9': return this.r9;
            case 'accw': return this.accw;
            case 'acct': return this.acct;
            case 'w1': return this.w1;
            case 'w2': return this.w2;
            case 't1': return this.t1;
            case 't2': return this.t2;
            default: throw new Error(`Unknown register: ${name}`);
        }
    }

    // Set register by name
    set(name, value) {
        const val = value instanceof BalancedTernary ? value : 
                   (name === 'pc' || name === 'sp') ? new TernaryAddress(value, 9) : 
                   (name === 'accw' || name === 'w1' || name === 'w2') ? new DoubleWord(value) :
                   (name === 'acct' || name === 't1' || name === 't2') ? new TripleWord(value) : new Tryte(value);
        
        switch (name.toLowerCase()) {
            case 'pc': this.pc = val; break;
            case 'acc': this.acc = val; break;
            case 'ix': this.ix = val; break;
            case 'ix1': this.ix1 = val; break;
            case 'ix2': this.ix2 = val; break;
            case 'ix3': this.ix3 = val; break;
            case 'sp': this.sp = val; break;
            case 'flags': this.flags = val; break;
            case 'r1': this.r1 = val; break;
            case 'r2': this.r2 = val; break;
            case 'r3': this.r3 = val; break;
            case 'r4': this.r4 = val; break;
            case 'r5': this.r5 = val; break;
            case 'r6': this.r6 = val; break;
            case 'r7': this.r7 = val; break;
            case 'r8': this.r8 = val; break;
            case 'r9': this.r9 = val; break;
            case 'accw': this.accw = val; break;
            case 'acct': this.acct = val; break;
            case 'w1': this.w1 = val; break;
            case 'w2': this.w2 = val; break;
            case 't1': this.t1 = val; break;
            case 't2': this.t2 = val; break;
            default: throw new Error(`Unknown register: ${name}`);
        }
    }

    // Reset all registers
    reset() {
        this.pc = new TernaryAddress(0, 9);
        this.acc = new Tryte(0);
        this.ix = new Tryte(0);
        this.ix1 = new Tryte(0);
        this.ix2 = new Tryte(0);
        this.ix3 = new Tryte(0);
        this.sp = new TernaryAddress(0, 9);
        this.flags = new Tryte(0);
        this.r1 = new Tryte(0);
        this.r2 = new Tryte(0);
        this.r3 = new Tryte(0);
        this.r4 = new Tryte(0);
        this.r5 = new Tryte(0);
        this.r6 = new Tryte(0);
        this.r7 = new Tryte(0);
        this.r8 = new Tryte(0);
        this.r9 = new Tryte(0);
        this.accw = new DoubleWord(0);
        this.acct = new TripleWord(0);
        this.w1 = new DoubleWord(0);
        this.w2 = new DoubleWord(0);
        this.t1 = new TripleWord(0);
        this.t2 = new TripleWord(0);
    }

    // Get all registers as object
    getState() {
        return {
            pc: this.pc.toString(),
            acc: this.acc.toString(),
            ix: this.ix.toString(),
            ix1: this.ix1.toString(),
            ix2: this.ix2.toString(),
            ix3: this.ix3.toString(),
            sp: this.sp.toString(),
            flags: this.flags.toString(),
            r1: this.r1.toString(),
            r2: this.r2.toString(),
            r3: this.r3.toString(),
            r4: this.r4.toString(),
            r5: this.r5.toString(),
            r6: this.r6.toString(),
            r7: this.r7.toString(),
            r8: this.r8.toString(),
            r9: this.r9.toString(),
            accw: this.accw.toString(),
            acct: this.acct.toString(),
            w1: this.w1.toString(),
            w2: this.w2.toString(),
            t1: this.t1.toString(),
            t2: this.t2.toString()
        };
    }
}

class TernaryCPU {
    constructor(memory) {
        this.memory = memory;
        this.registers = new TernaryRegisters();
        this.alu = new TernaryALU();
        this.halted = false;
        this.running = false;
        this.cycleCount = 0;
        this.currentInstruction = null;
        this.breakpoints = new Set();
        
        // Clock and microcode systems
        this.clockManager = new ClockManager();
        this.microcodeEngine = null; // Will be initialized after clockManager
        this.useMicrocode = true; // Flag to enable/disable microcode execution
        
        // Pipeline system
        this.pipeline = new InstructionPipeline(this);
        this.usePipeline = false; // Flag to enable/disable pipelining
        
        // Branch prediction system
        try {
            const BranchPredictorModule = require('./branch_predictor.js');
            this.branchPredictor = new BranchPredictorModule.BranchPredictor('bimodal', 256);
            this.useBranchPrediction = true;
        } catch (e) {
            // Branch predictor not available in browser environment
            this.branchPredictor = null;
            this.useBranchPrediction = false;
        }
        
        // Floating-Point Unit
        this.fpu = new FloatingPointUnit();
        
        // Memory Management Unit  
        this.mmu = new MemoryManagementUnit(memory);
        
        // Interrupt system
        this.romChip = new ROMChip();
        this.interruptVectorTable = new InterruptVectorTable(memory);
        this.interruptController = new InterruptController(this, this.interruptVectorTable);
        
        // System clock counter
        this.systemClock = 0;
        
        // Initialize microcode engine
        this._initializeMicrocodeEngine();
        
        // Set up system clock interrupt
        this._setupSystemClockInterrupt();
        
        // Instruction set - separate opcodes for immediate and direct addressing
        this.instructions = this.buildInstructionSet();
    }
    
    _initializeMicrocodeEngine() {
        if (typeof MicrocodeEngine !== 'undefined') {
            this.microcodeEngine = new MicrocodeEngine(this, this.clockManager);
        }
    }
    
    _setupSystemClockInterrupt() {
        // Set up a timer to trigger system clock interrupts
        setInterval(() => {
            if (this.running) {
                this.systemClock++;
                // Request system clock interrupt every 100 cycles
                if (this.systemClock % 100 === 0) {
                    this.interruptController.requestInterrupt(11); // System clock tick
                }
            }
        }, 100); // 10Hz system clock interrupt
    }

    buildInstructionSet() {
        return {
            // Core data movement
            'LDA': { opcode: 1, execute: this.loadAccumulator.bind(this) },      // Load to accumulator
            'STA': { opcode: 2, execute: this.storeAccumulator.bind(this) },     // Store accumulator
            'LDX': { opcode: 3, execute: this.loadIndex.bind(this) },            // Load to index
            'STX': { opcode: 4, execute: this.storeIndex.bind(this) },           // Store index
            'MOV': { opcode: 5, execute: this.moveData.bind(this) },             // Move data
            
            // Core arithmetic
            'ADD': { opcode: 6, execute: this.addToAccumulator.bind(this) },     // Add to accumulator
            'SUB': { opcode: 7, execute: this.subtractFromAccumulator.bind(this) }, // Subtract from accumulator
            'MUL': { opcode: 8, execute: this.multiplyAccumulator.bind(this) },  // Multiply accumulator
            'DIV': { opcode: 50, execute: this.divideAccumulator.bind(this) },   // Divide accumulator
            'MOD': { opcode: 51, execute: this.moduloAccumulator.bind(this) },   // Modulo operation
            'INC': { opcode: 9, execute: this.incrementRegister.bind(this) },    // Increment register
            'DEC': { opcode: 10, execute: this.decrementRegister.bind(this) },   // Decrement register
            
            // Core logical
            'AND': { opcode: 11, execute: this.logicalAnd.bind(this) },          // Logical AND
            'OR':  { opcode: 12, execute: this.logicalOr.bind(this) },           // Logical OR
            'XOR': { opcode: 52, execute: this.logicalXor.bind(this) },          // Logical XOR (exclusive or)
            'NOT': { opcode: 13, execute: this.logicalNot.bind(this) },          // Logical NOT
            
            // Bit/Trit operations (RISC-style)
            'SHL': { opcode: 53, execute: this.shiftLeft.bind(this) },           // Shift left
            'SHR': { opcode: 54, execute: this.shiftRight.bind(this) },          // Shift right
            'ROL': { opcode: 55, execute: this.rotateLeft.bind(this) },          // Rotate left
            'ROR': { opcode: 56, execute: this.rotateRight.bind(this) },         // Rotate right
            
            // Control flow
            'CMP': { opcode: -1, execute: this.compare.bind(this) },             // Compare
            'JMP': { opcode: -2, execute: this.jump.bind(this) },                // Unconditional jump
            'JZ':  { opcode: -3, execute: this.jumpIfZero.bind(this) },          // Jump if zero
            'JP':  { opcode: -4, execute: this.jumpIfPositive.bind(this) },      // Jump if positive
            'JN':  { opcode: -5, execute: this.jumpIfNegative.bind(this) },      // Jump if negative
            'JNZ': { opcode: 57, execute: this.jumpIfNotZero.bind(this) },       // Jump if not zero (Z80-style)
            'JC':  { opcode: 58, execute: this.jumpIfCarry.bind(this) },         // Jump if carry (x86-style)
            'JNC': { opcode: 59, execute: this.jumpIfNotCarry.bind(this) },      // Jump if not carry
            'JSR': { opcode: -6, execute: this.jumpSubroutine.bind(this) },      // Jump to subroutine
            'RTS': { opcode: -7, execute: this.returnFromSubroutine.bind(this) }, // Return from subroutine
            'CALL': { opcode: 60, execute: this.jumpSubroutine.bind(this) },     // Call subroutine (x86-style alias)
            'RET': { opcode: 61, execute: this.returnFromSubroutine.bind(this) }, // Return (x86-style alias)
            
            // Stack and I/O
            'PSH': { opcode: -8, execute: this.pushStack.bind(this) },           // Push to stack
            'POP': { opcode: -9, execute: this.popStack.bind(this) },            // Pop from stack
            'IN':  { opcode: -10, execute: this.inputOperation.bind(this) },     // Input
            'OUT': { opcode: -11, execute: this.outputOperation.bind(this) },    // Output
            
            // Essential new instructions
            'LDX1': { opcode: -12, execute: this.loadIndex1.bind(this) },        // Load to index register 1
            
            // Word operations (12-trit)
            'LDAW': { opcode: 14, execute: this.loadAccumulatorWord.bind(this) }, // Load word to accumulator
            'STAW': { opcode: 15, execute: this.storeAccumulatorWord.bind(this) }, // Store accumulator word
            'ADDW': { opcode: 16, execute: this.addWord.bind(this) },            // Add word
            'SUBW': { opcode: 17, execute: this.subtractWord.bind(this) },       // Subtract word
            'MULW': { opcode: 18, execute: this.multiplyWord.bind(this) },       // Multiply word
            'DIVW': { opcode: 62, execute: this.divideWord.bind(this) },         // Divide word
            'XORW': { opcode: 63, execute: this.xorWord.bind(this) },            // XOR word
            
            // Triple-word operations (18-trit)
            'LDAT': { opcode: 19, execute: this.loadAccumulatorTriple.bind(this) }, // Load triple-word to accumulator
            'STAT': { opcode: 20, execute: this.storeAccumulatorTriple.bind(this) }, // Store accumulator triple-word
            'ADDT': { opcode: 21, execute: this.addTriple.bind(this) },          // Add triple-word
            'SUBT': { opcode: 22, execute: this.subtractTriple.bind(this) },     // Subtract triple-word
            'MULT': { opcode: 23, execute: this.multiplyTriple.bind(this) },     // Multiply triple-word
            'DIVT': { opcode: 64, execute: this.divideTriple.bind(this) },       // Divide triple-word
            'XORT': { opcode: 65, execute: this.xorTriple.bind(this) },          // XOR triple-word
            
            // Memory block operations
            'MOVC': { opcode: 24, execute: this.memoryCopy.bind(this) },         // Memory copy block
            'MOVW': { opcode: 25, execute: this.moveWordBlock.bind(this) },      // Move word block
            'MOVT': { opcode: 26, execute: this.moveTripleBlock.bind(this) },    // Move triple-word block
            'CLRB': { opcode: 27, execute: this.clearBlock.bind(this) },         // Clear block
            
            // Floating-point operations
            'FLDA': { opcode: 28, execute: this.floatLoad.bind(this) },          // Load float to FPU
            'FSTA': { opcode: 29, execute: this.floatStore.bind(this) },         // Store float from FPU
            'FADD': { opcode: 30, execute: this.floatAdd.bind(this) },           // Float add
            'FSUB': { opcode: 31, execute: this.floatSubtract.bind(this) },      // Float subtract
            'FMUL': { opcode: 32, execute: this.floatMultiply.bind(this) },      // Float multiply
            'FDIV': { opcode: 33, execute: this.floatDivide.bind(this) },        // Float divide
            'FCMP': { opcode: 34, execute: this.floatCompare.bind(this) },       // Float compare
            'FMOD': { opcode: 35, execute: this.floatMode.bind(this) },          // Set FPU mode (ternary/binary)
            
            // Enhanced interrupt operations
            'SEI': { opcode: 36, execute: this.setInterruptFlag.bind(this) },    // Set interrupt flag (enable)
            'CLI': { opcode: 37, execute: this.clearInterruptFlag.bind(this) },  // Clear interrupt flag (disable)
            'RTI': { opcode: 38, execute: this.returnFromInterrupt.bind(this) }, // Return from interrupt
            'SWI': { opcode: 39, execute: this.softwareInterrupt.bind(this) },   // Software interrupt
            'MSK': { opcode: 40, execute: this.maskInterrupt.bind(this) },       // Mask interrupt
            'UMK': { opcode: 41, execute: this.unmaskInterrupt.bind(this) },     // Unmask interrupt
            'SML': { opcode: 42, execute: this.setMaskLevel.bind(this) },        // Set mask level
            
            // Memory Management Unit operations
            'MPG': { opcode: 43, execute: this.enablePaging.bind(this) },        // Enable/disable paging
            'MPT': { opcode: 44, execute: this.setProtectionLevel.bind(this) },  // Set protection level
            'MAP': { opcode: 45, execute: this.mapPage.bind(this) },             // Map virtual page
            'UMP': { opcode: 46, execute: this.unmapPage.bind(this) },           // Unmap virtual page
            'FLT': { opcode: 47, execute: this.flushTLB.bind(this) },            // Flush TLB
            'LVA': { opcode: 48, execute: this.loadVirtualAddress.bind(this) },  // Load from virtual address
            'SVA': { opcode: 49, execute: this.storeVirtualAddress.bind(this) }, // Store to virtual address
            
            // Binary arithmetic and logic operations
            'BADD': { opcode: 66, execute: this.binaryAdd.bind(this) },          // Binary add
            'BSUB': { opcode: 67, execute: this.binarySubtract.bind(this) },     // Binary subtract
            'BMUL': { opcode: 68, execute: this.binaryMultiply.bind(this) },     // Binary multiply
            'BDIV': { opcode: 69, execute: this.binaryDivide.bind(this) },       // Binary divide
            'BAND': { opcode: 70, execute: this.binaryAnd.bind(this) },          // Binary AND
            'BOR': { opcode: 71, execute: this.binaryOr.bind(this) },            // Binary OR
            'BXOR': { opcode: 72, execute: this.binaryXor.bind(this) },          // Binary XOR
            'BNOT': { opcode: 73, execute: this.binaryNot.bind(this) },          // Binary NOT
            
            // Conversion operations (machine-level component-based)
            'T2B': { opcode: 74, execute: this.ternaryToBinary.bind(this) },     // Ternary to binary conversion
            'B2T': { opcode: 75, execute: this.binaryToTernary.bind(this) },     // Binary to ternary conversion
            
            'NOP': { opcode: 0,  execute: this.noOperation.bind(this) },         // No operation
            'HLT': { opcode: -13, execute: this.halt.bind(this) }                // Halt
        };
    }

    // Instruction implementations
    loadAccumulator(operand) {
        // For immediate addressing, use the operand directly
        // For direct addressing, read from memory
        if (typeof operand === 'number') {
            // Immediate value
            this.registers.set('acc', new Tryte(operand));
        } else {
            // Memory address
            const value = this.memory.read(operand);
            this.registers.set('acc', value);
        }
    }

    storeAccumulator(operand) {
        if (typeof operand === 'number') {
            // Store at the address specified by operand
            this.memory.write(new TernaryAddress(operand, 9), this.registers.get('acc'));
        } else {
            this.memory.write(operand, this.registers.get('acc'));
        }
    }

    loadIndex(operand) {
        if (typeof operand === 'number') {
            this.registers.set('ix', new Tryte(operand));
        } else {
            const value = this.memory.read(operand);
            this.registers.set('ix', value);
        }
    }

    storeIndex(operand) {
        if (typeof operand === 'number') {
            this.memory.write(new TernaryAddress(operand, 9), this.registers.get('ix'));
        } else {
            this.memory.write(operand, this.registers.get('ix'));
        }
    }

    moveData(operand) {
        // Move from one register to another (operand encodes source/dest)
        // Implementation depends on operand format
    }

    addToAccumulator(operand) {
        if (typeof operand === 'number') {
            // Immediate value
            const value = new Tryte(operand);
            const result = this.alu.add(this.registers.get('acc'), value);
            this.registers.set('acc', result);
        } else {
            const value = this.memory.read(operand);
            const result = this.alu.add(this.registers.get('acc'), value);
            this.registers.set('acc', result);
        }
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    subtractFromAccumulator(operand) {
        if (typeof operand === 'number') {
            const value = new Tryte(operand);
            const result = this.alu.subtract(this.registers.get('acc'), value);
            this.registers.set('acc', result);
        } else {
            const value = this.memory.read(operand);
            const result = this.alu.subtract(this.registers.get('acc'), value);
            this.registers.set('acc', result);
        }
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    multiplyAccumulator(operand) {
        if (typeof operand === 'number') {
            const value = new Tryte(operand);
            const result = this.alu.multiply(this.registers.get('acc'), value);
            this.registers.set('acc', result);
        } else {
            const value = this.memory.read(operand);
            const result = this.alu.multiply(this.registers.get('acc'), value);
            this.registers.set('acc', result);
        }
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    incrementRegister(operand) {
        // Increment register specified by operand
        const acc = this.registers.get('acc');
        const result = this.alu.increment(acc);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    decrementRegister(operand) {
        const acc = this.registers.get('acc');
        const result = this.alu.decrement(acc);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    divideAccumulator(operand) {
        let divisor;
        if (typeof operand === 'number') {
            divisor = new Tryte(operand);
        } else {
            divisor = this.memory.read(operand);
        }
        
        // Check for division by zero
        if (divisor.toDecimal() === 0) {
            // Trigger division by zero interrupt (interrupt vector 2)
            this.interruptController.triggerInterrupt(2);
            return;
        }
        
        const result = this.alu.divide(this.registers.get('acc'), divisor);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    moduloAccumulator(operand) {
        let divisor;
        if (typeof operand === 'number') {
            divisor = new Tryte(operand);
        } else {
            divisor = this.memory.read(operand);
        }
        
        // Check for division by zero
        if (divisor.toDecimal() === 0) {
            // Trigger division by zero interrupt (interrupt vector 2)
            this.interruptController.triggerInterrupt(2);
            return;
        }
        
        const result = this.alu.modulo(this.registers.get('acc'), divisor);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    logicalAnd(operand) {
        const value = this.memory.read(operand);
        const result = this.alu.and(this.registers.get('acc'), value);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    logicalOr(operand) {
        const value = this.memory.read(operand);
        const result = this.alu.or(this.registers.get('acc'), value);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    logicalNot(operand) {
        const result = this.alu.not(this.registers.get('acc'));
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    logicalXor(operand) {
        let value;
        if (typeof operand === 'number') {
            value = new Tryte(operand);
        } else {
            value = this.memory.read(operand);
        }
        const result = this.alu.xor(this.registers.get('acc'), value);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    rotateLeft(operand) {
        const positions = operand ? (typeof operand === 'number' ? operand : operand.toDecimal()) : 1;
        const result = this.alu.rotateLeft(this.registers.get('acc'), positions);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    rotateRight(operand) {
        const positions = operand ? (typeof operand === 'number' ? operand : operand.toDecimal()) : 1;
        const result = this.alu.rotateRight(this.registers.get('acc'), positions);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    shiftLeft(operand) {
        const positions = operand ? operand.toDecimal() : 1;
        const result = this.alu.shiftLeft(this.registers.get('acc'), positions);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    shiftRight(operand) {
        const positions = operand ? operand.toDecimal() : 1;
        const result = this.alu.shiftRight(this.registers.get('acc'), positions);
        this.registers.set('acc', result);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    compare(operand) {
        const value = this.memory.read(operand);
        this.alu.compare(this.registers.get('acc'), value);
        this.registers.set('flags', this.alu.getFlagsAsTrits());
    }

    jump(operand) {
        this.registers.set('pc', operand);
    }

    jumpIfZero(operand) {
        if (this.alu.isZero()) {
            this.registers.set('pc', operand);
        }
    }

    jumpIfPositive(operand) {
        if (this.alu.isPositive()) {
            this.registers.set('pc', operand);
        }
    }

    jumpIfNegative(operand) {
        if (this.alu.isNegative()) {
            this.registers.set('pc', operand);
        }
    }

    jumpIfNotZero(operand) {
        if (!this.alu.isZero()) {
            this.registers.set('pc', operand);
        }
    }

    jumpIfCarry(operand) {
        if (this.alu.hasCarry()) {
            this.registers.set('pc', operand);
        }
    }

    jumpIfNotCarry(operand) {
        if (!this.alu.hasCarry()) {
            this.registers.set('pc', operand);
        }
    }

    jumpSubroutine(operand) {
        // Push current PC to stack
        this.pushToStack(this.registers.get('pc'));
        this.registers.set('pc', operand);
    }

    returnFromSubroutine(operand) {
        // Pop PC from stack
        const returnAddr = this.popFromStack();
        this.registers.set('pc', returnAddr);
    }

    pushStack(operand) {
        const value = this.memory.read(operand);
        this.pushToStack(value);
    }

    popStack(operand) {
        const value = this.popFromStack();
        this.memory.write(operand, value);
    }

    pushToStack(value) {
        const sp = this.registers.get('sp');
        this.memory.write(sp, value);
        this.registers.set('sp', sp.increment());
    }

    popFromStack() {
        const sp = this.registers.get('sp').decrement();
        this.registers.set('sp', sp);
        return this.memory.read(sp);
    }

    inputOperation(operand) {
        // Read from I/O port (implementation depends on I/O system)
        this.registers.set('acc', new Tryte(0));
    }

    outputOperation(operand) {
        // Write to I/O port
        const value = this.registers.get('acc');
        // Send to console or graphics display
        console.log(`Output: ${value.toString()} (${value.toDecimal()})`);
    }

    halt(operand) {
        this.halted = true;
        this.running = false;
    }

    noOperation(operand) {
        // Do nothing
    }

    // New timer/clock instructions
    clockRead(operand) {
        // Read current clock phase/count into accumulator
        const clockValue = this.clockManager.getTernaryClock().getPhase();
        this.registers.set('acc', new Tryte(clockValue));
    }

    clockSet(operand) {
        // Set timer delay from operand
        const delay = operand ? operand : this.registers.get('acc').toDecimal();
        if (this.microcodeEngine) {
            this.microcodeEngine.timerValue = delay;
            this.microcodeEngine.timerActive = true;
            
            // Set timeout for timer completion
            setTimeout(() => {
                if (this.microcodeEngine) {
                    this.microcodeEngine.timerActive = false;
                }
            }, delay * 10); // delay * 10ms for timing
        }
    }

    waitTimer(operand) {
        // Wait for timer to complete (non-blocking check)
        if (this.microcodeEngine) {
            const timerComplete = !this.microcodeEngine.timerActive;
            // Set zero flag based on timer status
            if (timerComplete) {
                this.alu.lastResult = new Tryte(0); // Set zero result
                this.alu.updateFlags(this.alu.lastResult);
            } else {
                this.alu.lastResult = new Tryte(1); // Set non-zero result
                this.alu.updateFlags(this.alu.lastResult);
            }
            this.registers.set('flags', this.alu.getFlagsAsTrits());
        }
    }

    // Edge detection instructions
    ternaryEdgeDetect(operand) {
        // Read ternary clock edge status into accumulator
        // operand: 0=rising, 1=falling, 2=positive, 3=negative, 4=pos_falling, 5=neg_falling, 6=neg_rising
        const ternaryClock = this.clockManager.getTernaryClock();
        let edgeStatus = 0;
        
        switch (operand) {
            case 0: edgeStatus = ternaryClock.isRisingEdge() ? 1 : 0; break;
            case 1: edgeStatus = ternaryClock.isFallingEdge() ? 1 : 0; break;
            case 2: edgeStatus = ternaryClock.isPositiveEdge() ? 1 : 0; break;
            case 3: edgeStatus = ternaryClock.isNegativeEdge() ? 1 : 0; break;
            case 4: edgeStatus = ternaryClock.isPositiveFallingEdge() ? 1 : 0; break;
            case 5: edgeStatus = ternaryClock.isNegativeFallingEdge() ? 1 : 0; break;
            case 6: edgeStatus = ternaryClock.isNegativeRisingEdge() ? 1 : 0; break;
            default: edgeStatus = 0;
        }
        
        this.registers.set('acc', new Tryte(edgeStatus));
    }

    binaryEdgeDetect(operand) {
        // Read binary clock edge status into accumulator
        // operand: 0=rising, 1=falling
        const binaryClock = this.clockManager.getBinaryClock();
        let edgeStatus = 0;
        
        switch (operand) {
            case 0: edgeStatus = binaryClock.isRisingEdge() ? 1 : 0; break;
            case 1: edgeStatus = binaryClock.isFallingEdge() ? 1 : 0; break;
            default: edgeStatus = 0;
        }
        
        this.registers.set('acc', new Tryte(edgeStatus));
    }

    // Hardware timer management instructions
    timerCreate(operand) {
        // Create hardware timer: operand 0=binary, 1=ternary
        try {
            const clockType = operand === 1 ? 'ternary' : 'binary';
            const frequency = this.registers.get('acc').toDecimal(); // Get frequency from accumulator
            const timerId = this.clockManager.createTimer(clockType, frequency);
            this.registers.set('acc', new Tryte(timerId));
        } catch (error) {
            // Set accumulator to -1 on error
            this.registers.set('acc', new Tryte(-1));
        }
    }

    timerDelete(operand) {
        // Delete hardware timer: operand = timer ID or from accumulator if operand not specified
        const timerId = operand !== undefined ? operand : this.registers.get('acc').toDecimal();
        const success = this.clockManager.removeTimer(timerId);
        this.registers.set('acc', new Tryte(success ? 1 : 0));
    }

    timerSet(operand) {
        // Set timer preset value: timer ID from operand, preset from accumulator
        const timerId = operand;
        const preset = this.registers.get('acc').toDecimal();
        const timer = this.clockManager.getTimer(timerId);
        
        if (timer) {
            timer.setPreset(preset);
            this.registers.set('acc', new Tryte(1)); // Success
        } else {
            this.registers.set('acc', new Tryte(0)); // Failure
        }
    }

    timerStart(operand) {
        // Start hardware timer: timer ID from operand
        const timerId = operand;
        const timer = this.clockManager.getTimer(timerId);
        
        if (timer) {
            timer.start();
            this.registers.set('acc', new Tryte(1)); // Success
        } else {
            this.registers.set('acc', new Tryte(0)); // Failure
        }
    }

    timerStop(operand) {
        // Stop hardware timer: timer ID from operand
        const timerId = operand;
        const timer = this.clockManager.getTimer(timerId);
        
        if (timer) {
            timer.stop();
            this.registers.set('acc', new Tryte(1)); // Success
        } else {
            this.registers.set('acc', new Tryte(0)); // Failure
        }
    }

    timerStatus(operand) {
        // Get timer status: timer ID from operand, returns counter value in accumulator
        const timerId = operand;
        const timer = this.clockManager.getTimer(timerId);
        
        if (timer) {
            const counter = timer.getCounter();
            this.registers.set('acc', new Tryte(counter));
            
            // Set flags based on timer state
            if (timer.hasOverflow()) {
                this.alu.lastResult = new Tryte(0); // Zero flag for overflow
            } else if (timer.isRunning()) {
                this.alu.lastResult = new Tryte(1); // Positive flag for running
            } else {
                this.alu.lastResult = new Tryte(-1); // Negative flag for stopped
            }
            this.alu.updateFlags(this.alu.lastResult);
            this.registers.set('flags', this.alu.getFlagsAsTrits());
        } else {
            this.registers.set('acc', new Tryte(-1)); // Error value
        }
    }

    // Interrupt system methods
    setInterruptFlag(operand) {
        // Enable interrupts
        this.interruptController.enableInterrupts();
        this.registers.set('acc', new Tryte(1)); // Success
    }

    clearInterruptFlag(operand) {
        // Disable interrupts
        this.interruptController.disableInterrupts();
        this.registers.set('acc', new Tryte(1)); // Success
    }

    returnFromInterrupt(operand) {
        // Return from interrupt handler
        try {
            this.interruptController.returnFromInterrupt();
            this.registers.set('acc', new Tryte(1)); // Success
        } catch (error) {
            this.registers.set('acc', new Tryte(0)); // Failure
        }
    }

    softwareInterrupt(operand) {
        // Trigger software interrupt with number from operand
        const interruptNumber = operand || this.registers.get('acc').toDecimal();
        this.interruptController.requestInterrupt(interruptNumber);
    }

    nonMaskableInterrupt(operand) {
        // Trigger non-maskable interrupt
        this.interruptController.requestInterrupt(1); // NMI
    }

    setInterruptVector(operand) {
        // Set interrupt vector: interrupt number from operand, handler address from accumulator
        const interruptNumber = operand;
        const handlerAddress = this.registers.get('acc').toDecimal();
        this.interruptVectorTable.setVector(interruptNumber, handlerAddress);
        this.registers.set('acc', new Tryte(1)); // Success
    }

    getInterruptVector(operand) {
        // Get interrupt vector: interrupt number from operand, returns handler address in accumulator
        const interruptNumber = operand;
        const handlerAddress = this.interruptVectorTable.getVector(interruptNumber);
        this.registers.set('acc', new Tryte(handlerAddress.toDecimal()));
    }

    // Additional index register operations
    loadIndex1(operand) {
        if (typeof operand === 'number') {
            this.registers.set('ix1', new Tryte(operand));
        } else {
            const value = this.memory.read(operand);
            this.registers.set('ix1', value);
        }
    }

    loadIndex2(operand) {
        if (typeof operand === 'number') {
            this.registers.set('ix2', new Tryte(operand));
        } else {
            const value = this.memory.read(operand);
            this.registers.set('ix2', value);
        }
    }

    loadIndex3(operand) {
        if (typeof operand === 'number') {
            this.registers.set('ix3', new Tryte(operand));
        } else {
            const value = this.memory.read(operand);
            this.registers.set('ix3', value);
        }
    }

    storeIndex1(operand) {
        if (typeof operand === 'number') {
            this.memory.write(new TernaryAddress(operand, 9), this.registers.get('ix1'));
        } else {
            this.memory.write(operand, this.registers.get('ix1'));
        }
    }

    storeIndex2(operand) {
        if (typeof operand === 'number') {
            this.memory.write(new TernaryAddress(operand, 9), this.registers.get('ix2'));
        } else {
            this.memory.write(operand, this.registers.get('ix2'));
        }
    }

    storeIndex3(operand) {
        if (typeof operand === 'number') {
            this.memory.write(new TernaryAddress(operand, 9), this.registers.get('ix3'));
        } else {
            this.memory.write(operand, this.registers.get('ix3'));
        }
    }

    // Stack operations for interrupt handling
    pushToStack(value) {
        const sp = this.registers.get('sp');
        this.memory.write(sp, new Tryte(value));
        this.registers.set('sp', new TernaryAddress(sp.toDecimal() + 1, 9));
    }

    popFromStack() {
        const sp = this.registers.get('sp');
        const newSp = new TernaryAddress(sp.toDecimal() - 1, 9);
        this.registers.set('sp', newSp);
        return this.memory.read(newSp).toDecimal();
    }

    // Word Operations (12-trit)
    loadAccumulatorWord(operand) {
        if (typeof operand === 'number') {
            this.registers.set('accw', new DoubleWord(operand));
        } else {
            // For memory addressing, we need to read two consecutive trytes
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const high = this.memory.read(addr.increment());
            
            // Combine the trits directly
            const combinedTrits = [];
            
            // Add low trits (0-5)
            combinedTrits.push(...low.trits.slice(0, 6));
            
            // Add high trits (6-11)
            combinedTrits.push(...high.trits.slice(0, 6));
            
            // Create double-word from combined trits
            const word = new DoubleWord();
            word.trits = combinedTrits;
            word.normalize();
            
            this.registers.set('accw', word);
        }
    }

    storeAccumulatorWord(operand) {
        const wordValue = this.registers.get('accw');
        const addr = new TernaryAddress(operand, 9);
        
        // Convert the double-word to balanced ternary trits and split into chunks
        const trits = wordValue.trits.slice(); // Copy the trits
        
        // Pad to 12 trits if necessary
        while (trits.length < 12) {
            trits.push(0);
        }
        
        // Split into two 6-trit chunks
        const lowTrits = trits.slice(0, 6);
        const highTrits = trits.slice(6, 12);
        
        // Create trytes from the trit chunks
        const low = new Tryte();
        low.trits = lowTrits;
        low.normalize();
        
        const high = new Tryte();
        high.trits = highTrits;
        high.normalize();
        
        this.memory.write(addr, low);
        this.memory.write(addr.increment(), high);
    }

    addWord(operand) {
        const current = this.registers.get('accw');
        if (typeof operand === 'number') {
            const result = current.add(operand);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        } else {
            // Read word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const high = this.memory.read(addr.increment());
            const memValue = (high.toDecimal() * 729) + low.toDecimal();
            
            const result = current.add(memValue);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('accw'));
    }

    subtractWord(operand) {
        const current = this.registers.get('accw');
        if (typeof operand === 'number') {
            const result = current.subtract(operand);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        } else {
            // Read word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const high = this.memory.read(addr.increment());
            const memValue = (high.toDecimal() * 729) + low.toDecimal();
            
            const result = current.subtract(memValue);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('accw'));
    }

    multiplyWord(operand) {
        const current = this.registers.get('accw');
        if (typeof operand === 'number') {
            const result = current.multiply(operand);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        } else {
            // Read word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const high = this.memory.read(addr.increment());
            const memValue = (high.toDecimal() * 729) + low.toDecimal();
            
            const result = current.multiply(memValue);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('accw'));
    }

    // Triple-Word Operations (18-trit)
    loadAccumulatorTriple(operand) {
        if (typeof operand === 'number') {
            this.registers.set('acct', new TripleWord(operand));
        } else {
            // Read three consecutive trytes
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const mid = this.memory.read(addr.increment());
            const high = this.memory.read(addr.increment().increment());
            
            // Combine the trits directly rather than using decimal values
            const combinedTrits = [];
            
            // Add low trits (0-5)
            combinedTrits.push(...low.trits.slice(0, 6));
            
            // Add mid trits (6-11)
            combinedTrits.push(...mid.trits.slice(0, 6));
            
            // Add high trits (12-17)
            combinedTrits.push(...high.trits.slice(0, 6));
            
            // Create triple-word from combined trits
            const triple = new TripleWord();
            triple.trits = combinedTrits;
            triple.normalize();
            
            this.registers.set('acct', triple);
        }
    }

    storeAccumulatorTriple(operand) {
        const tripleValue = this.registers.get('acct');
        const addr = new TernaryAddress(operand, 9);
        
        // Convert the triple-word to balanced ternary trits and split into chunks
        const trits = tripleValue.trits.slice(); // Copy the trits
        
        // Pad to 18 trits if necessary
        while (trits.length < 18) {
            trits.push(0);
        }
        
        // Split into three 6-trit chunks
        const lowTrits = trits.slice(0, 6);
        const midTrits = trits.slice(6, 12);
        const highTrits = trits.slice(12, 18);
        
        // Create trytes from the trit chunks
        const low = new Tryte();
        low.trits = lowTrits;
        low.normalize();
        
        const mid = new Tryte();
        mid.trits = midTrits;
        mid.normalize();
        
        const high = new Tryte();
        high.trits = highTrits;
        high.normalize();
        
        this.memory.write(addr, low);
        this.memory.write(addr.increment(), mid);
        this.memory.write(addr.increment().increment(), high);
    }

    addTriple(operand) {
        const current = this.registers.get('acct');
        if (typeof operand === 'number') {
            const result = current.add(operand);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        } else {
            // Read triple-word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const mid = this.memory.read(addr.increment());
            const high = this.memory.read(addr.increment().increment());
            
            let memValue = low.toDecimal();
            memValue += mid.toDecimal() * 729;
            memValue += high.toDecimal() * 729 * 729;
            
            const result = current.add(memValue);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('acct'));
    }

    subtractTriple(operand) {
        const current = this.registers.get('acct');
        if (typeof operand === 'number') {
            const result = current.subtract(operand);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        } else {
            // Read triple-word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const mid = this.memory.read(addr.increment());
            const high = this.memory.read(addr.increment().increment());
            
            let memValue = low.toDecimal();
            memValue += mid.toDecimal() * 729;
            memValue += high.toDecimal() * 729 * 729;
            
            const result = current.subtract(memValue);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('acct'));
    }

    multiplyTriple(operand) {
        const current = this.registers.get('acct');
        if (typeof operand === 'number') {
            const result = current.multiply(operand);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        } else {
            // Read triple-word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const mid = this.memory.read(addr.increment());
            const high = this.memory.read(addr.increment().increment());
            
            let memValue = low.toDecimal();
            memValue += mid.toDecimal() * 729;
            memValue += high.toDecimal() * 729 * 729;
            
            const result = current.multiply(memValue);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('acct'));
    }

    // Missing word operations
    divideWord(operand) {
        const current = this.registers.get('accw');
        if (typeof operand === 'number') {
            // Check for division by zero
            if (operand === 0) {
                this.interruptController.triggerInterrupt(2);
                return;
            }
            const result = current.divide(operand);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        } else {
            // Read word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const high = this.memory.read(addr.increment());
            
            let memValue = low.toDecimal() + (high.toDecimal() * 729);
            
            if (memValue === 0) {
                this.interruptController.triggerInterrupt(2);
                return;
            }
            
            const result = current.divide(memValue);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('accw'));
    }

    xorWord(operand) {
        const current = this.registers.get('accw');
        if (typeof operand === 'number') {
            const result = current.xor(operand);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        } else {
            // Read word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const high = this.memory.read(addr.increment());
            
            let memValue = low.toDecimal() + (high.toDecimal() * 729);
            
            const result = current.xor(memValue);
            this.registers.set('accw', new DoubleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('accw'));
    }

    // Missing triple operations
    divideTriple(operand) {
        const current = this.registers.get('acct');
        if (typeof operand === 'number') {
            // Check for division by zero
            if (operand === 0) {
                this.interruptController.triggerInterrupt(2);
                return;
            }
            const result = current.divide(operand);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        } else {
            // Read triple-word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const mid = this.memory.read(addr.increment());
            const high = this.memory.read(addr.increment().increment());
            
            let memValue = low.toDecimal();
            memValue += mid.toDecimal() * 729;
            memValue += high.toDecimal() * 729 * 729;
            
            if (memValue === 0) {
                this.interruptController.triggerInterrupt(2);
                return;
            }
            
            const result = current.divide(memValue);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('acct'));
    }

    xorTriple(operand) {
        const current = this.registers.get('acct');
        if (typeof operand === 'number') {
            const result = current.xor(operand);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        } else {
            // Read triple-word from memory
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const mid = this.memory.read(addr.increment());
            const high = this.memory.read(addr.increment().increment());
            
            let memValue = low.toDecimal();
            memValue += mid.toDecimal() * 729;
            memValue += high.toDecimal() * 729 * 729;
            
            const result = current.xor(memValue);
            this.registers.set('acct', new TripleWord(result.toDecimal()));
        }
        this.alu.updateFlags(this.registers.get('acct'));
    }

    // Memory Block Operations
    memoryCopy(operand) {
        // Format: source_addr,dest_addr,count (operand encodes parameters)
        // For simplicity, use IX register for source, IX1 for dest, ACC for count
        const sourceAddr = this.registers.get('ix').toDecimal();
        const destAddr = this.registers.get('ix1').toDecimal();
        const count = this.registers.get('acc').toDecimal();
        
        for (let i = 0; i < count; i++) {
            const src = new TernaryAddress(sourceAddr + i, 9);
            const dst = new TernaryAddress(destAddr + i, 9);
            const value = this.memory.read(src);
            this.memory.write(dst, value);
        }
    }

    moveWordBlock(operand) {
        // Move words (2 trytes each)
        const sourceAddr = this.registers.get('ix').toDecimal();
        const destAddr = this.registers.get('ix1').toDecimal();
        const wordCount = this.registers.get('acc').toDecimal();
        
        for (let i = 0; i < wordCount; i++) {
            const srcBase = sourceAddr + (i * 2);
            const dstBase = destAddr + (i * 2);
            
            // Copy two trytes for each word
            for (let j = 0; j < 2; j++) {
                const src = new TernaryAddress(srcBase + j, 9);
                const dst = new TernaryAddress(dstBase + j, 9);
                const value = this.memory.read(src);
                this.memory.write(dst, value);
            }
        }
    }

    moveTripleBlock(operand) {
        // Move triple-words (3 trytes each)
        const sourceAddr = this.registers.get('ix').toDecimal();
        const destAddr = this.registers.get('ix1').toDecimal();
        const tripleCount = this.registers.get('acc').toDecimal();
        
        for (let i = 0; i < tripleCount; i++) {
            const srcBase = sourceAddr + (i * 3);
            const dstBase = destAddr + (i * 3);
            
            // Copy three trytes for each triple-word
            for (let j = 0; j < 3; j++) {
                const src = new TernaryAddress(srcBase + j, 9);
                const dst = new TernaryAddress(dstBase + j, 9);
                const value = this.memory.read(src);
                this.memory.write(dst, value);
            }
        }
    }

    clearBlock(operand) {
        // Clear memory block starting at address in IX, count in ACC
        const startAddr = this.registers.get('ix').toDecimal();
        const count = this.registers.get('acc').toDecimal();
        
        for (let i = 0; i < count; i++) {
            const addr = new TernaryAddress(startAddr + i, 9);
            this.memory.write(addr, new Tryte(0));
        }
    }

    // Floating-Point Operations
    floatLoad(operand) {
        // Load value into FPU accumulator (FACC)
        if (typeof operand === 'number') {
            this.fpu.load('FACC', operand);
        } else {
            // Load from memory - assume standard 12-trit float format
            const addr = new TernaryAddress(operand, 9);
            const low = this.memory.read(addr);
            const high = this.memory.read(addr.increment());
            
            // Combine two trytes into float representation
            const combinedTrits = [];
            combinedTrits.push(...low.trits.slice(0, 6));
            combinedTrits.push(...high.trits.slice(0, 6));
            
            // Create TernaryFloat from trits
            const float = new TernaryFloat(0, 'standard');
            float.sign = combinedTrits[0] || 0;
            
            // Extract exponent (3 trits)
            const expTrits = combinedTrits.slice(1, 4);
            const expBT = new BalancedTernary();
            expBT.trits = expTrits;
            float.exponent = expBT.toDecimal() + float.exponentBias;
            
            // Extract mantissa (8 trits)
            const mantTrits = combinedTrits.slice(4, 12);
            const mantBT = new BalancedTernary();
            mantBT.trits = mantTrits;
            float.mantissa = mantBT.toDecimal();
            
            this.fpu.ternaryRegisters.FACC = float;
        }
    }

    floatStore(operand) {
        // Store FPU accumulator to memory
        const float = this.fpu.ternaryRegisters.FACC;
        const addr = new TernaryAddress(operand, 9);
        
        // Convert float to two trytes
        const bt = float.toBalancedTernary();
        const trits = bt.trits.slice();
        
        // Pad to 12 trits
        while (trits.length < 12) {
            trits.push(0);
        }
        
        // Split into two 6-trit chunks
        const lowTrits = trits.slice(0, 6);
        const highTrits = trits.slice(6, 12);
        
        const low = new Tryte();
        low.trits = lowTrits;
        low.normalize();
        
        const high = new Tryte();
        high.trits = highTrits;
        high.normalize();
        
        this.memory.write(addr, low);
        this.memory.write(addr.increment(), high);
    }

    floatAdd(operand) {
        // Add to FPU accumulator
        if (typeof operand === 'number') {
            const operandFloat = new TernaryFloat(operand, 'standard');
            this.fpu.ternaryRegisters.FACC = this.fpu.ternaryRegisters.FACC.add(operandFloat);
        } else {
            // Load float from memory and add
            this.floatLoad(operand); // This loads into FACC temporarily
            const temp = this.fpu.ternaryRegisters.FACC;
            this.fpu.load('FACC', this.fpu.ternaryRegisters.FACC.toDecimal()); // Restore original
            this.fpu.ternaryRegisters.FACC = this.fpu.ternaryRegisters.FACC.add(temp);
        }
        this.fpu.updateFlags();
    }

    floatSubtract(operand) {
        // Subtract from FPU accumulator
        if (typeof operand === 'number') {
            const operandFloat = new TernaryFloat(operand, 'standard');
            this.fpu.ternaryRegisters.FACC = this.fpu.ternaryRegisters.FACC.subtract(operandFloat);
        } else {
            // Similar to floatAdd but subtract
            this.floatLoad(operand);
            const temp = this.fpu.ternaryRegisters.FACC;
            this.fpu.load('FACC', this.fpu.ternaryRegisters.FACC.toDecimal());
            this.fpu.ternaryRegisters.FACC = this.fpu.ternaryRegisters.FACC.subtract(temp);
        }
        this.fpu.updateFlags();
    }

    floatMultiply(operand) {
        // Multiply FPU accumulator
        if (typeof operand === 'number') {
            const operandFloat = new TernaryFloat(operand, 'standard');
            this.fpu.ternaryRegisters.FACC = this.fpu.ternaryRegisters.FACC.multiply(operandFloat);
        } else {
            this.floatLoad(operand);
            const temp = this.fpu.ternaryRegisters.FACC;
            this.fpu.load('FACC', this.fpu.ternaryRegisters.FACC.toDecimal());
            this.fpu.ternaryRegisters.FACC = this.fpu.ternaryRegisters.FACC.multiply(temp);
        }
        this.fpu.updateFlags();
    }

    floatDivide(operand) {
        // Divide FPU accumulator
        try {
            if (typeof operand === 'number') {
                const operandFloat = new TernaryFloat(operand, 'standard');
                this.fpu.ternaryRegisters.FACC = this.fpu.ternaryRegisters.FACC.divide(operandFloat);
            } else {
                this.floatLoad(operand);
                const temp = this.fpu.ternaryRegisters.FACC;
                this.fpu.load('FACC', this.fpu.ternaryRegisters.FACC.toDecimal());
                this.fpu.ternaryRegisters.FACC = this.fpu.ternaryRegisters.FACC.divide(temp);
            }
        } catch (error) {
            this.fpu.flags.invalid = 1;
        }
        this.fpu.updateFlags();
    }

    floatCompare(operand) {
        // Compare FPU accumulator with operand
        let comparison;
        if (typeof operand === 'number') {
            const operandFloat = new TernaryFloat(operand, 'standard');
            comparison = this.fpu.ternaryRegisters.FACC.compare(operandFloat);
        } else {
            // Load from memory and compare
            const currentValue = this.fpu.ternaryRegisters.FACC.toDecimal();
            this.floatLoad(operand);
            const operandFloat = this.fpu.ternaryRegisters.FACC;
            this.fpu.load('FACC', currentValue); // Restore original
            comparison = this.fpu.ternaryRegisters.FACC.compare(operandFloat);
        }
        
        // Set CPU flags based on comparison
        this.alu.flags.zero = comparison === 0 ? 1 : 0;
        this.alu.flags.positive = comparison > 0 ? 1 : 0;
        this.alu.flags.negative = comparison < 0 ? 1 : 0;
    }

    floatMode(operand) {
        // Switch FPU mode between ternary (0) and binary (1)
        this.fpu.setMode(operand === 0 ? 'ternary' : 'binary');
    }

    // Enhanced Interrupt Operations
    setInterruptFlag(operand) {
        // Enable interrupts
        this.interruptController.interruptEnabled = true;
    }

    clearInterruptFlag(operand) {
        // Disable interrupts
        this.interruptController.disableInterrupts();
    }

    returnFromInterrupt(operand) {
        // Return from interrupt handler
        this.interruptController.returnFromInterrupt();
    }

    softwareInterrupt(operand) {
        // Trigger software interrupt
        this.interruptController.triggerSoftwareInterrupt(operand);
    }

    maskInterrupt(operand) {
        // Mask specific interrupt number
        this.interruptController.maskInterrupt(operand);
    }

    unmaskInterrupt(operand) {
        // Unmask specific interrupt number
        this.interruptController.unmaskInterrupt(operand);
    }

    setMaskLevel(operand) {
        // Set interrupt mask level
        this.interruptController.setMaskLevel(operand);
    }

    // Memory Management Unit Operations
    enablePaging(operand) {
        // Enable/disable paging (0=disable, 1=enable)
        this.mmu.setPagingEnabled(operand !== 0);
    }

    setProtectionLevel(operand) {
        // Set current protection level (0=kernel, 1=supervisor, 2=user)
        this.mmu.setProtectionLevel(operand);
    }

    mapPage(operand) {
        // Map virtual page: IX = virtual page, IX1 = physical page, ACC = permissions
        const virtualPage = this.registers.get('ix').toDecimal();
        const physicalPage = this.registers.get('ix1').toDecimal();
        const permBits = this.registers.get('acc').toDecimal();
        
        // Convert permission bits to string
        let permissions = '';
        if (permBits & 1) permissions += 'r';
        if (permBits & 2) permissions += 'w'; 
        if (permBits & 4) permissions += 'x';
        
        this.mmu.mapPage(virtualPage, physicalPage, permissions);
    }

    unmapPage(operand) {
        // Unmap virtual page: operand = virtual page number
        this.mmu.unmapPage(operand);
    }

    flushTLB(operand) {
        // Flush Translation Lookaside Buffer
        this.mmu.tlb.clear();
    }

    loadVirtualAddress(operand) {
        // Load from virtual address to accumulator
        try {
            const virtualAddr = typeof operand === 'number' ? operand : this.registers.get('ix').toDecimal();
            const value = this.mmu.readVirtual(virtualAddr);
            this.registers.set('acc', value);
        } catch (error) {
            // MMU exception - trigger interrupt
            this.interruptController.requestInterrupt(7); // Memory protection violation
        }
    }

    storeVirtualAddress(operand) {
        // Store accumulator to virtual address
        try {
            const virtualAddr = typeof operand === 'number' ? operand : this.registers.get('ix').toDecimal();
            const value = this.registers.get('acc');
            this.mmu.writeVirtual(virtualAddr, value);
        } catch (error) {
            // MMU exception - trigger interrupt
            this.interruptController.requestInterrupt(7); // Memory protection violation
        }
    }

    // Binary arithmetic operations (component-based using binary gates)
    binaryAdd(operand) {
        const current = this.registers.get('acc');
        let value;
        
        if (typeof operand === 'number') {
            value = new Tryte(operand);
        } else {
            value = this.memory.read(operand);
        }
        
        // Convert to binary, perform operation, convert back
        const binA = this.ternaryToBinaryComponent(current);
        const binB = this.ternaryToBinaryComponent(value);
        const result = this.binaryAddComponent(binA, binB);
        const ternaryResult = this.binaryToTernaryComponent(result);
        
        this.registers.set('acc', ternaryResult);
        this.alu.updateFlags(ternaryResult);
    }

    binarySubtract(operand) {
        const current = this.registers.get('acc');
        let value;
        
        if (typeof operand === 'number') {
            value = new Tryte(operand);
        } else {
            value = this.memory.read(operand);
        }
        
        const binA = this.ternaryToBinaryComponent(current);
        const binB = this.ternaryToBinaryComponent(value);
        const result = this.binarySubtractComponent(binA, binB);
        const ternaryResult = this.binaryToTernaryComponent(result);
        
        this.registers.set('acc', ternaryResult);
        this.alu.updateFlags(ternaryResult);
    }

    binaryMultiply(operand) {
        const current = this.registers.get('acc');
        let value;
        
        if (typeof operand === 'number') {
            value = new Tryte(operand);
        } else {
            value = this.memory.read(operand);
        }
        
        const binA = this.ternaryToBinaryComponent(current);
        const binB = this.ternaryToBinaryComponent(value);
        const result = this.binaryMultiplyComponent(binA, binB);
        const ternaryResult = this.binaryToTernaryComponent(result);
        
        this.registers.set('acc', ternaryResult);
        this.alu.updateFlags(ternaryResult);
    }

    binaryDivide(operand) {
        const current = this.registers.get('acc');
        let value;
        
        if (typeof operand === 'number') {
            value = new Tryte(operand);
        } else {
            value = this.memory.read(operand);
        }
        
        // Check for division by zero
        if (value.toDecimal() === 0) {
            this.interruptController.triggerInterrupt(2);
            return;
        }
        
        const binA = this.ternaryToBinaryComponent(current);
        const binB = this.ternaryToBinaryComponent(value);
        const result = this.binaryDivideComponent(binA, binB);
        const ternaryResult = this.binaryToTernaryComponent(result);
        
        this.registers.set('acc', ternaryResult);
        this.alu.updateFlags(ternaryResult);
    }

    binaryAnd(operand) {
        const current = this.registers.get('acc');
        let value;
        
        if (typeof operand === 'number') {
            value = new Tryte(operand);
        } else {
            value = this.memory.read(operand);
        }
        
        const binA = this.ternaryToBinaryComponent(current);
        const binB = this.ternaryToBinaryComponent(value);
        const result = this.binaryAndComponent(binA, binB);
        const ternaryResult = this.binaryToTernaryComponent(result);
        
        this.registers.set('acc', ternaryResult);
        this.alu.updateFlags(ternaryResult);
    }

    binaryOr(operand) {
        const current = this.registers.get('acc');
        let value;
        
        if (typeof operand === 'number') {
            value = new Tryte(operand);
        } else {
            value = this.memory.read(operand);
        }
        
        const binA = this.ternaryToBinaryComponent(current);
        const binB = this.ternaryToBinaryComponent(value);
        const result = this.binaryOrComponent(binA, binB);
        const ternaryResult = this.binaryToTernaryComponent(result);
        
        this.registers.set('acc', ternaryResult);
        this.alu.updateFlags(ternaryResult);
    }

    binaryXor(operand) {
        const current = this.registers.get('acc');
        let value;
        
        if (typeof operand === 'number') {
            value = new Tryte(operand);
        } else {
            value = this.memory.read(operand);
        }
        
        const binA = this.ternaryToBinaryComponent(current);
        const binB = this.ternaryToBinaryComponent(value);
        const result = this.binaryXorComponent(binA, binB);
        const ternaryResult = this.binaryToTernaryComponent(result);
        
        this.registers.set('acc', ternaryResult);
        this.alu.updateFlags(ternaryResult);
    }

    binaryNot(operand) {
        const current = this.registers.get('acc');
        
        const binA = this.ternaryToBinaryComponent(current);
        const result = this.binaryNotComponent(binA);
        const ternaryResult = this.binaryToTernaryComponent(result);
        
        this.registers.set('acc', ternaryResult);
        this.alu.updateFlags(ternaryResult);
    }

    // Machine-level conversion operations (component-based)
    ternaryToBinary(operand) {
        const current = this.registers.get('acc');
        const binaryResult = this.ternaryToBinaryComponent(current);
        
        // Store binary representation in accumulator
        this.registers.set('acc', new Tryte(binaryResult));
        this.alu.updateFlags(this.registers.get('acc'));
    }

    binaryToTernary(operand) {
        const current = this.registers.get('acc');
        const ternaryResult = this.binaryToTernaryComponent(current);
        
        this.registers.set('acc', ternaryResult);
        this.alu.updateFlags(ternaryResult);
    }

    // Component-based conversion helpers using electronic gates
    ternaryToBinaryComponent(ternaryValue) {
        // Use component-based conversion with decoder circuits
        const trits = ternaryValue.trits || ternaryValue.toTernaryArray();
        let binaryResult = 0;
        
        // Use ternary decoder components to convert to binary
        for (let i = 0; i < trits.length; i++) {
            const trit = trits[i];
            // Ternary decoder: -1 maps to 0, 0 maps to 1, +1 maps to 2 in 2-bit binary
            let binaryBits = 0;
            
            if (trit === -1) binaryBits = 0;      // 00
            else if (trit === 0) binaryBits = 1;  // 01  
            else if (trit === 1) binaryBits = 2;  // 10
            
            binaryResult += binaryBits * Math.pow(4, i); // 4^i because each trit becomes 2 bits
        }
        
        return binaryResult;
    }

    binaryToTernaryComponent(binaryValue) {
        // Use component-based conversion with encoder circuits
        const value = typeof binaryValue === 'number' ? binaryValue : binaryValue.toDecimal();
        const trits = [];
        let remaining = Math.abs(value);
        
        // Binary to ternary encoder using component logic
        while (remaining > 0 || trits.length === 0) {
            const twobit = remaining % 4;
            remaining = Math.floor(remaining / 4);
            
            // Binary encoder: 00->-1, 01->0, 10->+1, 11->invalid(use +1)
            let trit = 0;
            if (twobit === 0) trit = -1;
            else if (twobit === 1) trit = 0;
            else if (twobit === 2) trit = 1;
            else trit = 1; // Handle invalid case
            
            trits.push(trit);
            
            if (trits.length >= 6) break; // Limit to tryte size
        }
        
        // Apply sign
        if (value < 0) {
            for (let i = 0; i < trits.length; i++) {
                trits[i] = -trits[i];
            }
        }
        
        return new Tryte(trits);
    }

    // Binary operation components using electronic gates
    binaryAddComponent(a, b) {
        // Component-based binary addition using full adders
        return a + b; // Simplified for now - real implementation would use gate components
    }

    binarySubtractComponent(a, b) {
        return a - b;
    }

    binaryMultiplyComponent(a, b) {
        return a * b;
    }

    binaryDivideComponent(a, b) {
        return Math.floor(a / b);
    }

    binaryAndComponent(a, b) {
        return a & b;
    }

    binaryOrComponent(a, b) {
        return a | b;
    }

    binaryXorComponent(a, b) {
        return a ^ b;
    }

    binaryNotComponent(a) {
        return ~a & 0xFFFF; // Mask to 16 bits
    }

    // CPU execution control
    step() {
        if (this.halted) return false;

        // Check for pending interrupts before executing next instruction
        if (this.interruptController.checkInterrupts()) {
            // Interrupt was handled, continue execution from interrupt handler
            return true;
        }

        const pc = this.registers.get('pc');
        
        // Check breakpoints
        if (this.breakpoints.has(pc.toString())) {
            this.running = false;
            console.log(`Breakpoint hit at ${pc.toString()}`);
            return false;
        }

        // Check if PC is in ROM range, read from ROM if so
        let instruction;
        if (this.romChip.isInRange(pc)) {
            instruction = this.romChip.read(pc);
        } else {
            instruction = this.memory.read(pc);
        }
        this.currentInstruction = instruction;
        
        // Decode and execute
        const success = this.executeInstruction(instruction);
        
        if (success && !this.halted) {
            // Increment PC (unless instruction modified it)
            this.registers.set('pc', pc.increment());
            this.cycleCount++;
        }

        return success && !this.halted;
    }

    executeInstruction(instruction) {
        try {
            // Simple instruction format: opcode in first 3 trits, operand in remaining 3
            const trits = instruction.trits;
            
            // Ensure we have 6 trits
            while (trits.length < 6) {
                trits.push(0);
            }
            
            const opcodeTrits = [trits[0] || 0, trits[1] || 0, trits[2] || 0];
            const operandTrits = [trits[3] || 0, trits[4] || 0, trits[5] || 0];
            
            const opcode = new BalancedTernary(opcodeTrits).toDecimal();
            const operandValue = new BalancedTernary(operandTrits).toDecimal();

            // Special case for halt instruction
            if (opcode === -13) {
                this.halt();
                return true;
            }

            // Find instruction by opcode
            for (let [mnemonic, instr] of Object.entries(this.instructions)) {
                if (instr.opcode === opcode) {
                    instr.execute(operandValue);
                    return true;
                }
            }

            console.error(`Unknown opcode: ${opcode}`);
            return false;
        } catch (error) {
            console.error(`Execution error: ${error.message}`);
            return false;
        }
    }

    run() {
        this.running = true;
        this.halted = false;
        
        // Start clock manager
        this.clockManager.start();
        
        if (this.usePipeline) {
            // Pipeline execution mode
            this.runPipelined();
        } else if (this.useMicrocode && this.microcodeEngine) {
            // Microcode-driven execution
            this.runMicrocode();
        } else {
            // Legacy execution mode
            this.runLegacy();
        }
    }
    
    runPipelined() {
        // Enable pipeline
        this.pipeline.setEnabled(true);
        
        // Pipeline-driven execution
        const pipelineLoop = () => {
            if (!this.running || this.halted) {
                this.pipeline.setEnabled(false);
                this.clockManager.stop();
                return;
            }
            
            // Tick the pipeline
            this.pipeline.tick();
            this.cycleCount++;
            
            // Continue execution loop
            setTimeout(pipelineLoop, 10); // 100Hz execution speed
        };
        
        pipelineLoop();
    }
    
    runMicrocode() {
        // Clock-driven execution via microcode engine
        this.microcodeEngine.state = 'FETCH';
        
        // The microcode engine handles execution through clock callbacks
        // We just need to handle the main fetch-decode-execute cycle
        const fetchDecodeExecute = () => {
            if (!this.running || this.halted) {
                this.clockManager.stop();
                return;
            }
            
            // Check if we need to start a new instruction
            if (this.microcodeEngine.state === 'FETCH' && this.microcodeEngine.isComplete()) {
                const pc = this.registers.get('pc');
                
                // Check breakpoints
                if (this.breakpoints.has(pc.toString())) {
                    this.running = false;
                    console.log(`Breakpoint hit at ${pc.toString()}`);
                    this.clockManager.stop();
                    return;
                }
                
                // Fetch instruction
                const instruction = this.memory.read(pc);
                this.currentInstruction = instruction;
                
                // Start microcode execution
                this.microcodeEngine.startInstruction(instruction);
            }
            
            // Continue execution loop
            setTimeout(fetchDecodeExecute, 1); // Check frequently for new instructions
        };
        
        fetchDecodeExecute();
    }
    
    runLegacy() {
        // Original execution mode for compatibility
        const runLoop = () => {
            if (this.running && this.step()) {
                setTimeout(runLoop, 10); // 100Hz execution speed
            } else {
                this.clockManager.stop();
            }
        };
        
        runLoop();
    }

    pause() {
        this.running = false;
        this.clockManager.stop();
    }

    reset() {
        this.registers.reset();
        this.alu = new TernaryALU();
        this.halted = false;
        this.running = false;
        this.cycleCount = 0;
        this.currentInstruction = null;
        
        // Reset pipeline system
        this.pipeline.reset();
        
        // Reset FPU
        this.fpu.reset();
        
        // Reset MMU
        this.mmu.reset();
        
        // Reset interrupt system
        this.interruptController.reset();
        this.interruptVectorTable.reset();
        this.systemClock = 0;
        
        // Reset clock and microcode systems
        this.clockManager.reset();
        if (this.microcodeEngine) {
            this.microcodeEngine.reset();
        }
    }

    // Debugging support
    setBreakpoint(address) {
        const addr = new TernaryAddress(address, 9);
        this.breakpoints.add(addr.toString());
    }

    clearBreakpoint(address) {
        const addr = new TernaryAddress(address, 9);
        this.breakpoints.delete(addr.toString());
    }

    clearAllBreakpoints() {
        this.breakpoints.clear();
    }

    getState() {
        const baseState = {
            registers: this.registers.getState(),
            alu: {
                lastOperation: this.alu.lastOperation,
                lastResult: this.alu.lastResult ? this.alu.lastResult.toString() : null,
                flags: this.alu.flags
            },
            execution: {
                halted: this.halted,
                running: this.running,
                cycleCount: this.cycleCount,
                currentInstruction: this.currentInstruction ? this.currentInstruction.toString() : null,
                useMicrocode: this.useMicrocode,
                usePipeline: this.usePipeline
            }
        };
        
        // Add clock manager status
        if (this.clockManager) {
            baseState.clockStatus = this.clockManager.getStatus();
        }
        
        // Add microcode engine status
        if (this.microcodeEngine) {
            baseState.microcodeStatus = this.microcodeEngine.getState();
        }
        
        // Add pipeline status
        if (this.pipeline) {
            baseState.pipelineStatus = this.pipeline.getState();
        }
        
        // Add FPU status
        if (this.fpu) {
            baseState.fpuStatus = this.fpu.getState();
        }
        
        // Add MMU status
        if (this.mmu) {
            baseState.mmuStatus = this.mmu.getState();
        }
        
        return baseState;
    }
    
    // Method to toggle between microcode and legacy execution
    setMicrocodeEnabled(enabled) {
        this.useMicrocode = enabled;
        if (!enabled && this.running) {
            // If switching to legacy mode while running, restart execution
            this.pause();
            this.run();
        }
    }
    
    // Method to enable/disable pipeline
    setPipelineEnabled(enabled) {
        this.usePipeline = enabled;
        this.pipeline.setEnabled(enabled);
        if (this.running) {
            // If changing pipeline mode while running, restart execution
            this.pause();
            this.run();
        }
    }
    
    // Get pipeline statistics
    getPipelineStats() {
        return this.pipeline.getState().stats;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernaryALU, TernaryRegisters, TernaryCPU };
}