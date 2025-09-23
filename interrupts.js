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
        // For simplicity, just store the address directly in the vector map
        // and use a simple tryte storage for compatibility
        this.vectors.set(interruptNumber, handlerAddress);
        
        // Also store in memory for completeness (use simple storage for now)
        const vectorAddr = new TernaryAddress(
            this.baseAddress.toDecimal() + interruptNumber, 
            9
        );
        
        // If address fits in tryte range, store directly, otherwise store a reference
        if (handlerAddress >= -364 && handlerAddress <= 364) {
            this.memory.write(vectorAddr, new Tryte(handlerAddress));
        } else {
            // Store a marker and use the internal map
            this.memory.write(vectorAddr, new Tryte(-1)); // Special marker for large addresses
        }
    }

    // Get interrupt vector
    getVector(interruptNumber) {
        // First check internal map
        if (this.vectors.has(interruptNumber)) {
            return new TernaryAddress(this.vectors.get(interruptNumber), 9);
        }
        
        // Fall back to memory storage
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
            [6, 6],   // FPU exception
            [7, 7],   // Memory protection violation
            [8, 8],   // Privilege violation
            [9, 9],   // Page fault
            [10, 10], // Hardware timer 0 (high priority)
            [11, 11], // Hardware timer 1
            [12, 12], // Hardware timer 2
            [13, 13], // Hardware timer 3
            [14, 14], // DMA channel 0 complete
            [15, 15], // DMA channel 1 complete
            [16, 20], // Console input
            [17, 21], // Console output
            [18, 22], // Graphics interrupt
            [19, 23], // Audio interrupt
            [20, 24], // Network interface
            [21, 25], // Storage controller
            [22, 26], // External device 0
            [23, 27], // External device 1
            [24, 28], // External device 2
            [25, 29], // External device 3
            [26, 30], // System clock tick
            [27, 35], // Software interrupt 0
            [28, 36], // Software interrupt 1
            [29, 37], // Software interrupt 2
            [30, 40], // User interrupt 0
            [31, 41]  // User interrupt 1
        ]);
        
        // Interrupt nesting support
        this.maxNestingLevel = 8;
        this.currentNestingLevel = 0;
        this.nestedHandlers = [];
        
        // Interrupt masking by priority level
        this.maskLevel = 1000; // By default, don't mask any interrupts (use high value)
        this.globalMask = new Set(); // Specific interrupts that are globally masked
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
            if (this.isInterruptMasked(interrupt) && interrupt > 1) {
                continue;
            }
            
            // Check nesting level - can't handle lower priority interrupts
            if (this.inInterruptHandler && this.currentNestingLevel >= this.maxNestingLevel) {
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
    
    // Check if interrupt is masked
    isInterruptMasked(interruptNumber) {
        // Check global mask
        if (this.globalMask.has(interruptNumber)) {
            return true;
        }
        
        // Check mask level
        const priority = this.priorities.get(interruptNumber);
        if (priority >= this.maskLevel) {
            return true;
        }
        
        // Check specific masked interrupts
        return this.maskedInterrupts.has(interruptNumber);
    }

    // Handle an interrupt
    handleInterrupt(interruptNumber) {
        // Remove from pending
        this.pendingInterrupts.delete(interruptNumber);

        // Check if we can nest this interrupt
        if (this.inInterruptHandler && this.currentNestingLevel >= this.maxNestingLevel) {
            // Cannot nest, defer the interrupt
            this.pendingInterrupts.add(interruptNumber);
            return;
        }

        // Save current state
        const currentPC = this.cpu.registers.get('pc');
        const currentFlags = this.cpu.registers.get('flags');
        const currentMaskLevel = this.maskLevel;

        // Create interrupt context
        const context = {
            interruptNumber: interruptNumber,
            pc: currentPC.toDecimal(),
            flags: currentFlags.toDecimal(),
            maskLevel: currentMaskLevel,
            timestamp: Date.now()
        };

        // Push state to stack
        this.cpu.pushToStack(currentPC.toDecimal());
        this.cpu.pushToStack(currentFlags.toDecimal());
        this.cpu.pushToStack(currentMaskLevel);
        this.cpu.pushToStack(interruptNumber);

        // Set up nesting
        if (!this.inInterruptHandler) {
            this.inInterruptHandler = true;
            this.currentNestingLevel = 0;
        }
        
        this.currentNestingLevel++;
        this.interruptStack.push(interruptNumber);
        this.nestedHandlers.push(context);

        // Set mask level to current interrupt priority to prevent lower priority interrupts
        const currentPriority = this.priorities.get(interruptNumber);
        this.maskLevel = currentPriority + 1;

        // Jump to interrupt handler
        const handlerAddress = this.vectorTable.getVector(interruptNumber);
        this.cpu.registers.set('pc', handlerAddress);

        console.log(`Handling interrupt ${interruptNumber} (priority ${currentPriority}), nesting level ${this.currentNestingLevel}, jumping to ${handlerAddress.toString()}`);
    }

    // Return from interrupt
    returnFromInterrupt() {
        if (!this.inInterruptHandler || this.interruptStack.length === 0) {
            throw new Error('RTI called outside of interrupt handler');
        }

        // Pop interrupt context
        const handledInterrupt = this.interruptStack.pop();
        const context = this.nestedHandlers.pop();
        this.currentNestingLevel--;

        // Restore state from stack
        const interruptNumber = this.cpu.popFromStack();
        const maskLevel = this.cpu.popFromStack();
        const flags = this.cpu.popFromStack();
        const pc = this.cpu.popFromStack();

        this.cpu.registers.set('flags', new Tryte(flags));
        this.cpu.registers.set('pc', new TernaryAddress(pc, 9));
        this.maskLevel = maskLevel;

        // Update interrupt handler state
        if (this.currentNestingLevel === 0) {
            this.inInterruptHandler = false;
            this.interruptEnabled = true; // Re-enable interrupts when fully exiting
        }

        console.log(`Returning from interrupt ${interruptNumber}, nesting level now ${this.currentNestingLevel}`);
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
    
    // Set global mask level (masks all interrupts with priority >= level)
    setMaskLevel(level) {
        this.maskLevel = level;
    }
    
    // Set global mask for specific interrupts
    setGlobalMask(interruptSet) {
        this.globalMask = new Set(interruptSet);
    }
    
    // Clear all pending interrupts
    clearPendingInterrupts() {
        this.pendingInterrupts.clear();
    }
    
    // Get interrupt statistics
    getInterruptStats() {
        const stats = {
            totalPending: this.pendingInterrupts.size,
            totalMasked: this.maskedInterrupts.size,
            nestingLevel: this.currentNestingLevel,
            maxNesting: this.maxNestingLevel,
            handlerActive: this.inInterruptHandler,
            interruptsEnabled: this.interruptEnabled,
            maskLevel: this.maskLevel,
            globalMaskCount: this.globalMask.size
        };
        
        // Count by priority levels
        stats.pendingByPriority = {};
        for (const interrupt of this.pendingInterrupts) {
            const priority = this.priorities.get(interrupt);
            if (!stats.pendingByPriority[priority]) {
                stats.pendingByPriority[priority] = 0;
            }
            stats.pendingByPriority[priority]++;
        }
        
        return stats;
    }
    
    // Trigger software interrupt
    triggerSoftwareInterrupt(level) {
        // Software interrupts 27-29
        const swInterrupt = 27 + (level % 3);
        this.requestInterrupt(swInterrupt);
    }

    // Reset interrupt controller
    reset() {
        this.pendingInterrupts.clear();
        this.maskedInterrupts.clear();
        this.globalMask.clear();
        this.interruptEnabled = true;
        this.inInterruptHandler = false;
        this.currentNestingLevel = 0;
        this.maskLevel = 1000; // Don't mask any interrupts by default
        this.interruptStack = [];
        this.nestedHandlers = [];
    }

    // Get interrupt controller state
    getState() {
        return {
            pendingInterrupts: Array.from(this.pendingInterrupts),
            maskedInterrupts: Array.from(this.maskedInterrupts),
            globalMask: Array.from(this.globalMask),
            interruptEnabled: this.interruptEnabled,
            inInterruptHandler: this.inInterruptHandler,
            currentNestingLevel: this.currentNestingLevel,
            maxNestingLevel: this.maxNestingLevel,
            maskLevel: this.maskLevel,
            interruptStack: [...this.interruptStack],
            nestedHandlers: [...this.nestedHandlers],
            stats: this.getInterruptStats()
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