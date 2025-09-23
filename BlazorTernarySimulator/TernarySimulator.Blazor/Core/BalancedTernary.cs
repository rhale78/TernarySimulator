using System;
using System.Text;
using System.Collections.Generic;
using System.Linq;

namespace TernarySimulator.Blazor.Core
{
    /// <summary>
    /// Balanced Ternary Number System Implementation
    /// Uses trits with values: -1, 0, +1
    /// 6 trits = 1 tryte
    /// </summary>
    public class BalancedTernary : IEquatable<BalancedTernary>, IComparable<BalancedTernary>
    {
        private List<int> _trits;

        public BalancedTernary(int value = 0)
        {
            _trits = FromDecimal(value);
            Normalize();
        }

        public BalancedTernary(string tritString)
        {
            _trits = ParseString(tritString);
            Normalize();
        }

        public BalancedTernary(IEnumerable<int> trits)
        {
            _trits = new List<int>(trits);
            Normalize();
        }

        private BalancedTernary(List<int> trits)
        {
            _trits = trits;
            Normalize();
        }

        public List<int> Trits => new List<int>(_trits);

        /// <summary>
        /// Convert decimal number to balanced ternary trits
        /// </summary>
        private List<int> FromDecimal(int value)
        {
            if (value == 0) return new List<int> { 0 };

            var trits = new List<int>();
            int n = Math.Abs(value);
            int sign = Math.Sign(value);

            while (n > 0)
            {
                int remainder = n % 3;
                n /= 3;

                switch (remainder)
                {
                    case 0:
                        trits.Add(0);
                        break;
                    case 1:
                        trits.Add(sign * 1);
                        break;
                    case 2:
                        trits.Add(sign * -1);
                        n += 1; // Carry
                        break;
                }
            }

            return trits;
        }

        /// <summary>
        /// Parse balanced ternary string
        /// </summary>
        private List<int> ParseString(string str)
        {
            var trits = new List<int>();
            
            foreach (char c in str.Reverse())
            {
                switch (c)
                {
                    case '+':
                    case '1':
                        trits.Add(1);
                        break;
                    case '0':
                        trits.Add(0);
                        break;
                    case '-':
                    case 'T':
                        trits.Add(-1);
                        break;
                    default:
                        throw new ArgumentException($"Invalid trit character: {c}");
                }
            }

            return trits;
        }

        /// <summary>
        /// Normalize trits to ensure proper balanced ternary representation
        /// </summary>
        private void Normalize()
        {
            // Remove leading zeros
            while (_trits.Count > 1 && _trits[_trits.Count - 1] == 0)
            {
                _trits.RemoveAt(_trits.Count - 1);
            }

            // Handle carries
            for (int i = 0; i < _trits.Count; i++)
            {
                if (_trits[i] > 1)
                {
                    int carry = _trits[i] / 3;
                    _trits[i] = _trits[i] % 3;
                    
                    if (_trits[i] == 2)
                    {
                        _trits[i] = -1;
                        carry++;
                    }

                    if (i + 1 >= _trits.Count)
                        _trits.Add(0);
                    
                    _trits[i + 1] += carry;
                }
                else if (_trits[i] < -1)
                {
                    int borrow = (-_trits[i] + 2) / 3;
                    _trits[i] = _trits[i] + borrow * 3;
                    
                    if (_trits[i] == 2)
                    {
                        _trits[i] = -1;
                        borrow++;
                    }

                    if (i + 1 >= _trits.Count)
                        _trits.Add(0);
                    
                    _trits[i + 1] -= borrow;
                }
            }

            // Remove leading zeros again after normalization
            while (_trits.Count > 1 && _trits[_trits.Count - 1] == 0)
            {
                _trits.RemoveAt(_trits.Count - 1);
            }
        }

        /// <summary>
        /// Convert to decimal value
        /// </summary>
        public int ToDecimal()
        {
            int result = 0;
            int power = 1;

            foreach (int trit in _trits)
            {
                result += trit * power;
                power *= 3;
            }

            return result;
        }

        /// <summary>
        /// Convert to string representation
        /// </summary>
        public override string ToString()
        {
            if (_trits.Count == 0) return "0";

            var sb = new StringBuilder();
            for (int i = _trits.Count - 1; i >= 0; i--)
            {
                switch (_trits[i])
                {
                    case 1:
                        sb.Append('+');
                        break;
                    case 0:
                        sb.Append('0');
                        break;
                    case -1:
                        sb.Append('-');
                        break;
                }
            }

            return sb.ToString();
        }

        /// <summary>
        /// Addition operation
        /// </summary>
        public BalancedTernary Add(BalancedTernary other)
        {
            int maxLength = Math.Max(_trits.Count, other._trits.Count);
            var result = new List<int>(maxLength + 1);
            int carry = 0;

            for (int i = 0; i < maxLength || carry != 0; i++)
            {
                int sum = carry;
                
                if (i < _trits.Count)
                    sum += _trits[i];
                
                if (i < other._trits.Count)
                    sum += other._trits[i];

                // Handle balanced ternary addition
                if (sum >= 2)
                {
                    result.Add(sum - 3);
                    carry = 1;
                }
                else if (sum <= -2)
                {
                    result.Add(sum + 3);
                    carry = -1;
                }
                else
                {
                    result.Add(sum);
                    carry = 0;
                }
            }

            return new BalancedTernary(result);
        }

        /// <summary>
        /// Subtraction operation
        /// </summary>
        public BalancedTernary Subtract(BalancedTernary other)
        {
            return Add(other.Negate());
        }

        /// <summary>
        /// Negation operation
        /// </summary>
        public BalancedTernary Negate()
        {
            var result = new List<int>(_trits.Count);
            foreach (int trit in _trits)
            {
                result.Add(-trit);
            }
            return new BalancedTernary(result);
        }

        /// <summary>
        /// Multiplication operation
        /// </summary>
        public BalancedTernary Multiply(BalancedTernary other)
        {
            if (IsZero() || other.IsZero())
                return new BalancedTernary(0);

            var result = new BalancedTernary(0);
            
            for (int i = 0; i < other._trits.Count; i++)
            {
                if (other._trits[i] != 0)
                {
                    var temp = ShiftLeft(i);
                    if (other._trits[i] == 1)
                    {
                        result = result.Add(temp);
                    }
                    else if (other._trits[i] == -1)
                    {
                        result = result.Subtract(temp);
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Division operation
        /// </summary>
        public BalancedTernary Divide(BalancedTernary other)
        {
            if (other.IsZero())
                throw new DivideByZeroException("Division by zero");

            if (IsZero())
                return new BalancedTernary(0);

            // Simple division using repeated subtraction
            var dividend = new BalancedTernary(_trits);
            var divisor = other;
            var quotient = new BalancedTernary(0);
            var one = new BalancedTernary(1);
            
            bool isNegative = (ToDecimal() < 0) ^ (other.ToDecimal() < 0);
            
            dividend = dividend.Abs();
            divisor = divisor.Abs();

            while (dividend.CompareTo(divisor) >= 0)
            {
                dividend = dividend.Subtract(divisor);
                quotient = quotient.Add(one);
            }

            return isNegative ? quotient.Negate() : quotient;
        }

        /// <summary>
        /// Modulo operation
        /// </summary>
        public BalancedTernary Modulo(BalancedTernary other)
        {
            if (other.IsZero())
                throw new DivideByZeroException("Modulo by zero");

            var quotient = Divide(other);
            var product = quotient.Multiply(other);
            return Subtract(product);
        }

        /// <summary>
        /// Absolute value
        /// </summary>
        public BalancedTernary Abs()
        {
            return ToDecimal() < 0 ? Negate() : new BalancedTernary(_trits);
        }

        /// <summary>
        /// Shift left (multiply by power of 3)
        /// </summary>
        public BalancedTernary ShiftLeft(int positions = 1)
        {
            if (positions <= 0) return new BalancedTernary(_trits);
            
            var result = new List<int>(positions);
            
            // Add zeros at the beginning
            for (int i = 0; i < positions; i++)
            {
                result.Add(0);
            }
            
            result.AddRange(_trits);
            return new BalancedTernary(result);
        }

        /// <summary>
        /// Shift right (divide by power of 3)
        /// </summary>
        public BalancedTernary ShiftRight(int positions = 1)
        {
            if (positions <= 0) return new BalancedTernary(_trits);
            if (positions >= _trits.Count) return new BalancedTernary(0);
            
            var result = _trits.Skip(positions).ToList();
            return new BalancedTernary(result);
        }

        /// <summary>
        /// Logical AND operation
        /// </summary>
        public BalancedTernary And(BalancedTernary other)
        {
            int maxLength = Math.Max(_trits.Count, other._trits.Count);
            var result = new List<int>(maxLength);

            for (int i = 0; i < maxLength; i++)
            {
                int a = i < _trits.Count ? _trits[i] : 0;
                int b = i < other._trits.Count ? other._trits[i] : 0;
                
                // Ternary AND: min(a, b)
                result.Add(Math.Min(a, b));
            }

            return new BalancedTernary(result);
        }

        /// <summary>
        /// Logical OR operation
        /// </summary>
        public BalancedTernary Or(BalancedTernary other)
        {
            int maxLength = Math.Max(_trits.Count, other._trits.Count);
            var result = new List<int>(maxLength);

            for (int i = 0; i < maxLength; i++)
            {
                int a = i < _trits.Count ? _trits[i] : 0;
                int b = i < other._trits.Count ? other._trits[i] : 0;
                
                // Ternary OR: max(a, b)
                result.Add(Math.Max(a, b));
            }

            return new BalancedTernary(result);
        }

        /// <summary>
        /// Logical NOT operation
        /// </summary>
        public BalancedTernary Not()
        {
            return Negate();
        }

        /// <summary>
        /// Check if value is zero
        /// </summary>
        public bool IsZero()
        {
            return _trits.Count == 1 && _trits[0] == 0;
        }

        /// <summary>
        /// Check if value is positive
        /// </summary>
        public bool IsPositive()
        {
            return ToDecimal() > 0;
        }

        /// <summary>
        /// Check if value is negative
        /// </summary>
        public bool IsNegative()
        {
            return ToDecimal() < 0;
        }

        // IEquatable implementation
        public bool Equals(BalancedTernary? other)
        {
            if (other == null) return false;
            return ToDecimal() == other.ToDecimal();
        }

        public override bool Equals(object? obj)
        {
            return Equals(obj as BalancedTernary);
        }

        public override int GetHashCode()
        {
            return ToDecimal().GetHashCode();
        }

        // IComparable implementation
        public int CompareTo(BalancedTernary? other)
        {
            if (other == null) return 1;
            return ToDecimal().CompareTo(other.ToDecimal());
        }

        // Operators
        public static BalancedTernary operator +(BalancedTernary a, BalancedTernary b) => a.Add(b);
        public static BalancedTernary operator -(BalancedTernary a, BalancedTernary b) => a.Subtract(b);
        public static BalancedTernary operator *(BalancedTernary a, BalancedTernary b) => a.Multiply(b);
        public static BalancedTernary operator /(BalancedTernary a, BalancedTernary b) => a.Divide(b);
        public static BalancedTernary operator %(BalancedTernary a, BalancedTernary b) => a.Modulo(b);
        public static BalancedTernary operator -(BalancedTernary a) => a.Negate();
        public static bool operator ==(BalancedTernary a, BalancedTernary b) => a?.Equals(b) ?? b is null;
        public static bool operator !=(BalancedTernary a, BalancedTernary b) => !(a == b);
        public static bool operator <(BalancedTernary a, BalancedTernary b) => a?.CompareTo(b) < 0;
        public static bool operator >(BalancedTernary a, BalancedTernary b) => a?.CompareTo(b) > 0;
        public static bool operator <=(BalancedTernary a, BalancedTernary b) => a?.CompareTo(b) <= 0;
        public static bool operator >=(BalancedTernary a, BalancedTernary b) => a?.CompareTo(b) >= 0;

        // Implicit conversions
        public static implicit operator BalancedTernary(int value) => new BalancedTernary(value);
        public static implicit operator int(BalancedTernary bt) => bt.ToDecimal();
    }

    /// <summary>
    /// 6-trit word (range: -364 to +364)
    /// </summary>
    public class Tryte : BalancedTernary
    {
        public const int TritCount = 6;
        public const int MinValue = -364;
        public const int MaxValue = 364;

        public Tryte(int value = 0) : base(Math.Max(MinValue, Math.Min(MaxValue, value)))
        {
            // Ensure exactly 6 trits
            var trits = Trits;
            while (trits.Count < TritCount)
            {
                trits.Add(0);
            }
            while (trits.Count > TritCount)
            {
                trits.RemoveAt(trits.Count - 1);
            }
        }

        public Tryte(string tritString) : base(tritString)
        {
            if (ToDecimal() < MinValue || ToDecimal() > MaxValue)
                throw new OverflowException($"Tryte value {ToDecimal()} out of range [{MinValue}, {MaxValue}]");
        }

        public static implicit operator Tryte(int value) => new Tryte(value);
        public static implicit operator int(Tryte tryte) => tryte.ToDecimal();
    }

    /// <summary>
    /// 9-trit address (range: 0 to 19,682)
    /// </summary>
    public class TernaryAddress : BalancedTernary
    {
        public const int TritCount = 9;
        public const int MaxValue = 19682;

        public TernaryAddress(int value = 0) : base(Math.Max(0, Math.Min(MaxValue, value)))
        {
            // Ensure exactly 9 trits
            var trits = Trits;
            while (trits.Count < TritCount)
            {
                trits.Add(0);
            }
            while (trits.Count > TritCount)
            {
                trits.RemoveAt(trits.Count - 1);
            }
        }

        public TernaryAddress(string tritString) : base(tritString)
        {
            int value = ToDecimal();
            if (value < 0 || value > MaxValue)
                throw new OverflowException($"Address value {value} out of range [0, {MaxValue}]");
        }

        public static implicit operator TernaryAddress(int value) => new TernaryAddress(value);
        public static implicit operator int(TernaryAddress addr) => addr.ToDecimal();
    }
}