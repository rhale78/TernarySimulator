/**
 * Balanced Ternary Memory Management Unit (MMU)
 * Implements memory protection, virtual memory, and paging
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

/**
 * Memory Protection Modes
 */
const ProtectionModes = {
    KERNEL: 0,      // Full access
    SUPERVISOR: 1,  // Limited privileged access
    USER: 2         // User mode with restrictions
};

/**
 * Page Table Entry
 * Represents a single page mapping in the virtual memory system
 */
class PageTableEntry {
    constructor() {
        this.present = false;        // Page is in memory
        this.readable = true;        // Page can be read
        this.writable = true;        // Page can be written
        this.executable = false;     // Page can be executed
        this.accessed = false;       // Page has been accessed
        this.dirty = false;          // Page has been modified
        this.physicalPage = 0;       // Physical page number
        this.protectionLevel = ProtectionModes.USER; // Required protection level
    }
    
    // Convert to tryte for storage
    toTryte() {
        let flags = 0;
        if (this.present) flags |= 1;
        if (this.readable) flags |= 2;
        if (this.writable) flags |= 4;
        if (this.executable) flags |= 8;
        if (this.accessed) flags |= 16;
        if (this.dirty) flags |= 32;
        
        // Combine flags and physical page
        const combined = flags + (this.physicalPage << 6) + (this.protectionLevel << 12);
        return new Tryte(combined);
    }
    
    // Create from tryte
    static fromTryte(tryte) {
        const pte = new PageTableEntry();
        const value = tryte.toDecimal();
        
        pte.present = (value & 1) !== 0;
        pte.readable = (value & 2) !== 0;
        pte.writable = (value & 4) !== 0;
        pte.executable = (value & 8) !== 0;
        pte.accessed = (value & 16) !== 0;
        pte.dirty = (value & 32) !== 0;
        pte.physicalPage = (value >> 6) & 0x3F; // 6 bits for page number
        pte.protectionLevel = (value >> 12) & 0x3; // 2 bits for protection
        
        return pte;
    }
}

/**
 * Memory Segment
 * Represents a contiguous block of memory with specific properties
 */
class MemorySegment {
    constructor(baseAddress, size, permissions, protectionLevel) {
        this.baseAddress = baseAddress;
        this.size = size;
        this.permissions = permissions; // 'r', 'w', 'x' combinations
        this.protectionLevel = protectionLevel;
        this.accessed = false;
        this.name = '';
    }
    
    contains(address) {
        return address >= this.baseAddress && address < (this.baseAddress + this.size);
    }
    
    canRead(currentProtectionLevel) {
        return this.permissions.includes('r') && currentProtectionLevel <= this.protectionLevel;
    }
    
    canWrite(currentProtectionLevel) {
        return this.permissions.includes('w') && currentProtectionLevel <= this.protectionLevel;
    }
    
    canExecute(currentProtectionLevel) {
        return this.permissions.includes('x') && currentProtectionLevel <= this.protectionLevel;
    }
}

/**
 * Memory Management Unit
 * Handles virtual memory, protection, and paging
 */
class MemoryManagementUnit {
    constructor(physicalMemory) {
        this.physicalMemory = physicalMemory;
        
        // Paging system
        this.pageSize = 729; // 3^6 = 729 addresses per page (6 trits)
        this.totalPages = 9; // 9 pages total as requested
        this.virtualAddressSpace = this.pageSize * this.totalPages; // Total virtual address space
        
        // Page tables
        this.pageTable = new Map(); // Virtual page -> PageTableEntry
        this.physicalPages = new Array(this.totalPages).fill(false); // Track allocated physical pages
        
        // Segmentation
        this.segments = [];
        this.setupDefaultSegments();
        
        // Current protection level
        this.currentProtectionLevel = ProtectionModes.KERNEL;
        
        // MMU control
        this.pagingEnabled = false;
        this.protectionEnabled = true;
        
        // Statistics
        this.stats = {
            virtualReads: 0,
            virtualWrites: 0,
            physicalReads: 0,
            physicalWrites: 0,
            pageFaults: 0,
            protectionViolations: 0,
            tlbHits: 0,
            tlbMisses: 0
        };
        
        // Translation Lookaside Buffer (TLB) - simple cache
        this.tlb = new Map();
        this.tlbSize = 16;
    }
    
    /**
     * Set up default memory segments
     */
    setupDefaultSegments() {
        // Kernel segment (0x0000 - 0x1000)
        this.segments.push(new MemorySegment(
            0x0000, 0x1000, 'rwx', ProtectionModes.KERNEL
        ));
        
        // User code segment (0x1000 - 0x3000)
        this.segments.push(new MemorySegment(
            0x1000, 0x2000, 'rx', ProtectionModes.USER
        ));
        
        // User data segment (0x3000 - 0x5000)
        this.segments.push(new MemorySegment(
            0x3000, 0x2000, 'rw', ProtectionModes.USER
        ));
        
        // Stack segment (0x5000 - 0x6000)
        this.segments.push(new MemorySegment(
            0x5000, 0x1000, 'rw', ProtectionModes.USER
        ));
        
        this.segments.forEach((seg, i) => {
            seg.name = ['KERNEL', 'CODE', 'DATA', 'STACK'][i];
        });
    }
    
    /**
     * Enable/disable paging
     */
    setPagingEnabled(enabled) {
        this.pagingEnabled = enabled;
        if (!enabled) {
            this.tlb.clear();
        }
    }
    
    /**
     * Set current protection level
     */
    setProtectionLevel(level) {
        if (level >= ProtectionModes.KERNEL && level <= ProtectionModes.USER) {
            this.currentProtectionLevel = level;
        }
    }
    
    /**
     * Allocate a physical page
     */
    allocatePhysicalPage() {
        for (let i = 0; i < this.totalPages; i++) {
            if (!this.physicalPages[i]) {
                this.physicalPages[i] = true;
                return i;
            }
        }
        return -1; // No free pages
    }
    
    /**
     * Free a physical page
     */
    freePhysicalPage(pageNumber) {
        if (pageNumber >= 0 && pageNumber < this.totalPages) {
            this.physicalPages[pageNumber] = false;
        }
    }
    
    /**
     * Map a virtual page to physical page
     */
    mapPage(virtualPage, physicalPage, permissions = 'rw') {
        const pte = new PageTableEntry();
        pte.present = true;
        pte.physicalPage = physicalPage;
        pte.readable = permissions.includes('r');
        pte.writable = permissions.includes('w');
        pte.executable = permissions.includes('x');
        pte.protectionLevel = this.currentProtectionLevel;
        
        this.pageTable.set(virtualPage, pte);
        
        // Clear TLB entry for this virtual page
        this.tlb.delete(virtualPage);
    }
    
    /**
     * Unmap a virtual page
     */
    unmapPage(virtualPage) {
        const pte = this.pageTable.get(virtualPage);
        if (pte && pte.present) {
            this.freePhysicalPage(pte.physicalPage);
            this.pageTable.delete(virtualPage);
            this.tlb.delete(virtualPage);
        }
    }
    
    /**
     * Translate virtual address to physical address
     */
    translateAddress(virtualAddress) {
        if (!this.pagingEnabled) {
            return virtualAddress; // Direct mapping when paging disabled
        }
        
        const virtualPage = Math.floor(virtualAddress / this.pageSize);
        const offset = virtualAddress % this.pageSize;
        
        // Check TLB first
        if (this.tlb.has(virtualPage)) {
            this.stats.tlbHits++;
            const physicalPage = this.tlb.get(virtualPage);
            return physicalPage * this.pageSize + offset;
        }
        
        this.stats.tlbMisses++;
        
        // Check page table
        const pte = this.pageTable.get(virtualPage);
        if (!pte || !pte.present) {
            this.stats.pageFaults++;
            this.handlePageFault(virtualPage);
            return -1; // Page fault
        }
        
        // Mark as accessed
        pte.accessed = true;
        
        // Update TLB
        this.updateTLB(virtualPage, pte.physicalPage);
        
        return pte.physicalPage * this.pageSize + offset;
    }
    
    /**
     * Handle page fault
     */
    handlePageFault(virtualPage) {
        console.log(`Page fault: Virtual page ${virtualPage} not present`);
        
        // Try to allocate a physical page
        const physicalPage = this.allocatePhysicalPage();
        if (physicalPage >= 0) {
            this.mapPage(virtualPage, physicalPage, 'rw');
            console.log(`Allocated physical page ${physicalPage} for virtual page ${virtualPage}`);
        } else {
            console.log(`No free physical pages available for virtual page ${virtualPage}`);
        }
    }
    
    /**
     * Update TLB
     */
    updateTLB(virtualPage, physicalPage) {
        // Remove oldest entry if TLB is full
        if (this.tlb.size >= this.tlbSize) {
            const firstKey = this.tlb.keys().next().value;
            this.tlb.delete(firstKey);
        }
        
        this.tlb.set(virtualPage, physicalPage);
    }
    
    /**
     * Check memory protection
     */
    checkProtection(address, operation) {
        if (!this.protectionEnabled) {
            return true;
        }
        
        // Find relevant segment
        const segment = this.segments.find(seg => seg.contains(address));
        if (!segment) {
            this.stats.protectionViolations++;
            return false; // Address not in any segment
        }
        
        segment.accessed = true;
        
        // Check operation permissions
        switch (operation) {
            case 'read':
                return segment.canRead(this.currentProtectionLevel);
            case 'write':
                return segment.canWrite(this.currentProtectionLevel);
            case 'execute':
                return segment.canExecute(this.currentProtectionLevel);
            default:
                return false;
        }
    }
    
    /**
     * Read from virtual memory
     */
    readVirtual(virtualAddress) {
        this.stats.virtualReads++;
        
        // Check protection
        if (!this.checkProtection(virtualAddress, 'read')) {
            this.stats.protectionViolations++;
            throw new Error(`Protection violation: Cannot read from address ${virtualAddress}`);
        }
        
        // Translate address
        const physicalAddress = this.translateAddress(virtualAddress);
        if (physicalAddress < 0) {
            throw new Error(`Page fault: Virtual address ${virtualAddress} not mapped`);
        }
        
        this.stats.physicalReads++;
        return this.physicalMemory.read(new TernaryAddress(physicalAddress, 9));
    }
    
    /**
     * Write to virtual memory
     */
    writeVirtual(virtualAddress, value) {
        this.stats.virtualWrites++;
        
        // Check protection
        if (!this.checkProtection(virtualAddress, 'write')) {
            this.stats.protectionViolations++;
            throw new Error(`Protection violation: Cannot write to address ${virtualAddress}`);
        }
        
        // Translate address
        const physicalAddress = this.translateAddress(virtualAddress);
        if (physicalAddress < 0) {
            throw new Error(`Page fault: Virtual address ${virtualAddress} not mapped`);
        }
        
        // Mark page as dirty
        if (this.pagingEnabled) {
            const virtualPage = Math.floor(virtualAddress / this.pageSize);
            const pte = this.pageTable.get(virtualPage);
            if (pte) {
                pte.dirty = true;
            }
        }
        
        this.stats.physicalWrites++;
        this.physicalMemory.write(new TernaryAddress(physicalAddress, 9), value);
    }
    
    /**
     * Add memory segment
     */
    addSegment(name, baseAddress, size, permissions, protectionLevel) {
        const segment = new MemorySegment(baseAddress, size, permissions, protectionLevel);
        segment.name = name;
        this.segments.push(segment);
    }
    
    /**
     * Remove memory segment
     */
    removeSegment(name) {
        const index = this.segments.findIndex(seg => seg.name === name);
        if (index >= 0) {
            this.segments.splice(index, 1);
        }
    }
    
    /**
     * Get MMU statistics
     */
    getStatistics() {
        return {
            ...this.stats,
            totalVirtualMemory: this.virtualAddressSpace,
            totalPhysicalMemory: this.totalPages * this.pageSize,
            freePhysicalPages: this.physicalPages.filter(p => !p).length,
            allocatedPhysicalPages: this.physicalPages.filter(p => p).length,
            totalSegments: this.segments.length,
            tlbEntries: this.tlb.size,
            currentProtectionLevel: this.currentProtectionLevel,
            pagingEnabled: this.pagingEnabled,
            protectionEnabled: this.protectionEnabled
        };
    }
    
    /**
     * Get segment information
     */
    getSegmentInfo() {
        return this.segments.map(seg => ({
            name: seg.name,
            baseAddress: seg.baseAddress,
            size: seg.size,
            permissions: seg.permissions,
            protectionLevel: seg.protectionLevel,
            accessed: seg.accessed
        }));
    }
    
    /**
     * Get page table dump
     */
    getPageTableDump() {
        const dump = [];
        for (let [virtualPage, pte] of this.pageTable) {
            dump.push({
                virtualPage: virtualPage,
                physicalPage: pte.physicalPage,
                present: pte.present,
                readable: pte.readable,
                writable: pte.writable,
                executable: pte.executable,
                accessed: pte.accessed,
                dirty: pte.dirty,
                protectionLevel: pte.protectionLevel
            });
        }
        return dump;
    }
    
    /**
     * Reset MMU
     */
    reset() {
        this.pageTable.clear();
        this.tlb.clear();
        this.physicalPages.fill(false);
        this.currentProtectionLevel = ProtectionModes.KERNEL;
        this.pagingEnabled = false;
        this.protectionEnabled = true;
        
        // Reset statistics
        for (let key in this.stats) {
            this.stats[key] = 0;
        }
        
        // Reset segment access flags
        this.segments.forEach(seg => seg.accessed = false);
    }
    
    /**
     * Get MMU state
     */
    getState() {
        return {
            currentProtectionLevel: this.currentProtectionLevel,
            pagingEnabled: this.pagingEnabled,
            protectionEnabled: this.protectionEnabled,
            statistics: this.getStatistics(),
            segments: this.getSegmentInfo(),
            pageTable: this.getPageTableDump(),
            tlbEntries: Object.fromEntries(this.tlb)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MemoryManagementUnit,
        MemorySegment,
        PageTableEntry,
        ProtectionModes
    };
}