/**
 * Memory Management Unit Test
 * Tests virtual memory, paging, and memory protection
 */

// Import required modules
const ternaryModule = require('./ternary.js');
const { BalancedTernary, Tryte, TernaryAddress } = ternaryModule;

const memoryModule = require('./memory.js');
const { TernaryMemory } = memoryModule;

const cpuModule = require('./cpu.js');
const { TernaryCPU } = cpuModule;

const mmuModule = require('./mmu.js');
const { MemoryManagementUnit, ProtectionModes } = mmuModule;

const assemblerModule = require('./assembler.js');
const { TernaryAssembler } = assemblerModule;

function testMemoryManagementUnit() {
    console.log('=== Memory Management Unit Test ===');
    
    try {
        // Create memory and CPU
        const memory = new TernaryMemory();
        const cpu = new TernaryCPU(memory);
        const assembler = new TernaryAssembler();
        
        console.log('Testing basic MMU functionality...');
        
        const mmu = cpu.mmu;
        
        // Test default configuration
        console.log(`Page size: ${mmu.pageSize}`);
        console.log(`Total pages: ${mmu.totalPages}`);
        console.log(`Virtual address space: ${mmu.virtualAddressSpace}`);
        console.log(`Initial protection level: ${mmu.currentProtectionLevel}`);
        
        // Test segment information
        console.log('\nTesting memory segments...');
        const segments = mmu.getSegmentInfo();
        segments.forEach(seg => {
            console.log(`  ${seg.name}: 0x${seg.baseAddress.toString(16)} - 0x${(seg.baseAddress + seg.size).toString(16)} (${seg.permissions}) [${seg.protectionLevel}]`);
        });
        
        console.log('\nTesting protection modes...');
        
        // Test kernel mode access
        mmu.setProtectionLevel(ProtectionModes.KERNEL);
        console.log(`Set protection level to KERNEL: ${mmu.currentProtectionLevel}`);
        
        // Should be able to access kernel segment
        const canAccessKernel = mmu.checkProtection(0x500, 'write');
        console.log(`Kernel can write to kernel segment: ${canAccessKernel}`);
        
        // Test user mode access
        mmu.setProtectionLevel(ProtectionModes.USER);
        console.log(`Set protection level to USER: ${mmu.currentProtectionLevel}`);
        
        // Should NOT be able to access kernel segment
        const userCanAccessKernel = mmu.checkProtection(0x500, 'write');
        console.log(`User can write to kernel segment: ${userCanAccessKernel}`);
        
        // Should be able to access user data segment
        const userCanAccessData = mmu.checkProtection(0x3500, 'write');
        console.log(`User can write to data segment: ${userCanAccessData}`);
        
        // Should NOT be able to execute in data segment
        const userCanExecuteData = mmu.checkProtection(0x3500, 'execute');
        console.log(`User can execute in data segment: ${userCanExecuteData}`);
        
        console.log('\nTesting paging system...');
        
        // Enable paging
        mmu.setPagingEnabled(true);
        console.log(`Paging enabled: ${mmu.pagingEnabled}`);
        
        // Test page allocation
        const physPage1 = mmu.allocatePhysicalPage();
        const physPage2 = mmu.allocatePhysicalPage();
        console.log(`Allocated physical pages: ${physPage1}, ${physPage2}`);
        
        // Map virtual pages
        mmu.mapPage(0, physPage1, 'rw');  // Virtual page 0 -> physical page 
        mmu.mapPage(1, physPage2, 'rwx'); // Virtual page 1 -> physical page
        
        console.log('Mapped virtual pages 0 and 1');
        
        // Test address translation
        const vaddr1 = 100; // Should be in virtual page 0
        const paddr1 = mmu.translateAddress(vaddr1);
        console.log(`Virtual address ${vaddr1} -> Physical address ${paddr1}`);
        
        const vaddr2 = 1000; // Should be in virtual page 1  
        const paddr2 = mmu.translateAddress(vaddr2);
        console.log(`Virtual address ${vaddr2} -> Physical address ${paddr2}`);
        
        // Test page table dump
        console.log('\nPage table dump:');
        const pageTable = mmu.getPageTableDump();
        pageTable.forEach(entry => {
            console.log(`  Virtual page ${entry.virtualPage} -> Physical page ${entry.physicalPage} (${entry.readable?'r':''}${entry.writable?'w':''}${entry.executable?'x':''})`);
        });
        
        console.log('\nTesting virtual memory operations...');
        
        // Test virtual memory read/write
        try {
            const testValue = new Tryte(42);
            mmu.writeVirtual(100, testValue);
            const readValue = mmu.readVirtual(100);
            console.log(`Virtual memory test: wrote ${testValue.toDecimal()}, read ${readValue.toDecimal()}`);
            
            if (testValue.toDecimal() === readValue.toDecimal()) {
                console.log('✓ Virtual memory read/write working');
            } else {
                console.log('✗ Virtual memory read/write failed');
            }
        } catch (error) {
            console.log(`Virtual memory error: ${error.message}`);
        }
        
        console.log('\nTesting CPU MMU instructions...');
        
        // Test MPG (Enable Paging)
        cpu.reset();
        cpu.enablePaging(1);
        console.log(`After MPG 1: paging enabled = ${cpu.mmu.pagingEnabled}`);
        
        // Test MPT (Set Protection Level)
        cpu.setProtectionLevel(ProtectionModes.USER);
        console.log(`After MPT 2: protection level = ${cpu.mmu.currentProtectionLevel}`);
        
        // Test MAP (Map Page)
        cpu.registers.set('ix', new Tryte(5));     // Virtual page 5
        cpu.registers.set('ix1', new Tryte(3));    // Physical page 3
        cpu.registers.set('acc', new Tryte(3));    // Permissions: r+w = 3
        cpu.mapPage(0);
        console.log('Mapped virtual page 5 to physical page 3 with rw permissions');
        
        // Test UMP (Unmap Page)
        cpu.unmapPage(5);
        console.log('Unmapped virtual page 5');
        
        // Test FLT (Flush TLB)
        cpu.flushTLB(0);
        console.log(`After FLT: TLB entries = ${cpu.mmu.tlb.size}`);
        
        console.log('\nTesting MMU program assembly...');
        
        // Test a program with MMU instructions
        const mmuProgram = `
            .org 0
            MPG #1          ; Enable paging
            MPT #2          ; Set user protection level
            LDA #7          ; Load value 7
            LDX #100        ; Load address 100  
            MAP             ; Map page using registers
            SVA 100         ; Store to virtual address
            LVA 100         ; Load from virtual address
            FLT             ; Flush TLB
            HLT             ; Halt
        `;
        
        try {
            const result = assembler.assemble(mmuProgram);
            if (result.success) {
                console.log(`✓ MMU program assembled successfully! ${result.machineCode.length} instructions`);
                
                // Load program into memory
                result.machineCode.forEach(({ address, instruction }) => {
                    memory.write(new TernaryAddress(address, 9), instruction);
                });
                
                // Reset CPU and execute
                cpu.reset();
                let steps = 0;
                while (!cpu.halted && steps < 20) {
                    try {
                        if (!cpu.step()) {
                            break;
                        }
                    } catch (error) {
                        console.log(`Execution error at step ${steps}: ${error.message}`);
                        break;
                    }
                    steps++;
                }
                
                console.log(`Program executed in ${steps} steps`);
                console.log(`Final ACC: ${cpu.registers.get('acc').toDecimal()}`);
                console.log(`Final MMU state: paging=${cpu.mmu.pagingEnabled}, protection=${cpu.mmu.currentProtectionLevel}`);
                
            } else {
                console.log(`✗ Assembly failed: ${result.errors.join(', ')}`);
            }
        } catch (error) {
            console.log(`Assembly error: ${error.message}`);
        }
        
        console.log('\nTesting protection violations...');
        
        // Test protection violation
        cpu.reset();
        cpu.mmu.setProtectionLevel(ProtectionModes.USER);
        cpu.mmu.protectionEnabled = true;
        
        try {
            // Try to write to kernel segment from user mode
            cpu.mmu.writeVirtual(0x500, new Tryte(99));
            console.log('✗ Protection violation not detected');
        } catch (error) {
            console.log(`✓ Protection violation correctly detected: ${error.message}`);
        }
        
        console.log('\nTesting page faults...');
        
        // Test page fault
        cpu.reset();
        cpu.mmu.setPagingEnabled(true);
        
        try {
            // Try to access unmapped virtual address
            const unmappedValue = cpu.mmu.readVirtual(5000);
            console.log(`Read from unmapped address: ${unmappedValue.toDecimal()}`);
        } catch (error) {
            console.log(`Page fault correctly handled: ${error.message}`);
        }
        
        // Check if page was auto-allocated
        const autoPageTable = cpu.mmu.getPageTableDump();
        console.log(`Auto-allocated pages: ${autoPageTable.length}`);
        
        console.log('\nMMU Statistics:');
        const stats = cpu.mmu.getStatistics();
        console.log(`  Virtual reads: ${stats.virtualReads}`);
        console.log(`  Virtual writes: ${stats.virtualWrites}`);
        console.log(`  Physical reads: ${stats.physicalReads}`);
        console.log(`  Physical writes: ${stats.physicalWrites}`);
        console.log(`  Page faults: ${stats.pageFaults}`);
        console.log(`  Protection violations: ${stats.protectionViolations}`);
        console.log(`  TLB hits: ${stats.tlbHits}`);
        console.log(`  TLB misses: ${stats.tlbMisses}`);
        console.log(`  Free physical pages: ${stats.freePhysicalPages}`);
        console.log(`  Allocated physical pages: ${stats.allocatedPhysicalPages}`);
        
        // Final state check
        const finalState = cpu.mmu.getState();
        console.log('\nFinal MMU State:');
        console.log(`  Paging enabled: ${finalState.pagingEnabled}`);
        console.log(`  Protection enabled: ${finalState.protectionEnabled}`);
        console.log(`  Current protection level: ${finalState.currentProtectionLevel}`);
        console.log(`  Total segments: ${finalState.segments.length}`);
        console.log(`  Total page table entries: ${finalState.pageTable.length}`);
        
        console.log('✓ Memory Management Unit test completed successfully');
        
    } catch (error) {
        console.error(`MMU test failed: ${error.message}`);
        console.error(error.stack);
    }
}

// Run the test
testMemoryManagementUnit();