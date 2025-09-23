/**
 * Balanced Ternary Interrupt System
 * Implements interrupt handling, vector table, and interrupt-driven I/O
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

/**
 * Interrupt Vector Table Manager
 * Manages interrupt vectors and priorities in balanced ternary memory
 */
class InterruptVectorTable {
    constructor(memory, baseAddress = 0x1FF0) { // High memory area
        this.memory = memory;
        this.baseAddress = new TernaryAddress(baseAddress, 9);
        this.vectors = new Map();
        this.initializeDefaultVectors();
    }

    // Initialize default system interrupt vectors
    initializeDefaultVectors() {
        // System interrupts
        this.setVector(0, 0x0000);  // Reset vector
        this.setVector(1, 0x0010);  // NMI (Non-Maskable Interrupt)
        this.setVector(2, 0x0020);  // Division by zero
        this.setVector(3, 0x0030);  // Invalid instruction
        this.setVector(4, 0x0040);  // Stack overflow
        this.setVector(5, 0x0050);  // Stack underflow
        this.setVector(6, 0x0060);  // Hardware timer 0
        this.setVector(7, 0x0070);  // Hardware timer 1
        this.setVector(8, 0x0080);  // Hardware timer 2
        this.setVector(9, 0x0090);  // Console input
        this.setVector(10, 0x00A0); // Console output
        this.setVector(11, 0x00B0); // System clock tick
        this.setVector(12, 0x00C0); // User interrupt 0
        this.setVector(13, 0x00D0); // User interrupt 1
    }

    // Set interrupt vector
    setVector(interruptNumber, handlerAddress) {
        const vectorAddr = new TernaryAddress(
            this.baseAddress.toDecimal() + interruptNumber, 
            9
        );
        const handler = new TernaryAddress(handlerAddress, 9);
        
        this.memory.write(vectorAddr, new Tryte(handler.toDecimal()));
        this.vectors.set(interruptNumber, handlerAddress);
    }

    // Get interrupt vector
    getVector(interruptNumber) {
        const vectorAddr = new TernaryAddress(
            this.baseAddress.toDecimal() + interruptNumber, 
            9
        );
        const handlerValue = this.memory.read(vectorAddr);
        return new TernaryAddress(handlerValue.toDecimal(), 9);
    }

    // Reset all vectors to default values
    reset() {
        this.vectors.clear();
        this.initializeDefaultVectors();
    }
}

/**
 * Interrupt Controller
 * Manages interrupt priorities, masking, and delivery
 */
class InterruptController {
    constructor(cpu, vectorTable) {
        this.cpu = cpu;
        this.vectorTable = vectorTable;
        this.pendingInterrupts = new Set();
        this.maskedInterrupts = new Set();
        this.interruptEnabled = true;
        this.inInterruptHandler = false;
        this.interruptStack = [];

        // Interrupt priorities (lower number = higher priority)
        this.priorities = new Map([
            [0, 0],   // Reset (highest priority, non-maskable)
            [1, 1],   // NMI (non-maskable)
            [2, 2],   // Division by zero
            [3, 3],   // Invalid instruction
            [4, 4],   // Stack overflow
            [5, 5],   // Stack underflow
            [6, 10],  // Hardware timer 0
            [7, 11],  // Hardware timer 1
            [8, 12],  // Hardware timer 2
            [9, 20],  // Console input
            [10, 21], // Console output
            [11, 30], // System clock tick
            [12, 40], // User interrupt 0
            [13, 41]  // User interrupt 1
        ]);
    }

    // Request an interrupt
    requestInterrupt(interruptNumber) {
        if (!this.priorities.has(interruptNumber)) {
            throw new Error(`Invalid interrupt number: ${interruptNumber}`);
        }
        
        this.pendingInterrupts.add(interruptNumber);
    }

    // Check for pending interrupts and handle highest priority one
    checkInterrupts() {
        if (!this.interruptEnabled && this.getNonMaskableInterrupts().size === 0) {
            return false;
        }

        const nextInterrupt = this.getHighestPriorityInterrupt();
        if (nextInterrupt !== null) {
            this.handleInterrupt(nextInterrupt);
            return true;
        }
        
        return false;
    }

    // Get non-maskable interrupts
    getNonMaskableInterrupts() {
        const nmi = new Set();
        for (const interrupt of this.pendingInterrupts) {
            if (interrupt <= 1) { // Reset and NMI are non-maskable
                nmi.add(interrupt);
            }
        }
        return nmi;
    }

    // Get highest priority pending interrupt
    getHighestPriorityInterrupt() {
        let highestPriority = Infinity;
        let selectedInterrupt = null;

        for (const interrupt of this.pendingInterrupts) {
            // Skip masked interrupts unless they're non-maskable
            if (this.maskedInterrupts.has(interrupt) && interrupt > 1) {
                continue;
            }

            const priority = this.priorities.get(interrupt);
            if (priority < highestPriority) {
                highestPriority = priority;
                selectedInterrupt = interrupt;
            }
        }

        return selectedInterrupt;
    }

    // Handle an interrupt
    handleInterrupt(interruptNumber) {
        // Remove from pending
        this.pendingInterrupts.delete(interruptNumber);

        // Save current state
        const currentPC = this.cpu.registers.get('pc');
        const currentFlags = this.cpu.registers.get('flags');

        // Push state to stack
        this.cpu.pushToStack(currentPC.toDecimal());
        this.cpu.pushToStack(currentFlags.toDecimal());

        // Set interrupt handler flag
        this.inInterruptHandler = true;
        this.interruptStack.push(interruptNumber);

        // Disable interrupts (can be re-enabled with SEI instruction)
        this.interruptEnabled = false;

        // Jump to interrupt handler
        const handlerAddress = this.vectorTable.getVector(interruptNumber);
        this.cpu.registers.set('pc', handlerAddress);

        console.log(`Handling interrupt ${interruptNumber}, jumping to ${handlerAddress.toString()}`);
    }

    // Return from interrupt
    returnFromInterrupt() {
        if (!this.inInterruptHandler || this.interruptStack.length === 0) {
            throw new Error('RTI called outside of interrupt handler');
        }

        // Pop interrupt from stack
        this.interruptStack.pop();
        this.inInterruptHandler = this.interruptStack.length > 0;

        // Restore state from stack
        const flags = this.cpu.popFromStack();
        const pc = this.cpu.popFromStack();

        this.cpu.registers.set('flags', new Tryte(flags));
        this.cpu.registers.set('pc', new TernaryAddress(pc, 9));

        // Re-enable interrupts
        this.interruptEnabled = true;
    }

    // Enable interrupts
    enableInterrupts() {
        this.interruptEnabled = true;
    }

    // Disable interrupts
    disableInterrupts() {
        this.interruptEnabled = false;
    }

    // Mask specific interrupt
    maskInterrupt(interruptNumber) {
        this.maskedInterrupts.add(interruptNumber);
    }

    // Unmask specific interrupt
    unmaskInterrupt(interruptNumber) {
        this.maskedInterrupts.delete(interruptNumber);
    }

    // Reset interrupt controller
    reset() {
        this.pendingInterrupts.clear();
        this.maskedInterrupts.clear();
        this.interruptEnabled = true;
        this.inInterruptHandler = false;
        this.interruptStack = [];
    }

    // Get interrupt controller state
    getState() {
        return {
            pendingInterrupts: Array.from(this.pendingInterrupts),
            maskedInterrupts: Array.from(this.maskedInterrupts),
            interruptEnabled: this.interruptEnabled,
            inInterruptHandler: this.inInterruptHandler,
            interruptStack: [...this.interruptStack]
        };
    }
}

/**
 * ROM Chip - Read-Only Memory for system firmware
 */
class ROMChip {
    constructor(size = 1024, startAddress = 0xF000) {
        this.size = size;
        this.startAddress = new TernaryAddress(startAddress, 9);
        this.endAddress = new TernaryAddress(startAddress + size - 1, 9);
        this.data = new Map();
        this.loadSystemFirmware();
    }

    // Load default system firmware
    loadSystemFirmware() {
        // Default interrupt handlers (just return for now)
        this.writeToROM(0xF000, [
            0x36  // RTS - Return from subroutine
        ]);

        // NMI handler
        this.writeToROM(0xF010, [
            0x36  // RTS
        ]);

        // Division by zero handler
        this.writeToROM(0xF020, [
            0x36  // RTS
        ]);

        // Invalid instruction handler
        this.writeToROM(0xF030, [
            0x36  // RTS
        ]);

        // System clock interrupt handler
        this.writeToROM(0xF0B0, [
            0x36  // RTS
        ]);
    }

    // Write data to ROM (only during initialization)
    writeToROM(address, data) {
        const addr = new TernaryAddress(address, 9);
        if (addr.toDecimal() < this.startAddress.toDecimal() || 
            addr.toDecimal() > this.endAddress.toDecimal()) {
            throw new Error(`Address ${address} outside ROM range`);
        }

        for (let i = 0; i < data.length; i++) {
            const currentAddr = new TernaryAddress(address + i, 9);
            this.data.set(currentAddr.toString(), new Tryte(data[i]));
        }
    }

    // Read from ROM
    read(address) {
        const addr = new TernaryAddress(address, 9);
        const key = addr.toString();
        
        if (this.data.has(key)) {
            return this.data.get(key);
        }
        
        return new Tryte(0); // Default to 0 for uninitialized ROM
    }

    // Check if address is in ROM range
    isInRange(address) {
        const addr = new TernaryAddress(address, 9);
        const decimal = addr.toDecimal();
        return decimal >= this.startAddress.toDecimal() && 
               decimal <= this.endAddress.toDecimal();
    }

    // Get ROM state for debugging
    getState() {
        return {
            startAddress: this.startAddress.toString(),
            endAddress: this.endAddress.toString(),
            size: this.size,
            dataSize: this.data.size
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        InterruptVectorTable,
        InterruptController,
        ROMChip
    };
}