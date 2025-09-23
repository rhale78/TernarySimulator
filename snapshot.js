/**
 * Snapshot Manager for Balanced Ternary CPU Simulator
 * Handles saving and loading complete system state including:
 * - CPU registers and state
 * - Memory contents
 * - Disk/filesystem state
 * - Graphics/video state
 * - Operating system state
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

class SnapshotManager {
    constructor(simulator) {
        this.simulator = simulator;
        this.snapshots = new Map(); // name -> snapshot data
        this.autoSaveEnabled = false;
        this.autoSaveInterval = null;
        this.compressionEnabled = true;
    }

    /**
     * Create a complete system snapshot
     */
    createSnapshot(name = null, description = '') {
        if (!name) {
            name = `snapshot_${Date.now()}`;
        }

        const snapshot = {
            metadata: {
                name: name,
                description: description,
                timestamp: Date.now(),
                version: '1.0',
                creator: 'BalancedTernarySimulator'
            },
            cpu: this.captureCPUState(),
            memory: this.captureMemoryState(),
            disk: this.captureDiskState(),
            graphics: this.captureGraphicsState(),
            os: this.captureOSState(),
            simulator: this.captureSimulatorState()
        };

        // Compress if enabled
        if (this.compressionEnabled) {
            snapshot.compressed = true;
            snapshot.data = this.compressSnapshot(snapshot);
        }

        this.snapshots.set(name, snapshot);
        return snapshot;
    }

    /**
     * Restore system from a snapshot
     */
    restoreSnapshot(name) {
        const snapshot = this.snapshots.get(name);
        if (!snapshot) {
            throw new Error(`Snapshot '${name}' not found`);
        }

        try {
            // Pause execution during restore
            const wasRunning = this.simulator.isRunning;
            if (wasRunning) {
                this.simulator.pause();
            }

            // Decompress if needed
            let snapshotData = snapshot;
            if (snapshot.compressed) {
                snapshotData = this.decompressSnapshot(snapshot);
            }

            // Restore components in order
            this.restoreCPUState(snapshotData.cpu);
            this.restoreMemoryState(snapshotData.memory);
            this.restoreDiskState(snapshotData.disk);
            this.restoreGraphicsState(snapshotData.graphics);
            this.restoreOSState(snapshotData.os);
            this.restoreSimulatorState(snapshotData.simulator);

            // Update all displays
            this.simulator.updateDisplay();

            return true;
        } catch (error) {
            console.error('Error restoring snapshot:', error);
            throw new Error(`Failed to restore snapshot: ${error.message}`);
        }
    }

    /**
     * Capture CPU state including all registers and execution status
     */
    captureCPUState() {
        if (!this.simulator.cpu) {
            return null;
        }

        const cpuState = this.simulator.cpu.getState();
        
        return {
            registers: cpuState.registers,
            alu: cpuState.alu,
            execution: cpuState.execution,
            breakpoints: Array.from(this.simulator.cpu.breakpoints || []),
            clockStatus: cpuState.clockStatus,
            microcodeStatus: cpuState.microcodeStatus,
            pipelineStatus: cpuState.pipelineStatus,
            fpuStatus: cpuState.fpuStatus,
            mmuStatus: cpuState.mmuStatus,
            interruptStatus: this.simulator.cpu.interruptController ? 
                this.simulator.cpu.interruptController.getState() : null,
            branchPredictorStatus: this.simulator.cpu.branchPredictor ?
                this.simulator.cpu.branchPredictor.getState() : null
        };
    }

    /**
     * Capture complete memory state
     */
    captureMemoryState() {
        if (!this.simulator.memory) {
            return null;
        }

        return {
            memoryData: this.simulator.memory.saveState(),
            watchpoints: Array.from(this.simulator.memory.watchpoints || []),
            accessHistory: [...(this.simulator.memory.accessHistory || [])],
            changeHistory: [...(this.simulator.memory.changeHistory || [])],
            cacheState: this.simulator.cache ? this.simulator.cache.getState() : null,
            dmaState: this.simulator.dma ? this.simulator.dma.getState() : null
        };
    }

    /**
     * Capture disk/filesystem state
     */
    captureDiskState() {
        if (!this.simulator.diskDrive) {
            return null;
        }

        // Capture all files and directories
        const files = {};
        for (const [path, file] of this.simulator.diskDrive.files) {
            files[path] = {
                name: file.name,
                path: file.path,
                data: file.data.map(tryte => tryte.toString()),
                size: file.size,
                created: file.created,
                modified: file.modified,
                sector: file.sector
            };
        }

        const directories = {};
        for (const [path, dir] of this.simulator.diskDrive.directories) {
            directories[path] = {
                name: dir.name,
                parent: dir.parent,
                children: Array.from(dir.children),
                created: dir.created,
                modified: dir.modified
            };
        }

        return {
            files: files,
            directories: directories,
            currentDirectory: this.simulator.diskDrive.currentDirectory,
            maxFiles: this.simulator.diskDrive.maxFiles,
            totalSectors: this.simulator.diskDrive.totalSectors,
            sectorSize: this.simulator.diskDrive.sectorSize,
            usedSectors: this.simulator.diskDrive.usedSectors,
            nextFileHandle: this.simulator.diskDrive.nextFileHandle,
            fileDescriptors: this.simulator.diskDrive.fileDescriptors ? 
                Array.from(this.simulator.diskDrive.fileDescriptors.entries()) : [],
            diskStatus: this.simulator.diskDrive.diskStatus,
            ioState: {
                currentHandle: this.simulator.diskDrive.currentHandle,
                currentPosition: this.simulator.diskDrive.currentPosition,
                stringBuffer: [...(this.simulator.diskDrive.stringBuffer || [])]
            }
        };
    }

    /**
     * Capture graphics/video state
     */
    captureGraphicsState() {
        if (!this.simulator.graphics) {
            return null;
        }

        const pixelData = {};
        for (const [key, value] of this.simulator.graphics.pixelData || new Map()) {
            pixelData[key] = value;
        }

        return {
            width: this.simulator.graphics.width,
            height: this.simulator.graphics.height,
            pixelData: pixelData,
            colorPalette: this.simulator.graphics.colorPalette,
            stats: this.simulator.graphics.getStats ? this.simulator.graphics.getStats() : null,
            canvasData: this.captureCanvasState()
        };
    }

    /**
     * Capture operating system state
     */
    captureOSState() {
        if (!this.simulator.os) {
            return null;
        }

        return this.simulator.os.exportState();
    }

    /**
     * Capture simulator-specific state
     */
    captureSimulatorState() {
        return {
            isRunning: this.simulator.isRunning,
            executionSpeed: this.simulator.executionSpeed,
            currentLanguage: this.simulator.currentLanguage,
            sourceLines: [...(this.simulator.sourceLines || [])],
            breakpoints: Array.from(this.simulator.breakpoints || []),
            currentSourceLine: this.simulator.currentSourceLine,
            addressToLine: Array.from(this.simulator.addressToLine?.entries() || []),
            lineToAddress: Array.from(this.simulator.lineToAddress?.entries() || []),
            memorySearchResults: [...(this.simulator.memorySearchResults || [])],
            memorySearchIndex: this.simulator.memorySearchIndex,
            isProfilingEnabled: this.simulator.isProfilingEnabled,
            instructionFrequency: Array.from(this.simulator.instructionFrequency?.entries() || []),
            coreCount: this.simulator.coreCount,
            multiCoreState: this.simulator.multiCore ? this.simulator.multiCore.getState() : null
        };
    }

    /**
     * Capture canvas pixel data
     */
    captureCanvasState() {
        try {
            const canvas = document.getElementById('graphicsCanvas');
            if (canvas && canvas.getContext) {
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                return {
                    width: canvas.width,
                    height: canvas.height,
                    data: Array.from(imageData.data)
                };
            }
        } catch (error) {
            console.warn('Could not capture canvas state:', error);
        }
        return null;
    }

    /**
     * Restore CPU state
     */
    restoreCPUState(cpuState) {
        if (!cpuState || !this.simulator.cpu) {
            return;
        }

        // Restore registers
        if (cpuState.registers) {
            for (const [regName, value] of Object.entries(cpuState.registers)) {
                try {
                    this.simulator.cpu.registers.set(regName, new Tryte(value));
                } catch (error) {
                    console.warn(`Could not restore register ${regName}:`, error);
                }
            }
        }

        // Restore execution state
        if (cpuState.execution) {
            this.simulator.cpu.halted = cpuState.execution.halted;
            this.simulator.cpu.running = cpuState.execution.running;
            this.simulator.cpu.cycleCount = cpuState.execution.cycleCount;
            if (cpuState.execution.currentInstruction) {
                this.simulator.cpu.currentInstruction = new Tryte(cpuState.execution.currentInstruction);
            }
        }

        // Restore breakpoints
        if (cpuState.breakpoints) {
            this.simulator.cpu.breakpoints = new Set(cpuState.breakpoints);
        }
    }

    /**
     * Restore memory state
     */
    restoreMemoryState(memoryState) {
        if (!memoryState || !this.simulator.memory) {
            return;
        }

        // Restore memory contents
        if (memoryState.memoryData) {
            this.simulator.memory.loadState(memoryState.memoryData);
        }

        // Restore watchpoints and history
        if (memoryState.watchpoints) {
            this.simulator.memory.watchpoints = new Set(memoryState.watchpoints);
        }
        if (memoryState.accessHistory) {
            this.simulator.memory.accessHistory = [...memoryState.accessHistory];
        }
        if (memoryState.changeHistory) {
            this.simulator.memory.changeHistory = [...memoryState.changeHistory];
        }
    }

    /**
     * Restore disk/filesystem state
     */
    restoreDiskState(diskState) {
        if (!diskState || !this.simulator.diskDrive) {
            return;
        }

        // Clear existing filesystem
        this.simulator.diskDrive.files.clear();
        this.simulator.diskDrive.directories.clear();
        this.simulator.diskDrive.fileDescriptors.clear();

        // Restore directories
        for (const [path, dir] of Object.entries(diskState.directories)) {
            this.simulator.diskDrive.directories.set(path, {
                name: dir.name,
                parent: dir.parent,
                children: new Set(dir.children),
                created: dir.created,
                modified: dir.modified
            });
        }

        // Restore files
        for (const [path, file] of Object.entries(diskState.files)) {
            this.simulator.diskDrive.files.set(path, {
                name: file.name,
                path: file.path,
                data: file.data.map(str => new Tryte(str)),
                size: file.size,
                created: file.created,
                modified: file.modified,
                sector: file.sector
            });
        }

        // Restore disk state
        this.simulator.diskDrive.currentDirectory = diskState.currentDirectory;
        this.simulator.diskDrive.usedSectors = diskState.usedSectors;
        this.simulator.diskDrive.nextFileHandle = diskState.nextFileHandle;
        this.simulator.diskDrive.diskStatus = diskState.diskStatus;

        // Restore I/O state
        if (diskState.ioState) {
            this.simulator.diskDrive.currentHandle = diskState.ioState.currentHandle;
            this.simulator.diskDrive.currentPosition = diskState.ioState.currentPosition;
            this.simulator.diskDrive.stringBuffer = [...diskState.ioState.stringBuffer];
        }

        // Restore file descriptors
        if (diskState.fileDescriptors) {
            this.simulator.diskDrive.fileDescriptors = new Map(diskState.fileDescriptors);
        }
    }

    /**
     * Restore graphics state
     */
    restoreGraphicsState(graphicsState) {
        if (!graphicsState || !this.simulator.graphics) {
            return;
        }

        // Restore pixel data
        this.simulator.graphics.pixelData = new Map();
        for (const [key, value] of Object.entries(graphicsState.pixelData)) {
            this.simulator.graphics.pixelData.set(key, value);
        }

        // Restore canvas if data is available
        if (graphicsState.canvasData) {
            this.restoreCanvasState(graphicsState.canvasData);
        }

        // Refresh graphics display
        if (this.simulator.graphics.canvas) {
            this.simulator.graphics.render();
        }
    }

    /**
     * Restore operating system state
     */
    restoreOSState(osState) {
        if (!osState || !this.simulator.os) {
            return;
        }

        this.simulator.os.importState(osState);
    }

    /**
     * Restore simulator state
     */
    restoreSimulatorState(simState) {
        if (!simState) {
            return;
        }

        this.simulator.isRunning = simState.isRunning;
        this.simulator.executionSpeed = simState.executionSpeed;
        this.simulator.currentLanguage = simState.currentLanguage;
        this.simulator.sourceLines = [...simState.sourceLines];
        this.simulator.breakpoints = new Set(simState.breakpoints);
        this.simulator.currentSourceLine = simState.currentSourceLine;
        this.simulator.addressToLine = new Map(simState.addressToLine);
        this.simulator.lineToAddress = new Map(simState.lineToAddress);
        this.simulator.memorySearchResults = [...simState.memorySearchResults];
        this.simulator.memorySearchIndex = simState.memorySearchIndex;
        this.simulator.isProfilingEnabled = simState.isProfilingEnabled;
        this.simulator.instructionFrequency = new Map(simState.instructionFrequency);
        this.simulator.coreCount = simState.coreCount;
    }

    /**
     * Restore canvas state
     */
    restoreCanvasState(canvasData) {
        try {
            const canvas = document.getElementById('graphicsCanvas');
            if (canvas && canvas.getContext && canvasData) {
                const ctx = canvas.getContext('2d');
                const imageData = ctx.createImageData(canvasData.width, canvasData.height);
                imageData.data.set(canvasData.data);
                ctx.putImageData(imageData, 0, 0);
            }
        } catch (error) {
            console.warn('Could not restore canvas state:', error);
        }
    }

    /**
     * Export snapshot to file
     */
    exportSnapshotToFile(name, filename = null) {
        const snapshot = this.snapshots.get(name);
        if (!snapshot) {
            throw new Error(`Snapshot '${name}' not found`);
        }

        if (!filename) {
            filename = `${name}.bts`; // Balanced Ternary Snapshot
        }

        const jsonData = JSON.stringify(snapshot, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return filename;
    }

    /**
     * Import snapshot from file
     */
    importSnapshotFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const snapshotData = JSON.parse(e.target.result);
                    
                    // Validate snapshot format
                    if (!this.validateSnapshot(snapshotData)) {
                        reject(new Error('Invalid snapshot format'));
                        return;
                    }

                    const name = snapshotData.metadata.name;
                    this.snapshots.set(name, snapshotData);
                    resolve(name);
                } catch (error) {
                    reject(new Error(`Failed to parse snapshot file: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read snapshot file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Validate snapshot format
     */
    validateSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') {
            return false;
        }

        // Check required metadata
        if (!snapshot.metadata || !snapshot.metadata.name || !snapshot.metadata.timestamp) {
            return false;
        }

        // Check for required sections
        const requiredSections = ['cpu', 'memory', 'disk', 'graphics', 'simulator'];
        for (const section of requiredSections) {
            if (!(section in snapshot)) {
                console.warn(`Missing section in snapshot: ${section}`);
            }
        }

        return true;
    }

    /**
     * Simple compression for snapshots
     */
    compressSnapshot(snapshot) {
        // This is a basic implementation - in practice you'd use a proper compression library
        const jsonString = JSON.stringify(snapshot);
        
        // Simple run-length encoding for repeated characters
        let compressed = '';
        let count = 1;
        let current = jsonString[0];
        
        for (let i = 1; i < jsonString.length; i++) {
            if (jsonString[i] === current && count < 99) {
                count++;
            } else {
                if (count > 3) {
                    compressed += `~${count}${current}`;
                } else {
                    compressed += current.repeat(count);
                }
                current = jsonString[i];
                count = 1;
            }
        }
        
        // Add the last run
        if (count > 3) {
            compressed += `~${count}${current}`;
        } else {
            compressed += current.repeat(count);
        }
        
        return compressed;
    }

    /**
     * Decompress snapshot data
     */
    decompressSnapshot(snapshot) {
        if (!snapshot.compressed) {
            return snapshot;
        }

        const compressed = snapshot.data;
        let decompressed = '';
        let i = 0;
        
        while (i < compressed.length) {
            if (compressed[i] === '~') {
                // Run-length encoded sequence
                i++; // Skip ~
                let countStr = '';
                while (i < compressed.length && compressed[i] >= '0' && compressed[i] <= '9') {
                    countStr += compressed[i];
                    i++;
                }
                const count = parseInt(countStr);
                const char = compressed[i];
                decompressed += char.repeat(count);
                i++;
            } else {
                decompressed += compressed[i];
                i++;
            }
        }
        
        return JSON.parse(decompressed);
    }

    /**
     * List all available snapshots
     */
    listSnapshots() {
        const snapshots = [];
        for (const [name, snapshot] of this.snapshots) {
            snapshots.push({
                name: name,
                description: snapshot.metadata.description,
                timestamp: snapshot.metadata.timestamp,
                size: JSON.stringify(snapshot).length
            });
        }
        return snapshots.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Delete a snapshot
     */
    deleteSnapshot(name) {
        return this.snapshots.delete(name);
    }

    /**
     * Enable automatic snapshots
     */
    enableAutoSave(intervalMs = 300000) { // Default: 5 minutes
        this.autoSaveEnabled = true;
        
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(() => {
            try {
                const autoSaveName = `autosave_${Date.now()}`;
                this.createSnapshot(autoSaveName, 'Automatic snapshot');
                
                // Keep only the last 5 auto-saves
                const autoSaves = this.listSnapshots()
                    .filter(s => s.name.startsWith('autosave_'))
                    .slice(5);
                
                for (const oldSave of autoSaves) {
                    this.deleteSnapshot(oldSave.name);
                }
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, intervalMs);
    }

    /**
     * Disable automatic snapshots
     */
    disableAutoSave() {
        this.autoSaveEnabled = false;
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * Get snapshot statistics
     */
    getStats() {
        const snapshots = this.listSnapshots();
        const totalSize = snapshots.reduce((sum, s) => sum + s.size, 0);
        
        return {
            count: snapshots.length,
            totalSize: totalSize,
            averageSize: snapshots.length > 0 ? totalSize / snapshots.length : 0,
            autoSaveEnabled: this.autoSaveEnabled,
            compressionEnabled: this.compressionEnabled
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnapshotManager };
}