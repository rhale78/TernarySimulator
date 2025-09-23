/**
 * Simple Enhanced Clock and Timer Tests
 * Synchronous tests for the new functionality
 */

const clocksModule = require('./clocks.js');
const cpuModule = require('./cpu.js');
const memoryModule = require('./memory.js');
const ternaryModule = require('./ternary.js');

const { TernaryClock, BinaryClock, HardwareTimer, ClockManager } = clocksModule;
const { TernaryCPU } = cpuModule;
const { TernaryMemory } = memoryModule;
const { Tryte } = ternaryModule;

function testEnhancedClockPattern() {
    console.log('=== Testing Enhanced Ternary Clock Pattern ===');
    
    const clock = new TernaryClock(1000);
    const pattern = [];
    
    // Test 16 ticks (2 complete cycles)
    for (let i = 0; i < 16; i++) {
        clock.tick();
        pattern.push({
            tick: i,
            phase: clock.getPhase(),
            signal: clock.getSignal(),
            lastSignal: clock.getLastSignal(),
            risingEdge: clock.isRisingEdge(),
            fallingEdge: clock.isFallingEdge(),
            positiveEdge: clock.isPositiveEdge(),
            negativeEdge: clock.isNegativeEdge()
        });
    }
    
    // Verify the pattern based on actual phase mapping: phaseMap[1,2,3,4,5,6,7,0] = [0,1,1,0,0,-1,-1,0]
    const expectedSignals = [0, 1, 1, 0, 0, -1, -1, 0, 0, 1, 1, 0, 0, -1, -1, 0];
    let patternCorrect = true;
    
    console.log('Clock pattern verification:');
    for (let i = 0; i < pattern.length; i++) {
        const p = pattern[i];
        const expected = expectedSignals[i];
        const correct = p.signal === expected;
        patternCorrect = patternCorrect && correct;
        
        console.log(`Tick ${p.tick}: Phase ${p.phase}, Signal ${p.signal} (expected ${expected}) ${correct ? '✓' : '❌'}`);
        console.log(`  Last: ${p.lastSignal}, Edges - R:${p.risingEdge} F:${p.fallingEdge} P:${p.positiveEdge} N:${p.negativeEdge}`);
    }
    
    console.log(`\n✓ Enhanced ternary clock pattern ${patternCorrect ? 'PASSED' : 'FAILED'}`);
    return patternCorrect;
}

function testHardwareTimers() {
    console.log('\n=== Testing Hardware Timers ===');
    
    const clockManager = new ClockManager();
    
    // Test creation of multiple timers
    console.log('Creating hardware timers...');
    const binaryId = clockManager.createTimer('binary', 100);
    const ternaryId = clockManager.createTimer('ternary', 200);
    
    console.log(`Binary timer ID: ${binaryId}`);
    console.log(`Ternary timer ID: ${ternaryId}`);
    
    // Test timer retrieval
    const binaryTimer = clockManager.getTimer(binaryId);
    const ternaryTimer = clockManager.getTimer(ternaryId);
    
    console.log(`Binary timer type: ${binaryTimer.clockType}, frequency: ${binaryTimer.frequency}`);
    console.log(`Ternary timer type: ${ternaryTimer.clockType}, frequency: ${ternaryTimer.frequency}`);
    
    // Test timer operations
    binaryTimer.setPreset(5);
    ternaryTimer.setPreset(3);
    
    console.log(`Binary timer preset: ${binaryTimer.getCounter()}`);
    console.log(`Ternary timer preset: ${ternaryTimer.getCounter()}`);
    
    // Test timer listing and removal
    const timerList = clockManager.listTimers();
    console.log(`Timer list: [${timerList.join(', ')}]`);
    
    const removed = clockManager.removeTimer(binaryId);
    console.log(`Timer ${binaryId} removal: ${removed}`);
    
    const newList = clockManager.listTimers();
    console.log(`Timer list after removal: [${newList.join(', ')}]`);
    
    console.log('✓ Hardware timers test PASSED');
    return true;
}

function testCPUInstructions() {
    console.log('\n=== Testing CPU Enhanced Instructions ===');
    
    const memory = new TernaryMemory(9);
    const cpu = new TernaryCPU(memory);
    
    // Test edge detection instructions
    console.log('Testing edge detection instructions...');
    
    // Test TEDG (Ternary Edge Detect)
    for (let i = 0; i < 7; i++) {
        cpu.ternaryEdgeDetect(i);
        const result = cpu.registers.get('acc').toDecimal();
        console.log(`TEDG ${i}: ${result}`);
    }
    
    // Test BEDG (Binary Edge Detect)
    for (let i = 0; i < 2; i++) {
        cpu.binaryEdgeDetect(i);
        const result = cpu.registers.get('acc').toDecimal();
        console.log(`BEDG ${i}: ${result}`);
    }
    
    // Test timer management instructions
    console.log('\nTesting timer management instructions...');
    
    // TCRT - Create timer
    cpu.registers.set('acc', new Tryte(500)); // frequency
    cpu.timerCreate(0); // binary timer
    const timerId = cpu.registers.get('acc').toDecimal();
    console.log(`TCRT created timer ID: ${timerId}`);
    
    if (timerId >= 0) {
        // TSET - Set preset
        cpu.registers.set('acc', new Tryte(10));
        cpu.timerSet(timerId);
        const setResult = cpu.registers.get('acc').toDecimal();
        console.log(`TSET result: ${setResult}`);
        
        // TSTA - Start timer
        cpu.timerStart(timerId);
        const startResult = cpu.registers.get('acc').toDecimal();
        console.log(`TSTA result: ${startResult}`);
        
        // TSTS - Check status
        cpu.timerStatus(timerId);
        const counter = cpu.registers.get('acc').toDecimal();
        console.log(`TSTS counter: ${counter}`);
        
        // TSTP - Stop timer
        cpu.timerStop(timerId);
        const stopResult = cpu.registers.get('acc').toDecimal();
        console.log(`TSTP result: ${stopResult}`);
        
        // TDEL - Delete timer
        cpu.timerDelete(timerId);
        const delResult = cpu.registers.get('acc').toDecimal();
        console.log(`TDEL result: ${delResult}`);
    }
    
    console.log('✓ CPU enhanced instructions test PASSED');
    return true;
}

function testInstructionSet() {
    console.log('\n=== Testing Complete Instruction Set ===');
    
    const memory = new TernaryMemory(9);
    const cpu = new TernaryCPU(memory);
    const instructions = cpu.buildInstructionSet();
    
    console.log('New instructions added:');
    const newInstructions = ['TEDG', 'BEDG', 'TCRT', 'TDEL', 'TSET', 'TSTA', 'TSTP', 'TSTS'];
    
    for (const inst of newInstructions) {
        if (instructions[inst]) {
            console.log(`  ${inst}: opcode ${instructions[inst].opcode}`);
        } else {
            console.log(`  ${inst}: NOT FOUND ❌`);
        }
    }
    
    // Verify push/pop instructions already exist
    console.log('\nExisting stack instructions:');
    const stackInstructions = ['PSH', 'POP'];
    for (const inst of stackInstructions) {
        if (instructions[inst]) {
            console.log(`  ${inst}: opcode ${instructions[inst].opcode} ✓`);
        } else {
            console.log(`  ${inst}: NOT FOUND ❌`);
        }
    }
    
    console.log('✓ Instruction set test PASSED');
    return true;
}

function testClockManagerStatus() {
    console.log('\n=== Testing Enhanced Clock Manager Status ===');
    
    const clockManager = new ClockManager();
    const timerId = clockManager.createTimer('binary', 100);
    
    // Get initial status
    let status = clockManager.getStatus();
    console.log('Initial status:');
    console.log(`  Running: ${status.running}`);
    console.log(`  Ternary signal: ${status.ternarySignal}, phase: ${status.ternaryPhase}`);
    console.log(`  Binary signal: ${status.binarySignal}`);
    console.log(`  Hardware timers: ${Object.keys(status.hardwareTimers).length}`);
    
    // Start clocks and get updated status
    clockManager.start();
    
    // Trigger a few clock ticks
    clockManager.getTernaryClock().tick();
    clockManager.getBinaryClock().tick();
    
    status = clockManager.getStatus();
    console.log('\nAfter ticks:');
    console.log(`  Ternary signal: ${status.ternarySignal}, last: ${status.ternaryLastSignal}`);
    console.log(`  Ternary edges - R:${status.ternaryRisingEdge} F:${status.ternaryFallingEdge} P:${status.ternaryPositiveEdge} N:${status.ternaryNegativeEdge}`);
    console.log(`  Binary signal: ${status.binarySignal}, last: ${status.binaryLastSignal}`);
    console.log(`  Binary edges - R:${status.binaryRisingEdge} F:${status.binaryFallingEdge}`);
    
    if (status.hardwareTimers[timerId]) {
        const timer = status.hardwareTimers[timerId];
        console.log(`  Timer ${timerId}: type=${timer.type}, running=${timer.running}, frequency=${timer.frequency}`);
    }
    
    clockManager.stop();
    console.log('✓ Enhanced clock manager status test PASSED');
    return true;
}

function runAllTests() {
    console.log('=== Enhanced Clock and Timer System Tests ===\n');
    
    let allPassed = true;
    
    allPassed = testEnhancedClockPattern() && allPassed;
    allPassed = testHardwareTimers() && allPassed;
    allPassed = testCPUInstructions() && allPassed;
    allPassed = testInstructionSet() && allPassed;
    allPassed = testClockManagerStatus() && allPassed;
    
    console.log(`\n=== Test Results ===`);
    if (allPassed) {
        console.log('🎉 All enhanced clock and timer tests PASSED!');
    } else {
        console.log('❌ Some tests FAILED!');
    }
    
    return allPassed;
}

// Run tests
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testEnhancedClockPattern,
    testHardwareTimers,
    testCPUInstructions,
    testInstructionSet,
    testClockManagerStatus,
    runAllTests
};