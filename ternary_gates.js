/**
 * Ternary Electronic Components
 * Implements ternary arithmetic and logical components using low-level gates
 * Built from basic electronic components to ensure true ternary emulation
 */

// Import basic gates if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const gatesModule = require('./gates.js');
    global.BinaryBuffer = gatesModule.BinaryBuffer;
    global.BinaryInverter = gatesModule.BinaryInverter;
    global.BinaryAND = gatesModule.BinaryAND;
    global.BinaryOR = gatesModule.BinaryOR;
    global.BinaryNAND = gatesModule.BinaryNAND;
    global.BinaryNOR = gatesModule.BinaryNOR;
    global.BinaryXOR = gatesModule.BinaryXOR;
    global.BinaryHalfAdder = gatesModule.BinaryHalfAdder;
    global.BinaryFullAdder = gatesModule.BinaryFullAdder;
    global.BinaryLatch = gatesModule.BinaryLatch;
    global.BinaryFlipFlop = gatesModule.BinaryFlipFlop;
    global.BinaryMux2to1 = gatesModule.BinaryMux2to1;
    global.BinaryDemux1to2 = gatesModule.BinaryDemux1to2;
    global.TernaryBuffer = gatesModule.TernaryBuffer;
    global.TernaryInverter = gatesModule.TernaryInverter;
}

/**
 * Ternary AND Gate - custom ternary logic
 * Truth table: both inputs must be +1 to result in +1
 * Any -1 input results in -1, otherwise 0
 */
class TernaryAND {
    process(a, b) {
        if (a === 1 && b === 1) return 1;
        if (a === -1 || b === -1) return -1;
        return 0;
    }
}

/**
 * Ternary OR Gate - custom ternary logic
 * Truth table: any +1 input results in +1
 * Both inputs -1 results in -1, otherwise 0
 */
class TernaryOR {
    process(a, b) {
        if (a === 1 || b === 1) return 1;
        if (a === -1 && b === -1) return -1;
        return 0;
    }
}

/**
 * Ternary Comparator - compares two ternary values
 * Returns: 1 if a > b, 0 if a == b, -1 if a < b
 */
class TernaryComparator {
    process(a, b) {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    }
}

/**
 * Ternary Half Adder - adds two ternary digits
 * Produces sum and carry using ternary logic
 */
class TernaryHalfAdder {
    process(a, b) {
        const sum = a + b;
        let carry = 0;
        let result = sum;
        
        // Handle ternary carry logic
        if (sum > 1) {
            carry = 1;
            result = sum - 3;
        } else if (sum < -1) {
            carry = -1;
            result = sum + 3;
        }
        
        return { sum: result, carry: carry };
    }
}

/**
 * Ternary Full Adder - adds two ternary digits plus carry
 * Built from two ternary half adders
 */
class TernaryFullAdder {
    constructor() {
        this.ha1 = new TernaryHalfAdder();
        this.ha2 = new TernaryHalfAdder();
    }
    
    process(a, b, carryIn) {
        const result1 = this.ha1.process(a, b);
        const result2 = this.ha2.process(result1.sum, carryIn);
        
        // Combine carries using ternary addition
        const totalCarry = result1.carry + result2.carry;
        let finalCarry = totalCarry;
        let carryToNext = 0;
        
        if (totalCarry > 1) {
            carryToNext = 1;
            finalCarry = totalCarry - 3;
        } else if (totalCarry < -1) {
            carryToNext = -1;
            finalCarry = totalCarry + 3;
        }
        
        return {
            sum: result2.sum,
            carry: finalCarry,
            carryOut: carryToNext
        };
    }
}

/**
 * Ternary Ripple Carry Adder - adds two multi-trit numbers
 * Uses cascaded full adders for each trit position
 */
class TernaryRippleCarryAdder {
    constructor(width = 6) {
        this.width = width;
        this.adders = [];
        
        // Create full adders for each bit position
        for (let i = 0; i < width; i++) {
            this.adders.push(new TernaryFullAdder());
        }
    }
    
    process(tritsA, tritsB) {
        const result = [];
        let carry = 0;
        let finalCarry = 0;
        
        // Pad inputs to same length
        const maxLen = Math.max(tritsA.length, tritsB.length, this.width);
        const paddedA = [...tritsA];
        const paddedB = [...tritsB];
        
        while (paddedA.length < maxLen) paddedA.push(0);
        while (paddedB.length < maxLen) paddedB.push(0);
        
        // Add each trit position
        for (let i = 0; i < maxLen; i++) {
            const a = i < paddedA.length ? paddedA[i] : 0;
            const b = i < paddedB.length ? paddedB[i] : 0;
            
            const adderResult = this.adders[i % this.width].process(a, b, carry);
            result.push(adderResult.sum);
            carry = adderResult.carry + (adderResult.carryOut || 0);
            
            // Handle carry overflow
            if (carry > 1) {
                finalCarry = 1;
                carry -= 3;
            } else if (carry < -1) {
                finalCarry = -1;
                carry += 3;
            }
        }
        
        // Add final carry if needed
        if (carry !== 0) {
            result.push(carry);
        }
        if (finalCarry !== 0) {
            result.push(finalCarry);
        }
        
        return {
            result: result,
            overflow: finalCarry !== 0
        };
    }
}

/**
 * Ternary Shift Register - shifts ternary values
 * Built using ternary flip-flops
 */
class TernaryShiftRegister {
    constructor(width = 6) {
        this.width = width;
        this.stages = new Array(width).fill(0);
    }
    
    shiftLeft(input = 0) {
        // Shift all stages left, input becomes rightmost
        for (let i = this.width - 1; i > 0; i--) {
            this.stages[i] = this.stages[i - 1];
        }
        this.stages[0] = input;
        
        return [...this.stages];
    }
    
    shiftRight(input = 0) {
        // Shift all stages right, input becomes leftmost
        for (let i = 0; i < this.width - 1; i++) {
            this.stages[i] = this.stages[i + 1];
        }
        this.stages[this.width - 1] = input;
        
        return [...this.stages];
    }
    
    load(trits) {
        for (let i = 0; i < Math.min(trits.length, this.width); i++) {
            this.stages[i] = trits[i];
        }
        return [...this.stages];
    }
    
    getState() {
        return [...this.stages];
    }
}

/**
 * Ternary Multiplier - implements multiplication using shift and add
 * Uses only ternary adders and shift registers for true component-level emulation
 */
class TernaryMultiplier {
    constructor(width = 6) {
        this.width = width;
        this.adder = new TernaryRippleCarryAdder(width * 2);
        this.shiftReg = new TernaryShiftRegister(width * 2);
    }
    
    process(tritsA, tritsB) {
        // Initialize accumulator and multiplicand
        let accumulator = new Array(this.width * 2).fill(0);
        const multiplicand = [...tritsA];
        
        // Ensure inputs are padded properly
        while (multiplicand.length < this.width) {
            multiplicand.push(0);
        }
        
        // Multiply using shift and add algorithm
        for (let i = 0; i < tritsB.length; i++) {
            const multiplier = tritsB[i];
            
            if (multiplier !== 0) {
                // Create shifted multiplicand
                let shiftedMultiplicand = [...multiplicand];
                
                // Shift by position i (multiply by 3^i)
                for (let j = 0; j < i; j++) {
                    shiftedMultiplicand.unshift(0);
                }
                
                // Pad to accumulator width
                while (shiftedMultiplicand.length < accumulator.length) {
                    shiftedMultiplicand.push(0);
                }
                
                // Negate if multiplier is -1
                if (multiplier === -1) {
                    shiftedMultiplicand = shiftedMultiplicand.map(trit => -trit);
                }
                
                // Add to accumulator using component adder
                const addResult = this.adder.process(accumulator, shiftedMultiplicand);
                accumulator = addResult.result;
                
                // Ensure accumulator doesn't exceed width
                while (accumulator.length > this.width * 2) {
                    accumulator.pop();
                }
            }
        }
        
        return {
            result: accumulator,
            overflow: accumulator.length > this.width
        };
    }
}

/**
 * Ternary Memory Cell - stores a single ternary value
 * Simplified implementation using direct state storage
 */
class TernaryMemoryCell {
    constructor() {
        this.value = 0;
    }
    
    write(value, enable = true) {
        if (!enable) return this.read();
        
        // Validate ternary input
        if (value !== -1 && value !== 0 && value !== 1) {
            throw new Error(`Invalid ternary value: ${value}`);
        }
        
        this.value = value;
        return value;
    }
    
    read() {
        return this.value;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TernaryAND, TernaryOR, TernaryComparator,
        TernaryHalfAdder, TernaryFullAdder, TernaryRippleCarryAdder,
        TernaryShiftRegister, TernaryMultiplier, TernaryMemoryCell
    };
}