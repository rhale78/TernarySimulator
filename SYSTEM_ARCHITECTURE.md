# System Architecture Documentation

## Overview

The Balanced Ternary CPU Simulator implements a complete computer system architecture using balanced ternary arithmetic. This document provides detailed technical information about the system's design, implementation, and component interactions.

## Core Architecture

### Balanced Ternary Foundation

#### Number Representation
- **Trits**: Individual digits with values {-1, 0, +1}
- **Internal Storage**: JavaScript arrays of integer values
- **Display Format**: Visual representation as {-, 0, +} or {T, 0, 1}
- **Arithmetic**: Native balanced ternary operations without conversion

#### Data Types
| Type | Width | Range | Use Case |
|------|-------|-------|----------|
| Trit | 1 trit | -1 to +1 | Individual digits |
| Tryte | 6 trits | -364 to +364 | Standard data word |
| Word | 12 trits | -264,062 to +264,062 | Extended precision |
| Triple | 18 trits | -193,710,244 to +193,710,244 | Large integers |
| Address | 9 trits | 0 to 19,682 | Memory addressing |

### CPU Architecture

#### Register Set
```
PC    - Program Counter (9 trits) - Current instruction address
ACC   - Accumulator (6 trits) - Primary arithmetic register
IX    - Index Register (6 trits) - Primary addressing register
IX1-3 - Additional Index Registers (6 trits each)
SP    - Stack Pointer (9 trits) - Top of stack address
R1-R9 - General Purpose Registers (6 trits each)
FLAGS - Condition Flags (6 trits) - Processor status
```

#### Flag Register Layout
```
Bit 5: Overflow Flag (V) - Arithmetic overflow detection
Bit 4: Carry Flag (C) - Carry from arithmetic operations
Bit 3: Negative Flag (N) - Result is negative
Bit 2: Positive Flag (P) - Result is positive  
Bit 1: Zero Flag (Z) - Result is zero
Bit 0: Reserved - Future use
```

#### Instruction Format
```
6-Trit Instruction Word:
[5:3] - Opcode (3 trits, -13 to +13 core range)
[2:0] - Operand (3 trits, -13 to +13 range)

Extended Instructions:
[5:0] - Full opcode (6 trits, extended range 14-364)
```

#### Addressing Modes
1. **Immediate**: `#value` - Operand is the value itself
2. **Direct**: `address` - Operand is memory address
3. **Indirect**: `(address)` - Operand is address of address
4. **Indexed**: `address,X` - Operand is address + index register
5. **Relative**: `+/-offset` - Operand is PC-relative offset

### Memory System Architecture

#### Memory Organization
```
Address Space: 0 to 19,682 (9-trit addresses)

Memory Layout:
0x0000-0x3E7F  (0-15999)     - User Program Space
0x3E80-0x427F  (16000-16999) - Stack Space  
0x4280-0x465F  (17000-17999) - Character Display Buffer
0x4660-0x483F  (18000-18500) - Pixel Graphics Buffer
0x4840-0x4A1F  (18501-19000) - I/O Device Registers
0x4A20-0x4BFF  (19001-19500) - DMA Buffers
0x4C00-0x4CFF  (19501-19682) - System Reserved
```

#### Sparse Memory Implementation
```javascript
class TernaryMemory {
    constructor(addressWidth = 9) {
        this.memory = new Map();           // Only stores non-zero values
        this.watchpoints = new Set();      // Debug monitoring
        this.accessHistory = [];           // Access tracking
        this.changeHistory = [];           // Change tracking
    }
}
```

Benefits:
- **Memory Efficiency**: Only non-zero values consume storage
- **Unlimited Address Space**: Configurable address width
- **Debug Support**: Complete access and change tracking
- **Performance**: Fast Map-based lookups

### Cache Memory System

#### Cache Hierarchy
```
L1 Cache (Direct-Mapped):
- Size: 16 cache lines
- Line Size: 1 tryte
- Hit Time: 1 cycle
- Replacement: FIFO

L2 Cache (4-Way Set Associative):
- Size: 64 cache lines  
- Line Size: 1 tryte
- Hit Time: 3 cycles
- Replacement: LRU
```

#### Cache Implementation
```javascript
class Cache {
    constructor(name, size, associativity, policy) {
        this.cacheLlines = new Array(size);
        this.associativity = associativity;
        this.sets = size / associativity;
        this.replacementPolicy = policy; // LRU, FIFO, Random
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }
}
```

#### Cache Performance Metrics
- **Hit Rate**: Percentage of accesses found in cache
- **Miss Rate**: Percentage of accesses requiring memory fetch
- **Eviction Rate**: Cache line replacement frequency
- **Access Patterns**: Sequential vs. random access analysis

### Pipeline Architecture

#### 4-Stage Pipeline
```
1. Fetch (F):    Retrieve instruction from memory/cache
2. Decode (D):   Parse opcode and operands  
3. Execute (E):  Perform operation in ALU
4. Writeback (W): Store result to register/memory
```

#### Pipeline Timing
```
Cycle: 1  2  3  4  5  6  7  8
Inst1: F  D  E  W
Inst2:    F  D  E  W
Inst3:       F  D  E  W  
Inst4:          F  D  E  W
```

#### Hazard Detection and Resolution

**Data Hazards (RAW - Read After Write)**
```assembly
LDA #10     ; Writes to ACC
ADD #5      ; Reads ACC (potential hazard)
```
Resolution: Data forwarding from Execute/Writeback stages

**Control Hazards (Branch Instructions)**
```assembly
CMP #0      ; Sets flags
JZ label    ; Branch decision (potential hazard)
```
Resolution: Branch prediction + speculative execution

**Structural Hazards (Resource Conflicts)**
- Memory port conflicts resolved by cache system
- ALU conflicts resolved by pipeline scheduling

#### Data Forwarding Unit
```javascript
class ForwardingUnit {
    constructor() {
        this.forwardFromExecute = null;    // Data from E stage
        this.forwardFromWriteback = null;  // Data from W stage
        this.forwardingPaths = new Map();  // Active forwarding
    }
    
    checkForwarding(sourceReg, pipelineStage) {
        // Determine if forwarding is needed and possible
        // Return forwarded value or null
    }
}
```

### Multi-Core Architecture

#### Core Configuration
```javascript
class MultiCoreCPU {
    constructor(memory, coreCount = 1) {
        this.cores = [];              // Array of TernaryCPU instances
        this.sharedResources = {      // Resources shared between cores
            cache: null,
            dma: null,
            interrupts: null
        };
        this.synchronization = {      // Inter-core coordination
            locks: new Map(),
            barriers: new Map(),
            messages: new Map()
        };
    }
}
```

#### Shared Resources
- **L2 Cache**: Shared between all cores
- **Memory**: Single shared memory space
- **I/O Devices**: Shared access with arbitration
- **Interrupt Controller**: Distributes interrupts across cores

#### Synchronization Primitives

**Mutex (Mutual Exclusion)**
```javascript
class TernaryMutex {
    constructor(name) {
        this.locked = false;
        this.owner = null;
        this.waitQueue = [];
    }
    
    lock(process) {
        if (!this.locked) {
            this.locked = true;
            this.owner = process;
            return true;
        } else {
            this.waitQueue.push(process);
            return false; // Process blocks
        }
    }
}
```

**Semaphore (Resource Counting)**
```javascript
class TernarySemaphore {
    constructor(name, initialValue) {
        this.value = initialValue;
        this.waitQueue = [];
    }
    
    wait(process) {
        this.value--;
        if (this.value < 0) {
            this.waitQueue.push(process);
            return false; // Process blocks
        }
        return true;
    }
}
```

### I/O System Architecture

#### Memory-Mapped I/O
All I/O devices are accessed through memory addresses:

```
Device            Base Address    Size    Purpose
Console Output    18501           1       Text output
Graphics Text     17001           384     24x16 character display
Graphics Pixels   18001           500     81x81 pixel display  
Disk Controller   18600           50      Virtual disk I/O
DMA Controller    19001           450     9-channel DMA
Timer/Clock       19451           10      Hardware timers
Interrupt Ctrl    19461           20      Interrupt management
```

#### Device Interface Protocol
```javascript
class IODevice {
    constructor(baseAddress, size) {
        this.baseAddress = baseAddress;
        this.size = size;
        this.registers = new Array(size).fill(0);
    }
    
    read(address) {
        const offset = address - this.baseAddress;
        return new Tryte(this.registers[offset] || 0);
    }
    
    write(address, value) {
        const offset = address - this.baseAddress;
        this.registers[offset] = value.toDecimal();
        this.handleWrite(offset, value);
    }
    
    handleWrite(offset, value) {
        // Device-specific write handling
    }
}
```

### Virtual Disk System

#### File System Architecture
```
Disk Layout:
- Maximum Files: 243 (3^5)
- Directory Structure: Hierarchical tree
- File Allocation: Linked sectors
- Metadata: Size, timestamps, permissions
- Free Space: Bitmap allocation
```

#### File System Operations
```javascript
class VirtualDiskDrive {
    constructor(maxFiles = 243) {
        this.files = new Map();           // filename -> file data
        this.directories = new Map();     // path -> directory info
        this.sectors = new Array(729);    // 3^6 sectors
        this.freeList = new Set();        // Available sectors
        this.openFiles = new Map();       // file handles
    }
}
```

#### Disk Commands
| Command | Code | Description |
|---------|------|-------------|
| OPEN_FILE | 1 | Open file for reading/writing |
| CLOSE_FILE | 2 | Close file handle |
| READ_FILE | 3 | Read data from file |
| WRITE_FILE | 4 | Write data to file |
| CREATE_FILE | 5 | Create new file |
| DELETE_FILE | 6 | Delete existing file |
| LIST_DIR | 7 | List directory contents |
| CREATE_DIR | 8 | Create new directory |

### DMA Controller Architecture

#### 9-Channel DMA System
```javascript
class DMAController {
    constructor() {
        this.channels = new Array(9);     // 9 DMA channels
        this.activeTransfers = 0;
        this.statistics = {
            totalTransfers: 0,
            bytesTransferred: 0,
            averageSpeed: 0
        };
    }
}
```

#### DMA Channel Configuration
```
Channel Structure:
- Source Address (9 trits)
- Destination Address (9 trits)  
- Transfer Count (6 trits)
- Control Flags (6 trits)
- Status Register (6 trits)
```

#### Transfer Types
1. **Memory-to-Memory**: Block copy operations
2. **Memory-to-Device**: Output operations
3. **Device-to-Memory**: Input operations
4. **Chained Transfers**: Multiple sequential operations

### Operating System Architecture

#### BTOS (Balanced Ternary Operating System)
```javascript
class BalancedTernaryOS {
    constructor(cpu, memory, diskDrive) {
        this.processManager = new ProcessManager();
        this.memoryManager = new MemoryManager();
        this.fileSystem = new FileSystem(diskDrive);
        this.scheduler = new Scheduler();
        this.shell = new Shell(this);
    }
}
```

#### Process Management
```javascript
class ProcessControlBlock {
    constructor(pid, name, startAddress, size) {
        this.pid = pid;                   // Process ID
        this.state = 'READY';            // READY, RUNNING, BLOCKED, TERMINATED
        this.startAddress = startAddress; // Memory location
        this.size = size;                // Memory size
        this.registers = null;           // Saved register state
        this.priority = 0;               // Scheduling priority
        this.cpuTime = 0;               // CPU usage tracking
        this.openFiles = new Map();      // File handles
    }
}
```

#### System Call Interface
```
System Call Numbers:
0: sys_exit     - Terminate process
1: sys_write    - Write to output
2: sys_read     - Read from input
3: sys_fork     - Create child process
4: sys_wait     - Wait for child process
5: sys_exec     - Execute program
6: sys_open     - Open file
7: sys_close    - Close file
8: sys_malloc   - Allocate memory
9: sys_free     - Free memory
```

### Interrupt System Architecture

#### Interrupt Controller
```javascript
class InterruptController {
    constructor() {
        this.interruptVectors = new Array(16);  // 16 interrupt vectors
        this.interruptMask = 0;                // Enabled interrupts
        this.pendingInterrupts = 0;            // Pending interrupt bits
        this.inInterrupt = false;              // Currently in handler
        this.interruptStack = [];              // Nested interrupt stack
    }
}
```

#### Interrupt Types and Priorities
| Vector | Type | Priority | Source |
|--------|------|----------|---------|
| 0 | RESET | Highest | System reset |
| 1 | TIMER | High | Hardware timer |
| 2 | I/O | Medium | I/O completion |
| 3 | DMA | Medium | DMA completion |
| 4 | SYSCALL | Low | Software interrupt |
| 5-15 | USER | Variable | User-defined |

#### Interrupt Handling Sequence
1. **Interrupt Detection**: Check pending interrupts
2. **Priority Resolution**: Select highest priority interrupt
3. **Context Save**: Save current processor state
4. **Vector Lookup**: Load interrupt handler address
5. **Handler Execution**: Execute interrupt service routine
6. **Context Restore**: Restore previous processor state
7. **Resume Execution**: Continue interrupted program

### Graphics System Architecture

#### Character Display (24x16)
```
Memory Layout: 17001-17384 (384 locations)
Format: Each location contains:
- Character Code (6 trits) - ASCII-like character set
- Attributes (future expansion)

Character Set:
- Printable ASCII characters (32-126)
- Extended balanced ternary symbols
- Control characters for formatting
```

#### Pixel Graphics (81x81)
```
Memory Layout: 18001-18500 (500 locations, 6561 pixels)
Pixel Format: Each trit represents color component
- Red Component: {-, 0, +} (3 levels)
- Green Component: {-, 0, +} (3 levels)  
- Blue Component: {-, 0, +} (3 levels)
Total Colors: 3^3 = 27 colors (reduced to 9 for display)

Color Mapping:
--- (000) = Black      -0+ (001) = Red
--0 (010) = Green      --+ (011) = Yellow
-0- (100) = Blue       -0+ (101) = Magenta
-+- (110) = Cyan       +++ (222) = White
```

### Snapshot System Architecture

#### Snapshot Data Structure
```javascript
class SnapshotManager {
    createSnapshot(name, description) {
        return {
            metadata: {
                name: name,
                description: description,
                timestamp: Date.now(),
                version: '1.0'
            },
            cpu: this.captureCPUState(),      // All registers and flags
            memory: this.captureMemoryState(), // Complete memory image
            disk: this.captureDiskState(),     // File system state
            graphics: this.captureGraphicsState(), // Display buffers
            os: this.captureOSState()          // Process and OS state
        };
    }
}
```

#### State Capture Methods
- **CPU State**: All registers, flags, pipeline state, cache state
- **Memory State**: Complete sparse array with compression
- **Disk State**: File system, directory structure, file contents
- **Graphics State**: Character and pixel display buffers  
- **OS State**: Process table, open files, system variables

#### Snapshot Format
```json
{
    "metadata": {
        "name": "program_checkpoint",
        "description": "Before main loop execution",
        "timestamp": 1234567890,
        "version": "1.0"
    },
    "cpu": {
        "registers": {"PC": "000000000", "ACC": "+-+", ...},
        "flags": {"Z": 0, "P": 1, "N": 0, ...},
        "pipeline": {...}
    },
    "memory": {
        "sparse_array": {"000000000": "+-+00+", ...},
        "watchpoints": [...],
        "statistics": {...}
    },
    "compressed": true,
    "size": 15234
}
```

## Performance Characteristics

### Instruction Throughput
- **Single Core**: 1 instruction per cycle (ideal pipeline)
- **Dual Core**: Up to 2 instructions per cycle
- **Pipeline Efficiency**: 85-95% (depends on program structure)
- **Cache Hit Rate**: 90-98% (depends on access patterns)

### Memory Performance
- **L1 Cache Hit**: 1 cycle
- **L2 Cache Hit**: 3 cycles  
- **Memory Access**: 10 cycles
- **DMA Transfer**: 2 cycles per tryte

### I/O Performance
- **Console Output**: 5 cycles per character
- **Graphics Update**: 1 cycle per pixel
- **Disk Access**: 100 cycles per operation
- **Network I/O**: Not implemented

## Implementation Details

### JavaScript Integration
```javascript
// Main simulator class integrates all components
class TernarySimulator {
    constructor() {
        this.memory = new TernaryMemory(9);
        this.cpu = new TernaryCPU(this.memory);
        this.assembler = new TernaryAssembler();
        this.os = new BalancedTernaryOS(this.cpu, this.memory);
        this.snapshotManager = new SnapshotManager(this);
        // ... initialize other components
    }
}
```

### Web Browser Compatibility
- **ES6 Features**: Classes, Maps, Sets, arrow functions
- **No External Dependencies**: Pure JavaScript implementation
- **Local Storage**: Snapshots and settings persistence
- **File API**: Import/export functionality
- **Canvas API**: Graphics rendering

### Node.js Testing
```javascript
// Test framework compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernarySimulator, TernaryCPU, /* ... */ };
}
```

## Extensibility

### Adding Custom Instructions
```javascript
// Register new instruction with CPU
cpu.addCustomInstruction('MYINST', 200, function(operand) {
    // Custom instruction implementation
    this.registers.ACC = this.registers.ACC.add(operand);
    this.updateFlags(this.registers.ACC);
});
```

### Adding I/O Devices
```javascript
// Custom I/O device
class MyIODevice extends IODevice {
    constructor() {
        super(19500, 10); // Base address, size
    }
    
    handleWrite(offset, value) {
        // Device-specific behavior
        console.log(`Device write: ${offset} = ${value}`);
    }
}

// Register with simulator
simulator.addIODevice(new MyIODevice());
```

### System Integration
The architecture supports integration with external tools:
- **State Export**: JSON format for external analysis
- **Trace Generation**: Execution trace for debugging tools
- **Performance Metrics**: Detailed statistics for optimization
- **Custom Extensions**: Plugin architecture for new features

This architecture provides a complete, extensible platform for balanced ternary computing education and research.