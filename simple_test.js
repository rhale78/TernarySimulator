#!/usr/bin/env node
/**
 * Simple component test
 */

// Import modules
const { BalancedTernary, Tryte, TernaryAddress, TernaryUtils } = require('./ternary.js');

console.log('Testing Tryte storage and retrieval...');

// Test tryte creation
const tryte1 = new Tryte(123);
console.log(`Original tryte: ${tryte1.toString()} (${tryte1.toDecimal()})`);
console.log(`Trits: [${tryte1.trits.join(', ')}]`);

// Test copying
const tryte2 = new Tryte(tryte1.trits);
console.log(`Copied tryte: ${tryte2.toString()} (${tryte2.toDecimal()})`);
console.log(`Trits: [${tryte2.trits.join(', ')}]`);

console.log(`Equal? ${tryte1.equals(tryte2)}`);

// Test instruction encoding
console.log('\nTesting instruction encoding...');
const opcode = 1; // LDA
const operand = 7;

const opcodeTrits = new BalancedTernary(opcode).toWidth(3).trits;
const operandTrits = new BalancedTernary(operand).toWidth(3).trits;

console.log(`Opcode ${opcode} -> trits: [${opcodeTrits.join(', ')}]`);
console.log(`Operand ${operand} -> trits: [${operandTrits.join(', ')}]`);

const instruction = [...opcodeTrits, ...operandTrits];
console.log(`Instruction trits: [${instruction.join(', ')}]`);

const instructionTryte = new Tryte(instruction);
console.log(`Instruction as tryte: ${instructionTryte.toString()}`);
console.log(`Instruction trits: [${instructionTryte.trits.join(', ')}]`);

// Test decoding
const decoded_opcodeTrits = [instructionTryte.trits[0], instructionTryte.trits[1], instructionTryte.trits[2]];
const decoded_operandTrits = [instructionTryte.trits[3], instructionTryte.trits[4], instructionTryte.trits[5]];

const decoded_opcode = new BalancedTernary(decoded_opcodeTrits).toDecimal();
const decoded_operand = new BalancedTernary(decoded_operandTrits).toDecimal();

console.log(`Decoded opcode: ${decoded_opcode} (expected: ${opcode})`);
console.log(`Decoded operand: ${decoded_operand} (expected: ${operand})`);