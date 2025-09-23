/**
 * Main Simulator Controller
 * Coordinates all components and provides web interface
 */

class TernarySimulator {
    constructor() {
        this.memory = new TernaryMemory(9); // 9-trit addressing
        this.cpu = new TernaryCPU(this.memory);
        this.assembler = new TernaryAssembler();
        this.io = new MemoryMappedIO(this.memory);
        
        this.isRunning = false;
        this.executionSpeed = 100; // Hz
        this.executionInterval = null;
        
        this.initializeUI();
        this.setupEventListeners();
        this.updateDisplay();
    }

    initializeUI() {
        // Load example program
        const programEditor = document.getElementById('programEditor');
        if (programEditor) {
            programEditor.value = TernaryAssembler.getExampleProgram();
        }

        // Initialize graphics display
        this.initializeGraphics();
        
        // Set initial memory view
        this.updateMemoryDisplay();
    }

    setupEventListeners() {
        // Control buttons
        document.getElementById('runBtn')?.addEventListener('click', () => this.run());
        document.getElementById('stepBtn')?.addEventListener('click', () => this.step());
        document.getElementById('resetBtn')?.addEventListener('click', () => this.reset());
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.pause());
        
        // Editor controls
        document.getElementById('assembleBtn')?.addEventListener('click', () => this.assemble());
        document.getElementById('loadExampleBtn')?.addEventListener('click', () => this.loadExample());
        
        // Memory controls
        document.getElementById('refreshMemoryBtn')?.addEventListener('click', () => this.updateMemoryDisplay());
        
        // Memory start address input
        const memoryStartInput = document.getElementById('memoryStart');
        if (memoryStartInput) {
            memoryStartInput.addEventListener('change', () => this.updateMemoryDisplay());
        }
    }

    initializeGraphics() {
        const canvas = document.getElementById('graphicsDisplay');
        if (canvas) {
            this.graphicsContext = canvas.getContext('2d');
            this.clearGraphics();
        }
    }

    clearGraphics() {
        if (this.graphicsContext) {
            this.graphicsContext.fillStyle = '#000000';
            this.graphicsContext.fillRect(0, 0, 240, 160);
        }
    }

    // Assembly and program loading
    assemble() {
        const sourceCode = document.getElementById('programEditor')?.value || '';
        
        try {
            const result = this.assembler.assemble(sourceCode, 0);
            
            if (result.success) {
                // Load program into memory
                this.loadProgramIntoMemory(result.machineCode);
                this.showMessage('Assembly successful!', 'success');
                this.updateMemoryDisplay();
                this.updateDisplay();
            } else {
                this.showMessage(`Assembly error: ${result.error} (line ${result.line})`, 'error');
            }
        } catch (error) {
            this.showMessage(`Assembly error: ${error.message}`, 'error');
        }
    }

    loadProgramIntoMemory(machineCode) {
        for (let entry of machineCode) {
            this.memory.write(entry.address, entry.instruction);
        }
    }

    loadExample() {
        const examples = [
            { name: 'Basic Math', code: TernaryAssembler.getExampleProgram() },
            { name: 'I/O Demo', code: TernaryAssembler.getSimpleIOExample() },
            { name: 'Stack Demo', code: TernaryAssembler.getStackExample() }
        ];

        // Simple example rotation for now
        const currentCode = document.getElementById('programEditor')?.value || '';
        let nextExample = examples[0];

        for (let i = 0; i < examples.length; i++) {
            if (currentCode.includes(examples[i].name)) {
                nextExample = examples[(i + 1) % examples.length];
                break;
            }
        }

        document.getElementById('programEditor').value = nextExample.code;
        this.showMessage(`Loaded: ${nextExample.name}`, 'info');
    }

    // Execution control
    run() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.cpu.run();
        this.updateRunningState();
        
        // Start UI update loop
        this.executionInterval = setInterval(() => {
            this.updateDisplay();
            
            if (this.cpu.halted || !this.cpu.running) {
                this.pause();
            }
        }, 1000 / 10); // 10 Hz UI updates
    }

    step() {
        if (this.isRunning) {
            this.pause();
        }
        
        const success = this.cpu.step();
        this.updateDisplay();
        
        if (!success || this.cpu.halted) {
            this.showMessage('Execution stopped', 'info');
        }
    }

    pause() {
        this.isRunning = false;
        this.cpu.pause();
        this.updateRunningState();
        
        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = null;
        }
    }

    reset() {
        this.pause();
        this.cpu.reset();
        this.memory.clear();
        this.clearGraphics();
        this.updateDisplay();
        this.updateMemoryDisplay();
        this.showMessage('System reset', 'info');
    }

    // Display updates
    updateDisplay() {
        this.updateRegisters();
        this.updateALU();
        this.updateDebugInfo();
    }

    updateRegisters() {
        const state = this.cpu.getState();
        
        // Update register displays
        const regMap = {
            'regPC': state.registers.pc,
            'regACC': state.registers.acc,
            'regIX': state.registers.ix,
            'regSP': state.registers.sp,
            'regFLAGS': state.registers.flags,
            'regR1': state.registers.r1,
            'regR2': state.registers.r2,
            'regR3': state.registers.r3,
            'regR4': state.registers.r4,
            'regR5': state.registers.r5,
            'regR6': state.registers.r6,
            'regR7': state.registers.r7,
            'regR8': state.registers.r8,
            'regR9': state.registers.r9
        };

        for (let [elementId, value] of Object.entries(regMap)) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
                // Add visual highlighting for changed values
                element.classList.add('highlight');
                setTimeout(() => element.classList.remove('highlight'), 500);
            }
        }

        // Update individual flag displays
        const flags = this.cpu.alu.flags;
        const flagMap = {
            'flagZero': flags.zero,
            'flagPositive': flags.positive,
            'flagNegative': flags.negative,
            'flagCarry': flags.carry,
            'flagOverflow': flags.overflow
        };

        for (let [elementId, value] of Object.entries(flagMap)) {
            const element = document.getElementById(elementId);
            if (element) {
                // Display trit values with appropriate styling
                element.textContent = value;
                element.className = 'flag-value';
                if (value === 1) {
                    element.classList.add('flag-positive');
                } else if (value === -1) {
                    element.classList.add('flag-negative');
                }
            }
        }
    }

    updateALU() {
        const state = this.cpu.getState();
        
        document.getElementById('lastOp').textContent = state.alu.lastOperation || 'None';
        document.getElementById('lastResult').textContent = state.alu.lastResult || '000000';
    }

    updateDebugInfo() {
        const state = this.cpu.getState();
        
        document.getElementById('currentInstruction').textContent = 
            state.execution.currentInstruction || 'None';
        document.getElementById('executionState').textContent = 
            state.execution.running ? 'Running' : state.execution.halted ? 'Halted' : 'Stopped';
        document.getElementById('cycleCount').textContent = state.execution.cycleCount;
    }

    updateMemoryDisplay() {
        const memoryDisplay = document.getElementById('memoryDisplay');
        const startAddrInput = document.getElementById('memoryStart');
        
        if (!memoryDisplay || !startAddrInput) return;

        const startAddr = parseInt(startAddrInput.value) || 0;
        const dump = this.memory.dump(startAddr, 16);
        
        memoryDisplay.innerHTML = '';
        
        for (let entry of dump) {
            const row = document.createElement('div');
            row.className = 'memory-row';
            
            const address = document.createElement('span');
            address.className = 'memory-address';
            address.textContent = entry.address;
            
            const value = document.createElement('span');
            value.className = 'memory-value';
            if (!entry.initialized) {
                value.classList.add('uninitialized');
            }
            value.textContent = `${entry.value} (${entry.decimal})`;
            
            row.appendChild(address);
            row.appendChild(value);
            memoryDisplay.appendChild(row);
        }
    }

    updateRunningState() {
        const runBtn = document.getElementById('runBtn');
        const stepBtn = document.getElementById('stepBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (runBtn) runBtn.disabled = this.isRunning;
        if (stepBtn) stepBtn.disabled = this.isRunning;
        if (pauseBtn) pauseBtn.disabled = !this.isRunning;
        
        // Add visual indicator
        document.body.classList.toggle('running', this.isRunning);
    }

    // Graphics and I/O
    updateGraphicsDisplay(address, character) {
        if (!this.graphicsContext) return;
        
        // Simple character mode: 24x16 characters
        const charWidth = 10;
        const charHeight = 10;
        const addr = address instanceof TernaryAddress ? address.toDecimal() : address;
        
        const x = (addr % 24) * charWidth;
        const y = Math.floor(addr / 24) * charHeight;
        
        // Clear the character cell
        this.graphicsContext.fillStyle = '#000000';
        this.graphicsContext.fillRect(x, y, charWidth, charHeight);
        
        // Draw the character
        this.graphicsContext.fillStyle = '#00ff00';
        this.graphicsContext.font = '8px monospace';
        this.graphicsContext.fillText(character, x + 1, y + 8);
    }

    outputToConsole(text) {
        const consoleOutput = document.getElementById('consoleOutput');
        if (consoleOutput) {
            consoleOutput.textContent += text;
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    }

    // Utility methods
    showMessage(message, type = 'info') {
        // Create a simple message display
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 15px;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            border-radius: 4px;
            z-index: 1000;
            transition: opacity 0.3s;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => document.body.removeChild(messageDiv), 300);
        }, 3000);
    }

    // Debugging interface
    setBreakpoint(address) {
        this.cpu.setBreakpoint(address);
        this.showMessage(`Breakpoint set at ${address}`, 'info');
    }

    clearBreakpoint(address) {
        this.cpu.clearBreakpoint(address);
        this.showMessage(`Breakpoint cleared at ${address}`, 'info');
    }

    setMemoryWatchpoint(address) {
        this.memory.setWatchpoint(address);
        this.showMessage(`Memory watchpoint set at ${address}`, 'info');
    }

    // Export/Import functionality
    exportState() {
        return {
            memory: this.memory.saveState(),
            cpu: this.cpu.getState(),
            timestamp: Date.now()
        };
    }

    importState(state) {
        this.pause();
        this.memory.loadState(state.memory);
        // CPU state restoration would need additional implementation
        this.updateDisplay();
        this.updateMemoryDisplay();
        this.showMessage('State imported', 'success');
    }

    // Performance monitoring
    getPerformanceStats() {
        return {
            memory: this.memory.getStats(),
            cpu: {
                cycleCount: this.cpu.cycleCount,
                instructionsPerSecond: this.cpu.cycleCount / (Date.now() / 1000),
                running: this.cpu.running,
                halted: this.cpu.halted
            }
        };
    }
}

// Initialize simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.simulator = new TernarySimulator();
    
    // Add some global helper functions for debugging
    window.debugFunctions = {
        setBreakpoint: (addr) => window.simulator.setBreakpoint(addr),
        clearBreakpoint: (addr) => window.simulator.clearBreakpoint(addr),
        setWatchpoint: (addr) => window.simulator.setMemoryWatchpoint(addr),
        dumpMemory: (start, count) => window.simulator.memory.dump(start, count),
        getStats: () => window.simulator.getPerformanceStats(),
        exportState: () => window.simulator.exportState(),
        importState: (state) => window.simulator.importState(state)
    };
    
    console.log('Balanced Ternary Simulator initialized');
    console.log('Debug functions available in window.debugFunctions');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernarySimulator };
}