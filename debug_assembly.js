const { TernaryAssembler } = require('./assembler.js');

const assembler = new TernaryAssembler();
const program = `TEDG 0
TCRT 0
HLT`;

console.log('Testing new instructions assembly...');
const result = assembler.assemble(program);
console.log('Success:', result.success);
console.log('Result keys:', Object.keys(result));

if (!result.success) {
  console.log('Error details:', result);
} else {
  console.log('Generated', result.machineCode.length, 'instructions');
  for (let i = 0; i < result.machineCode.length; i++) {
    const mc = result.machineCode[i];
    console.log(`${i}: ${mc.instruction.toString()} - ${mc.source}`);
  }
}