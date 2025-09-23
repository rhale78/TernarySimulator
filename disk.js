/**
 * Virtual Disk Drive for Ternary CPU Simulator
 * Implements a persistent storage system using balanced ternary
 * Supports file operations and directory structures
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

class VirtualDiskDrive {
    constructor(maxFiles = 243) { // 3^5 = 243 files max
        this.maxFiles = maxFiles;
        this.files = new Map(); // filename -> file data
        this.directories = new Map(); // directory structure
        this.currentDirectory = '/';
        this.fileDescriptors = new Map(); // handle -> file info
        this.nextFileHandle = 1;
        
        // Disk statistics
        this.totalSectors = 19683; // 3^9 sectors
        this.sectorSize = 243; // 3^5 trytes per sector  
        this.usedSectors = 0;
        
        // Initialize with root directory
        this.directories.set('/', {
            name: '/',
            parent: null,
            children: new Set(),
            created: Date.now(),
            modified: Date.now()
        });
        
        // Initialize filesystem
        this.initializeFilesystem();
        
        // Initialize disk I/O interface
        this.initializeDiskIO();
    }
    
    initializeFilesystem() {
        // Create some sample files and directories for demonstration
        this.createDirectory('/bin');
        this.createDirectory('/data');
        this.createDirectory('/tmp');
        
        // Create a sample text file
        const sampleText = this.stringToTernaryData("Hello Ternary World!\nThis is a virtual disk file.\n");
        this.createFile('/readme.txt', sampleText);
        
        // Create a sample binary data file
        const sampleBinary = [];
        for (let i = 0; i < 100; i++) {
            sampleBinary.push(new Tryte(i % 365)); // Sample data
        }
        this.createFile('/data/sample.bin', sampleBinary);
    }
    
    // Convert string to ternary data
    stringToTernaryData(str) {
        const data = [];
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            data.push(new Tryte(charCode));
        }
        return data;
    }
    
    // Convert ternary data to string
    ternaryDataToString(data) {
        let str = '';
        for (let tryte of data) {
            const charCode = tryte.toDecimal();
            if (charCode >= 0 && charCode <= 127) { // ASCII range
                str += String.fromCharCode(charCode);
            }
        }
        return str;
    }
    
    // Create a new directory
    createDirectory(path) {
        const normalizedPath = this.normalizePath(path);
        const parentPath = this.getParentPath(normalizedPath);
        const dirName = this.getFileName(normalizedPath);
        
        if (this.directories.has(normalizedPath)) {
            throw new Error(`Directory ${normalizedPath} already exists`);
        }
        
        if (!this.directories.has(parentPath)) {
            throw new Error(`Parent directory ${parentPath} does not exist`);
        }
        
        const directory = {
            name: dirName,
            parent: parentPath,
            children: new Set(),
            created: Date.now(),
            modified: Date.now()
        };
        
        this.directories.set(normalizedPath, directory);
        this.directories.get(parentPath).children.add(normalizedPath);
        
        return true;
    }
    
    // Create a new file
    createFile(path, data = []) {
        const normalizedPath = this.normalizePath(path);
        const parentPath = this.getParentPath(normalizedPath);
        const fileName = this.getFileName(normalizedPath);
        
        if (this.files.has(normalizedPath)) {
            throw new Error(`File ${normalizedPath} already exists`);
        }
        
        if (!this.directories.has(parentPath)) {
            throw new Error(`Directory ${parentPath} does not exist`);
        }
        
        if (this.files.size >= this.maxFiles) {
            throw new Error('Maximum number of files reached');
        }
        
        const file = {
            name: fileName,
            path: normalizedPath,
            data: Array.isArray(data) ? data : [data],
            size: Array.isArray(data) ? data.length : 1,
            created: Date.now(),
            modified: Date.now(),
            sector: this.allocateSector()
        };
        
        this.files.set(normalizedPath, file);
        this.directories.get(parentPath).children.add(normalizedPath);
        this.usedSectors++;
        
        return true;
    }
    
    // Open a file and return a file handle
    openFile(path, mode = 'r') {
        const normalizedPath = this.normalizePath(path);
        
        if (!this.files.has(normalizedPath)) {
            if (mode.includes('w') || mode.includes('a')) {
                // Create new file if opening for write
                this.createFile(normalizedPath, []);
            } else {
                throw new Error(`File ${normalizedPath} not found`);
            }
        }
        
        const handle = this.nextFileHandle++;
        const file = this.files.get(normalizedPath);
        
        this.fileDescriptors.set(handle, {
            path: normalizedPath,
            mode: mode,
            position: mode.includes('a') ? file.data.length : 0,
            file: file
        });
        
        return handle;
    }
    
    // Close a file handle
    closeFile(handle) {
        if (!this.fileDescriptors.has(handle)) {
            throw new Error(`Invalid file handle: ${handle}`);
        }
        
        this.fileDescriptors.delete(handle);
        return true;
    }
    
    // Read data from a file
    readFile(handle, count = -1) {
        if (!this.fileDescriptors.has(handle)) {
            throw new Error(`Invalid file handle: ${handle}`);
        }
        
        const fd = this.fileDescriptors.get(handle);
        const file = fd.file;
        
        if (!fd.mode.includes('r')) {
            throw new Error('File not opened for reading');
        }
        
        const startPos = fd.position;
        const endPos = count === -1 ? file.data.length : Math.min(startPos + count, file.data.length);
        
        const data = file.data.slice(startPos, endPos);
        fd.position = endPos;
        
        return data;
    }
    
    // Write data to a file
    writeFile(handle, data) {
        if (!this.fileDescriptors.has(handle)) {
            throw new Error(`Invalid file handle: ${handle}`);
        }
        
        const fd = this.fileDescriptors.get(handle);
        const file = fd.file;
        
        if (!fd.mode.includes('w') && !fd.mode.includes('a')) {
            throw new Error('File not opened for writing');
        }
        
        const writeData = Array.isArray(data) ? data : [data];
        
        if (fd.mode.includes('a')) {
            // Append mode
            file.data.push(...writeData);
            fd.position = file.data.length;
        } else {
            // Write mode - overwrite at current position
            for (let i = 0; i < writeData.length; i++) {
                file.data[fd.position + i] = writeData[i];
            }
            fd.position += writeData.length;
        }
        
        file.size = file.data.length;
        file.modified = Date.now();
        
        return writeData.length;
    }
    
    // Delete a file
    deleteFile(path) {
        const normalizedPath = this.normalizePath(path);
        
        if (!this.files.has(normalizedPath)) {
            throw new Error(`File ${normalizedPath} not found`);
        }
        
        const file = this.files.get(normalizedPath);
        const parentPath = this.getParentPath(normalizedPath);
        
        this.files.delete(normalizedPath);
        this.directories.get(parentPath).children.delete(normalizedPath);
        this.deallocateSector(file.sector);
        this.usedSectors--;
        
        return true;
    }
    
    // List directory contents
    listDirectory(path = null) {
        const dirPath = path ? this.normalizePath(path) : this.currentDirectory;
        
        if (!this.directories.has(dirPath)) {
            throw new Error(`Directory ${dirPath} not found`);
        }
        
        const directory = this.directories.get(dirPath);
        const contents = [];
        
        for (let childPath of directory.children) {
            if (this.directories.has(childPath)) {
                const childDir = this.directories.get(childPath);
                contents.push({
                    name: childDir.name,
                    type: 'directory',
                    size: childDir.children.size,
                    created: childDir.created,
                    modified: childDir.modified
                });
            } else if (this.files.has(childPath)) {
                const file = this.files.get(childPath);
                contents.push({
                    name: file.name,
                    type: 'file',
                    size: file.size,
                    created: file.created,
                    modified: file.modified
                });
            }
        }
        
        return contents;
    }
    
    // Get file/directory information
    getFileInfo(path) {
        const normalizedPath = this.normalizePath(path);
        
        if (this.files.has(normalizedPath)) {
            const file = this.files.get(normalizedPath);
            return {
                name: file.name,
                path: file.path,
                type: 'file',
                size: file.size,
                created: file.created,
                modified: file.modified,
                sector: file.sector
            };
        } else if (this.directories.has(normalizedPath)) {
            const dir = this.directories.get(normalizedPath);
            return {
                name: dir.name,
                path: normalizedPath,
                type: 'directory',
                size: dir.children.size,
                created: dir.created,
                modified: dir.modified
            };
        } else {
            throw new Error(`Path ${normalizedPath} not found`);
        }
    }
    
    // Helper methods
    normalizePath(path) {
        if (!path.startsWith('/')) {
            path = this.currentDirectory + '/' + path;
        }
        
        const parts = path.split('/').filter(part => part !== '' && part !== '.');
        const normalized = [];
        
        for (let part of parts) {
            if (part === '..') {
                if (normalized.length > 0) {
                    normalized.pop();
                }
            } else {
                normalized.push(part);
            }
        }
        
        return '/' + normalized.join('/');
    }
    
    getParentPath(path) {
        const parts = path.split('/').filter(part => part !== '');
        if (parts.length === 0) return '/';
        parts.pop();
        return '/' + parts.join('/');
    }
    
    getFileName(path) {
        const parts = path.split('/').filter(part => part !== '');
        return parts.length > 0 ? parts[parts.length - 1] : '/';
    }
    
    allocateSector() {
        // Simple sector allocation - just return next available sector
        return this.usedSectors;
    }
    
    deallocateSector(sector) {
        // Simple deallocation - in a real filesystem this would be more complex
        return true;
    }
    
    // Get disk statistics
    getStats() {
        return {
            totalFiles: this.files.size,
            maxFiles: this.maxFiles,
            totalDirectories: this.directories.size,
            totalSectors: this.totalSectors,
            usedSectors: this.usedSectors,
            freeSectors: this.totalSectors - this.usedSectors,
            sectorSize: this.sectorSize,
            utilization: (this.usedSectors / this.totalSectors * 100).toFixed(2) + '%'
        };
    }
    
    // Export filesystem data for debugging
    exportFilesystem() {
        return {
            files: Array.from(this.files.entries()),
            directories: Array.from(this.directories.entries()),
            stats: this.getStats()
        };
    }

    // Memory-mapped I/O interface
    handleMemoryRead(offset) {
        // Disk I/O register addresses:
        // 0: Status register
        // 1: Command register  
        // 2: File handle register
        // 3: Data register
        // 4: Size/position register
        // 5-49: String buffer for filenames/paths
        
        switch (offset) {
            case 0: // Status register
                return new Tryte(this.diskStatus);
            case 1: // Command register
                return new Tryte(0); // Write-only
            case 2: // File handle register
                return new Tryte(this.currentHandle || 0);
            case 3: // Data register
                return this.readDataRegister();
            case 4: // Size/position register
                return new Tryte(this.currentPosition || 0);
            default:
                if (offset >= 5 && offset <= 49) {
                    // String buffer
                    const bufferIndex = offset - 5;
                    return new Tryte(this.stringBuffer[bufferIndex] || 0);
                }
                return new Tryte(0);
        }
    }

    handleMemoryWrite(offset, value) {
        switch (offset) {
            case 0: // Status register (read-only)
                break;
            case 1: // Command register
                this.executeCommand(value.toDecimal());
                break;
            case 2: // File handle register
                this.currentHandle = value.toDecimal();
                break;
            case 3: // Data register
                this.writeDataRegister(value);
                break;
            case 4: // Size/position register
                this.currentPosition = value.toDecimal();
                break;
            default:
                if (offset >= 5 && offset <= 49) {
                    // String buffer
                    const bufferIndex = offset - 5;
                    if (!this.stringBuffer) this.stringBuffer = new Array(45).fill(0);
                    this.stringBuffer[bufferIndex] = value.toDecimal();
                }
                break;
        }
    }

    // Initialize disk I/O state
    initializeDiskIO() {
        this.diskStatus = 0; // 0=ready, 1=busy, 2=error
        this.currentHandle = null;
        this.currentPosition = 0;
        this.stringBuffer = new Array(45).fill(0); // 45-character buffer
        this.dataBuffer = [];
    }

    // Execute disk commands
    executeCommand(command) {
        try {
            this.diskStatus = 1; // Set busy
            
            switch (command) {
                case 1: // Open file
                    this.commandOpenFile();
                    break;
                case 2: // Close file
                    this.commandCloseFile();
                    break;
                case 3: // Read file
                    this.commandReadFile();
                    break;
                case 4: // Write file
                    this.commandWriteFile();
                    break;
                case 5: // Create file
                    this.commandCreateFile();
                    break;
                case 6: // Delete file
                    this.commandDeleteFile();
                    break;
                case 7: // List directory
                    this.commandListDirectory();
                    break;
                case 8: // Get file info
                    this.commandGetFileInfo();
                    break;
                default:
                    this.diskStatus = 2; // Error
                    return;
            }
            
            this.diskStatus = 0; // Set ready
        } catch (error) {
            console.error('Disk command error:', error);
            this.diskStatus = 2; // Set error
        }
    }

    // Convert string buffer to filename
    getFilenameFromBuffer() {
        let filename = '';
        for (let i = 0; i < this.stringBuffer.length; i++) {
            const char = this.stringBuffer[i];
            if (char === 0) break; // Null terminator
            filename += String.fromCharCode(char);
        }
        return filename;
    }

    // Disk command implementations
    commandOpenFile() {
        const filename = this.getFilenameFromBuffer();
        const mode = this.currentPosition === 1 ? 'w' : 'r'; // Position used as mode flag
        this.currentHandle = this.openFile(filename, mode);
    }

    commandCloseFile() {
        if (this.currentHandle) {
            this.closeFile(this.currentHandle);
            this.currentHandle = null;
        }
    }

    commandReadFile() {
        if (this.currentHandle) {
            const count = this.currentPosition || 1;
            this.dataBuffer = this.readFile(this.currentHandle, count);
            this.currentPosition = 0; // Reset to start of buffer
        }
    }

    commandWriteFile() {
        if (this.currentHandle && this.dataBuffer.length > 0) {
            this.writeFile(this.currentHandle, this.dataBuffer);
            this.dataBuffer = [];
        }
    }

    commandCreateFile() {
        const filename = this.getFilenameFromBuffer();
        this.createFile(filename, []);
    }

    commandDeleteFile() {
        const filename = this.getFilenameFromBuffer();
        this.deleteFile(filename);
    }

    commandListDirectory() {
        const dirname = this.getFilenameFromBuffer() || '/';
        const contents = this.listDirectory(dirname);
        // Store directory listing in data buffer as text
        let listing = '';
        for (let item of contents) {
            listing += `${item.type === 'directory' ? 'd' : 'f'} ${item.name} ${item.size}\n`;
        }
        this.dataBuffer = this.stringToTernaryData(listing);
        this.currentPosition = 0;
    }

    commandGetFileInfo() {
        const filename = this.getFilenameFromBuffer();
        const info = this.getFileInfo(filename);
        const infoText = `${info.name}\n${info.type}\n${info.size}\n${info.created}\n${info.modified}\n`;
        this.dataBuffer = this.stringToTernaryData(infoText);
        this.currentPosition = 0;
    }

    // Data register I/O
    readDataRegister() {
        if (this.dataBuffer && this.currentPosition < this.dataBuffer.length) {
            const data = this.dataBuffer[this.currentPosition];
            this.currentPosition++;
            return data instanceof Tryte ? data : new Tryte(data);
        }
        return new Tryte(0);
    }

    writeDataRegister(value) {
        if (!this.dataBuffer) this.dataBuffer = [];
        this.dataBuffer.push(value);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VirtualDiskDrive };
}