/**
 * Clock and Timing System for Ternary Simulator
 * Implements ternary and binary clocks with pulse counters
 * Provides timing signals for CPU, memory, and component synchronization
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const gatesModule = require('./gates.js');
    global.BinaryFlipFlop = gatesModule.BinaryFlipFlop;
    global.BinaryAND = gatesModule.BinaryAND;
    global.BinaryOR = gatesModule.BinaryOR;
    global.BinaryInverter = gatesModule.BinaryInverter;
    
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
}

/**
 * Ternary Clock - generates ternary clock signal with pattern: 0, +1, 0, -1, 0, +1, ...
 * Provides proper ternary timing for CPU and component synchronization
 */
class TernaryClock {
    constructor(frequency = 100) {
        this.frequency = frequency; // Hz
        this.period = 1000 / frequency; // ms
        this.phase = 0; // Current phase: 0, 1, 2, 3 (maps to 0, +1, 0, -1)
        this.signal = 0; // Current clock signal value
        this.running = false;
        this.callbacks = [];
        this.intervalId = null;
        
        // Phase to signal mapping for ternary clock
        this.phaseMap = [0, 1, 0, -1]; // 0 -> 0, 1 -> +1, 2 -> 0, 3 -> -1
    }
    
    start() {
        if (this.running) return;
        
        this.running = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, this.period / 4); // 4 phases per period
    }
    
    stop() {
        if (!this.running) return;
        
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    tick() {
        // Advance to next phase
        this.phase = (this.phase + 1) % 4;
        this.signal = this.phaseMap[this.phase];
        
        // Notify all callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(this.signal, this.phase);
            } catch (error) {
                console.error('Clock callback error:', error);
            }
        });
    }
    
    addCallback(callback) {
        this.callbacks.push(callback);
    }
    
    removeCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index >= 0) {
            this.callbacks.splice(index, 1);
        }
    }
    
    getSignal() {
        return this.signal;
    }
    
    getPhase() {
        return this.phase;
    }
    
    // Check for specific phase transitions
    isRisingEdge() {
        return this.phase === 1; // 0 -> +1 transition
    }
    
    isFallingEdge() {
        return this.phase === 3; // 0 -> -1 transition
    }
    
    isNeutralPhase() {
        return this.phase === 0 || this.phase === 2;
    }
    
    reset() {
        this.phase = 0;
        this.signal = 0;
    }
}

/**
 * Binary Clock - generates standard binary clock signal with rising/falling edges
 * Compatible with binary flip-flops and latches
 */
class BinaryClock {
    constructor(frequency = 100) {
        this.frequency = frequency; // Hz
        this.period = 1000 / frequency; // ms
        this.signal = 0; // Current clock signal (0 or 1)
        this.lastSignal = 0;
        this.running = false;
        this.callbacks = [];
        this.intervalId = null;
        this.tickCount = 0;
    }
    
    start() {
        if (this.running) return;
        
        this.running = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, this.period / 2); // Toggle every half period
    }
    
    stop() {
        if (!this.running) return;
        
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    tick() {
        this.lastSignal = this.signal;
        this.signal = this.signal ? 0 : 1; // Toggle
        this.tickCount++;
        
        // Notify all callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(this.signal, this.lastSignal);
            } catch (error) {
                console.error('Clock callback error:', error);
            }
        });
    }
    
    addCallback(callback) {
        this.callbacks.push(callback);
    }
    
    removeCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index >= 0) {
            this.callbacks.splice(index, 1);
        }
    }
    
    getSignal() {
        return this.signal;
    }
    
    isRisingEdge() {
        return this.signal === 1 && this.lastSignal === 0;
    }
    
    isFallingEdge() {
        return this.signal === 0 && this.lastSignal === 1;
    }
    
    reset() {
        this.signal = 0;
        this.lastSignal = 0;
        this.tickCount = 0;
    }
}

/**
 * Pulse Counter - counts clock pulses for timing and frequency division
 * Can be used for timing delays, frequency division, etc.
 */
class PulseCounter {
    constructor(maxCount = 256, clockType = 'binary') {
        this.maxCount = maxCount;
        this.clockType = clockType;
        this.count = 0;
        this.overflow = false;
        this.callbacks = [];
        
        // For binary counting
        this.flipFlops = [];
        const bits = Math.ceil(Math.log2(maxCount));
        for (let i = 0; i < bits; i++) {
            this.flipFlops.push(new BinaryFlipFlop());
        }
    }
    
    pulse(clockSignal) {
        if (this.clockType === 'binary') {
            return this.binaryPulse(clockSignal);
        } else {
            return this.ternaryPulse(clockSignal);
        }
    }
    
    binaryPulse(clockSignal) {
        // Use flip-flop chain for binary counting
        let carry = clockSignal;
        
        for (let i = 0; i < this.flipFlops.length; i++) {
            const result = this.flipFlops[i].process(1, carry);
            carry = result.q && carry; // Carry to next stage if both current output and carry are high
        }
        
        // Calculate current count from flip-flop states
        this.count = 0;
        for (let i = 0; i < this.flipFlops.length; i++) {
            if (this.flipFlops[i].getState().q) {
                this.count += Math.pow(2, i);
            }
        }
        
        // Check for overflow
        if (this.count >= this.maxCount) {
            this.overflow = true;
            this.count = 0;
            this.reset();
            
            // Notify callbacks
            this.callbacks.forEach(callback => {
                try {
                    callback(this.count, true);
                } catch (error) {
                    console.error('Counter callback error:', error);
                }
            });
            
            return true; // Overflow occurred
        }
        
        return false;
    }
    
    ternaryPulse(clockSignal) {
        // Simple ternary counting (not component-based for simplicity)
        if (clockSignal === 1) { // Rising edge
            this.count++;
            if (this.count >= this.maxCount) {
                this.overflow = true;
                this.count = 0;
                
                // Notify callbacks
                this.callbacks.forEach(callback => {
                    try {
                        callback(this.count, true);
                    } catch (error) {
                        console.error('Counter callback error:', error);
                    }
                });
                
                return true; // Overflow occurred
            }
        }
        
        return false;
    }
    
    addCallback(callback) {
        this.callbacks.push(callback);
    }
    
    removeCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index >= 0) {
            this.callbacks.splice(index, 1);
        }
    }
    
    getCount() {
        return this.count;
    }
    
    hasOverflow() {
        return this.overflow;
    }
    
    reset() {
        this.count = 0;
        this.overflow = false;
        
        // Reset flip-flops
        this.flipFlops.forEach(ff => {
            ff.process(0, 1); // Clear flip-flop
        });
    }
}

/**
 * Clock Divider - divides clock frequency by a specified factor
 * Uses pulse counter to achieve frequency division
 */
class ClockDivider {
    constructor(divisor = 2, clockType = 'binary') {
        this.divisor = divisor;
        this.clockType = clockType;
        this.counter = new PulseCounter(divisor, clockType);
        this.outputSignal = 0;
        this.callbacks = [];
        
        // Setup counter callback for frequency division
        this.counter.addCallback((count, overflow) => {
            if (overflow) {
                this.outputSignal = this.outputSignal ? 0 : 1; // Toggle output
                
                // Notify callbacks
                this.callbacks.forEach(callback => {
                    try {
                        callback(this.outputSignal);
                    } catch (error) {
                        console.error('Clock divider callback error:', error);
                    }
                });
            }
        });
    }
    
    pulse(inputClock) {
        this.counter.pulse(inputClock);
    }
    
    getOutput() {
        return this.outputSignal;
    }
    
    addCallback(callback) {
        this.callbacks.push(callback);
    }
    
    removeCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index >= 0) {
            this.callbacks.splice(index, 1);
        }
    }
    
    reset() {
        this.counter.reset();
        this.outputSignal = 0;
    }
}

/**
 * Clock Manager - manages multiple clocks and provides system-wide timing
 * Coordinates ternary and binary clocks for proper system operation
 */
class ClockManager {
    constructor() {
        this.ternaryClock = new TernaryClock(100); // 100 Hz ternary clock
        this.binaryClock = new BinaryClock(100);   // 100 Hz binary clock
        this.cpuClock = new TernaryClock(50);      // 50 Hz CPU clock (slower for stability)
        
        // Clock dividers for different subsystems
        this.memoryClockDivider = new ClockDivider(2, 'ternary'); // 50 Hz memory clock
        this.ioDivider = new ClockDivider(4, 'binary');           // 25 Hz I/O clock
        
        // Connect clock dividers to master clocks
        this.ternaryClock.addCallback((signal, phase) => {
            this.memoryClockDivider.pulse(signal);
        });
        
        this.binaryClock.addCallback((signal, lastSignal) => {
            this.ioDivider.pulse(signal);
        });
        
        this.running = false;
    }
    
    start() {
        if (this.running) return;
        
        this.running = true;
        this.ternaryClock.start();
        this.binaryClock.start();
        this.cpuClock.start();
    }
    
    stop() {
        if (!this.running) return;
        
        this.running = false;
        this.ternaryClock.stop();
        this.binaryClock.stop();
        this.cpuClock.stop();
    }
    
    reset() {
        this.ternaryClock.reset();
        this.binaryClock.reset();
        this.cpuClock.reset();
        this.memoryClockDivider.reset();
        this.ioDivider.reset();
    }
    
    getTernaryClock() {
        return this.ternaryClock;
    }
    
    getBinaryClock() {
        return this.binaryClock;
    }
    
    getCpuClock() {
        return this.cpuClock;
    }
    
    getMemoryClock() {
        return this.memoryClockDivider.getOutput();
    }
    
    getIoClock() {
        return this.ioDivider.getOutput();
    }
    
    // Get clock status for debugging
    getStatus() {
        return {
            running: this.running,
            ternarySignal: this.ternaryClock.getSignal(),
            ternaryPhase: this.ternaryClock.getPhase(),
            binarySignal: this.binaryClock.getSignal(),
            cpuSignal: this.cpuClock.getSignal(),
            cpuPhase: this.cpuClock.getPhase(),
            memorySignal: this.getMemoryClock(),
            ioSignal: this.getIoClock()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TernaryClock, BinaryClock, PulseCounter, ClockDivider, ClockManager
    };
}