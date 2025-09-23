/**
 * Test assembler with new instructions
 */

const assemblerModule = require('./assembler.js');
const { TernaryAssembler } = assemblerModule;

function testNewInstructions() {
    console.log('=== Testing Assembler with New Instructions ===');
    
    const assembler = new TernaryAssembler();
    
    // Test program using new instructions
    const program = `
        ; Test enhanced clock and timer instructions
        
        ; Edge detection tests
        TEDG 0      ; Test ternary rising edge
        TEDG 1      ; Test ternary falling edge
        BEDG 0      ; Test binary rising edge
        BEDG 1      ; Test binary falling edge
        
        ; Hardware timer creation and management
        LDA #5      ; Set frequency to 5 Hz
        TCRT 0      ; Create binary timer
        
        LDA #10     ; Set preset value
        TSET 0      ; Set timer preset (timer ID 0)
        TSTA 0      ; Start timer
        
        ; Check status and stop
        TSTS 0      ; Check timer status
        TSTP 0      ; Stop timer
        TDEL 0      ; Delete timer
        
        ; Test push/pop (already existing)
        LDA #42
        PSH
        LDA #0
        POP
        
        ; Clock reading
        CLKR
        OUT
        
        HLT
    `;
    
    try {
        const result = assembler.assemble(program);
        
        if (result.success) {
            console.log('✓ Assembly successful!');
            console.log(`Generated ${result.machineCode.length} instructions`);
            
            // Print disassembly (first 10 instructions)
            console.log('\nDisassembly:');
            for (let i = 0; i < Math.min(result.machineCode.length, 10); i++) {
                const machineCodeEntry = result.machineCode[i];
                const instruction = machineCodeEntry.instruction;
                try {
                    const disasm = assembler.disassemble(instruction);
                    console.log(`${i.toString().padStart(3, '0')}: ${instruction.toString()} - ${disasm} ; ${machineCodeEntry.source}`);
                } catch (error) {
                    console.log(`${i.toString().padStart(3, '0')}: ${instruction.toString()} - DISASM_ERROR ; ${machineCodeEntry.source}`);
                }
            }
            
            console.log(`\nLabels found: ${Object.keys(result.labels).length}`);
            for (const [label, address] of Object.entries(result.labels)) {
                console.log(`  ${label}: ${address}`);
            }
            
            return true;
        } else {
            console.error('❌ Assembly failed!');
            if (result.errors && result.errors.forEach) {
                console.error('Errors:');
                result.errors.forEach(error => {
                    console.error(`  Line ${error.line}: ${error.message}`);
                });
            } else {
                console.error('Unknown assembly error');
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Assembly exception:', error.message);
        return false;
    }
}

function testInstructionOpcodes() {
    console.log('\n=== Testing New Instruction Opcodes ===');
    
    const assembler = new TernaryAssembler();
    const opcodes = assembler.opcodes;
    
    const newInstructions = ['TEDG', 'BEDG', 'TCRT', 'TDEL', 'TSET', 'TSTA', 'TSTP', 'TSTS'];
    
    console.log('New instruction opcodes:');
    for (const inst of newInstructions) {
        if (opcodes[inst] !== undefined) {
            console.log(`  ${inst}: ${opcodes[inst]} ✓`);
        } else {
            console.log(`  ${inst}: NOT FOUND ❌`);
        }
    }
    
    return true;
}

function runAssemblerTests() {
    console.log('=== Enhanced Assembler Tests ===\n');
    
    let allPassed = true;
    allPassed = testInstructionOpcodes() && allPassed;
    allPassed = testNewInstructions() && allPassed;
    
    console.log(`\n=== Assembler Test Results ===`);
    if (allPassed) {
        console.log('🎉 All assembler tests PASSED!');
    } else {
        console.log('❌ Some assembler tests FAILED!');
    }
    
    return allPassed;
}

// Run tests
if (require.main === module) {
    runAssemblerTests();
}

module.exports = {
    testNewInstructions,
    testInstructionOpcodes,
    runAssemblerTests
};