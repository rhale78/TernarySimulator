using System;
using System.Collections.Generic;

namespace TernarySimulator.Blazor.Core
{
    /// <summary>
    /// Balanced Ternary CPU Registers
    /// Implements the register file for the ternary CPU
    /// </summary>
    public class TernaryRegisters
    {
        private Tryte _accumulator = new Tryte(0);
        private Tryte _indexRegister = new Tryte(0);
        private Tryte _indexRegister1 = new Tryte(0);
        private int _programCounter;
        private int _stackPointer;
        
        // Status flags
        private bool _zeroFlag;
        private bool _positiveFlag;
        private bool _negativeFlag;
        private bool _carryFlag;

        public TernaryRegisters()
        {
            Reset();
        }

        /// <summary>
        /// Reset all registers to initial values
        /// </summary>
        public void Reset()
        {
            _accumulator = new Tryte(0);
            _indexRegister = new Tryte(0);
            _indexRegister1 = new Tryte(0);
            _programCounter = 0;
            _stackPointer = 1000; // Start stack at address 1000
            
            _zeroFlag = true;
            _positiveFlag = false;
            _negativeFlag = false;
            _carryFlag = false;
        }

        // Accumulator (ACC)
        public Tryte GetACC() => _accumulator;
        public void SetACC(Tryte value) => _accumulator = value;

        // Index Register (IX)
        public Tryte GetIX() => _indexRegister;
        public void SetIX(Tryte value) => _indexRegister = value;

        // Index Register 1 (IX1)
        public Tryte GetIX1() => _indexRegister1;
        public void SetIX1(Tryte value) => _indexRegister1 = value;

        // Program Counter (PC)
        public int GetPC() => _programCounter;
        public void SetPC(int value) => _programCounter = Math.Max(0, value);
        public void IncrementPC() => _programCounter++;

        // Stack Pointer (SP)
        public int GetSP() => _stackPointer;
        public void SetSP(int value) => _stackPointer = value;
        public void IncrementSP() => _stackPointer++;
        public void DecrementSP() => _stackPointer--;

        // Status Flags
        public bool GetZeroFlag() => _zeroFlag;
        public bool GetPositiveFlag() => _positiveFlag;
        public bool GetNegativeFlag() => _negativeFlag;
        public bool GetCarryFlag() => _carryFlag;

        public void SetFlags(bool zero, bool positive, bool negative, bool carry)
        {
            _zeroFlag = zero;
            _positiveFlag = positive;
            _negativeFlag = negative;
            _carryFlag = carry;
        }

        public void SetZeroFlag(bool value) => _zeroFlag = value;
        public void SetPositiveFlag(bool value) => _positiveFlag = value;
        public void SetNegativeFlag(bool value) => _negativeFlag = value;
        public void SetCarryFlag(bool value) => _carryFlag = value;

        /// <summary>
        /// Get all register values as a dictionary for display
        /// </summary>
        public Dictionary<string, object> GetAllRegisters()
        {
            return new Dictionary<string, object>
            {
                ["ACC"] = new RegisterInfo
                {
                    Name = "ACC",
                    Value = _accumulator,
                    TernaryString = _accumulator.ToString(),
                    DecimalValue = _accumulator.ToDecimal(),
                    Description = "Accumulator"
                },
                ["IX"] = new RegisterInfo
                {
                    Name = "IX",
                    Value = _indexRegister,
                    TernaryString = _indexRegister.ToString(),
                    DecimalValue = _indexRegister.ToDecimal(),
                    Description = "Index Register"
                },
                ["IX1"] = new RegisterInfo
                {
                    Name = "IX1",
                    Value = _indexRegister1,
                    TernaryString = _indexRegister1.ToString(),
                    DecimalValue = _indexRegister1.ToDecimal(),
                    Description = "Index Register 1"
                },
                ["PC"] = new RegisterInfo
                {
                    Name = "PC",
                    Value = new TernaryAddress(_programCounter),
                    TernaryString = new TernaryAddress(_programCounter).ToString(),
                    DecimalValue = _programCounter,
                    Description = "Program Counter"
                },
                ["SP"] = new RegisterInfo
                {
                    Name = "SP",
                    Value = new TernaryAddress(_stackPointer),
                    TernaryString = new TernaryAddress(_stackPointer).ToString(),
                    DecimalValue = _stackPointer,
                    Description = "Stack Pointer"
                }
            };
        }

        /// <summary>
        /// Get status flags as a dictionary
        /// </summary>
        public Dictionary<string, object> GetFlags()
        {
            return new Dictionary<string, object>
            {
                ["Z"] = new FlagInfo
                {
                    Name = "Z",
                    Value = _zeroFlag,
                    Description = "Zero Flag",
                    DisplayValue = _zeroFlag ? "1" : "0"
                },
                ["P"] = new FlagInfo
                {
                    Name = "P",
                    Value = _positiveFlag,
                    Description = "Positive Flag",
                    DisplayValue = _positiveFlag ? "+" : "0"
                },
                ["N"] = new FlagInfo
                {
                    Name = "N",
                    Value = _negativeFlag,
                    Description = "Negative Flag",
                    DisplayValue = _negativeFlag ? "-" : "0"
                },
                ["C"] = new FlagInfo
                {
                    Name = "C",
                    Value = _carryFlag,
                    Description = "Carry Flag",
                    DisplayValue = _carryFlag ? "1" : "0"
                }
            };
        }

        /// <summary>
        /// Update flags based on a value
        /// </summary>
        public void UpdateFlags(Tryte value)
        {
            _zeroFlag = value.IsZero();
            _positiveFlag = value.IsPositive();
            _negativeFlag = value.IsNegative();
        }

        /// <summary>
        /// Export register state
        /// </summary>
        public Dictionary<string, object> ExportState()
        {
            return new Dictionary<string, object>
            {
                ["accumulator"] = _accumulator.ToDecimal(),
                ["indexRegister"] = _indexRegister.ToDecimal(),
                ["indexRegister1"] = _indexRegister1.ToDecimal(),
                ["programCounter"] = _programCounter,
                ["stackPointer"] = _stackPointer,
                ["zeroFlag"] = _zeroFlag,
                ["positiveFlag"] = _positiveFlag,
                ["negativeFlag"] = _negativeFlag,
                ["carryFlag"] = _carryFlag
            };
        }

        /// <summary>
        /// Import register state
        /// </summary>
        public void ImportState(Dictionary<string, object> state)
        {
            if (state.ContainsKey("accumulator") && state["accumulator"] is int acc)
                _accumulator = new Tryte(acc);
                
            if (state.ContainsKey("indexRegister") && state["indexRegister"] is int ix)
                _indexRegister = new Tryte(ix);
                
            if (state.ContainsKey("indexRegister1") && state["indexRegister1"] is int ix1)
                _indexRegister1 = new Tryte(ix1);
                
            if (state.ContainsKey("programCounter") && state["programCounter"] is int pc)
                _programCounter = pc;
                
            if (state.ContainsKey("stackPointer") && state["stackPointer"] is int sp)
                _stackPointer = sp;
                
            if (state.ContainsKey("zeroFlag") && state["zeroFlag"] is bool zf)
                _zeroFlag = zf;
                
            if (state.ContainsKey("positiveFlag") && state["positiveFlag"] is bool pf)
                _positiveFlag = pf;
                
            if (state.ContainsKey("negativeFlag") && state["negativeFlag"] is bool nf)
                _negativeFlag = nf;
                
            if (state.ContainsKey("carryFlag") && state["carryFlag"] is bool cf)
                _carryFlag = cf;
        }

        /// <summary>
        /// Get register by name
        /// </summary>
        public object? GetRegister(string name)
        {
            return name.ToUpper() switch
            {
                "ACC" => _accumulator,
                "IX" => _indexRegister,
                "IX1" => _indexRegister1,
                "PC" => _programCounter,
                "SP" => _stackPointer,
                _ => null
            };
        }

        /// <summary>
        /// Set register by name
        /// </summary>
        public bool SetRegister(string name, object value)
        {
            try
            {
                switch (name.ToUpper())
                {
                    case "ACC":
                        _accumulator = value is Tryte t ? t : new Tryte(Convert.ToInt32(value));
                        return true;
                    case "IX":
                        _indexRegister = value is Tryte t2 ? t2 : new Tryte(Convert.ToInt32(value));
                        return true;
                    case "IX1":
                        _indexRegister1 = value is Tryte t3 ? t3 : new Tryte(Convert.ToInt32(value));
                        return true;
                    case "PC":
                        _programCounter = Convert.ToInt32(value);
                        return true;
                    case "SP":
                        _stackPointer = Convert.ToInt32(value);
                        return true;
                    default:
                        return false;
                }
            }
            catch
            {
                return false;
            }
        }
    }

    /// <summary>
    /// Register information for display
    /// </summary>
    public class RegisterInfo
    {
        public string Name { get; set; } = "";
        public object Value { get; set; } = new Tryte(0);
        public string TernaryString { get; set; } = "";
        public int DecimalValue { get; set; }
        public string Description { get; set; } = "";
    }

    /// <summary>
    /// Flag information for display
    /// </summary>
    public class FlagInfo
    {
        public string Name { get; set; } = "";
        public bool Value { get; set; }
        public string Description { get; set; } = "";
        public string DisplayValue { get; set; } = "";
    }
}