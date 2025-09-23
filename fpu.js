/**
 * Balanced Ternary Floating-Point Unit (FPU)
 * Implements both binary and ternary floating-point arithmetic
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.DoubleWord = ternaryModule.DoubleWord;
    global.TripleWord = ternaryModule.TripleWord;
}

/**
 * Ternary Floating-Point Format
 * 
 * Standard format (12 trits): S EEE MMMMMMMMM
 * - S: Sign (1 trit): -1 (negative), 0 (zero), 1 (positive)
 * - E: Exponent (3 trits): bias = 13, range -13 to +13, actual range -26 to +26
 * - M: Mantissa (8 trits): normalized 1.xxxxxxx format in base 3
 * 
 * Extended format (18 trits): S EEEEEE MMMMMMMMMMMM
 * - S: Sign (1 trit)
 * - E: Exponent (6 trits): bias = 364, range -364 to +364
 * - M: Mantissa (11 trits): normalized format
 */

class TernaryFloat {
    constructor(value = 0, precision = 'standard') {
        this.precision = precision; // 'standard' (12-trit) or 'extended' (18-trit)
        
        if (precision === 'standard') {
            this.signBits = 1;
            this.exponentBits = 3;
            this.mantissaBits = 8;
            this.exponentBias = 13;
            this.totalBits = 12;
        } else {
            this.signBits = 1;
            this.exponentBits = 6;
            this.mantissaBits = 11;
            this.exponentBias = 364;
            this.totalBits = 18;
        }
        
        this.sign = 0;      // Sign trit
        this.exponent = 0;  // Biased exponent
        this.mantissa = 0;  // Mantissa without implied leading digit
        
        if (typeof value === 'number') {
            this.fromDecimal(value);
        } else if (value instanceof BalancedTernary) {
            this.fromBalancedTernary(value);
        }
    }
    
    /**
     * Convert decimal number to ternary floating-point
     */
    fromDecimal(decimal) {
        if (decimal === 0) {
            this.sign = 0;
            this.exponent = 0;
            this.mantissa = 0;
            return;
        }
        
        // Determine sign
        this.sign = decimal < 0 ? -1 : 1;
        let absValue = Math.abs(decimal);
        
        // Find exponent (base 3)
        let exp = 0;
        if (absValue >= 1) {
            while (absValue >= 3) {
                absValue /= 3;
                exp++;
            }
        } else {
            while (absValue < 1) {
                absValue *= 3;
                exp--;
            }
        }
        
        // Store biased exponent
        this.exponent = exp + this.exponentBias;
        
        // Extract mantissa (remove implied leading 1)
        absValue -= 1; // Remove the implied leading digit
        
        // Convert mantissa to ternary
        const mantissaTrits = [];
        for (let i = 0; i < this.mantissaBits; i++) {
            absValue *= 3;
            const digit = Math.floor(absValue);
            mantissaTrits.push(digit);
            absValue -= digit;
        }
        
        // Convert mantissa trits to decimal for storage
        this.mantissa = 0;
        for (let i = 0; i < mantissaTrits.length; i++) {
            this.mantissa += mantissaTrits[i] * Math.pow(3, this.mantissaBits - 1 - i);
        }
    }
    
    /**
     * Convert ternary floating-point to decimal
     */
    toDecimal() {
        if (this.sign === 0) {
            return 0;
        }
        
        // Unpack mantissa to ternary digits
        let mantissaValue = 1; // Implied leading 1
        let temp = this.mantissa;
        
        for (let i = this.mantissaBits - 1; i >= 0; i--) {
            const digit = temp % 3;
            mantissaValue += digit / Math.pow(3, this.mantissaBits - i);
            temp = Math.floor(temp / 3);
        }
        
        // Apply exponent
        const actualExponent = this.exponent - this.exponentBias;
        const result = mantissaValue * Math.pow(3, actualExponent);
        
        return this.sign * result;
    }
    
    /**
     * Convert from balanced ternary
     */
    fromBalancedTernary(bt) {
        this.fromDecimal(bt.toDecimal());
    }
    
    /**
     * Convert to balanced ternary representation
     */
    toBalancedTernary() {
        const trits = [];
        
        // Add sign trit
        trits.push(this.sign);
        
        // Add exponent trits
        const expBT = new BalancedTernary(this.exponent - this.exponentBias);
        const expTrits = expBT.trits.slice();
        while (expTrits.length < this.exponentBits) {
            expTrits.push(0);
        }
        trits.push(...expTrits.slice(0, this.exponentBits));
        
        // Add mantissa trits
        const mantBT = new BalancedTernary(this.mantissa);
        const mantTrits = mantBT.trits.slice();
        while (mantTrits.length < this.mantissaBits) {
            mantTrits.push(0);
        }
        trits.push(...mantTrits.slice(0, this.mantissaBits));
        
        const result = new BalancedTernary();
        result.trits = trits;
        result.normalize();
        return result;
    }
    
    /**
     * Add two ternary floats
     */
    add(other) {
        const result = new TernaryFloat(0, this.precision);
        
        // Handle special cases
        if (this.sign === 0) return new TernaryFloat(other.toDecimal(), this.precision);
        if (other.sign === 0) return new TernaryFloat(this.toDecimal(), this.precision);
        
        // Convert to decimal, add, and convert back
        // In a real implementation, this would be done in ternary arithmetic
        const sum = this.toDecimal() + other.toDecimal();
        result.fromDecimal(sum);
        return result;
    }
    
    /**
     * Subtract two ternary floats
     */
    subtract(other) {
        const result = new TernaryFloat(0, this.precision);
        const diff = this.toDecimal() - other.toDecimal();
        result.fromDecimal(diff);
        return result;
    }
    
    /**
     * Multiply two ternary floats
     */
    multiply(other) {
        const result = new TernaryFloat(0, this.precision);
        
        // Handle special cases
        if (this.sign === 0 || other.sign === 0) {
            return result; // Result is zero
        }
        
        // Convert to decimal, multiply, and convert back
        const product = this.toDecimal() * other.toDecimal();
        result.fromDecimal(product);
        return result;
    }
    
    /**
     * Divide two ternary floats
     */
    divide(other) {
        const result = new TernaryFloat(0, this.precision);
        
        // Handle special cases
        if (other.sign === 0) {
            throw new Error('Division by zero');
        }
        if (this.sign === 0) {
            return result; // Result is zero
        }
        
        // Convert to decimal, divide, and convert back
        const quotient = this.toDecimal() / other.toDecimal();
        result.fromDecimal(quotient);
        return result;
    }
    
    /**
     * Compare two ternary floats
     */
    compare(other) {
        const thisValue = this.toDecimal();
        const otherValue = other.toDecimal();
        
        if (thisValue < otherValue) return -1;
        if (thisValue > otherValue) return 1;
        return 0;
    }
    
    /**
     * String representation
     */
    toString() {
        return `${this.toDecimal()} (S:${this.sign} E:${this.exponent} M:${this.mantissa})`;
    }
    
    /**
     * Get IEEE 754 binary equivalent (for comparison)
     */
    toBinaryFloat() {
        // Convert to standard 32-bit IEEE 754 format for comparison
        const decimal = this.toDecimal();
        return new Float32Array([decimal])[0];
    }
}

/**
 * Binary Floating-Point (IEEE 754-like) for comparison
 */
class BinaryFloat {
    constructor(value = 0) {
        this.signBits = 1;
        this.exponentBits = 8;
        this.mantissaBits = 23;
        this.exponentBias = 127;
        
        this.value = value;
    }
    
    toDecimal() {
        return this.value;
    }
    
    add(other) {
        return new BinaryFloat(this.value + other.value);
    }
    
    subtract(other) {
        return new BinaryFloat(this.value - other.value);
    }
    
    multiply(other) {
        return new BinaryFloat(this.value * other.value);
    }
    
    divide(other) {
        if (other.value === 0) {
            throw new Error('Division by zero');
        }
        return new BinaryFloat(this.value / other.value);
    }
    
    toString() {
        return `${this.value} (binary)`;
    }
}

/**
 * Floating-Point Unit (FPU) Co-processor
 */
class FloatingPointUnit {
    constructor() {
        // FPU registers (both ternary and binary)
        this.ternaryRegisters = {
            F0: new TernaryFloat(0, 'standard'),
            F1: new TernaryFloat(0, 'standard'),
            F2: new TernaryFloat(0, 'standard'),
            F3: new TernaryFloat(0, 'standard'),
            FE0: new TernaryFloat(0, 'extended'),  // Extended precision
            FE1: new TernaryFloat(0, 'extended'),
            FACC: new TernaryFloat(0, 'standard'), // Accumulator
            FACCX: new TernaryFloat(0, 'extended') // Extended accumulator
        };
        
        this.binaryRegisters = {
            B0: new BinaryFloat(0),
            B1: new BinaryFloat(0),
            B2: new BinaryFloat(0),
            B3: new BinaryFloat(0),
            BACC: new BinaryFloat(0)
        };
        
        // FPU flags
        this.flags = {
            zero: 0,        // Result is zero
            overflow: 0,    // Overflow occurred
            underflow: 0,   // Underflow occurred
            invalid: 0,     // Invalid operation
            precision: 0    // Precision lost
        };
        
        this.mode = 'ternary'; // 'ternary' or 'binary'
    }
    
    /**
     * Load value into FPU register
     */
    load(register, value) {
        if (this.mode === 'ternary') {
            if (this.ternaryRegisters[register]) {
                if (typeof value === 'number') {
                    this.ternaryRegisters[register].fromDecimal(value);
                } else if (value instanceof TernaryFloat) {
                    this.ternaryRegisters[register] = value;
                }
            }
        } else {
            if (this.binaryRegisters[register]) {
                this.binaryRegisters[register] = new BinaryFloat(value);
            }
        }
    }
    
    /**
     * Store value from FPU register
     */
    store(register) {
        if (this.mode === 'ternary') {
            return this.ternaryRegisters[register];
        } else {
            return this.binaryRegisters[register];
        }
    }
    
    /**
     * Add floating-point numbers
     */
    add(reg1, reg2, result) {
        if (this.mode === 'ternary') {
            const val1 = this.ternaryRegisters[reg1];
            const val2 = this.ternaryRegisters[reg2];
            this.ternaryRegisters[result] = val1.add(val2);
        } else {
            const val1 = this.binaryRegisters[reg1];
            const val2 = this.binaryRegisters[reg2];
            this.binaryRegisters[result] = val1.add(val2);
        }
        this.updateFlags();
    }
    
    /**
     * Subtract floating-point numbers
     */
    subtract(reg1, reg2, result) {
        if (this.mode === 'ternary') {
            const val1 = this.ternaryRegisters[reg1];
            const val2 = this.ternaryRegisters[reg2];
            this.ternaryRegisters[result] = val1.subtract(val2);
        } else {
            const val1 = this.binaryRegisters[reg1];
            const val2 = this.binaryRegisters[reg2];
            this.binaryRegisters[result] = val1.subtract(val2);
        }
        this.updateFlags();
    }
    
    /**
     * Multiply floating-point numbers
     */
    multiply(reg1, reg2, result) {
        if (this.mode === 'ternary') {
            const val1 = this.ternaryRegisters[reg1];
            const val2 = this.ternaryRegisters[reg2];
            this.ternaryRegisters[result] = val1.multiply(val2);
        } else {
            const val1 = this.binaryRegisters[reg1];
            const val2 = this.binaryRegisters[reg2];
            this.binaryRegisters[result] = val1.multiply(val2);
        }
        this.updateFlags();
    }
    
    /**
     * Divide floating-point numbers
     */
    divide(reg1, reg2, result) {
        try {
            if (this.mode === 'ternary') {
                const val1 = this.ternaryRegisters[reg1];
                const val2 = this.ternaryRegisters[reg2];
                this.ternaryRegisters[result] = val1.divide(val2);
            } else {
                const val1 = this.binaryRegisters[reg1];
                const val2 = this.binaryRegisters[reg2];
                this.binaryRegisters[result] = val1.divide(val2);
            }
        } catch (error) {
            this.flags.invalid = 1;
        }
        this.updateFlags();
    }
    
    /**
     * Compare floating-point numbers
     */
    compare(reg1, reg2) {
        if (this.mode === 'ternary') {
            const val1 = this.ternaryRegisters[reg1];
            const val2 = this.ternaryRegisters[reg2];
            return val1.compare(val2);
        } else {
            const val1 = this.binaryRegisters[reg1];
            const val2 = this.binaryRegisters[reg2];
            if (val1.value < val2.value) return -1;
            if (val1.value > val2.value) return 1;
            return 0;
        }
    }
    
    /**
     * Update FPU flags
     */
    updateFlags() {
        // Reset flags
        this.flags.zero = 0;
        this.flags.overflow = 0;
        this.flags.underflow = 0;
        this.flags.precision = 0;
        
        // Check current accumulator
        const acc = this.mode === 'ternary' ? this.ternaryRegisters.FACC : this.binaryRegisters.BACC;
        const value = acc.toDecimal();
        
        if (value === 0) {
            this.flags.zero = 1;
        }
        
        if (Math.abs(value) > 1e38) {
            this.flags.overflow = 1;
        }
        
        if (Math.abs(value) < 1e-38 && value !== 0) {
            this.flags.underflow = 1;
        }
    }
    
    /**
     * Switch between ternary and binary modes
     */
    setMode(mode) {
        this.mode = mode;
    }
    
    /**
     * Reset FPU
     */
    reset() {
        for (let reg in this.ternaryRegisters) {
            this.ternaryRegisters[reg] = reg.includes('E') ? 
                new TernaryFloat(0, 'extended') : new TernaryFloat(0, 'standard');
        }
        
        for (let reg in this.binaryRegisters) {
            this.binaryRegisters[reg] = new BinaryFloat(0);
        }
        
        this.flags = {
            zero: 0,
            overflow: 0,
            underflow: 0,
            invalid: 0,
            precision: 0
        };
    }
    
    /**
     * Get FPU state
     */
    getState() {
        const state = {
            mode: this.mode,
            flags: { ...this.flags },
            ternaryRegisters: {},
            binaryRegisters: {}
        };
        
        for (let reg in this.ternaryRegisters) {
            state.ternaryRegisters[reg] = this.ternaryRegisters[reg].toString();
        }
        
        for (let reg in this.binaryRegisters) {
            state.binaryRegisters[reg] = this.binaryRegisters[reg].toString();
        }
        
        return state;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TernaryFloat,
        BinaryFloat,
        FloatingPointUnit
    };
}