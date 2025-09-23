/**
 * Microcode Engine for Ternary CPU
 * Implements clock-driven microcode execution with proper timing and control signals
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    
    const clocksModule = require('./clocks.js');
    global.ClockManager = clocksModule.ClockManager;
}

/**
 * Microcode Instruction - represents a single microcode step
 * Each microinstruction specifies control signals for various CPU components
 */
class MicroInstruction {
    constructor(controlSignals = {}) {
        // ALU control signals
        this.aluOp = controlSignals.aluOp || 'NOP';        // ALU operation
        this.aluSrcA = controlSignals.aluSrcA || 'ACC';    // ALU source A
        this.aluSrcB = controlSignals.aluSrcB || 'ZERO';   // ALU source B
        
        // Register control signals
        this.accWrite = controlSignals.accWrite || false;  // Write to accumulator
        this.indexWrite = controlSignals.indexWrite || false; // Write to index register
        this.pcWrite = controlSignals.pcWrite || false;    // Write to program counter
        this.spWrite = controlSignals.spWrite || false;    // Write to stack pointer
        this.flagsWrite = controlSignals.flagsWrite || false; // Write to flags
        
        // Memory control signals
        this.memRead = controlSignals.memRead || false;    // Memory read enable
        this.memWrite = controlSignals.memWrite || false;  // Memory write enable
        this.memAddrSrc = controlSignals.memAddrSrc || 'PC'; // Memory address source
        
        // Bus control signals
        this.busEnable = controlSignals.busEnable || false;  // Enable data bus
        this.busSource = controlSignals.busSource || 'MEM';  // Bus data source
        this.busTarget = controlSignals.busTarget || 'IR';   // Bus data target
        
        // Control flow signals
        this.pcSrc = controlSignals.pcSrc || 'INC';          // PC source (INC, ALU, ADDR)
        this.branch = controlSignals.branch || false;       // Branch condition check
        this.halt = controlSignals.halt || false;           // Halt CPU
        
        // Chip enable signals (for proper timing)
        this.chipEnables = {
            alu: controlSignals.chipEnables?.alu || false,
            registers: controlSignals.chipEnables?.registers || false,
            memory: controlSignals.chipEnables?.memory || false,
            bus: controlSignals.chipEnables?.bus || false
        };
    }
}

/**
 * Microcode ROM - stores microcode programs for each instruction
 * Each instruction has a sequence of microinstructions that execute over multiple clock cycles
 */
class MicrocodeROM {
    constructor() {
        this.microcode = new Map();
        this._initializeMicrocode();
    }
    
    _initializeMicrocode() {
        // Fetch cycle - common to all instructions (first 3 microinstructions)
        const fetchCycle = [
            // T0: Put PC on address bus, enable memory read
            new MicroInstruction({
                memRead: true,
                memAddrSrc: 'PC',
                busEnable: true,
                busSource: 'MEM',
                busTarget: 'IR',
                chipEnables: { memory: true, bus: true }
            }),
            // T1: Increment PC
            new MicroInstruction({
                aluOp: 'INC',
                aluSrcA: 'PC',
                pcWrite: true,
                chipEnables: { alu: true, registers: true }
            }),
            // T2: Decode instruction (prepare for execute phase)
            new MicroInstruction({
                chipEnables: { registers: true }
            })
        ];
        
        // LDA - Load Accumulator (immediate addressing)
        this.microcode.set(1, [
            ...fetchCycle,
            // T3: Extract operand from instruction and load to accumulator
            new MicroInstruction({
                busEnable: true,
                busSource: 'OPERAND',
                busTarget: 'ACC',
                accWrite: true,
                chipEnables: { bus: true, registers: true }
            })
        ]);
        
        // STA - Store Accumulator
        this.microcode.set(2, [
            ...fetchCycle,
            // T3: Put accumulator on bus
            new MicroInstruction({
                busEnable: true,
                busSource: 'ACC',
                busTarget: 'MEM',
                memWrite: true,
                memAddrSrc: 'OPERAND',
                chipEnables: { bus: true, memory: true }
            })
        ]);
        
        // ADD - Add to Accumulator
        this.microcode.set(10, [
            ...fetchCycle,
            // T3: Perform addition
            new MicroInstruction({
                aluOp: 'ADD',
                aluSrcA: 'ACC',
                aluSrcB: 'OPERAND',
                accWrite: true,
                flagsWrite: true,
                chipEnables: { alu: true, registers: true }
            })
        ]);
        
        // SUB - Subtract from Accumulator
        this.microcode.set(11, [
            ...fetchCycle,
            // T3: Perform subtraction
            new MicroInstruction({
                aluOp: 'SUB',
                aluSrcA: 'ACC',
                aluSrcB: 'OPERAND',
                accWrite: true,
                flagsWrite: true,
                chipEnables: { alu: true, registers: true }
            })
        ]);
        
        // MUL - Multiply Accumulator
        this.microcode.set(12, [
            ...fetchCycle,
            // T3: Perform multiplication
            new MicroInstruction({
                aluOp: 'MUL',
                aluSrcA: 'ACC',
                aluSrcB: 'OPERAND',
                accWrite: true,
                flagsWrite: true,
                chipEnables: { alu: true, registers: true }
            })
        ]);
        
        // AND - Logical AND
        this.microcode.set(20, [
            ...fetchCycle,
            // T3: Perform logical AND
            new MicroInstruction({
                aluOp: 'AND',
                aluSrcA: 'ACC',
                aluSrcB: 'OPERAND',
                accWrite: true,
                flagsWrite: true,
                chipEnables: { alu: true, registers: true }
            })
        ]);
        
        // OR - Logical OR
        this.microcode.set(21, [
            ...fetchCycle,
            // T3: Perform logical OR
            new MicroInstruction({
                aluOp: 'OR',
                aluSrcA: 'ACC',
                aluSrcB: 'OPERAND',
                accWrite: true,
                flagsWrite: true,
                chipEnables: { alu: true, registers: true }
            })
        ]);
        
        // NOT - Logical NOT
        this.microcode.set(22, [
            ...fetchCycle,
            // T3: Perform logical NOT
            new MicroInstruction({
                aluOp: 'NOT',
                aluSrcA: 'ACC',
                accWrite: true,
                flagsWrite: true,
                chipEnables: { alu: true, registers: true }
            })
        ]);
        
        // SHL - Shift Left
        this.microcode.set(23, [
            ...fetchCycle,
            // T3: Perform shift left
            new MicroInstruction({
                aluOp: 'SHL',
                aluSrcA: 'ACC',
                aluSrcB: 'OPERAND',
                accWrite: true,
                flagsWrite: true,
                chipEnables: { alu: true, registers: true }
            })
        ]);
        
        // SHR - Shift Right
        this.microcode.set(24, [
            ...fetchCycle,
            // T3: Perform shift right
            new MicroInstruction({
                aluOp: 'SHR',
                aluSrcA: 'ACC',
                aluSrcB: 'OPERAND',
                accWrite: true,
                flagsWrite: true,
                chipEnables: { alu: true, registers: true }
            })
        ]);
        
        // JMP - Unconditional Jump
        this.microcode.set(31, [
            ...fetchCycle,
            // T3: Set PC to operand value
            new MicroInstruction({
                busEnable: true,
                busSource: 'OPERAND',
                busTarget: 'PC',
                pcWrite: true,
                chipEnables: { bus: true, registers: true }
            })
        ]);
        
        // JZ - Jump if Zero
        this.microcode.set(32, [
            ...fetchCycle,
            // T3: Check zero flag and conditionally jump
            new MicroInstruction({
                branch: true,
                pcSrc: 'OPERAND',
                chipEnables: { registers: true }
            })
        ]);
        
        // HLT - Halt
        this.microcode.set(-13, [
            ...fetchCycle,
            // T3: Halt execution
            new MicroInstruction({
                halt: true
            })
        ]);
        
        // New timer/clock instructions
        
        // CLKR - Clock Read (read current clock value)
        this.microcode.set(60, [
            ...fetchCycle,
            // T3: Read clock counter value to accumulator
            new MicroInstruction({
                busEnable: true,
                busSource: 'CLOCK',
                busTarget: 'ACC',
                accWrite: true,
                chipEnables: { bus: true, registers: true }
            })
        ]);
        
        // CLKS - Clock Set (set timer delay)
        this.microcode.set(61, [
            ...fetchCycle,
            // T3: Set timer delay from accumulator
            new MicroInstruction({
                busEnable: true,
                busSource: 'ACC',
                busTarget: 'TIMER',
                chipEnables: { bus: true }
            })
        ]);
        
        // WAIT - Wait for timer
        this.microcode.set(62, [
            ...fetchCycle,
            // T3: Wait for timer completion (may take multiple cycles)
            new MicroInstruction({
                busEnable: true,
                busSource: 'TIMER_STATUS',
                busTarget: 'FLAGS',
                flagsWrite: true,
                chipEnables: { bus: true, registers: true }
            })
        ]);
    }
    
    getMicrocode(opcode) {
        return this.microcode.get(opcode) || [];
    }
    
    hasMicrocode(opcode) {
        return this.microcode.has(opcode);
    }
}

/**
 * Microcode Engine - executes microcode instructions with proper clock timing
 * Coordinates with clock system to ensure proper timing and control signal sequencing
 */
class MicrocodeEngine {
    constructor(cpu, clockManager) {
        this.cpu = cpu;
        this.clockManager = clockManager;
        this.microcodeROM = new MicrocodeROM();
        
        // Execution state
        this.currentMicrocode = [];
        this.microcodePC = 0;
        this.currentInstruction = null;
        this.operandValue = 0;
        
        // State machine
        this.state = 'IDLE'; // IDLE, FETCH, EXECUTE, WAIT
        this.cycleCount = 0;
        
        // Control signals
        this.controlSignals = {};
        
        // Timer support
        this.timerValue = 0;
        this.timerActive = false;
        this.timerCallback = null;
        
        // Connect to CPU clock
        this.clockManager.getCpuClock().addCallback((signal, phase) => {
            this.onClockTick(signal, phase);
        });
    }
    
    onClockTick(signal, phase) {
        // Execute on rising edge of ternary clock (phase 1)
        if (phase === 1) {
            this.executeMicroStep();
        }
    }
    
    executeMicroStep() {
        if (this.state === 'IDLE' || this.cpu.halted) {
            return;
        }
        
        // Get current microinstruction
        if (this.microcodePC >= this.currentMicrocode.length) {
            // Microcode sequence complete, return to fetch
            this.state = 'FETCH';
            this.microcodePC = 0;
            this.currentMicrocode = [];
            return;
        }
        
        const microInstruction = this.currentMicrocode[this.microcodePC];
        this.controlSignals = microInstruction;
        
        // Execute microinstruction based on control signals
        this.executeControlSignals(microInstruction);
        
        // Advance microcode PC
        this.microcodePC++;
        this.cycleCount++;
    }
    
    executeControlSignals(microInstr) {
        // Apply chip enable signals first
        if (!microInstr.chipEnables.alu && !microInstr.chipEnables.registers && 
            !microInstr.chipEnables.memory && !microInstr.chipEnables.bus) {
            return; // No operations if no chip enables
        }
        
        // Handle ALU operations
        if (microInstr.chipEnables.alu && microInstr.aluOp !== 'NOP') {
            this.executeALUOperation(microInstr);
        }
        
        // Handle memory operations
        if (microInstr.chipEnables.memory) {
            this.executeMemoryOperation(microInstr);
        }
        
        // Handle bus operations
        if (microInstr.chipEnables.bus) {
            this.executeBusOperation(microInstr);
        }
        
        // Handle register writes
        if (microInstr.chipEnables.registers) {
            this.executeRegisterOperation(microInstr);
        }
        
        // Handle control flow
        this.executeControlFlow(microInstr);
    }
    
    executeALUOperation(microInstr) {
        const srcA = this.getALUSource(microInstr.aluSrcA);
        const srcB = this.getALUSource(microInstr.aluSrcB);
        let result;
        
        switch (microInstr.aluOp) {
            case 'ADD':
                result = this.cpu.alu.add(srcA, srcB);
                break;
            case 'SUB':
                result = this.cpu.alu.subtract(srcA, srcB);
                break;
            case 'MUL':
                result = this.cpu.alu.multiply(srcA, srcB);
                break;
            case 'AND':
                result = this.cpu.alu.and(srcA, srcB);
                break;
            case 'OR':
                result = this.cpu.alu.or(srcA, srcB);
                break;
            case 'NOT':
                result = this.cpu.alu.not(srcA);
                break;
            case 'SHL':
                const shiftLeftPos = typeof srcB === 'number' ? srcB : srcB.toDecimal();
                result = this.cpu.alu.shiftLeft(srcA, shiftLeftPos);
                break;
            case 'SHR':
                const shiftRightPos = typeof srcB === 'number' ? srcB : srcB.toDecimal();
                result = this.cpu.alu.shiftRight(srcA, shiftRightPos);
                break;
            case 'INC':
                result = this.cpu.alu.increment(srcA);
                break;
            case 'DEC':
                result = this.cpu.alu.decrement(srcA);
                break;
            default:
                return;
        }
        
        // Store result in temporary register for later use
        this.aluResult = result;
    }
    
    executeMemoryOperation(microInstr) {
        const address = this.getMemoryAddress(microInstr.memAddrSrc);
        
        if (microInstr.memRead) {
            this.memoryData = this.cpu.memory.read(address);
        } else if (microInstr.memWrite) {
            const data = this.getBusData(microInstr.busSource);
            this.cpu.memory.write(address, data);
        }
    }
    
    executeBusOperation(microInstr) {
        if (microInstr.busEnable) {
            const data = this.getBusData(microInstr.busSource);
            this.busData = data;
        }
    }
    
    executeRegisterOperation(microInstr) {
        if (microInstr.accWrite && this.aluResult) {
            this.cpu.registers.set('acc', this.aluResult);
        }
        
        if (microInstr.pcWrite) {
            if (this.busData) {
                this.cpu.registers.set('pc', this.busData);
            } else if (this.aluResult) {
                this.cpu.registers.set('pc', this.aluResult);
            }
        }
        
        if (microInstr.flagsWrite) {
            this.cpu.registers.set('flags', this.cpu.alu.getFlagsAsTrits());
        }
    }
    
    executeControlFlow(microInstr) {
        if (microInstr.halt) {
            this.cpu.halted = true;
            this.cpu.running = false;
        }
        
        if (microInstr.branch) {
            // Check branch condition based on flags
            const flags = this.cpu.registers.get('flags');
            const shouldBranch = this.checkBranchCondition(flags);
            
            if (shouldBranch) {
                const targetAddress = new Tryte(this.operandValue);
                this.cpu.registers.set('pc', targetAddress);
            }
        }
    }
    
    getALUSource(source) {
        switch (source) {
            case 'ACC':
                return this.cpu.registers.get('acc');
            case 'PC':
                return this.cpu.registers.get('pc');
            case 'OPERAND':
                return new Tryte(this.operandValue);
            case 'ZERO':
                return new Tryte(0);
            default:
                return new Tryte(0);
        }
    }
    
    getMemoryAddress(source) {
        switch (source) {
            case 'PC':
                return this.cpu.registers.get('pc');
            case 'OPERAND':
                return new Tryte(this.operandValue);
            case 'ACC':
                return this.cpu.registers.get('acc');
            default:
                return this.cpu.registers.get('pc');
        }
    }
    
    getBusData(source) {
        switch (source) {
            case 'MEM':
                return this.memoryData;
            case 'ACC':
                return this.cpu.registers.get('acc');
            case 'OPERAND':
                return new Tryte(this.operandValue);
            case 'ALU':
                return this.aluResult;
            case 'CLOCK':
                return new Tryte(this.clockManager.getTernaryClock().getPhase());
            case 'TIMER_STATUS':
                return new Tryte(this.timerActive ? 1 : 0);
            default:
                return new Tryte(0);
        }
    }
    
    checkBranchCondition(flags) {
        // Simple zero flag check for JZ instruction
        // In a full implementation, this would check specific flag bits
        return this.cpu.alu.isZero();
    }
    
    startInstruction(instruction) {
        // Decode instruction
        const trits = instruction.trits;
        while (trits.length < 6) {
            trits.push(0);
        }
        
        const opcodeTrits = [trits[0] || 0, trits[1] || 0, trits[2] || 0];
        const operandTrits = [trits[3] || 0, trits[4] || 0, trits[5] || 0];
        
        const opcode = new BalancedTernary(opcodeTrits).toDecimal();
        this.operandValue = new BalancedTernary(operandTrits).toDecimal();
        
        // Get microcode for this instruction
        this.currentMicrocode = this.microcodeROM.getMicrocode(opcode);
        this.microcodePC = 0;
        this.currentInstruction = instruction;
        this.state = 'EXECUTE';
        
        // Clear temporary registers
        this.aluResult = null;
        this.memoryData = null;
        this.busData = null;
    }
    
    isComplete() {
        return this.microcodePC >= this.currentMicrocode.length;
    }
    
    reset() {
        this.currentMicrocode = [];
        this.microcodePC = 0;
        this.currentInstruction = null;
        this.operandValue = 0;
        this.state = 'IDLE';
        this.cycleCount = 0;
        this.controlSignals = {};
    }
    
    getState() {
        return {
            state: this.state,
            microcodePC: this.microcodePC,
            cycleCount: this.cycleCount,
            controlSignals: this.controlSignals,
            timerValue: this.timerValue,
            timerActive: this.timerActive
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MicroInstruction, MicrocodeROM, MicrocodeEngine
    };
}