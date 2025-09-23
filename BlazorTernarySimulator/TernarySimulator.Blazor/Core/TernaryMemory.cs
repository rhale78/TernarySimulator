using System;
using System.Collections.Generic;
using System.Linq;

namespace TernarySimulator.Blazor.Core
{
    /// <summary>
    /// Balanced Ternary Memory System
    /// Implements RAM with balanced ternary storage
    /// Configurable address width (default 9 trits)
    /// </summary>
    public class TernaryMemory
    {
        private readonly Dictionary<int, Tryte> _memory;
        private readonly HashSet<int> _watchpoints;
        private readonly List<MemoryAccess> _accessHistory;
        private readonly List<MemoryChange> _changeHistory;

        public int AddressWidth { get; }
        public int MaxAddress { get; }
        public int PageSize { get; set; } = 16;

        public TernaryMemory(int addressWidth = 9)
        {
            AddressWidth = addressWidth;
            MaxAddress = CalculateMaxAddress();
            _memory = new Dictionary<int, Tryte>();
            _watchpoints = new HashSet<int>();
            _accessHistory = new List<MemoryAccess>();
            _changeHistory = new List<MemoryChange>();
        }

        private int CalculateMaxAddress()
        {
            int max = 0;
            for (int i = 0; i < AddressWidth; i++)
            {
                max += (int)Math.Pow(3, i);
            }
            return max;
        }

        /// <summary>
        /// Validate address is within bounds
        /// </summary>
        private TernaryAddress ValidateAddress(object address)
        {
            TernaryAddress addr;
            
            if (address is TernaryAddress ta)
                addr = ta;
            else if (address is int i)
                addr = new TernaryAddress(i);
            else
                throw new ArgumentException("Address must be TernaryAddress or int");

            int decimalValue = addr.ToDecimal();
            
            if (decimalValue < 0 || decimalValue > MaxAddress)
            {
                throw new ArgumentOutOfRangeException(nameof(address), 
                    $"Address {decimalValue} out of bounds [0, {MaxAddress}]");
            }
            
            return addr;
        }

        /// <summary>
        /// Read a tryte from memory
        /// </summary>
        public Tryte Read(object address)
        {
            var addr = ValidateAddress(address);
            int key = addr.ToDecimal();
            
            // Log access
            _accessHistory.Add(new MemoryAccess
            {
                Address = key,
                Type = MemoryAccessType.Read,
                Timestamp = DateTime.Now
            });

            // Check for watchpoint
            if (_watchpoints.Contains(key))
            {
                // Trigger watchpoint event
                OnWatchpointHit?.Invoke(new WatchpointEventArgs 
                { 
                    Address = key, 
                    Type = MemoryAccessType.Read,
                    Value = _memory.GetValueOrDefault(key, new Tryte(0))
                });
            }

            return _memory.GetValueOrDefault(key, new Tryte(0));
        }

        /// <summary>
        /// Write a tryte to memory
        /// </summary>
        public void Write(object address, Tryte value)
        {
            var addr = ValidateAddress(address);
            int key = addr.ToDecimal();
            
            var oldValue = _memory.GetValueOrDefault(key, new Tryte(0));
            
            // Log access
            _accessHistory.Add(new MemoryAccess
            {
                Address = key,
                Type = MemoryAccessType.Write,
                Timestamp = DateTime.Now,
                Value = value
            });

            // Log change
            _changeHistory.Add(new MemoryChange
            {
                Address = key,
                OldValue = oldValue,
                NewValue = value,
                Timestamp = DateTime.Now
            });

            // Store value
            _memory[key] = value;

            // Check for watchpoint
            if (_watchpoints.Contains(key))
            {
                OnWatchpointHit?.Invoke(new WatchpointEventArgs 
                { 
                    Address = key, 
                    Type = MemoryAccessType.Write,
                    Value = value,
                    OldValue = oldValue
                });
            }
        }

        /// <summary>
        /// Clear all memory
        /// </summary>
        public void Clear()
        {
            _memory.Clear();
            _accessHistory.Clear();
            _changeHistory.Clear();
        }

        /// <summary>
        /// Get memory dump for a range of addresses
        /// </summary>
        public List<MemoryCell> Dump(int startAddress = 0, int count = 16)
        {
            var result = new List<MemoryCell>();
            
            for (int i = 0; i < count; i++)
            {
                int address = startAddress + i;
                if (address > MaxAddress) break;
                
                var value = _memory.GetValueOrDefault(address, new Tryte(0));
                result.Add(new MemoryCell
                {
                    Address = address,
                    AddressString = new TernaryAddress(address).ToString(),
                    Value = value,
                    ValueString = value.ToString(),
                    DecimalValue = value.ToDecimal(),
                    HasWatchpoint = _watchpoints.Contains(address),
                    RecentlyChanged = _changeHistory.Any(c => c.Address == address && 
                        (DateTime.Now - c.Timestamp).TotalSeconds < 1)
                });
            }
            
            return result;
        }

        /// <summary>
        /// Get memory page
        /// </summary>
        public List<MemoryCell> GetPage(int pageNumber)
        {
            int startAddress = pageNumber * PageSize;
            return Dump(startAddress, PageSize);
        }

        /// <summary>
        /// Set watchpoint on address
        /// </summary>
        public void SetWatchpoint(int address)
        {
            if (address >= 0 && address <= MaxAddress)
            {
                _watchpoints.Add(address);
            }
        }

        /// <summary>
        /// Clear watchpoint on address
        /// </summary>
        public void ClearWatchpoint(int address)
        {
            _watchpoints.Remove(address);
        }

        /// <summary>
        /// Clear all watchpoints
        /// </summary>
        public void ClearAllWatchpoints()
        {
            _watchpoints.Clear();
        }

        /// <summary>
        /// Get all watchpoints
        /// </summary>
        public IEnumerable<int> GetWatchpoints()
        {
            return _watchpoints.ToList();
        }

        /// <summary>
        /// Get recent memory accesses
        /// </summary>
        public List<MemoryAccess> GetRecentAccesses(int count = 100)
        {
            return _accessHistory
                .OrderByDescending(a => a.Timestamp)
                .Take(count)
                .ToList();
        }

        /// <summary>
        /// Get recent memory changes
        /// </summary>
        public List<MemoryChange> GetRecentChanges(int count = 100)
        {
            return _changeHistory
                .OrderByDescending(c => c.Timestamp)
                .Take(count)
                .ToList();
        }

        /// <summary>
        /// Export memory state
        /// </summary>
        public Dictionary<string, object> ExportState()
        {
            return new Dictionary<string, object>
            {
                ["memory"] = _memory.ToDictionary(kvp => kvp.Key.ToString(), kvp => kvp.Value.ToDecimal()),
                ["watchpoints"] = _watchpoints.ToList(),
                ["addressWidth"] = AddressWidth,
                ["maxAddress"] = MaxAddress
            };
        }

        /// <summary>
        /// Import memory state
        /// </summary>
        public void ImportState(Dictionary<string, object> state)
        {
            Clear();
            
            if (state.ContainsKey("memory") && state["memory"] is Dictionary<string, object> memoryData)
            {
                foreach (var kvp in memoryData)
                {
                    if (int.TryParse(kvp.Key, out int address) && kvp.Value is int value)
                    {
                        _memory[address] = new Tryte(value);
                    }
                }
            }
            
            if (state.ContainsKey("watchpoints") && state["watchpoints"] is List<object> watchpoints)
            {
                foreach (var wp in watchpoints)
                {
                    if (wp is int address)
                    {
                        _watchpoints.Add(address);
                    }
                }
            }
        }

        /// <summary>
        /// Event fired when a watchpoint is hit
        /// </summary>
        public event Action<WatchpointEventArgs>? OnWatchpointHit;
    }

    /// <summary>
    /// Memory access record
    /// </summary>
    public class MemoryAccess
    {
        public int Address { get; set; }
        public MemoryAccessType Type { get; set; }
        public DateTime Timestamp { get; set; }
        public Tryte? Value { get; set; }
    }

    /// <summary>
    /// Memory change record
    /// </summary>
    public class MemoryChange
    {
        public int Address { get; set; }
        public Tryte OldValue { get; set; } = new Tryte(0);
        public Tryte NewValue { get; set; } = new Tryte(0);
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Memory cell for display
    /// </summary>
    public class MemoryCell
    {
        public int Address { get; set; }
        public string AddressString { get; set; } = "";
        public Tryte Value { get; set; } = new Tryte(0);
        public string ValueString { get; set; } = "";
        public int DecimalValue { get; set; }
        public bool HasWatchpoint { get; set; }
        public bool RecentlyChanged { get; set; }
    }

    /// <summary>
    /// Watchpoint event arguments
    /// </summary>
    public class WatchpointEventArgs
    {
        public int Address { get; set; }
        public MemoryAccessType Type { get; set; }
        public Tryte Value { get; set; } = new Tryte(0);
        public Tryte? OldValue { get; set; }
    }

    /// <summary>
    /// Memory access type
    /// </summary>
    public enum MemoryAccessType
    {
        Read,
        Write
    }

    /// <summary>
    /// Memory-mapped I/O system
    /// </summary>
    public class MemoryMappedIO
    {
        private readonly TernaryMemory _memory;
        private readonly Dictionary<int, IMemoryMappedDevice> _devices;

        // I/O memory addresses
        public const int ConsoleOutputAddress = 19680;
        public const int ConsoleInputAddress = 19681;
        public const int GraphicsCommandAddress = 19679;
        public const int GraphicsDataAddress = 19678;

        public MemoryMappedIO(TernaryMemory memory)
        {
            _memory = memory;
            _devices = new Dictionary<int, IMemoryMappedDevice>();
            
            // Set up watchpoints for I/O addresses
            _memory.SetWatchpoint(ConsoleOutputAddress);
            _memory.SetWatchpoint(ConsoleInputAddress);
            _memory.SetWatchpoint(GraphicsCommandAddress);
            _memory.SetWatchpoint(GraphicsDataAddress);
            
            _memory.OnWatchpointHit += HandleIOAccess;
        }

        /// <summary>
        /// Register a memory-mapped device
        /// </summary>
        public void RegisterDevice(int address, IMemoryMappedDevice device)
        {
            _devices[address] = device;
            _memory.SetWatchpoint(address);
        }

        /// <summary>
        /// Handle I/O access
        /// </summary>
        private void HandleIOAccess(WatchpointEventArgs args)
        {
            if (_devices.ContainsKey(args.Address))
            {
                var device = _devices[args.Address];
                
                if (args.Type == MemoryAccessType.Write)
                {
                    device.Write(args.Value);
                }
                else
                {
                    var value = device.Read();
                    _memory.Write(args.Address, value);
                }
            }
        }
    }

    /// <summary>
    /// Interface for memory-mapped devices
    /// </summary>
    public interface IMemoryMappedDevice
    {
        Tryte Read();
        void Write(Tryte value);
    }
}