// Simple test to debug instruction execution
const cpuModule = require('./cpu.js');
const memoryModule = require('./memory.js');
const ternaryModule = require('./ternary.js');

const { TernaryCPU } = cpuModule;
const { TernaryMemory } = memoryModule;
const { Tryte, BalancedTernary } = ternaryModule;

console.log('=== Debugging Basic Instruction Execution ===');

// Create memory and CPU
const memory = new TernaryMemory(9);
const cpu = new TernaryCPU(memory);

// Create a simple LDA #5 instruction manually
// LDA has opcode 1, operand should be 5
const opcodeTrits = new BalancedTernary(1).trits.slice(); // Opcode 1 trits
const operandTrits = new BalancedTernary(5).trits.slice(); // Operand 5 trits

// Ensure exactly 3 trits for each part
while (opcodeTrits.length < 3) opcodeTrits.push(0);
while (operandTrits.length < 3) operandTrits.push(0);
opcodeTrits.splice(3); // Keep only first 3
operandTrits.splice(3); // Keep only first 3

console.log('Opcode 1 as trits:', opcodeTrits);
console.log('Operand 5 as trits:', operandTrits);

const instructionTrits = [...opcodeTrits, ...operandTrits];
console.log('Complete instruction trits:', instructionTrits);

const instruction = new Tryte(instructionTrits);
console.log('Instruction as tryte:', instruction.toString());
console.log('Instruction decimal value:', instruction.toDecimal());

// Load instruction into memory at address 0
memory.write(new Tryte(0), instruction);

// Read it back to verify
const readBack = memory.read(new Tryte(0));
console.log('Read back from memory:', readBack.toString());

console.log('\nInitial CPU state:');
console.log('PC:', cpu.registers.get('pc').toString());
console.log('ACC:', cpu.registers.get('acc').toString());

console.log('\nExecuting one step...');
cpu.setMicrocodeEnabled(false); // Use legacy mode for simplicity

const success = cpu.step();
console.log('Step success:', success);

console.log('\nCPU state after step:');
console.log('PC:', cpu.registers.get('pc').toString());
console.log('ACC:', cpu.registers.get('acc').toString());

// Test manual instruction decoding
console.log('\n=== Manual Instruction Decoding ===');
const testInstruction = memory.read(new Tryte(0));
console.log('Test instruction:', testInstruction.toString());

const trits = testInstruction.trits;
console.log('Instruction trits:', trits);

while (trits.length < 6) {
    trits.push(0);
}

const opcodeTrits2 = [trits[0] || 0, trits[1] || 0, trits[2] || 0];
const operandTrits2 = [trits[3] || 0, trits[4] || 0, trits[5] || 0];

console.log('Decoded opcode trits:', opcodeTrits2);
console.log('Decoded operand trits:', operandTrits2);

const opcode = new BalancedTernary(opcodeTrits2).toDecimal();
const operandValue = new BalancedTernary(operandTrits2).toDecimal();

console.log('Decoded opcode:', opcode);
console.log('Decoded operand:', operandValue);

// Check if instruction exists
console.log('Available instructions:', Object.keys(cpu.instructions));
const matchingInstr = Object.entries(cpu.instructions).find(([name, instr]) => instr.opcode === opcode);
console.log('Matching instruction:', matchingInstr ? matchingInstr[0] : 'Not found');

console.log('\n=== Testing Direct Execution ===');
if (matchingInstr) {
    console.log('Executing LDA directly...');
    cpu.registers.set('pc', new Tryte(0)); // Reset PC
    cpu.registers.set('acc', new Tryte(0)); // Reset ACC
    
    console.log('Before direct execution - ACC:', cpu.registers.get('acc').toString());
    
    try {
        matchingInstr[1].execute(operandValue);
        console.log('After direct execution - ACC:', cpu.registers.get('acc').toString());
        console.log('✓ Direct execution successful');
    } catch (error) {
        console.log('✗ Direct execution failed:', error.message);
    }
}