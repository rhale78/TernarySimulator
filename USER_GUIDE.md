# Balanced Ternary CPU Simulator - User Guide

This guide provides detailed instructions for using all features of the Balanced Ternary CPU Simulator.

## Getting Started

### First Time Setup
1. **No Installation Required**: The simulator runs entirely in your web browser
2. **System Requirements**: Modern web browser with JavaScript enabled
3. **Optional Web Server**: For full functionality, serve via HTTP (recommended)

### Opening the Simulator
**Method 1: Direct File Access**
- Simply open `index.html` in your web browser
- All features work except file import/export

**Method 2: Web Server (Recommended)**
```bash
# Using Python's built-in server
python3 -m http.server 8080

# Using Node.js (if available)
npx http-server -p 8080

# Using PHP (if available)  
php -S localhost:8080
```
Then navigate to `http://localhost:8080`

## Interface Overview

### Main Layout
The simulator interface is divided into several sections:

1. **Header**: Control buttons (Run, Step, Reset, Pause)
2. **Left Panel**: Program editor and memory viewer
3. **Right Panel**: CPU state, I/O systems, and debugging tools
4. **Bottom Panel**: Debug information and system status

### Control Buttons
- **Run**: Execute the program continuously
- **Step**: Execute one instruction and pause
- **Reset**: Reset CPU state and clear execution
- **Pause**: Stop continuous execution
- **Assemble**: Compile assembly code to machine code

### Program Editor
- **Syntax Highlighting**: Assembly and high-level language support
- **Line Numbers**: Displayed on the left side
- **Breakpoints**: Click line numbers to set/clear breakpoints
- **Language Selection**: Switch between Assembly and C-like high-level language

## Writing Your First Program

### Simple Addition Program
```assembly
; This program adds two numbers and displays the result
.org 0              ; Start at memory address 0

main:
    LDA #15         ; Load 15 into accumulator
    ADD #27         ; Add 27 to accumulator (result: 42)
    OUT             ; Output the result
    HLT             ; Halt the program
```

### Running the Program
1. **Enter the code** in the program editor
2. **Click "Assemble"** - you should see "Assembly successful!"
3. **Click "Run"** - the program executes
4. **Check the Console Output** - you should see "42"
5. **Watch the Registers** - see how ACC (accumulator) changes

## Memory System Usage

### Memory Viewer
The memory viewer shows:
- **Address**: 9-trit balanced ternary addresses
- **Value**: Current memory contents in balanced ternary
- **Decimal**: Decimal equivalent in parentheses

### Memory Navigation
- **Page Controls**: Use "◀ Prev" and "Next ▶" to navigate
- **Page Size**: Change how many locations to view (16, 32, or 64)
- **Direct Navigation**: Enter page number in the "Page" field

### Memory Search
1. **Enter search term** in the "Search" field
2. **Click "Find"** to locate the value
3. **Use "Next"/"Prev"** to cycle through results

### Recent Memory Changes
The "Recent Memory Changes" section shows:
- **Address**: Where the change occurred
- **Old → New**: Previous and current values
- **Timestamp**: When the change happened

## CPU State Monitoring

### Registers Display
Monitor all CPU registers in real-time:
- **PC (Program Counter)**: Current instruction address
- **ACC (Accumulator)**: Primary data register  
- **IX, IX1-IX3**: Index registers for addressing
- **SP (Stack Pointer)**: Top of stack location
- **R1-R9**: General-purpose registers
- **FLAGS**: Condition flags (Zero, Positive, Negative, Carry, Overflow)

### ALU Operations
The ALU section shows:
- **Last Operation**: Most recent arithmetic/logical operation
- **Result**: Operation result
- **Flags**: Updated condition flags

## Stack Operations

### Stack Viewer
- **Refresh**: Update stack display
- **Depth**: Number of stack entries to show
- **Stack Visualization**: See stack contents and current pointer

### Stack Programming
```assembly
; Stack example - reverse three numbers
LDA #10
PSH ACC         ; Push 10

LDA #20  
PSH ACC         ; Push 20

LDA #30
PSH ACC         ; Push 30

; Pop and output in reverse order
POP ACC
OUT             ; Outputs 30

POP ACC  
OUT             ; Outputs 20

POP ACC
OUT             ; Outputs 10
```

## I/O Systems

### Console Output
Programs can output text and numbers:
```assembly
OUT             ; Output accumulator as decimal number
OUTC            ; Output accumulator as character
```

### Character Display (24x16)
A text-based display for character output:
- **Memory-mapped**: Addresses 17001-17384
- **Format**: Each location contains character code + attributes
- **Usage**: Store character codes to display text

### Graphics Display (81x81 pixels)
Ternary pixel graphics with 9 colors:
- **Memory-mapped**: Addresses 18001-18500
- **Colors**: 9 combinations of ternary RGB (-, 0, +)
- **Resolution**: 81×81 pixels (6561 total)

## Virtual Disk System

### Disk Status
The Virtual Disk Drive section shows:
- **Status**: Current drive state (Ready/Busy)
- **Files**: Number of files vs. maximum (243)
- **Usage**: Percentage of disk space used

### File Operations
**List Files**
```assembly
LDA #LIST_DIR       ; Command: List directory
STA DISK_CMD        ; Set command
JSR disk_operation  ; Execute
```

**Create File**
```assembly
LDA #CREATE_FILE    ; Command: Create file
STA DISK_CMD
LDA #filename       ; Filename address
STA DISK_ADDR
JSR disk_operation
```

**Read/Write Files**
```assembly
; Writing
LDA #WRITE_FILE     ; Command: Write
STA DISK_CMD
LDA #data_addr      ; Data location
STA DISK_ADDR
LDA #data_size      ; Number of bytes
STA DISK_SIZE
JSR disk_operation

; Reading  
LDA #READ_FILE      ; Command: Read
STA DISK_CMD
LDA #buffer_addr    ; Buffer location
STA DISK_ADDR
LDA #read_size      ; Number of bytes
STA DISK_SIZE
JSR disk_operation
```

## Cache Memory System

### Cache Statistics
Monitor cache performance:
- **L1 Hit Rate**: Level 1 cache efficiency
- **L2 Hit Rate**: Level 2 cache efficiency  
- **Total Accesses**: Number of memory operations
- **Memory Hit Rate**: Overall memory system efficiency

### Cache Operations
- **Show Stats**: Detailed cache performance analysis
- **Benchmark**: Run cache performance tests
- **Flush All**: Clear all cache contents

### Optimizing for Cache Performance
```assembly
; Cache-friendly sequential access
LDX #0
loop:
    LDA array,X     ; Sequential memory access (cache-friendly)
    ADD #1
    STA array,X
    INX
    CPX #100
    JNZ loop

; vs. cache-unfriendly random access
LDX #0
random_loop:
    LDA random_array,X  ; Random access pattern (cache-unfriendly)
    ; ... process data
    ; Generate next random index
    ; ...
```

## DMA Controller

### DMA Status
Monitor Direct Memory Access:
- **Status**: DMA controller state
- **Active Channels**: Number of channels in use (out of 9)
- **Total Transfers**: Completed DMA operations
- **Efficiency**: DMA utilization percentage

### DMA Operations
- **Show Channels**: View channel status and configurations
- **Show Stats**: Detailed DMA performance statistics
- **Test Transfer**: Run DMA functionality test

### Programming DMA Transfers
```assembly
; Set up DMA transfer
LDA #source_addr        ; Source address
STA DMA_SRC_ADDR

LDA #dest_addr          ; Destination address  
STA DMA_DEST_ADDR

LDA #transfer_size      ; Number of bytes
STA DMA_SIZE

LDA #START_TRANSFER     ; Start command
STA DMA_COMMAND

; Wait for completion
wait_dma:
    LDA DMA_STATUS
    CMP #BUSY
    JZ wait_dma

; Check result
LDA DMA_STATUS
CMP #COMPLETE
JZ dma_success
```

## Operating System (BTOS)

### OS Status
The Balanced Ternary Operating System section shows:
- **Status**: OS boot state (Not Booted/Running)
- **Shell**: Command shell status
- **Processes**: Number of running processes

### Booting the OS
1. **Click "Boot OS"** to start the operating system
2. **Wait for boot process** to complete
3. **Shell becomes active** for command input

### OS Commands
Enter commands in the OS command line:

**File System Commands**
```bash
ls                  # List files and directories
cat filename        # Display file contents
mkdir dirname       # Create directory
rm filename         # Delete file
cp source dest      # Copy file
mv old_name new_name # Rename file
pwd                 # Show current directory
cd dirname          # Change directory
```

**Process Management**  
```bash
ps                  # Show running processes
kill pid            # Terminate process by ID
top                 # Show process activity
mem                 # Display memory usage
```

**System Information**
```bash
help                # Show available commands
ver                 # Show OS version
uptime              # System uptime
stat filename       # Show file statistics
df                  # Disk usage information
```

## System Snapshots

### Creating Snapshots
Snapshots save the complete system state:
1. **Enter snapshot name** in the "Snapshot name" field
2. **Add description** (optional) in the "Description" field
3. **Click "Create Snapshot"** to save current state

### What Gets Saved
- Complete CPU state (all registers, flags, pipeline)
- Full memory contents (sparse array preservation)
- Virtual disk filesystem and all files
- Graphics and video memory
- Operating system state and processes
- Multi-core configuration and state

### Loading Snapshots
1. **Select snapshot** from the dropdown menu
2. **Click "Load"** to restore the saved state
3. **System immediately** returns to saved state

### Sharing Snapshots
**Export for Sharing**
1. **Select snapshot** to export
2. **Click "Export"** to save to file
3. **Share the file** with colleagues or friends

**Import from Others**
1. **Click "Import"** to select a snapshot file
2. **Choose the file** from your computer
3. **Snapshot becomes available** in your list

## Multi-Core Processing

### Core Configuration
- **Core Count**: Select Single Core or Dual Core
- **Active Core**: Shows which core is currently active
- **Parallel Mode**: Enable/disable parallel execution
- **Global Cycles**: Total cycles across all cores

### Multi-Core Operations
- **Apply Configuration**: Apply core count changes
- **Switch Core**: Change active core (single-threaded mode)
- **Toggle Parallel**: Switch between parallel and single-threaded
- **Core Stats**: View detailed multi-core statistics

### Programming for Multi-Core
```assembly
; Multi-core synchronization example
main:
    ; Check current core
    LDA CORE_ID
    CMP #0
    JZ core0_task
    JMP core1_task

core0_task:
    ; Core 0 work
    LDA #shared_var
    LOCK mutex1         ; Acquire lock
    ADD #1              ; Critical section
    STA shared_var
    UNLOCK mutex1       ; Release lock
    HLT

core1_task:
    ; Core 1 work  
    LDA #shared_var
    LOCK mutex1         ; Acquire lock
    ADD #2              ; Critical section
    STA shared_var
    UNLOCK mutex1       ; Release lock
    HLT

shared_var: .db 0
mutex1:     .db 0
```

## Pipeline System

### Pipeline Status
Monitor instruction pipeline:
- **Pipeline Enabled**: Whether pipelining is active
- **Fetch Stage**: Current instruction being fetched
- **Decode Stage**: Instruction being decoded
- **Execute Stage**: Instruction being executed
- **Writeback Stage**: Instruction writing results
- **Pipeline Stalls**: Number of pipeline delays
- **Pipeline Efficiency**: Performance percentage

### Pipeline Controls
- **Toggle Pipeline**: Enable/disable instruction pipelining
- **Pipeline Stats**: View detailed pipeline performance

### Pipeline-Friendly Programming
```assembly
; Pipeline-friendly code (avoid dependencies)
LDA #10         ; Fetch cycle 1
LDX #20         ; Fetch cycle 2 (no dependency on previous)
ADD #5          ; Fetch cycle 3 (depends on LDA, but pipeline handles this)
STX temp        ; Fetch cycle 4 (no dependency conflict)

; vs. Pipeline-unfriendly code (many dependencies)
LDA #10         ; Fetch cycle 1
ADD #5          ; Fetch cycle 2 (depends on LDA - potential stall)
MUL #2          ; Fetch cycle 3 (depends on ADD - potential stall)
STA result      ; Fetch cycle 4 (depends on MUL - potential stall)
```

## Performance Profiling

### Enabling Profiling
1. **Click "Start Profiling"** to begin collecting performance data
2. **Run your program** normally
3. **View statistics** in the Performance Profiler section

### Performance Metrics
- **Instructions Executed**: Total instruction count
- **Cycles per Second**: Execution speed
- **Most Used Instruction**: Frequency analysis
- **Instruction Frequency**: Detailed usage statistics

### Using Performance Data
```javascript
// Access profiling data via console
const profile = debugFunctions.getProfilerReport();
console.log(`Performance Analysis:
  Total Instructions: ${profile.totalInstructions}
  Average CPI: ${profile.averageCPI}
  Pipeline Efficiency: ${profile.pipelineEfficiency}%
  Cache Hit Rate: ${profile.cacheHitRate}%
  Most Used Instruction: ${profile.mostUsedInstruction}
`);
```

## Debugging Techniques

### Setting Breakpoints
**In the Editor**
- **Click line numbers** to set/clear breakpoints
- **Red dot** indicates active breakpoint
- **Program pauses** when reaching breakpoint

**Via Console**
```javascript
// Set breakpoint at address 10
debugFunctions.setBreakpoint(10);

// Set conditional breakpoint
debugFunctions.setConditionalBreakpoint(15, 'ACC > 50');

// Clear all breakpoints
debugFunctions.clearAllBreakpoints();
```

### Memory Watchpoints
Monitor specific memory locations:
```javascript
// Watch address 100
debugFunctions.setWatchpoint(100);

// Watch range of addresses
debugFunctions.setWatchpointRange(100, 110);

// Get watchpoint hits
const hits = debugFunctions.getWatchpointHits();
```

### Step-by-Step Debugging
1. **Set breakpoint** at the start of your program
2. **Click "Run"** - execution pauses at breakpoint
3. **Click "Step"** to execute one instruction
4. **Watch registers** and memory update
5. **Continue stepping** through your program

### Advanced Debugging
```javascript
// Trace execution
debugFunctions.enableTrace();
simulator.run();
const trace = debugFunctions.getTraceLog();

// Memory analysis
const memAnalysis = debugFunctions.analyzeMemoryUsage();
console.log(`Memory hotspots: ${memAnalysis.hotSpots}`);

// Performance profiling
debugFunctions.startProfiler();
simulator.run();
const perf = debugFunctions.getProfilerReport();
```

## Troubleshooting Common Issues

### Assembly Errors
**"Invalid instruction"**
- Check instruction spelling
- Verify instruction exists in instruction set
- Check operand format (immediate vs. direct addressing)

**"Address out of bounds"**
- Verify memory addresses are within 0-19682 range
- Check array bounds in your program
- Ensure stack doesn't overflow

### Runtime Errors
**"Stack underflow"**
- Check that every `PSH` has matching `POP`
- Verify subroutine calls have matching returns
- Don't pop from empty stack

**"Division by zero"**
- Check divisor values before `DIV` instruction
- Use conditional logic to handle zero cases

### Performance Issues
**Slow execution**
- Enable pipeline for better performance
- Use cache-friendly memory access patterns
- Minimize branching in tight loops

**High memory usage**
- Use registers instead of memory variables
- Clear unused data structures
- Monitor memory usage with debugging tools

## Advanced Features

### Custom Hardware Extensions
The simulator supports custom hardware additions:
```javascript
// Add custom I/O device
class MyDevice {
    constructor(baseAddr) {
        this.baseAddr = baseAddr;
        this.data = 0;
    }
    
    read(addr) {
        return new Tryte(this.data);
    }
    
    write(addr, value) {
        this.data = value.toDecimal();
        console.log(`Device received: ${this.data}`);
    }
}

// Register device
simulator.addIODevice(new MyDevice(19000));
```

### System Integration
```javascript
// Export system state for external tools
const state = debugFunctions.exportState();

// Custom analysis
function analyzeProgram(state) {
    // Your analysis code here
    return analysis;
}

// Integration with external tools
const analysis = analyzeProgram(state);
```

## Tips for Effective Use

### Programming Best Practices
1. **Comment your code** - Use semicolons for assembly comments
2. **Use meaningful labels** - Make code self-documenting
3. **Test incrementally** - Debug small sections at a time
4. **Use the profiler** - Identify performance bottlenecks

### Debugging Best Practices
1. **Start with simple programs** - Build complexity gradually
2. **Use single-step debugging** - Understand each instruction
3. **Monitor memory carefully** - Watch for unexpected changes
4. **Save snapshots** - Preserve working states

### Performance Best Practices
1. **Enable pipelining** - For better instruction throughput
2. **Use registers** - Faster than memory access
3. **Optimize memory patterns** - Sequential access is cache-friendly
4. **Profile your code** - Find actual bottlenecks

This user guide covers all major features of the Balanced Ternary CPU Simulator. For complete instruction reference, see `INSTRUCTION_SET.md`. For high-level language programming, see `HIGH_LEVEL_LANGUAGE.md`.