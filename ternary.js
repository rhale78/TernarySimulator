/**
 * Balanced Ternary Number System Implementation
 * Uses trits with values: -1, 0, +1
 * 6 trits = 1 tryte
 */

class BalancedTernary {
    constructor(value = 0) {
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

    // Addition
    add(other) {
        const otherBT = other instanceof BalancedTernary ? other : new BalancedTernary(other);
        const maxLength = Math.max(this.trits.length, otherBT.trits.length);
        const result = [];
        let carry = 0;

        for (let i = 0; i < maxLength || carry !== 0; i++) {
            const a = i < this.trits.length ? this.trits[i] : 0;
            const b = i < otherBT.trits.length ? otherBT.trits[i] : 0;
            let sum = a + b + carry;

            carry = 0;
            if (sum > 1) {
                carry = 1;
                sum -= 3;
            } else if (sum < -1) {
                carry = -1;
                sum += 3;
            }

            result.push(sum);
        }

        return new BalancedTernary(result);
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

    // Multiplication
    multiply(other) {
        const otherBT = other instanceof BalancedTernary ? other : new BalancedTernary(other);
        let result = new BalancedTernary(0);

        for (let i = 0; i < otherBT.trits.length; i++) {
            if (otherBT.trits[i] !== 0) {
                let partial = new BalancedTernary(this.trits);
                
                // Multiply by power of 3 (shift)
                for (let j = 0; j < i; j++) {
                    partial.trits.unshift(0);
                }
                
                // Multiply by trit value
                if (otherBT.trits[i] === -1) {
                    partial = partial.negate();
                }
                
                result = result.add(partial);
            }
        }

        return result;
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
    and(other) {
        const otherBT = other instanceof BalancedTernary ? other : new BalancedTernary(other);
        const maxLength = Math.max(this.trits.length, otherBT.trits.length);
        const result = [];

        for (let i = 0; i < maxLength; i++) {
            const a = i < this.trits.length ? this.trits[i] : 0;
            const b = i < otherBT.trits.length ? otherBT.trits[i] : 0;
            
            // Ternary AND: both must be +1 to result in +1
            if (a === 1 && b === 1) {
                result.push(1);
            } else if (a === -1 || b === -1) {
                result.push(-1);
            } else {
                result.push(0);
            }
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
            
            // Ternary OR: either +1 results in +1
            if (a === 1 || b === 1) {
                result.push(1);
            } else if (a === -1 && b === -1) {
                result.push(-1);
            } else if (a === -1 || b === -1) {
                result.push(0);
            } else {
                result.push(0);
            }
        }

        return new BalancedTernary(result);
    }

    not() {
        // Ternary NOT: -1 -> +1, 0 -> 0, +1 -> -1
        const result = this.trits.map(trit => -trit);
        return new BalancedTernary(result);
    }

    // Shift operations
    shiftLeft(positions = 1) {
        const result = [...this.trits];
        for (let i = 0; i < positions; i++) {
            result.unshift(0);
        }
        return new BalancedTernary(result);
    }

    shiftRight(positions = 1) {
        const result = [...this.trits];
        for (let i = 0; i < positions; i++) {
            result.shift();
        }
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
    module.exports = { BalancedTernary, Tryte, TernaryAddress, TernaryUtils };
}