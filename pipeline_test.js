/**
 * Pipeline Test
 * Tests the instruction pipeline functionality
 */

// Import required modules
const ternaryModule = require('./ternary.js');
const { BalancedTernary, Tryte, TernaryAddress } = ternaryModule;

const memoryModule = require('./memory.js');
const { TernaryMemory } = memoryModule;

const cpuModule = require('./cpu.js');
const { TernaryCPU } = cpuModule;

const assemblerModule = require('./assembler.js');
const { TernaryAssembler } = assemblerModule;

function testPipeline() {
    console.log('=== Pipeline Test ===');
    
    try {
        // Create memory and CPU
        const memory = new TernaryMemory();
        const cpu = new TernaryCPU(memory);
        const assembler = new TernaryAssembler();
        
        // Test program that should work well with pipeline
        const program = `
            .org 0
            LDA #5     ; Load 5
            ADD #3     ; Add 3  
            STA 20     ; Store to address 20
            LDA #2     ; Load 2
            MUL #4     ; Multiply by 4
            STA 21     ; Store to address 21
            HLT        ; Halt
        `;
        
        console.log('Assembling test program...');
        const result = assembler.assemble(program);
        
        if (!result.success) {
            throw new Error(`Assembly failed: ${result.errors.join(', ')}`);
        }
        
        console.log(`Assembly successful! Generated ${result.machineCode.length} instructions`);
        
        // Load program into memory
        result.machineCode.forEach(({ address, instruction }) => {
            memory.write(new TernaryAddress(address, 9), instruction);
        });
        
        console.log('Program loaded into memory');
        
        // Test pipeline disabled first
        console.log('\n--- Testing without pipeline ---');
        cpu.reset();
        cpu.setPipelineEnabled(false);
        
        let steps = 0;
        while (!cpu.halted && steps < 20) {
            if (!cpu.step()) {
                break;
            }
            steps++;
        }
        
        const result1 = memory.read(new TernaryAddress(20, 9));
        const result2 = memory.read(new TernaryAddress(21, 9));
        console.log(`Results without pipeline: addr 20 = ${result1.toDecimal()}, addr 21 = ${result2.toDecimal()}`);
        console.log(`Steps executed: ${steps}`);
        
        // Clear memory results
        memory.write(new TernaryAddress(20, 9), new Tryte(0));
        memory.write(new TernaryAddress(21, 9), new Tryte(0));
        
        // Test with pipeline enabled
        console.log('\n--- Testing with pipeline ---');
        cpu.reset();
        cpu.setPipelineEnabled(true);
        
        // Run for a short time to let pipeline work
        cpu.run();
        
        // Wait for execution to complete
        const checkComplete = () => {
            return new Promise((resolve) => {
                const check = () => {
                    if (cpu.halted || !cpu.running) {
                        resolve();
                    } else {
                        setTimeout(check, 50);
                    }
                };
                check();
            });
        };
        
        checkComplete().then(() => {
            const pipelineResult1 = memory.read(new TernaryAddress(20, 9));
            const pipelineResult2 = memory.read(new TernaryAddress(21, 9));
            console.log(`Results with pipeline: addr 20 = ${pipelineResult1.toDecimal()}, addr 21 = ${pipelineResult2.toDecimal()}`);
            
            // Get pipeline statistics
            const stats = cpu.getPipelineStats();
            console.log(`Pipeline stats: ${stats.totalInstructions} instructions, ${stats.stallCycles} stalls, ${stats.hazardCount} hazards`);
            console.log(`Pipeline throughput: ${(stats.throughput * 100).toFixed(1)}%`);
            
            // Verify results are correct
            if (pipelineResult1.toDecimal() === 8 && pipelineResult2.toDecimal() === 8) {
                console.log('✓ Pipeline test passed - results are correct');
            } else {
                console.log('✗ Pipeline test failed - incorrect results');
            }
            
            // Get pipeline state for debugging
            const pipelineState = cpu.getState().pipelineStatus;
            console.log('\nPipeline final state:');
            console.log(`  Enabled: ${pipelineState.enabled}`);
            console.log(`  Stalled: ${pipelineState.stalled}`);
            for (let [stage, instr] of Object.entries(pipelineState.stages)) {
                if (instr) {
                    console.log(`  ${stage}: PC=${instr.pc}, opcode=${instr.opcode}, operand=${instr.operand}`);
                } else {
                    console.log(`  ${stage}: empty`);
                }
            }
            
            cpu.pause();
        });
        
        // Give it time to run
        setTimeout(() => {
            console.log('✓ Pipeline test completed');
        }, 1000);
        
    } catch (error) {
        console.error(`Pipeline test failed: ${error.message}`);
        console.error(error.stack);
    }
}

// Run the test
testPipeline();