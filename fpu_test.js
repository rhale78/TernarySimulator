/**
 * Floating-Point Unit Test
 * Tests the ternary and binary floating-point operations
 */

// Import required modules
const ternaryModule = require('./ternary.js');
const { BalancedTernary, Tryte, TernaryAddress } = ternaryModule;

const memoryModule = require('./memory.js');
const { TernaryMemory } = memoryModule;

const cpuModule = require('./cpu.js');
const { TernaryCPU } = cpuModule;

const fpuModule = require('./fpu.js');
const { TernaryFloat, BinaryFloat, FloatingPointUnit } = fpuModule;

const assemblerModule = require('./assembler.js');
const { TernaryAssembler } = assemblerModule;

function testFloatingPointOperations() {
    console.log('=== Floating-Point Unit Test ===');
    
    try {
        // Test TernaryFloat class
        console.log('Testing TernaryFloat class...');
        const float1 = new TernaryFloat(3.5, 'standard');
        const float2 = new TernaryFloat(2.25, 'standard');
        
        console.log(`Float1: ${float1.toString()}`);
        console.log(`Float2: ${float2.toString()}`);
        
        const sum = float1.add(float2);
        console.log(`Addition: ${float1.toDecimal()} + ${float2.toDecimal()} = ${sum.toDecimal()}`);
        
        const diff = float1.subtract(float2);
        console.log(`Subtraction: ${float1.toDecimal()} - ${float2.toDecimal()} = ${diff.toDecimal()}`);
        
        const product = float1.multiply(float2);
        console.log(`Multiplication: ${float1.toDecimal()} * ${float2.toDecimal()} = ${product.toDecimal()}`);
        
        const quotient = float1.divide(float2);
        console.log(`Division: ${float1.toDecimal()} / ${float2.toDecimal()} = ${quotient.toDecimal()}`);
        
        // Test extended precision
        console.log('\nTesting extended precision...');
        const extFloat1 = new TernaryFloat(12345.6789, 'extended');
        const extFloat2 = new TernaryFloat(987.654, 'extended');
        console.log(`Extended Float1: ${extFloat1.toString()}`);
        console.log(`Extended Float2: ${extFloat2.toString()}`);
        
        const extSum = extFloat1.add(extFloat2);
        console.log(`Extended Addition: ${extFloat1.toDecimal()} + ${extFloat2.toDecimal()} = ${extSum.toDecimal()}`);
        
        // Test BinaryFloat for comparison
        console.log('\nTesting BinaryFloat comparison...');
        const binFloat1 = new BinaryFloat(3.5);
        const binFloat2 = new BinaryFloat(2.25);
        const binSum = binFloat1.add(binFloat2);
        console.log(`Binary: ${binFloat1.toDecimal()} + ${binFloat2.toDecimal()} = ${binSum.toDecimal()}`);
        
        // Test FPU
        console.log('\nTesting FloatingPointUnit...');
        const fpu = new FloatingPointUnit();
        
        fpu.load('F0', 5.5);
        fpu.load('F1', 3.2);
        fpu.add('F0', 'F1', 'FACC');
        
        const fpuResult = fpu.store('FACC');
        console.log(`FPU: F0 + F1 = ${fpuResult.toDecimal()}`);
        
        // Test mode switching
        fpu.setMode('binary');
        fpu.load('B0', 5.5);
        fpu.load('B1', 3.2);
        fpu.add('B0', 'B1', 'BACC');
        
        const fpuBinaryResult = fpu.store('BACC');
        console.log(`FPU Binary: B0 + B1 = ${fpuBinaryResult.toDecimal()}`);
        
        // Test CPU integration
        console.log('\nTesting CPU-FPU integration...');
        const memory = new TernaryMemory();
        const cpu = new TernaryCPU(memory);
        
        // Test FLDA (Load float)
        cpu.floatLoad(7.5);
        const loadedValue = cpu.fpu.ternaryRegisters.FACC.toDecimal();
        console.log(`CPU FLDA #7.5: FACC = ${loadedValue}`);
        
        // Test FADD (Add float)
        cpu.floatAdd(2.5);
        const addResult = cpu.fpu.ternaryRegisters.FACC.toDecimal();
        console.log(`CPU FADD #2.5: FACC = ${addResult}`);
        
        // Test FMUL (Multiply float)
        cpu.floatMultiply(2.0);
        const mulResult = cpu.fpu.ternaryRegisters.FACC.toDecimal();
        console.log(`CPU FMUL #2.0: FACC = ${mulResult}`);
        
        // Test FCMP (Compare float)
        cpu.floatCompare(20.0);
        console.log(`CPU FCMP #20.0: zero=${cpu.alu.flags.zero}, pos=${cpu.alu.flags.positive}, neg=${cpu.alu.flags.negative}`);
        
        // Test floating-point program assembly and execution
        console.log('\nTesting floating-point program assembly...');
        const assembler = new TernaryAssembler();
        
        const fpProgram = `
            .org 0
            FLDA #3.14159    ; Load PI
            FADD #2.71828    ; Add E  
            FSTA 100         ; Store result
            FLDA #10.0       ; Load 10
            FDIV #3.0        ; Divide by 3
            FCMP #3.33       ; Compare with 3.33
            HLT              ; Halt
        `;
        
        try {
            const result = assembler.assemble(fpProgram);
            if (result.success) {
                console.log(`✓ Floating-point program assembled successfully! ${result.machineCode.length} instructions`);
                
                // Load program into memory
                result.machineCode.forEach(({ address, instruction }) => {
                    memory.write(new TernaryAddress(address, 9), instruction);
                });
                
                // Execute the program
                cpu.reset();
                let steps = 0;
                while (!cpu.halted && steps < 20) {
                    if (!cpu.step()) {
                        break;
                    }
                    steps++;
                }
                
                console.log(`Program executed in ${steps} steps`);
                console.log(`Final FACC: ${cpu.fpu.ternaryRegisters.FACC.toDecimal()}`);
                console.log(`FPU flags: zero=${cpu.fpu.flags.zero}, overflow=${cpu.fpu.flags.overflow}, invalid=${cpu.fpu.flags.invalid}`);
                
            } else {
                console.log(`✗ Assembly failed: ${result.errors.join(', ')}`);
            }
        } catch (error) {
            console.log(`Assembly error: ${error.message}`);
        }
        
        // Test memory storage/loading
        console.log('\nTesting float memory operations...');
        cpu.reset();
        cpu.floatLoad(42.42);
        cpu.floatStore(200);
        
        // Verify storage by loading back
        cpu.floatLoad(0); // Clear FACC
        cpu.floatLoad(200); // Load from memory
        const memResult = cpu.fpu.ternaryRegisters.FACC.toDecimal();
        console.log(`Stored and loaded float: ${memResult}`);
        
        // Test FPU state
        console.log('\nFPU State:');
        const fpuState = cpu.fpu.getState();
        console.log(`Mode: ${fpuState.mode}`);
        console.log(`Flags: ${JSON.stringify(fpuState.flags)}`);
        console.log(`FACC: ${fpuState.ternaryRegisters.FACC}`);
        
        // Check test results
        const tolerance = 0.01;
        const expectedSum = 3.5 + 2.25;
        const actualSum = sum.toDecimal();
        
        if (Math.abs(actualSum - expectedSum) < tolerance && 
            Math.abs(addResult - 10.0) < tolerance) {
            console.log('✓ Floating-point operations test passed');
        } else {
            console.log('✗ Floating-point operations test failed');
        }
        
    } catch (error) {
        console.error(`FPU test failed: ${error.message}`);
        console.error(error.stack);
    }
}

// Run the test
testFloatingPointOperations();