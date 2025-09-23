# Snapshots and Virtual Disk System Guide

This guide provides comprehensive information about the snapshot system and virtual disk functionality in the Balanced Ternary CPU Simulator.

## Table of Contents

1. [Snapshot System Overview](#snapshot-system-overview)
2. [Creating and Managing Snapshots](#creating-and-managing-snapshots)  
3. [Sharing Snapshots with Others](#sharing-snapshots-with-others)
4. [Virtual Disk System](#virtual-disk-system)
5. [File System Operations](#file-system-operations)
6. [Replacing Virtual Disks](#replacing-virtual-disks)
7. [Advanced Snapshot Techniques](#advanced-snapshot-techniques)
8. [Programmatic Access](#programmatic-access)

## Snapshot System Overview

The snapshot system provides complete state preservation for the Balanced Ternary CPU Simulator. Every aspect of the system state can be saved and restored, making it perfect for:

- **Checkpointing**: Save progress before trying experimental code
- **Debugging**: Return to known good states for comparison
- **Sharing**: Send complete program states to colleagues
- **Education**: Provide students with pre-configured examples
- **Development**: Maintain multiple versions of work in progress

### What Gets Saved in a Snapshot

A snapshot captures the complete system state:

```
Complete CPU State:
├── All Registers (PC, ACC, IX, IX1-IX3, SP, R1-R9, FLAGS)
├── Pipeline State (4-stage pipeline contents)
├── Cache State (L1 and L2 cache contents and statistics)
├── Multi-core Configuration (core count, active core, synchronization)
└── Performance Counters (instruction frequency, timing data)

Complete Memory State:
├── Sparse Memory Array (all non-zero memory locations)
├── Memory Access History (for debugging)
├── Watchpoints and Breakpoints
└── Memory-mapped I/O State

Virtual Disk State:
├── File System Structure (directories and files)
├── File Contents (all file data)
├── File Metadata (timestamps, sizes, permissions)
├── Open File Handles
└── Free Space Map

Graphics and I/O State:
├── Character Display Buffer (24x16 text display)
├── Pixel Graphics Buffer (81x81 pixel display)
├── Console Output History
└── I/O Device States

Operating System State:
├── Process Table (all running processes)
├── Open Files and Handles
├── System Variables and Configuration
├── Scheduler State
└── Memory Management Information

Simulator Configuration:
├── Execution Speed and Mode
├── Debug Settings
├── Interface Configuration
└── User Preferences
```

## Creating and Managing Snapshots

### Creating a Snapshot (Web Interface)

1. **Navigate to System Snapshots** section in the I/O panel
2. **Enter snapshot name** in the "Snapshot name" field
   - Use descriptive names: "fibonacci_working", "graphics_demo_start"
   - Names must be unique within your snapshot collection
3. **Add description** (optional) in the "Description" field
   - Explain what the snapshot contains: "Before optimization", "Working factorial algorithm"
4. **Click "Create Snapshot"** button
5. **Confirmation** appears: "Snapshot 'name' created successfully"

### Snapshot Naming Best Practices

```
Good Snapshot Names:
├── "program_start" - Initial state before program execution
├── "loop_working" - After implementing working loop logic
├── "before_optimization" - Prior to performance improvements
├── "graphics_demo_v1" - First version of graphics demonstration
├── "multi_core_test" - Multi-core functionality test
└── "final_submission" - Completed assignment version

Descriptions Examples:
├── "Working Fibonacci implementation before recursion optimization"
├── "Graphics program with basic line drawing functionality"
├── "Multi-core parallel processing example - both cores active"
├── "Complete file system demo with create/read/write operations"
└── "Student assignment - calculator with all basic operations"
```

### Loading a Snapshot

1. **Select snapshot** from the dropdown menu in System Snapshots
2. **Click "Load"** button
3. **System immediately restores** to the saved state
4. **All components update** to reflect the loaded state:
   - CPU registers restore to saved values
   - Memory contents reload from snapshot
   - Graphics displays update
   - Program editor shows saved code
   - Virtual disk restores file system

### Snapshot Management

**List All Snapshots**
1. Click "List All" button to see detailed snapshot information
2. Output appears in snapshot output area showing:
   - Snapshot name and description
   - Creation timestamp
   - File size (in KB)
   - Number of memory locations saved

**Example snapshot listing:**
```
Available Snapshots:

fibonacci_v1
  Description: Working Fibonacci sequence generator
  Created: 12/15/2023, 2:30:45 PM
  Size: 15 KB

graphics_demo
  Description: Basic graphics with line drawing
  Created: 12/15/2023, 3:15:22 PM
  Size: 28 KB

multi_core_test
  Description: Dual-core parallel processing example
  Created: 12/15/2023, 4:45:10 PM
  Size: 22 KB
```

## Sharing Snapshots with Others

### Exporting Snapshots

**Export Process:**
1. **Select snapshot** to export from dropdown menu
2. **Click "Export"** button
3. **File downloads** with name format: `snapshot_name_timestamp.json`
4. **Share the file** via email, file sharing service, or repository

**Export File Format:**
```json
{
  "metadata": {
    "name": "fibonacci_demo",
    "description": "Working Fibonacci sequence with optimization",
    "timestamp": 1702656445000,
    "version": "1.0",
    "creator": "BalancedTernarySimulator",
    "exported": 1702656500000
  },
  "cpu": {
    "registers": {
      "PC": "000000000",
      "ACC": "+-+",
      "IX": "000000+--",
      ...
    },
    "flags": {"Z": 0, "P": 1, "N": 0, "C": 0, "V": 0},
    "pipeline": {...},
    "cache": {...}
  },
  "memory": {
    "sparse_array": {
      "000000000": "+-+00+",
      "00000000+": "+0-+-0",
      ...
    },
    "watchpoints": [],
    "breakpoints": [5, 10, 15]
  },
  "disk": {...},
  "graphics": {...},
  "os": {...},
  "compressed": true,
  "size": 15234
}
```

### Importing Snapshots

**Import Process:**
1. **Click "Import"** button in System Snapshots section
2. **File dialog opens** - select snapshot JSON file
3. **File uploads and validates**
4. **Snapshot becomes available** in dropdown menu
5. **Load normally** using the dropdown and Load button

**Importing from Colleagues:**
```
Scenario: Your colleague sends you a snapshot of their working program

1. Save their snapshot file to your computer
2. Open the simulator in your browser
3. Click "Import" in System Snapshots
4. Select their snapshot file
5. New snapshot appears in your dropdown list
6. Load it to see their exact program state
7. You can now:
   - Study their implementation
   - Modify and improve their code
   - Create your own snapshots of modifications
   - Export your changes back to share
```

### Collaboration Workflow

**Educational Setting:**
```
Professor → Students:
1. Professor creates example program snapshots
2. Exports snapshots as files
3. Distributes files to students (via LMS, email, etc.)
4. Students import snapshots
5. Students can examine working examples
6. Students modify and create their own snapshots
7. Students export and submit their work

Student → Student:
1. Student A encounters programming problem
2. Student A creates snapshot of problematic state
3. Student A exports and sends to Student B
4. Student B imports snapshot
5. Student B debugs and fixes issue
6. Student B exports fixed version
7. Student A imports and learns from solution
```

**Development Team:**
```
Team Collaboration:
1. Developer creates feature implementation
2. Creates snapshot: "feature_X_implementation"
3. Exports and commits to version control
4. Team members import snapshot
5. Team reviews implementation together
6. Bug fixes and improvements made by various team members
7. Final version exported and shared
```

## Virtual Disk System

### Virtual Disk Overview

The virtual disk system provides a complete hierarchical file system within the simulator:

```
Virtual Disk Specifications:
├── Maximum Files: 243 (3^5 - ternary-themed limit)
├── Directory Structure: Full hierarchical tree
├── File Types: Text files, binary data, executable programs
├── File Operations: Create, Read, Write, Delete, Rename
├── Metadata: Timestamps, file sizes, permissions
├── Allocation: Linked sector allocation
└── Free Space: Bitmap-based free space management
```

### File System Structure

```
Default Virtual Disk Layout:
/
├── system/
│   ├── boot.ter       # Boot loader program
│   ├── shell.ter      # Command shell
│   └── kernel.ter     # OS kernel
├── examples/
│   ├── hello.asm      # Hello world program
│   ├── fibonacci.asm  # Fibonacci sequence
│   ├── graphics.asm   # Graphics demonstration
│   └── multicore.asm  # Multi-core example
├── user/
│   └── (user programs and data)
└── temp/
    └── (temporary files)
```

### Virtual Disk Status Monitoring

The Virtual Disk Drive section shows real-time status:
- **Status**: Ready, Busy, Error
- **Files**: Current file count / Maximum files (e.g., "15 / 243")
- **Usage**: Percentage of disk space used (e.g., "2.5%")

### Virtual Disk Operations

**List Files:**
```
Click "List Files" button to see directory contents:

Directory Listing:
/
  system/          <DIR>    Created: 2023-12-15 14:30
  examples/        <DIR>    Created: 2023-12-15 14:30
  user/           <DIR>    Created: 2023-12-15 14:30
  temp/           <DIR>    Created: 2023-12-15 14:30

/examples/
  hello.asm        456 bytes    Modified: 2023-12-15 15:45
  fibonacci.asm    1,234 bytes  Modified: 2023-12-15 16:20
  graphics.asm     2,187 bytes  Modified: 2023-12-15 17:10
```

**Show Statistics:**
```
Click "Show Stats" for detailed disk information:

Virtual Disk Statistics:
  Total Capacity: 19,683 sectors
  Used Sectors: 156
  Free Sectors: 19,527
  Files: 15
  Directories: 8
  Fragmentation: 2.3%
  Largest Free Block: 19,200 sectors
```

## File System Operations

### Programming File Operations

**Creating Files (Assembly):**
```assembly
; Create a new file
create_file:
    LDA #CREATE_FILE    ; Command code
    STA DISK_CMD
    LDA #filename       ; Filename address
    STA DISK_ADDR
    JSR disk_operation  ; Execute command
    RTS

filename: .str "myfile.txt"
```

**Writing to Files:**
```assembly
; Write data to file
write_file:
    LDA #OPEN_FILE      ; Open file first
    STA DISK_CMD
    LDA #filename
    STA DISK_ADDR
    LDA #2              ; Write mode
    STA DISK_MODE
    JSR disk_operation
    STA file_handle     ; Save file handle
    
    LDA #WRITE_FILE     ; Write data
    STA DISK_CMD
    LDA file_handle
    STA DISK_HANDLE
    LDA #file_data      ; Data to write
    STA DISK_ADDR
    LDA #data_length    ; Number of bytes
    STA DISK_SIZE
    JSR disk_operation
    
    LDA #CLOSE_FILE     ; Close file
    STA DISK_CMD
    LDA file_handle
    STA DISK_HANDLE
    JSR disk_operation
    RTS

file_data:   .str "Hello, Virtual Disk!"
data_length: .db 21
file_handle: .db 0
```

**Reading from Files:**
```assembly
; Read data from file
read_file:
    LDA #OPEN_FILE      ; Open file
    STA DISK_CMD
    LDA #filename
    STA DISK_ADDR
    LDA #1              ; Read mode
    STA DISK_MODE
    JSR disk_operation
    STA file_handle
    
    LDA #READ_FILE      ; Read data
    STA DISK_CMD
    LDA file_handle
    STA DISK_HANDLE
    LDA #read_buffer    ; Buffer for data
    STA DISK_ADDR
    LDA #buffer_size    ; Maximum bytes to read
    STA DISK_SIZE
    JSR disk_operation
    
    ; Data is now in read_buffer
    LDA #CLOSE_FILE
    STA DISK_CMD
    LDA file_handle
    STA DISK_HANDLE
    JSR disk_operation
    RTS

read_buffer:  .ds 100   ; 100-byte read buffer
buffer_size:  .db 100
```

### OS-Level File Operations

When the operating system is booted, you can use shell commands:

**Directory Operations:**
```bash
ls                    # List current directory
ls /examples         # List specific directory
mkdir /user/projects  # Create directory
rmdir /temp/old      # Remove empty directory
cd /examples         # Change directory
pwd                  # Show current directory
```

**File Operations:**
```bash
cat hello.asm        # Display file contents
cp hello.asm backup.asm  # Copy file
mv old.txt new.txt   # Rename/move file
rm unwanted.txt      # Delete file
touch newfile.txt    # Create empty file
```

**File Information:**
```bash
stat hello.asm       # Show file details
du /examples         # Show directory sizes
df                   # Show disk usage
find . -name "*.asm" # Find files by pattern
```

## Replacing Virtual Disks

### Creating Custom Virtual Disks

**Method 1: Build Programmatically**
```assembly
; Program to create custom disk structure
.org 0

main:
    ; Create directory structure
    JSR create_directories
    
    ; Create sample files
    JSR create_sample_files
    
    ; Populate with data
    JSR populate_files
    
    HLT

create_directories:
    ; Create /projects directory
    LDA #CREATE_DIR
    STA DISK_CMD
    LDA #projects_dir
    STA DISK_ADDR
    JSR disk_operation
    
    ; Create /data directory
    LDA #CREATE_DIR
    STA DISK_CMD
    LDA #data_dir
    STA DISK_ADDR
    JSR disk_operation
    
    RTS

create_sample_files:
    ; Create project1.asm
    LDA #CREATE_FILE
    STA DISK_CMD
    LDA #project1_name
    STA DISK_ADDR
    JSR disk_operation
    
    ; Write project1 content
    JSR write_project1
    
    ; Create data1.txt
    LDA #CREATE_FILE
    STA DISK_CMD
    LDA #data1_name
    STA DISK_ADDR
    JSR disk_operation
    
    ; Write data1 content
    JSR write_data1
    
    RTS

; ... (implementation details)

projects_dir:  .str "/projects"
data_dir:     .str "/data"  
project1_name: .str "/projects/project1.asm"
data1_name:   .str "/data/data1.txt"
```

**Method 2: Using OS Shell Commands**
```bash
# Boot the OS first
boot

# Create directory structure
mkdir /assignments
mkdir /assignments/hw1
mkdir /assignments/hw2
mkdir /solutions

# Create files with content
echo "LDA #42" > /assignments/hw1/starter.asm
echo "OUT" >> /assignments/hw1/starter.asm
echo "HLT" >> /assignments/hw1/starter.asm

# Copy examples
cp /examples/fibonacci.asm /solutions/fib_solution.asm
```

### Saving Custom Virtual Disks

**Save Current Disk:**
1. **Click "Save Disk File"** in Virtual Disk Management
2. **File downloads** with name: `virtual_disk_timestamp.json`
3. **Contains complete file system** structure and all file contents

**Virtual Disk File Format:**
```json
{
  "metadata": {
    "name": "Custom Assignment Disk",
    "created": 1702656445000,
    "version": "1.0",
    "totalFiles": 25,
    "totalDirectories": 8
  },
  "filesystem": {
    "directories": {
      "/": {"created": 1702656400000, "children": ["system", "examples", "assignments"]},
      "/system": {"created": 1702656400000, "children": ["boot.ter"]},
      "/examples": {"created": 1702656400000, "children": ["hello.asm", "fibonacci.asm"]},
      "/assignments": {"created": 1702656445000, "children": ["hw1", "hw2"]}
    },
    "files": {
      "/examples/hello.asm": {
        "size": 456,
        "created": 1702656400000,
        "modified": 1702656400000, 
        "data": "LDA #42\nOUT\nHLT\n"
      },
      "/assignments/hw1/starter.asm": {
        "size": 234,
        "created": 1702656445000,
        "modified": 1702656445000,
        "data": "; Assignment 1 starter code\nLDA #10\nADD #20\nOUT\nHLT\n"
      }
    }
  }
}
```

### Loading Replacement Virtual Disks

**Load Different Virtual Disk:**
1. **Click "Load Disk File"** in Virtual Disk Management
2. **Select virtual disk JSON file** from file dialog
3. **Current disk is completely replaced** with loaded disk
4. **All files and directories** from loaded disk become available
5. **Previous disk contents are lost** (unless saved first)

**Creating Distributable Virtual Disks:**
```
Educational Scenario: Professor creates assignment disk

1. Professor creates empty virtual disk
2. Sets up directory structure:
   /assignments/hw1/
   /assignments/hw2/
   /solutions/
   /examples/
3. Populates with starter code and examples
4. Creates helpful documentation files
5. Saves virtual disk file
6. Distributes virtual disk file to students
7. Students load the virtual disk file
8. Students have identical starting environment
```

### Virtual Disk Exchange Examples

**Example 1: Sharing Programming Projects**
```
Developer A:
1. Creates project structure on virtual disk
2. Implements several example programs
3. Saves virtual disk as "graphics_examples.json"
4. Shares file with Developer B

Developer B:
1. Loads "graphics_examples.json" virtual disk
2. Sees complete project structure
3. Can run all example programs
4. Modifies and extends examples
5. Saves modified disk as "graphics_extended.json"
6. Shares back with Developer A
```

**Example 2: Educational Course Materials**
```
Course Instructor:
1. Creates comprehensive course virtual disk
2. Directory structure:
   /lectures/week01/ through /lectures/week12/
   /assignments/hw1/ through /assignments/hw10/
   /solutions/ (for instructor use)  
   /examples/ (working code samples)
   /resources/ (reference materials)
3. Each directory contains appropriate starter code
4. Saves as "course_materials.json"
5. Students download and load this disk
6. Students have complete course environment
```

## Advanced Snapshot Techniques

### Incremental Snapshots

While the simulator doesn't directly support incremental snapshots, you can create your own versioning system:

```
Snapshot Naming Convention:
├── project_v1_start - Initial implementation
├── project_v1_working - First working version
├── project_v1_optimized - Performance improvements
├── project_v2_start - Major refactoring begins
├── project_v2_features - New features added
└── project_v2_final - Completed version
```

### Snapshot-Based Development Workflow

**Feature Development:**
```
1. Create snapshot: "feature_baseline"
2. Implement new feature
3. Create snapshot: "feature_implemented"  
4. Test feature
5. If bugs found:
   - Load "feature_implemented" 
   - Fix bugs
   - Create "feature_fixed"
6. If major issues:
   - Load "feature_baseline"
   - Try different approach
```

**Debugging Workflow:**
```
1. Create snapshot: "before_debug"
2. Add debug output and breakpoints
3. Run program and analyze
4. Create snapshot: "debug_session" (if useful state)
5. Fix identified issues
6. Create snapshot: "after_fix"
7. Compare "before_debug" and "after_fix" to verify fix
```

### Snapshot Comparison

While not automated, you can manually compare snapshots:

```javascript
// Export two snapshots and compare programmatically
const snapshot1 = debugFunctions.exportSnapshot("version1");
const snapshot2 = debugFunctions.exportSnapshot("version2");

// Manual comparison of key differences
console.log("Memory differences:");
for (let addr in snapshot1.memory.sparse_array) {
    if (snapshot1.memory.sparse_array[addr] !== 
        snapshot2.memory.sparse_array[addr]) {
        console.log(`Address ${addr}: ${snapshot1.memory.sparse_array[addr]} → ${snapshot2.memory.sparse_array[addr]}`);
    }
}

console.log("Register differences:");
for (let reg in snapshot1.cpu.registers) {
    if (snapshot1.cpu.registers[reg] !== snapshot2.cpu.registers[reg]) {
        console.log(`${reg}: ${snapshot1.cpu.registers[reg]} → ${snapshot2.cpu.registers[reg]}`);
    }
}
```

## Programmatic Access

### JavaScript API for Snapshots

**Creating Snapshots Programmatically:**
```javascript
// Create snapshot with custom name and description
const snapshot = debugFunctions.createSnapshot(
    "algorithm_checkpoint", 
    "Working implementation before optimization"
);

// Create automatic snapshot with timestamp
const autoSnapshot = debugFunctions.createSnapshot();
console.log(`Created snapshot: ${autoSnapshot.metadata.name}`);
```

**Loading Snapshots Programmatically:**
```javascript
// Load specific snapshot
debugFunctions.loadSnapshot("algorithm_checkpoint");

// Get list of available snapshots
const snapshots = debugFunctions.listSnapshots();
for (let snapshot of snapshots) {
    console.log(`${snapshot.name}: ${snapshot.description}`);
}

// Load most recent snapshot
const recent = snapshots[snapshots.length - 1];
debugFunctions.loadSnapshot(recent.name);
```

**Export/Import Operations:**
```javascript
// Export snapshot to JavaScript object
const exportedData = debugFunctions.exportSnapshot("my_snapshot");

// Save to browser local storage
localStorage.setItem("saved_snapshot", JSON.stringify(exportedData));

// Load from browser local storage
const savedData = JSON.parse(localStorage.getItem("saved_snapshot"));
debugFunctions.importSnapshot(savedData);
```

### Automated Snapshot Creation

**Auto-save on Key Events:**
```javascript
// Auto-create snapshot before running program
simulator.addEventListener('beforeRun', () => {
    debugFunctions.createSnapshot('auto_before_run', 'Automatic snapshot before execution');
});

// Auto-create snapshot on error
simulator.addEventListener('error', (error) => {
    debugFunctions.createSnapshot('auto_error_state', `Error snapshot: ${error.message}`);
});

// Auto-create snapshot at breakpoints
simulator.addEventListener('breakpoint', (address) => {
    debugFunctions.createSnapshot(`auto_breakpoint_${address}`, `Breakpoint at address ${address}`);
});
```

### Snapshot Management Scripts

**Cleanup Old Snapshots:**
```javascript
function cleanupOldSnapshots(keepDays = 7) {
    const snapshots = debugFunctions.listSnapshots();
    const cutoffTime = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
    
    snapshots.forEach(snapshot => {
        if (snapshot.timestamp < cutoffTime && 
            snapshot.name.startsWith('auto_')) {
            debugFunctions.deleteSnapshot(snapshot.name);
            console.log(`Deleted old snapshot: ${snapshot.name}`);
        }
    });
}

// Run cleanup weekly
setInterval(cleanupOldSnapshots, 7 * 24 * 60 * 60 * 1000);
```

**Snapshot Backup System:**
```javascript
function backupAllSnapshots() {
    const snapshots = debugFunctions.listSnapshots();
    const backup = {
        created: Date.now(),
        snapshots: []
    };
    
    snapshots.forEach(snapshot => {
        const data = debugFunctions.exportSnapshot(snapshot.name);
        backup.snapshots.push(data);
    });
    
    // Save backup to file
    const blob = new Blob([JSON.stringify(backup, null, 2)], 
                         {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `snapshot_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}
```

This comprehensive guide covers all aspects of the snapshot and virtual disk systems, providing the detailed documentation requested for sharing snapshots and virtual disks with colleagues and managing the complete system state.