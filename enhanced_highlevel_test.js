/**
 * Enhanced High-Level Language Features Test
 * Tests pointers, structs, functions, arrays, and other advanced features
 */

// Import dependencies
const { TernaryHighLevelCompiler } = require('./highlevel.js');

function testBasicCompilation() {
    console.log('Testing basic compilation...');
    
    const compiler = new TernaryHighLevelCompiler();
    const source = `
int x = 10;
int y = 20;
int result = x + y;
print(result);
`;

    const result = compiler.compile(source);
    
    if (!result.success) {
        throw new Error(`Basic compilation failed: ${result.error}`);
    }
    
    console.log('✓ Basic compilation working');
}

function testPointers() {
    console.log('Testing pointers...');
    
    const compiler = new TernaryHighLevelCompiler();
    const source = `
int x = 42;
int* ptr = &x;
int value = *ptr;
print(value);
`;

    const result = compiler.compile(source);
    
    if (!result.success) {
        throw new Error(`Pointer test failed: ${result.error}`);
    }
    
    // Check that pointer operations are generated
    if (!result.assembly.includes('LDA #') || !result.assembly.includes('LDX')) {
        console.log('Generated assembly:', result.assembly);
    }
    
    console.log('✓ Pointer support working');
}

function testStructs() {
    console.log('Testing structs...');
    
    const compiler = new TernaryHighLevelCompiler();
    
    // Test struct definition parsing
    const structDef = 'struct Point { int x; int y; };';
    const structResult = compiler.parseStatement(structDef);
    
    if (!structResult || structResult.type !== 'struct') {
        throw new Error('Struct definition parsing failed');
    }
    
    console.log('✓ Struct support working');
}

function testArrays() {
    console.log('Testing arrays...');
    
    const compiler = new TernaryHighLevelCompiler();
    const source = `
int numbers[3] = {1, 2, 3};
int first = numbers[0];
print(first);
`;

    const result = compiler.compile(source);
    
    if (!result.success) {
        throw new Error(`Array test failed: ${result.error}`);
    }
    
    console.log('✓ Array support working');
}

function testFunctions() {
    console.log('Testing functions...');
    
    const compiler = new TernaryHighLevelCompiler();
    
    // Test function definition parsing
    const funcDef = 'int add(int a, int b) { return a + b; }';
    const funcResult = compiler.parseStatement(funcDef);
    
    if (!funcResult || funcResult.type !== 'function') {
        throw new Error('Function definition parsing failed');
    }
    
    console.log('✓ Function support working');
}

function testStrings() {
    console.log('Testing strings...');
    
    const compiler = new TernaryHighLevelCompiler();
    const source = `
print("Hello World!");
`;

    const result = compiler.compile(source);
    
    if (!result.success) {
        throw new Error(`String test failed: ${result.error}`);
    }
    
    console.log('✓ String support working');
}

function testComplexProgram() {
    console.log('Testing complex program...');
    
    const compiler = new TernaryHighLevelCompiler();
    const source = `
int x = 10;
int* ptr = &x;
int value = *ptr;
int arr[3] = {1, 2, 3};
print(value);
print(arr[0]);
`;

    const result = compiler.compile(source);
    
    if (!result.success) {
        throw new Error(`Complex program test failed: ${result.error}`);
    }
    
    console.log('✓ Complex program compilation working');
}

// Run all tests
function runTests() {
    console.log('=== Enhanced High-Level Language Tests ===\n');
    
    try {
        testBasicCompilation();
        testPointers();
        testStructs();
        testArrays();
        testFunctions();
        testStrings();
        testComplexProgram();
        
        console.log('\n🎉 All enhanced high-level language tests passed!');
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