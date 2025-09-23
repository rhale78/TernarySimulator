/**
 * 2-Layer Cache Memory System for Ternary CPU Simulator
 * Implements L1 and L2 caches with different replacement policies
 * Tracks performance metrics and cache behavior
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

class CacheLine {
    constructor() {
        this.valid = false;
        this.dirty = false;
        this.tag = 0;
        this.data = new Tryte(0);
        this.lastAccessed = 0;
        this.accessCount = 0;
    }
    
    setData(tag, data, timestamp) {
        this.valid = true;
        this.dirty = false;
        this.tag = tag;
        this.data = data;
        this.lastAccessed = timestamp;
        this.accessCount++;
    }
    
    markDirty() {
        this.dirty = true;
    }
    
    invalidate() {
        this.valid = false;
        this.dirty = false;
    }
    
    updateAccess(timestamp) {
        this.lastAccessed = timestamp;
        this.accessCount++;
    }
}

class Cache {
    constructor(name, size, associativity = 1, replacementPolicy = 'LRU') {
        this.name = name;
        this.size = size; // Number of cache lines
        this.associativity = associativity; // Lines per set
        this.sets = Math.floor(size / associativity);
        this.replacementPolicy = replacementPolicy; // 'LRU', 'FIFO', 'Random'
        
        // Initialize cache structure
        this.lines = [];
        for (let i = 0; i < size; i++) {
            this.lines.push(new CacheLine());
        }
        
        // Performance counters
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
        this.writebacks = 0;
        this.timestamp = 0;
        
        // Replacement policy state
        this.fifoPointers = new Array(this.sets).fill(0);
    }
    
    // Calculate set index from address
    getSetIndex(address) {
        const addr = address instanceof TernaryAddress ? address.toDecimal() : address;
        return addr % this.sets;
    }
    
    // Calculate tag from address
    getTag(address) {
        const addr = address instanceof TernaryAddress ? address.toDecimal() : address;
        return Math.floor(addr / this.sets);
    }
    
    // Find cache line in set
    findLine(tag, setIndex) {
        const startIndex = setIndex * this.associativity;
        const endIndex = startIndex + this.associativity;
        
        for (let i = startIndex; i < endIndex; i++) {
            const line = this.lines[i];
            if (line.valid && line.tag === tag) {
                return i;
            }
        }
        return -1;
    }
    
    // Find victim line for replacement
    findVictim(setIndex) {
        const startIndex = setIndex * this.associativity;
        const endIndex = startIndex + this.associativity;
        
        // First, look for invalid line
        for (let i = startIndex; i < endIndex; i++) {
            if (!this.lines[i].valid) {
                return i;
            }
        }
        
        // All lines are valid, apply replacement policy
        switch (this.replacementPolicy) {
            case 'LRU':
                return this.findLRUVictim(startIndex, endIndex);
            case 'FIFO':
                return this.findFIFOVictim(setIndex, startIndex, endIndex);
            case 'Random':
                return this.findRandomVictim(startIndex, endIndex);
            default:
                return startIndex; // Default to first line
        }
    }
    
    findLRUVictim(startIndex, endIndex) {
        let lruIndex = startIndex;
        let lruTime = this.lines[startIndex].lastAccessed;
        
        for (let i = startIndex + 1; i < endIndex; i++) {
            if (this.lines[i].lastAccessed < lruTime) {
                lruTime = this.lines[i].lastAccessed;
                lruIndex = i;
            }
        }
        return lruIndex;
    }
    
    findFIFOVictim(setIndex, startIndex, endIndex) {
        const victim = startIndex + this.fifoPointers[setIndex];
        this.fifoPointers[setIndex] = (this.fifoPointers[setIndex] + 1) % this.associativity;
        return victim;
    }
    
    findRandomVictim(startIndex, endIndex) {
        const range = endIndex - startIndex;
        return startIndex + Math.floor(Math.random() * range);
    }
    
    // Read from cache
    read(address) {
        this.timestamp++;
        const setIndex = this.getSetIndex(address);
        const tag = this.getTag(address);
        const lineIndex = this.findLine(tag, setIndex);
        
        if (lineIndex !== -1) {
            // Cache hit
            this.hits++;
            const line = this.lines[lineIndex];
            line.updateAccess(this.timestamp);
            return { hit: true, data: line.data };
        } else {
            // Cache miss
            this.misses++;
            return { hit: false, data: null };
        }
    }
    
    // Write to cache
    write(address, data, writeThrough = false) {
        this.timestamp++;
        const setIndex = this.getSetIndex(address);
        const tag = this.getTag(address);
        let lineIndex = this.findLine(tag, setIndex);
        
        if (lineIndex !== -1) {
            // Cache hit - update existing line
            this.hits++;
            const line = this.lines[lineIndex];
            line.data = data;
            line.updateAccess(this.timestamp);
            if (!writeThrough) {
                line.markDirty();
            }
            return { hit: true, evicted: null };
        } else {
            // Cache miss - allocate new line
            this.misses++;
            lineIndex = this.findVictim(setIndex);
            const line = this.lines[lineIndex];
            
            let evicted = null;
            if (line.valid) {
                this.evictions++;
                if (line.dirty) {
                    this.writebacks++;
                    evicted = {
                        address: line.tag * this.sets + setIndex,
                        data: line.data
                    };
                }
            }
            
            line.setData(tag, data, this.timestamp);
            if (!writeThrough) {
                line.markDirty();
            }
            
            return { hit: false, evicted: evicted };
        }
    }
    
    // Invalidate cache line
    invalidate(address) {
        const setIndex = this.getSetIndex(address);
        const tag = this.getTag(address);
        const lineIndex = this.findLine(tag, setIndex);
        
        if (lineIndex !== -1) {
            this.lines[lineIndex].invalidate();
            return true;
        }
        return false;
    }
    
    // Flush all cache lines
    flush() {
        const evicted = [];
        for (let line of this.lines) {
            if (line.valid && line.dirty) {
                evicted.push({
                    address: line.tag * this.sets + (this.lines.indexOf(line) % this.sets),
                    data: line.data
                });
                this.writebacks++;
            }
            line.invalidate();
        }
        return evicted;
    }
    
    // Get cache statistics
    getStats() {
        const totalAccesses = this.hits + this.misses;
        const hitRate = totalAccesses > 0 ? (this.hits / totalAccesses * 100).toFixed(2) : '0.00';
        const missRate = totalAccesses > 0 ? (this.misses / totalAccesses * 100).toFixed(2) : '0.00';
        
        return {
            name: this.name,
            size: this.size,
            associativity: this.associativity,
            sets: this.sets,
            policy: this.replacementPolicy,
            hits: this.hits,
            misses: this.misses,
            totalAccesses: totalAccesses,
            hitRate: hitRate + '%',
            missRate: missRate + '%',
            evictions: this.evictions,
            writebacks: this.writebacks
        };
    }
    
    // Reset statistics
    resetStats() {
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
        this.writebacks = 0;
    }
}

class TwoLevelCacheSystem {
    constructor(memory, l1Config = {}, l2Config = {}) {
        this.memory = memory;
        
        // Default L1 cache configuration (small, fast)
        const l1Defaults = {
            size: 27,        // 3^3 lines
            associativity: 3, // 3-way associative 
            policy: 'LRU'
        };
        
        // Default L2 cache configuration (larger, slower)
        const l2Defaults = {
            size: 81,        // 3^4 lines
            associativity: 9, // 9-way associative
            policy: 'LRU'
        };
        
        const l1 = { ...l1Defaults, ...l1Config };
        const l2 = { ...l2Defaults, ...l2Config };
        
        this.l1Cache = new Cache('L1', l1.size, l1.associativity, l1.policy);
        this.l2Cache = new Cache('L2', l2.size, l2.associativity, l2.policy);
        
        // Cache system configuration
        this.writePolicy = 'write_back'; // 'write_through' or 'write_back'
        this.allocationPolicy = 'write_allocate'; // 'write_allocate' or 'no_write_allocate'
        
        // Performance tracking
        this.memoryAccesses = 0;
        this.l1Only = 0;
        this.l2Hit = 0;
        this.memoryHit = 0;
    }
    
    // Read with cache hierarchy
    read(address) {
        this.memoryAccesses++;
        
        // Try L1 cache first
        const l1Result = this.l1Cache.read(address);
        if (l1Result.hit) {
            this.l1Only++;
            return l1Result.data;
        }
        
        // L1 miss, try L2 cache
        const l2Result = this.l2Cache.read(address);
        if (l2Result.hit) {
            this.l2Hit++;
            // Load into L1 cache
            const l1WriteResult = this.l1Cache.write(address, l2Result.data, true);
            this.handleL1Eviction(l1WriteResult.evicted);
            return l2Result.data;
        }
        
        // L2 miss, read from memory
        this.memoryHit++;
        const data = this.memory.read(address);
        
        // Load into L2 cache
        const l2WriteResult = this.l2Cache.write(address, data, true);
        this.handleL2Eviction(l2WriteResult.evicted);
        
        // Load into L1 cache
        const l1WriteResult = this.l1Cache.write(address, data, true);
        this.handleL1Eviction(l1WriteResult.evicted);
        
        return data;
    }
    
    // Write with cache hierarchy
    write(address, data) {
        this.memoryAccesses++;
        
        if (this.writePolicy === 'write_through') {
            this.writeThrough(address, data);
        } else {
            this.writeBack(address, data);
        }
    }
    
    writeThrough(address, data) {
        // Write to all levels and memory
        this.memory.write(address, data);
        
        // Update L1 if present
        const l1Result = this.l1Cache.write(address, data, true);
        if (l1Result.hit) {
            this.l1Only++;
        }
        
        // Update L2 if present
        const l2Result = this.l2Cache.write(address, data, true);
        if (l2Result.hit) {
            this.l2Hit++;
        }
    }
    
    writeBack(address, data) {
        // Try to write to L1 first
        const l1Result = this.l1Cache.write(address, data, false);
        if (l1Result.hit) {
            this.l1Only++;
            this.handleL1Eviction(l1Result.evicted);
            return;
        }
        
        // L1 miss - check allocation policy
        if (this.allocationPolicy === 'write_allocate') {
            // Allocate in cache hierarchy
            let dataToWrite = data;
            
            // Check if in L2
            const l2ReadResult = this.l2Cache.read(address);
            if (!l2ReadResult.hit) {
                // Not in L2, read from memory first
                dataToWrite = this.memory.read(address);
                this.memoryHit++;
                
                // Allocate in L2
                const l2WriteResult = this.l2Cache.write(address, dataToWrite, false);
                this.handleL2Eviction(l2WriteResult.evicted);
            } else {
                this.l2Hit++;
            }
            
            // Now allocate in L1 and update with new data
            const l1WriteResult = this.l1Cache.write(address, data, false);
            this.handleL1Eviction(l1WriteResult.evicted);
        } else {
            // No allocation - write directly to memory
            this.memory.write(address, data);
            this.memoryHit++;
        }
    }
    
    handleL1Eviction(evicted) {
        if (!evicted) return;
        
        // Write evicted line to L2
        const l2WriteResult = this.l2Cache.write(evicted.address, evicted.data, false);
        this.handleL2Eviction(l2WriteResult.evicted);
    }
    
    handleL2Eviction(evicted) {
        if (!evicted) return;
        
        // Write evicted line to memory
        this.memory.write(evicted.address, evicted.data);
    }
    
    // Invalidate address in all cache levels
    invalidate(address) {
        this.l1Cache.invalidate(address);
        this.l2Cache.invalidate(address);
    }
    
    // Flush all caches
    flush() {
        const l1Evicted = this.l1Cache.flush();
        const l2Evicted = this.l2Cache.flush();
        
        // Write back all dirty data
        for (let evicted of l1Evicted) {
            this.memory.write(evicted.address, evicted.data);
        }
        for (let evicted of l2Evicted) {
            this.memory.write(evicted.address, evicted.data);
        }
    }
    
    // Configure cache policies
    setWritePolicy(policy) {
        if (policy === 'write_through' || policy === 'write_back') {
            this.writePolicy = policy;
        }
    }
    
    setAllocationPolicy(policy) {
        if (policy === 'write_allocate' || policy === 'no_write_allocate') {
            this.allocationPolicy = policy;
        }
    }
    
    // Get comprehensive statistics
    getStats() {
        const l1Stats = this.l1Cache.getStats();
        const l2Stats = this.l2Cache.getStats();
        
        const totalAccesses = this.memoryAccesses;
        const l1Rate = totalAccesses > 0 ? (this.l1Only / totalAccesses * 100).toFixed(2) : '0.00';
        const l2Rate = totalAccesses > 0 ? (this.l2Hit / totalAccesses * 100).toFixed(2) : '0.00';
        const memoryRate = totalAccesses > 0 ? (this.memoryHit / totalAccesses * 100).toFixed(2) : '0.00';
        
        return {
            system: {
                totalAccesses: totalAccesses,
                l1OnlyRate: l1Rate + '%',
                l2HitRate: l2Rate + '%',
                memoryAccessRate: memoryRate + '%',
                writePolicy: this.writePolicy,
                allocationPolicy: this.allocationPolicy
            },
            l1: l1Stats,
            l2: l2Stats
        };
    }
    
    // Reset all statistics
    resetStats() {
        this.l1Cache.resetStats();
        this.l2Cache.resetStats();
        this.memoryAccesses = 0;
        this.l1Only = 0;
        this.l2Hit = 0;
        this.memoryHit = 0;
    }
    
    // Test cache performance with different patterns
    benchmarkAccess(pattern = 'sequential', count = 100) {
        this.resetStats();
        const startTime = Date.now();
        
        for (let i = 0; i < count; i++) {
            let address;
            switch (pattern) {
                case 'sequential':
                    address = i;
                    break;
                case 'random':
                    address = Math.floor(Math.random() * 1000);
                    break;
                case 'stride':
                    address = (i * 7) % 1000; // Prime stride
                    break;
                default:
                    address = i;
            }
            
            this.read(address);
        }
        
        const endTime = Date.now();
        const stats = this.getStats();
        stats.benchmark = {
            pattern: pattern,
            operations: count,
            timeMs: endTime - startTime,
            opsPerMs: (count / (endTime - startTime)).toFixed(2)
        };
        
        return stats;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TwoLevelCacheSystem, Cache, CacheLine };
}