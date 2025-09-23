/**
 * Low-Level Electronic Components for True Ternary Emulation
 * Implements basic electronic gates and components without relying on host CPU operations
 * 
 * Chip references are provided where real-world equivalents exist (74xx series)
 * Power and ground connections are omitted from simulation as requested
 */

// Basic electronic components using only fundamental operations

/**
 * Binary Buffer - equivalent to 74HC125 (Tri-state buffer)
 * Passes input to output when enabled
 */
class BinaryBuffer {
    constructor() {
        this.enabled = true;
    }
    
    // enable: true/false, input: 0/1
    process(input, enable = true) {
        if (!enable) return null; // High impedance state
        return input ? 1 : 0;
    }
}

/**
 * Binary Inverter - equivalent to 74HC04 (Hex Inverter)
 * Inverts binary input
 */
class BinaryInverter {
    process(input) {
        return input ? 0 : 1;
    }
}

/**
 * Binary AND Gate - equivalent to 74HC08 (Quad 2-input AND)
 */
class BinaryAND {
    process(a, b) {
        return (a && b) ? 1 : 0;
    }
}

/**
 * Binary OR Gate - equivalent to 74HC32 (Quad 2-input OR)
 */
class BinaryOR {
    process(a, b) {
        return (a || b) ? 1 : 0;
    }
}

/**
 * Binary NAND Gate - equivalent to 74HC00 (Quad 2-input NAND)
 */
class BinaryNAND {
    constructor() {
        this.and = new BinaryAND();
        this.inverter = new BinaryInverter();
    }
    
    process(a, b) {
        return this.inverter.process(this.and.process(a, b));
    }
}

/**
 * Binary NOR Gate - equivalent to 74HC02 (Quad 2-input NOR)
 */
class BinaryNOR {
    constructor() {
        this.or = new BinaryOR();
        this.inverter = new BinaryInverter();
    }
    
    process(a, b) {
        return this.inverter.process(this.or.process(a, b));
    }
}

/**
 * Binary XOR Gate - equivalent to 74HC86 (Quad 2-input XOR)
 */
class BinaryXOR {
    constructor() {
        this.and1 = new BinaryAND();
        this.and2 = new BinaryAND();
        this.or = new BinaryOR();
        this.inv1 = new BinaryInverter();
        this.inv2 = new BinaryInverter();
    }
    
    process(a, b) {
        // XOR = (A AND NOT B) OR (NOT A AND B)
        const notA = this.inv1.process(a);
        const notB = this.inv2.process(b);
        const term1 = this.and1.process(a, notB);
        const term2 = this.and2.process(notA, b);
        return this.or.process(term1, term2);
    }
}

/**
 * Binary Half Adder - builds sum and carry from basic gates
 */
class BinaryHalfAdder {
    constructor() {
        this.xor = new BinaryXOR();
        this.and = new BinaryAND();
    }
    
    process(a, b) {
        return {
            sum: this.xor.process(a, b),
            carry: this.and.process(a, b)
        };
    }
}

/**
 * Binary Full Adder - equivalent to 74HC283 (4-bit Binary Full Adder)
 */
class BinaryFullAdder {
    constructor() {
        this.ha1 = new BinaryHalfAdder();
        this.ha2 = new BinaryHalfAdder();
        this.or = new BinaryOR();
    }
    
    process(a, b, carryIn) {
        const result1 = this.ha1.process(a, b);
        const result2 = this.ha2.process(result1.sum, carryIn);
        
        return {
            sum: result2.sum,
            carry: this.or.process(result1.carry, result2.carry)
        };
    }
}

/**
 * Binary Latch (SR Latch) - equivalent to 74HC279 (Quad SR Latch)
 */
class BinaryLatch {
    constructor() {
        this.nor1 = new BinaryNOR();
        this.nor2 = new BinaryNOR();
        this.q = 0;
        this.notQ = 1;
    }
    
    process(set, reset) {
        // Cross-coupled NOR gates
        const newQ = this.nor1.process(reset, this.notQ);
        const newNotQ = this.nor2.process(set, newQ);
        
        this.q = newQ;
        this.notQ = newNotQ;
        
        return { q: this.q, notQ: this.notQ };
    }
    
    getState() {
        return { q: this.q, notQ: this.notQ };
    }
}

/**
 * Binary D Flip-Flop - equivalent to 74HC74 (Dual D Flip-Flop)
 */
class BinaryFlipFlop {
    constructor() {
        this.masterLatch = new BinaryLatch();
        this.slaveLatch = new BinaryLatch();
        this.inv = new BinaryInverter();
        this.and1 = new BinaryAND();
        this.and2 = new BinaryAND();
        this.and3 = new BinaryAND();
        this.lastClock = 0;
    }
    
    process(data, clock, enable = 1) {
        if (!enable) return this.getState();
        
        // Edge detection - trigger on rising edge
        const risingEdge = clock && !this.lastClock;
        this.lastClock = clock;
        
        if (risingEdge) {
            // Transfer data through master-slave latches
            const notData = this.inv.process(data);
            const notClock = this.inv.process(clock);
            
            // Master latch (transparent when clock is low)
            this.masterLatch.process(
                this.and1.process(data, notClock),
                this.and2.process(notData, notClock)
            );
            
            // Slave latch (transparent when clock is high)
            const masterQ = this.masterLatch.getState().q;
            const masterNotQ = this.masterLatch.getState().notQ;
            
            this.slaveLatch.process(
                this.and3.process(masterQ, clock),
                this.and3.process(masterNotQ, clock)
            );
        }
        
        return this.getState();
    }
    
    getState() {
        return this.slaveLatch.getState();
    }
}

/**
 * Binary 2-to-1 Multiplexer - equivalent to 74HC157 (Quad 2-to-1 MUX)
 */
class BinaryMux2to1 {
    constructor() {
        this.and1 = new BinaryAND();
        this.and2 = new BinaryAND();
        this.or = new BinaryOR();
        this.inv = new BinaryInverter();
    }
    
    process(input0, input1, select) {
        const notSelect = this.inv.process(select);
        const path0 = this.and1.process(input0, notSelect);
        const path1 = this.and2.process(input1, select);
        return this.or.process(path0, path1);
    }
}

/**
 * Binary 1-to-2 Demultiplexer - equivalent to 74HC138 (3-to-8 Decoder/Demux)
 */
class BinaryDemux1to2 {
    constructor() {
        this.and1 = new BinaryAND();
        this.and2 = new BinaryAND();
        this.inv = new BinaryInverter();
    }
    
    process(input, select) {
        const notSelect = this.inv.process(select);
        return {
            output0: this.and1.process(input, notSelect),
            output1: this.and2.process(input, select)
        };
    }
}

/**
 * Ternary Buffer - tri-state logic for ternary values (-1, 0, 1)
 * No direct chip equivalent - custom ternary logic
 */
class TernaryBuffer {
    process(input, enable = true) {
        if (!enable) return null; // High impedance
        // Validate ternary input
        if (input !== -1 && input !== 0 && input !== 1) {
            throw new Error(`Invalid ternary value: ${input}`);
        }
        return input;
    }
}

/**
 * Ternary Inverter - inverts ternary values
 * Custom ternary logic: -1 -> 1, 0 -> 0, 1 -> -1
 */
class TernaryInverter {
    process(input) {
        switch (input) {
            case -1: return 1;
            case 0: return 0;
            case 1: return -1;
            default: throw new Error(`Invalid ternary value: ${input}`);
        }
    }
}

/**
 * Ternary Latch - stores ternary state with clock-driven timing
 * Custom ternary logic with proper clock enable signals
 */
class TernaryLatch {
    constructor() {
        this.state = 0; // Current state: -1, 0, or 1
        this.enabled = false;
    }
    
    process(data, enable = true, clock = true) {
        // Only update state when enabled and clock is active
        if (enable && clock) {
            this.enabled = true;
            if (data !== -1 && data !== 0 && data !== 1) {
                throw new Error(`Invalid ternary value: ${data}`);
            }
            this.state = data;
        } else {
            this.enabled = false;
        }
        
        return this.state;
    }
    
    getState() {
        return this.state;
    }
    
    isEnabled() {
        return this.enabled;
    }
}

/**
 * Ternary Flip-Flop - ternary D flip-flop with proper edge triggering
 * Updates on ternary clock transitions (0->1 or 0->-1)
 */
class TernaryFlipFlop {
    constructor() {
        this.state = 0;
        this.lastClock = 0;
        this.enabled = false;
    }
    
    process(data, clock, enable = true) {
        if (!enable) return this.state;
        
        // Enhanced ternary clock edge detection based on new pattern
        // Trigger on: 0->1 (positive rising), 0->-1 (negative falling), -1->0 (negative rising)
        const positiveRisingEdge = (this.lastClock === 0 && clock === 1);
        const negativeFallingEdge = (this.lastClock === 0 && clock === -1);
        const negativeRisingEdge = (this.lastClock === -1 && clock === 0);
        
        this.lastClock = clock;
        
        if (positiveRisingEdge || negativeFallingEdge || negativeRisingEdge) {
            this.enabled = true;
            if (data !== -1 && data !== 0 && data !== 1) {
                throw new Error(`Invalid ternary value: ${data}`);
            }
            this.state = data;
        } else {
            this.enabled = false;
        }
        
        return this.state;
    }
    
    getState() {
        return this.state;
    }
    
    isEnabled() {
        return this.enabled;
    }
}

/**
 * Clock-driven Binary Buffer - respects chip enable timing
 */
class ClockDrivenBinaryBuffer extends BinaryBuffer {
    constructor() {
        super();
        this.clockEnabled = false;
    }
    
    process(input, enable = true, clock = true) {
        // Only process when both enabled and clock is high
        this.clockEnabled = enable && clock;
        
        if (!this.clockEnabled) return null; // High impedance state
        return input ? 1 : 0;
    }
    
    isClockEnabled() {
        return this.clockEnabled;
    }
}

/**
 * Clock-driven Ternary Buffer - respects chip enable timing
 */
class ClockDrivenTernaryBuffer extends TernaryBuffer {
    constructor() {
        super();
        this.clockEnabled = false;
    }
    
    process(input, enable = true, clock = true) {
        // Only process when both enabled and clock is active (non-zero)
        this.clockEnabled = enable && (clock !== 0);
        
        if (!this.clockEnabled) return null; // High impedance
        
        // Validate ternary input
        if (input !== -1 && input !== 0 && input !== 1) {
            throw new Error(`Invalid ternary value: ${input}`);
        }
        return input;
    }
    
    isClockEnabled() {
        return this.clockEnabled;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BinaryBuffer, BinaryInverter, BinaryAND, BinaryOR, BinaryNAND, BinaryNOR, BinaryXOR,
        BinaryHalfAdder, BinaryFullAdder, BinaryLatch, BinaryFlipFlop,
        BinaryMux2to1, BinaryDemux1to2,
        TernaryBuffer, TernaryInverter, TernaryLatch, TernaryFlipFlop,
        ClockDrivenBinaryBuffer, ClockDrivenTernaryBuffer
    };
}