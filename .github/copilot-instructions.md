# Balanced Ternary CPU Simulator - Copilot Instructions

**ALWAYS follow these instructions first and only fallback to additional search and context gathering if the information here is incomplete or found to be in error.**

## Overview

The Balanced Ternary CPU Simulator is a pure client-side JavaScript web application that implements a complete balanced ternary computer architecture. It requires no build process, dependencies, or package management - all code runs directly in the browser or Node.js.

## Working Effectively

### Quick Setup and Validation
- **Run tests**: `node test.js` -- takes <0.1 seconds. NEVER CANCEL.
- **Start web server**: `python3 -m http.server 8080` -- serves on http://localhost:8080
- **Test additional modules**: `node simple_test.js` and `node manual_test.js` -- both take <0.1 seconds each

### Core Development Workflow
1. **Always test changes**: Run `node test.js` after any code modifications
2. **Test web interface**: Start HTTP server and navigate to http://localhost:8080
3. **Validate complete functionality**: Load a program, assemble it, and execute it in the web interface

### No Build Process Required
- This project has NO package.json, NO npm dependencies, NO build scripts
- All JavaScript files run directly without compilation or bundling
- DO NOT attempt to run `npm install` or `npm run build` - these commands will fail
- DO NOT create package.json or add Node.js dependencies unless absolutely necessary

## Testing

### Automated Tests
- **Main test suite**: `node test.js` -- comprehensive test of all components
  - Tests balanced ternary arithmetic operations
  - Tests memory read/write operations  
  - Tests CPU instruction execution
  - Tests assembler functionality
  - Tests end-to-end program execution
  - Takes <0.1 seconds total. NEVER CANCEL.

- **Additional tests**: 
  - `node simple_test.js` -- tests instruction encoding/decoding
  - `node manual_test.js` -- tests manual instruction execution

### Manual Validation Scenarios
**ALWAYS run these validation scenarios after making changes:**

1. **Basic Assembly and Execution**:
   - Start web server: `python3 -m http.server 8080`
   - Navigate to http://localhost:8080
   - Click "Load Example" to load a sample program
   - Click "Assemble" - should show "Assembly successful!"
   - Click "Run" - should execute the program and update registers
   - Verify the accumulator shows the correct result

2. **Debug Features**:
   - Use browser console: `debugFunctions.setBreakpoint(0)`
   - Use browser console: `debugFunctions.dumpMemory(0, 10)`
   - Click "Step" to execute one instruction at a time
   - Verify debug info updates correctly

3. **Editor Functionality**:
   - Write a simple program in the editor:
     ```
     LDA #5
     ADD #3
     OUT
     HLT
     ```
   - Assemble and run, verify output is 8

## Repository Structure

### Core Files
- `index.html` - Main web interface and entry point
- `styles.css` - All styling for the web interface
- `ternary.js` - Balanced ternary number system (BalancedTernary, Tryte classes)
- `memory.js` - Memory system and I/O mapping (TernaryMemory, MemoryMappedIO)
- `cpu.js` - CPU, ALU, registers, and instruction execution (TernaryCPU, TernaryALU, TernaryRegisters)
- `assembler.js` - Assembly language compiler (TernaryAssembler)
- `simulator.js` - Main simulator controller and UI integration (TernarySimulator)

### Test Files
- `test.js` - Main comprehensive test suite
- `simple_test.js` - Basic instruction encoding/decoding tests  
- `manual_test.js` - Manual step-by-step instruction testing

### Key Classes and Their Responsibilities
- `BalancedTernary` - Core balanced ternary number representation
- `Tryte` - 6-trit data word (range: -364 to +364)
- `TernaryAddress` - 9-trit address representation
- `TernaryMemory` - Sparse memory implementation with I/O mapping
- `TernaryCPU` - Complete CPU with instruction execution
- `TernaryALU` - Arithmetic and logical operations
- `TernaryAssembler` - Assembly to machine code conversion
- `TernarySimulator` - Web interface controller

## Common Development Tasks

### Adding New Instructions
1. Add opcode to `cpu.js` in `buildInstructionSet()`
2. Implement execution method in `TernaryCPU` class
3. Add assembler support in `assembler.js` if needed
4. Test with `node test.js`
5. Validate in web interface

### Modifying Balanced Ternary Operations
1. Edit methods in `BalancedTernary` class in `ternary.js`
2. Test arithmetic operations with `node test.js`
3. Verify in web interface calculator functionality

### Debugging Issues
1. **Console errors**: Check browser console for JavaScript errors
2. **Assembly errors**: Look for assembler error messages in web interface
3. **Execution errors**: Use `debugFunctions.dumpMemory()` and breakpoints
4. **Node.js testing**: Run `node test.js` to isolate issues

### Web Interface Changes
1. Modify HTML structure in `index.html`
2. Update CSS styling in `styles.css` 
3. Update JavaScript controllers in `simulator.js`
4. Test in browser at http://localhost:8080

## Architecture Notes

### Balanced Ternary System
- **Trits**: Values are -1, 0, +1 (displayed as -, 0, +)
- **Trytes**: 6-trit words, range -364 to +364
- **Addresses**: 9-trit addresses, range 0 to 19,682
- **Display format**: T/0/1 or -/0/+ notation

### Memory Model  
- **Sparse array**: Uses JavaScript Map for efficiency
- **Address space**: 9-trit addresses (default, configurable)
- **I/O mapping**: High memory addresses reserved for console/graphics output
- **Watchpoints**: Debug feature tracks all memory access

### Instruction Set
- **Format**: 6-trit instructions (3-trit opcode + 3-trit operand)
- **Addressing**: Immediate (#value) and direct (address) modes
- **Categories**: Data movement, arithmetic, logical, control flow, stack, I/O

## Error Handling and Limitations

### Known Working Patterns
- All arithmetic operations work correctly
- Assembly and execution work for valid programs
- Memory operations function properly
- Web interface loads and operates correctly

### Known Limitations
- **No package management**: Don't try to add npm dependencies
- **Pure client-side**: No server-side processing
- **Browser compatibility**: Requires modern JavaScript support
- **No persistence**: Programs and state reset on page reload

### Common Errors to Avoid
- **DO NOT** run `npm install` - there is no package.json
- **DO NOT** try to build the project - it's pure JavaScript
- **DO NOT** modify the balanced ternary arithmetic without thorough testing
- **DO NOT** assume binary/decimal logic applies to ternary operations

## Quick Reference Commands

```bash
# Test everything
node test.js

# Test specific components
node simple_test.js
node manual_test.js

# Serve web interface
python3 -m http.server 8080

# Debug in browser console
debugFunctions.setBreakpoint(address)
debugFunctions.dumpMemory(start, count)
debugFunctions.exportState()
```

## Validation Checklist

Before completing any changes, ALWAYS verify:
- [ ] `node test.js` passes (takes <0.1 seconds)
- [ ] Web interface loads at http://localhost:8080
- [ ] Can assemble and run a test program in browser
- [ ] Debug functions work in browser console
- [ ] No JavaScript console errors
- [ ] All modified functionality works correctly

This simulator demonstrates a complete balanced ternary computer architecture for educational and research purposes. The design prioritizes clarity and functional completeness while maintaining simplicity in the development environment.