/**
 * Multi-Core Ternary CPU Implementation
 * Supports up to 2 cores with user-selectable configuration
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const cpuModule = require('./cpu.js');
    global.TernaryCPU = cpuModule.TernaryCPU;
}

class MultiCoreCPU {
    constructor(memory, coreCount = 1) {
        this.memory = memory;
        this.coreCount = Math.min(Math.max(1, coreCount), 2); // Limit to 1-2 cores
        this.cores = [];
        this.sharedResources = {
            cache: null,
            dma: null,
            interrupts: null
        };
        
        // Multi-core synchronization
        this.globalLocks = new Map();      // Shared locks across cores
        this.syncBarriers = new Map();     // Synchronization barriers
        this.interCoreMessages = new Map(); // Inter-core message queue
        
        // Initialize cores
        for (let i = 0; i < this.coreCount; i++) {
            const core = new TernaryCPU(memory);
            core.coreId = i;
            core.isMultiCore = true;
            core.multiCoreSystem = this;
            core.multiCoreLocks = this.globalLocks; // Share locks
            core.syncBarriers = this.syncBarriers;   // Share barriers
            this.cores.push(core);
        }
        
        // Set up shared resources
        this.setupSharedResources();
        
        // Core synchronization
        this.globalCycleCount = 0;
        this.syncBarrier = 0;
        this.activeCore = 0; // For single-threaded mode
        this.parallelMode = false;
        
        console.log(`Multi-core CPU initialized with ${this.coreCount} core(s) and synchronization features`);
    }
    
    setupSharedResources() {
        if (this.coreCount > 1) {
            // Share cache hierarchy between cores
            const sharedCache = this.cores[0].memory.cache;
            for (let i = 1; i < this.coreCount; i++) {
                this.cores[i].memory.cache = sharedCache;
            }
            
            // Share interrupt controller
            const sharedInterrupts = this.cores[0].interruptController;
            for (let i = 1; i < this.coreCount; i++) {
                this.cores[i].interruptController = sharedInterrupts;
            }
            
            // Share DMA controller
            if (this.cores[0].dmaController) {
                const sharedDMA = this.cores[0].dmaController;
                for (let i = 1; i < this.coreCount; i++) {
                    this.cores[i].dmaController = sharedDMA;
                }
            }
        }
    }
    
    // Get primary core (core 0)
    getPrimaryCore() {
        return this.cores[0];
    }
    
    // Get all cores
    getAllCores() {
        return this.cores;
    }
    
    // Get active core for single-threaded execution
    getActiveCore() {
        return this.cores[this.activeCore];
    }
    
    // Switch active core (for single-threaded mode)
    switchCore(coreId) {
        if (coreId >= 0 && coreId < this.coreCount) {
            this.activeCore = coreId;
            return true;
        }
        return false;
    }
    
    // Execute single step on active core
    step() {
        if (this.parallelMode && this.coreCount > 1) {
            return this.stepParallel();
        } else {
            return this.getActiveCore().step();
        }
    }
    
    // Execute parallel step on all cores
    stepParallel() {
        const results = [];
        
        // Execute one step on each core
        for (let i = 0; i < this.coreCount; i++) {
            const core = this.cores[i];
            if (!core.halted) {
                results.push(core.step());
            } else {
                results.push(false);
            }
        }
        
        // Synchronize cores
        this.globalCycleCount++;
        this.synchronizeCores();
        
        return results.some(result => result);
    }
    
    // Synchronize cores at sync barriers
    synchronizeCores() {
        // Handle memory barriers and cache coherency
        for (let core of this.cores) {
            // Flush any pending writes
            if (core.memory && core.memory.cache) {
                core.memory.cache.flush();
            }
        }
        
        // Check synchronization barriers
        for (let [syncPoint, barrier] of this.syncBarriers) {
            if (barrier.size >= this.coreCount) {
                // All cores have reached this barrier - release them
                for (let core of this.cores) {
                    if (core.stalled && core.alu.flags.zero === 0) {
                        core.stalled = false;
                        core.alu.flags.zero = 1; // Signal sync complete
                    }
                }
                
                // Clear the barrier
                this.syncBarriers.delete(syncPoint);
                console.log(`Multi-core: Synchronization barrier ${syncPoint} released`);
            }
        }
        
        // Handle inter-core message delivery
        this.processInterCoreMessages();
    }
    
    // Process inter-core messages
    processInterCoreMessages() {
        for (let [coreId, messages] of this.interCoreMessages) {
            if (messages.length > 0 && coreId < this.cores.length) {
                const targetCore = this.cores[coreId];
                const message = messages.shift(); // Get oldest message
                
                // Deliver message as interrupt
                if (targetCore.interruptController) {
                    targetCore.interruptController.triggerInterrupt(15, message);
                }
            }
        }
    }
    
    // Send message to specific core
    sendMessageToCore(fromCore, toCore, message) {
        if (toCore >= 0 && toCore < this.coreCount) {
            if (!this.interCoreMessages.has(toCore)) {
                this.interCoreMessages.set(toCore, []);
            }
            
            this.interCoreMessages.get(toCore).push({
                source: fromCore,
                data: message,
                timestamp: Date.now()
            });
            
            return true;
        }
        return false;
    }
    
    // Get synchronization statistics
    getSyncStats() {
        return {
            activeLocks: this.globalLocks.size,
            activeBarriers: this.syncBarriers.size,
            pendingMessages: Array.from(this.interCoreMessages.values())
                .reduce((total, queue) => total + queue.length, 0),
            lockContention: this.getLockContentionStats()
        };
    }
    
    // Get lock contention statistics
    getLockContentionStats() {
        const stats = {};
        for (let [address, coreId] of this.globalLocks) {
            if (!stats[address]) {
                stats[address] = { owner: coreId, contenders: 0 };
            }
        }
        return stats;
    }
    
    // Run all cores
    run() {
        if (this.parallelMode && this.coreCount > 1) {
            return this.runParallel();
        } else {
            return this.getActiveCore().run();
        }
    }
    
    // Run cores in parallel
    runParallel() {
        let anyRunning = true;
        
        while (anyRunning) {
            anyRunning = false;
            
            for (let core of this.cores) {
                if (!core.halted && core.running) {
                    core.step();
                    anyRunning = true;
                }
            }
            
            this.globalCycleCount++;
            this.synchronizeCores();
            
            // Break if all cores are halted
            if (this.cores.every(core => core.halted)) {
                break;
            }
        }
    }
    
    // Pause all cores
    pause() {
        for (let core of this.cores) {
            core.pause();
        }
    }
    
    // Reset all cores
    reset() {
        for (let core of this.cores) {
            core.reset();
        }
        this.globalCycleCount = 0;
        this.syncBarrier = 0;
    }
    
    // Get state of all cores
    getState() {
        return {
            coreCount: this.coreCount,
            parallelMode: this.parallelMode,
            activeCore: this.activeCore,
            globalCycleCount: this.globalCycleCount,
            cores: this.cores.map((core, index) => ({
                coreId: index,
                state: core.getState(),
                halted: core.halted,
                running: core.running
            }))
        };
    }
    
    // Enable/disable parallel mode
    setParallelMode(enabled) {
        if (this.coreCount > 1) {
            this.parallelMode = enabled;
            console.log(`Parallel mode ${enabled ? 'enabled' : 'disabled'}`);
            return true;
        }
        return false;
    }
    
    // Get performance statistics
    getPerformanceStats() {
        const stats = {
            globalCycles: this.globalCycleCount,
            totalInstructions: 0,
            coreStats: []
        };
        
        for (let i = 0; i < this.coreCount; i++) {
            const core = this.cores[i];
            const coreStats = {
                coreId: i,
                cycles: core.cycleCount,
                instructions: core.instructionCount || 0,
                utilization: core.cycleCount / Math.max(this.globalCycleCount, 1),
                halted: core.halted
            };
            
            stats.coreStats.push(coreStats);
            stats.totalInstructions += coreStats.instructions;
        }
        
        stats.averageUtilization = stats.coreStats.reduce((sum, core) => sum + core.utilization, 0) / this.coreCount;
        stats.ipc = stats.totalInstructions / Math.max(this.globalCycleCount, 1); // Instructions per cycle
        
        return stats;
    }
    
    // Inter-core communication (simplified)
    sendInterCoreMessage(fromCore, toCore, message) {
        if (fromCore >= 0 && fromCore < this.coreCount && 
            toCore >= 0 && toCore < this.coreCount && 
            fromCore !== toCore) {
            
            // Trigger inter-core interrupt
            this.cores[toCore].interruptController.triggerInterrupt(15, {
                source: fromCore,
                data: message
            });
            
            return true;
        }
        return false;
    }
    
    // Load balance work across cores
    loadBalance() {
        if (this.coreCount < 2 || !this.parallelMode) return;
        
        // Simple load balancing - check if one core is significantly busier
        const stats = this.getPerformanceStats();
        const utilizationDiff = Math.max(...stats.coreStats.map(c => c.utilization)) - 
                               Math.min(...stats.coreStats.map(c => c.utilization));
        
        if (utilizationDiff > 0.3) {
            console.log('Load imbalance detected, cores should be rebalanced');
            // In a real implementation, this would migrate processes/threads
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MultiCoreCPU };
}