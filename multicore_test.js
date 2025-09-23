/**
 * Multi-Core CPU Test Suite
 * Tests dual-core functionality and coordination
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

const multicoreModule = require('./multicore.js');
const { MultiCoreCPU } = multicoreModule;

function testMultiCoreBasic() {
    console.log('\n=== Testing Multi-Core Basic Operations ===');
    
    try {
        const memory = new TernaryMemory(9);
        const multiCPU = new MultiCoreCPU(memory, 2); // 2 cores
        
        console.log(`Created multi-core CPU with ${multiCPU.getCoreCount()} cores`);
        console.log(`Active core: ${multiCPU.getActiveCore()}`);
        
        // Test core switching
        multiCPU.switchToCore(1);
        console.log(`Switched to core: ${multiCPU.getActiveCore()}`);
        
        // Test parallel mode
        multiCPU.setParallelMode(true);
        console.log(`Parallel mode enabled: ${multiCPU.isParallelMode()}`);
        
        console.log('✓ Multi-core basic operations test passed');
        return true;
    } catch (error) {
        console.error('✗ Multi-core basic operations test failed:', error.message);
        return false;
    }
}

function testMultiCoreExecution() {
    console.log('\n=== Testing Multi-Core Program Execution ===');
    
    try {
        const memory = new TernaryMemory(9);
        const multiCPU = new MultiCoreCPU(memory, 2);
        const assembler = new TernaryAssembler();
        
        // Create two simple programs for dual-core execution
        const program1 = `
            .org 0
            LDA #10
            ADD #5
            STA 100
            HLT
        `;
        
        const program2 = `
            .org 50
            LDA #20
            ADD #15
            STA 101
            HLT
        `;
        
        // Assemble and load programs
        const result1 = assembler.assemble(program1);
        const result2 = assembler.assemble(program2);
        
        if (!result1.success || !result2.success) {
            throw new Error('Assembly failed');
        }
        
        // Load program 1 into memory
        result1.machineCode.forEach(({ address, instruction }) => {
            memory.write(new TernaryAddress(address, 9), instruction);
        });
        
        // Load program 2 into memory  
        result2.machineCode.forEach(({ address, instruction }) => {
            memory.write(new TernaryAddress(address, 9), instruction);
        });
        
        // Execute on core 0
        multiCPU.switchToCore(0);
        multiCPU.cores[0].registers.set('pc', new TernaryAddress(0, 9));
        
        // Execute on core 1
        multiCPU.switchToCore(1);
        multiCPU.cores[1].registers.set('pc', new TernaryAddress(50, 9));
        
        // Run both cores
        multiCPU.setParallelMode(true);
        let steps = 0;
        while (!multiCPU.allCoresHalted() && steps < 20) {
            multiCPU.step();
            steps++;
        }
        
        // Check results
        const result1Value = memory.read(new TernaryAddress(100, 9));
        const result2Value = memory.read(new TernaryAddress(101, 9));
        
        console.log(`Core 0 result: ${result1Value.toDecimal()} (expected: 15)`);
        console.log(`Core 1 result: ${result2Value.toDecimal()} (expected: 35)`);
        
        if (result1Value.toDecimal() === 15 && result2Value.toDecimal() === 35) {
            console.log('✓ Multi-core execution test passed');
            return true;
        } else {
            throw new Error('Incorrect results from multi-core execution');
        }
    } catch (error) {
        console.error('✗ Multi-core execution test failed:', error.message);
        return false;
    }
}

function testMultiCoreStats() {
    console.log('\n=== Testing Multi-Core Statistics ===');
    
    try {
        const memory = new TernaryMemory(9);
        const multiCPU = new MultiCoreCPU(memory, 2);
        
        // Get initial stats
        const stats = multiCPU.getStats();
        console.log('Multi-core statistics:');
        console.log(`  Total cycles: ${stats.totalCycles}`);
        console.log(`  Core 0 cycles: ${stats.coreCycles[0]}`);
        console.log(`  Core 1 cycles: ${stats.coreCycles[1]}`);
        console.log(`  Load balance: ${stats.loadBalance}%`);
        
        console.log('✓ Multi-core statistics test passed');
        return true;
    } catch (error) {
        console.error('✗ Multi-core statistics test failed:', error.message);
        return false;
    }
}

function runAllMultiCoreTests() {
    console.log('=== Multi-Core CPU Test Suite ===');
    
    const tests = [
        testMultiCoreBasic,
        testMultiCoreExecution,
        testMultiCoreStats
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        if (test()) {
            passed++;
        }
    }
    
    console.log(`\n=== Multi-Core Test Results ===`);
    console.log(`Passed: ${passed}/${total}`);
    
    if (passed === total) {
        console.log('🎉 All multi-core tests passed!');
        return true;
    } else {
        console.log('❌ Some multi-core tests failed');
        return false;
    }
}

// Export test functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testMultiCoreBasic,
        testMultiCoreExecution,
        testMultiCoreStats,
        runAllMultiCoreTests
    };
} else {
    // Run tests if called directly
    runAllMultiCoreTests();
}

console.log('Multi-Core Test Suite Initialized');