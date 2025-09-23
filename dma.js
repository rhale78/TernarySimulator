/**
 * DMA (Direct Memory Access) Controller for Ternary CPU Simulator
 * Implements high-speed memory transfers between I/O devices and memory
 * without CPU intervention
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

class DMAChannel {
    constructor(channelId) {
        this.channelId = channelId;
        this.enabled = false;
        this.busy = false;
        this.completed = false;
        this.error = false;
        
        // DMA transfer parameters
        this.sourceAddress = new TernaryAddress(0);
        this.destinationAddress = new TernaryAddress(0);
        this.transferSize = 0;
        this.currentPosition = 0;
        this.direction = 'memory_to_io'; // 'memory_to_io' or 'io_to_memory'
        this.priority = 0; // 0=highest, 9=lowest
        
        // Transfer mode
        this.transferMode = 'single'; // 'single', 'block', 'demand'
        this.autoIncrement = true;
        
        // Statistics
        this.transfersCompleted = 0;
        this.bytesTransferred = 0;
        this.errorCount = 0;
    }
    
    configure(config) {
        this.sourceAddress = new TernaryAddress(config.sourceAddress || 0);
        this.destinationAddress = new TernaryAddress(config.destinationAddress || 0);
        this.transferSize = config.transferSize || 0;
        this.direction = config.direction || 'memory_to_io';
        this.transferMode = config.transferMode || 'single';
        this.priority = config.priority || 0;
        this.autoIncrement = config.autoIncrement !== false;
        
        this.currentPosition = 0;
        this.completed = false;
        this.error = false;
    }
    
    start() {
        if (this.transferSize <= 0) {
            this.error = true;
            return false;
        }
        
        this.enabled = true;
        this.busy = true;
        this.completed = false;
        this.error = false;
        this.currentPosition = 0;
        
        return true;
    }
    
    stop() {
        this.enabled = false;
        this.busy = false;
    }
    
    reset() {
        this.enabled = false;
        this.busy = false;
        this.completed = false;
        this.error = false;
        this.currentPosition = 0;
    }
    
    getStatus() {
        return {
            channelId: this.channelId,
            enabled: this.enabled,
            busy: this.busy,
            completed: this.completed,
            error: this.error,
            progress: this.transferSize > 0 ? (this.currentPosition / this.transferSize * 100).toFixed(1) + '%' : '0%',
            position: this.currentPosition,
            size: this.transferSize,
            direction: this.direction,
            mode: this.transferMode,
            priority: this.priority
        };
    }
}

class DMAController {
    constructor(memory, maxChannels = 9) { // 3^2 channels
        this.memory = memory;
        this.maxChannels = maxChannels;
        this.channels = new Map();
        this.enabled = true;
        this.arbitrationMode = 'priority'; // 'priority', 'round_robin', 'fair'
        this.currentChannel = 0;
        
        // Performance statistics
        this.totalTransfers = 0;
        this.totalBytes = 0;
        this.clockCycles = 0;
        this.efficiency = 0;
        
        // Initialize channels
        for (let i = 0; i < maxChannels; i++) {
            this.channels.set(i, new DMAChannel(i));
        }
        
        // DMA state for memory-mapped interface
        this.initializeDMAIO();
    }
    
    initializeDMAIO() {
        this.selectedChannel = 0;
        this.commandRegister = 0;
        this.statusRegister = 0;
        this.dataBuffer = [];
    }
    
    // Configure a DMA channel
    configureChannel(channelId, config) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Invalid DMA channel: ${channelId}`);
        }
        
        channel.configure(config);
        return true;
    }
    
    // Start a DMA transfer
    startTransfer(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Invalid DMA channel: ${channelId}`);
        }
        
        return channel.start();
    }
    
    // Stop a DMA transfer
    stopTransfer(channelId) {
        const channel = this.channels.get(channelId);
        if (channel) {
            channel.stop();
        }
    }
    
    // Process DMA transfers (called by system clock)
    processDMATransfers() {
        if (!this.enabled) return;
        
        this.clockCycles++;
        
        // Get active channels sorted by priority
        const activeChannels = Array.from(this.channels.values())
            .filter(ch => ch.enabled && ch.busy && !ch.completed && !ch.error)
            .sort((a, b) => a.priority - b.priority);
        
        if (activeChannels.length === 0) return;
        
        // Process transfers based on arbitration mode
        switch (this.arbitrationMode) {
            case 'priority':
                this.processPriorityArbitration(activeChannels);
                break;
            case 'round_robin':
                this.processRoundRobinArbitration(activeChannels);
                break;
            case 'fair':
                this.processFairArbitration(activeChannels);
                break;
        }
    }
    
    processPriorityArbitration(channels) {
        // Process highest priority channel
        if (channels.length > 0) {
            this.processChannelTransfer(channels[0]);
        }
    }
    
    processRoundRobinArbitration(channels) {
        if (channels.length === 0) return;
        
        // Find next channel in round-robin order
        let nextChannel = null;
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[(this.currentChannel + i) % channels.length];
            if (channel.enabled && channel.busy) {
                nextChannel = channel;
                this.currentChannel = (channel.channelId + 1) % this.maxChannels;
                break;
            }
        }
        
        if (nextChannel) {
            this.processChannelTransfer(nextChannel);
        }
    }
    
    processFairArbitration(channels) {
        // Process one transfer from each active channel
        for (let channel of channels) {
            this.processChannelTransfer(channel);
        }
    }
    
    processChannelTransfer(channel) {
        try {
            if (channel.currentPosition >= channel.transferSize) {
                // Transfer completed
                channel.completed = true;
                channel.busy = false;
                channel.transfersCompleted++;
                this.totalTransfers++;
                return;
            }
            
            // Calculate current addresses
            const sourceOffset = channel.autoIncrement ? channel.currentPosition : 0;
            const destOffset = channel.autoIncrement ? channel.currentPosition : 0;
            
            const sourceAddr = new TernaryAddress(
                channel.sourceAddress.toDecimal() + sourceOffset
            );
            const destAddr = new TernaryAddress(
                channel.destinationAddress.toDecimal() + destOffset
            );
            
            // Perform the transfer based on mode
            switch (channel.transferMode) {
                case 'single':
                    this.transferSingle(channel, sourceAddr, destAddr);
                    break;
                case 'block':
                    this.transferBlock(channel, sourceAddr, destAddr);
                    break;
                case 'demand':
                    this.transferDemand(channel, sourceAddr, destAddr);
                    break;
            }
            
        } catch (error) {
            console.error(`DMA transfer error on channel ${channel.channelId}:`, error);
            channel.error = true;
            channel.busy = false;
            channel.errorCount++;
        }
    }
    
    transferSingle(channel, sourceAddr, destAddr) {
        // Transfer one tryte
        const data = this.memory.read(sourceAddr);
        this.memory.write(destAddr, data);
        
        channel.currentPosition++;
        channel.bytesTransferred++;
        this.totalBytes++;
    }
    
    transferBlock(channel, sourceAddr, destAddr) {
        // Transfer up to 9 trytes in one operation (3^2)
        const blockSize = Math.min(9, channel.transferSize - channel.currentPosition);
        
        for (let i = 0; i < blockSize; i++) {
            const srcAddr = new TernaryAddress(sourceAddr.toDecimal() + i);
            const dstAddr = new TernaryAddress(destAddr.toDecimal() + i);
            
            const data = this.memory.read(srcAddr);
            this.memory.write(dstAddr, data);
            
            channel.currentPosition++;
            channel.bytesTransferred++;
            this.totalBytes++;
        }
    }
    
    transferDemand(channel, sourceAddr, destAddr) {
        // Transfer based on I/O device demand (simplified as single transfer)
        this.transferSingle(channel, sourceAddr, destAddr);
    }
    
    // Get controller statistics
    getStats() {
        const activeChannels = Array.from(this.channels.values())
            .filter(ch => ch.enabled || ch.busy);
        
        const efficiency = this.clockCycles > 0 ? 
            (this.totalBytes / this.clockCycles * 100).toFixed(2) + '%' : '0%';
        
        return {
            enabled: this.enabled,
            totalChannels: this.maxChannels,
            activeChannels: activeChannels.length,
            totalTransfers: this.totalTransfers,
            totalBytes: this.totalBytes,
            clockCycles: this.clockCycles,
            efficiency: efficiency,
            arbitrationMode: this.arbitrationMode
        };
    }
    
    // Get all channel statuses
    getChannelStatuses() {
        const statuses = [];
        for (let channel of this.channels.values()) {
            statuses.push(channel.getStatus());
        }
        return statuses;
    }
    
    // Memory-mapped I/O interface
    handleMemoryRead(offset) {
        // DMA register addresses:
        // 0: Status register
        // 1: Command register
        // 2: Channel select register
        // 3: Source address low
        // 4: Source address high
        // 5: Destination address low
        // 6: Destination address high
        // 7: Transfer size
        // 8: Control register
        // 9-17: Channel status registers (one per channel)
        
        switch (offset) {
            case 0: // Status register
                return new Tryte(this.buildStatusRegister());
            case 1: // Command register
                return new Tryte(0); // Write-only
            case 2: // Channel select register
                return new Tryte(this.selectedChannel);
            case 3: // Source address low
                return new Tryte(this.getSelectedChannelSourceLow());
            case 4: // Source address high
                return new Tryte(this.getSelectedChannelSourceHigh());
            case 5: // Destination address low
                return new Tryte(this.getSelectedChannelDestLow());
            case 6: // Destination address high
                return new Tryte(this.getSelectedChannelDestHigh());
            case 7: // Transfer size
                return new Tryte(this.getSelectedChannelSize());
            case 8: // Control register
                return new Tryte(this.buildControlRegister());
            default:
                if (offset >= 9 && offset <= 17) {
                    // Channel status registers
                    const channelId = offset - 9;
                    return new Tryte(this.getChannelStatusValue(channelId));
                }
                return new Tryte(0);
        }
    }
    
    handleMemoryWrite(offset, value) {
        const val = value.toDecimal();
        
        switch (offset) {
            case 0: // Status register (read-only)
                break;
            case 1: // Command register
                this.executeCommand(val);
                break;
            case 2: // Channel select register
                this.selectedChannel = Math.max(0, Math.min(val, this.maxChannels - 1));
                break;
            case 3: // Source address low
                this.setSelectedChannelSourceLow(val);
                break;
            case 4: // Source address high
                this.setSelectedChannelSourceHigh(val);
                break;
            case 5: // Destination address low
                this.setSelectedChannelDestLow(val);
                break;
            case 6: // Destination address high
                this.setSelectedChannelDestHigh(val);
                break;
            case 7: // Transfer size
                this.setSelectedChannelSize(val);
                break;
            case 8: // Control register
                this.setControlRegister(val);
                break;
        }
    }
    
    // Helper methods for memory interface
    buildStatusRegister() {
        let status = 0;
        if (this.enabled) status |= 1;
        if (this.hasActiveDMA()) status |= 2;
        if (this.hasCompletedDMA()) status |= 4;
        if (this.hasErrorDMA()) status |= 8;
        return status;
    }
    
    buildControlRegister() {
        let control = 0;
        if (this.arbitrationMode === 'priority') control |= 0;
        if (this.arbitrationMode === 'round_robin') control |= 1;
        if (this.arbitrationMode === 'fair') control |= 2;
        return control;
    }
    
    setControlRegister(value) {
        const mode = value & 3;
        switch (mode) {
            case 0: this.arbitrationMode = 'priority'; break;
            case 1: this.arbitrationMode = 'round_robin'; break;
            case 2: this.arbitrationMode = 'fair'; break;
        }
    }
    
    executeCommand(command) {
        const channel = this.channels.get(this.selectedChannel);
        if (!channel) return;
        
        switch (command) {
            case 1: // Start transfer
                this.startTransfer(this.selectedChannel);
                break;
            case 2: // Stop transfer
                this.stopTransfer(this.selectedChannel);
                break;
            case 3: // Reset channel
                channel.reset();
                break;
            case 4: // Enable DMA controller
                this.enabled = true;
                break;
            case 5: // Disable DMA controller
                this.enabled = false;
                break;
        }
    }
    
    getSelectedChannelSourceLow() {
        const channel = this.channels.get(this.selectedChannel);
        return channel ? (channel.sourceAddress.toDecimal() & 0x1FF) : 0;
    }
    
    getSelectedChannelSourceHigh() {
        const channel = this.channels.get(this.selectedChannel);
        return channel ? ((channel.sourceAddress.toDecimal() >> 9) & 0x1FF) : 0;
    }
    
    setSelectedChannelSourceLow(value) {
        const channel = this.channels.get(this.selectedChannel);
        if (channel) {
            const high = channel.sourceAddress.toDecimal() & 0xFE00;
            channel.sourceAddress = new TernaryAddress(high | (value & 0x1FF));
        }
    }
    
    setSelectedChannelSourceHigh(value) {
        const channel = this.channels.get(this.selectedChannel);
        if (channel) {
            const low = channel.sourceAddress.toDecimal() & 0x1FF;
            channel.sourceAddress = new TernaryAddress(((value & 0x1FF) << 9) | low);
        }
    }
    
    getSelectedChannelDestLow() {
        const channel = this.channels.get(this.selectedChannel);
        return channel ? (channel.destinationAddress.toDecimal() & 0x1FF) : 0;
    }
    
    getSelectedChannelDestHigh() {
        const channel = this.channels.get(this.selectedChannel);
        return channel ? ((channel.destinationAddress.toDecimal() >> 9) & 0x1FF) : 0;
    }
    
    setSelectedChannelDestLow(value) {
        const channel = this.channels.get(this.selectedChannel);
        if (channel) {
            const high = channel.destinationAddress.toDecimal() & 0xFE00;
            channel.destinationAddress = new TernaryAddress(high | (value & 0x1FF));
        }
    }
    
    setSelectedChannelDestHigh(value) {
        const channel = this.channels.get(this.selectedChannel);
        if (channel) {
            const low = channel.destinationAddress.toDecimal() & 0x1FF;
            channel.destinationAddress = new TernaryAddress(((value & 0x1FF) << 9) | low);
        }
    }
    
    getSelectedChannelSize() {
        const channel = this.channels.get(this.selectedChannel);
        return channel ? channel.transferSize : 0;
    }
    
    setSelectedChannelSize(value) {
        const channel = this.channels.get(this.selectedChannel);
        if (channel) {
            channel.transferSize = Math.max(0, value);
        }
    }
    
    getChannelStatusValue(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) return 0;
        
        let status = 0;
        if (channel.enabled) status |= 1;
        if (channel.busy) status |= 2;
        if (channel.completed) status |= 4;
        if (channel.error) status |= 8;
        return status;
    }
    
    hasActiveDMA() {
        return Array.from(this.channels.values()).some(ch => ch.busy);
    }
    
    hasCompletedDMA() {
        return Array.from(this.channels.values()).some(ch => ch.completed);
    }
    
    hasErrorDMA() {
        return Array.from(this.channels.values()).some(ch => ch.error);
    }
    
    // Enhanced DMA: High-level disk operations
    disk_read_dma(diskController, sector, count, memoryAddress, channelId = 0) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Invalid DMA channel: ${channelId}`);
        }
        
        // Configure channel for disk read
        channel.configure({
            sourceAddress: sector * 512, // Assuming 512 bytes per sector
            destinationAddress: memoryAddress,
            transferSize: count * 512,
            direction: 'io_to_memory',
            transferMode: 'block',
            priority: 1 // High priority for disk operations
        });
        
        // Set up disk-specific transfer data
        channel.diskOperation = {
            type: 'read',
            controller: diskController,
            sector: sector,
            sectorCount: count
        };
        
        return channel.start();
    }
    
    disk_write_dma(diskController, sector, count, memoryAddress, channelId = 1) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Invalid DMA channel: ${channelId}`);
        }
        
        // Configure channel for disk write
        channel.configure({
            sourceAddress: memoryAddress,
            destinationAddress: sector * 512,
            transferSize: count * 512,
            direction: 'memory_to_io',
            transferMode: 'block',
            priority: 1 // High priority for disk operations
        });
        
        // Set up disk-specific transfer data
        channel.diskOperation = {
            type: 'write',
            controller: diskController,
            sector: sector,
            sectorCount: count
        };
        
        return channel.start();
    }
    
    // Enhanced DMA: Network packet transfer
    network_send_dma(networkController, packetAddress, packetSize, channelId = 2) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Invalid DMA channel: ${channelId}`);
        }
        
        channel.configure({
            sourceAddress: packetAddress,
            destinationAddress: 0, // Network controller buffer
            transferSize: packetSize,
            direction: 'memory_to_io',
            transferMode: 'demand',
            priority: 2
        });
        
        channel.networkOperation = {
            type: 'send',
            controller: networkController,
            packetSize: packetSize
        };
        
        return channel.start();
    }
    
    network_receive_dma(networkController, bufferAddress, maxSize, channelId = 3) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Invalid DMA channel: ${channelId}`);
        }
        
        channel.configure({
            sourceAddress: 0, // Network controller buffer
            destinationAddress: bufferAddress,
            transferSize: maxSize,
            direction: 'io_to_memory',
            transferMode: 'demand',
            priority: 2
        });
        
        channel.networkOperation = {
            type: 'receive',
            controller: networkController,
            maxSize: maxSize
        };
        
        return channel.start();
    }
    
    // Enhanced DMA: Memory-to-memory transfers
    memory_copy_dma(sourceAddress, destAddress, size, channelId = 4) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Invalid DMA channel: ${channelId}`);
        }
        
        channel.configure({
            sourceAddress: sourceAddress,
            destinationAddress: destAddress,
            transferSize: size,
            direction: 'memory_to_memory', // Special mode
            transferMode: 'block',
            priority: 3
        });
        
        return channel.start();
    }
    
    // Enhanced DMA: Pattern fill
    memory_fill_dma(address, pattern, size, channelId = 5) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Invalid DMA channel: ${channelId}`);
        }
        
        channel.configure({
            sourceAddress: 0, // Pattern register
            destinationAddress: address,
            transferSize: size,
            direction: 'pattern_fill', // Special mode
            transferMode: 'block',
            priority: 4
        });
        
        channel.fillPattern = pattern;
        return channel.start();
    }
    
    // Enhanced DMA: Get comprehensive statistics
    getDMAStatistics() {
        const stats = this.getStats();
        
        // Add per-channel detailed statistics
        stats.channels = [];
        for (const channel of this.channels.values()) {
            const channelStats = {
                id: channel.channelId,
                status: channel.getStatus(),
                statistics: {
                    transfersCompleted: channel.transfersCompleted,
                    bytesTransferred: channel.bytesTransferred,
                    errorCount: channel.errorCount,
                    averageTransferSize: channel.transfersCompleted > 0 ? 
                        (channel.bytesTransferred / channel.transfersCompleted).toFixed(1) : 0
                }
            };
            
            // Add operation-specific stats
            if (channel.diskOperation) {
                channelStats.diskOperation = channel.diskOperation;
            }
            if (channel.networkOperation) {
                channelStats.networkOperation = channel.networkOperation;
            }
            
            stats.channels.push(channelStats);
        }
        
        return stats;
    }
}
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DMAController, DMAChannel };
}