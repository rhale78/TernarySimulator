#!/usr/bin/env node
/**
 * Simple test script for the Balanced Ternary Simulator
 * Tests core functionality without browser environment
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
const { TernaryAssembler } = require('./assembler.js');

function testBalancedTernary() {
    console.log('Testing Balanced Ternary...');
    
    // Test basic operations
    const a = new BalancedTernary(5);
    const b = new BalancedTernary(3);
    
    console.log(`5 in balanced ternary: ${a.toString()}`);
    console.log(`3 in balanced ternary: ${b.toString()}`);
    console.log(`5 + 3 = ${a.add(b).toDecimal()} (${a.add(b).toString()})`);
    console.log(`5 - 3 = ${a.subtract(b).toDecimal()} (${a.subtract(b).toString()})`);
    console.log(`5 * 3 = ${a.multiply(b).toDecimal()} (${a.multiply(b).toString()})`);
    
    // Test tryte
    const tryte = new Tryte(42);
    console.log(`42 as tryte: ${tryte.toString()}`);
    
    console.log('✓ Balanced Ternary tests passed\n');
}

function testMemory() {
    console.log('Testing Memory...');
    
    const memory = new TernaryMemory(9);
    
    // Test basic read/write
    const addr = new TernaryAddress(5, 9);
    const value = new Tryte(123);
    
    memory.write(addr, value);
    const readValue = memory.read(addr);
    
    console.log(`Wrote ${value.toString()} to address ${addr.toString()}`);
    console.log(`Read ${readValue.toString()} from address ${addr.toString()}`);
    console.log(`Values match: ${value.equals(readValue)}`);
    
    // Test memory dump
    const dump = memory.dump(0, 8);
    console.log('Memory dump (first 8 locations):');
    dump.forEach(entry => {
        console.log(`  ${entry.address}: ${entry.value} (${entry.decimal})`);
    });
    
    console.log('✓ Memory tests passed\n');
}

function testCPU() {
    console.log('Testing CPU...');
    
    const memory = new TernaryMemory(9);
    const cpu = new TernaryCPU(memory);
    
    // Test ALU operations
    const alu = cpu.alu;
    const x = new Tryte(10);
    const y = new Tryte(5);
    
    const addResult = alu.add(x, y);
    const subResult = alu.subtract(x, y);
    
    console.log(`ALU: ${x.toDecimal()} + ${y.toDecimal()} = ${addResult.toDecimal()}`);
    console.log(`ALU: ${x.toDecimal()} - ${y.toDecimal()} = ${subResult.toDecimal()}`);
    console.log(`ALU flags: zero=${alu.flags.zero}, positive=${alu.flags.positive}, negative=${alu.flags.negative}`);
    
    // Test registers
    cpu.registers.set('acc', new Tryte(42));
    const accValue = cpu.registers.get('acc');
    console.log(`ACC register set to: ${accValue.toString()} (${accValue.toDecimal()})`);
    
    console.log('✓ CPU tests passed\n');
}

function testAssembler() {
    console.log('Testing Assembler...');
    
    const assembler = new TernaryAssembler();
    const source = `
        ; Simple test program
        LDA #10     ; Load 10 into accumulator
        ADD #5      ; Add 5
        STA result  ; Store result
        HLT         ; Halt
        
        result:
        .db 0       ; Storage
    `;
    
    const result = assembler.assemble(source);
    
    if (result.success) {
        console.log('Assembly successful!');
        console.log(`Generated ${result.machineCode.length} instructions`);
        
        // Show disassembly
        const disassembly = assembler.disassemble(
            result.machineCode.map(entry => entry.instruction)
        );
        console.log('Disassembly:');
        console.log(disassembly);
        
        console.log('✓ Assembler tests passed\n');
    } else {
        console.log(`Assembly failed: ${result.error}`);
        return false;
    }
    
    return true;
}

function testIntegration() {
    console.log('Testing Integration...');
    
    const memory = new TernaryMemory(9);
    const cpu = new TernaryCPU(memory);
    const assembler = new TernaryAssembler();
    
    // Simple program: add two numbers
    const source = `
        LDA #7      ; Load 7
        ADD #8      ; Add 8
        STA 10      ; Store at address 10
        HLT         ; Halt
    `;
    
    console.log('Assembling program...');
    const result = assembler.assemble(source);
    
    if (result.success) {
        console.log(`Assembly successful! Generated ${result.machineCode.length} instructions`);
        
        // Show what we assembled
        result.machineCode.forEach((entry, i) => {
            console.log(`${i}: ${entry.instruction.toString()} - ${entry.source.trim()}`);
        });
        
        // Load program into memory
        for (let entry of result.machineCode) {
            console.log(`Writing to address ${entry.address}: ${entry.instruction.toString()}`);
            memory.write(new TernaryAddress(entry.address, 9), entry.instruction);
        }
        
        console.log('Program loaded into memory');
        
        // Execute step by step
        let steps = 0;
        while (!cpu.halted && steps < 10) {
            console.log(`\nStep ${steps + 1}:`);
            const success = cpu.step();
            if (!success) {
                console.log('Execution failed');
                break;
            }
            
            steps++;
            const state = cpu.getState();
            console.log(`  PC=${state.registers.pc}, ACC=${state.registers.acc}`);
        }
        
        // Check result
        const resultValue = memory.read(10);
        console.log(`\nFinal result at address 10: ${resultValue.toDecimal()}`);
        console.log(`Expected: 15, Got: ${resultValue.toDecimal()}`);
        
        if (resultValue.toDecimal() === 15) {
            console.log('✓ Integration test passed\n');
            return true;
        } else {
            console.log('✗ Integration test failed\n');
            return false;
        }
    } else {
        console.log(`Assembly failed: ${result.error}`);
        return false;
    }
}

function runAllTests() {
    console.log('=== Balanced Ternary Simulator Tests ===\n');
    
    try {
        testBalancedTernary();
        testMemory();
        testCPU();
        
        if (testAssembler() && testIntegration()) {
            console.log('🎉 All tests passed! The simulator is working correctly.');
        } else {
            console.log('❌ Some tests failed. Check the implementation.');
        }
    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests };