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
}

class TernaryALU {
    constructor() {
        this.lastOperation = null;
        this.lastResult = null;
        this.flags = {
            zero: false,
            positive: false,
            negative: false,
            overflow: false,
            carry: false
        };
    }

    // Update flags based on result
    updateFlags(result) {
        const decimal = result.toDecimal();
        
        this.flags.zero = decimal === 0;
        this.flags.positive = decimal > 0;
        this.flags.negative = decimal < 0;
        
        // Check for overflow (result exceeds tryte range)
        this.flags.overflow = decimal > Tryte.MAX_VALUE || decimal < Tryte.MIN_VALUE;
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
        // Encode flags as ternary: [overflow, carry, negative, positive, zero]
        const flags = [
            this.flags.zero ? 1 : 0,
            this.flags.positive ? 1 : 0,
            this.flags.negative ? 1 : 0,
            this.flags.carry ? 1 : 0,
            this.flags.overflow ? 1 : 0,
            0 // Reserved
        ];
        return new Tryte(flags);
    }

    // Set flags from tryte
    setFlagsFromTrits(tryte) {
        const trits = tryte.trits;
        this.flags.zero = trits[0] === 1;
        this.flags.positive = trits[1] === 1;
        this.flags.negative = trits[2] === 1;
        this.flags.carry = trits[3] === 1;
        this.flags.overflow = trits[4] === 1;
    }
}

class TernaryRegisters {
    constructor() {
        this.pc = new TernaryAddress(0, 9);  // Program Counter
        this.acc = new Tryte(0);             // Accumulator
        this.ix = new Tryte(0);              // Index Register
        this.sp = new TernaryAddress(0, 9);  // Stack Pointer
        this.flags = new Tryte(0);           // Flags Register
        
        // Additional working registers
        this.r1 = new Tryte(0);              // General purpose register 1
        this.r2 = new Tryte(0);              // General purpose register 2
        this.r3 = new Tryte(0);              // General purpose register 3
    }

    // Get register by name
    get(name) {
        switch (name.toLowerCase()) {
            case 'pc': return this.pc;
            case 'acc': return this.acc;
            case 'ix': return this.ix;
            case 'sp': return this.sp;
            case 'flags': return this.flags;
            case 'r1': return this.r1;
            case 'r2': return this.r2;
            case 'r3': return this.r3;
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
            case 'sp': this.sp = val; break;
            case 'flags': this.flags = val; break;
            case 'r1': this.r1 = val; break;
            case 'r2': this.r2 = val; break;
            case 'r3': this.r3 = val; break;
            default: throw new Error(`Unknown register: ${name}`);
        }
    }

    // Reset all registers
    reset() {
        this.pc = new TernaryAddress(0, 9);
        this.acc = new Tryte(0);
        this.ix = new Tryte(0);
        this.sp = new TernaryAddress(0, 9);
        this.flags = new Tryte(0);
        this.r1 = new Tryte(0);
        this.r2 = new Tryte(0);
        this.r3 = new Tryte(0);
    }

    // Get all registers as object
    getState() {
        return {
            pc: this.pc.toString(),
            acc: this.acc.toString(),
            ix: this.ix.toString(),
            sp: this.sp.toString(),
            flags: this.flags.toString(),
            r1: this.r1.toString(),
            r2: this.r2.toString(),
            r3: this.r3.toString()
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
        
        // Instruction set - separate opcodes for immediate and direct addressing
        this.instructions = this.buildInstructionSet();
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
            'NOP': { opcode: 0,  execute: this.noOperation.bind(this) }          // No operation
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
        if (this.alu.flags.zero) {
            this.registers.set('pc', operand);
        }
    }

    jumpIfPositive(operand) {
        if (this.alu.flags.positive) {
            this.registers.set('pc', operand);
        }
    }

    jumpIfNegative(operand) {
        if (this.alu.flags.negative) {
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

    // CPU execution control
    step() {
        if (this.halted) return false;

        const pc = this.registers.get('pc');
        
        // Check breakpoints
        if (this.breakpoints.has(pc.toString())) {
            this.running = false;
            console.log(`Breakpoint hit at ${pc.toString()}`);
            return false;
        }

        // Fetch instruction
        const instruction = this.memory.read(pc);
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
        
        const runLoop = () => {
            if (this.running && this.step()) {
                setTimeout(runLoop, 10); // 100Hz execution speed
            }
        };
        
        runLoop();
    }

    pause() {
        this.running = false;
    }

    reset() {
        this.registers.reset();
        this.alu = new TernaryALU();
        this.halted = false;
        this.running = false;
        this.cycleCount = 0;
        this.currentInstruction = null;
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
        return {
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
                currentInstruction: this.currentInstruction ? this.currentInstruction.toString() : null
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernaryALU, TernaryRegisters, TernaryCPU };
}