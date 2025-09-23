/**
 * Clock and Microcode System Tests
 * Tests the new timing and microcode functionality
 */

// Import modules
const clocksModule = require('./clocks.js');
const microcodeModule = require('./microcode.js');
const gatesModule = require('./gates.js');
const cpuModule = require('./cpu.js');
const memoryModule = require('./memory.js');
const ternaryModule = require('./ternary.js');

const { TernaryClock, BinaryClock, PulseCounter, ClockManager } = clocksModule;
const { MicrocodeEngine } = microcodeModule;
const { TernaryLatch, TernaryFlipFlop } = gatesModule;
const { TernaryCPU } = cpuModule;
const { TernaryMemory } = memoryModule;
const { Tryte } = ternaryModule;

function testClocks() {
    console.log('=== Testing Clock Systems ===');
    
    // Test ternary clock
    console.log('\nTesting Ternary Clock...');
    const ternaryClock = new TernaryClock(1000); // 1kHz for quick testing
    let phaseCount = 0;
    
    ternaryClock.addCallback((signal, phase) => {
        console.log(`Phase ${phase}: signal=${signal}`);
        phaseCount++;
        if (phaseCount >= 8) { // Two complete cycles
            ternaryClock.stop();
            console.log('Ternary clock test complete');
        }
    });
    
    ternaryClock.start();
    
    // Test binary clock
    setTimeout(() => {
        console.log('\nTesting Binary Clock...');
        const binaryClock = new BinaryClock(1000); // 1kHz for quick testing
        let tickCount = 0;
        
        binaryClock.addCallback((signal, lastSignal) => {
            console.log(`Tick ${tickCount}: ${lastSignal}->${signal}, Rising: ${binaryClock.isRisingEdge()}, Falling: ${binaryClock.isFallingEdge()}`);
            tickCount++;
            if (tickCount >= 8) {
                binaryClock.stop();
                console.log('Binary clock test complete');
            }
        });
        
        binaryClock.start();
    }, 100);
    
    // Test pulse counter
    setTimeout(() => {
        console.log('\nTesting Pulse Counter...');
        const counter = new PulseCounter(4, 'binary');
        
        counter.addCallback((count, overflow) => {
            console.log(`Counter overflow at count ${count}`);
        });
        
        // Simulate clock pulses
        for (let i = 0; i < 10; i++) {
            const overflow = counter.pulse(1);
            console.log(`Pulse ${i}: count=${counter.getCount()}, overflow=${overflow}`);
            counter.pulse(0); // Low phase
        }
        
        console.log('Pulse counter test complete');
    }, 200);
}

function testTernaryComponents() {
    console.log('\n=== Testing Ternary Components ===');
    
    // Test ternary latch
    console.log('\nTesting Ternary Latch...');
    const latch = new TernaryLatch();
    
    console.log(`Initial state: ${latch.getState()}`);
    
    // Test with different inputs and clock/enable combinations
    console.log(`Set 1, enable=true, clock=true: ${latch.process(1, true, true)}`);
    console.log(`Set -1, enable=true, clock=false: ${latch.process(-1, true, false)}`); // Should not change
    console.log(`Current state: ${latch.getState()}`);
    console.log(`Set -1, enable=true, clock=true: ${latch.process(-1, true, true)}`);
    console.log(`Current state: ${latch.getState()}`);
    
    // Test ternary flip-flop
    console.log('\nTesting Ternary Flip-Flop...');
    const flipFlop = new TernaryFlipFlop();
    
    console.log(`Initial state: ${flipFlop.getState()}`);
    
    // Test edge triggering
    console.log(`Set 1, clock=0->1: ${flipFlop.process(1, 1)}`); // Should trigger
    console.log(`Set -1, clock=1: ${flipFlop.process(-1, 1)}`);   // Should not trigger
    console.log(`Set -1, clock=1->0: ${flipFlop.process(-1, 0)}`); // Should not trigger
    console.log(`Set -1, clock=0->-1: ${flipFlop.process(-1, -1)}`); // Should trigger
    console.log(`Final state: ${flipFlop.getState()}`);
}

function testMicrocodeExecution() {
    console.log('\n=== Testing Microcode Execution ===');
    
    // Create a simple CPU with memory
    const memory = new TernaryMemory(9);
    const cpu = new TernaryCPU(memory);
    
    // Load a simple program: LDA #5, ADD #3, OUT, HLT
    const program = [
        new Tryte([1, 0, 0, 1, -1, 1]),  // LDA #5 (opcode 1, operand 5)
        new Tryte([0, 1, 1, 0, 1, 1]),   // ADD #3 (opcode 10, operand 3)
        new Tryte([1, 1, 0, 1, 0, 0]),   // OUT (opcode 51)
        new Tryte([-1, -1, -1, 0, 0, 0]) // HLT (opcode -13)
    ];
    
    // Load program into memory
    for (let i = 0; i < program.length; i++) {
        memory.write(new Tryte(i), program[i]);
    }
    
    console.log('Program loaded. Starting microcode execution...');
    
    // Enable microcode mode
    cpu.setMicrocodeEnabled(true);
    
    // Monitor execution
    let stepCount = 0;
    const maxSteps = 50; // Prevent infinite loops
    
    const monitorExecution = () => {
        const state = cpu.getState();
        console.log(`Step ${stepCount}: PC=${state.registers.pc}, ACC=${state.registers.acc}, Halted=${state.execution.halted}`);
        
        if (state.microcodeStatus) {
            console.log(`  Microcode: ${state.microcodeStatus.state}, PC=${state.microcodeStatus.microcodePC}, Cycle=${state.microcodeStatus.cycleCount}`);
        }
        
        stepCount++;
        
        if (!state.execution.halted && stepCount < maxSteps) {
            setTimeout(monitorExecution, 50); // Check every 50ms
        } else {
            console.log('Microcode execution test complete');
            cpu.pause();
            
            // Test timer instructions
            testTimerInstructions();
        }
    };
    
    // Start execution
    cpu.run();
    setTimeout(monitorExecution, 100);
}

function testTimerInstructions() {
    console.log('\n=== Testing Timer Instructions ===');
    
    const memory = new TernaryMemory(9);
    const cpu = new TernaryCPU(memory);
    
    // Test program: CLKR, CLKS #10, WAIT, OUT, HLT
    const program = [
        new Tryte([0, 0, -1, 1, 1, 1]),  // CLKR (opcode 60)
        new Tryte([1, 0, -1, 0, 1, 1]),  // CLKS #10 (opcode 61, operand 10)
        new Tryte([-1, 0, -1, 0, 0, 0]), // WAIT (opcode 62)
        new Tryte([1, 1, 0, 1, 0, 0]),   // OUT (opcode 51)
        new Tryte([-1, -1, -1, 0, 0, 0]) // HLT (opcode -13)
    ];
    
    // Load program into memory
    for (let i = 0; i < program.length; i++) {
        memory.write(new Tryte(i), program[i]);
    }
    
    console.log('Timer test program loaded...');
    
    // Use legacy mode for simpler testing of timer instructions
    cpu.setMicrocodeEnabled(false);
    
    let stepCount = 0;
    const monitorTimer = () => {
        if (!cpu.halted && stepCount < 20) {
            const success = cpu.step();
            const state = cpu.getState();
            console.log(`Timer Step ${stepCount}: PC=${state.registers.pc}, ACC=${state.registers.acc}, Success=${success}`);
            stepCount++;
            setTimeout(monitorTimer, 100);
        } else {
            console.log('Timer instruction test complete');
            runAllTests();
        }
    };
    
    setTimeout(monitorTimer, 100);
}

function runAllTests() {
    console.log('\n=== Running All Tests ===');
    
    // Test basic functionality first
    testClocks();
    
    // Test components after a delay
    setTimeout(testTernaryComponents, 1000);
    
    // Test microcode execution after components
    setTimeout(testMicrocodeExecution, 2000);
}

// Export test functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testClocks,
        testTernaryComponents,
        testMicrocodeExecution,
        testTimerInstructions,
        runAllTests
    };
} else {
    // Run tests if called directly
    runAllTests();
}

console.log('Clock and Microcode Tests Initialized');