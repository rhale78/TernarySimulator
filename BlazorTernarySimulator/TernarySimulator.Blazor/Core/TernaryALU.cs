using System;

namespace TernarySimulator.Blazor.Core
{
    /// <summary>
    /// Balanced Ternary Arithmetic Logic Unit
    /// Performs arithmetic and logical operations on ternary numbers
    /// </summary>
    public class TernaryALU
    {
        /// <summary>
        /// Add two trytes
        /// </summary>
        public ALUResult Add(Tryte a, Tryte b)
        {
            var sum = (BalancedTernary)a + (BalancedTernary)b;
            var result = new Tryte(sum.ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = Math.Abs(sum.ToDecimal()) > Tryte.MaxValue
            };
        }

        /// <summary>
        /// Subtract two trytes
        /// </summary>
        public ALUResult Subtract(Tryte a, Tryte b)
        {
            var difference = (BalancedTernary)a - (BalancedTernary)b;
            var result = new Tryte(difference.ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = Math.Abs(difference.ToDecimal()) > Tryte.MaxValue
            };
        }

        /// <summary>
        /// Multiply two trytes
        /// </summary>
        public ALUResult Multiply(Tryte a, Tryte b)
        {
            var product = (BalancedTernary)a * (BalancedTernary)b;
            var result = new Tryte(Math.Max(Tryte.MinValue, Math.Min(Tryte.MaxValue, product.ToDecimal())));
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = Math.Abs(product.ToDecimal()) > Tryte.MaxValue
            };
        }

        /// <summary>
        /// Divide two trytes
        /// </summary>
        public ALUResult Divide(Tryte a, Tryte b)
        {
            if (b.IsZero())
                throw new DivideByZeroException("Division by zero");

            var quotient = (BalancedTernary)a / (BalancedTernary)b;
            var result = new Tryte(quotient.ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = false
            };
        }

        /// <summary>
        /// Modulo operation
        /// </summary>
        public ALUResult Modulo(Tryte a, Tryte b)
        {
            if (b.IsZero())
                throw new DivideByZeroException("Modulo by zero");

            var remainder = (BalancedTernary)a % (BalancedTernary)b;
            var result = new Tryte(remainder.ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = false
            };
        }

        /// <summary>
        /// Logical AND operation
        /// </summary>
        public ALUResult And(Tryte a, Tryte b)
        {
            var and = ((BalancedTernary)a).And((BalancedTernary)b);
            var result = new Tryte(and.ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = false
            };
        }

        /// <summary>
        /// Logical OR operation
        /// </summary>
        public ALUResult Or(Tryte a, Tryte b)
        {
            var or = ((BalancedTernary)a).Or((BalancedTernary)b);
            var result = new Tryte(or.ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = false
            };
        }

        /// <summary>
        /// Logical XOR operation (implemented as (A OR B) AND NOT(A AND B))
        /// </summary>
        public ALUResult Xor(Tryte a, Tryte b)
        {
            var abt = (BalancedTernary)a;
            var bbt = (BalancedTernary)b;
            
            var or = abt.Or(bbt);
            var and = abt.And(bbt);
            var notAnd = and.Not();
            var xor = or.And(notAnd);
            
            var result = new Tryte(xor.ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = false
            };
        }

        /// <summary>
        /// Logical NOT operation
        /// </summary>
        public ALUResult Not(Tryte a)
        {
            var not = ((BalancedTernary)a).Not();
            var result = new Tryte(not.ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = false
            };
        }

        /// <summary>
        /// Shift left (multiply by power of 3)
        /// </summary>
        public ALUResult ShiftLeft(Tryte a, int positions)
        {
            var shifted = ((BalancedTernary)a).ShiftLeft(positions);
            var result = new Tryte(Math.Max(Tryte.MinValue, Math.Min(Tryte.MaxValue, shifted.ToDecimal())));
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = Math.Abs(shifted.ToDecimal()) > Tryte.MaxValue
            };
        }

        /// <summary>
        /// Shift right (divide by power of 3)
        /// </summary>
        public ALUResult ShiftRight(Tryte a, int positions)
        {
            var shifted = ((BalancedTernary)a).ShiftRight(positions);
            var result = new Tryte(shifted.ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = false
            };
        }

        /// <summary>
        /// Rotate left
        /// </summary>
        public ALUResult RotateLeft(Tryte a, int positions)
        {
            // For ternary rotation, we rotate the trits within the 6-trit boundary
            var trits = a.Trits;
            positions = positions % Tryte.TritCount;
            
            if (positions == 0)
            {
                return new ALUResult
                {
                    Result = a,
                    Zero = a.IsZero(),
                    Positive = a.IsPositive(),
                    Negative = a.IsNegative(),
                    Carry = false
                };
            }

            var rotated = new int[Tryte.TritCount];
            for (int i = 0; i < Tryte.TritCount; i++)
            {
                int sourceIndex = (i - positions + Tryte.TritCount) % Tryte.TritCount;
                rotated[i] = i < trits.Count ? trits[sourceIndex] : 0;
            }

            var result = new Tryte(new BalancedTernary(rotated).ToDecimal());
            
            return new ALUResult
            {
                Result = result,
                Zero = result.IsZero(),
                Positive = result.IsPositive(),
                Negative = result.IsNegative(),
                Carry = false
            };
        }

        /// <summary>
        /// Rotate right
        /// </summary>
        public ALUResult RotateRight(Tryte a, int positions)
        {
            // Rotate right is equivalent to rotate left by (TritCount - positions)
            return RotateLeft(a, Tryte.TritCount - (positions % Tryte.TritCount));
        }

        /// <summary>
        /// Compare two trytes
        /// </summary>
        public ALUResult Compare(Tryte a, Tryte b)
        {
            var comparison = a.CompareTo(b);
            
            return new ALUResult
            {
                Result = new Tryte(0), // Compare doesn't modify accumulator
                Zero = comparison == 0,
                Positive = comparison > 0,
                Negative = comparison < 0,
                Carry = false
            };
        }
    }

    /// <summary>
    /// ALU operation result
    /// </summary>
    public class ALUResult
    {
        public Tryte Result { get; set; } = new Tryte(0);
        public bool Zero { get; set; }
        public bool Positive { get; set; }
        public bool Negative { get; set; }
        public bool Carry { get; set; }
    }
}