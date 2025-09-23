/**
 * Balanced Ternary CPU Implementation
 * Implements ALU, registers, and instruction execution
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
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
            default: throw new Error(`Unknown register: ${name}`);
        }
    }

    // Set register by name
    set(name, value) {
        const val = value instanceof BalancedTernary ? value : 
                   (name === 'pc' || name === 'sp') ? new TernaryAddress(value, 9) : new Tryte(value);
        
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
            r9: this.r9.toString()
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
            // Data movement
            'LDA': { opcode: 1, execute: this.loadAccumulator.bind(this) },      // Load to accumulator
            'STA': { opcode: 2, execute: this.storeAccumulator.bind(this) },     // Store accumulator
            'LDX': { opcode: 3, execute: this.loadIndex.bind(this) },            // Load to index
            'STX': { opcode: 4, execute: this.storeIndex.bind(this) },           // Store index
            'MOV': { opcode: 5, execute: this.moveData.bind(this) },             // Move data
            
            // Arithmetic
            'ADD': { opcode: 10, execute: this.addToAccumulator.bind(this) },    // Add to accumulator
            'SUB': { opcode: 11, execute: this.subtractFromAccumulator.bind(this) }, // Subtract from accumulator
            'MUL': { opcode: 12, execute: this.multiplyAccumulator.bind(this) }, // Multiply accumulator
            'INC': { opcode: 13, execute: this.incrementRegister.bind(this) },   // Increment register
            'DEC': { opcode: 14, execute: this.decrementRegister.bind(this) },   // Decrement register
            
            // Logical
            'AND': { opcode: 20, execute: this.logicalAnd.bind(this) },          // Logical AND
            'OR':  { opcode: 21, execute: this.logicalOr.bind(this) },           // Logical OR
            'NOT': { opcode: 22, execute: this.logicalNot.bind(this) },          // Logical NOT
            'SHL': { opcode: 23, execute: this.shiftLeft.bind(this) },           // Shift left
            'SHR': { opcode: 24, execute: this.shiftRight.bind(this) },          // Shift right
            
            // Comparison and branching
            'CMP': { opcode: 30, execute: this.compare.bind(this) },             // Compare
            'JMP': { opcode: 31, execute: this.jump.bind(this) },                // Unconditional jump
            'JZ':  { opcode: 32, execute: this.jumpIfZero.bind(this) },          // Jump if zero
            'JP':  { opcode: 33, execute: this.jumpIfPositive.bind(this) },      // Jump if positive
            'JN':  { opcode: 34, execute: this.jumpIfNegative.bind(this) },      // Jump if negative
            'JSR': { opcode: 35, execute: this.jumpSubroutine.bind(this) },      // Jump to subroutine
            'RTS': { opcode: 36, execute: this.returnFromSubroutine.bind(this) }, // Return from subroutine
            
            // Stack operations
            'PSH': { opcode: 40, execute: this.pushStack.bind(this) },           // Push to stack
            'POP': { opcode: 41, execute: this.popStack.bind(this) },            // Pop from stack
            
            // I/O and system
            'IN':  { opcode: 50, execute: this.inputOperation.bind(this) },      // Input
            'OUT': { opcode: 51, execute: this.outputOperation.bind(this) },     // Output
            'HLT': { opcode: -13, execute: this.halt.bind(this) },                // Halt
            'NOP': { opcode: 0,  execute: this.noOperation.bind(this) },          // No operation
            
            // Timer/Clock instructions (new)
            'CLKR': { opcode: 60, execute: this.clockRead.bind(this) },          // Read clock
            'CLKS': { opcode: 61, execute: this.clockSet.bind(this) },           // Set timer
            'WAIT': { opcode: 62, execute: this.waitTimer.bind(this) },          // Wait for timer
            
            // Edge detection instructions
            'TEDG': { opcode: 63, execute: this.ternaryEdgeDetect.bind(this) },  // Ternary edge detect
            'BEDG': { opcode: 64, execute: this.binaryEdgeDetect.bind(this) },   // Binary edge detect
            
            // Hardware timer management
            'TCRT': { opcode: 65, execute: this.timerCreate.bind(this) },        // Create hardware timer
            'TDEL': { opcode: 66, execute: this.timerDelete.bind(this) },        // Delete hardware timer
            'TSET': { opcode: 67, execute: this.timerSet.bind(this) },           // Set timer preset
            'TSTA': { opcode: 68, execute: this.timerStart.bind(this) },         // Start timer
            'TSTP': { opcode: 69, execute: this.timerStop.bind(this) },          // Stop timer
            'TSTS': { opcode: 70, execute: this.timerStatus.bind(this) },        // Get timer status
            
            // Interrupt system instructions
            'SEI': { opcode: 80, execute: this.setInterruptFlag.bind(this) },    // Set interrupt flag (enable)
            'CLI': { opcode: 81, execute: this.clearInterruptFlag.bind(this) },  // Clear interrupt flag (disable)
            'RTI': { opcode: 82, execute: this.returnFromInterrupt.bind(this) }, // Return from interrupt
            'INT': { opcode: 83, execute: this.softwareInterrupt.bind(this) },   // Software interrupt
            'NMI': { opcode: 84, execute: this.nonMaskableInterrupt.bind(this) }, // Non-maskable interrupt
            'SIV': { opcode: 85, execute: this.setInterruptVector.bind(this) },  // Set interrupt vector
            'GIV': { opcode: 86, execute: this.getInterruptVector.bind(this) },  // Get interrupt vector
            
            // Index register operations
            'LDX1': { opcode: 90, execute: this.loadIndex1.bind(this) },         // Load to index register 1
            'LDX2': { opcode: 91, execute: this.loadIndex2.bind(this) },         // Load to index register 2
            'LDX3': { opcode: 92, execute: this.loadIndex3.bind(this) },         // Load to index register 3
            'STX1': { opcode: 93, execute: this.storeIndex1.bind(this) },        // Store index register 1
            'STX2': { opcode: 94, execute: this.storeIndex2.bind(this) },        // Store index register 2
            'STX3': { opcode: 95, execute: this.storeIndex3.bind(this) }         // Store index register 3
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
        
        if (this.useMicrocode && this.microcodeEngine) {
            // Microcode-driven execution
            this.runMicrocode();
        } else {
            // Legacy execution mode
            this.runLegacy();
        }
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
                useMicrocode: this.useMicrocode
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernaryALU, TernaryRegisters, TernaryCPU };
}