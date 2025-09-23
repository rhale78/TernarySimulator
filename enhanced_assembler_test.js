/**
 * Enhanced Assembler Features Test
 * Tests macros, conditional assembly, and advanced directives
 */

// Import dependencies
const { TernaryAssembler } = require('./assembler.js');
const { BalancedTernary, Tryte } = require('./ternary.js');

function testMacros() {
    console.log('Testing macros...');
    
    const assembler = new TernaryAssembler();
    const source = `
; Test macro definition and expansion
.macro LOAD_ADD addr value
    LDA addr
    ADD #value
    STA addr
.endm

.org 0
    LOAD_ADD 50 10
    HLT
`;

    const result = assembler.assemble(source);
    
    if (!result.success) {
        throw new Error(`Macro test failed: ${result.error}`);
    }
    
    // Should expand to: LDA 50, ADD #10, STA 50, HLT
    if (result.machineCode.length !== 4) {
        throw new Error(`Expected 4 instructions, got ${result.machineCode.length}`);
    }
    
    console.log('✓ Macro expansion working');
}

function testConditionalAssembly() {
    console.log('Testing conditional assembly...');
    
    const assembler = new TernaryAssembler();
    const source = `
.equ DEBUG 1
.equ VERSION 2

.org 0
LDA #5

.ifdef DEBUG
    OUT
.endif

.if VERSION > 1
    ADD #10
.else
    ADD #5
.endif

HLT
`;

    const result = assembler.assemble(source);
    
    if (!result.success) {
        throw new Error(`Conditional assembly test failed: ${result.error}`);
    }
    
    // Should include: LDA #5, OUT, ADD #10, HLT
    if (result.machineCode.length !== 4) {
        throw new Error(`Expected 4 instructions, got ${result.machineCode.length}`);
    }
    
    console.log('✓ Conditional assembly working');
}

function testAdvancedDirectives() {
    console.log('Testing advanced directives...');
    
    const assembler = new TernaryAssembler();
    const source = `
.org 0
LDA #5

.align 4
data:
    .ascii "Hi"
    .db 0

.align 8
more_data:
    .dw 1000
    HLT
`;

    const result = assembler.assemble(source);
    
    if (!result.success) {
        throw new Error(`Advanced directives test failed: ${result.error}`);
    }
    
    console.log('✓ Advanced directives working');
}

function testNestedConditionals() {
    console.log('Testing nested conditionals...');
    
    const assembler = new TernaryAssembler();
    const source = `
.equ FEATURE_A 1
.equ FEATURE_B 0

.org 0
LDA #1

.ifdef FEATURE_A
    ADD #2
    .ifdef FEATURE_B
        ADD #4
    .else
        ADD #8
    .endif
.else
    SUB #1
.endif

HLT
`;

    const result = assembler.assemble(source);
    
    if (!result.success) {
        throw new Error(`Nested conditionals test failed: ${result.error}`);
    }
    
    // Should include: LDA #1, ADD #2, ADD #8, HLT
    if (result.machineCode.length !== 4) {
        throw new Error(`Expected 4 instructions, got ${result.machineCode.length}`);
    }
    
    console.log('✓ Nested conditionals working');
}

function testMacroWithParameters() {
    console.log('Testing macro parameters...');
    
    const assembler = new TernaryAssembler();
    const source = `
.macro COMPARE_AND_JUMP val1 val2 label
    LDA val1
    CMP val2
    JZ label
.endm

.org 0
    COMPARE_AND_JUMP #10 #10 equal
    LDA #0
    HLT
equal:
    LDA #1
    HLT
`;

    const result = assembler.assemble(source);
    
    if (!result.success) {
        throw new Error(`Macro parameters test failed: ${result.error}`);
    }
    
    console.log('✓ Macro parameters working');
}

// Run all tests
function runTests() {
    console.log('=== Enhanced Assembler Tests ===\n');
    
    try {
        testMacros();
        testConditionalAssembly();
        testAdvancedDirectives();
        testNestedConditionals();
        testMacroWithParameters();
        
        console.log('\n🎉 All enhanced assembler tests passed!');
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        process.exit(1);
    }
}

// Only run if this is the main module
if (require.main === module) {
    runTests();
}

module.exports = { runTests };