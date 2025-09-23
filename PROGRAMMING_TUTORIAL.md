# Programming Tutorial for Balanced Ternary CPU Simulator

This tutorial provides step-by-step guidance for programming the Balanced Ternary CPU Simulator, from basic concepts to advanced techniques.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Balanced Ternary](#understanding-balanced-ternary)
3. [Basic Assembly Programming](#basic-assembly-programming)
4. [Data Structures and Memory Management](#data-structures-and-memory-management)
5. [Control Flow and Subroutines](#control-flow-and-subroutines)
6. [I/O and Graphics Programming](#io-and-graphics-programming)
7. [Advanced Features](#advanced-features)
8. [Multi-Core Programming](#multi-core-programming)
9. [Operating System Programming](#operating-system-programming)
10. [Debugging and Optimization](#debugging-and-optimization)

## Getting Started

### Your First Program

Let's start with the classic "Hello, World!" equivalent in balanced ternary:

```assembly
; My first balanced ternary program
.org 0              ; Start at memory address 0

main:
    LDA #42         ; Load the answer to everything
    OUT             ; Output the value
    HLT             ; Halt the program
```

**Step-by-step:**
1. Enter this code in the program editor
2. Click "Assemble" - you should see "Assembly successful!"
3. Click "Run" - watch the output appear in the Console Output section
4. Observe how the ACC register changes in the CPU State panel

### Understanding the Interface

Before diving deeper, familiarize yourself with the simulator interface:

- **Program Editor**: Where you write code
- **CPU State**: Shows all registers and flags
- **Memory View**: Displays memory contents
- **Console Output**: Shows program output
- **Debug Information**: Current instruction and execution state

## Understanding Balanced Ternary

### Number Representation

Balanced ternary uses three digits: **-1, 0, +1** (displayed as -, 0, +)

Examples:
```
Decimal  →  Balanced Ternary
   0     →       0
   1     →       +
   2     →      +-
   3     →      +0
   4     →      ++
   5     →     +--
  -1     →       -
  -2     →      -+
  -3     →      -0
```

### Converting Numbers

Try this conversion program:
```assembly
; Convert and display various numbers
.org 0

main:
    LDA #5          ; 5 in decimal
    OUT             ; Output: 5 (displayed as decimal)
    
    LDA #+--        ; 5 in balanced ternary notation
    OUT             ; Output: 5 (same result)
    
    LDA #-5         ; -5 in decimal
    OUT             ; Output: -5
    
    LDA #-++        ; -5 in balanced ternary notation  
    OUT             ; Output: -5 (same result)
    
    HLT
```

### Arithmetic Properties

Balanced ternary has unique properties:
```assembly
; Demonstrate balanced ternary arithmetic
.org 0

main:
    ; Addition is symmetric
    LDA #5          ; +--
    ADD #-5         ; -++  
    OUT             ; Result: 0
    
    ; No overflow issues with small numbers
    LDA #100        ; Large positive
    ADD #-100       ; Large negative
    OUT             ; Result: 0
    
    ; Multiplication preserves sign naturally
    LDA #3          ; +0
    MUL #-4         ; -++
    OUT             ; Result: -12
    
    HLT
```

## Basic Assembly Programming

### Essential Instructions

#### Data Movement
```assembly
; Data movement examples
.org 0

main:
    ; Loading values
    LDA #42         ; Load immediate value into accumulator
    LDX #10         ; Load immediate value into index register
    
    ; Storing values  
    STA result      ; Store accumulator to memory
    STX counter     ; Store index register to memory
    
    ; Moving between registers
    LDA result      ; Load from memory to accumulator
    LDX counter     ; Load from memory to index register
    
    HLT

; Variables (data storage)
result:  .db 0      ; Reserve one tryte, initialized to 0
counter: .db 5      ; Reserve one tryte, initialized to 5
```

#### Arithmetic Operations
```assembly
; Arithmetic examples
.org 0

main:
    ; Basic arithmetic
    LDA #10         ; Start with 10
    ADD #15         ; Add 15 (result: 25)
    SUB #5          ; Subtract 5 (result: 20)
    MUL #2          ; Multiply by 2 (result: 40)
    DIV #4          ; Divide by 4 (result: 10)
    
    ; Increment and decrement
    INC             ; Increment (result: 11)
    DEC             ; Decrement (result: 10)
    DEC             ; Decrement (result: 9)
    
    OUT             ; Output final result
    HLT
```

#### Logical Operations
```assembly
; Logical operations in balanced ternary
.org 0

main:
    ; Ternary AND operation
    LDA #+0-        ; Binary: 101, Ternary: +0-
    AND #++-        ; Binary: 110, Ternary: ++-
    OUT             ; Result of ternary AND
    
    ; Ternary OR operation  
    LDA #+0-        ; +0-
    OR  #-0+        ; -0+
    OUT             ; Result of ternary OR
    
    ; Ternary NOT operation
    LDA #+0-        ; +0-
    NOT             ; Ternary NOT
    OUT             ; Result: -0+
    
    HLT
```

### Working with Memory

#### Addressing Modes
```assembly
; Demonstrate different addressing modes
.org 0

main:
    ; Immediate addressing
    LDA #42         ; Load value 42 directly
    
    ; Direct addressing
    LDA value       ; Load from memory address 'value'
    
    ; Indexed addressing
    LDX #2          ; Set index to 2
    LDA array,X     ; Load array[2] (third element)
    
    ; Indirect addressing
    LDA (pointer)   ; Load from address stored in 'pointer'
    
    OUT
    HLT

; Data section
value:   .db 100
array:   .db 10, 20, 30, 40, 50
pointer: .db value
```

#### Memory Operations
```assembly
; Memory manipulation examples
.org 0

main:
    ; Initialize array
    LDX #0          ; Index = 0
    LDA #1          ; Value = 1
    
init_loop:
    STA array,X     ; Store value in array[index]
    ADD #1          ; Increment value
    INX             ; Increment index
    CPX #5          ; Compare index with 5
    JNZ init_loop   ; Continue if not equal
    
    ; Display array contents
    LDX #0          ; Reset index
    
display_loop:
    LDA array,X     ; Load array[index]
    OUT             ; Output value
    INX             ; Increment index
    CPX #5          ; Compare with array size
    JNZ display_loop; Continue if not done
    
    HLT

array: .ds 5        ; Reserve 5 trytes for array
```

## Data Structures and Memory Management

### Arrays
```assembly
; Array processing example
.org 0

main:
    ; Find maximum value in array
    LDA numbers     ; Load first element
    STA max_val     ; Store as current maximum
    LDX #1          ; Start from second element
    
find_max:
    LDA numbers,X   ; Load current element
    CMP max_val     ; Compare with current maximum
    JNP not_larger  ; Jump if not positive (not larger)
    STA max_val     ; Update maximum
    
not_larger:
    INX             ; Next element
    CPX #5          ; Check if done
    JNZ find_max    ; Continue if not done
    
    LDA max_val     ; Load final maximum
    OUT             ; Output result
    HLT

numbers:  .db 15, 3, 42, 7, 28    ; Array of numbers
max_val:  .db 0                   ; Storage for maximum
```

### Strings
```assembly
; String processing example
.org 0

main:
    ; Calculate string length
    LDX #0          ; Character index
    LDA #0          ; Length counter
    
count_loop:
    LDA message,X   ; Load character
    CMP #0          ; Check for null terminator
    JZ done_count   ; If null, we're done
    
    LDA length      ; Load current length
    INC             ; Increment length
    STA length      ; Store back
    INX             ; Next character
    JMP count_loop  ; Continue
    
done_count:
    LDA length      ; Load final length
    OUT             ; Output string length
    HLT

message: .str "Hello, Balanced Ternary World!"
length:  .db 0
```

### Stack Operations
```assembly
; Stack-based calculations
.org 0

main:
    ; Calculate (5 + 3) * (8 - 2) using stack
    
    ; Push first expression: 5 + 3
    LDA #5
    PSH ACC         ; Push 5
    LDA #3  
    PSH ACC         ; Push 3
    
    ; Calculate 5 + 3
    POP ACC         ; Pop 3
    STA temp        ; Store temporarily
    POP ACC         ; Pop 5
    ADD temp        ; Add 3 (result: 8)
    PSH ACC         ; Push result back
    
    ; Push second expression: 8 - 2
    LDA #8
    PSH ACC         ; Push 8
    LDA #2
    PSH ACC         ; Push 2
    
    ; Calculate 8 - 2
    POP ACC         ; Pop 2
    STA temp        ; Store temporarily  
    POP ACC         ; Pop 8
    SUB temp        ; Subtract 2 (result: 6)
    PSH ACC         ; Push result back
    
    ; Multiply the two results
    POP ACC         ; Pop second result (6)
    STA temp        ; Store temporarily
    POP ACC         ; Pop first result (8)
    MUL temp        ; Multiply (result: 48)
    
    OUT             ; Output final result
    HLT

temp: .db 0
```

## Control Flow and Subroutines

### Conditional Execution
```assembly
; Temperature classification program
.org 0

main:
    LDA temperature ; Load temperature value
    
    ; Check if freezing (< 0)
    CMP #0
    JN freezing     ; Jump if negative
    
    ; Check if hot (> 30)
    CMP #30
    JP hot          ; Jump if positive (after subtracting 30)
    
    ; Otherwise, it's normal temperature
    LDA #normal_msg
    JSR print_string
    JMP done
    
freezing:
    LDA #cold_msg
    JSR print_string
    JMP done
    
hot:
    LDA #hot_msg
    JSR print_string
    JMP done
    
done:
    HLT

; Print string subroutine
print_string:
    STA string_ptr  ; Store string address
    LDX #0          ; Character index
    
print_loop:
    LDA (string_ptr),X ; Load character
    CMP #0          ; Check for null terminator
    JZ print_done   ; If null, we're done
    OUTC            ; Output character
    INX             ; Next character
    JMP print_loop  ; Continue
    
print_done:
    RTS             ; Return to caller

; Data
temperature: .db 25     ; Test temperature
normal_msg:  .str "Normal temperature"
cold_msg:    .str "It's freezing!"
hot_msg:     .str "It's hot!"
string_ptr:  .db 0
```

### Loops
```assembly
; Different loop types
.org 0

main:
    ; For loop: count from 1 to 10
    LDA #1          ; Initialize counter
    STA counter
    
for_loop:
    LDA counter     ; Load current value
    OUT             ; Output it
    
    INC             ; Increment
    STA counter     ; Store back
    CMP #11         ; Check if done (11 = 10 + 1)
    JN for_loop     ; Continue if less than 11
    
    ; While loop: countdown from 5
    LDA #5
    STA countdown
    
while_loop:
    LDA countdown   ; Load current value
    CMP #0          ; Check if zero
    JZ while_done   ; Exit if zero
    
    OUT             ; Output current value
    DEC             ; Decrement
    STA countdown   ; Store back
    JMP while_loop  ; Continue loop
    
while_done:
    ; Do-while loop: process array elements
    LDX #0          ; Array index
    
do_while_loop:
    LDA data,X      ; Load array element
    OUT             ; Output it
    INX             ; Next element
    
    CPX #5          ; Check if done
    JNZ do_while_loop ; Continue if not done
    
    HLT

counter:   .db 0
countdown: .db 0
data:      .db 10, 20, 30, 40, 50
```

### Recursive Functions
```assembly
; Recursive factorial calculation
.org 0

main:
    LDA #5          ; Calculate 5!
    JSR factorial   ; Call recursive function
    OUT             ; Output result (120)
    HLT

; Recursive factorial function
; Input: ACC contains n
; Output: ACC contains n!
factorial:
    ; Base case: if n <= 1, return 1
    CMP #1
    JNP base_case   ; Jump if not positive (n <= 1)
    
    ; Recursive case: n * factorial(n-1)
    PSH ACC         ; Save n on stack
    DEC             ; Calculate n-1
    JSR factorial   ; Recursive call
    
    ; ACC now contains factorial(n-1)
    STA temp_result ; Store factorial(n-1)
    POP ACC         ; Restore n
    MUL temp_result ; n * factorial(n-1)
    RTS             ; Return result in ACC
    
base_case:
    LDA #1          ; Return 1
    RTS

temp_result: .db 0
```

## I/O and Graphics Programming

### Console I/O
```assembly
; Interactive input/output example
.org 0

main:
    ; Display prompt
    LDA #prompt_msg
    JSR print_string
    
    ; Get user input (simulated - normally would use IN instruction)
    LDA user_input  ; Load simulated input
    STA number      ; Store for processing
    
    ; Echo the input
    LDA #echo_msg
    JSR print_string
    LDA number
    OUT             ; Output the number
    
    ; Calculate and display square
    LDA number
    MUL number      ; Square the number
    STA result
    
    LDA #result_msg
    JSR print_string
    LDA result
    OUT             ; Output the square
    
    HLT

print_string:
    ; String printing subroutine (same as before)
    STA string_ptr
    LDX #0
print_loop:
    LDA (string_ptr),X
    CMP #0
    JZ print_done
    OUTC
    INX
    JMP print_loop
print_done:
    RTS

; Data
prompt_msg:  .str "Enter a number: "
echo_msg:    .str "You entered: "
result_msg:  .str "Square is: "
user_input:  .db 7      ; Simulated user input
number:      .db 0
result:      .db 0
string_ptr:  .db 0
```

### Character Display Programming
```assembly
; Character display manipulation
.org 0

main:
    ; Clear screen
    JSR clear_screen
    
    ; Draw a border
    JSR draw_border
    
    ; Display centered message
    LDA #5          ; Row 5
    LDX #8          ; Column 8
    LDA #message
    JSR display_at
    
    HLT

; Clear entire screen
clear_screen:
    LDA #CHAR_BASE  ; Start of character memory
    STA addr
    LDA #32         ; Space character
    LDX #384        ; Total characters (24 * 16)
    
clear_loop:
    STA (addr)      ; Store space character
    LDA addr
    INC
    STA addr        ; Next address
    DEX
    JNZ clear_loop  ; Continue until done
    RTS

; Draw border around screen
draw_border:
    ; Top and bottom borders
    LDX #0          ; Column counter
top_border:
    LDA #0          ; Row 0
    JSR get_char_addr
    LDA #45         ; '-' character
    STA (char_addr)
    
    LDA #15         ; Row 15 (bottom)
    JSR get_char_addr
    LDA #45         ; '-' character  
    STA (char_addr)
    
    INX
    CPX #24         ; 24 columns
    JNZ top_border
    
    ; Left and right borders
    LDX #1          ; Row counter (skip corners)
side_border:
    LDA #0          ; Column 0
    JSR get_char_addr
    LDA #124        ; '|' character
    STA (char_addr)
    
    LDA #23         ; Column 23 (right side)
    JSR get_char_addr
    LDA #124        ; '|' character
    STA (char_addr)
    
    INX
    CPX #15         ; 15 rows (skip corners)
    JNZ side_border
    
    RTS

; Get character address for row (ACC) and column (X)
get_char_addr:
    MUL #24         ; Row * 24 columns
    ADD IX          ; Add column
    ADD #CHAR_BASE  ; Add base address
    STA char_addr
    RTS

; Display string at specific position
display_at:
    ; Input: ACC = row, X = column, next ACC = string address
    JSR get_char_addr
    STA target_addr
    LDA string_addr
    STA source_addr
    LDX #0
    
display_string_loop:
    LDA (source_addr),X
    CMP #0
    JZ display_string_done
    STA (target_addr)
    
    LDA target_addr
    INC
    STA target_addr
    INX
    JMP display_string_loop
    
display_string_done:
    RTS

; Constants and variables
.equ CHAR_BASE 17001
message:     .str "Hello, Graphics!"
addr:        .db 0
char_addr:   .db 0
target_addr: .db 0
source_addr: .db 0
string_addr: .db 0
```

### Pixel Graphics Programming
```assembly
; Pixel graphics example - draw simple shapes
.org 0

main:
    ; Clear graphics screen
    JSR clear_graphics
    
    ; Draw horizontal line
    LDA #40         ; Y coordinate (middle)
    LDX #10         ; Start X
    LDA #70         ; End X
    JSR draw_h_line
    
    ; Draw vertical line
    LDA #10         ; X coordinate
    LDX #20         ; Start Y
    LDA #60         ; End Y
    JSR draw_v_line
    
    ; Draw filled rectangle
    LDA #50         ; X
    LDX #20         ; Y
    LDA #20         ; Width
    LDX #15         ; Height
    JSR draw_rect
    
    HLT

; Clear graphics display
clear_graphics:
    LDA #GRAPHICS_BASE
    STA addr
    LDX #6561       ; Total pixels (81 * 81)
    LDA #0          ; Black pixel
    
clear_gfx_loop:
    STA (addr)
    LDA addr
    INC
    STA addr
    DEX
    JNZ clear_gfx_loop
    RTS

; Get pixel address for X (ACC) and Y (IX)
get_pixel_addr:
    STA temp_x      ; Save X
    LDA IX          ; Get Y
    MUL #81         ; Y * width
    ADD temp_x      ; Add X
    ADD #GRAPHICS_BASE ; Add base address
    STA pixel_addr
    RTS

; Set pixel at X (ACC), Y (IX) with color (temp_color)
set_pixel:
    JSR get_pixel_addr
    LDA temp_color
    STA (pixel_addr)
    RTS

; Draw horizontal line from X1 to X2 at Y
draw_h_line:
    ; Input: ACC=Y, X=X1, next ACC=X2
    STA temp_y      ; Save Y
    STX temp_x1     ; Save X1
    STA temp_x2     ; Save X2
    LDA #1          ; White color
    STA temp_color
    
    LDA temp_x1     ; Start X
    STA current_x
    
h_line_loop:
    LDA current_x   ; Current X
    LDX temp_y      ; Y coordinate
    JSR set_pixel
    
    LDA current_x
    INC
    STA current_x
    CMP temp_x2     ; Check if done
    JNP h_line_loop ; Continue if not past end
    RTS

; Draw vertical line from Y1 to Y2 at X
draw_v_line:
    ; Similar to horizontal line but increment Y
    STA temp_x      ; Save X
    STX temp_y1     ; Save Y1
    STA temp_y2     ; Save Y2
    LDA #1          ; White color
    STA temp_color
    
    LDA temp_y1     ; Start Y
    STA current_y
    
v_line_loop:
    LDA temp_x      ; X coordinate
    LDX current_y   ; Current Y
    JSR set_pixel
    
    LDA current_y
    INC
    STA current_y
    CMP temp_y2     ; Check if done
    JNP v_line_loop ; Continue if not past end
    RTS

; Draw filled rectangle
draw_rect:
    ; Input: ACC=X, X=Y, next ACC=width, next X=height
    STA rect_x      ; Save X
    STX rect_y      ; Save Y
    STA rect_w      ; Save width
    STX rect_h      ; Save height
    LDA #1          ; White color
    STA temp_color
    
    LDA #0          ; Y offset
    STA y_offset
    
rect_y_loop:
    LDA #0          ; X offset
    STA x_offset
    
rect_x_loop:
    LDA rect_x      ; Base X
    ADD x_offset    ; Add offset
    LDX rect_y      ; Base Y
    ADD y_offset    ; Add Y offset (need to handle this properly)
    JSR set_pixel
    
    LDA x_offset
    INC
    STA x_offset
    CMP rect_w      ; Check if done with this row
    JN rect_x_loop  ; Continue if not done
    
    LDA y_offset
    INC
    STA y_offset
    CMP rect_h      ; Check if done with all rows
    JN rect_y_loop  ; Continue if not done
    
    RTS

; Constants and variables  
.equ GRAPHICS_BASE 18001
addr:        .db 0
pixel_addr:  .db 0
temp_x:      .db 0
temp_y:      .db 0
temp_x1:     .db 0
temp_x2:     .db 0
temp_y1:     .db 0
temp_y2:     .db 0
temp_color:  .db 0
current_x:   .db 0
current_y:   .db 0
rect_x:      .db 0
rect_y:      .db 0
rect_w:      .db 0
rect_h:      .db 0
x_offset:    .db 0
y_offset:    .db 0
```

## Advanced Features

### File System Operations
```assembly
; File system example - create, write, read
.org 0

main:
    ; Create a new file
    LDA #CREATE_FILE
    STA DISK_CMD
    LDA #filename
    STA DISK_ADDR
    JSR disk_operation
    
    ; Open file for writing
    LDA #OPEN_FILE
    STA DISK_CMD
    LDA #filename
    STA DISK_ADDR
    LDA #2          ; Write mode
    STA DISK_MODE
    JSR disk_operation
    STA file_handle ; Save file handle
    
    ; Write data to file
    LDA #WRITE_FILE
    STA DISK_CMD
    LDA file_handle
    STA DISK_HANDLE
    LDA #file_data
    STA DISK_ADDR
    LDA #data_size
    STA DISK_SIZE
    JSR disk_operation
    
    ; Close file
    LDA #CLOSE_FILE
    STA DISK_CMD
    LDA file_handle
    STA DISK_HANDLE
    JSR disk_operation
    
    ; Reopen for reading
    LDA #OPEN_FILE
    STA DISK_CMD
    LDA #filename
    STA DISK_ADDR
    LDA #1          ; Read mode
    STA DISK_MODE
    JSR disk_operation
    STA file_handle
    
    ; Read data back
    LDA #READ_FILE
    STA DISK_CMD
    LDA file_handle
    STA DISK_HANDLE
    LDA #read_buffer
    STA DISK_ADDR
    LDA #data_size
    STA DISK_SIZE
    JSR disk_operation
    
    ; Display read data
    LDA #read_buffer
    JSR print_string
    
    ; Close file
    LDA #CLOSE_FILE
    STA DISK_CMD
    LDA file_handle
    STA DISK_HANDLE
    JSR disk_operation
    
    HLT

; Disk operation helper
disk_operation:
    LDA #1
    STA DISK_GO     ; Start operation
    
wait_disk:
    LDA DISK_STATUS
    CMP #1          ; Check if busy
    JZ wait_disk    ; Wait until done
    
    LDA DISK_ERROR
    CMP #0
    JNZ disk_error  ; Handle error
    RTS
    
disk_error:
    ; Handle disk error
    LDA #error_msg
    JSR print_string
    HLT

; Print string subroutine
print_string:
    STA string_ptr
    LDX #0
print_loop:
    LDA (string_ptr),X
    CMP #0
    JZ print_done
    OUTC
    INX
    JMP print_loop
print_done:
    RTS

; Data
filename:    .str "test.txt"
file_data:   .str "Hello from balanced ternary file system!"
data_size:   .db 42
read_buffer: .ds 50
error_msg:   .str "Disk error occurred!"
file_handle: .db 0
string_ptr:  .db 0

; Disk command constants
.equ CREATE_FILE 1
.equ OPEN_FILE   2
.equ READ_FILE   3
.equ WRITE_FILE  4
.equ CLOSE_FILE  5

; Disk I/O addresses (memory-mapped)
.equ DISK_CMD    18600
.equ DISK_ADDR   18601
.equ DISK_SIZE   18602
.equ DISK_HANDLE 18603
.equ DISK_MODE   18604
.equ DISK_GO     18605
.equ DISK_STATUS 18606
.equ DISK_ERROR  18607
```

### DMA Operations
```assembly
; DMA example - fast memory copy
.org 0

main:
    ; Initialize source array
    JSR init_source
    
    ; Set up DMA transfer
    LDA #source_array
    STA DMA_SRC_ADDR
    
    LDA #dest_array
    STA DMA_DEST_ADDR
    
    LDA #100        ; Transfer 100 trytes
    STA DMA_SIZE
    
    LDA #1          ; Memory-to-memory transfer
    STA DMA_TYPE
    
    ; Start DMA transfer
    LDA #1
    STA DMA_START
    
    ; Wait for completion
wait_dma:
    LDA DMA_STATUS
    CMP #1          ; Check if busy
    JZ wait_dma
    
    ; Verify transfer
    JSR verify_copy
    
    HLT

; Initialize source array with test data
init_source:
    LDX #0
    LDA #1
    
init_loop:
    STA source_array,X
    INC
    INX
    CPX #100
    JNZ init_loop
    RTS

; Verify DMA copy was successful
verify_copy:
    LDX #0          ; Index
    LDA #0          ; Error count
    STA errors
    
verify_loop:
    LDA source_array,X
    CMP dest_array,X
    JZ verify_ok
    
    ; Mismatch found
    LDA errors
    INC
    STA errors
    
verify_ok:
    INX
    CPX #100
    JNZ verify_loop
    
    ; Report results
    LDA errors
    CMP #0
    JZ verify_success
    
    LDA #error_msg
    JSR print_string
    LDA errors
    OUT
    RTS
    
verify_success:
    LDA #success_msg
    JSR print_string
    RTS

print_string:
    STA string_ptr
    LDX #0
print_loop:
    LDA (string_ptr),X
    CMP #0
    JZ print_done
    OUTC
    INX
    JMP print_loop
print_done:
    RTS

; Data areas
source_array: .ds 100
dest_array:   .ds 100
errors:       .db 0
success_msg:  .str "DMA transfer successful!"
error_msg:    .str "DMA errors: "
string_ptr:   .db 0

; DMA control registers (memory-mapped)
.equ DMA_SRC_ADDR  19001
.equ DMA_DEST_ADDR 19002
.equ DMA_SIZE      19003
.equ DMA_TYPE      19004
.equ DMA_START     19005
.equ DMA_STATUS    19006
```

## Multi-Core Programming

### Basic Multi-Core Coordination
```assembly
; Multi-core example - parallel array processing
.org 0

main:
    ; Check which core we're running on
    LDA CORE_ID
    CMP #0
    JZ core0_task
    CMP #1
    JZ core1_task
    JMP unknown_core

core0_task:
    ; Core 0: Process first half of array
    LDA #0          ; Start index
    STA start_idx
    LDA #50         ; End index
    STA end_idx
    LDA #core0_result
    STA result_addr
    JSR process_range
    
    ; Signal completion
    LDA #1
    STA core0_done
    
    ; Wait for other core
wait_core1:
    LDA core1_done
    CMP #0
    JZ wait_core1
    
    ; Combine results
    LDA core0_result
    ADD core1_result
    OUT             ; Output final sum
    HLT

core1_task:
    ; Core 1: Process second half of array
    LDA #50         ; Start index
    STA start_idx
    LDA #100        ; End index
    STA end_idx
    LDA #core1_result
    STA result_addr
    JSR process_range
    
    ; Signal completion
    LDA #1
    STA core1_done
    
    ; Wait for core 0 to finish combining
wait_finish:
    JMP wait_finish ; Infinite loop (core 0 handles output)

unknown_core:
    ; Shouldn't happen in dual-core system
    HLT

; Process array range and store sum in result_addr
process_range:
    LDA start_idx
    STA current_idx
    LDA #0          ; Initialize sum
    STA sum
    
process_loop:
    LDA current_idx
    LDX current_idx ; Use as index
    ADD data_array,X ; Add array element to accumulator
    ADD sum         ; Add to running sum
    STA sum
    
    LDA current_idx
    INC
    STA current_idx
    CMP end_idx
    JN process_loop ; Continue if not done
    
    ; Store result
    LDA sum
    STA (result_addr)
    RTS

; Data and synchronization variables
data_array:   .ds 100      ; Array to process (initialized elsewhere)
start_idx:    .db 0
end_idx:      .db 0
current_idx:  .db 0
sum:          .db 0
result_addr:  .db 0
core0_result: .db 0
core1_result: .db 0
core0_done:   .db 0
core1_done:   .db 0

; System constants
.equ CORE_ID 19400         ; Memory-mapped core ID register
```

### Synchronization with Locks
```assembly
; Multi-core synchronization example
.org 0

main:
    ; Initialize shared data
    LDA #0
    STA shared_counter
    STA mutex_lock
    
    ; Determine core and start appropriate task
    LDA CORE_ID
    CMP #0
    JZ core0_increment
    JMP core1_increment

core0_increment:
    LDA #10         ; Core 0 increments 10 times
    STA iterations
    
core0_loop:
    JSR acquire_lock
    
    ; Critical section
    LDA shared_counter
    INC
    STA shared_counter
    OUT             ; Show progress
    
    JSR release_lock
    
    ; Non-critical work
    JSR delay
    
    LDA iterations
    DEC
    STA iterations
    JNZ core0_loop
    
    ; Signal completion
    LDA #1
    STA core0_done
    
    ; Wait for other core
wait_other:
    LDA core1_done
    CMP #0
    JZ wait_other
    
    ; Display final result
    LDA shared_counter
    OUT
    HLT

core1_increment:
    LDA #10         ; Core 1 increments 10 times
    STA iterations
    
core1_loop:
    JSR acquire_lock
    
    ; Critical section
    LDA shared_counter
    INC
    STA shared_counter
    OUT             ; Show progress
    
    JSR release_lock
    
    ; Non-critical work
    JSR delay
    
    LDA iterations
    DEC
    STA iterations
    JNZ core1_loop
    
    ; Signal completion
    LDA #1
    STA core1_done
    
    ; Wait for completion
wait_done:
    JMP wait_done

; Acquire mutex lock (spin lock implementation)
acquire_lock:
    LDA CORE_ID     ; Get our core ID
    
acquire_try:
    LDA mutex_lock  ; Check lock status
    CMP #0          ; Is it free?
    JNZ acquire_try ; If not, keep trying
    
    ; Try to acquire lock atomically
    LDA CORE_ID
    INC             ; Use core_id + 1 as lock value
    STA mutex_lock
    
    ; Verify we got the lock (simple check, not truly atomic)
    LDA mutex_lock
    LDX CORE_ID
    INX             ; Compare with core_id + 1
    CMP IX
    JNZ acquire_try ; If not our lock, try again
    
    RTS

; Release mutex lock
release_lock:
    LDA #0
    STA mutex_lock  ; Clear lock
    RTS

; Simple delay loop
delay:
    LDA #100        ; Delay counter
    STA delay_count
    
delay_loop:
    LDA delay_count
    DEC
    STA delay_count
    JNZ delay_loop
    RTS

; Shared data and synchronization
shared_counter: .db 0
mutex_lock:     .db 0
iterations:     .db 0
core0_done:     .db 0
core1_done:     .db 0
delay_count:    .db 0

.equ CORE_ID 19400
```

## Operating System Programming

### System Calls
```assembly
; Operating system interaction example
.org 0

main:
    ; Write message to console
    LDA #1          ; sys_write
    LDX #hello_msg  ; Message address
    LDA #hello_len  ; Message length
    SYSCALL
    
    ; Create child process
    LDA #2          ; sys_fork
    SYSCALL
    
    ; Check return value
    CMP #0
    JZ child_process ; If 0, we're the child
    
parent_process:
    ; We're the parent
    STA child_pid   ; Store child PID
    
    LDA #1          ; sys_write
    LDX #parent_msg
    LDA #parent_len
    SYSCALL
    
    ; Wait for child to complete
    LDA #3          ; sys_wait
    LDX child_pid   ; Child PID
    SYSCALL
    
    LDA #1          ; sys_write
    LDX #done_msg
    LDA #done_len
    SYSCALL
    
    LDA #0          ; sys_exit
    LDX #0          ; Exit code
    SYSCALL

child_process:
    ; We're the child
    LDA #1          ; sys_write
    LDX #child_msg
    LDA #child_len
    SYSCALL
    
    ; Do some work
    LDA #100
work_loop:
    DEC
    JNZ work_loop
    
    LDA #0          ; sys_exit
    LDX #42         ; Exit code
    SYSCALL

; Messages
hello_msg:  .str "Starting process example\n"
hello_len:  .db 26
parent_msg: .str "Parent process running\n"
parent_len: .db 23
child_msg:  .str "Child process running\n"
child_len:  .db 22
done_msg:   .str "All processes completed\n"
done_len:   .db 24

; Variables
child_pid:  .db 0
```

### Memory Management
```assembly
; Dynamic memory allocation example
.org 0

main:
    ; Allocate memory for array
    LDA #8          ; sys_malloc
    LDX #400        ; Request 400 bytes
    SYSCALL
    
    CMP #0          ; Check if allocation succeeded
    JZ alloc_failed
    
    STA array_ptr   ; Store pointer
    
    ; Initialize allocated memory
    LDX #0          ; Index
    LDA #1          ; Initial value
    
init_array:
    STA (array_ptr),X ; Store value
    INC             ; Next value
    INX             ; Next index
    CPX #100        ; 100 elements
    JNZ init_array
    
    ; Use the array
    JSR process_array
    
    ; Free the memory
    LDA #9          ; sys_free
    LDX array_ptr   ; Pointer to free
    SYSCALL
    
    LDA #1          ; sys_write
    LDX #success_msg
    LDA #success_len
    SYSCALL
    
    LDA #0          ; sys_exit
    SYSCALL

alloc_failed:
    LDA #1          ; sys_write
    LDX #error_msg
    LDA #error_len
    SYSCALL
    
    LDA #0          ; sys_exit
    LDX #1          ; Error exit code
    SYSCALL

; Process the dynamically allocated array
process_array:
    LDX #0          ; Index
    LDA #0          ; Sum
    STA sum
    
sum_loop:
    ADD (array_ptr),X ; Add array element
    ADD sum
    STA sum
    INX
    CPX #100
    JNZ sum_loop
    
    ; Output sum (would normally use sys_write)
    LDA sum
    OUT
    RTS

; Data
array_ptr:   .db 0
sum:         .db 0
success_msg: .str "Memory operations completed successfully\n"
success_len: .db 40
error_msg:   .str "Memory allocation failed\n"
error_len:   .db 25
```

## Debugging and Optimization

### Performance Measurement
```assembly
; Performance measurement example
.org 0

main:
    ; Get start time
    LDA #TIME_GET
    STA TIMER_CMD
    LDA TIMER_VALUE
    STA start_time
    
    ; Run algorithm
    JSR bubble_sort
    
    ; Get end time
    LDA #TIME_GET
    STA TIMER_CMD
    LDA TIMER_VALUE
    STA end_time
    
    ; Calculate elapsed time
    SUB start_time
    OUT             ; Output execution time
    
    HLT

; Bubble sort algorithm for performance testing
bubble_sort:
    LDA #array_size
    DEC
    STA outer_limit ; n-1 iterations
    
outer_loop:
    LDA #0
    STA swapped     ; Flag to track if any swaps occurred
    LDX #0          ; Index for inner loop
    
inner_loop:
    ; Compare adjacent elements
    LDA test_array,X
    INX
    CMP test_array,X ; Compare with next element
    JNP no_swap     ; If not positive (not greater), no swap needed
    
    ; Swap elements
    DEX             ; Back to first element
    LDA test_array,X ; Load first element
    STA temp_val
    INX             ; Move to second element
    LDA test_array,X ; Load second element
    DEX             ; Back to first position
    STA test_array,X ; Store second in first position
    INX             ; Move to second position
    LDA temp_val    ; Load original first value
    STA test_array,X ; Store in second position
    
    LDA #1
    STA swapped     ; Mark that we made a swap
    JMP continue_inner
    
no_swap:
    DEX             ; Adjust index back
    
continue_inner:
    INX             ; Next pair
    LDA IX
    CMP outer_limit ; Check if done with this pass
    JN inner_loop
    
    ; Check if any swaps were made
    LDA swapped
    CMP #0
    JZ sort_done    ; If no swaps, array is sorted
    
    LDA outer_limit
    DEC
    STA outer_limit
    JNZ outer_loop  ; Continue if more passes needed
    
sort_done:
    RTS

; Test data
test_array:  .db 64, 34, 25, 12, 22, 11, 90, 88, 76, 50
array_size:  .db 10
start_time:  .db 0
end_time:    .db 0
outer_limit: .db 0
swapped:     .db 0
temp_val:    .db 0

; Timer constants
.equ TIME_GET    1
.equ TIMER_CMD   19451
.equ TIMER_VALUE 19452
```

### Memory Usage Analysis
```assembly
; Memory usage tracking
.org 0

main:
    ; Track initial memory state
    JSR memory_snapshot
    STA initial_usage
    
    ; Allocate and use memory
    JSR allocate_structures
    
    ; Track peak memory usage
    JSR memory_snapshot
    STA peak_usage
    
    ; Clean up
    JSR deallocate_structures
    
    ; Track final memory usage
    JSR memory_snapshot
    STA final_usage
    
    ; Report memory statistics
    JSR report_memory_stats
    
    HLT

; Take a snapshot of current memory usage
memory_snapshot:
    ; This would interface with OS memory management
    ; For now, simulate with counter
    LDA allocated_bytes
    RTS

; Allocate test data structures
allocate_structures:
    ; Simulate allocations by incrementing counter
    LDA allocated_bytes
    ADD #1000       ; Simulate 1000 byte allocation
    STA allocated_bytes
    
    ; More allocations...
    ADD #500        ; Another 500 bytes
    STA allocated_bytes
    
    RTS

; Clean up allocations
deallocate_structures:
    ; Simulate deallocations
    LDA allocated_bytes
    SUB #1500       ; Free the allocated memory
    STA allocated_bytes
    RTS

; Report memory usage statistics
report_memory_stats:
    LDA #1          ; sys_write
    LDX #initial_msg
    LDA #initial_msg_len
    SYSCALL
    
    LDA initial_usage
    OUT
    
    LDA #1
    LDX #peak_msg
    LDA #peak_msg_len
    SYSCALL
    
    LDA peak_usage
    OUT
    
    LDA #1
    LDX #final_msg
    LDA #final_msg_len
    SYSCALL
    
    LDA final_usage
    OUT
    
    RTS

; Data
allocated_bytes:  .db 0
initial_usage:    .db 0
peak_usage:       .db 0
final_usage:      .db 0

initial_msg:      .str "Initial memory: "
initial_msg_len:  .db 16
peak_msg:         .str "Peak memory: "
peak_msg_len:     .db 13
final_msg:        .str "Final memory: "
final_msg_len:    .db 14
```

This comprehensive programming tutorial covers all major aspects of programming the Balanced Ternary CPU Simulator, from basic concepts to advanced multi-core and operating system programming. Use these examples as starting points for your own programs and experiments!