/**
 * Balanced Ternary Operating System (BTOS)
 * A DOS-like operating system for the Balanced Ternary CPU Simulator
 * Provides file system operations, process management, and shell interface
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

/**
 * Process Control Block - represents a running process
 */
class ProcessControlBlock {
    constructor(pid, name, startAddress, size) {
        this.pid = pid;
        this.name = name;
        this.state = 'READY'; // READY, RUNNING, BLOCKED, TERMINATED
        this.startAddress = startAddress;
        this.size = size;
        this.priority = 0;
        this.registers = null; // Saved register state
        this.memorySegments = [];
        this.openFiles = new Map();
        this.createdTime = Date.now();
        this.cpuTime = 0;
    }
}

/**
 * Mutex implementation for process synchronization
 */
class TernaryMutex {
    constructor(name) {
        this.name = name;
        this.locked = false;
        this.owner = null;
        this.waitQueue = [];
    }

    lock(process) {
        if (!this.locked) {
            this.locked = true;
            this.owner = process;
            return true;
        } else {
            this.waitQueue.push(process);
            return false;
        }
    }

    unlock(process) {
        if (this.owner === process) {
            this.locked = false;
            this.owner = null;
            if (this.waitQueue.length > 0) {
                const nextProcess = this.waitQueue.shift();
                this.locked = true;
                this.owner = nextProcess;
                return nextProcess;
            }
        }
        return null;
    }
}

/**
 * Semaphore implementation for resource management
 */
class TernarySemaphore {
    constructor(name, initialValue) {
        this.name = name;
        this.value = initialValue;
        this.waitQueue = [];
    }

    wait(process) {
        this.value--;
        if (this.value < 0) {
            this.waitQueue.push(process);
            return false; // Process should be blocked
        }
        return true; // Process can continue
    }

    signal() {
        this.value++;
        if (this.waitQueue.length > 0) {
            return this.waitQueue.shift(); // Return process to wake up
        }
        return null;
    }
}

/**
 * Memory Allocator - manages dynamic memory allocation
 */
class MemoryAllocator {
    constructor(totalMemory) {
        this.totalMemory = totalMemory;
        this.freeBlocks = [{ start: 1000, size: totalMemory - 1000 }]; // Reserve first 1000 addresses for OS
        this.allocatedBlocks = new Map(); // address -> { size, owner }
        this.fragmentation = 0;
    }

    allocate(size, owner) {
        // First-fit allocation strategy
        for (let i = 0; i < this.freeBlocks.length; i++) {
            const block = this.freeBlocks[i];
            if (block.size >= size) {
                const allocatedAddress = block.start;
                
                // Split the block if necessary
                if (block.size > size) {
                    block.start += size;
                    block.size -= size;
                } else {
                    this.freeBlocks.splice(i, 1);
                }
                
                this.allocatedBlocks.set(allocatedAddress, { size, owner });
                return allocatedAddress;
            }
        }
        return null; // Out of memory
    }

    deallocate(address) {
        const block = this.allocatedBlocks.get(address);
        if (!block) {
            return false;
        }

        this.allocatedBlocks.delete(address);
        
        // Add back to free blocks and merge adjacent blocks
        const newBlock = { start: address, size: block.size };
        this.freeBlocks.push(newBlock);
        this.mergeFreeBlocks();
        
        return true;
    }

    mergeFreeBlocks() {
        this.freeBlocks.sort((a, b) => a.start - b.start);
        
        for (let i = 0; i < this.freeBlocks.length - 1; i++) {
            const current = this.freeBlocks[i];
            const next = this.freeBlocks[i + 1];
            
            if (current.start + current.size === next.start) {
                current.size += next.size;
                this.freeBlocks.splice(i + 1, 1);
                i--; // Check this block again with the next one
            }
        }
    }

    getStats() {
        const totalAllocated = Array.from(this.allocatedBlocks.values())
            .reduce((sum, block) => sum + block.size, 0);
        const totalFree = this.freeBlocks.reduce((sum, block) => sum + block.size, 0);
        
        return {
            totalMemory: this.totalMemory,
            allocated: totalAllocated,
            free: totalFree,
            fragmentation: this.freeBlocks.length,
            utilizationPercent: (totalAllocated / this.totalMemory) * 100
        };
    }
}

/**
 * Balanced Ternary Operating System
 */
class BalancedTernaryOS {
    constructor(cpu, memory, diskDrive) {
        this.cpu = cpu;
        this.memory = memory;
        this.diskDrive = diskDrive;
        
        // Process management
        this.processes = new Map();
        this.currentProcess = null;
        this.nextPID = 1;
        this.scheduler = null;
        
        // Memory management
        this.memoryAllocator = new MemoryAllocator(memory.maxAddress);
        
        // Synchronization primitives
        this.mutexes = new Map();
        this.semaphores = new Map();
        
        // Shell state
        this.currentDirectory = '/';
        this.environment = new Map();
        this.commandHistory = [];
        this.shellRunning = false;
        
        // System state
        this.booted = false;
        this.systemTime = 0;
        
        // Built-in commands
        this.commands = new Map();
        this.initializeCommands();
        
        // Initialize environment variables
        this.initializeEnvironment();
        
        // Load OS into memory
        this.loadOperatingSystem();
    }

    initializeEnvironment() {
        this.environment.set('PATH', '/bin');
        this.environment.set('HOME', '/');
        this.environment.set('PROMPT', 'BTOS> ');
        this.environment.set('VERSION', '1.0');
    }

    initializeCommands() {
        this.commands.set('help', this.cmdHelp.bind(this));
        this.commands.set('dir', this.cmdDir.bind(this));
        this.commands.set('ls', this.cmdDir.bind(this)); // Unix alias
        this.commands.set('cd', this.cmdChangeDirectory.bind(this));
        this.commands.set('mkdir', this.cmdMakeDirectory.bind(this));
        this.commands.set('rmdir', this.cmdRemoveDirectory.bind(this));
        this.commands.set('copy', this.cmdCopy.bind(this));
        this.commands.set('cp', this.cmdCopy.bind(this)); // Unix alias
        this.commands.set('del', this.cmdDelete.bind(this));
        this.commands.set('rm', this.cmdDelete.bind(this)); // Unix alias
        this.commands.set('type', this.cmdType.bind(this));
        this.commands.set('cat', this.cmdType.bind(this)); // Unix alias
        this.commands.set('cls', this.cmdClear.bind(this));
        this.commands.set('clear', this.cmdClear.bind(this)); // Unix alias
        this.commands.set('mem', this.cmdMemory.bind(this));
        this.commands.set('ps', this.cmdProcesses.bind(this));
        this.commands.set('kill', this.cmdKill.bind(this));
        this.commands.set('run', this.cmdRun.bind(this));
        this.commands.set('exec', this.cmdRun.bind(this)); // Alias
        this.commands.set('exit', this.cmdExit.bind(this));
        this.commands.set('quit', this.cmdExit.bind(this)); // Alias
        this.commands.set('ver', this.cmdVersion.bind(this));
        this.commands.set('time', this.cmdTime.bind(this));
        this.commands.set('date', this.cmdTime.bind(this)); // Alias
        this.commands.set('set', this.cmdSet.bind(this));
        this.commands.set('echo', this.cmdEcho.bind(this));
        this.commands.set('history', this.cmdHistory.bind(this));
        this.commands.set('mutex', this.cmdMutex.bind(this));
        this.commands.set('semaphore', this.cmdSemaphore.bind(this));
    }

    loadOperatingSystem() {
        // Load OS kernel into low memory (addresses 0-999)
        const osKernel = this.createOSKernel();
        for (let i = 0; i < osKernel.length && i < 1000; i++) {
            this.memory.write(new TernaryAddress(i), osKernel[i]);
        }
        
        // Create OS process
        const osProcess = new ProcessControlBlock(0, 'KERNEL', 0, 1000);
        osProcess.state = 'RUNNING';
        this.processes.set(0, osProcess);
        this.currentProcess = osProcess;
        
        this.booted = true;
    }

    createOSKernel() {
        // This would be the actual OS kernel code in assembly
        // For now, create a simple boot sequence
        const kernel = [];
        
        // Boot message
        const bootMessage = "BTOS v1.0 - Balanced Ternary Operating System\n";
        const messageData = this.diskDrive.stringToTernaryData(bootMessage);
        
        for (let i = 0; i < Math.min(messageData.length, 100); i++) {
            kernel.push(messageData[i]);
        }
        
        // Fill remaining space with NOPs or halt instructions
        while (kernel.length < 1000) {
            kernel.push(new Tryte(0)); // NOP equivalent
        }
        
        return kernel;
    }

    boot() {
        if (!this.booted) {
            this.loadOperatingSystem();
        }
        
        this.shellRunning = true;
        this.outputLine("BTOS v1.0 - Balanced Ternary Operating System");
        this.outputLine("Copyright (c) 2024 Ternary Systems");
        this.outputLine("");
        this.outputLine("Type 'help' for available commands.");
        this.outputLine("");
        this.showPrompt();
        
        return true;
    }

    shutdown() {
        this.shellRunning = false;
        this.outputLine("System shutting down...");
        this.booted = false;
        return true;
    }

    processCommand(input) {
        if (!input || !input.trim()) {
            this.showPrompt();
            return;
        }

        const trimmedInput = input.trim();
        this.commandHistory.push(trimmedInput);
        
        const parts = this.parseCommandLine(trimmedInput);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (this.commands.has(command)) {
            try {
                this.commands.get(command)(args);
            } catch (error) {
                this.outputLine(`Error: ${error.message}`);
            }
        } else {
            // Try to execute as a program
            this.executeProgram(command, args);
        }
        
        this.showPrompt();
    }

    parseCommandLine(input) {
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            parts.push(current);
        }
        
        return parts;
    }

    executeProgram(programName, args) {
        // Try to find and execute a program file
        const programPath = this.resolvePath(programName);
        
        if (this.diskDrive.files.has(programPath)) {
            this.cmdRun([programName, ...args]);
        } else {
            this.outputLine(`'${programName}' is not recognized as an internal or external command.`);
        }
    }

    resolvePath(path) {
        if (path.startsWith('/')) {
            return path;
        }
        
        if (this.currentDirectory === '/') {
            return '/' + path;
        }
        
        return this.currentDirectory + '/' + path;
    }

    outputLine(text) {
        // This should be connected to the simulator's console output
        if (typeof window !== 'undefined' && window.simulator) {
            window.simulator.outputToConsole(text + '\n');
        } else {
            console.log(text);
        }
    }

    showPrompt() {
        const prompt = this.environment.get('PROMPT') || 'BTOS> ';
        this.outputLine(prompt.replace(/>/g, this.currentDirectory + '>'));
    }

    // Command implementations
    cmdHelp(args) {
        this.outputLine("Available commands:");
        this.outputLine("");
        this.outputLine("File Operations:");
        this.outputLine("  DIR, LS          - List directory contents");
        this.outputLine("  CD <dir>         - Change directory");
        this.outputLine("  MKDIR <dir>      - Create directory");
        this.outputLine("  RMDIR <dir>      - Remove directory");
        this.outputLine("  COPY <src> <dst> - Copy file");
        this.outputLine("  DEL, RM <file>   - Delete file");
        this.outputLine("  TYPE, CAT <file> - Display file contents");
        this.outputLine("");
        this.outputLine("System Commands:");
        this.outputLine("  CLS, CLEAR       - Clear screen");
        this.outputLine("  MEM              - Display memory usage");
        this.outputLine("  PS               - List running processes");
        this.outputLine("  KILL <pid>       - Terminate process");
        this.outputLine("  RUN <program>    - Execute program");
        this.outputLine("  VER              - Display OS version");
        this.outputLine("  TIME, DATE       - Display system time");
        this.outputLine("  EXIT, QUIT       - Exit shell");
        this.outputLine("");
        this.outputLine("Synchronization:");
        this.outputLine("  MUTEX <cmd>      - Mutex operations");
        this.outputLine("  SEMAPHORE <cmd>  - Semaphore operations");
        this.outputLine("");
        this.outputLine("Other Commands:");
        this.outputLine("  SET <var>=<val>  - Set environment variable");
        this.outputLine("  ECHO <text>      - Display text");
        this.outputLine("  HISTORY          - Show command history");
    }

    cmdDir(args) {
        try {
            const path = args.length > 0 ? this.resolvePath(args[0]) : this.currentDirectory;
            const contents = this.diskDrive.listDirectory(path);
            
            this.outputLine(`Directory of ${path}`);
            this.outputLine("");
            
            let totalFiles = 0;
            let totalSize = 0;
            
            for (const item of contents) {
                const size = item.size || 0;
                const type = item.type === 'directory' ? '<DIR>' : '     ';
                const date = new Date(item.created || Date.now()).toLocaleDateString();
                
                this.outputLine(`${date}  ${type}  ${size.toString().padStart(8)} ${item.name}`);
                
                if (item.type !== 'directory') {
                    totalFiles++;
                    totalSize += size;
                }
            }
            
            this.outputLine("");
            this.outputLine(`${totalFiles} file(s)  ${totalSize} bytes`);
            
        } catch (error) {
            this.outputLine(`Directory not found: ${error.message}`);
        }
    }

    cmdChangeDirectory(args) {
        if (args.length === 0) {
            this.outputLine(this.currentDirectory);
            return;
        }
        
        try {
            const newPath = this.resolvePath(args[0]);
            
            if (this.diskDrive.directories.has(newPath)) {
                this.currentDirectory = newPath;
            } else {
                this.outputLine(`Directory not found: ${args[0]}`);
            }
        } catch (error) {
            this.outputLine(`Error: ${error.message}`);
        }
    }

    cmdMakeDirectory(args) {
        if (args.length === 0) {
            this.outputLine("Usage: MKDIR <directory>");
            return;
        }
        
        try {
            const path = this.resolvePath(args[0]);
            this.diskDrive.createDirectory(path);
            this.outputLine(`Directory created: ${args[0]}`);
        } catch (error) {
            this.outputLine(`Error: ${error.message}`);
        }
    }

    cmdRemoveDirectory(args) {
        if (args.length === 0) {
            this.outputLine("Usage: RMDIR <directory>");
            return;
        }
        
        try {
            // Implementation would need to be added to disk drive
            this.outputLine("RMDIR not yet implemented");
        } catch (error) {
            this.outputLine(`Error: ${error.message}`);
        }
    }

    cmdCopy(args) {
        if (args.length < 2) {
            this.outputLine("Usage: COPY <source> <destination>");
            return;
        }
        
        try {
            // Implementation would need to be added
            this.outputLine("COPY not yet implemented");
        } catch (error) {
            this.outputLine(`Error: ${error.message}`);
        }
    }

    cmdDelete(args) {
        if (args.length === 0) {
            this.outputLine("Usage: DEL <file>");
            return;
        }
        
        try {
            const path = this.resolvePath(args[0]);
            this.diskDrive.deleteFile(path);
            this.outputLine(`File deleted: ${args[0]}`);
        } catch (error) {
            this.outputLine(`Error: ${error.message}`);
        }
    }

    cmdType(args) {
        if (args.length === 0) {
            this.outputLine("Usage: TYPE <file>");
            return;
        }
        
        try {
            const path = this.resolvePath(args[0]);
            const file = this.diskDrive.files.get(path);
            
            if (!file) {
                this.outputLine(`File not found: ${args[0]}`);
                return;
            }
            
            const content = this.diskDrive.ternaryDataToString(file.data);
            this.outputLine(content);
            
        } catch (error) {
            this.outputLine(`Error: ${error.message}`);
        }
    }

    cmdClear(args) {
        // Clear the console output
        if (typeof window !== 'undefined' && window.simulator) {
            const console = document.getElementById('consoleOutput');
            if (console) {
                console.textContent = '';
            }
        }
    }

    cmdMemory(args) {
        const stats = this.memoryAllocator.getStats();
        
        this.outputLine("Memory Status:");
        this.outputLine(`Total Memory: ${stats.totalMemory} addresses`);
        this.outputLine(`Allocated: ${stats.allocated} addresses (${stats.utilizationPercent.toFixed(1)}%)`);
        this.outputLine(`Free: ${stats.free} addresses`);
        this.outputLine(`Fragmentation: ${stats.fragmentation} blocks`);
    }

    cmdProcesses(args) {
        this.outputLine("Process List:");
        this.outputLine("PID  Name        State    Memory   CPU Time");
        this.outputLine("---  ----------  -------  -------  --------");
        
        for (const [pid, process] of this.processes) {
            const pidStr = pid.toString().padStart(3);
            const nameStr = process.name.padEnd(10);
            const stateStr = process.state.padEnd(7);
            const memStr = process.size.toString().padStart(7);
            const cpuStr = process.cpuTime.toString().padStart(8);
            
            this.outputLine(`${pidStr}  ${nameStr}  ${stateStr}  ${memStr}  ${cpuStr}`);
        }
    }

    cmdKill(args) {
        if (args.length === 0) {
            this.outputLine("Usage: KILL <pid>");
            return;
        }
        
        const pid = parseInt(args[0]);
        if (this.processes.has(pid)) {
            if (pid === 0) {
                this.outputLine("Cannot kill system process");
                return;
            }
            
            this.processes.delete(pid);
            this.outputLine(`Process ${pid} terminated`);
        } else {
            this.outputLine(`Process ${pid} not found`);
        }
    }

    cmdRun(args) {
        if (args.length === 0) {
            this.outputLine("Usage: RUN <program>");
            return;
        }
        
        try {
            const programPath = this.resolvePath(args[0]);
            const file = this.diskDrive.files.get(programPath);
            
            if (!file) {
                this.outputLine(`Program not found: ${args[0]}`);
                return;
            }
            
            // Allocate memory for the program
            const memAddress = this.memoryAllocator.allocate(file.size, this.nextPID);
            if (!memAddress) {
                this.outputLine("Not enough memory to load program");
                return;
            }
            
            // Load program into memory
            for (let i = 0; i < file.data.length; i++) {
                this.memory.write(new TernaryAddress(memAddress + i), file.data[i]);
            }
            
            // Create process
            const process = new ProcessControlBlock(this.nextPID, args[0], memAddress, file.size);
            this.processes.set(this.nextPID, process);
            
            this.outputLine(`Started process ${this.nextPID}: ${args[0]}`);
            this.nextPID++;
            
            // For now, just indicate the program was loaded
            // Actual execution would require CPU scheduling
            
        } catch (error) {
            this.outputLine(`Error: ${error.message}`);
        }
    }

    cmdExit(args) {
        this.shellRunning = false;
        this.outputLine("Goodbye!");
    }

    cmdVersion(args) {
        this.outputLine(`BTOS Version ${this.environment.get('VERSION')}`);
        this.outputLine("Balanced Ternary Operating System");
        this.outputLine("Built for Ternary CPU Simulator");
    }

    cmdTime(args) {
        const now = new Date();
        this.outputLine(`Current time: ${now.toLocaleString()}`);
        this.outputLine(`System uptime: ${this.systemTime} cycles`);
    }

    cmdSet(args) {
        if (args.length === 0) {
            // Display all environment variables
            this.outputLine("Environment Variables:");
            for (const [key, value] of this.environment) {
                this.outputLine(`${key}=${value}`);
            }
        } else {
            const assignment = args.join(' ');
            const equalIndex = assignment.indexOf('=');
            
            if (equalIndex > 0) {
                const key = assignment.substring(0, equalIndex);
                const value = assignment.substring(equalIndex + 1);
                this.environment.set(key, value);
                this.outputLine(`${key}=${value}`);
            } else {
                this.outputLine("Usage: SET <variable>=<value>");
            }
        }
    }

    cmdEcho(args) {
        this.outputLine(args.join(' '));
    }

    cmdHistory(args) {
        this.outputLine("Command History:");
        for (let i = 0; i < this.commandHistory.length; i++) {
            this.outputLine(`${(i + 1).toString().padStart(3)}: ${this.commandHistory[i]}`);
        }
    }

    cmdMutex(args) {
        if (args.length === 0) {
            this.outputLine("Usage: MUTEX <create|lock|unlock|list> <name>");
            return;
        }
        
        const operation = args[0].toLowerCase();
        const name = args[1];
        
        switch (operation) {
            case 'create':
                if (!name) {
                    this.outputLine("Usage: MUTEX CREATE <name>");
                    return;
                }
                this.mutexes.set(name, new TernaryMutex(name));
                this.outputLine(`Mutex '${name}' created`);
                break;
                
            case 'list':
                this.outputLine("Active Mutexes:");
                for (const [name, mutex] of this.mutexes) {
                    const status = mutex.locked ? `LOCKED (${mutex.owner?.name || 'unknown'})` : 'UNLOCKED';
                    this.outputLine(`  ${name}: ${status}`);
                }
                break;
                
            default:
                this.outputLine("Unknown mutex operation");
        }
    }

    cmdSemaphore(args) {
        if (args.length === 0) {
            this.outputLine("Usage: SEMAPHORE <create|wait|signal|list> <name> [value]");
            return;
        }
        
        const operation = args[0].toLowerCase();
        const name = args[1];
        
        switch (operation) {
            case 'create':
                if (!name) {
                    this.outputLine("Usage: SEMAPHORE CREATE <name> <initial_value>");
                    return;
                }
                const value = parseInt(args[2]) || 1;
                this.semaphores.set(name, new TernarySemaphore(name, value));
                this.outputLine(`Semaphore '${name}' created with value ${value}`);
                break;
                
            case 'list':
                this.outputLine("Active Semaphores:");
                for (const [name, semaphore] of this.semaphores) {
                    this.outputLine(`  ${name}: value=${semaphore.value}, waiting=${semaphore.waitQueue.length}`);
                }
                break;
                
            default:
                this.outputLine("Unknown semaphore operation");
        }
    }

    // System call interface for programs
    systemCall(callNumber, ...args) {
        switch (callNumber) {
            case 1: // Exit
                return this.sysExit(args[0]);
            case 2: // Read file
                return this.sysRead(args[0], args[1], args[2]);
            case 3: // Write file
                return this.sysWrite(args[0], args[1], args[2]);
            case 4: // Open file
                return this.sysOpen(args[0], args[1]);
            case 5: // Close file
                return this.sysClose(args[0]);
            case 6: // Allocate memory
                return this.sysAlloc(args[0]);
            case 7: // Free memory
                return this.sysFree(args[0]);
            default:
                return -1; // Invalid system call
        }
    }

    sysExit(exitCode) {
        if (this.currentProcess && this.currentProcess.pid !== 0) {
            this.currentProcess.state = 'TERMINATED';
            this.memoryAllocator.deallocate(this.currentProcess.startAddress);
            this.processes.delete(this.currentProcess.pid);
        }
        return 0;
    }

    sysRead(handle, buffer, size) {
        // Implementation for file reading
        return 0;
    }

    sysWrite(handle, buffer, size) {
        // Implementation for file writing
        return 0;
    }

    sysOpen(filename, mode) {
        // Implementation for file opening
        return 0;
    }

    sysClose(handle) {
        // Implementation for file closing
        return 0;
    }

    sysAlloc(size) {
        if (this.currentProcess) {
            return this.memoryAllocator.allocate(size, this.currentProcess.pid);
        }
        return null;
    }

    sysFree(address) {
        return this.memoryAllocator.deallocate(address);
    }

    // Export OS state for snapshots
    exportState() {
        return {
            processes: Array.from(this.processes.entries()).map(([pid, proc]) => ({
                pid,
                name: proc.name,
                state: proc.state,
                startAddress: proc.startAddress,
                size: proc.size,
                priority: proc.priority,
                cpuTime: proc.cpuTime
            })),
            currentDirectory: this.currentDirectory,
            environment: Array.from(this.environment.entries()),
            commandHistory: [...this.commandHistory],
            memoryAllocator: {
                freeBlocks: [...this.memoryAllocator.freeBlocks],
                allocatedBlocks: Array.from(this.memoryAllocator.allocatedBlocks.entries())
            },
            mutexes: Array.from(this.mutexes.entries()).map(([name, mutex]) => ({
                name,
                locked: mutex.locked,
                owner: mutex.owner?.pid || null
            })),
            semaphores: Array.from(this.semaphores.entries()).map(([name, sem]) => ({
                name,
                value: sem.value,
                waitQueueLength: sem.waitQueue.length
            })),
            systemTime: this.systemTime,
            nextPID: this.nextPID,
            booted: this.booted,
            shellRunning: this.shellRunning
        };
    }

    // Import OS state from snapshots
    importState(state) {
        // Restore processes
        this.processes.clear();
        for (const procData of state.processes) {
            const proc = new ProcessControlBlock(
                procData.pid,
                procData.name,
                procData.startAddress,
                procData.size
            );
            proc.state = procData.state;
            proc.priority = procData.priority;
            proc.cpuTime = procData.cpuTime;
            this.processes.set(procData.pid, proc);
        }

        // Restore system state
        this.currentDirectory = state.currentDirectory;
        this.environment = new Map(state.environment);
        this.commandHistory = [...state.commandHistory];
        this.systemTime = state.systemTime;
        this.nextPID = state.nextPID;
        this.booted = state.booted;
        this.shellRunning = state.shellRunning;

        // Restore memory allocator
        this.memoryAllocator.freeBlocks = [...state.memoryAllocator.freeBlocks];
        this.memoryAllocator.allocatedBlocks = new Map(state.memoryAllocator.allocatedBlocks);

        // Restore synchronization primitives
        this.mutexes.clear();
        this.semaphores.clear();
        
        for (const mutexData of state.mutexes) {
            const mutex = new TernaryMutex(mutexData.name);
            mutex.locked = mutexData.locked;
            if (mutexData.owner) {
                mutex.owner = this.processes.get(mutexData.owner);
            }
            this.mutexes.set(mutexData.name, mutex);
        }
        
        for (const semData of state.semaphores) {
            const sem = new TernarySemaphore(semData.name, semData.value);
            this.semaphores.set(semData.name, sem);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BalancedTernaryOS,
        ProcessControlBlock,
        TernaryMutex,
        TernarySemaphore,
        MemoryAllocator
    };
}