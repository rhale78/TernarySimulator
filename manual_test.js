#!/usr/bin/env node
/**
 * Manual instruction test
 */

// Node.js environment setup
if (typeof window === 'undefined') {
    global.window = undefined;
    global.document = {
        getElementById: () => null,
        createElement: () => ({}),
        addEventListener: () => {}
    };
}

// Import modules
const { BalancedTernary, Tryte, TernaryAddress, TernaryUtils } = require('./ternary.js');
const { TernaryMemory, MemoryMappedIO } = require('./memory.js');
const { TernaryALU, TernaryRegisters, TernaryCPU } = require('./cpu.js');

console.log('Manual instruction test...');

// Create components
const memory = new TernaryMemory(9);
const cpu = new TernaryCPU(memory);

// Manually create LDA #7 instruction
const opcode = 1; // LDA
const operand = 7;

const opcodeTrits = new BalancedTernary(opcode).toWidth(3).trits;
const operandTrits = new BalancedTernary(operand).toWidth(3).trits;
const instruction = new Tryte([...opcodeTrits, ...operandTrits]);

console.log(`Created instruction: ${instruction.toString()}`);
console.log(`Instruction trits: [${instruction.trits.join(', ')}]`);

// Store instruction at address 0
memory.write(0, instruction);

// Read it back to verify
const readInstruction = memory.read(0);
console.log(`Read instruction: ${readInstruction.toString()}`);
console.log(`Read instruction trits: [${readInstruction.trits.join(', ')}]`);

// Execute one step
console.log('\nExecuting step...');
const success = cpu.step();
console.log(`Step result: ${success}`);

// Check accumulator
const acc = cpu.registers.get('acc');
console.log(`Accumulator: ${acc.toString()} (${acc.toDecimal()})`);
console.log(`Expected: 7`);

// Check program counter
const pc = cpu.registers.get('pc');
console.log(`Program Counter: ${pc.toString()} (${pc.toDecimal()})`);
console.log(`Expected: 1`);