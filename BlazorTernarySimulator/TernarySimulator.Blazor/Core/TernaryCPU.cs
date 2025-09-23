using System;
using System.Collections.Generic;
using System.Linq;

namespace TernarySimulator.Blazor.Core
{
    /// <summary>
    /// Balanced Ternary CPU Implementation
    /// Implements ALU, registers, and instruction execution
    /// </summary>
    public class TernaryCPU
    {
        private readonly TernaryMemory _memory;
        private readonly TernaryALU _alu;
        private readonly TernaryRegisters _registers;
        private Dictionary<string, InstructionInfo> _instructionSet;
        private readonly Stack<Tryte> _stack;
        private readonly HashSet<int> _breakpoints;

        public bool Halted { get; private set; }
        public bool Running { get; private set; }
        public int CycleCount { get; private set; }
        public Dictionary<string, int> InstructionFrequency { get; private set; }

        public TernaryCPU(TernaryMemory memory)
        {
            _memory = memory;
            _alu = new TernaryALU();
            _registers = new TernaryRegisters();
            _stack = new Stack<Tryte>();
            _breakpoints = new HashSet<int>();
            InstructionFrequency = new Dictionary<string, int>();
            _instructionSet = new Dictionary<string, InstructionInfo>(); // Initialize first
            
            BuildInstructionSet();
            Reset();
        }

        /// <summary>
        /// Reset CPU to initial state
        /// </summary>
        public void Reset()
        {
            _registers.Reset();
            _stack.Clear();
            Halted = false;
            Running = false;
            CycleCount = 0;
            InstructionFrequency.Clear();
        }

        /// <summary>
        /// Execute single instruction
        /// </summary>
        public void Step()
        {
            if (Halted) return;

            var pc = _registers.GetPC();
            
            // Check for breakpoint
            if (_breakpoints.Contains(pc))
            {
                OnBreakpointHit?.Invoke(new BreakpointEventArgs { Address = pc });
                return;
            }

            // Fetch instruction
            var instruction = _memory.Read(pc);
            
            // Decode and execute
            var (opcode, operand) = DecodeInstruction(instruction);
            ExecuteInstruction(opcode, operand);
            
            CycleCount++;
        }

        /// <summary>
        /// Run until halt or breakpoint
        /// </summary>
        public void Run()
        {
            Running = true;
            while (Running && !Halted)
            {
                Step();
                
                // Prevent infinite loops in browser
                if (CycleCount > 100000)
                {
                    Running = false;
                    break;
                }
            }
        }

        /// <summary>
        /// Pause execution
        /// </summary>
        public void Pause()
        {
            Running = false;
        }

        /// <summary>
        /// Decode instruction into opcode and operand
        /// </summary>
        private (int opcode, int operand) DecodeInstruction(Tryte instruction)
        {
            int value = instruction.ToDecimal();
            
            // Extract 3-trit opcode and 3-trit operand
            int opcode = value % 27 - 13; // Range: -13 to +13
            int operand = (value / 27) % 27 - 13; // Range: -13 to +13
            
            return (opcode, operand);
        }

        /// <summary>
        /// Execute instruction
        /// </summary>
        private void ExecuteInstruction(int opcode, int operand)
        {
            var instructionInfo = GetInstructionInfo(opcode);
            if (instructionInfo == null)
            {
                throw new InvalidOperationException($"Unknown opcode: {opcode}");
            }

            // Update instruction frequency
            if (InstructionFrequency.ContainsKey(instructionInfo.Name))
                InstructionFrequency[instructionInfo.Name]++;
            else
                InstructionFrequency[instructionInfo.Name] = 1;

            // Execute instruction
            instructionInfo.Execute(operand);
            
            // Increment PC unless it was modified by the instruction
            if (!instructionInfo.ModifiesPC)
            {
                _registers.IncrementPC();
            }
        }

        /// <summary>
        /// Get instruction info by opcode
        /// </summary>
        private InstructionInfo? GetInstructionInfo(int opcode)
        {
            return _instructionSet.Values.FirstOrDefault(i => i.Opcode == opcode);
        }

        /// <summary>
        /// Build instruction set
        /// </summary>
        private void BuildInstructionSet()
        {
            _instructionSet = new Dictionary<string, InstructionInfo>
            {
                // Core data movement
                ["NOP"] = new InstructionInfo(0, "NOP", NoOperation),
                ["LDA"] = new InstructionInfo(1, "LDA", LoadAccumulator),
                ["STA"] = new InstructionInfo(2, "STA", StoreAccumulator),
                ["LDX"] = new InstructionInfo(3, "LDX", LoadIndexRegister),
                ["STX"] = new InstructionInfo(4, "STX", StoreIndexRegister),
                ["MOV"] = new InstructionInfo(5, "MOV", MoveData),

                // Core arithmetic
                ["ADD"] = new InstructionInfo(6, "ADD", Add),
                ["SUB"] = new InstructionInfo(7, "SUB", Subtract),
                ["MUL"] = new InstructionInfo(8, "MUL", Multiply),
                ["INC"] = new InstructionInfo(9, "INC", Increment),
                ["DEC"] = new InstructionInfo(10, "DEC", Decrement),

                // Core logical
                ["AND"] = new InstructionInfo(11, "AND", And),
                ["OR"] = new InstructionInfo(12, "OR", Or),
                ["NOT"] = new InstructionInfo(13, "NOT", Not),

                // Control flow
                ["CMP"] = new InstructionInfo(-1, "CMP", Compare),
                ["JMP"] = new InstructionInfo(-2, "JMP", Jump, true),
                ["JZ"] = new InstructionInfo(-3, "JZ", JumpIfZero, true),
                ["JP"] = new InstructionInfo(-4, "JP", JumpIfPositive, true),
                ["JN"] = new InstructionInfo(-5, "JN", JumpIfNegative, true),
                ["JSR"] = new InstructionInfo(-6, "JSR", JumpSubroutine, true),
                ["RTS"] = new InstructionInfo(-7, "RTS", ReturnFromSubroutine, true),

                // Stack and I/O
                ["PSH"] = new InstructionInfo(-8, "PSH", Push),
                ["POP"] = new InstructionInfo(-9, "POP", Pop),
                ["IN"] = new InstructionInfo(-10, "IN", Input),
                ["OUT"] = new InstructionInfo(-11, "OUT", Output),

                // Extended instructions
                ["LDX1"] = new InstructionInfo(-12, "LDX1", LoadIndexRegister1),
                ["HLT"] = new InstructionInfo(-13, "HLT", Halt),
                
                // Extended arithmetic
                ["DIV"] = new InstructionInfo(50, "DIV", Divide),
                ["MOD"] = new InstructionInfo(51, "MOD", Modulo),
                ["XOR"] = new InstructionInfo(52, "XOR", Xor),
                
                // Bit operations
                ["SHL"] = new InstructionInfo(53, "SHL", ShiftLeft),
                ["SHR"] = new InstructionInfo(54, "SHR", ShiftRight),
                ["ROL"] = new InstructionInfo(55, "ROL", RotateLeft),
                ["ROR"] = new InstructionInfo(56, "ROR", RotateRight),
                
                // Extended control flow
                ["JNZ"] = new InstructionInfo(57, "JNZ", JumpIfNotZero, true),
                ["JC"] = new InstructionInfo(58, "JC", JumpIfCarry, true),
                ["JNC"] = new InstructionInfo(59, "JNC", JumpIfNotCarry, true),
                ["CALL"] = new InstructionInfo(60, "CALL", JumpSubroutine, true),
                ["RET"] = new InstructionInfo(61, "RET", ReturnFromSubroutine, true)
            };
        }

        #region Instruction Implementations

        private void NoOperation(int operand) { }

        private void LoadAccumulator(int operand)
        {
            if (operand < 0) // Immediate mode (negative operand indicates immediate)
            {
                _registers.SetACC(new Tryte(-operand));
            }
            else // Direct addressing
            {
                var value = _memory.Read(operand);
                _registers.SetACC(value);
            }
        }

        private void StoreAccumulator(int operand)
        {
            var acc = _registers.GetACC();
            _memory.Write(operand, acc);
        }

        private void LoadIndexRegister(int operand)
        {
            if (operand < 0)
            {
                _registers.SetIX(new Tryte(-operand));
            }
            else
            {
                var value = _memory.Read(operand);
                _registers.SetIX(value);
            }
        }

        private void StoreIndexRegister(int operand)
        {
            var ix = _registers.GetIX();
            _memory.Write(operand, ix);
        }

        private void LoadIndexRegister1(int operand)
        {
            if (operand < 0)
            {
                _registers.SetIX1(new Tryte(-operand));
            }
            else
            {
                var value = _memory.Read(operand);
                _registers.SetIX1(value);
            }
        }

        private void MoveData(int operand)
        {
            // Move from IX to operand address
            var ix = _registers.GetIX();
            _memory.Write(operand, ix);
        }

        private void Add(int operand)
        {
            var acc = _registers.GetACC();
            Tryte value;
            
            if (operand < 0)
            {
                value = new Tryte(-operand);
            }
            else
            {
                value = _memory.Read(operand);
            }
            
            var result = _alu.Add(acc, value);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, result.Carry);
        }

        private void Subtract(int operand)
        {
            var acc = _registers.GetACC();
            Tryte value;
            
            if (operand < 0)
            {
                value = new Tryte(-operand);
            }
            else
            {
                value = _memory.Read(operand);
            }
            
            var result = _alu.Subtract(acc, value);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, result.Carry);
        }

        private void Multiply(int operand)
        {
            var acc = _registers.GetACC();
            Tryte value;
            
            if (operand < 0)
            {
                value = new Tryte(-operand);
            }
            else
            {
                value = _memory.Read(operand);
            }
            
            var result = _alu.Multiply(acc, value);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void Divide(int operand)
        {
            var acc = _registers.GetACC();
            Tryte value;
            
            if (operand < 0)
            {
                value = new Tryte(-operand);
            }
            else
            {
                value = _memory.Read(operand);
            }
            
            if (value.ToDecimal() == 0)
            {
                throw new DivideByZeroException("Division by zero");
            }
            
            var result = _alu.Divide(acc, value);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void Modulo(int operand)
        {
            var acc = _registers.GetACC();
            Tryte value;
            
            if (operand < 0)
            {
                value = new Tryte(-operand);
            }
            else
            {
                value = _memory.Read(operand);
            }
            
            if (value.ToDecimal() == 0)
            {
                throw new DivideByZeroException("Modulo by zero");
            }
            
            var result = _alu.Modulo(acc, value);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void Increment(int operand)
        {
            var acc = _registers.GetACC();
            var result = _alu.Add(acc, new Tryte(1));
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, result.Carry);
        }

        private void Decrement(int operand)
        {
            var acc = _registers.GetACC();
            var result = _alu.Subtract(acc, new Tryte(1));
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, result.Carry);
        }

        private void And(int operand)
        {
            var acc = _registers.GetACC();
            Tryte value;
            
            if (operand < 0)
            {
                value = new Tryte(-operand);
            }
            else
            {
                value = _memory.Read(operand);
            }
            
            var result = _alu.And(acc, value);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void Or(int operand)
        {
            var acc = _registers.GetACC();
            Tryte value;
            
            if (operand < 0)
            {
                value = new Tryte(-operand);
            }
            else
            {
                value = _memory.Read(operand);
            }
            
            var result = _alu.Or(acc, value);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void Xor(int operand)
        {
            var acc = _registers.GetACC();
            Tryte value;
            
            if (operand < 0)
            {
                value = new Tryte(-operand);
            }
            else
            {
                value = _memory.Read(operand);
            }
            
            var result = _alu.Xor(acc, value);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void Not(int operand)
        {
            var acc = _registers.GetACC();
            var result = _alu.Not(acc);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void ShiftLeft(int operand)
        {
            var acc = _registers.GetACC();
            var result = _alu.ShiftLeft(acc, operand > 0 ? operand : 1);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void ShiftRight(int operand)
        {
            var acc = _registers.GetACC();
            var result = _alu.ShiftRight(acc, operand > 0 ? operand : 1);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void RotateLeft(int operand)
        {
            var acc = _registers.GetACC();
            var result = _alu.RotateLeft(acc, operand > 0 ? operand : 1);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void RotateRight(int operand)
        {
            var acc = _registers.GetACC();
            var result = _alu.RotateRight(acc, operand > 0 ? operand : 1);
            _registers.SetACC(result.Result);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, false);
        }

        private void Compare(int operand)
        {
            var acc = _registers.GetACC();
            Tryte value;
            
            if (operand < 0)
            {
                value = new Tryte(-operand);
            }
            else
            {
                value = _memory.Read(operand);
            }
            
            var result = _alu.Subtract(acc, value);
            _registers.SetFlags(result.Zero, result.Positive, result.Negative, result.Carry);
        }

        private void Jump(int operand)
        {
            _registers.SetPC(operand);
        }

        private void JumpIfZero(int operand)
        {
            if (_registers.GetZeroFlag())
            {
                _registers.SetPC(operand);
            }
        }

        private void JumpIfNotZero(int operand)
        {
            if (!_registers.GetZeroFlag())
            {
                _registers.SetPC(operand);
            }
        }

        private void JumpIfPositive(int operand)
        {
            if (_registers.GetPositiveFlag())
            {
                _registers.SetPC(operand);
            }
        }

        private void JumpIfNegative(int operand)
        {
            if (_registers.GetNegativeFlag())
            {
                _registers.SetPC(operand);
            }
        }

        private void JumpIfCarry(int operand)
        {
            if (_registers.GetCarryFlag())
            {
                _registers.SetPC(operand);
            }
        }

        private void JumpIfNotCarry(int operand)
        {
            if (!_registers.GetCarryFlag())
            {
                _registers.SetPC(operand);
            }
        }

        private void JumpSubroutine(int operand)
        {
            var pc = _registers.GetPC();
            _stack.Push(new Tryte(pc + 1));
            _registers.SetPC(operand);
        }

        private void ReturnFromSubroutine(int operand)
        {
            if (_stack.Count > 0)
            {
                var returnAddress = _stack.Pop();
                _registers.SetPC(returnAddress.ToDecimal());
            }
        }

        private void Push(int operand)
        {
            var acc = _registers.GetACC();
            _stack.Push(acc);
        }

        private void Pop(int operand)
        {
            if (_stack.Count > 0)
            {
                var value = _stack.Pop();
                _registers.SetACC(value);
            }
        }

        private void Input(int operand)
        {
            // Read from memory-mapped I/O
            var value = _memory.Read(MemoryMappedIO.ConsoleInputAddress);
            _registers.SetACC(value);
        }

        private void Output(int operand)
        {
            // Write to memory-mapped I/O
            var acc = _registers.GetACC();
            _memory.Write(MemoryMappedIO.ConsoleOutputAddress, acc);
        }

        private void Halt(int operand)
        {
            Halted = true;
            Running = false;
        }

        #endregion

        /// <summary>
        /// Set breakpoint at address
        /// </summary>
        public void SetBreakpoint(int address)
        {
            _breakpoints.Add(address);
        }

        /// <summary>
        /// Clear breakpoint at address
        /// </summary>
        public void ClearBreakpoint(int address)
        {
            _breakpoints.Remove(address);
        }

        /// <summary>
        /// Clear all breakpoints
        /// </summary>
        public void ClearAllBreakpoints()
        {
            _breakpoints.Clear();
        }

        /// <summary>
        /// Get current register state
        /// </summary>
        public TernaryRegisters GetRegisters()
        {
            return _registers;
        }

        /// <summary>
        /// Get performance statistics
        /// </summary>
        public Dictionary<string, object> GetPerformanceStats()
        {
            var mostUsed = InstructionFrequency.Any() 
                ? InstructionFrequency.OrderByDescending(kvp => kvp.Value).First()
                : new KeyValuePair<string, int>("None", 0);

            return new Dictionary<string, object>
            {
                ["cycleCount"] = CycleCount,
                ["instructionFrequency"] = InstructionFrequency,
                ["mostUsedInstruction"] = mostUsed.Key,
                ["totalInstructions"] = InstructionFrequency.Values.Sum(),
                ["halted"] = Halted,
                ["running"] = Running
            };
        }

        /// <summary>
        /// Export CPU state
        /// </summary>
        public Dictionary<string, object> ExportState()
        {
            return new Dictionary<string, object>
            {
                ["registers"] = _registers.ExportState(),
                ["stack"] = _stack.Select(t => t.ToDecimal()).ToList(),
                ["breakpoints"] = _breakpoints.ToList(),
                ["halted"] = Halted,
                ["running"] = Running,
                ["cycleCount"] = CycleCount,
                ["instructionFrequency"] = InstructionFrequency
            };
        }

        /// <summary>
        /// Import CPU state
        /// </summary>
        public void ImportState(Dictionary<string, object> state)
        {
            Reset();
            
            if (state.ContainsKey("registers") && state["registers"] is Dictionary<string, object> regState)
            {
                _registers.ImportState(regState);
            }
            
            if (state.ContainsKey("stack") && state["stack"] is List<object> stackData)
            {
                var reversedStack = stackData.AsEnumerable().Reverse().ToList();
                foreach (var item in reversedStack)
                {
                    if (item is int value)
                    {
                        _stack.Push(new Tryte(value));
                    }
                }
            }
            
            if (state.ContainsKey("breakpoints") && state["breakpoints"] is List<object> breakpoints)
            {
                foreach (var bp in breakpoints)
                {
                    if (bp is int address)
                    {
                        _breakpoints.Add(address);
                    }
                }
            }
            
            if (state.ContainsKey("halted") && state["halted"] is bool halted)
                Halted = halted;
                
            if (state.ContainsKey("running") && state["running"] is bool running)
                Running = running;
                
            if (state.ContainsKey("cycleCount") && state["cycleCount"] is int cycleCount)
                CycleCount = cycleCount;
                
            if (state.ContainsKey("instructionFrequency") && state["instructionFrequency"] is Dictionary<string, object> instrFreq)
            {
                foreach (var kvp in instrFreq)
                {
                    if (kvp.Value is int freq)
                    {
                        InstructionFrequency[kvp.Key] = freq;
                    }
                }
            }
        }

        /// <summary>
        /// Event fired when a breakpoint is hit
        /// </summary>
        public event Action<BreakpointEventArgs>? OnBreakpointHit;
    }

    /// <summary>
    /// Instruction information
    /// </summary>
    public class InstructionInfo
    {
        public int Opcode { get; }
        public string Name { get; }
        public Action<int> Execute { get; }
        public bool ModifiesPC { get; }

        public InstructionInfo(int opcode, string name, Action<int> execute, bool modifiesPC = false)
        {
            Opcode = opcode;
            Name = name;
            Execute = execute;
            ModifiesPC = modifiesPC;
        }
    }

    /// <summary>
    /// Breakpoint event arguments
    /// </summary>
    public class BreakpointEventArgs
    {
        public int Address { get; set; }
    }
}