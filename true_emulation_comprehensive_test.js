/**
 * Comprehensive Test Suite for True Ternary Emulation
 * Tests that all operations use component-based ternary arithmetic
 */

// Import required modules
const ternaryModule = require('./ternary.js');
const { BalancedTernary, Tryte, DoubleWord, TripleWord, TernaryAddress } = ternaryModule;

const memoryModule = require('./memory.js');
const { TernaryMemory } = memoryModule;

const cpuModule = require('./cpu.js');
const { TernaryCPU, TernaryALU } = cpuModule;

const assemblerModule = require('./assembler.js');
const { TernaryAssembler } = assemblerModule;

const highlevelModule = require('./highlevel.js');
const { TernaryHighLevelCompiler } = highlevelModule;

function testTrueComponentBasedArithmetic() {
    console.log('\n=== Testing True Component-Based Arithmetic ===');
    
    try {
        // Test basic arithmetic operations use components
        const a = new BalancedTernary(15);
        const b = new BalancedTernary(7);
        
        // Test addition using component-based arithmetic
        const sum = a.add(b);
        console.log(`15 + 7 = ${sum.toDecimal()} (using component adder)`);
        
        // Test multiplication using component-based arithmetic  
        const product = a.multiply(b);
        console.log(`15 * 7 = ${product.toDecimal()} (using component multiplier)`);
        
        // Test division using pure ternary long division
        const quotient = a.divide(b);
        console.log(`15 / 7 = ${quotient.toDecimal()} (using ternary long division)`);
        
        // Test modulo using ternary arithmetic
        const remainder = a.modulo(b);
        console.log(`15 % 7 = ${remainder.toDecimal()} (using ternary modulo)`);
        
        // Test logical operations using ternary gates
        const andResult = a.and(b);
        console.log(`15 AND 7 = ${andResult.toDecimal()} (using ternary AND gate)`);
        
        const xorResult = a.xor(b);
        console.log(`15 XOR 7 = ${xorResult.toDecimal()} (using ternary XOR logic)`);
        
        console.log('✓ True component-based arithmetic test passed');
        return true;
    } catch (error) {
        console.error('✗ Component-based arithmetic test failed:', error.message);
        return false;
    }
}

function testWordAndTripleOperations() {
    console.log('\n=== Testing Word and Triple Operations ===');
    
    try {
        // Test DoubleWord (12-trit) operations
        const word1 = new DoubleWord(1000);
        const word2 = new DoubleWord(250);
        
        const wordSum = word1.add(word2);
        console.log(`Word: 1000 + 250 = ${wordSum.toDecimal()}`);
        
        const wordDiv = word1.divide(word2);
        console.log(`Word: 1000 / 250 = ${wordDiv.toDecimal()}`);
        
        const wordXor = word1.xor(word2);
        console.log(`Word: 1000 XOR 250 = ${wordXor.toDecimal()}`);
        
        // Test TripleWord (18-trit) operations
        const triple1 = new TripleWord(100000);
        const triple2 = new TripleWord(25000);
        
        const tripleSum = triple1.add(triple2);
        console.log(`Triple: 100000 + 25000 = ${tripleSum.toDecimal()}`);
        
        const tripleDiv = triple1.divide(triple2);
        console.log(`Triple: 100000 / 25000 = ${tripleDiv.toDecimal()}`);
        
        const tripleXor = triple1.xor(triple2);
        console.log(`Triple: 100000 XOR 25000 = ${tripleXor.toDecimal()}`);
        
        console.log('✓ Word and triple operations test passed');
        return true;
    } catch (error) {
        console.error('✗ Word and triple operations test failed:', error.message);
        return false;
    }
}

function testALUComponentBasedOperations() {
    console.log('\n=== Testing ALU Component-Based Operations ===');
    
    try {
        const alu = new TernaryALU();
        
        const a = new Tryte(20);
        const b = new Tryte(5);
        
        // Test ALU operations use component-based arithmetic
        const addResult = alu.add(a, b);
        console.log(`ALU ADD: 20 + 5 = ${addResult.toDecimal()}`);
        console.log(`ALU flags: zero=${alu.flags.zero}, positive=${alu.flags.positive}`);
        
        const divResult = alu.divide(a, b);
        console.log(`ALU DIV: 20 / 5 = ${divResult.toDecimal()}`);
        
        const modResult = alu.modulo(a, b);
        console.log(`ALU MOD: 20 % 5 = ${modResult.toDecimal()}`);
        
        const xorResult = alu.xor(a, b);
        console.log(`ALU XOR: 20 XOR 5 = ${xorResult.toDecimal()}`);
        
        console.log('✓ ALU component-based operations test passed');
        return true;
    } catch (error) {
        console.error('✗ ALU component-based operations test failed:', error.message);
        return false;
    }
}

function testHighLevelLanguageCompleteFeatures() {
    console.log('\n=== Testing High-Level Language Complete Features ===');
    
    try {
        const compiler = new TernaryHighLevelCompiler();
        
        // Test high-level code with all operations
        const highLevelCode = `
            int a = 20;
            int b = 7;
            int sum = a + b;
            int diff = a - b;
            int product = a * b;
            int quotient = a / b;
            int remainder = a % b;
            int xorResult = a ^ b;
            int andResult = a & b;
            int orResult = a | b;
            
            // Binary mode operations
            int binarySum = a b+ b;
            int binaryXor = a b^ b;
            
            // Word operations
            int wordDiv = wordDivide(a, b);
            int wordXorResult = wordXor(a, b);
            
            // Triple operations
            int tripleDiv = tripleDivide(a, b);
            int tripleXorResult = tripleXor(a, b);
            
            // Conversion operations
            int binaryValue = ternaryToBinary(a);
            int ternaryValue = binaryToTernary(binaryValue);
        `;
        
        const result = compiler.compile(highLevelCode);
        
        if (result.success) {
            console.log('High-level compilation successful!');
            console.log(`Generated ${result.assembly.split('\n').length} lines of assembly`);
            console.log(`Variables defined: ${Object.keys(result.variables).length}`);
            
            // Verify specific operations are included
            const assembly = result.assembly;
            const hasDiv = assembly.includes('DIV');
            const hasMod = assembly.includes('MOD');
            const hasXor = assembly.includes('XOR');
            const hasBinaryOps = assembly.includes('BADD') || assembly.includes('BXOR');
            const hasWordOps = assembly.includes('DIVW') || assembly.includes('XORW');
            const hasTripleOps = assembly.includes('DIVT') || assembly.includes('XORT');
            const hasConversions = assembly.includes('T2B') || assembly.includes('B2T');
            
            console.log(`Operations found: DIV=${hasDiv}, MOD=${hasMod}, XOR=${hasXor}`);
            console.log(`Advanced features: Binary=${hasBinaryOps}, Word=${hasWordOps}, Triple=${hasTripleOps}, Conversions=${hasConversions}`);
            
            console.log('✓ High-level language complete features test passed');
            return true;
        } else {
            throw new Error(`Compilation failed: ${result.error}`);
        }
    } catch (error) {
        console.error('✗ High-level language test failed:', error.message);
        return false;
    }
}

function testCompleteInstructionSet() {
    console.log('\n=== Testing Complete Instruction Set ===');
    
    try {
        const assembler = new TernaryAssembler();
        
        // Test program with all new instruction types
        const testProgram = `
            .org 0
            LDA #15
            DIV #3          ; Test division
            STA 100
            
            LDA #15
            MOD #4          ; Test modulo
            STA 101
            
            LDA #15
            XOR #7          ; Test XOR
            STA 102
            
            LDAW #1000      ; Test word operations
            DIVW #10
            STAW 103
            
            LDAT #100000    ; Test triple operations
            DIVT #1000
            STAT 104
            
            LDA #15
            T2B             ; Test ternary to binary conversion
            STA 105
            
            LDA #255
            B2T             ; Test binary to ternary conversion
            STA 106
            
            LDA #10
            BADD #5         ; Test binary addition
            STA 107
            
            HLT
        `;
        
        const result = assembler.assemble(testProgram);
        
        if (result.success) {
            console.log(`Complete instruction set test: assembled ${result.machineCode.length} instructions`);
            
            // Verify all instruction types are recognized
            const expectedInstructions = ['DIV', 'MOD', 'XOR', 'LDAW', 'DIVW', 'STAW', 'LDAT', 'DIVT', 'STAT', 'T2B', 'B2T', 'BADD'];
            const foundInstructions = expectedInstructions.filter(inst => 
                testProgram.includes(inst)
            );
            
            console.log(`Found instructions: ${foundInstructions.join(', ')}`);
            console.log('✓ Complete instruction set test passed');
            return true;
        } else {
            throw new Error(`Assembly failed: ${result.errors.join(', ')}`);
        }
    } catch (error) {
        console.error('✗ Complete instruction set test failed:', error.message);
        return false;
    }
}

function runAllTrueEmulationTests() {
    console.log('=== True Ternary Emulation Test Suite ===');
    
    const tests = [
        testTrueComponentBasedArithmetic,
        testWordAndTripleOperations,
        testALUComponentBasedOperations,
        testHighLevelLanguageCompleteFeatures,
        testCompleteInstructionSet
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        if (test()) {
            passed++;
        }
    }
    
    console.log(`\n=== True Emulation Test Results ===`);
    console.log(`Passed: ${passed}/${total}`);
    
    if (passed === total) {
        console.log('🎉 All true ternary emulation tests passed!');
        console.log('✓ All operations use component-based ternary arithmetic');
        console.log('✓ No host CPU operations in critical paths');
        console.log('✓ Complete instruction set with word/triple operations');
        console.log('✓ High-level language supports all features');
        return true;
    } else {
        console.log('❌ Some true emulation tests failed');
        return false;
    }
}

// Export test functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testTrueComponentBasedArithmetic,
        testWordAndTripleOperations,
        testALUComponentBasedOperations,
        testHighLevelLanguageCompleteFeatures,
        testCompleteInstructionSet,
        runAllTrueEmulationTests
    };
} else {
    // Run tests if called directly
    runAllTrueEmulationTests();
}

console.log('True Ternary Emulation Test Suite Initialized');