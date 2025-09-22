# Balanced Ternary CPU Simulator

A complete web-based balanced ternary CPU simulator implementing a custom architecture with balanced ternary arithmetic, memory, and instruction set.

## Features

### Core Ternary System
- **Balanced Ternary Numbers**: Uses trits with values -1, 0, +1
- **Tryte Data Type**: 6-trit data words (range: -364 to +364)
- **9-Trit Addressing**: Configurable address width (default 9 trits = 19,683 addresses)

### CPU Architecture
- **ALU**: Full balanced ternary arithmetic and logical operations
- **Registers**: PC, ACC, IX, SP, FLAGS, and general-purpose registers
- **Instruction Set**: 20+ instructions including arithmetic, logical, branching, and I/O
- **Stack Operations**: Push/pop with dedicated stack pointer

### Memory System
- **Sparse Memory**: Efficient storage using Map-based implementation
- **Memory-Mapped I/O**: Console output and graphics regions
- **Watchpoints**: Debugging support with memory access tracking

### Development Tools
- **Assembler**: Converts assembly language to balanced ternary machine code
- **Debugger**: Step execution, breakpoints, register/memory inspection
- **Program Editor**: Syntax-highlighted code editor with example programs
- **Live Displays**: Real-time register, memory, and execution state visualization

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