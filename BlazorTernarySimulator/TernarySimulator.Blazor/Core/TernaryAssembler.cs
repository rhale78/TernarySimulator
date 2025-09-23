using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace TernarySimulator.Blazor.Core
{
    /// <summary>
    /// Balanced Ternary Assembler
    /// Converts assembly language to machine code
    /// </summary>
    public class TernaryAssembler
    {
        private readonly Dictionary<string, int> _opcodes;
        private readonly Dictionary<string, int> _labels;
        private readonly Dictionary<string, int> _constants;
        private readonly List<UnresolvedReference> _unresolvedReferences;
        private int _currentAddress;

        public TernaryAssembler()
        {
            _opcodes = BuildOpcodeTable();
            _labels = new Dictionary<string, int>();
            _constants = new Dictionary<string, int>();
            _unresolvedReferences = new List<UnresolvedReference>();
        }

        /// <summary>
        /// Assemble source code into machine code
        /// </summary>
        public AssemblyResult Assemble(string sourceCode)
        {
            try
            {
                _labels.Clear();
                _constants.Clear();
                _unresolvedReferences.Clear();
                _currentAddress = 0;

                var lines = PreprocessSource(sourceCode);
                var instructions = new List<AssembledInstruction>();

                // First pass: collect labels and generate instructions
                foreach (var line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line.Content)) continue;

                    if (line.Content.Contains(':'))
                    {
                        // Label definition
                        var labelName = line.Content.Replace(":", "").Trim();
                        _labels[labelName] = _currentAddress;
                    }
                    else
                    {
                        // Instruction
                        var instruction = ParseInstruction(line);
                        if (instruction != null)
                        {
                            instructions.Add(instruction);
                            _currentAddress++;
                        }
                    }
                }

                // Second pass: resolve references
                foreach (var instruction in instructions)
                {
                    ResolveReferences(instruction);
                }

                return new AssemblyResult
                {
                    Success = true,
                    Instructions = instructions,
                    Labels = new Dictionary<string, int>(_labels),
                    Message = $"Assembly successful! Generated {instructions.Count} instructions"
                };
            }
            catch (Exception ex)
            {
                return new AssemblyResult
                {
                    Success = false,
                    Message = $"Assembly error: {ex.Message}",
                    Instructions = new List<AssembledInstruction>()
                };
            }
        }

        /// <summary>
        /// Preprocess source code (remove comments, handle directives)
        /// </summary>
        private List<SourceLine> PreprocessSource(string sourceCode)
        {
            var lines = sourceCode.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            var result = new List<SourceLine>();
            int lineNumber = 1;

            foreach (var rawLine in lines)
            {
                var line = rawLine.Trim();
                
                // Remove comments
                var commentIndex = line.IndexOf(';');
                if (commentIndex >= 0)
                {
                    line = line.Substring(0, commentIndex).Trim();
                }

                if (!string.IsNullOrWhiteSpace(line))
                {
                    // Handle constants/equates
                    if (line.ToUpper().Contains("EQU"))
                    {
                        HandleConstantDefinition(line);
                    }
                    else
                    {
                        result.Add(new SourceLine
                        {
                            LineNumber = lineNumber,
                            Content = line,
                            OriginalLine = rawLine
                        });
                    }
                }
                lineNumber++;
            }

            return result;
        }

        /// <summary>
        /// Handle constant definition (e.g., "CONST1 EQU 42")
        /// </summary>
        private void HandleConstantDefinition(string line)
        {
            var parts = line.Split(new[] {' ', '\t'}, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 3 && parts[1].ToUpper() == "EQU")
            {
                var name = parts[0];
                if (int.TryParse(parts[2], out int value))
                {
                    _constants[name] = value;
                }
            }
        }

        /// <summary>
        /// Parse a single instruction
        /// </summary>
        private AssembledInstruction? ParseInstruction(SourceLine line)
        {
            var parts = line.Content.Split(new[] {' ', '\t'}, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return null;

            var mnemonic = parts[0].ToUpper();
            var operandStr = parts.Length > 1 ? parts[1] : "";

            if (!_opcodes.ContainsKey(mnemonic))
            {
                throw new InvalidOperationException($"Unknown instruction: {mnemonic} at line {line.LineNumber}");
            }

            var opcode = _opcodes[mnemonic];
            var operand = ParseOperand(operandStr);

            // Encode instruction (3-trit opcode + 3-trit operand)
            var encodedInstruction = EncodeInstruction(opcode, operand);

            return new AssembledInstruction
            {
                Address = _currentAddress,
                Mnemonic = mnemonic,
                Operand = operand,
                OperandString = operandStr,
                MachineCode = encodedInstruction,
                SourceLine = line,
                IsResolved = !RequiresResolution(operandStr)
            };
        }

        /// <summary>
        /// Parse operand (immediate, direct, or label)
        /// </summary>
        private int ParseOperand(string operandStr)
        {
            if (string.IsNullOrEmpty(operandStr))
                return 0;

            // Immediate mode (#value)
            if (operandStr.StartsWith("#"))
            {
                var valueStr = operandStr.Substring(1);
                if (int.TryParse(valueStr, out int immediate))
                {
                    return -immediate; // Negative indicates immediate mode
                }
                if (_constants.ContainsKey(valueStr))
                {
                    return -_constants[valueStr];
                }
                throw new InvalidOperationException($"Invalid immediate value: {valueStr}");
            }

            // Direct value
            if (int.TryParse(operandStr, out int direct))
            {
                return direct;
            }

            // Constant reference
            if (_constants.ContainsKey(operandStr))
            {
                return _constants[operandStr];
            }

            // Label reference (will be resolved in second pass)
            if (_labels.ContainsKey(operandStr))
            {
                return _labels[operandStr];
            }

            // Unresolved reference
            _unresolvedReferences.Add(new UnresolvedReference
            {
                Address = _currentAddress,
                LabelName = operandStr
            });

            return 0; // Placeholder
        }

        /// <summary>
        /// Check if operand requires resolution
        /// </summary>
        private bool RequiresResolution(string operandStr)
        {
            if (string.IsNullOrEmpty(operandStr)) return false;
            if (operandStr.StartsWith("#")) return false;
            if (int.TryParse(operandStr, out _)) return false;
            if (_constants.ContainsKey(operandStr)) return false;
            return true;
        }

        /// <summary>
        /// Resolve label references
        /// </summary>
        private void ResolveReferences(AssembledInstruction instruction)
        {
            if (instruction.IsResolved) return;

            var operandStr = instruction.OperandString;
            if (_labels.ContainsKey(operandStr))
            {
                instruction.Operand = _labels[operandStr];
                instruction.MachineCode = EncodeInstruction(_opcodes[instruction.Mnemonic], instruction.Operand);
                instruction.IsResolved = true;
            }
            else
            {
                throw new InvalidOperationException($"Undefined label: {operandStr}");
            }
        }

        /// <summary>
        /// Encode instruction as 6-trit value
        /// </summary>
        private Tryte EncodeInstruction(int opcode, int operand)
        {
            // Encode as: operand * 27 + (opcode + 13)
            // This ensures opcode fits in 3 trits (-13 to +13 becomes 0 to 26)
            // and operand fits in remaining 3 trits
            var encoded = (operand + 13) * 27 + (opcode + 13);
            return new Tryte(Math.Max(Tryte.MinValue, Math.Min(Tryte.MaxValue, encoded)));
        }

        /// <summary>
        /// Build opcode table
        /// </summary>
        private Dictionary<string, int> BuildOpcodeTable()
        {
            return new Dictionary<string, int>
            {
                // Core data movement
                ["NOP"] = 0,
                ["LDA"] = 1, ["STA"] = 2, ["LDX"] = 3, ["STX"] = 4, ["MOV"] = 5,
                
                // Core arithmetic
                ["ADD"] = 6, ["SUB"] = 7, ["MUL"] = 8, ["INC"] = 9, ["DEC"] = 10,
                
                // Core logical
                ["AND"] = 11, ["OR"] = 12, ["NOT"] = 13,
                
                // Control flow
                ["CMP"] = -1, ["JMP"] = -2, ["JZ"] = -3, ["JP"] = -4, ["JN"] = -5,
                ["JSR"] = -6, ["RTS"] = -7,
                
                // Stack and I/O
                ["PSH"] = -8, ["POP"] = -9, ["IN"] = -10, ["OUT"] = -11,
                
                // Extended instructions
                ["LDX1"] = -12, ["HLT"] = -13,
                
                // Extended arithmetic
                ["DIV"] = 50, ["MOD"] = 51, ["XOR"] = 52,
                
                // Bit operations
                ["SHL"] = 53, ["SHR"] = 54, ["ROL"] = 55, ["ROR"] = 56,
                
                // Extended control flow
                ["JNZ"] = 57, ["JC"] = 58, ["JNC"] = 59,
                ["CALL"] = 60, ["RET"] = 61
            };
        }

        /// <summary>
        /// Disassemble instruction back to assembly
        /// </summary>
        public string DisassembleInstruction(Tryte instruction)
        {
            var value = instruction.ToDecimal();
            
            // Decode instruction
            var opcode = (value % 27) - 13;
            var operand = ((value / 27) % 27) - 13;
            
            // Find mnemonic
            var mnemonic = _opcodes.FirstOrDefault(kvp => kvp.Value == opcode).Key ?? $"UNKNOWN({opcode})";
            
            if (operand == 0 && (mnemonic == "NOP" || mnemonic == "HLT" || mnemonic == "RTS" || mnemonic == "RET"))
            {
                return mnemonic;
            }
            
            // Format operand
            string operandStr;
            if (operand < 0)
            {
                operandStr = $"#{-operand}"; // Immediate mode
            }
            else
            {
                operandStr = operand.ToString();
            }
            
            return $"{mnemonic} {operandStr}";
        }

        /// <summary>
        /// Get example program
        /// </summary>
        public static string GetExampleProgram()
        {
            return @"; Balanced Ternary Assembly Example
; Calculate 7 + 8 and store result

LDA #7      ; Load 7 into accumulator
ADD #8      ; Add 8 to accumulator  
STA 10      ; Store result at address 10
OUT         ; Output result to console
HLT         ; Halt program

; Result should be 15 (+-+0 in balanced ternary)";
        }

        /// <summary>
        /// Get loop example
        /// </summary>
        public static string GetLoopExampleProgram()
        {
            return @"; Loop Example - Count from 1 to 5
LDA #1      ; Load counter with 1
STA 20      ; Store counter at address 20

loop:       ; Label for loop start
OUT         ; Output current value
LDA 20      ; Load counter
INC         ; Increment counter
STA 20      ; Store back
CMP #6      ; Compare with 6
JN loop     ; Jump if not equal to 6
HLT         ; Halt when done";
        }

        /// <summary>
        /// Get conditional example
        /// </summary>
        public static string GetConditionalExampleProgram()
        {
            return @"; Conditional Example - Check if number is positive
LDA #-5     ; Load test value (-5)
CMP #0      ; Compare with 0
JP positive ; Jump if positive
LDA #0      ; Load 0 (negative result)
JMP done    ; Jump to end

positive:   ; Label for positive case
LDA #1      ; Load 1 (positive result)

done:       ; End label
OUT         ; Output result (0 for negative, 1 for positive)
HLT         ; Halt";
        }
    }

    /// <summary>
    /// Assembly result
    /// </summary>
    public class AssemblyResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public List<AssembledInstruction> Instructions { get; set; } = new();
        public Dictionary<string, int> Labels { get; set; } = new();
    }

    /// <summary>
    /// Assembled instruction
    /// </summary>
    public class AssembledInstruction
    {
        public int Address { get; set; }
        public string Mnemonic { get; set; } = "";
        public int Operand { get; set; }
        public string OperandString { get; set; } = "";
        public Tryte MachineCode { get; set; } = new(0);
        public SourceLine SourceLine { get; set; } = new();
        public bool IsResolved { get; set; }
        
        public override string ToString()
        {
            var operandDisplay = Operand < 0 ? $"#{-Operand}" : Operand.ToString();
            return $"{Address:D3}: {MachineCode} - {Mnemonic} {operandDisplay}";
        }
    }

    /// <summary>
    /// Source line information
    /// </summary>
    public class SourceLine
    {
        public int LineNumber { get; set; }
        public string Content { get; set; } = "";
        public string OriginalLine { get; set; } = "";
    }

    /// <summary>
    /// Unresolved reference
    /// </summary>
    public class UnresolvedReference
    {
        public int Address { get; set; }
        public string LabelName { get; set; } = "";
    }
}