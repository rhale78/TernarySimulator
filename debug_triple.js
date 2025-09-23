/**
 * Debug Triple-Word Issue
 */

const ternaryModule = require('./ternary.js');
const { TripleWord } = ternaryModule;

console.log('=== Debugging Triple-Word Issue ===');

const triple = new TripleWord(300000);
console.log(`Triple value: ${triple.toDecimal()}`);
console.log(`Triple trits: [${triple.trits.join(', ')}]`);

// Test the math for storing/loading
const value = 300000;
const low = value % 729;
const mid = Math.floor(value / 729) % 729;
const high = Math.floor(value / 531441);

console.log(`Original: ${value}`);
console.log(`Low: ${low}`);
console.log(`Mid: ${mid}`);
console.log(`High: ${high}`);

const reconstructed = (high * 531441) + (mid * 729) + low;
console.log(`Reconstructed: ${reconstructed}`);

// Check TripleWord limits
console.log(`TripleWord MAX: ${TripleWord.MAX_VALUE}`);
console.log(`TripleWord MIN: ${TripleWord.MIN_VALUE}`);

// Test with a smaller value
const smaller = new TripleWord(100000);
console.log(`\nSmaller triple: ${smaller.toDecimal()}`);
const smallerValue = 100000;
const smallLow = smallerValue % 729;
const smallMid = Math.floor(smallerValue / 729) % 729;
const smallHigh = Math.floor(smallerValue / 531441);
const smallReconstructed = (smallHigh * 531441) + (smallMid * 729) + smallLow;
console.log(`Smaller reconstructed: ${smallReconstructed}`);