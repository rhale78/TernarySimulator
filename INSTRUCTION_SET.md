# Balanced Ternary CPU Instruction Set Reference

## Overview

The Balanced Ternary CPU implements a comprehensive instruction set with 70+ instructions designed for educational and research purposes. The instruction set draws inspiration from RISC, x86, and Z80 architectures while maintaining the unique characteristics of balanced ternary arithmetic.

## Instruction Format

Instructions are encoded as 6-trit words (Trytes) with the following format:
- **Bits 5-3**: 3-trit opcode (-13 to +13 range for compact encoding)
- **Bits 2-0**: 3-trit operand (immediate value or address modifier)

Extended opcodes use additional range (14-61) for specialized operations.

## Addressing Modes

1. **Immediate**: `#value` - Value is used directly
2. **Direct**: `address` - Memory location is accessed
3. **Indexed**: `address,X` - Address + index register (where supported)

## Data Movement Instructions

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `LDA`    | 1      | Load Accumulator | `LDA #10` - Load 10 into ACC |
| `STA`    | 2      | Store Accumulator | `STA 20` - Store ACC to address 20 |
| `LDX`    | 3      | Load Index Register | `LDX #5` - Load 5 into IX |
| `STX`    | 4      | Store Index Register | `STX 30` - Store IX to address 30 |
| `MOV`    | 5      | Move Data | `MOV R1,R2` - Move R1 to R2 |
| `LDX1`   | -12    | Load Index Register 1 | `LDX1 #7` - Load 7 into IX1 |

### Extended Data Movement

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `LDAW`   | 14     | Load Accumulator Word (12-trit) | `LDAW 100` |
| `STAW`   | 15     | Store Accumulator Word | `STAW 200` |
| `LDAT`   | 19     | Load Accumulator Triple (18-trit) | `LDAT 300` |
| `STAT`   | 20     | Store Accumulator Triple | `STAT 400` |

## Arithmetic Instructions

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `ADD`    | 6      | Add to Accumulator | `ADD #5` - ACC = ACC + 5 |
| `SUB`    | 7      | Subtract from Accumulator | `SUB #3` - ACC = ACC - 3 |
| `MUL`    | 8      | Multiply Accumulator | `MUL #2` - ACC = ACC * 2 |
| `DIV`    | 50     | Divide Accumulator | `DIV #4` - ACC = ACC / 4 |
| `MOD`    | 51     | Modulo Operation | `MOD #3` - ACC = ACC % 3 |
| `INC`    | 9      | Increment Register | `INC` - ACC = ACC + 1 |
| `DEC`    | 10     | Decrement Register | `DEC` - ACC = ACC - 1 |

### Extended Arithmetic

| Mnemonic | Opcode | Description |
|----------|--------|-------------|
| `ADDW`   | 16     | Add Word (12-trit) |
| `SUBW`   | 17     | Subtract Word |
| `MULW`   | 18     | Multiply Word |
| `ADDT`   | 21     | Add Triple-word (18-trit) |
| `SUBT`   | 22     | Subtract Triple-word |
| `MULT`   | 23     | Multiply Triple-word |

## Logical Instructions

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `AND`    | 11     | Logical AND | `AND #7` - ACC = ACC AND 7 |
| `OR`     | 12     | Logical OR | `OR #3` - ACC = ACC OR 3 |
| `XOR`    | 52     | Logical XOR | `XOR #5` - ACC = ACC XOR 5 |
| `NOT`    | 13     | Logical NOT | `NOT` - ACC = NOT ACC |

## Bit/Trit Manipulation

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `SHL`    | 53     | Shift Left | `SHL #2` - Shift ACC left 2 positions |
| `SHR`    | 54     | Shift Right | `SHR #1` - Shift ACC right 1 position |
| `ROL`    | 55     | Rotate Left | `ROL #3` - Rotate ACC left 3 positions |
| `ROR`    | 56     | Rotate Right | `ROR #2` - Rotate ACC right 2 positions |

## Control Flow Instructions

### Unconditional Jumps

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `JMP`    | -2     | Unconditional Jump | `JMP loop` - Jump to 'loop' label |
| `JSR`    | -6     | Jump to Subroutine | `JSR sub1` - Call subroutine |
| `RTS`    | -7     | Return from Subroutine | `RTS` - Return to caller |
| `CALL`   | 60     | Call Subroutine (x86-style) | `CALL func` |
| `RET`    | 61     | Return (x86-style) | `RET` |

### Conditional Jumps

| Mnemonic | Opcode | Description | Condition |
|----------|--------|-------------|-----------|
| `JZ`     | -3     | Jump if Zero | ACC == 0 |
| `JNZ`    | 57     | Jump if Not Zero | ACC != 0 |
| `JP`     | -4     | Jump if Positive | ACC > 0 |
| `JN`     | -5     | Jump if Negative | ACC < 0 |
| `JC`     | 58     | Jump if Carry | Carry flag set |
| `JNC`    | 59     | Jump if Not Carry | Carry flag clear |

### Comparison

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `CMP`    | -1     | Compare | `CMP #10` - Compare ACC with 10 |

## Stack Operations

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `PSH`    | -8     | Push to Stack | `PSH R1` - Push R1 onto stack |
| `POP`    | -9     | Pop from Stack | `POP R2` - Pop stack into R2 |

## Input/Output Instructions

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `IN`     | -10    | Input Operation | `IN 1` - Read from I/O port 1 |
| `OUT`    | -11    | Output Operation | `OUT` - Output ACC to console |

## Floating-Point Instructions

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `FLDA`   | 28     | Float Load to FPU | `FLDA #3.14` |
| `FSTA`   | 29     | Float Store from FPU | `FSTA 100` |
| `FADD`   | 30     | Float Add | `FADD #2.5` |
| `FSUB`   | 31     | Float Subtract | `FSUB #1.0` |
| `FMUL`   | 32     | Float Multiply | `FMUL #2.0` |
| `FDIV`   | 33     | Float Divide | `FDIV #4.0` |
| `FCMP`   | 34     | Float Compare | `FCMP #0.0` |
| `FMOD`   | 35     | Set FPU Mode | `FMOD 1` - Set ternary mode |

## Interrupt Control

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `SEI`    | 36     | Set (Enable) Interrupts | `SEI` |
| `CLI`    | 37     | Clear (Disable) Interrupts | `CLI` |
| `RTI`    | 38     | Return from Interrupt | `RTI` |
| `SWI`    | 39     | Software Interrupt | `SWI #5` |
| `MSK`    | 40     | Mask Interrupt | `MSK #3` |
| `UMK`    | 41     | Unmask Interrupt | `UMK #3` |
| `SML`    | 42     | Set Mask Level | `SML #10` |

## Memory Management

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `MPG`    | 43     | Enable/Disable Paging | `MPG #1` - Enable paging |
| `MPT`    | 44     | Set Protection Level | `MPT #2` |
| `MAP`    | 45     | Map Virtual Page | `MAP 10,20` |
| `UMP`    | 46     | Unmap Virtual Page | `UMP 10` |
| `FLT`    | 47     | Flush TLB | `FLT` |
| `LVA`    | 48     | Load from Virtual Address | `LVA 1000` |
| `SVA`    | 49     | Store to Virtual Address | `SVA 2000` |

## Memory Block Operations

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `MOVC`   | 24     | Memory Copy Block | `MOVC src,dst,len` |
| `MOVW`   | 25     | Move Word Block | `MOVW src,dst,len` |
| `MOVT`   | 26     | Move Triple Block | `MOVT src,dst,len` |
| `CLRB`   | 27     | Clear Block | `CLRB start,len` |

## System Control

| Mnemonic | Opcode | Description | Example |
|----------|--------|-------------|---------|
| `NOP`    | 0      | No Operation | `NOP` |
| `HLT`    | -13    | Halt Program | `HLT` |

## Flag Register

The flag register contains the following bits:
- **Bit 0**: Zero flag (Z) - Set when result is zero
- **Bit 1**: Positive flag (P) - Set when result is positive  
- **Bit 2**: Negative flag (N) - Set when result is negative
- **Bit 3**: Carry flag (C) - Set on arithmetic carry/borrow
- **Bit 4**: Overflow flag (V) - Set on arithmetic overflow
- **Bit 5**: Reserved

## Interrupt Vectors

| Vector | Interrupt Type | Handler Address |
|--------|----------------|----------------|
| 0      | Reset | 0x0000 |
| 1      | NMI (Non-Maskable) | 0x0010 |
| 2      | Division by Zero | 0x0020 |
| 3      | Invalid Instruction | 0x0030 |
| 4      | Stack Overflow | 0x0040 |
| 5      | Stack Underflow | 0x0050 |
| 6-8    | Hardware Timers | 0x0060-0x0080 |
| 9      | I/O Complete | 0x0090 |
| 10     | DMA Complete | 0x00A0 |
| 11     | System Clock Tick | 0x00B0 |
| 12-14  | User Defined | 0x00C0-0x00E0 |
| 15     | Inter-Core Message | 0x00F0 |

## Programming Examples

### Simple Addition
```assembly
.org 0
LDA #10      ; Load 10 into accumulator
ADD #20      ; Add 20 (result: 30)
STA result   ; Store result
HLT          ; Halt program
result: .db 0
```

### Loop Example
```assembly
.org 0
LDA #5       ; Load counter
loop:
  DEC        ; Decrement counter
  JZ done    ; Jump if zero
  JMP loop   ; Continue loop
done:
  HLT        ; End program
```

### Subroutine Call
```assembly
.org 0
LDA #10
JSR double   ; Call subroutine
STA result
HLT

double:
  MUL #2     ; Double the accumulator
  RTS        ; Return

result: .db 0
```

### Floating-Point Arithmetic
```assembly
.org 0
FLDA #3.14   ; Load pi into FPU
FMUL #2.0    ; Multiply by 2
FSTA result  ; Store result
HLT

result: .df 0.0
```

## Instruction Set Characteristics

### RISC-like Features
- Simple, regular instruction format
- Load/store architecture for memory access
- Orthogonal instruction set design
- Consistent addressing modes

### CISC Influences (x86/Z80 style)
- Rich set of conditional jumps
- Multiple data sizes (6, 12, 18 trits)
- Block memory operations
- Comprehensive interrupt handling

### Ternary-Specific Features
- Balanced ternary arithmetic throughout
- Three-state logic operations (AND, OR, XOR with -1,0,+1 values)
- Ternary rotation and shifting
- Component-based gate-level emulation

This instruction set provides a complete foundation for ternary computing while maintaining familiarity for programmers experienced with traditional binary architectures.