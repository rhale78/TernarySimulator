# High-Level Language Reference

## Overview

The Balanced Ternary CPU Simulator includes a C-like high-level language that compiles to ternary assembly. The language provides access to all instruction set features including word operations, binary arithmetic, and conversion functions.

## Language Features

### Data Types

- **int**: Standard ternary integer (6-trit Tryte, range -364 to +364)
- **word**: Extended 12-trit integer (range -264,062 to +264,062)  
- **triple**: Extended 18-trit integer (range -193,710,244 to +193,710,244)
- **float**: Floating-point numbers (handled by FPU)

### Variable Declarations

```c
int x = 10;
word largeNum = 50000;
triple hugeNum = 1000000;
float pi = 3.14159;

// Arrays
int array[10];
word bigArray[5] = {1000, 2000, 3000, 4000, 5000};
```

### Arithmetic Operations

#### Ternary Arithmetic (Default)
```c
int result = a + b;    // Compiles to: ADD
int diff = a - b;      // Compiles to: SUB  
int product = a * b;   // Compiles to: MUL
int quotient = a / b;  // Compiles to: DIV
int remainder = a % b; // Compiles to: MOD
```

#### Binary Arithmetic (Prefixed with 'b')
```c
int binarySum = a b+ b;     // Compiles to: BADD (binary addition)
int binaryDiff = a b- b;    // Compiles to: BSUB (binary subtraction)
int binaryProd = a b* b;    // Compiles to: BMUL (binary multiplication)
int binaryQuot = a b/ b;    // Compiles to: BDIV (binary division)
```

#### Word Operations
```c
word w1 = 10000;
word w2 = 5000;
word wResult = w1 / w2;     // Compiles to: DIVW (word division)
word wXor = w1 ^ w2;        // Compiles to: XORW (word XOR)
```

#### Triple Operations  
```c
triple t1 = 1000000;
triple t2 = 333333;
triple tResult = t1 / t2;   // Compiles to: DIVT (triple division)
triple tXor = t1 ^ t2;      // Compiles to: XORT (triple XOR)
```

### Logical Operations

#### Ternary Logic
```c
int andResult = a & b;      // Compiles to: AND
int orResult = a | b;       // Compiles to: OR
int xorResult = a ^ b;      // Compiles to: XOR
```

#### Binary Logic (Prefixed with 'b')
```c
int binaryAnd = a b& b;     // Compiles to: BAND
int binaryOr = a b| b;      // Compiles to: BOR
int binaryXor = a b^ b;     // Compiles to: BXOR
```

### Conversion Functions

#### Number System Conversion
```c
int ternaryValue = 42;

// Convert ternary to binary representation
ternaryToBinary(ternaryValue);     // Compiles to: T2B

// Convert binary representation back to ternary
binaryToTernary(ternaryValue);     // Compiles to: B2T

// Binary NOT operation
binaryNot(ternaryValue);           // Compiles to: BNOT
```

#### Extended Word Operations
```c
word w1 = 50000;
word w2 = 1000;

// Word division with proper handling
wordDivide(w1, w2);               // Compiles to: LDAW, DIVW

// Word XOR operation
wordXor(w1, w2);                  // Compiles to: LDAW, XORW

triple t1 = 1000000;
triple t2 = 7;

// Triple division with proper handling  
tripleDivide(t1, t2);             // Compiles to: LDAT, DIVT

// Triple XOR operation
tripleXor(t1, t2);                // Compiles to: LDAT, XORT
```

### Control Flow

#### Conditional Statements
```c
if (x > 0) {
    print(x);
} else {
    print(-x);
}

// While loops
while (x > 0) {
    x = x - 1;
    print(x);
}
```

#### Function Definitions
```c
function add(int a, int b) {
    return a + b;
}

function binaryAdd(int a, int b) {
    return a b+ b;  // Binary addition
}

function convertAndProcess(int value) {
    ternaryToBinary(value);
    binaryNot();
    binaryToTernary();
    return value;
}
```

### Built-in Functions

| Function | Description | Assembly Output |
|----------|-------------|-----------------|
| `print(value)` | Output value to console | `OUT` |
| `ternaryToBinary(value)` | Convert ternary to binary | `T2B` |
| `binaryToTernary(value)` | Convert binary to ternary | `B2T` |
| `binaryNot(value)` | Binary NOT operation | `BNOT` |
| `wordDivide(a, b)` | Word-size division | `LDAW`, `DIVW` |
| `tripleDivide(a, b)` | Triple-word division | `LDAT`, `DIVT` |
| `wordXor(a, b)` | Word-size XOR | `LDAW`, `XORW` |
| `tripleXor(a, b)` | Triple-word XOR | `LDAT`, `XORT` |

### Complete Example Programs

#### Conversion Demonstration
```c
function demonstrateConversion() {
    int value = 42;
    
    print(value);              // Print original ternary value
    
    ternaryToBinary(value);    // Convert to binary
    print(value);              // Print binary representation
    
    binaryNot(value);          // Apply binary NOT
    print(value);              // Print inverted binary
    
    binaryToTernary(value);    // Convert back to ternary
    print(value);              // Print final ternary result
}
```

#### Binary vs Ternary Arithmetic
```c
function compareArithmetic() {
    int a = 15;
    int b = 7;
    
    // Ternary arithmetic
    int ternarySum = a + b;
    int ternaryProduct = a * b;
    
    // Binary arithmetic  
    int binarySum = a b+ b;
    int binaryProduct = a b* b;
    
    print(ternarySum);         // Ternary result
    print(binarySum);          // Binary result
    print(ternaryProduct);     // Ternary product
    print(binaryProduct);      // Binary product
}
```

#### Large Number Processing
```c
function processLargeNumbers() {
    word largeA = 100000;
    word largeB = 333;
    
    // Word-level division and XOR
    wordDivide(largeA, largeB);
    wordXor(largeA, largeB);
    
    triple hugeA = 5000000;
    triple hugeB = 1234;
    
    // Triple-word division and XOR
    tripleDivide(hugeA, hugeB);
    tripleXor(hugeA, hugeB);
}
```

#### Mixed Mode Operations
```c
function mixedModeDemo() {
    int value = 123;
    
    // Start with ternary value
    print(value);
    
    // Convert to binary and perform binary operations
    ternaryToBinary(value);
    value = value b+ 50;     // Binary addition
    value = value b^ 85;     // Binary XOR
    
    // Convert back to ternary
    binaryToTernary(value);
    print(value);
    
    // Continue with ternary operations
    value = value + 10;      // Ternary addition
    value = value ^ 7;       // Ternary XOR
    print(value);
}
```

## Compilation Process

The high-level language compiles through these phases:

1. **Lexical Analysis**: Tokenize source code
2. **Parsing**: Build Abstract Syntax Tree (AST)
3. **Code Generation**: Generate ternary assembly
4. **Optimization**: Apply basic optimizations

## Generated Assembly

The compiler generates efficient ternary assembly code:

```c
int result = (a + b) * 2;
```

Compiles to:
```assembly
LDA a        ; Load variable a
ADD b        ; Add variable b  
MUL #2       ; Multiply by immediate value 2
STA result   ; Store in result variable
```

```c
int binaryResult = a b+ b;
```

Compiles to:
```assembly
LDA a        ; Load variable a
BADD b       ; Binary add variable b
STA binaryResult  ; Store result
```

```c
wordDivide(w1, w2);
```

Compiles to:
```assembly
LDA w1       ; Load first word operand
LDAW         ; Load as word to accumulator word register
LDA w2       ; Load second word operand  
DIVW         ; Perform word division
```

## Error Handling

The compiler provides comprehensive error reporting:

- **Syntax Errors**: Invalid language constructs
- **Type Errors**: Mismatched data types
- **Undefined Variables**: Reference to undeclared variables
- **Division by Zero**: Compile-time detection where possible
- **Operator Errors**: Invalid binary operator combinations

## Advanced Features

### Memory Management
- Automatic variable allocation
- Array bounds checking (compile-time)
- String literal handling

### Function Support
- Parameter passing
- Local variable scoping
- Return value handling
- Recursive function calls
- Label resolution for call/return instructions

### Optimization
- Constant folding
- Dead code elimination
- Immediate addressing optimization
- Register allocation for temporary values
- Binary operation scheduling

### Label Handling
The compiler properly handles labels for subroutine calls:

```c
function factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
```

Compiles to proper assembly with correct label resolution:
```assembly
factorial:
    LDA n
    CMP #1
    JLE factorial_base
    ; Recursive case
    LDA n
    SUB #1
    CALL factorial
    MUL n
    RET
factorial_base:
    LDA #1
    RET
```

This high-level language provides a complete programming environment that fully utilizes the Balanced Ternary CPU's advanced instruction set including word operations, binary arithmetic, conversion capabilities, and proper subroutine handling with label resolution.