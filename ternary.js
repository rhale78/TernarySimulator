/**
 * Balanced Ternary Number System Implementation
 * Uses trits with values: -1, 0, +1
 * 6 trits = 1 tryte
 * 
 * Modified to use component-based arithmetic for true ternary emulation
 */

// Import ternary components if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryGatesModule = require('./ternary_gates.js');
    global.TernaryAND = ternaryGatesModule.TernaryAND;
    global.TernaryOR = ternaryGatesModule.TernaryOR;
    global.TernaryComparator = ternaryGatesModule.TernaryComparator;
    global.TernaryHalfAdder = ternaryGatesModule.TernaryHalfAdder;
    global.TernaryFullAdder = ternaryGatesModule.TernaryFullAdder;
    global.TernaryRippleCarryAdder = ternaryGatesModule.TernaryRippleCarryAdder;
    global.TernaryShiftRegister = ternaryGatesModule.TernaryShiftRegister;
    global.TernaryMultiplier = ternaryGatesModule.TernaryMultiplier;
    global.TernaryMemoryCell = ternaryGatesModule.TernaryMemoryCell;
}

class BalancedTernary {
    constructor(value = 0) {
        // Initialize component-based arithmetic units
        this._initializeComponents();
        
        if (typeof value === 'string') {
            this.trits = this.parseString(value);
        } else if (typeof value === 'number') {
            this.trits = this.fromDecimal(value);
        } else if (Array.isArray(value)) {
            this.trits = [...value];
        } else {
            this.trits = [0];
        }
        this.normalize();
    }
    
    // Initialize component-based arithmetic units for true ternary emulation
    _initializeComponents() {
        // Create shared component instances for this class
        if (!BalancedTernary._sharedComponents) {
            BalancedTernary._sharedComponents = {
                adder: new TernaryRippleCarryAdder(12), // Support up to 12 trits
                multiplier: new TernaryMultiplier(12),
                andGate: new TernaryAND(),
                orGate: new TernaryOR(),
                comparator: new TernaryComparator(),
                shiftRegister: new TernaryShiftRegister(12)
            };
        }
        this.components = BalancedTernary._sharedComponents;
    }

    // Parse balanced ternary string (using T, 0, 1 or -, 0, +)
    parseString(str) {
        const trits = [];
        for (let char of str) {
            switch (char) {
                case 'T':
                case '-':
                    trits.push(-1);
                    break;
                case '0':
                    trits.push(0);
                    break;
                case '1':
                case '+':
                    trits.push(1);
                    break;
                default:
                    throw new Error(`Invalid balanced ternary digit: ${char}`);
            }
        }
        return trits.reverse(); // Store least significant trit first
    }

    // Convert decimal to balanced ternary
    fromDecimal(decimal) {
        if (decimal === 0) return [0];
        
        const trits = [];
        let n = Math.abs(decimal);
        
        while (n > 0) {
            const remainder = n % 3;
            n = Math.floor(n / 3);
            
            if (remainder === 0) {
                trits.push(0);
            } else if (remainder === 1) {
                trits.push(1);
            } else { // remainder === 2
                trits.push(-1);
                n += 1; // Carry
            }
        }
        
        if (decimal < 0) {
            // Negate all trits
            for (let i = 0; i < trits.length; i++) {
                trits[i] = -trits[i];
            }
        }
        
        return trits;
    }

    // Convert to decimal
    toDecimal() {
        let result = 0;
        let power = 1;
        
        for (let trit of this.trits) {
            result += trit * power;
            power *= 3;
        }
        
        return result;
    }

    // Convert to string representation
    toString(format = 'standard') {
        const reversed = [...this.trits].reverse();
        
        if (format === 'visual') {
            return reversed.map(trit => {
                switch (trit) {
                    case -1: return 'T';
                    case 0: return '0';
                    case 1: return '1';
                }
            }).join('');
        } else {
            return reversed.map(trit => {
                switch (trit) {
                    case -1: return '-';
                    case 0: return '0';
                    case 1: return '+';
                }
            }).join('');
        }
    }

    // Normalize by removing leading zeros
    normalize() {
        while (this.trits.length > 1 && this.trits[this.trits.length - 1] === 0) {
            this.trits.pop();
        }
    }

    // Ensure specific width (pad with zeros or truncate)
    toWidth(width) {
        const result = new BalancedTernary(this.trits);
        
        if (result.trits.length < width) {
            // Pad with zeros
            while (result.trits.length < width) {
                result.trits.push(0);
            }
        } else if (result.trits.length > width) {
            // Truncate
            result.trits = result.trits.slice(0, width);
        }
        
        return result;
    }

    // Addition using component-based arithmetic
    add(other) {
        const otherBT = other instanceof BalancedTernary ? other : new BalancedTernary(other);
        
        // Use the ternary ripple carry adder component for true emulation
        const addResult = this.components.adder.process(this.trits, otherBT.trits);
        
        return new BalancedTernary(addResult.result);
    }

    // Subtraction
    subtract(other) {
        const otherBT = other instanceof BalancedTernary ? other : new BalancedTernary(other);
        return this.add(otherBT.negate());
    }

    // Negation
    negate() {
        const negated = this.trits.map(trit => -trit);
        return new BalancedTernary(negated);
    }

    // Multiplication using component-based arithmetic
    multiply(other) {
        const otherBT = other instanceof BalancedTernary ? other : new BalancedTernary(other);
        
        // Use the ternary multiplier component for true emulation
        const mulResult = this.components.multiplier.process(this.trits, otherBT.trits);
        
        return new BalancedTernary(mulResult.result);
    }

    // Comparison
    compare(other) {
        const otherBT = other instanceof BalancedTernary ? other : new BalancedTernary(other);
        const diff = this.subtract(otherBT);
        const decimal = diff.toDecimal();
        
        if (decimal > 0) return 1;
        if (decimal < 0) return -1;
        return 0;
    }

    equals(other) {
        return this.compare(other) === 0;
    }

    // Bitwise operations adapted for ternary
    // Bitwise operations adapted for ternary using component gates
    and(other) {
        const otherBT = other instanceof BalancedTernary ? other : new BalancedTernary(other);
        const maxLength = Math.max(this.trits.length, otherBT.trits.length);
        const result = [];

        for (let i = 0; i < maxLength; i++) {
            const a = i < this.trits.length ? this.trits[i] : 0;
            const b = i < otherBT.trits.length ? otherBT.trits[i] : 0;
            
            // Use component-based ternary AND gate
            result.push(this.components.andGate.process(a, b));
        }

        return new BalancedTernary(result);
    }

    or(other) {
        const otherBT = other instanceof BalancedTernary ? other : new BalancedTernary(other);
        const maxLength = Math.max(this.trits.length, otherBT.trits.length);
        const result = [];

        for (let i = 0; i < maxLength; i++) {
            const a = i < this.trits.length ? this.trits[i] : 0;
            const b = i < otherBT.trits.length ? otherBT.trits[i] : 0;
            
            // Use component-based ternary OR gate
            result.push(this.components.orGate.process(a, b));
        }

        return new BalancedTernary(result);
    }

    not() {
        // Ternary NOT: -1 -> +1, 0 -> 0, +1 -> -1
        const result = this.trits.map(trit => -trit);
        return new BalancedTernary(result);
    }

    // Shift operations using component-based shift register
    shiftLeft(positions = 1) {
        // Load trits into shift register and shift left
        this.components.shiftRegister.load(this.trits);
        
        for (let i = 0; i < positions; i++) {
            this.components.shiftRegister.shiftLeft(0);
        }
        
        return new BalancedTernary(this.components.shiftRegister.getState());
    }

    shiftRight(positions = 1) {
        // Load trits into shift register and shift right
        this.components.shiftRegister.load(this.trits);
        
        for (let i = 0; i < positions; i++) {
            this.components.shiftRegister.shiftRight(0);
        }
        
        const result = this.components.shiftRegister.getState();
        return new BalancedTernary(result.length > 0 ? result : [0]);
    }
}

// Tryte class - 6 trits
class Tryte extends BalancedTernary {
    constructor(value = 0) {
        super(value);
        this.ensureWidth(6);
    }

    ensureWidth(width) {
        if (this.trits.length > width) {
            // Truncate, keeping least significant trits
            this.trits = this.trits.slice(0, width);
        } else {
            // Pad with zeros (or sign extend if needed)
            while (this.trits.length < width) {
                this.trits.push(0);
            }
        }
        // Normalize after ensuring width
        this.normalize();
    }

    // Get maximum and minimum values for a tryte
    static get MAX_VALUE() { return 364; } // Sum of 3^5 + 3^4 + ... + 3^0
    static get MIN_VALUE() { return -364; }

    toString(format = 'standard') {
        return super.toString(format);
    }
}

// Double-word class - 12 trits
class DoubleWord extends BalancedTernary {
    constructor(value = 0) {
        super(value);
        this.ensureWidth(12);
    }

    ensureWidth(width) {
        if (this.trits.length > width) {
            this.trits = this.trits.slice(0, width);
        } else {
            while (this.trits.length < width) {
                this.trits.push(0);
            }
        }
    }

    // Get maximum and minimum values for a double-word
    static get MAX_VALUE() { return 265720; } // Sum of 3^11 + 3^10 + ... + 3^0
    static get MIN_VALUE() { return -265720; }

    toString(format = 'standard') {
        return super.toString(format);
    }
}

// Triple-word class - 18 trits
class TripleWord extends BalancedTernary {
    constructor(value = 0) {
        super(value);
        this.ensureWidth(18);
    }

    ensureWidth(width) {
        if (this.trits.length > width) {
            this.trits = this.trits.slice(0, width);
        } else {
            while (this.trits.length < width) {
                this.trits.push(0);
            }
        }
    }

    // Get maximum and minimum values for a triple-word
    static get MAX_VALUE() { return 193710244; } // Sum of 3^17 + 3^16 + ... + 3^0
    static get MIN_VALUE() { return -193710244; }

    toString(format = 'standard') {
        return super.toString(format);
    }
}

// Address class - 9 trits (configurable)
class TernaryAddress extends BalancedTernary {
    constructor(value = 0, width = 9) {
        super(value);
        this.addressWidth = width;
        this.ensureWidth(width);
    }

    ensureWidth(width) {
        if (this.trits.length > width) {
            this.trits = this.trits.slice(0, width);
        } else {
            while (this.trits.length < width) {
                this.trits.push(0);
            }
        }
    }

    // Get maximum address value
    getMaxAddress() {
        let max = 0;
        for (let i = 0; i < this.addressWidth; i++) {
            max += Math.pow(3, i);
        }
        return max;
    }

    // Increment address
    increment() {
        const incremented = this.add(1);
        return new TernaryAddress(incremented.trits, this.addressWidth);
    }

    // Decrement address
    decrement() {
        const decremented = this.subtract(1);
        return new TernaryAddress(decremented.trits, this.addressWidth);
    }
}

// Utility functions
const TernaryUtils = {
    // Convert string of balanced ternary to display format
    formatTrits(tritString, width = null) {
        let formatted = tritString.replace(/-/g, 'T');
        if (width && formatted.length < width) {
            formatted = '0'.repeat(width - formatted.length) + formatted;
        }
        return formatted;
    },

    // Parse various formats into balanced ternary
    parse(input) {
        if (typeof input === 'number') {
            return new BalancedTernary(input);
        } else if (typeof input === 'string') {
            // Try to parse as decimal first
            const decimal = parseInt(input, 10);
            if (!isNaN(decimal)) {
                return new BalancedTernary(decimal);
            } else {
                // Parse as balanced ternary string
                return new BalancedTernary(input);
            }
        }
        return new BalancedTernary(0);
    },

    // Validate balanced ternary string
    isValidTernaryString(str) {
        return /^[T01+-]*$/.test(str);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BalancedTernary, Tryte, DoubleWord, TripleWord, TernaryAddress, TernaryUtils };
}