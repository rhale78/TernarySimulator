/**
 * Word and Triple-Word Instructions Test
 * Tests the new extended data type operations
 */

// Import required modules
const ternaryModule = require('./ternary.js');
const { BalancedTernary, Tryte, DoubleWord, TripleWord, TernaryAddress } = ternaryModule;

const memoryModule = require('./memory.js');
const { TernaryMemory } = memoryModule;

const cpuModule = require('./cpu.js');
const { TernaryCPU } = cpuModule;

function testWordOperations() {
    console.log('=== Word and Triple-Word Operations Test ===');
    
    try {
        // Create memory and CPU
        const memory = new TernaryMemory();
        const cpu = new TernaryCPU(memory);
        
        console.log('Testing DoubleWord data type...');
        const word1 = new DoubleWord(1000);
        const word2 = new DoubleWord(500);
        console.log(`Word1: ${word1.toDecimal()} (${word1.toString()})`);
        console.log(`Word2: ${word2.toDecimal()} (${word2.toString()})`);
        
        const wordSum = word1.add(word2.toDecimal());
        console.log(`Word1 + Word2 = ${wordSum.toDecimal()}`);
        
        console.log('\nTesting TripleWord data type...');
        const triple1 = new TripleWord(100000);
        const triple2 = new TripleWord(50000);
        console.log(`Triple1: ${triple1.toDecimal()} (${triple1.toString()})`);
        console.log(`Triple2: ${triple2.toDecimal()} (${triple2.toString()})`);
        
        const tripleSum = triple1.add(triple2.toDecimal());
        console.log(`Triple1 + Triple2 = ${tripleSum.toDecimal()}`);
        
        console.log('\nTesting word registers...');
        cpu.registers.set('accw', new DoubleWord(1500));
        cpu.registers.set('w1', new DoubleWord(250));
        console.log(`ACCW: ${cpu.registers.get('accw').toDecimal()}`);
        console.log(`W1: ${cpu.registers.get('w1').toDecimal()}`);
        
        console.log('\nTesting triple-word registers...');
        cpu.registers.set('acct', new TripleWord(150000));
        cpu.registers.set('t1', new TripleWord(25000));
        console.log(`ACCT: ${cpu.registers.get('acct').toDecimal()}`);
        console.log(`T1: ${cpu.registers.get('t1').toDecimal()}`);
        
        console.log('\nTesting word instruction execution...');
        
        // Test LDAW (Load Accumulator Word) with immediate value
        cpu.loadAccumulatorWord(2000);
        console.log(`After LDAW #2000: ACCW = ${cpu.registers.get('accw').toDecimal()}`);
        
        // Test ADDW with immediate value
        cpu.addWord(1000);
        console.log(`After ADDW #1000: ACCW = ${cpu.registers.get('accw').toDecimal()}`);
        
        // Test STAW (Store Accumulator Word) to memory
        cpu.storeAccumulatorWord(100);
        
        // Verify word was stored correctly
        const storedLow = memory.read(new TernaryAddress(100, 9));
        const storedHigh = memory.read(new TernaryAddress(101, 9));
        const storedValue = (storedHigh.toDecimal() * 729) + storedLow.toDecimal();
        console.log(`Word stored at address 100-101: ${storedValue}`);
        
        console.log('\nTesting triple-word instruction execution...');
        
        // Test LDAT (Load Accumulator Triple) with immediate value
        cpu.loadAccumulatorTriple(200000);
        console.log(`After LDAT #200000: ACCT = ${cpu.registers.get('acct').toDecimal()}`);
        
        // Test ADDT with immediate value
        cpu.addTriple(100000);
        console.log(`After ADDT #100000: ACCT = ${cpu.registers.get('acct').toDecimal()}`);
        
        // Test STAT (Store Accumulator Triple) to memory
        cpu.storeAccumulatorTriple(200);
        
        // Verify triple-word was stored correctly
        const tripleStoredLow = memory.read(new TernaryAddress(200, 9));
        const tripleStoredMid = memory.read(new TernaryAddress(201, 9));
        const tripleStoredHigh = memory.read(new TernaryAddress(202, 9));
        const tripleStoredValue = (tripleStoredHigh.toDecimal() * 531441) + 
                                  (tripleStoredMid.toDecimal() * 729) + 
                                  tripleStoredLow.toDecimal();
        console.log(`Triple-word stored at address 200-202: ${tripleStoredValue}`);
        
        console.log('\nTesting memory block operations...');
        
        // Set up test data
        for (let i = 0; i < 5; i++) {
            memory.write(new TernaryAddress(50 + i, 9), new Tryte(i + 10));
        }
        
        // Test MOVC (Memory Copy)
        cpu.registers.set('ix', new TernaryAddress(50, 9));   // Source
        cpu.registers.set('ix1', new TernaryAddress(150, 9)); // Destination  
        cpu.registers.set('acc', new Tryte(5));               // Count
        cpu.memoryCopy(0);
        
        // Verify copy worked
        console.log('Memory copy results:');
        for (let i = 0; i < 5; i++) {
            const original = memory.read(new TernaryAddress(50 + i, 9));
            const copied = memory.read(new TernaryAddress(150 + i, 9));
            console.log(`  Address ${50 + i}: ${original.toDecimal()} -> Address ${150 + i}: ${copied.toDecimal()}`);
        }
        
        // Test CLRB (Clear Block)
        cpu.registers.set('ix', new TernaryAddress(150, 9));  // Start address
        cpu.registers.set('acc', new Tryte(3));               // Count
        cpu.clearBlock(0);
        
        console.log('After clearing 3 locations starting at 150:');
        for (let i = 0; i < 5; i++) {
            const value = memory.read(new TernaryAddress(150 + i, 9));
            console.log(`  Address ${150 + i}: ${value.toDecimal()}`);
        }
        
        // Verify expected results
        if (storedValue === 3000 && tripleStoredValue === 300000) {
            console.log('✓ Word and triple-word operations test passed');
        } else {
            console.log('✗ Word and triple-word operations test failed');
        }
        
    } catch (error) {
        console.error(`Word operations test failed: ${error.message}`);
        console.error(error.stack);
    }
}

// Run the test
testWordOperations();