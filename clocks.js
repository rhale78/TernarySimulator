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
 * Ternary Clock - generates ternary clock signal with enhanced pattern: 0→0→1→1→0→0→-1→-1→0
 * Provides proper ternary timing with positive/negative edge detection
 */
class TernaryClock {
    constructor(frequency = 100) {
        this.frequency = frequency; // Hz
        this.period = 1000 / frequency; // ms
        this.phase = 0; // Current phase: 0-7 for 8-phase cycle
        this.signal = 0; // Current clock signal value
        this.lastSignal = 0; // Previous signal for edge detection
        this.running = false;
        this.callbacks = [];
        this.intervalId = null;
        
        // Enhanced phase to signal mapping for ternary clock
        // Pattern: 0→0→1→1→0→0→-1→-1→0 (repeats)
        this.phaseMap = [0, 0, 1, 1, 0, 0, -1, -1]; // 8-phase cycle
    }
    
    start() {
        if (this.running) return;
        
        this.running = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, this.period / 8); // 8 phases per period
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
        // Store previous signal for edge detection
        this.lastSignal = this.signal;
        
        // Advance to next phase
        this.phase = (this.phase + 1) % 8;
        this.signal = this.phaseMap[this.phase];
        
        // Notify all callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(this.signal, this.phase, this.lastSignal);
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
    
    // Enhanced edge detection for ternary clock
    isRisingEdge() {
        // 0 -> 1 transition (positive rising edge)
        return this.lastSignal === 0 && this.signal === 1;
    }
    
    isFallingEdge() {
        // 1 -> 0 or -1 -> 0 transitions (falling edges)
        return (this.lastSignal === 1 && this.signal === 0) || 
               (this.lastSignal === -1 && this.signal === 0);
    }
    
    isPositiveEdge() {
        // Any transition to positive value (0 -> 1)
        return this.lastSignal === 0 && this.signal === 1;
    }
    
    isNegativeEdge() {
        // Any transition to negative value (0 -> -1)
        return this.lastSignal === 0 && this.signal === -1;
    }
    
    isPositiveFallingEdge() {
        // 1 -> 0 transition (positive signal falling)
        return this.lastSignal === 1 && this.signal === 0;
    }
    
    isNegativeFallingEdge() {
        // 0 -> -1 transition (signal falling to negative)
        return this.lastSignal === 0 && this.signal === -1;
    }
    
    isNegativeRisingEdge() {
        // -1 -> 0 transition (negative signal rising)
        return this.lastSignal === -1 && this.signal === 0;
    }
    
    isNeutralPhase() {
        return this.signal === 0;
    }
    
    getLastSignal() {
        return this.lastSignal;
    }
    
    reset() {
        this.phase = 0;
        this.signal = 0;
        this.lastSignal = 0;
    }
}

/**
 * Binary Clock - generates standard binary clock signal with enhanced edge detection
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
    
    // Binary clock doesn't have negative edge detection (only 0 and 1 states)
    isPositiveEdge() {
        return this.isRisingEdge(); // Same as rising edge for binary
    }
    
    getLastSignal() {
        return this.lastSignal;
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
 * Hardware Timer - programmable timer that can be binary or ternary
 * Provides countdown functionality with configurable clock source
 */
class HardwareTimer {
    constructor(id, clockType = 'binary', frequency = 100) {
        this.id = id;
        this.clockType = clockType;
        this.frequency = frequency;
        this.clock = clockType === 'binary' ? new BinaryClock(frequency) : new TernaryClock(frequency);
        this.counter = 0;
        this.preset = 0;
        this.running = false;
        this.overflow = false;
        this.callbacks = [];
        
        // Connect to clock for counting
        this.clock.addCallback((signal, phase, lastSignal) => {
            if (this.running && this.shouldCount(signal, lastSignal)) {
                this.count();
            }
        });
    }
    
    shouldCount(signal, lastSignal) {
        if (this.clockType === 'binary') {
            // Count on rising edge for binary
            return signal === 1 && lastSignal === 0;
        } else {
            // Count on positive rising edge for ternary (0 -> 1)
            return lastSignal === 0 && signal === 1;
        }
    }
    
    count() {
        if (this.counter > 0) {
            this.counter--;
            if (this.counter === 0) {
                this.overflow = true;
                this.running = false;
                
                // Notify callbacks
                this.callbacks.forEach(callback => {
                    try {
                        callback(this.id, true);
                    } catch (error) {
                        console.error('Timer callback error:', error);
                    }
                });
            }
        }
    }
    
    start(preset = null) {
        if (preset !== null) {
            this.preset = preset;
            this.counter = preset;
        }
        this.running = true;
        this.overflow = false;
        this.clock.start();
    }
    
    stop() {
        this.running = false;
        this.clock.stop();
    }
    
    reset() {
        this.counter = this.preset;
        this.overflow = false;
        this.running = false;
    }
    
    setPreset(value) {
        this.preset = value;
        this.counter = value;
    }
    
    getCounter() {
        return this.counter;
    }
    
    isRunning() {
        return this.running;
    }
    
    hasOverflow() {
        return this.overflow;
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
    
    getClock() {
        return this.clock;
    }
}
class ClockManager {
    constructor() {
        this.ternaryClock = new TernaryClock(100); // 100 Hz ternary clock
        this.binaryClock = new BinaryClock(100);   // 100 Hz binary clock
        this.cpuClock = new TernaryClock(50);      // 50 Hz CPU clock (slower for stability)
        
        // Hardware timers (up to 3 additional)
        this.hardwareTimers = new Map();
        this.maxTimers = 3;
        this.nextTimerId = 0;
        
        // Clock dividers for different subsystems
        this.memoryClockDivider = new ClockDivider(2, 'ternary'); // 50 Hz memory clock
        this.ioDivider = new ClockDivider(4, 'binary');           // 25 Hz I/O clock
        
        // Connect clock dividers to master clocks
        this.ternaryClock.addCallback((signal, phase, lastSignal) => {
            this.memoryClockDivider.pulse(signal);
        });
        
        this.binaryClock.addCallback((signal, lastSignal) => {
            this.ioDivider.pulse(signal);
        });
        
        this.running = false;
    }
    
    // Hardware timer management
    createTimer(clockType = 'binary', frequency = 100) {
        if (this.hardwareTimers.size >= this.maxTimers) {
            throw new Error(`Maximum number of hardware timers (${this.maxTimers}) reached`);
        }
        
        const timerId = this.nextTimerId++;
        const timer = new HardwareTimer(timerId, clockType, frequency);
        this.hardwareTimers.set(timerId, timer);
        
        return timerId;
    }
    
    getTimer(timerId) {
        return this.hardwareTimers.get(timerId);
    }
    
    removeTimer(timerId) {
        const timer = this.hardwareTimers.get(timerId);
        if (timer) {
            timer.stop();
            this.hardwareTimers.delete(timerId);
            return true;
        }
        return false;
    }
    
    listTimers() {
        return Array.from(this.hardwareTimers.keys());
    }
    
    start() {
        if (this.running) return;
        
        this.running = true;
        this.ternaryClock.start();
        this.binaryClock.start();
        this.cpuClock.start();
        
        // Start all hardware timers that are configured to run
        this.hardwareTimers.forEach(timer => {
            if (timer.isRunning()) {
                timer.getClock().start();
            }
        });
    }
    
    stop() {
        if (!this.running) return;
        
        this.running = false;
        this.ternaryClock.stop();
        this.binaryClock.stop();
        this.cpuClock.stop();
        
        // Stop all hardware timers
        this.hardwareTimers.forEach(timer => {
            timer.stop();
        });
    }
    
    reset() {
        this.ternaryClock.reset();
        this.binaryClock.reset();
        this.cpuClock.reset();
        this.memoryClockDivider.reset();
        this.ioDivider.reset();
        
        // Reset all hardware timers
        this.hardwareTimers.forEach(timer => {
            timer.reset();
        });
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
        const timerStatus = {};
        this.hardwareTimers.forEach((timer, id) => {
            timerStatus[id] = {
                type: timer.clockType,
                running: timer.isRunning(),
                counter: timer.getCounter(),
                overflow: timer.hasOverflow(),
                frequency: timer.frequency
            };
        });
        
        return {
            running: this.running,
            ternarySignal: this.ternaryClock.getSignal(),
            ternaryPhase: this.ternaryClock.getPhase(),
            ternaryLastSignal: this.ternaryClock.getLastSignal(),
            ternaryRisingEdge: this.ternaryClock.isRisingEdge(),
            ternaryFallingEdge: this.ternaryClock.isFallingEdge(),
            ternaryPositiveEdge: this.ternaryClock.isPositiveEdge(),
            ternaryNegativeEdge: this.ternaryClock.isNegativeEdge(),
            binarySignal: this.binaryClock.getSignal(),
            binaryLastSignal: this.binaryClock.getLastSignal(),
            binaryRisingEdge: this.binaryClock.isRisingEdge(),
            binaryFallingEdge: this.binaryClock.isFallingEdge(),
            cpuSignal: this.cpuClock.getSignal(),
            cpuPhase: this.cpuClock.getPhase(),
            memorySignal: this.getMemoryClock(),
            ioSignal: this.getIoClock(),
            hardwareTimers: timerStatus
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TernaryClock, BinaryClock, PulseCounter, ClockDivider, HardwareTimer, ClockManager
    };
}