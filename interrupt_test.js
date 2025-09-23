/**
 * Enhanced Interrupt System Test
 * Tests the improved interrupt handling with priorities, nesting, and masking
 */

// Import required modules
const ternaryModule = require('./ternary.js');
const { BalancedTernary, Tryte, TernaryAddress } = ternaryModule;

const memoryModule = require('./memory.js');
const { TernaryMemory } = memoryModule;

const cpuModule = require('./cpu.js');
const { TernaryCPU } = cpuModule;

const assemblerModule = require('./assembler.js');
const { TernaryAssembler } = assemblerModule;

function testEnhancedInterruptSystem() {
    console.log('=== Enhanced Interrupt System Test ===');
    
    try {
        // Create memory and CPU
        const memory = new TernaryMemory();
        const cpu = new TernaryCPU(memory);
        const assembler = new TernaryAssembler();
        
        console.log('Testing interrupt priorities...');
        
        // Test interrupt priorities
        const ic = cpu.interruptController;
        
        // Request multiple interrupts
        ic.requestInterrupt(10); // Hardware timer 0 (priority 10)
        ic.requestInterrupt(16); // Console input (priority 20)
        ic.requestInterrupt(26); // System clock tick (priority 30)
        ic.requestInterrupt(2);  // Division by zero (priority 2)
        
        console.log(`Pending interrupts: ${Array.from(ic.pendingInterrupts)}`);
        
        // Get highest priority interrupt
        const highestPriority = ic.getHighestPriorityInterrupt();
        console.log(`Highest priority interrupt: ${highestPriority} (should be 2 - division by zero)`);
        
        if (highestPriority !== 2) {
            console.log('✗ Priority handling failed');
            return;
        }
        
        console.log('Testing interrupt masking...');
        
        // Test masking
        ic.maskInterrupt(2); // Mask division by zero
        const nextHighest = ic.getHighestPriorityInterrupt();
        console.log(`Next highest after masking 2: ${nextHighest} (should be 10 - hardware timer)`);
        
        // Test mask level
        ic.setMaskLevel(15); // Mask all interrupts with priority >= 15
        const afterMaskLevel = ic.getHighestPriorityInterrupt();
        console.log(`After setting mask level 15: ${afterMaskLevel} (should be 10)`);
        
        // Clear masks
        ic.unmaskInterrupt(2);
        ic.setMaskLevel(0);
        
        console.log('Testing interrupt nesting...');
        
        // Test nesting capabilities
        console.log(`Max nesting level: ${ic.maxNestingLevel}`);
        console.log(`Current nesting level: ${ic.currentNestingLevel}`);
        
        // Simulate entering interrupt handler
        ic.handleInterrupt(2); // Handle division by zero
        console.log(`After handling interrupt 2: nesting level = ${ic.currentNestingLevel}`);
        
        // Request another high-priority interrupt while in handler
        ic.requestInterrupt(1); // NMI
        const canNest = ic.getHighestPriorityInterrupt();
        console.log(`Can nest interrupt 1 (NMI): ${canNest}`);
        
        // Test interrupt statistics
        console.log('Testing interrupt statistics...');
        const stats = ic.getInterruptStats();
        console.log(`Total pending: ${stats.totalPending}`);
        console.log(`Total masked: ${stats.totalMasked}`);
        console.log(`Handler active: ${stats.handlerActive}`);
        console.log(`Nesting level: ${stats.nestingLevel}`);
        
        // Reset for next tests
        ic.reset();
        
        console.log('Testing CPU interrupt instructions...');
        
        // Test CLI (Clear Interrupt Flag)
        cpu.clearInterruptFlag(0);
        console.log(`After CLI: interrupts enabled = ${ic.interruptEnabled}`);
        
        // Test SEI (Set Interrupt Flag) 
        cpu.setInterruptFlag(0);
        console.log(`After SEI: interrupts enabled = ${ic.interruptEnabled}`);
        
        // Test SWI (Software Interrupt)
        cpu.softwareInterrupt(1);
        console.log(`After SWI 1: pending interrupts = ${Array.from(ic.pendingInterrupts)}`);
        
        // Test MSK (Mask Interrupt)
        cpu.maskInterrupt(27);
        console.log(`After MSK 27: masked interrupts = ${Array.from(ic.maskedInterrupts)}`);
        
        // Test UMK (Unmask Interrupt)
        cpu.unmaskInterrupt(27);
        console.log(`After UMK 27: masked interrupts = ${Array.from(ic.maskedInterrupts)}`);
        
        // Test SML (Set Mask Level)
        cpu.setMaskLevel(20);
        console.log(`After SML 20: mask level = ${ic.maskLevel}`);
        
        console.log('Testing interrupt program assembly...');
        
        // Test a program with interrupt instructions
        const interruptProgram = `
            .org 0
            CLI             ; Disable interrupts
            LDA #42         ; Load a value
            SEI             ; Enable interrupts  
            SWI #0          ; Trigger software interrupt
            MSK #10         ; Mask timer interrupt
            SML #15         ; Set mask level
            HLT             ; Halt
        `;
        
        try {
            const result = assembler.assemble(interruptProgram);
            if (result.success) {
                console.log(`✓ Interrupt program assembled successfully! ${result.machineCode.length} instructions`);
                
                // Load program into memory
                result.machineCode.forEach(({ address, instruction }) => {
                    memory.write(new TernaryAddress(address, 9), instruction);
                });
                
                // Reset CPU and execute
                cpu.reset();
                let steps = 0;
                while (!cpu.halted && steps < 20) {
                    if (!cpu.step()) {
                        break;
                    }
                    steps++;
                }
                
                console.log(`Program executed in ${steps} steps`);
                console.log(`Final ACC: ${cpu.registers.get('acc').toDecimal()}`);
                console.log(`Final interrupt state: enabled=${cpu.interruptController.interruptEnabled}, mask level=${cpu.interruptController.maskLevel}`);
                
            } else {
                console.log(`✗ Assembly failed: ${result.errors.join(', ')}`);
            }
        } catch (error) {
            console.log(`Assembly error: ${error.message}`);
        }
        
        console.log('Testing interrupt vector table...');
        
        // Test interrupt vector table
        const ivt = cpu.interruptVectorTable;
        
        // Set custom interrupt handler
        ivt.setVector(5, 0x200); // Stack underflow handler at 0x200 (smaller address)
        const handler = ivt.getVector(5);
        console.log(`Set handler for interrupt 5 at: ${handler.toString()}`);
        
        if (handler.toDecimal() !== 0x200) {
            console.log('✗ Interrupt vector table failed');
            return;
        }
        
        console.log('Testing complete interrupt handling cycle...');
        
        // Test complete interrupt cycle
        cpu.reset();
        
        // Set up a simple interrupt handler
        const handlerAddr = new TernaryAddress(0x1000, 9);
        ivt.setVector(10, handlerAddr.toDecimal());
        
        // Write a simple interrupt handler (just RTI)
        const rti = new Tryte();
        rti.trits = [1, 1, 0, 1, 1, 0]; // RTI instruction encoding (opcode 38)
        memory.write(handlerAddr, rti);
        
        // Set up main program
        const mainAddr = new TernaryAddress(0, 9);
        const nop = new Tryte(0); // NOP instruction
        memory.write(mainAddr, nop);
        memory.write(mainAddr.increment(), nop);
        
        // Enable interrupts and request one
        cpu.setInterruptFlag(0);
        cpu.interruptController.requestInterrupt(10);
        
        // Execute a few steps to see interrupt handling
        console.log('Before interrupt handling:');
        console.log(`  PC: ${cpu.registers.get('pc').toString()}`);
        console.log(`  Pending: ${Array.from(cpu.interruptController.pendingInterrupts)}`);
        
        cpu.step(); // This should trigger the interrupt
        
        console.log('After interrupt triggered:');
        console.log(`  PC: ${cpu.registers.get('pc').toString()}`);
        console.log(`  In handler: ${cpu.interruptController.inInterruptHandler}`);
        console.log(`  Nesting level: ${cpu.interruptController.currentNestingLevel}`);
        
        cpu.step(); // Execute RTI
        
        console.log('After RTI:');
        console.log(`  PC: ${cpu.registers.get('pc').toString()}`);
        console.log(`  In handler: ${cpu.interruptController.inInterruptHandler}`);
        console.log(`  Nesting level: ${cpu.interruptController.currentNestingLevel}`);
        
        // Check final state
        const finalState = cpu.interruptController.getState();
        console.log('Final interrupt controller state:');
        console.log(`  Pending: ${finalState.pendingInterrupts}`);
        console.log(`  Enabled: ${finalState.interruptEnabled}`);
        console.log(`  Stats: ${JSON.stringify(finalState.stats)}`);
        
        console.log('✓ Enhanced interrupt system test completed successfully');
        
    } catch (error) {
        console.error(`Enhanced interrupt test failed: ${error.message}`);
        console.error(error.stack);
    }
}

// Run the test
testEnhancedInterruptSystem();