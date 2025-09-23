/**
 * Main Simulator Controller
 * Coordinates all components and provides web interface
 */

class TernarySimulator {
    constructor() {
        this.memory = new TernaryMemory(9); // 9-trit addressing
        this.cpu = new TernaryCPU(this.memory);
        this.assembler = new TernaryAssembler();
        this.highlevelCompiler = null; // Initialize lazily
        this.io = new MemoryMappedIO(this.memory);
        
        this.isRunning = false;
        this.executionSpeed = 100; // Hz
        this.executionInterval = null;
        this.currentLanguage = 'assembly';
        
        // Enhanced debugging features
        this.sourceLines = [];
        this.breakpoints = new Set();
        this.currentSourceLine = -1;
        this.addressToLine = new Map();
        this.lineToAddress = new Map();
        this.memorySearchResults = [];
        this.memorySearchIndex = 0;
        this.isProfilingEnabled = false;
        this.instructionFrequency = new Map();
        this.startTime = Date.now();
        
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
        document.getElementById('loadHLExampleBtn')?.addEventListener('click', () => this.loadHighLevelExample());
        
        // Language selection
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', () => this.onLanguageChange());
        }
        
        // Memory controls
        document.getElementById('refreshMemoryBtn')?.addEventListener('click', () => this.updateMemoryDisplay());
        document.getElementById('prevPageBtn')?.addEventListener('click', () => this.previousMemoryPage());
        document.getElementById('nextPageBtn')?.addEventListener('click', () => this.nextMemoryPage());
        
        // Memory page controls
        const memoryPageInput = document.getElementById('memoryPage');
        const memoryPageSizeSelect = document.getElementById('memoryPageSize');
        
        if (memoryPageInput) {
            memoryPageInput.addEventListener('change', () => this.updateMemoryDisplay());
        }
        
        if (memoryPageSizeSelect) {
            memoryPageSizeSelect.addEventListener('change', () => {
                this.memory.pageSize = parseInt(memoryPageSizeSelect.value);
                this.updateMemoryDisplay();
            });
        }
        
        // Enhanced debugging controls
        document.getElementById('clearBreakpointsBtn')?.addEventListener('click', () => this.clearAllBreakpoints());
        document.getElementById('memorySearchBtn')?.addEventListener('click', () => this.searchMemory());
        document.getElementById('memorySearchNextBtn')?.addEventListener('click', () => this.searchMemoryNext());
        document.getElementById('memorySearchPrevBtn')?.addEventListener('click', () => this.searchMemoryPrev());
        document.getElementById('refreshStackBtn')?.addEventListener('click', () => this.updateStackDisplay());
        document.getElementById('resetProfileBtn')?.addEventListener('click', () => this.resetProfiler());
        document.getElementById('toggleProfilingBtn')?.addEventListener('click', () => this.toggleProfiling());
        
        // Editor enhancements
        const editor = document.getElementById('programEditor');
        if (editor) {
            editor.addEventListener('input', () => this.updateLineNumbers());
            editor.addEventListener('scroll', () => this.syncEditorScroll());
        }
        
        // Breakpoint gutter click handler
        document.getElementById('breakpointGutter')?.addEventListener('click', (e) => this.handleBreakpointClick(e));
        
        // Memory search on Enter key
        document.getElementById('memorySearchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchMemory();
        });
        
        this.updateLineNumbers();
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
        const languageSelect = document.getElementById('languageSelect');
        const currentLanguage = languageSelect?.value || 'assembly';
        
        // Store source lines for debugging
        this.sourceLines = sourceCode.split('\n');
        
        try {
            let result;
            
            if (currentLanguage === 'highlevel') {
                // Initialize compiler if not already done
                if (!this.highlevelCompiler) {
                    if (typeof TernaryHighLevelCompiler === 'undefined') {
                        this.showMessage('High-level compiler not available', 'error');
                        return;
                    }
                    this.highlevelCompiler = new TernaryHighLevelCompiler();
                }
                
                // Compile high-level language to assembly first
                const compileResult = this.highlevelCompiler.compile(sourceCode);
                
                if (!compileResult.success) {
                    this.showMessage(`Compilation error: ${compileResult.error}`, 'error');
                    return;
                }
                
                // Show generated assembly in console for debugging
                console.log('Generated Assembly:', compileResult.assembly);
                
                // Now assemble the generated assembly code
                result = this.assembler.assemble(compileResult.assembly, 0);
            } else {
                // Direct assembly
                result = this.assembler.assemble(sourceCode, 0);
            }
            
            if (result.success) {
                // Load program into memory
                this.loadProgramIntoMemory(result.machineCode);
                
                // Build line-to-address mapping for debugging
                this.buildLineToAddressMapping(result);
                
                // Set breakpoints that were set in the editor
                this.syncBreakpointsWithCPU();
                
                this.showMessage(`${currentLanguage === 'highlevel' ? 'Compilation and assembly' : 'Assembly'} successful!`, 'success');
                this.updateMemoryDisplay();
                this.updateDisplay();
                this.updateLineNumbers();
            } else {
                this.showMessage(`Assembly error: ${result.error} (line ${result.line})`, 'error');
            }
        } catch (error) {
            this.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    buildLineToAddressMapping(assemblyResult) {
        this.addressToLine.clear();
        this.lineToAddress.clear();
        
        if (assemblyResult.lineMapping) {
            // Use line mapping from assembler if available
            for (const [address, lineNumber] of assemblyResult.lineMapping.entries()) {
                this.addressToLine.set(address, lineNumber);
                this.lineToAddress.set(lineNumber, address);
            }
        } else {
            // Fallback: simple 1:1 mapping for basic assembly
            let address = 0;
            for (let lineNumber = 1; lineNumber <= this.sourceLines.length; lineNumber++) {
                const line = this.sourceLines[lineNumber - 1].trim();
                if (line && !line.startsWith(';') && !line.startsWith('.')) {
                    this.addressToLine.set(address, lineNumber);
                    this.lineToAddress.set(lineNumber, address);
                    address++;
                }
            }
        }
    }

    syncBreakpointsWithCPU() {
        // Clear CPU breakpoints
        this.cpu.clearAllBreakpoints();
        
        // Set CPU breakpoints for editor breakpoints that have address mappings
        for (const lineNumber of this.breakpoints) {
            const address = this.lineToAddress.get(lineNumber);
            if (address !== undefined) {
                this.cpu.setBreakpoint(address);
            }
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

    onLanguageChange() {
        const languageSelect = document.getElementById('languageSelect');
        const programEditor = document.getElementById('programEditor');
        const loadExampleBtn = document.getElementById('loadExampleBtn');
        const loadHLExampleBtn = document.getElementById('loadHLExampleBtn');
        const assembleBtn = document.getElementById('assembleBtn');
        
        if (!languageSelect) return;
        
        this.currentLanguage = languageSelect.value;
        
        if (this.currentLanguage === 'highlevel') {
            // Switch to high-level language mode
            if (programEditor) programEditor.placeholder = 'Enter your C-like high-level code here...';
            if (loadExampleBtn) loadExampleBtn.style.display = 'none';
            if (loadHLExampleBtn) loadHLExampleBtn.style.display = 'inline-block';
            if (assembleBtn) assembleBtn.textContent = 'Compile & Assemble';
            
            // Load default high-level example if available
            if (programEditor && !programEditor.value.trim() && typeof TernaryHighLevelCompiler !== 'undefined') {
                programEditor.value = TernaryHighLevelCompiler.getExampleProgram();
            }
        } else {
            // Switch to assembly mode
            if (programEditor) programEditor.placeholder = 'Enter your balanced ternary assembly code here...';
            if (loadExampleBtn) loadExampleBtn.style.display = 'inline-block';
            if (loadHLExampleBtn) loadHLExampleBtn.style.display = 'none';
            if (assembleBtn) assembleBtn.textContent = 'Assemble';
            
            // Load default assembly example
            if (programEditor && !programEditor.value.trim()) {
                programEditor.value = TernaryAssembler.getExampleProgram();
            }
        }
    }

    loadHighLevelExample() {
        if (typeof TernaryHighLevelCompiler === 'undefined') {
            this.showMessage('High-level compiler not available', 'error');
            return;
        }
        
        const examples = [
            { name: 'Basic Math', code: TernaryHighLevelCompiler.getExampleProgram() },
            { name: 'Loop Example', code: TernaryHighLevelCompiler.getLoopExample() },
            { name: 'Conditional', code: TernaryHighLevelCompiler.getConditionExample() }
        ];

        // Simple example rotation
        const currentCode = document.getElementById('programEditor')?.value || '';
        let nextExample = examples[0];

        for (let i = 0; i < examples.length; i++) {
            if (currentCode.includes(examples[i].name.split(' ')[0].toLowerCase())) {
                nextExample = examples[(i + 1) % examples.length];
                break;
            }
        }

        document.getElementById('programEditor').value = nextExample.code;
        this.showMessage(`Loaded HL: ${nextExample.name}`, 'info');
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
        
        if (this.cpu.halted) {
            this.showMessage('CPU is halted', 'info');
            return;
        }
        
        // Get current PC before stepping
        const currentPC = this.cpu.registers.get('pc').toDecimal();
        
        // Record current instruction for profiling
        if (this.isProfilingEnabled) {
            const instruction = this.memory.read(this.cpu.registers.get('pc'));
            this.recordInstructionExecution(instruction);
        }
        
        // Update current source line highlighting
        const lineNumber = this.addressToLine.get(currentPC);
        if (lineNumber !== undefined) {
            this.currentSourceLine = lineNumber;
            this.highlightCurrentLine();
        }
        
        const success = this.cpu.step();
        this.updateDisplay();
        this.updateStackDisplay();
        
        if (!success || this.cpu.halted) {
            this.currentSourceLine = -1;
            this.highlightCurrentLine();
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
        
        // Reset CPU registers but preserve memory program
        this.cpu.reset();
        
        // Clear only graphics and I/O, not program memory
        this.clearGraphics();
        
        // Clear change history for clean slate
        this.memory.clearChangeHistory();
        
        this.updateDisplay();
        this.updateMemoryDisplay();
        this.showMessage('System reset (program memory preserved)', 'info');
    }

    // Full reset that clears everything including program memory
    fullReset() {
        this.pause();
        this.cpu.reset();
        this.memory.clear();
        this.clearGraphics();
        this.updateDisplay();
        this.updateMemoryDisplay();
        this.showMessage('Full system reset', 'info');
    }

    // Display updates
    updateDisplay() {
        this.updateRegisters();
        this.updateALU();
        this.updateDebugInfo();
        this.updateSystemStatus();
    }

    updateRegisters() {
        const state = this.cpu.getState();
        
        // Update register displays
        const regMap = {
            'regPC': state.registers.pc,
            'regACC': state.registers.acc,
            'regIX': state.registers.ix,
            'regIX1': state.registers.ix1,
            'regIX2': state.registers.ix2,
            'regIX3': state.registers.ix3,
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

    updateSystemStatus() {
        // Update interrupt system status
        if (this.cpu.interruptController) {
            const interruptState = this.cpu.interruptController.getState();
            
            const interruptsEnabledEl = document.getElementById('interruptsEnabled');
            if (interruptsEnabledEl) {
                interruptsEnabledEl.textContent = interruptState.interruptEnabled;
            }
            
            const inInterruptHandlerEl = document.getElementById('inInterruptHandler');
            if (inInterruptHandlerEl) {
                inInterruptHandlerEl.textContent = interruptState.inInterruptHandler;
            }
            
            const pendingInterruptsEl = document.getElementById('pendingInterrupts');
            if (pendingInterruptsEl) {
                pendingInterruptsEl.textContent = 
                    interruptState.pendingInterrupts.length > 0 
                        ? interruptState.pendingInterrupts.join(', ')
                        : 'none';
            }
        }
        
        // Update system clock
        const systemClockEl = document.getElementById('systemClock');
        if (systemClockEl && this.cpu.systemClock !== undefined) {
            systemClockEl.textContent = this.cpu.systemClock;
        }
        
        // Update timer information
        if (this.cpu.clockManager) {
            const timerInfoEl = document.getElementById('timerInfo');
            if (timerInfoEl) {
                const timers = this.cpu.clockManager.listTimers();
                if (timers.length === 0) {
                    timerInfoEl.innerHTML = '<div>No hardware timers active</div>';
                } else {
                    let timerHtml = '';
                    timers.forEach(timerId => {
                        const timer = this.cpu.clockManager.getTimer(timerId);
                        if (timer) {
                            timerHtml += `<div>Timer ${timerId}: ${timer.isRunning() ? 'Running' : 'Stopped'}</div>`;
                        }
                    });
                    timerInfoEl.innerHTML = timerHtml;
                }
            }
        }
    }

    updateMemoryDisplay() {
        const memoryDisplay = document.getElementById('memoryDisplay');
        const memoryChanges = document.getElementById('memoryChanges');
        const pageInput = document.getElementById('memoryPage');
        
        if (!memoryDisplay) return;

        const page = parseInt(pageInput?.value) || 0;
        const pagedDump = this.memory.getPagedDump(page);
        
        // Create grid layout
        memoryDisplay.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'memory-grid';
        
        for (let row of pagedDump.grid) {
            for (let entry of row) {
                const cell = document.createElement('div');
                cell.className = 'memory-cell';
                cell.setAttribute('data-address', entry.address); // Add for search functionality
                if (!entry.initialized) {
                    cell.classList.add('uninitialized');
                }
                
                // Address
                const address = document.createElement('div');
                address.className = 'memory-address';
                address.textContent = entry.address;
                
                // Value in ternary
                const value = document.createElement('div');
                value.className = 'memory-value';
                value.textContent = entry.value;
                
                // Decimal value
                const decimal = document.createElement('div');
                decimal.className = 'memory-decimal';
                decimal.textContent = `(${entry.decimal})`;
                
                // Add hover tooltip for ternary representation
                cell.title = `Address: ${entry.address}\nTernary: ${entry.value}\nDecimal: ${entry.decimal}`;
                
                cell.appendChild(address);
                cell.appendChild(value);
                cell.appendChild(decimal);
                grid.appendChild(cell);
            }
        }
        
        memoryDisplay.appendChild(grid);
        
        // Update memory changes display
        if (memoryChanges) {
            this.updateMemoryChanges();
        }
    }

    updateMemoryChanges() {
        const memoryChanges = document.getElementById('memoryChanges');
        if (!memoryChanges) return;
        
        const changes = this.memory.getChangeHistory(10);
        memoryChanges.innerHTML = '';
        
        if (changes.length === 0) {
            memoryChanges.innerHTML = '<div style="color: #888; text-align: center;">No recent changes</div>';
            return;
        }
        
        for (let change of changes.reverse()) {
            const changeDiv = document.createElement('div');
            changeDiv.className = 'memory-change';
            
            const address = document.createElement('span');
            address.className = 'change-address';
            address.textContent = change.address;
            
            const values = document.createElement('span');
            values.className = 'change-values';
            values.innerHTML = `<span class="change-old">${change.oldValue}</span> → <span class="change-new">${change.newValue}</span>`;
            
            const time = document.createElement('span');
            time.className = 'change-time';
            const timeAgo = Date.now() - change.timestamp;
            time.textContent = timeAgo < 1000 ? 'now' : `${Math.floor(timeAgo/1000)}s`;
            
            changeDiv.appendChild(address);
            changeDiv.appendChild(values);
            changeDiv.appendChild(time);
            memoryChanges.appendChild(changeDiv);
        }
    }

    previousMemoryPage() {
        const pageInput = document.getElementById('memoryPage');
        if (pageInput) {
            const currentPage = parseInt(pageInput.value) || 0;
            if (currentPage > 0) {
                pageInput.value = currentPage - 1;
                this.updateMemoryDisplay();
            }
        }
    }

    nextMemoryPage() {
        const pageInput = document.getElementById('memoryPage');
        if (pageInput) {
            const currentPage = parseInt(pageInput.value) || 0;
            pageInput.value = currentPage + 1;
            this.updateMemoryDisplay();
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

    // Enhanced debugging methods
    updateLineNumbers() {
        const editor = document.getElementById('programEditor');
        const lineNumbers = document.getElementById('lineNumbers');
        const breakpointGutter = document.getElementById('breakpointGutter');
        
        if (!editor || !lineNumbers || !breakpointGutter) return;
        
        const lines = editor.value.split('\n');
        this.sourceLines = lines;
        
        // Update line numbers
        let numbersHtml = '';
        let gutterHtml = '';
        
        for (let i = 1; i <= lines.length; i++) {
            numbersHtml += `<div class="line-number" data-line="${i}">${i}</div>`;
            const hasBreakpoint = this.breakpoints.has(i);
            gutterHtml += `<div class="gutter-line" data-line="${i}" style="height: 1.4em; position: relative;">
                ${hasBreakpoint ? '<div class="breakpoint"></div>' : ''}
            </div>`;
        }
        
        lineNumbers.innerHTML = numbersHtml;
        breakpointGutter.innerHTML = gutterHtml;
    }

    syncEditorScroll() {
        const editor = document.getElementById('programEditor');
        const lineNumbers = document.getElementById('lineNumbers');
        const breakpointGutter = document.getElementById('breakpointGutter');
        
        if (!editor || !lineNumbers || !breakpointGutter) return;
        
        lineNumbers.scrollTop = editor.scrollTop;
        breakpointGutter.scrollTop = editor.scrollTop;
    }

    handleBreakpointClick(event) {
        const lineDiv = event.target.closest('.gutter-line');
        if (!lineDiv) return;
        
        const lineNumber = parseInt(lineDiv.dataset.line);
        this.toggleBreakpoint(lineNumber);
    }

    toggleBreakpoint(lineNumber) {
        if (this.breakpoints.has(lineNumber)) {
            this.breakpoints.delete(lineNumber);
            // Also clear CPU breakpoint if we have address mapping
            const address = this.lineToAddress.get(lineNumber);
            if (address !== undefined) {
                this.cpu.clearBreakpoint(address);
            }
        } else {
            this.breakpoints.add(lineNumber);
            // Also set CPU breakpoint if we have address mapping
            const address = this.lineToAddress.get(lineNumber);
            if (address !== undefined) {
                this.cpu.setBreakpoint(address);
            }
        }
        this.updateLineNumbers();
    }

    clearAllBreakpoints() {
        this.breakpoints.clear();
        this.cpu.clearAllBreakpoints();
        this.updateLineNumbers();
        this.showMessage('All breakpoints cleared', 'info');
    }

    highlightCurrentLine() {
        const lineNumbers = document.getElementById('lineNumbers');
        if (!lineNumbers) return;
        
        // Clear previous highlights
        lineNumbers.querySelectorAll('.current-line-highlight').forEach(el => 
            el.classList.remove('current-line-highlight'));
        
        if (this.currentSourceLine > 0 && this.currentSourceLine <= this.sourceLines.length) {
            const lineDiv = lineNumbers.querySelector(`[data-line="${this.currentSourceLine}"]`);
            if (lineDiv) {
                lineDiv.classList.add('current-line-highlight');
            }
        }
    }

    searchMemory() {
        const searchInput = document.getElementById('memorySearchInput');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) return;
        
        this.memorySearchResults = [];
        this.memorySearchIndex = 0;
        
        // Search in memory values and addresses
        const dump = this.memory.dump(0, 1000); // Search first 1000 locations
        
        for (const entry of dump) {
            const addressMatch = entry.address.includes(searchTerm);
            const valueMatch = entry.value.includes(searchTerm);
            const decimalMatch = entry.decimal.toString().includes(searchTerm);
            
            if (addressMatch || valueMatch || decimalMatch) {
                this.memorySearchResults.push({
                    address: entry.address,
                    reason: addressMatch ? 'address' : valueMatch ? 'value' : 'decimal'
                });
            }
        }
        
        if (this.memorySearchResults.length > 0) {
            this.highlightSearchResult(0);
            this.showMessage(`Found ${this.memorySearchResults.length} results`, 'info');
        } else {
            this.showMessage('No results found', 'info');
        }
    }

    searchMemoryNext() {
        if (this.memorySearchResults.length === 0) return;
        
        this.memorySearchIndex = (this.memorySearchIndex + 1) % this.memorySearchResults.length;
        this.highlightSearchResult(this.memorySearchIndex);
    }

    searchMemoryPrev() {
        if (this.memorySearchResults.length === 0) return;
        
        this.memorySearchIndex = this.memorySearchIndex === 0 ? 
            this.memorySearchResults.length - 1 : this.memorySearchIndex - 1;
        this.highlightSearchResult(this.memorySearchIndex);
    }

    highlightSearchResult(index) {
        if (index < 0 || index >= this.memorySearchResults.length) return;
        
        const result = this.memorySearchResults[index];
        
        // Clear previous highlights
        document.querySelectorAll('.memory-search-result').forEach(el => 
            el.classList.remove('memory-search-result'));
        
        // Navigate to the page containing this address
        const addr = new TernaryAddress(result.address, 9);
        const addressDecimal = addr.toDecimal();
        const pageSize = parseInt(document.getElementById('memoryPageSize')?.value || '16');
        const page = Math.floor(addressDecimal / pageSize);
        
        document.getElementById('memoryPage').value = page;
        this.updateMemoryDisplay();
        
        // Highlight the result after a short delay to ensure DOM is updated
        setTimeout(() => {
            const memoryCell = document.querySelector(`[data-address="${result.address}"]`);
            if (memoryCell) {
                memoryCell.classList.add('memory-search-result');
                memoryCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    updateStackDisplay() {
        const stackDisplay = document.getElementById('stackDisplay');
        const stackDepthInput = document.getElementById('stackDepth');
        
        if (!stackDisplay || !stackDepthInput) return;
        
        const depth = parseInt(stackDepthInput.value) || 10;
        const sp = this.cpu.registers.get('sp');
        const spDecimal = sp.toDecimal();
        
        let html = '';
        
        for (let i = 0; i < depth; i++) {
            const address = new TernaryAddress(spDecimal + i, 9);
            const value = this.memory.read(address);
            const isSP = i === 0;
            
            html += `
                <div class="stack-entry ${isSP ? 'stack-sp-pointer' : ''}">
                    <span class="stack-address">${address.toString()}</span>
                    <span class="stack-value">${value.toString()} (${value.toDecimal()})</span>
                    ${isSP ? '<span style="color: #ffff00;"> ← SP</span>' : ''}
                </div>
            `;
        }
        
        stackDisplay.innerHTML = html || '<div style="color: #888;">Stack empty</div>';
    }

    resetProfiler() {
        this.instructionFrequency.clear();
        this.startTime = Date.now();
        this.updateProfilerDisplay();
        this.showMessage('Profiler reset', 'info');
    }

    toggleProfiling() {
        this.isProfilingEnabled = !this.isProfilingEnabled;
        const button = document.getElementById('toggleProfilingBtn');
        
        if (button) {
            button.textContent = this.isProfilingEnabled ? 'Stop Profiling' : 'Start Profiling';
            button.classList.toggle('active', this.isProfilingEnabled);
        }
        
        this.showMessage(`Profiling ${this.isProfilingEnabled ? 'started' : 'stopped'}`, 'info');
    }

    updateProfilerDisplay() {
        const instrCountElement = document.getElementById('instrCount');
        const cyclesPerSecElement = document.getElementById('cyclesPerSec');
        const mostUsedInstrElement = document.getElementById('mostUsedInstr');
        const frequencyChart = document.getElementById('instrFrequency');
        
        if (!instrCountElement || !cyclesPerSecElement || !mostUsedInstrElement || !frequencyChart) return;
        
        const totalInstructions = Array.from(this.instructionFrequency.values()).reduce((a, b) => a + b, 0);
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const cyclesPerSec = elapsedSeconds > 0 ? (this.cpu.cycleCount / elapsedSeconds).toFixed(1) : '0';
        
        instrCountElement.textContent = totalInstructions;
        cyclesPerSecElement.textContent = cyclesPerSec;
        
        // Find most used instruction
        let mostUsed = 'None';
        let maxCount = 0;
        for (const [instr, count] of this.instructionFrequency.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostUsed = instr;
            }
        }
        mostUsedInstrElement.textContent = `${mostUsed} (${maxCount})`;
        
        // Update frequency chart
        let chartHtml = '';
        const sortedFreq = Array.from(this.instructionFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10
        
        const maxFreq = sortedFreq.length > 0 ? sortedFreq[0][1] : 1;
        
        for (const [instr, count] of sortedFreq) {
            const percentage = (count / maxFreq) * 100;
            chartHtml += `
                <div class="frequency-bar">
                    <span class="frequency-name">${instr}</span>
                    <div class="frequency-visual" style="width: ${percentage}%"></div>
                    <span class="frequency-count">${count}</span>
                </div>
            `;
        }
        
        frequencyChart.innerHTML = chartHtml || '<div style="color: #888;">No data</div>';
    }

    recordInstructionExecution(instruction) {
        if (!this.isProfilingEnabled) return;
        
        // Decode instruction to get opcode name
        const opcode = instruction.toDecimal() >> 3; // Get upper 3 trits as opcode
        const opcodes = Object.keys(this.assembler.opcodes);
        const instrName = opcodes.find(name => this.assembler.opcodes[name] === opcode) || 'UNKNOWN';
        
        this.instructionFrequency.set(instrName, (this.instructionFrequency.get(instrName) || 0) + 1);
        this.updateProfilerDisplay();
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