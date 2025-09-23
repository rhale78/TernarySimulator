/**
 * Simple Pipeline Debug Test
 * Minimal test to debug pipeline execution
 */

// Import required modules
const ternaryModule = require('./ternary.js');
const { BalancedTernary, Tryte, TernaryAddress } = ternaryModule;

const memoryModule = require('./memory.js');
const { TernaryMemory } = memoryModule;

const cpuModule = require('./cpu.js');
const { TernaryCPU } = cpuModule;

function debugPipelineExecution() {
    console.log('=== Simple Pipeline Debug ===');
    
    try {
        // Create memory and CPU
        const memory = new TernaryMemory();
        const cpu = new TernaryCPU(memory);
        
        // Manually create a simple instruction: LDA #5
        const ldaImmediate = new Tryte();
        // LDA opcode = 1, operand = 5
        // 1 in balanced ternary: [1, 0, 0] -> [+, 0, 0]
        // 5 in balanced ternary: [2, 1, 0] -> [+, -, 0]
        // Combined: [+, 0, 0, +, -, 0]
        ldaImmediate.trits = [1, 0, 0, 2, 1, 0]; // [opcode][operand]
        
        // Write instruction to memory at address 0
        memory.write(new TernaryAddress(0, 9), ldaImmediate);
        
        console.log('Manual instruction created: LDA #5');
        console.log(`Instruction trits: [${ldaImmediate.trits.join(', ')}]`);
        
        // Test normal execution first
        console.log('\n--- Normal execution ---');
        cpu.reset();
        cpu.setPipelineEnabled(false);
        
        console.log(`Before: ACC = ${cpu.registers.get('acc').toDecimal()}`);
        cpu.step();
        console.log(`After: ACC = ${cpu.registers.get('acc').toDecimal()}`);
        
        // Test pipeline execution
        console.log('\n--- Pipeline execution ---');
        cpu.reset();
        cpu.setPipelineEnabled(true);
        
        console.log(`Before: ACC = ${cpu.registers.get('acc').toDecimal()}`);
        
        // Manually tick pipeline a few times
        for (let i = 0; i < 10; i++) {
            cpu.pipeline.tick();
            const state = cpu.pipeline.getState();
            console.log(`Tick ${i + 1}:`);
            for (let [stage, instr] of Object.entries(state.stages)) {
                if (instr) {
                    console.log(`  ${stage}: PC=${instr.pc}, opcode=${instr.opcode}, operand=${instr.operand}, completed=${instr.completed}`);
                } else {
                    console.log(`  ${stage}: empty`);
                }
            }
            console.log(`  ACC = ${cpu.registers.get('acc').toDecimal()}`);
            
            if (cpu.halted) {
                console.log('  CPU halted');
                break;
            }
        }
        
        console.log(`Final ACC = ${cpu.registers.get('acc').toDecimal()}`);
        
    } catch (error) {
        console.error(`Debug test failed: ${error.message}`);
        console.error(error.stack);
    }
}

// Run the debug test
debugPipelineExecution();