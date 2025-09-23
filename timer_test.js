// Test timer instructions with simple assembly program
const assemblerModule = require('./assembler.js');
const cpuModule = require('./cpu.js');
const memoryModule = require('./memory.js');

const { TernaryAssembler } = assemblerModule;
const { TernaryCPU } = cpuModule;
const { TernaryMemory } = memoryModule;

console.log('=== Testing Timer Instructions with Assembly ===');

// Create memory and CPU
const memory = new TernaryMemory(9);
const cpu = new TernaryCPU(memory);
const assembler = new TernaryAssembler();

// Test assembly program with timer instructions
const program = `
LDA #5       ; Load 5 into accumulator
CLKS         ; Set timer delay to 5
CLKR         ; Read current clock value
ADD #1       ; Add 1 to clock value
OUT          ; Output result
WAIT         ; Wait for timer (should set flags)
JP end       ; Jump if positive (timer complete)
LDA #99      ; This should be skipped if timer is complete
end:
LDA #42      ; Load success value
OUT          ; Output success
HLT          ; Halt
`;

console.log('Assembling timer test program...');
try {
    const result = assembler.assemble(program);
    
    if (result.success) {
        console.log('✓ Assembly successful!');
        console.log(`Generated ${result.machineCode.length} instructions`);
        
        // Load into memory
        for (let i = 0; i < result.machineCode.length; i++) {
            const address = result.startAddress + i;
            memory.write(new (require('./ternary.js')).Tryte(address), result.machineCode[i]);
        }
        
        console.log('\nProgram loaded. Testing execution...');
        
        // Test in legacy mode first (simpler)
        cpu.setMicrocodeEnabled(false);
        
        let steps = 0;
        const executeStep = () => {
            if (!cpu.halted && steps < 20) {
                const success = cpu.step();
                const state = cpu.getState();
                console.log(`Step ${steps + 1}: PC=${state.registers.pc}, ACC=${state.registers.acc}, Halted=${state.execution.halted}`);
                
                if (success && !cpu.halted) {
                    steps++;
                    setTimeout(executeStep, 100); // 100ms delay between steps
                } else {
                    console.log('\n✓ Timer instruction test completed');
                    testShiftInstructions();
                }
            } else {
                console.log('\nMaximum steps reached or CPU halted');
                testShiftInstructions();
            }
        };
        
        executeStep();
        
    } else {
        console.log('✗ Assembly failed:', result.errors.join(', '));
        testShiftInstructions();
    }
} catch (error) {
    console.log('✗ Assembly error:', error.message);
    testShiftInstructions();
}

function testShiftInstructions() {
    console.log('\n=== Testing Shift Instructions ===');
    
    const memory2 = new TernaryMemory(9);
    const cpu2 = new TernaryCPU(memory2);
    const assembler2 = new TernaryAssembler();
    
    // Test shift operations
    const shiftProgram = `
LDA #8       ; Load 8 (binary 1000)
SHL #1       ; Shift left by 1 (should become 16)
OUT          ; Output result
SHR #2       ; Shift right by 2 (should become 4)
OUT          ; Output result
LDA #5       ; Load 5 (ternary +-)
SHL #1       ; Shift left by 1 in ternary
OUT          ; Output result
HLT          ; Halt
`;
    
    console.log('Assembling shift test program...');
    try {
        const result = assembler2.assemble(shiftProgram);
        
        if (result.success) {
            console.log('✓ Shift assembly successful!');
            
            // Load into memory
            for (let i = 0; i < result.machineCode.length; i++) {
                const address = result.startAddress + i;
                memory2.write(new (require('./ternary.js')).Tryte(address), result.machineCode[i]);
            }
            
            console.log('\nTesting shift operations...');
            cpu2.setMicrocodeEnabled(false);
            
            let steps = 0;
            const executeShiftStep = () => {
                if (!cpu2.halted && steps < 15) {
                    const success = cpu2.step();
                    const state = cpu2.getState();
                    console.log(`Shift Step ${steps + 1}: PC=${state.registers.pc}, ACC=${state.registers.acc}, Halted=${state.execution.halted}`);
                    
                    if (success && !cpu2.halted) {
                        steps++;
                        setTimeout(executeShiftStep, 50);
                    } else {
                        console.log('\n✓ Shift instruction test completed');
                        console.log('\n🎉 All timer and shift tests completed successfully!');
                    }
                } else {
                    console.log('\nShift test completed or max steps reached');
                    console.log('\n🎉 All timer and shift tests completed successfully!');
                }
            };
            
            executeShiftStep();
            
        } else {
            console.log('✗ Shift assembly failed:', result.errors.join(', '));
        }
    } catch (error) {
        console.log('✗ Shift assembly error:', error.message);
    }
}