/**
 * Balanced Ternary Memory System
 * Implements RAM with balanced ternary storage
 * Configurable address width (default 9 trits)
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
    global.TernaryUtils = ternaryModule.TernaryUtils;
}

class TernaryMemory {
    constructor(addressWidth = 9) {
        this.addressWidth = addressWidth;
        this.maxAddress = this.calculateMaxAddress();
        this.memory = new Map(); // Sparse memory implementation
        this.watchpoints = new Set(); // For debugging
        this.accessHistory = []; // Track memory accesses
    }

    calculateMaxAddress() {
        let max = 0;
        for (let i = 0; i < this.addressWidth; i++) {
            max += Math.pow(3, i);
        }
        return max;
    }

    // Validate address is within bounds
    validateAddress(address) {
        const addr = address instanceof TernaryAddress ? address : new TernaryAddress(address, this.addressWidth);
        const decimal = addr.toDecimal();
        
        if (decimal < -this.maxAddress || decimal > this.maxAddress) {
            throw new Error(`Address ${decimal} out of bounds (${-this.maxAddress} to ${this.maxAddress})`);
        }
        
        return addr;
    }

    // Read a tryte from memory
    read(address) {
        const addr = this.validateAddress(address);
        const key = addr.toString();
        
        // Track access for debugging
        this.accessHistory.push({
            type: 'read',
            address: key,
            timestamp: Date.now()
        });

        // Return stored value or zero if not initialized
        const stored = this.memory.get(key);
        const value = stored ? new Tryte(stored.trits) : new Tryte(0);
        
        // Check watchpoints
        if (this.watchpoints.has(key)) {
            console.log(`Memory watchpoint hit: READ from ${key} = ${value.toString()}`);
        }
        
        return value;
    }

    // Write a tryte to memory
    write(address, value) {
        const addr = this.validateAddress(address);
        const key = addr.toString();
        const tryte = value instanceof Tryte ? new Tryte(value.trits) : new Tryte(value);
        
        // Track access for debugging
        this.accessHistory.push({
            type: 'write',
            address: key,
            value: tryte.toString(),
            timestamp: Date.now()
        });

        // Store the value
        this.memory.set(key, tryte);
        
        // Check watchpoints
        if (this.watchpoints.has(key)) {
            console.log(`Memory watchpoint hit: WRITE to ${key} = ${tryte.toString()}`);
        }
    }

    // Read multiple trytes starting from address
    readBlock(startAddress, count) {
        const block = [];
        let addr = this.validateAddress(startAddress);
        
        for (let i = 0; i < count; i++) {
            block.push(this.read(addr));
            addr = addr.increment();
        }
        
        return block;
    }

    // Write multiple trytes starting from address
    writeBlock(startAddress, values) {
        let addr = this.validateAddress(startAddress);
        
        for (let value of values) {
            this.write(addr, value);
            addr = addr.increment();
        }
    }

    // Clear memory
    clear() {
        this.memory.clear();
        this.accessHistory = [];
    }

    // Get memory usage statistics
    getStats() {
        return {
            addressWidth: this.addressWidth,
            maxAddress: this.maxAddress,
            usedLocations: this.memory.size,
            totalLocations: (this.maxAddress * 2) + 1,
            utilization: this.memory.size / ((this.maxAddress * 2) + 1),
            accessCount: this.accessHistory.length
        };
    }

    // Get memory dump for a range
    dump(startAddress = 0, count = 16) {
        const dump = [];
        let addr = new TernaryAddress(startAddress, this.addressWidth);
        
        for (let i = 0; i < count; i++) {
            const value = this.read(addr);
            dump.push({
                address: addr.toString(),
                value: value.toString(),
                decimal: value.toDecimal(),
                initialized: this.memory.has(addr.toString())
            });
            addr = addr.increment();
        }
        
        return dump;
    }

    // Set/clear watchpoints for debugging
    setWatchpoint(address) {
        const addr = this.validateAddress(address);
        this.watchpoints.add(addr.toString());
    }

    clearWatchpoint(address) {
        const addr = this.validateAddress(address);
        this.watchpoints.delete(addr.toString());
    }

    clearAllWatchpoints() {
        this.watchpoints.clear();
    }

    // Get access history for debugging
    getAccessHistory(maxEntries = 100) {
        return this.accessHistory.slice(-maxEntries);
    }

    // Load program into memory
    loadProgram(program, startAddress = 0) {
        let addr = new TernaryAddress(startAddress, this.addressWidth);
        
        for (let instruction of program) {
            if (typeof instruction === 'string') {
                // Parse instruction string to tryte
                const tryte = new Tryte(instruction);
                this.write(addr, tryte);
            } else {
                // Direct tryte or number
                this.write(addr, instruction);
            }
            addr = addr.increment();
        }
    }

    // Save/load memory state for debugging
    saveState() {
        const state = {};
        for (let [key, value] of this.memory.entries()) {
            state[key] = value.toString();
        }
        return {
            memory: state,
            addressWidth: this.addressWidth,
            timestamp: Date.now()
        };
    }

    loadState(state) {
        this.memory.clear();
        this.addressWidth = state.addressWidth;
        this.maxAddress = this.calculateMaxAddress();
        
        for (let [key, value] of Object.entries(state.memory)) {
            this.memory.set(key, new Tryte(value));
        }
    }
}

// Memory-mapped I/O regions
class MemoryMappedIO {
    constructor(memory) {
        this.memory = memory;
        this.ioRegions = new Map();
        this.setupStandardRegions();
    }

    setupStandardRegions() {
        // Standard I/O regions (using high memory addresses)
        const maxAddr = this.memory.maxAddress;
        
        // Console output
        this.defineRegion(maxAddr - 10, maxAddr - 8, {
            name: 'console_out',
            read: () => new Tryte(0), // Always reads as 0
            write: (value) => this.handleConsoleOutput(value)
        });

        // Graphics memory (character mode)
        this.defineRegion(maxAddr - 50, maxAddr - 11, {
            name: 'graphics',
            read: (addr) => this.handleGraphicsRead(addr),
            write: (addr, value) => this.handleGraphicsWrite(addr, value)
        });

        // System control
        this.defineRegion(maxAddr - 5, maxAddr - 1, {
            name: 'system',
            read: (addr) => this.handleSystemRead(addr),
            write: (addr, value) => this.handleSystemWrite(addr, value)
        });
    }

    defineRegion(startAddr, endAddr, handlers) {
        for (let addr = startAddr; addr <= endAddr; addr++) {
            const addrStr = new TernaryAddress(addr, this.memory.addressWidth).toString();
            this.ioRegions.set(addrStr, handlers);
        }
    }

    isIOAddress(address) {
        const addrStr = address.toString();
        return this.ioRegions.has(addrStr);
    }

    handleRead(address) {
        const addrStr = address.toString();
        const region = this.ioRegions.get(addrStr);
        
        if (region && region.read) {
            return region.read(address);
        }
        
        return new Tryte(0);
    }

    handleWrite(address, value) {
        const addrStr = address.toString();
        const region = this.ioRegions.get(addrStr);
        
        if (region && region.write) {
            region.write(address, value);
        }
    }

    handleConsoleOutput(value) {
        // Convert tryte to character and output to console
        const decimal = value.toDecimal();
        if (decimal >= 32 && decimal <= 126) {
            // Printable ASCII
            const char = String.fromCharCode(decimal);
            this.outputToConsole(char);
        } else if (decimal === 10) {
            // Newline
            this.outputToConsole('\n');
        }
    }

    handleGraphicsRead(address) {
        // Return current character at graphics position
        return this.getGraphicsCharacter(address);
    }

    handleGraphicsWrite(address, value) {
        // Set character at graphics position
        this.setGraphicsCharacter(address, value);
    }

    handleSystemRead(address) {
        // System status registers
        return new Tryte(0);
    }

    handleSystemWrite(address, value) {
        // System control
        console.log(`System control write: ${address.toString()} = ${value.toString()}`);
    }

    // These methods would be implemented to interface with the actual display
    outputToConsole(text) {
        if (typeof window !== 'undefined') {
            const consoleOutput = document.getElementById('consoleOutput');
            if (consoleOutput) {
                consoleOutput.textContent += text;
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
            }
        } else {
            process.stdout.write(text);
        }
    }

    getGraphicsCharacter(address) {
        // Return character from graphics display
        return new Tryte(32); // Space character by default
    }

    setGraphicsCharacter(address, value) {
        // Set character in graphics display
        const char = String.fromCharCode(value.toDecimal());
        if (typeof window !== 'undefined') {
            // Update graphics display
            this.updateGraphicsDisplay(address, char);
        }
    }

    updateGraphicsDisplay(address, char) {
        // This would update the actual graphics canvas/display
        // Implementation depends on the graphics system
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernaryMemory, MemoryMappedIO };
}