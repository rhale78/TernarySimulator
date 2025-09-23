# Balanced Ternary CPU Simulator

A complete educational balanced ternary computer system featuring a comprehensive CPU architecture, operating system, and development environment. This simulator demonstrates computation in base-3 signed arithmetic (balanced ternary) and provides extensive tools for learning computer architecture concepts.

## Table of Contents

- [What is Balanced Ternary?](#what-is-balanced-ternary)
- [Why This Simulator?](#why-this-simulator)
- [Getting Started](#getting-started)
- [Core Architecture](#core-architecture)
- [Programming Languages](#programming-languages)
- [Advanced Features](#advanced-features)
- [System Components](#system-components)
- [Programming Guide](#programming-guide)
- [Debugging and Development](#debugging-and-development)
- [Examples and Tutorials](#examples-and-tutorials)

## What is Balanced Ternary?

Balanced ternary is a numeral system that uses three digits: **-1, 0, +1** (displayed as -, 0, +). Unlike binary (0,1) or regular ternary (0,1,2), balanced ternary can represent both positive and negative numbers naturally without needing a separate sign bit.

### Key Properties
- **Symmetric**: Equal representation of positive and negative values
- **No Sign Bit**: Negative numbers are represented directly
- **Elegant Arithmetic**: Addition, subtraction, and multiplication are naturally balanced
- **Unique Representation**: Every number has exactly one balanced ternary representation

### Examples
```
 5 decimal = +-- balanced ternary = (1×9) + (-1×3) + (-1×1) = 9-3-1 = 5
-5 decimal = -++ balanced ternary = (-1×9) + (1×3) + (1×1) = -9+3+1 = -5
10 decimal = +-+ balanced ternary = (1×9) + (-1×3) + (1×1) = 9-3+1 = 7... wait, let me recalculate
10 decimal = +0+ balanced ternary = (1×9) + (0×3) + (1×1) = 9+0+1 = 10
```

## Why This Simulator?

This simulator serves multiple educational and research purposes:

1. **Alternative Computing Models**: Explore computation beyond binary systems
2. **Computer Architecture Education**: Learn CPU design, pipelining, and multi-core concepts
3. **Assembly Programming**: Practice low-level programming in a unique environment
4. **Operating Systems Concepts**: Understand process management, file systems, and system calls
5. **Digital Logic**: Study arithmetic and logical operations in ternary
6. **Research Tool**: Investigate balanced ternary computing properties

## Getting Started

### Quick Start (Web Interface)
1. **Open in Browser**: Navigate to `index.html` in any modern web browser
2. **Or Start Web Server**: 
   ```bash
   python3 -m http.server 8080
   # Then visit http://localhost:8080
   ```

### Running Tests
```bash
# Run comprehensive test suite (takes ~5 seconds)
node test.js

# Run additional component tests
node simple_test.js
node manual_test.js
```

### Your First Program
1. Load the simulator in your browser
2. The editor comes pre-loaded with an example program
3. Click **"Assemble"** to compile the code
4. Click **"Run"** to execute the program
5. Watch the registers and output update in real-time

## Core Architecture

### Balanced Ternary System
- **Trits**: Individual ternary digits (-1, 0, +1)
- **Trytes**: 6-trit data words (range: -364 to +364)
- **Word**: 12-trit extended data (range: -264,062 to +264,062)
- **Triple**: 18-trit extended data (range: -193,710,244 to +193,710,244)
- **Addressing**: 9-trit addresses (19,683 memory locations by default)

### CPU Features
- **ALU**: Complete balanced ternary arithmetic and logical operations
- **Registers**: 
  - **PC**: Program Counter (9-trit addresses)
  - **ACC**: Accumulator (6-trit primary data register)
  - **IX, IX1-IX3**: Index registers for addressing
  - **SP**: Stack Pointer
  - **R1-R9**: General-purpose registers
  - **FLAGS**: Zero, Positive, Negative, Carry, Overflow flags
- **Pipeline**: 4-stage instruction pipeline (Fetch, Decode, Execute, Writeback)
- **Multi-Core**: Up to 2 cores with shared memory and synchronization
- **Branch Prediction**: Dynamic branch prediction for performance

### Memory System
- **Sparse Memory**: Efficient Map-based storage (only stores non-zero values)
- **Cache Hierarchy**: L1 and L2 caches with performance tracking
- **Memory-Mapped I/O**: High addresses mapped to I/O devices
- **Virtual Memory**: MMU with paging support (advanced feature)
- **DMA Controller**: Direct Memory Access for high-speed transfers

## Programming Languages

### Assembly Language
The simulator supports a comprehensive assembly language with 70+ instructions:

#### Data Movement
```assembly
LDA #10      ; Load immediate value 10 into accumulator
LDA 100      ; Load value from memory address 100
STA 200      ; Store accumulator to memory address 200
LDX #5       ; Load index register with 5
MOV R1,R2    ; Move register R1 to R2
```

#### Arithmetic Operations
```assembly
ADD #5       ; Add 5 to accumulator
SUB 100      ; Subtract value at address 100
MUL #3       ; Multiply accumulator by 3
DIV #2       ; Divide accumulator by 2
INC          ; Increment accumulator
DEC          ; Decrement accumulator
```

#### Logical Operations
```assembly
AND #7       ; Ternary AND with 7
OR 50        ; Ternary OR with value at address 50
XOR #3       ; Ternary XOR with 3
NOT          ; Ternary NOT operation
SHL #2       ; Shift left 2 positions
SHR #1       ; Shift right 1 position
```

#### Control Flow
```assembly
CMP #10      ; Compare accumulator with 10
JMP loop     ; Unconditional jump to 'loop'
JZ done      ; Jump to 'done' if accumulator is zero
JP positive  ; Jump if accumulator is positive
JN negative  ; Jump if accumulator is negative
JSR subrout  ; Jump to subroutine
RTS          ; Return from subroutine
```

### High-Level C-Like Language
The simulator includes a C-like high-level language that compiles to assembly:

```c
// Variable declarations
int x = 10;
word largeNum = 50000;      // 12-trit extended integers
triple hugeNum = 1000000;   // 18-trit extended integers

// Functions
function fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

// Mixed arithmetic modes
int ternaryResult = a + b;    // Normal ternary arithmetic
int binaryResult = a b+ b;    // Binary arithmetic (marked with 'b')

// Arrays and loops
int array[10];
for (int i = 0; i < 10; i++) {
    array[i] = i * 2;
}
```

## Advanced Features

### Multi-Core Processing
- **Dual-Core Support**: Run programs on 1 or 2 CPU cores
- **Synchronization**: Mutexes, semaphores, and barriers
- **Inter-Core Communication**: Message passing between cores
- **Parallel Execution**: True parallel processing with shared memory
- **Core Switching**: Switch active core in single-threaded mode

```assembly
; Example multi-core synchronization
LOCK mutex1     ; Acquire lock
    ; Critical section
    LDA shared_var
    ADD #1
    STA shared_var
UNLOCK mutex1   ; Release lock
```

### Pipeline Architecture
- **4-Stage Pipeline**: Fetch → Decode → Execute → Writeback
- **Hazard Detection**: Data and control hazard handling
- **Data Forwarding**: Automatic forwarding to resolve dependencies
- **Branch Prediction**: Dynamic prediction to reduce pipeline stalls
- **Performance Metrics**: Pipeline efficiency and stall statistics

### Virtual Disk System
The simulator includes a complete virtual disk drive:

#### File Operations
```assembly
; Create and write to a file
LDA #1          ; Command: Create file
STA DISK_CMD
JSR disk_op

; Read from a file
LDA #3          ; Command: Read file
STA DISK_CMD
JSR disk_op
```

#### File System Commands (via OS)
```bash
# OS shell commands
ls              # List files
cat filename    # Display file contents
mkdir dirname   # Create directory
rm filename     # Delete file
cp src dest     # Copy file
```

### Operating System (BTOS)
Balanced Ternary Operating System provides:

#### Process Management
- **Process Control Blocks**: Process state tracking
- **Context Switching**: Save/restore processor state
- **Priority Scheduling**: Multi-level priority queues
- **Inter-Process Communication**: Pipes and shared memory

#### System Calls
```assembly
; System call example
LDA #1          ; syscall number (write)
LDX #msg        ; message address
SYSCALL         ; invoke system call

msg: .str "Hello, World!"
```

#### Shell Commands
- `boot` - Boot the operating system
- `ps` - Show running processes
- `kill pid` - Terminate process
- `mem` - Show memory usage
- `disk` - Disk operations

### Snapshot System
Complete state save/load functionality:

#### Creating Snapshots
1. **Web Interface**: Use the snapshot controls in the I/O section
2. **Programmatically**: `debugFunctions.createSnapshot("name", "description")`

#### What's Saved
- Complete CPU state (all registers, flags, pipeline state)
- Full memory contents (sparse array preservation)
- Virtual disk filesystem state
- Graphics/video memory
- Operating system state
- Multi-core configuration

#### Sharing Snapshots
1. **Export**: Save snapshot to file for sharing
2. **Import**: Load snapshot from file
3. **File Format**: JSON-based with optional compression

```javascript
// Example: Export snapshot for sharing
const snapshot = debugFunctions.exportSnapshot("my_program");
// Send 'snapshot' file to colleague
// Colleague uses "Import" button to load it
```

## System Components

### Memory Map
The simulator uses a 9-trit address space (19,683 locations) with memory-mapped I/O:

| Address Range | Purpose | Description |
|---------------|---------|-------------|
| 0-16000 | Main Memory | Program and data storage |
| 16001-17000 | Stack Space | Automatic stack allocation |
| 17001-18000 | Graphics Memory | Character display (24x16) |
| 18001-18500 | Graphics Pixel Data | Ternary graphics (81x81) |
| 18501-19000 | I/O Registers | Device control registers |
| 19001-19500 | DMA Buffers | Direct memory access areas |
| 19501-19682 | System Reserved | OS and system use |

### I/O System

#### Console Output
Programs can output text using:
```assembly
OUT         ; Output accumulator value as number
OUTC        ; Output accumulator as character
OUTS msg    ; Output string at address 'msg'
```

#### Graphics Display
Two graphics modes available:

**Character Display (24x16)**
- Text-based output using balanced ternary character encoding
- Memory-mapped to addresses 17001-17384
- Each cell stores character code + color

**Pixel Graphics (81x81 with 9 colors)**
- Ternary pixel graphics with 9 color combinations
- Each pixel represents ternary RGB (each component: -, 0, +)
- Memory-mapped to addresses 18001-18500

#### Virtual Disk Drive
Complete file system with:
- **Maximum Files**: 243 files (3^5)
- **Hierarchical Directories**: Full directory tree support
- **File Types**: Text, binary data, executable programs
- **File Operations**: Create, read, write, delete, rename
- **Metadata**: Timestamps, sizes, permissions

#### DMA Controller
9-channel DMA system for high-speed data transfers:
- **Memory-to-Memory**: Fast block copies
- **Device-to-Memory**: Peripheral data transfer
- **Chained Operations**: Multiple sequential transfers
- **Interrupt-Driven**: Completion notifications

### Interrupt System
Comprehensive interrupt handling:

#### Interrupt Types
1. **Hardware Interrupts**: Timer, I/O completion, DMA
2. **Software Interrupts**: System calls, exceptions
3. **Inter-Core Interrupts**: Multi-core communication
4. **Maskable Interrupts**: Can be disabled/enabled

#### Interrupt Vectors
| Vector | Purpose | Priority |
|--------|---------|----------|
| 0 | Reset | Highest |
| 1 | Hardware Timer | High |
| 2 | I/O Complete | Medium |
| 3 | DMA Complete | Medium |
| 4 | Software Interrupt | Low |
| 5-8 | User-defined | Variable |

#### Interrupt Handling
```assembly
; Enable interrupts
SEI

; Set interrupt handler
LDA #handler_addr
STA INT_VECTOR_1

; Interrupt handler
handler:
    ; Save context (automatic in pipeline mode)
    
    ; Handle interrupt
    LDA INT_STATUS
    ; ... process interrupt
    
    RTI         ; Return from interrupt
```

### Cache System
2-level cache hierarchy with performance monitoring:

#### L1 Cache
- **Size**: 16 cache lines
- **Associativity**: Direct-mapped
- **Replacement**: FIFO
- **Hit Time**: 1 cycle

#### L2 Cache  
- **Size**: 64 cache lines
- **Associativity**: 4-way set associative
- **Replacement**: LRU (Least Recently Used)
- **Hit Time**: 3 cycles

#### Cache Performance
Monitor cache performance in real-time:
```javascript
// View cache statistics
debugFunctions.getCacheStats();
// Returns: { l1HitRate: 0.85, l2HitRate: 0.92, totalAccesses: 1000 }
```

### Pipeline Details
4-stage instruction pipeline with advanced features:

#### Pipeline Stages
1. **Fetch**: Retrieve instruction from memory/cache
2. **Decode**: Parse opcode and operands
3. **Execute**: Perform operation in ALU
4. **Writeback**: Store result to register/memory

#### Hazard Handling
- **Data Hazards**: RAW (Read After Write) detection
- **Control Hazards**: Branch misprediction recovery
- **Structural Hazards**: Resource conflicts
- **Forwarding**: Bypass data from later stages

#### Branch Prediction
- **Algorithm**: 2-bit saturating counter
- **Branch Target Buffer**: Cache recent branch targets
- **Prediction Accuracy**: Tracked in real-time
- **Misprediction Recovery**: Pipeline flush and restart

### Performance Monitoring
Comprehensive performance analysis tools:

#### Instruction Profiling
- **Frequency Analysis**: Most/least used instructions
- **Execution Time**: Cycles per instruction type
- **Pipeline Efficiency**: Stall percentage and causes
- **Cache Performance**: Hit/miss ratios by cache level

#### System Metrics
- **CPI (Cycles Per Instruction)**: Overall performance metric
- **IPC (Instructions Per Cycle)**: Pipeline throughput
- **Memory Bandwidth**: Data transfer rates
- **I/O Utilization**: Device usage statistics

## Programming Guide

### Assembly Language Programming

#### Program Structure
```assembly
; Comments start with semicolon
; Set program origin
.org 0

; Constants and variables
.equ BUFFER_SIZE 100
.db result 0            ; Reserve storage

; Main program
main:
    LDA #10             ; Load immediate
    ADD #20             ; Add immediate
    STA result          ; Store to variable
    OUT                 ; Output result
    HLT                 ; Halt program

; Subroutines
subroutine:
    ; Function body
    RTS                 ; Return to caller
```

#### Addressing Modes
1. **Immediate**: `LDA #42` - Use value directly
2. **Direct**: `LDA 100` - Load from memory address 100
3. **Indirect**: `LDA (100)` - Load from address stored at 100
4. **Indexed**: `LDA 100,X` - Load from address 100+X
5. **Relative**: `JMP +5` - Jump 5 instructions forward

#### Data Types and Storage
```assembly
; Data definition
.db 42              ; Single tryte (6 trits)
.dw 1000            ; Word (12 trits)  
.dt 100000          ; Triple (18 trits)
.ds 10              ; Reserve 10 trytes
.str "Hello"        ; String constant

; Arrays
array: .db 1, 2, 3, 4, 5
buffer: .ds 100     ; 100-tryte buffer
```

#### Advanced Programming Constructs

**Loops**
```assembly
; For loop equivalent
    LDA #10         ; Counter
loop:
    ; Loop body
    DEC             ; Decrement counter
    JNZ loop        ; Continue if not zero
```

**Conditionals**
```assembly
    LDA value
    CMP #0
    JZ is_zero
    JP is_positive
    JN is_negative
    
is_zero:
    ; Handle zero case
    JMP done
    
is_positive:
    ; Handle positive case
    JMP done
    
is_negative:
    ; Handle negative case
    
done:
    ; Continue
```

**Subroutine Parameters**
```assembly
; Pass parameters via registers
main:
    LDA #10         ; First parameter
    LDX #20         ; Second parameter
    JSR add_numbers
    STA result      ; Store result
    HLT

add_numbers:
    ADD IX          ; Add second parameter
    RTS             ; Return result in ACC
```

### High-Level Language Programming

#### Functions and Control Structures
```c
// Function definition
function factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

// Main program
function main() {
    int result = factorial(5);
    print(result);
}
```

#### Data Structures
```c
// Structures (compiled to memory layouts)
struct Point {
    int x;
    int y;
    int z;
};

// Arrays and pointers
int numbers[10];
int* ptr = &numbers[0];

// String handling
string message = "Hello, Ternary World!";
```

#### Mixed-Mode Arithmetic
```c
function mixedDemo() {
    int a = 15, b = 7;
    
    // Ternary arithmetic (default)
    int ternarySum = a + b;
    int ternaryProduct = a * b;
    
    // Binary arithmetic (prefix with 'b')
    int binarySum = a b+ b;
    int binaryProduct = a b* b;
    
    // Comparison
    print(ternarySum);    // Ternary result
    print(binarySum);     // Binary result
}
```

## Debugging and Development

### Web Interface Debugging Tools

#### Breakpoints
- **Editor Integration**: Click line numbers to set breakpoints
- **Runtime Control**: Pause execution at specific instructions
- **Conditional Breaks**: Break when certain conditions are met
- **Memory Breaks**: Break on memory access patterns

#### Memory Inspection
- **Live Memory View**: Real-time memory contents display
- **Memory Search**: Find values in memory
- **Change Tracking**: Highlight recently modified locations
- **Watchpoints**: Monitor specific memory addresses

#### Register Monitoring
- **Real-time Updates**: All register values update during execution
- **Flag Visualization**: See condition flags clearly
- **Stack Visualization**: View stack contents and pointer

### Console Debugging Commands
The simulator provides extensive debugging through the browser console:

```javascript
// Memory operations
debugFunctions.dumpMemory(0, 16);           // Dump 16 locations from address 0
debugFunctions.setWatchpoint(100);          // Watch address 100
debugFunctions.findInMemory(42);            // Find value 42 in memory

// Execution control
debugFunctions.setBreakpoint(50);           // Break at address 50
debugFunctions.step(5);                     // Execute 5 instructions
debugFunctions.runToAddress(200);           // Run until address 200

// State inspection
debugFunctions.dumpRegisters();             // Show all register values
debugFunctions.getStackContents(10);        // Show top 10 stack items
debugFunctions.getPipelineState();          // Show pipeline contents

// Performance analysis
debugFunctions.getInstructionFrequency();   // Instruction usage stats
debugFunctions.getCacheStats();             // Cache performance
debugFunctions.resetProfiler();             // Clear performance counters

// Snapshot operations
debugFunctions.createSnapshot("debug", "Debug session state");
debugFunctions.exportSnapshot("debug");     // Export to file
debugFunctions.listSnapshots();             // Show all snapshots

// System state
debugFunctions.exportState();               // Export complete system state
debugFunctions.getSystemInfo();             // Hardware configuration
```

### Advanced Debugging Features

#### Trace Execution
```javascript
// Enable execution tracing
debugFunctions.enableTrace();

// Run program - all instructions will be logged
simulator.run();

// Disable tracing
debugFunctions.disableTrace();

// View trace log
debugFunctions.getTraceLog();
```

#### Performance Profiling
```javascript
// Start profiler
debugFunctions.startProfiler();

// Run your program
simulator.run();

// Get detailed performance report
const profile = debugFunctions.getProfilerReport();
console.log(`Instructions executed: ${profile.totalInstructions}`);
console.log(`Cycles per second: ${profile.cyclesPerSecond}`);
console.log(`Most used instruction: ${profile.mostUsedInstruction}`);
console.log(`Pipeline efficiency: ${profile.pipelineEfficiency}%`);
```

#### Memory Analysis
```javascript
// Analyze memory usage patterns
const analysis = debugFunctions.analyzeMemoryUsage();
console.log(`Total allocated: ${analysis.totalAllocated}`);
console.log(`Most accessed address: ${analysis.hotSpots[0]}`);
console.log(`Memory fragmentation: ${analysis.fragmentation}%`);
```

### Testing and Validation

#### Unit Testing
```javascript
// Create test cases for your programs
function testProgram() {
    // Load program
    simulator.assemble(`
        LDA #10
        ADD #20
        STA result
        HLT
        result: .db 0
    `);
    
    // Run program
    simulator.run();
    
    // Verify result
    const result = simulator.memory.read(simulator.addressToDecimal('result'));
    console.assert(result.toDecimal() === 30, "Addition test failed");
}
```

#### Regression Testing
```javascript
// Save known-good state as snapshot
debugFunctions.createSnapshot("regression_baseline", "Known good state");

// After making changes, compare with baseline
function compareWithBaseline() {
    const current = debugFunctions.exportState();
    const baseline = debugFunctions.getSnapshot("regression_baseline");
    
    // Compare critical state
    const differences = debugFunctions.compareStates(current, baseline);
    if (differences.length > 0) {
        console.warn("Regression detected:", differences);
    }
}
```

## Examples and Tutorials

### Example 1: Basic Arithmetic
```assembly
; Calculate: (10 + 20) * 3
.org 0

main:
    LDA #10         ; Load 10
    ADD #20         ; Add 20 (ACC = 30)
    MUL #3          ; Multiply by 3 (ACC = 90)
    OUT             ; Output result
    HLT             ; Halt
```

### Example 2: Fibonacci Sequence
```assembly
; Generate first 10 Fibonacci numbers
.org 0

main:
    LDA #10         ; Counter
    STA count
    LDA #0          ; First number
    STA fib_a
    LDA #1          ; Second number  
    STA fib_b
    
loop:
    LDA fib_a       ; Output current number
    OUT
    
    LDA fib_a       ; Calculate next: fib_a + fib_b
    ADD fib_b
    STA temp        ; Store result
    
    LDA fib_b       ; Update fib_a = old fib_b
    STA fib_a
    
    LDA temp        ; Update fib_b = new result
    STA fib_b
    
    LDA count       ; Decrement counter
    DEC
    STA count
    JNZ loop        ; Continue if not zero
    
    HLT

; Variables
count:  .db 0
fib_a:  .db 0  
fib_b:  .db 0
temp:   .db 0
```

### Example 3: String Processing
```assembly
; String reversal program
.org 0

main:
    LDX #0          ; Index for source
    LDY #0          ; Index for destination
    
reverse_loop:
    LDA message,X   ; Load character
    CMP #0          ; Check for null terminator
    JZ start_copy   ; If null, start copying back
    
    PSH ACC         ; Push character to stack
    INX             ; Next character
    JMP reverse_loop

start_copy:
    PSP             ; Check if stack empty
    JZ done         ; If empty, we're done
    
    POP ACC         ; Pop character
    STA result,Y    ; Store in result
    INY             ; Next position
    JMP start_copy
    
done:
    LDA #0          ; Null terminator
    STA result,Y
    HLT

message: .str "Hello, Balanced Ternary!"
result:  .ds 50     ; Reserve space for result
```

### Example 4: Multi-Core Processing
```assembly
; Parallel computation example - sum array elements
.org 0

main:
    ; Initialize cores
    LDA #2          ; Use 2 cores
    STA CORE_COUNT
    
    ; Start core 0 - sum first half
    LDA #core0_task
    STA CORE0_PC
    
    ; Start core 1 - sum second half  
    LDA #core1_task
    STA CORE1_PC
    
    ; Enable parallel mode
    LDA #1
    STA PARALLEL_MODE
    
    ; Wait for completion
wait_loop:
    LDA CORE0_STATUS
    AND CORE1_STATUS
    CMP #COMPLETE
    JNZ wait_loop
    
    ; Combine results
    LDA core0_result
    ADD core1_result
    OUT             ; Output final sum
    HLT

core0_task:
    ; Sum array[0] through array[4]
    LDA #0          ; Sum accumulator
    LDX #0          ; Index
core0_loop:
    ADD array,X     ; Add array element
    INX
    CPX #5          ; Check if done with first half
    JNZ core0_loop
    STA core0_result
    LDA #COMPLETE
    STA CORE0_STATUS
    HLT

core1_task:
    ; Sum array[5] through array[9]
    LDA #0          ; Sum accumulator
    LDX #5          ; Start at index 5
core1_loop:
    ADD array,X     ; Add array element
    INX
    CPX #10         ; Check if done
    JNZ core1_loop
    STA core1_result
    LDA #COMPLETE
    STA CORE1_STATUS
    HLT

; Data
array: .db 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
core0_result: .db 0
core1_result: .db 0

; Constants
.equ COMPLETE 1
```

### Example 5: File System Operations
```assembly
; File I/O example - create, write, and read a file
.org 0

main:
    ; Create file
    LDA #CREATE_FILE    ; Command
    STA DISK_CMD
    LDA #filename       ; Filename
    STA DISK_ADDR
    JSR disk_operation
    
    ; Write data to file
    LDA #WRITE_FILE     ; Command
    STA DISK_CMD
    LDA #data           ; Data to write
    STA DISK_ADDR
    LDA #data_len       ; Data length
    STA DISK_SIZE
    JSR disk_operation
    
    ; Close file
    LDA #CLOSE_FILE     ; Command
    STA DISK_CMD
    JSR disk_operation
    
    ; Reopen for reading
    LDA #OPEN_FILE      ; Command
    STA DISK_CMD
    LDA #filename       ; Filename  
    STA DISK_ADDR
    JSR disk_operation
    
    ; Read data back
    LDA #READ_FILE      ; Command
    STA DISK_CMD
    LDA #buffer         ; Read buffer
    STA DISK_ADDR
    LDA #data_len       ; Bytes to read
    STA DISK_SIZE
    JSR disk_operation
    
    ; Output read data
    LDA #buffer
    JSR print_string
    HLT

disk_operation:
    ; Trigger disk operation
    LDA #1
    STA DISK_GO
    
    ; Wait for completion
wait_disk:
    LDA DISK_STATUS
    CMP #BUSY
    JZ wait_disk
    RTS

print_string:
    ; String printing subroutine
    STA temp_addr
    LDX #0
print_loop:
    LDA (temp_addr),X
    CMP #0
    JZ print_done
    OUTC                ; Output character
    INX
    JMP print_loop
print_done:
    RTS

; Data
filename: .str "test.txt"
data:     .str "Hello from Balanced Ternary file system!"
data_len: .db 42
buffer:   .ds 100
temp_addr: .db 0

; Disk commands
.equ CREATE_FILE 1
.equ OPEN_FILE   2  
.equ READ_FILE   3
.equ WRITE_FILE  4
.equ CLOSE_FILE  5
.equ BUSY        1
```

### Example 6: Graphics Programming
```assembly
; Draw a simple pattern on the graphics display
.org 0

main:
    ; Clear screen
    JSR clear_screen
    
    ; Draw horizontal line
    LDA #10         ; Y coordinate
    STA y_coord
    LDA #0          ; Start X
    STA x_coord
    
draw_line:
    LDA x_coord
    LDX y_coord
    JSR plot_pixel
    
    LDA x_coord
    INC
    STA x_coord
    CMP #80         ; End X
    JNZ draw_line
    
    ; Draw vertical line
    LDA #40         ; X coordinate
    STA x_coord
    LDA #0          ; Start Y
    STA y_coord
    
draw_vline:
    LDA x_coord
    LDX y_coord  
    JSR plot_pixel
    
    LDA y_coord
    INC
    STA y_coord
    CMP #80         ; End Y
    JNZ draw_vline
    
    HLT

clear_screen:
    ; Clear all pixels
    LDA #GRAPHICS_BASE
    STA addr
    LDA #0          ; Black pixel
clear_loop:
    STA (addr)
    LDA addr
    INC
    STA addr
    CMP #GRAPHICS_END
    JNZ clear_loop
    RTS

plot_pixel:
    ; Plot pixel at (ACC, X)
    ; Calculate address: GRAPHICS_BASE + Y*81 + X
    STA temp_x
    LDA IX
    MUL #81         ; Y * width
    ADD temp_x      ; Add X
    ADD #GRAPHICS_BASE
    STA pixel_addr
    
    ; Set pixel (color = +)
    LDA #1          ; White pixel
    STA (pixel_addr)
    RTS

; Variables
x_coord:    .db 0
y_coord:    .db 0
pixel_addr: .db 0
temp_x:     .db 0
addr:       .db 0

; Constants  
.equ GRAPHICS_BASE 18001
.equ GRAPHICS_END  18501
```

### Example 7: Operating System Usage
```assembly
; Demonstrate OS system calls and process management
.org 0

main:
    ; Print startup message
    LDA #1              ; sys_write
    LDX #startup_msg
    SYSCALL
    
    ; Create a child process
    LDA #2              ; sys_fork
    SYSCALL
    
    ; Check if we're parent or child
    CMP #0
    JZ child_process
    
parent_process:
    ; Parent code
    LDA #1              ; sys_write
    LDX #parent_msg
    SYSCALL
    
    ; Wait for child
    LDA #3              ; sys_wait
    SYSCALL
    
    LDA #1              ; sys_write
    LDX #done_msg
    SYSCALL
    
    LDA #0              ; sys_exit
    SYSCALL

child_process:
    ; Child code
    LDA #1              ; sys_write
    LDX #child_msg
    SYSCALL
    
    ; Do some work
    LDA #100
work_loop:
    DEC
    JNZ work_loop
    
    LDA #0              ; sys_exit
    SYSCALL

; Messages
startup_msg: .str "Starting multi-process example\n"
parent_msg:  .str "Parent process running\n"  
child_msg:   .str "Child process running\n"
done_msg:    .str "All processes completed\n"
```

## Performance Optimization Tips

### Assembly Optimization
1. **Use Registers**: Keep frequently used values in registers
2. **Minimize Memory Access**: Cache values locally when possible
3. **Pipeline-Friendly Code**: Avoid dependencies between consecutive instructions
4. **Branch Prediction**: Use consistent branching patterns

### Memory Optimization
1. **Locality of Reference**: Access memory in sequential patterns
2. **Cache-Friendly Data Structures**: Align data to cache boundaries
3. **Minimize Memory Fragmentation**: Allocate/deallocate in consistent patterns

### Multi-Core Optimization
1. **Parallel Algorithms**: Divide work between cores effectively
2. **Minimize Synchronization**: Reduce lock contention
3. **Load Balancing**: Distribute work evenly across cores

## Troubleshooting

### Common Issues
1. **Assembly Errors**: Check syntax and instruction spelling
2. **Memory Violations**: Ensure addresses are within valid range
3. **Stack Overflow**: Monitor stack usage in recursive programs
4. **Pipeline Stalls**: Optimize instruction sequences for pipeline

### Error Messages
- `"Address out of bounds"`: Memory address exceeds system limits
- `"Invalid instruction"`: Unrecognized opcode or syntax error
- `"Stack underflow"`: Pop operation on empty stack
- `"Division by zero"`: Arithmetic division by zero value

### Debug Techniques
1. **Single Step**: Use step-by-step execution
2. **Memory Watches**: Monitor critical memory locations
3. **Register Inspection**: Check register values at breakpoints
4. **Trace Execution**: Log all instruction execution

## Advanced Topics

### Custom Instruction Development
The simulator supports adding custom instructions:

```javascript
// Add custom instruction to CPU
cpu.addCustomInstruction('SWAP', 100, function(operand) {
    const temp = this.registers.ACC;
    this.registers.ACC = this.registers.IX;
    this.registers.IX = temp;
});
```

### Hardware Simulation Extensions
Extend the simulator with custom hardware:

```javascript
// Add custom I/O device
class CustomDevice {
    constructor(baseAddress) {
        this.baseAddress = baseAddress;
        this.registers = new Array(10).fill(0);
    }
    
    read(address) {
        const offset = address - this.baseAddress;
        return new Tryte(this.registers[offset] || 0);
    }
    
    write(address, value) {
        const offset = address - this.baseAddress;
        this.registers[offset] = value.toDecimal();
    }
}
```

## Contributing and Extending

### File Structure
- `index.html` - Main web interface
- `simulator.js` - Main simulator controller
- `cpu.js` - CPU implementation with ALU and registers
- `memory.js` - Memory system with cache
- `assembler.js` - Assembly language compiler
- `ternary.js` - Balanced ternary arithmetic
- `multicore.js` - Multi-core CPU support
- `pipeline.js` - Instruction pipeline
- `os.js` - Operating system implementation
- `disk.js` - Virtual disk drive
- `snapshot.js` - State save/load system
- `cache.js` - Cache memory system
- `graphics.js` - Graphics display system

### Testing
Always run the test suite after making changes:
```bash
node test.js          # Main test suite (~5 seconds)
node simple_test.js   # Basic functionality tests
node manual_test.js   # Manual instruction tests
```

### Documentation
- `README.md` - This comprehensive guide
- `INSTRUCTION_SET.md` - Complete instruction reference
- `HIGH_LEVEL_LANGUAGE.md` - High-level language guide

## References and Further Reading

### Balanced Ternary
- [Balanced Ternary on Wikipedia](https://en.wikipedia.org/wiki/Balanced_ternary)
- "The Art of Computer Programming" by Donald Knuth (Volume 2, Section 4.1)
- Soviet Setun Computer (historical balanced ternary computer)

### Computer Architecture
- "Computer Organization and Design" by Patterson & Hennessy
- "Computer Architecture: A Quantitative Approach" by Hennessy & Patterson

This simulator provides a complete environment for exploring balanced ternary computing, computer architecture concepts, and systems programming in a unique and educational setting.

## Instruction Set

### Data Movement
- `LDA #value` / `LDA addr` - Load accumulator (immediate/direct)
- `STA addr` - Store accumulator to memory
- `LDX #value` / `LDX addr` - Load index register
- `STX addr` - Store index register

### Arithmetic
- `ADD #value` / `ADD addr` - Add to accumulator
- `SUB #value` / `SUB addr` - Subtract from accumulator
- `MUL #value` / `MUL addr` - Multiply accumulator
- `INC` - Increment accumulator
- `DEC` - Decrement accumulator

### Logical Operations
- `AND #value` / `AND addr` - Ternary AND operation
- `OR #value` / `OR addr` - Ternary OR operation
- `NOT` - Ternary NOT operation
- `SHL #positions` - Shift left
- `SHR #positions` - Shift right

### Control Flow
- `CMP #value` / `CMP addr` - Compare with accumulator
- `JMP addr` - Unconditional jump
- `JZ addr` - Jump if zero
- `JP addr` - Jump if positive
- `JN addr` - Jump if negative
- `JSR addr` - Jump to subroutine
- `RTS` - Return from subroutine

### Stack Operations
- `PSH addr` - Push value to stack
- `POP addr` - Pop value from stack

### System
- `NOP` - No operation
- `HLT` - Halt execution
- `IN` - Input operation
- `OUT` - Output operation

## Example Programs

### Simple Addition
```assembly
; Add two numbers and output result
LDA #10     ; Load 10 into accumulator
ADD #5      ; Add 5 to accumulator
OUT         ; Output result (15)
HLT         ; Halt program
```

### Loop Example
```assembly
; Count down from 5
    LDA #5      ; Load counter
loop:
    OUT         ; Output current value
    DEC         ; Decrement counter
    JZ done     ; Jump if zero
    JMP loop    ; Loop back
done:
    HLT         ; End program
```

### Subroutine Example
```assembly
main:
    LDA #42     ; Load test value
    JSR print   ; Call print subroutine
    HLT         ; End program

print:
    OUT         ; Output accumulator value
    RTS         ; Return to caller
```

## Web Interface

### Controls
- **Run**: Execute program continuously
- **Step**: Execute one instruction
- **Pause**: Pause execution
- **Reset**: Reset CPU and memory
- **Assemble**: Compile assembly code to machine code

### Displays
- **Registers**: Real-time register values in balanced ternary
- **Memory**: Live memory view with configurable start address
- **ALU**: Last operation and result display
- **Console**: Text output from programs
- **Graphics**: 24x16 character display for graphics output
- **Debug Info**: Current instruction, execution state, cycle count

## Technical Implementation

### File Structure
- `index.html` - Main web interface
- `styles.css` - Styling and layout
- `ternary.js` - Balanced ternary number system implementation
- `memory.js` - Memory and I/O system
- `cpu.js` - CPU, ALU, and instruction execution
- `assembler.js` - Assembly language compiler
- `simulator.js` - Main simulator controller and UI integration

### Balanced Ternary Encoding
- **Trits**: Stored as arrays of -1, 0, +1 values
- **Display Format**: T/0/1 or -/0/+ notation
- **Width Handling**: Automatic padding and truncation
- **Arithmetic**: Native balanced ternary operations

### Memory Model
- **Address Space**: 9-trit addresses (configurable)
- **Storage**: Sparse array using Map for efficiency
- **I/O Mapping**: High memory addresses for I/O operations
- **Access Tracking**: Complete history for debugging

## Getting Started

### Running the Simulator
1. Open `index.html` in a modern web browser
2. Or serve via HTTP: `python3 -m http.server 8080`
3. Load an example program or write your own
4. Click "Assemble" to compile the code
5. Use "Run" or "Step" to execute the program

### Writing Programs
1. Use the built-in editor with syntax highlighting
2. Start with `.org 0` to set the program origin
3. Use labels for addresses: `loop: JMP loop`
4. Comments start with semicolon: `; This is a comment`
5. Immediate values use `#`: `LDA #42`
6. Memory addresses are direct: `STA 100`

### Debugging
1. Set breakpoints using `debugFunctions.setBreakpoint(addr)`
2. Set memory watchpoints: `debugFunctions.setWatchpoint(addr)`
3. View memory: `debugFunctions.dumpMemory(start, count)`
4. Export/import state for reproducible debugging

## Testing

Run the test suite in Node.js:
```bash
node test.js
```

This tests:
- Balanced ternary arithmetic
- Memory operations
- CPU instruction execution
- Assembly/disassembly
- End-to-end program execution

## Future Enhancements

- Interrupt system
- More addressing modes
- Floating-point ternary arithmetic
- Expanded graphics capabilities
- Network I/O simulation
- Multi-core ternary processing
- Advanced debugging features

## Architecture Notes

This simulator demonstrates a complete balanced ternary computer architecture, showcasing how computation could work in a base-3 signed number system. The design prioritizes clarity and educational value while maintaining functional completeness.

The balanced ternary system offers interesting properties:
- Symmetric positive/negative representation
- No separate sign bit needed
- Elegant arithmetic operations
- Natural three-way logic operations

This makes it an fascinating alternative to binary computing for educational exploration and research into alternative computational models.