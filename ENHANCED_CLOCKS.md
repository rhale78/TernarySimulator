# Enhanced Clock and Timer System Documentation

## Overview

The enhanced clock and timer system provides comprehensive timing control and edge detection capabilities for the Balanced Ternary Simulator. This implementation addresses all requirements specified in issue #11.

## Enhanced Clock Features

### Ternary Clock Pattern

The ternary clock now implements an 8-phase pattern: **0→0→1→1→0→0→-1→-1** (repeats)

This provides the following transitions:
- 0→0: Neutral phase
- 0→1: Rising/positive edge
- 1→1: Positive phase
- 1→0: Positive falling edge
- 0→0: Neutral phase
- 0→-1: Negative edge/falling edge
- -1→-1: Negative phase
- -1→0: Negative rising edge

### Edge Detection Methods

#### Ternary Clock Edge Detection
- `isRisingEdge()`: 0 → 1 transition (positive rising edge)
- `isFallingEdge()`: 1 → 0 or -1 → 0 transitions (falling edges)
- `isPositiveEdge()`: Any transition to positive value (0 → 1)
- `isNegativeEdge()`: Any transition to negative value (0 → -1)
- `isPositiveFallingEdge()`: 1 → 0 transition (positive signal falling)
- `isNegativeFallingEdge()`: 0 → -1 transition (signal falling to negative)
- `isNegativeRisingEdge()`: -1 → 0 transition (negative signal rising)

#### Binary Clock Edge Detection
- `isRisingEdge()`: 0 → 1 transition
- `isFallingEdge()`: 1 → 0 transition
- `isPositiveEdge()`: Same as rising edge for binary

## Hardware Timer System

### HardwareTimer Class

Each hardware timer provides:
- **Clock Type**: Binary or ternary
- **Frequency Control**: Configurable frequency in Hz
- **Countdown Functionality**: Preset value countdown with overflow detection
- **State Management**: Start, stop, reset operations
- **Callback System**: Notifications on timer overflow

### ClockManager Enhancements

The ClockManager now supports:
- **Up to 3 additional hardware timers** beyond system clocks
- **Timer Creation**: `createTimer(clockType, frequency)`
- **Timer Management**: Get, remove, list timers
- **Enhanced Status**: Detailed edge detection and timer information

## New CPU Instructions

### Edge Detection Instructions

#### TEDG - Ternary Edge Detect
- **Opcode**: 63
- **Usage**: `TEDG <type>`
- **Types**:
  - 0: Rising edge (0→1)
  - 1: Falling edge (1→0 or -1→0)
  - 2: Positive edge (0→1)
  - 3: Negative edge (0→-1)
  - 4: Positive falling edge (1→0)
  - 5: Negative falling edge (0→-1)
  - 6: Negative rising edge (-1→0)
- **Result**: Sets accumulator to 1 if edge detected, 0 otherwise

#### BEDG - Binary Edge Detect
- **Opcode**: 64
- **Usage**: `BEDG <type>`
- **Types**:
  - 0: Rising edge (0→1)
  - 1: Falling edge (1→0)
- **Result**: Sets accumulator to 1 if edge detected, 0 otherwise

### Hardware Timer Management Instructions

#### TCRT - Timer Create
- **Opcode**: 65
- **Usage**: `TCRT <type>`
- **Types**: 0=binary, 1=ternary
- **Input**: Frequency from accumulator
- **Result**: Timer ID in accumulator (-1 on error)

#### TDEL - Timer Delete
- **Opcode**: 66
- **Usage**: `TDEL <timer_id>`
- **Result**: 1 on success, 0 on failure

#### TSET - Timer Set Preset
- **Opcode**: 67
- **Usage**: `TSET <timer_id>`
- **Input**: Preset value from accumulator
- **Result**: 1 on success, 0 on failure

#### TSTA - Timer Start
- **Opcode**: 68
- **Usage**: `TSTA <timer_id>`
- **Result**: 1 on success, 0 on failure

#### TSTP - Timer Stop
- **Opcode**: 69
- **Usage**: `TSTP <timer_id>`
- **Result**: 1 on success, 0 on failure

#### TSTS - Timer Status
- **Opcode**: 70
- **Usage**: `TSTS <timer_id>`
- **Result**: Counter value in accumulator
- **Flags**: Zero=overflow, Positive=running, Negative=stopped

## Enhanced Component Behavior

### TernaryFlipFlop

Updated to work with the enhanced 8-phase ternary clock pattern:
- Triggers on: 0→1 (positive rising), 0→-1 (negative falling), -1→0 (negative rising)
- Proper edge detection for all ternary transitions
- Maintains state until next valid edge

### TernaryLatch

Already had proper clock-driven timing:
- Updates only when enabled and clock is active
- Stores ternary values (-1, 0, +1)
- Respects enable signals

## Assembly Language Examples

### Timer Creation and Management
```assembly
; Create a binary timer at 1000 Hz
LDA #1000
TCRT 0          ; Create binary timer
STA timer_id    ; Store timer ID

; Set timer preset to 10 counts
LDA #10
TSET timer_id   ; Set preset value
TSTA timer_id   ; Start timer

; Wait for timer completion
wait_loop:
    TSTS timer_id   ; Check status
    JZ timer_done   ; Jump if overflow (zero flag)
    JMP wait_loop   ; Continue waiting

timer_done:
    TSTP timer_id   ; Stop timer
    TDEL timer_id   ; Delete timer
```

### Edge Detection
```assembly
; Monitor ternary clock rising edge
TEDG 0          ; Check rising edge
JZ no_edge      ; Jump if no edge detected
; Handle rising edge
no_edge:

; Monitor binary clock falling edge
BEDG 1          ; Check falling edge
JZ no_fall      ; Jump if no edge detected
; Handle falling edge
no_fall:
```

## Testing

Comprehensive tests are provided in:
- `sync_enhanced_test.js`: Main functionality tests
- `assembler_enhanced_test.js`: Assembly language integration tests

All tests verify:
- Enhanced clock pattern correctness
- Hardware timer functionality
- CPU instruction operations
- Assembly language support
- Compatibility with existing features

## Compatibility

All enhancements maintain full backward compatibility with existing code:
- Original instruction set unchanged
- Existing clock functionality preserved
- Memory and CPU operations unaffected
- Push/pop instructions (PSH/POP) continue to work as before

The enhanced system provides proper electrical behavior for all timing components and enables sophisticated timing control at the assembly language level.