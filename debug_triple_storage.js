/**
 * Debug Triple-Word Storage Issue
 */

const ternaryModule = require('./ternary.js');
const { Tryte, TripleWord, TernaryAddress } = ternaryModule;

const memoryModule = require('./memory.js');
const { TernaryMemory } = memoryModule;

console.log('=== Debugging Triple-Word Storage ===');

// Create memory and test the storage issue
const memory = new TernaryMemory();
const value = 300000;

console.log(`Original value: ${value}`);

// Split the value like the CPU does
let workingValue = value;
const low = new Tryte(workingValue % 729);
workingValue = Math.floor(workingValue / 729);
const mid = new Tryte(workingValue % 729);
workingValue = Math.floor(workingValue / 729);
const high = new Tryte(workingValue);

console.log(`Low part: ${low.toDecimal()} (trits: [${low.trits.join(', ')}])`);
console.log(`Mid part: ${mid.toDecimal()} (trits: [${mid.trits.join(', ')}])`);
console.log(`High part: ${high.toDecimal()} (trits: [${high.trits.join(', ')}])`);

// Store in memory
const addr = new TernaryAddress(200, 9);
memory.write(addr, low);
memory.write(addr.increment(), mid);
memory.write(addr.increment().increment(), high);

// Read back and reconstruct
const readLow = memory.read(addr);
const readMid = memory.read(addr.increment());
const readHigh = memory.read(addr.increment().increment());

console.log(`Read low: ${readLow.toDecimal()}`);
console.log(`Read mid: ${readMid.toDecimal()}`);
console.log(`Read high: ${readHigh.toDecimal()}`);

// Reconstruct value
let reconstructed = readLow.toDecimal();
reconstructed += readMid.toDecimal() * 729;
reconstructed += readHigh.toDecimal() * 729 * 729;

console.log(`Reconstructed: ${reconstructed}`);

// Check if Tryte can handle the components
console.log(`\nTryte limits: ${Tryte.MIN_VALUE} to ${Tryte.MAX_VALUE}`);
console.log(`Mid component (${Math.floor(value / 729) % 729}) within range: ${Math.floor(value / 729) % 729 <= Tryte.MAX_VALUE}`);
console.log(`High component (${Math.floor(value / (729 * 729))}) within range: ${Math.floor(value / (729 * 729)) <= Tryte.MAX_VALUE}`);

// Try using the actual Tryte limits instead
console.log('\n=== Alternative approach ===');
const value2 = 50000; // Smaller value
console.log(`Testing with smaller value: ${value2}`);

let workingValue2 = value2;
const low2 = new Tryte(workingValue2 % 729);
workingValue2 = Math.floor(workingValue2 / 729);
const mid2 = new Tryte(workingValue2 % 729);
workingValue2 = Math.floor(workingValue2 / 729);
const high2 = new Tryte(workingValue2);

console.log(`Components: low=${low2.toDecimal()}, mid=${mid2.toDecimal()}, high=${high2.toDecimal()}`);

let reconstructed2 = low2.toDecimal();
reconstructed2 += mid2.toDecimal() * 729;
reconstructed2 += high2.toDecimal() * 729 * 729;

console.log(`Reconstructed smaller: ${reconstructed2}`);