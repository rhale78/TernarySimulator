/**
 * Debug Interrupt Vector Table
 */

const ternaryModule = require('./ternary.js');
const { BalancedTernary, Tryte, TernaryAddress } = ternaryModule;

const memoryModule = require('./memory.js');
const { TernaryMemory } = memoryModule;

const interruptsModule = require('./interrupts.js');
const { InterruptVectorTable } = interruptsModule;

console.log('=== Debug Interrupt Vector Table ===');

const memory = new TernaryMemory();
const ivt = new InterruptVectorTable(memory);

const testAddress = 0x200; // 512 in decimal
console.log(`Test address: ${testAddress} (0x${testAddress.toString(16)})`);

// Test setting and getting
ivt.setVector(5, testAddress);
console.log(`Stored handler address: ${testAddress}`);

const retrieved = ivt.getVector(5);
console.log(`Retrieved handler address: ${retrieved.toDecimal()}`);
console.log(`Retrieved as TernaryAddress: ${retrieved.toString()}`);

// Check if they match
console.log(`Match: ${retrieved.toDecimal() === testAddress}`);

// Debug the internal storage
console.log('\nDebugging internal storage:');
const vectorAddr = new TernaryAddress(ivt.baseAddress.toDecimal() + 5, 9);
console.log(`Vector storage address: ${vectorAddr.toString()}`);

const low = memory.read(vectorAddr);
const high = memory.read(vectorAddr.increment());
console.log(`Stored low: ${low.toDecimal()}`);
console.log(`Stored high: ${high.toDecimal()}`);

const reconstructed = low.toDecimal() + (high.toDecimal() * 729);
console.log(`Reconstructed: ${reconstructed}`);

// Check Tryte limits
console.log(`\nTryte limits: ${Tryte.MIN_VALUE} to ${Tryte.MAX_VALUE}`);
console.log(`Test address within single tryte: ${testAddress >= Tryte.MIN_VALUE && testAddress <= Tryte.MAX_VALUE}`);

// Test with smaller address
const smallAddr = 100;
console.log(`\nTesting with small address: ${smallAddr}`);
ivt.setVector(6, smallAddr);
const smallRetrieved = ivt.getVector(6);
console.log(`Small address match: ${smallRetrieved.toDecimal() === smallAddr}`);