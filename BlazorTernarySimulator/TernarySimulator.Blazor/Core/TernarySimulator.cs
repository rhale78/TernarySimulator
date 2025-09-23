using System;
using System.Collections.Generic;

namespace TernarySimulator.Blazor.Core
{
    /// <summary>
    /// Main Ternary Simulator Controller
    /// Coordinates all components and provides simulation interface
    /// </summary>
    public class TernarySimulator
    {
        private readonly TernaryMemory _memory;
        private readonly TernaryCPU _cpu;
        private readonly TernaryAssembler _assembler;
        private readonly MemoryMappedIO _io;

        public TernaryMemory Memory => _memory;
        public TernaryCPU CPU => _cpu;
        public TernaryAssembler Assembler => _assembler;

        // Events for UI updates
        public event Action<string>? OnConsoleOutput;
        public event Action<string>? OnMessage;
        public event Action? OnStateChanged;

        public TernarySimulator()
        {
            _memory = new TernaryMemory();
            _cpu = new TernaryCPU(_memory);
            _assembler = new TernaryAssembler();
            _io = new MemoryMappedIO(_memory);

            // Set up console I/O device
            _io.RegisterDevice(MemoryMappedIO.ConsoleOutputAddress, new ConsoleOutputDevice(this));
            _io.RegisterDevice(MemoryMappedIO.ConsoleInputAddress, new ConsoleInputDevice());

            // Subscribe to CPU events
            _cpu.OnBreakpointHit += OnCPUBreakpointHit;
            _memory.OnWatchpointHit += OnMemoryWatchpointHit;
        }

        /// <summary>
        /// Assemble source code and load into memory
        /// </summary>
        public AssemblyResult AssembleAndLoad(string sourceCode)
        {
            try
            {
                var result = _assembler.Assemble(sourceCode);
                
                if (result.Success)
                {
                    // Load instructions into memory
                    for (int i = 0; i < result.Instructions.Count; i++)
                    {
                        _memory.Write(i, result.Instructions[i].MachineCode);
                    }
                    
                    OnMessage?.Invoke($"Assembly successful! Loaded {result.Instructions.Count} instructions.");
                    OnStateChanged?.Invoke();
                }
                else
                {
                    OnMessage?.Invoke($"Assembly failed: {result.Message}");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                var errorResult = new AssemblyResult
                {
                    Success = false,
                    Message = $"Assembly error: {ex.Message}"
                };
                
                OnMessage?.Invoke(errorResult.Message);
                return errorResult;
            }
        }

        /// <summary>
        /// Reset the simulator to initial state
        /// </summary>
        public void Reset()
        {
            _cpu.Reset();
            _memory.Clear();
            OnMessage?.Invoke("Simulator reset.");
            OnStateChanged?.Invoke();
        }

        /// <summary>
        /// Run the program until halt or breakpoint
        /// </summary>
        public void Run()
        {
            try
            {
                if (_cpu.Halted)
                {
                    OnMessage?.Invoke("CPU is halted. Reset to run again.");
                    return;
                }

                _cpu.Run();
                
                if (_cpu.Halted)
                {
                    OnMessage?.Invoke($"Program completed after {_cpu.CycleCount} cycles.");
                }
                else
                {
                    OnMessage?.Invoke($"Program paused after {_cpu.CycleCount} cycles.");
                }
                
                OnStateChanged?.Invoke();
            }
            catch (Exception ex)
            {
                OnMessage?.Invoke($"Runtime error: {ex.Message}");
            }
        }

        /// <summary>
        /// Execute a single instruction
        /// </summary>
        public void Step()
        {
            try
            {
                if (_cpu.Halted)
                {
                    OnMessage?.Invoke("CPU is halted. Reset to run again.");
                    return;
                }

                _cpu.Step();
                OnStateChanged?.Invoke();
                
                if (_cpu.Halted)
                {
                    OnMessage?.Invoke($"Program halted after {_cpu.CycleCount} cycles.");
                }
            }
            catch (Exception ex)
            {
                OnMessage?.Invoke($"Step error: {ex.Message}");
            }
        }

        /// <summary>
        /// Pause execution
        /// </summary>
        public void Pause()
        {
            _cpu.Pause();
            OnMessage?.Invoke("Execution paused.");
            OnStateChanged?.Invoke();
        }

        /// <summary>
        /// Set a breakpoint at the specified address
        /// </summary>
        public void SetBreakpoint(int address)
        {
            _cpu.SetBreakpoint(address);
            OnMessage?.Invoke($"Breakpoint set at address {address}.");
        }

        /// <summary>
        /// Clear a breakpoint at the specified address
        /// </summary>
        public void ClearBreakpoint(int address)
        {
            _cpu.ClearBreakpoint(address);
            OnMessage?.Invoke($"Breakpoint cleared at address {address}.");
        }

        /// <summary>
        /// Set a memory watchpoint
        /// </summary>
        public void SetMemoryWatchpoint(int address)
        {
            _memory.SetWatchpoint(address);
            OnMessage?.Invoke($"Memory watchpoint set at address {address}.");
        }

        /// <summary>
        /// Clear a memory watchpoint
        /// </summary>
        public void ClearMemoryWatchpoint(int address)
        {
            _memory.ClearWatchpoint(address);
            OnMessage?.Invoke($"Memory watchpoint cleared at address {address}.");
        }

        /// <summary>
        /// Get current simulator state for display
        /// </summary>
        public SimulatorState GetState()
        {
            return new SimulatorState
            {
                CPU = new CPUState
                {
                    Registers = _cpu.GetRegisters().GetAllRegisters(),
                    Flags = _cpu.GetRegisters().GetFlags(),
                    Halted = _cpu.Halted,
                    Running = _cpu.Running,
                    CycleCount = _cpu.CycleCount,
                    InstructionFrequency = _cpu.InstructionFrequency
                },
                Memory = new MemoryState
                {
                    CurrentPage = _memory.GetPage(0),
                    RecentAccesses = _memory.GetRecentAccesses(10),
                    RecentChanges = _memory.GetRecentChanges(10),
                    Watchpoints = _memory.GetWatchpoints().ToList()
                }
            };
        }

        /// <summary>
        /// Export complete simulator state
        /// </summary>
        public Dictionary<string, object> ExportState()
        {
            return new Dictionary<string, object>
            {
                ["cpu"] = _cpu.ExportState(),
                ["memory"] = _memory.ExportState(),
                ["timestamp"] = DateTime.Now,
                ["version"] = "1.0"
            };
        }

        /// <summary>
        /// Import complete simulator state
        /// </summary>
        public void ImportState(Dictionary<string, object> state)
        {
            try
            {
                if (state.ContainsKey("cpu") && state["cpu"] is Dictionary<string, object> cpuState)
                {
                    _cpu.ImportState(cpuState);
                }
                
                if (state.ContainsKey("memory") && state["memory"] is Dictionary<string, object> memoryState)
                {
                    _memory.ImportState(memoryState);
                }
                
                OnMessage?.Invoke("State imported successfully.");
                OnStateChanged?.Invoke();
            }
            catch (Exception ex)
            {
                OnMessage?.Invoke($"Error importing state: {ex.Message}");
            }
        }

        /// <summary>
        /// Get performance statistics
        /// </summary>
        public Dictionary<string, object> GetPerformanceStats()
        {
            return _cpu.GetPerformanceStats();
        }

        /// <summary>
        /// Output to console (called by I/O device)
        /// </summary>
        internal void OutputToConsole(string text)
        {
            OnConsoleOutput?.Invoke(text);
        }

        /// <summary>
        /// Handle CPU breakpoint hit
        /// </summary>
        private void OnCPUBreakpointHit(BreakpointEventArgs args)
        {
            OnMessage?.Invoke($"Breakpoint hit at address {args.Address}.");
            OnStateChanged?.Invoke();
        }

        /// <summary>
        /// Handle memory watchpoint hit
        /// </summary>
        private void OnMemoryWatchpointHit(WatchpointEventArgs args)
        {
            var action = args.Type == MemoryAccessType.Read ? "read from" : "written to";
            OnMessage?.Invoke($"Watchpoint: Memory {action} address {args.Address}, value: {args.Value}");
            OnStateChanged?.Invoke();
        }
    }

    /// <summary>
    /// Complete simulator state
    /// </summary>
    public class SimulatorState
    {
        public CPUState CPU { get; set; } = new();
        public MemoryState Memory { get; set; } = new();
    }

    /// <summary>
    /// CPU state for display
    /// </summary>
    public class CPUState
    {
        public Dictionary<string, object> Registers { get; set; } = new();
        public Dictionary<string, object> Flags { get; set; } = new();
        public bool Halted { get; set; }
        public bool Running { get; set; }
        public int CycleCount { get; set; }
        public Dictionary<string, int> InstructionFrequency { get; set; } = new();
    }

    /// <summary>
    /// Memory state for display
    /// </summary>
    public class MemoryState
    {
        public List<MemoryCell> CurrentPage { get; set; } = new();
        public List<MemoryAccess> RecentAccesses { get; set; } = new();
        public List<MemoryChange> RecentChanges { get; set; } = new();
        public List<int> Watchpoints { get; set; } = new();
    }

    /// <summary>
    /// Console output device
    /// </summary>
    public class ConsoleOutputDevice : IMemoryMappedDevice
    {
        private readonly TernarySimulator _simulator;

        public ConsoleOutputDevice(TernarySimulator simulator)
        {
            _simulator = simulator;
        }

        public Tryte Read()
        {
            return new Tryte(0); // Not used for output
        }

        public void Write(Tryte value)
        {
            // Convert tryte value to character and output
            int charCode = value.ToDecimal();
            if (charCode >= 32 && charCode <= 126) // Printable ASCII
            {
                _simulator.OutputToConsole(((char)charCode).ToString());
            }
            else if (charCode == 10) // Newline
            {
                _simulator.OutputToConsole("\n");
            }
            else
            {
                _simulator.OutputToConsole(charCode.ToString());
            }
        }
    }

    /// <summary>
    /// Console input device (placeholder)
    /// </summary>
    public class ConsoleInputDevice : IMemoryMappedDevice
    {
        public Tryte Read()
        {
            // For now, return 0. In a full implementation, this would
            // interface with keyboard input
            return new Tryte(0);
        }

        public void Write(Tryte value)
        {
            // Not used for input
        }
    }
}