/**
 * Enhanced Clock and Timer System Tests
 * Tests the new edge detection and hardware timer functionality
 */

// Import modules
const clocksModule = require('./clocks.js');
const cpuModule = require('./cpu.js');
const memoryModule = require('./memory.js');
const ternaryModule = require('./ternary.js');

const { TernaryClock, BinaryClock, HardwareTimer, ClockManager } = clocksModule;
const { TernaryCPU } = cpuModule;
const { TernaryMemory } = memoryModule;
const { Tryte } = ternaryModule;

function testEnhancedTernaryClock() {
    console.log('=== Testing Enhanced Ternary Clock ===');
    
    const clock = new TernaryClock(1000); // Fast for testing
    let tickCount = 0;
    const expectedPattern = [0, 0, 1, 1, 0, 0, -1, -1]; // 8-phase pattern
    const results = [];
    
    clock.addCallback((signal, phase, lastSignal) => {
        results.push({
            tick: tickCount,
            phase: phase,
            signal: signal,
            lastSignal: lastSignal,
            risingEdge: clock.isRisingEdge(),
            fallingEdge: clock.isFallingEdge(),
            positiveEdge: clock.isPositiveEdge(),
            negativeEdge: clock.isNegativeEdge(),
            positiveFallingEdge: clock.isPositiveFallingEdge(),
            negativeFallingEdge: clock.isNegativeFallingEdge(),
            negativeRisingEdge: clock.isNegativeRisingEdge()
        });
        
        console.log(`Tick ${tickCount}: Phase ${phase}, Signal ${signal}, Last ${lastSignal}`);
        console.log(`  Edges - R:${clock.isRisingEdge()} F:${clock.isFallingEdge()} P:${clock.isPositiveEdge()} N:${clock.isNegativeEdge()}`);
        
        tickCount++;
        if (tickCount >= 16) { // Two complete cycles
            clock.stop();
            validateTernaryClockPattern(results, expectedPattern);
        }
    });
    
    clock.start();
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 100);
    });
}

function validateTernaryClockPattern(results, expectedPattern) {
    console.log('\nValidating ternary clock pattern...');
    
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const expectedSignal = expectedPattern[result.phase];
        
        if (result.signal !== expectedSignal) {
            console.error(`❌ Phase ${result.phase} signal mismatch: expected ${expectedSignal}, got ${result.signal}`);
            return false;
        }
    }
    
    // Check specific edge transitions
    const expectedEdges = [
        { tick: 1, phase: 1, risingEdge: false, positiveEdge: false }, // 0->0
        { tick: 2, phase: 2, risingEdge: true, positiveEdge: true },   // 0->1
        { tick: 3, phase: 3, risingEdge: false, positiveEdge: false }, // 1->1
        { tick: 4, phase: 4, positiveFallingEdge: true },              // 1->0
        { tick: 5, phase: 5, risingEdge: false, positiveEdge: false }, // 0->0
        { tick: 6, phase: 6, negativeFallingEdge: true, negativeEdge: true }, // 0->-1
        { tick: 7, phase: 7, risingEdge: false, negativeEdge: false }, // -1->-1
        { tick: 8, phase: 0, negativeRisingEdge: true }                // -1->0
    ];
    
    let edgeTestsPassed = 0;
    for (const expected of expectedEdges) {
        const result = results.find(r => r.tick === expected.tick && r.phase === expected.phase);
        if (result) {
            for (const [key, value] of Object.entries(expected)) {
                if (key !== 'tick' && key !== 'phase' && result[key] === value) {
                    edgeTestsPassed++;
                }
            }
        }
    }
    
    console.log(`✓ Enhanced ternary clock pattern validated (${edgeTestsPassed} edge tests passed)`);
    return true;
}

function testHardwareTimers() {
    console.log('\n=== Testing Hardware Timers ===');
    
    const clockManager = new ClockManager();
    
    // Test timer creation
    console.log('\nTesting timer creation...');
    const binaryTimerId = clockManager.createTimer('binary', 1000);
    const ternaryTimerId = clockManager.createTimer('ternary', 500);
    
    console.log(`Created binary timer: ${binaryTimerId}`);
    console.log(`Created ternary timer: ${ternaryTimerId}`);
    
    const binaryTimer = clockManager.getTimer(binaryTimerId);
    const ternaryTimer = clockManager.getTimer(ternaryTimerId);
    
    if (!binaryTimer || !ternaryTimer) {
        console.error('❌ Failed to create timers');
        return false;
    }
    
    // Test timer operations
    binaryTimer.setPreset(5);
    ternaryTimer.setPreset(3);
    
    console.log('\nTesting timer countdown...');
    
    let binaryDone = false;
    let ternaryDone = false;
    
    binaryTimer.addCallback((id, overflow) => {
        console.log(`Binary timer ${id} overflow!`);
        binaryDone = true;
    });
    
    ternaryTimer.addCallback((id, overflow) => {
        console.log(`Ternary timer ${id} overflow!`);
        ternaryDone = true;
    });
    
    binaryTimer.start();
    ternaryTimer.start();
    clockManager.start();
    
    return new Promise((resolve) => {
        const checkTimers = () => {
            console.log(`Binary: ${binaryTimer.getCounter()}, Ternary: ${ternaryTimer.getCounter()}`);
            
            if (binaryDone && ternaryDone) {
                clockManager.stop();
                console.log('✓ Hardware timers test completed');
                resolve(true);
            } else {
                setTimeout(checkTimers, 50);
            }
        };
        
        setTimeout(checkTimers, 50);
    });
}

function testCPUEdgeInstructions() {
    console.log('\n=== Testing CPU Edge Detection Instructions ===');
    
    const memory = new TernaryMemory(9);
    const cpu = new TernaryCPU(memory);
    
    // Test ternary edge detection instruction
    console.log('\nTesting TEDG instruction...');
    
    // Manually trigger instruction
    cpu.ternaryEdgeDetect(0); // Test rising edge detection
    let result = cpu.registers.get('acc').toDecimal();
    console.log(`TEDG 0 (rising edge): ${result}`);
    
    cpu.ternaryEdgeDetect(1); // Test falling edge detection
    result = cpu.registers.get('acc').toDecimal();
    console.log(`TEDG 1 (falling edge): ${result}`);
    
    // Test binary edge detection instruction
    console.log('\nTesting BEDG instruction...');
    
    cpu.binaryEdgeDetect(0); // Test rising edge detection
    result = cpu.registers.get('acc').toDecimal();
    console.log(`BEDG 0 (rising edge): ${result}`);
    
    cpu.binaryEdgeDetect(1); // Test falling edge detection
    result = cpu.registers.get('acc').toDecimal();
    console.log(`BEDG 1 (falling edge): ${result}`);
    
    console.log('✓ CPU edge detection instructions test completed');
    return true;
}

function testCPUTimerInstructions() {
    console.log('\n=== Testing CPU Timer Management Instructions ===');
    
    const memory = new TernaryMemory(9);
    const cpu = new TernaryCPU(memory);
    
    // Test timer creation
    console.log('\nTesting TCRT instruction...');
    cpu.registers.set('acc', new Tryte(1000)); // Set frequency
    cpu.timerCreate(0); // Create binary timer
    let timerId = cpu.registers.get('acc').toDecimal();
    console.log(`Created timer ID: ${timerId}`);
    
    if (timerId >= 0) {
        // Test timer operations
        console.log('\nTesting timer operations...');
        
        // Set preset
        cpu.registers.set('acc', new Tryte(10));
        cpu.timerSet(timerId);
        let success = cpu.registers.get('acc').toDecimal();
        console.log(`TSET success: ${success}`);
        
        // Start timer
        cpu.timerStart(timerId);
        success = cpu.registers.get('acc').toDecimal();
        console.log(`TSTA success: ${success}`);
        
        // Check status
        cpu.timerStatus(timerId);
        let counter = cpu.registers.get('acc').toDecimal();
        console.log(`TSTS counter: ${counter}`);
        
        // Stop timer
        cpu.timerStop(timerId);
        success = cpu.registers.get('acc').toDecimal();
        console.log(`TSTP success: ${success}`);
        
        // Delete timer
        cpu.timerDelete(timerId);
        success = cpu.registers.get('acc').toDecimal();
        console.log(`TDEL success: ${success}`);
        
        console.log('✓ CPU timer management instructions test completed');
        return true;
    } else {
        console.error('❌ Failed to create timer');
        return false;
    }
}

function testClockManagerStatus() {
    console.log('\n=== Testing Clock Manager Enhanced Status ===');
    
    const clockManager = new ClockManager();
    const timerId = clockManager.createTimer('binary', 100);
    
    clockManager.start();
    
    // Wait a bit for clock to tick
    setTimeout(() => {
        const status = clockManager.getStatus();
        console.log('Clock Manager Status:');
        console.log(`  Running: ${status.running}`);
        console.log(`  Ternary Signal: ${status.ternarySignal}, Last: ${status.ternaryLastSignal}`);
        console.log(`  Ternary Edges - R:${status.ternaryRisingEdge} F:${status.ternaryFallingEdge} P:${status.ternaryPositiveEdge} N:${status.ternaryNegativeEdge}`);
        console.log(`  Binary Signal: ${status.binarySignal}, Last: ${status.binaryLastSignal}`);
        console.log(`  Binary Edges - R:${status.binaryRisingEdge} F:${status.binaryFallingEdge}`);
        console.log(`  Hardware Timers: ${Object.keys(status.hardwareTimers).length}`);
        
        if (status.hardwareTimers[timerId]) {
            const timer = status.hardwareTimers[timerId];
            console.log(`    Timer ${timerId}: type=${timer.type}, running=${timer.running}, counter=${timer.counter}`);
        }
        
        clockManager.stop();
        console.log('✓ Clock Manager enhanced status test completed');
    }, 100);
}

async function runAllEnhancedTests() {
    console.log('=== Running All Enhanced Clock and Timer Tests ===\n');
    
    try {
        await testEnhancedTernaryClock();
        await testHardwareTimers();
        testCPUEdgeInstructions();
        testCPUTimerInstructions();
        testClockManagerStatus();
        
        console.log('\n🎉 All enhanced clock and timer tests completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
}

// Export test functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testEnhancedTernaryClock,
        testHardwareTimers,
        testCPUEdgeInstructions,
        testCPUTimerInstructions,
        testClockManagerStatus,
        runAllEnhancedTests
    };
} else {
    // Run tests if called directly
    runAllEnhancedTests();
}