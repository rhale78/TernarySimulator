/**
 * Ternary Graphics System
 * Implements a 9-color balanced ternary graphics display
 * Display size: 3^4 x 3^4 (81x81 pixels)
 */

// Import dependencies if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ternaryModule = require('./ternary.js');
    global.BalancedTernary = ternaryModule.BalancedTernary;
    global.Tryte = ternaryModule.Tryte;
    global.TernaryAddress = ternaryModule.TernaryAddress;
}

class TernaryGraphicsDisplay {
    constructor(width = 81, height = 81) { // 3^4 x 3^4
        this.width = width;
        this.height = height;
        this.pixelData = new Map(); // Sparse storage for pixels
        this.canvas = null;
        this.context = null;
        this.pixelSize = 4; // Pixels are 4x4 screen pixels
        
        // Define 9 ternary colors using balanced ternary RGB values
        this.colorPalette = this.createTernaryColorPalette();
        
        this.initializeCanvas();
    }
    
    createTernaryColorPalette() {
        // 9 colors based on ternary combinations of RGB components
        // Each color component can be -1 (dark), 0 (medium), +1 (bright)
        const colors = new Map();
        
        const levels = [0x40, 0x80, 0xC0]; // Dark, Medium, Bright levels
        let colorIndex = 0;
        
        for (let r = -1; r <= 1; r++) {
            for (let g = -1; g <= 1; g++) {
                for (let b = -1; b <= 1; b++) {
                    const red = levels[r + 1];
                    const green = levels[g + 1];
                    const blue = levels[b + 1];
                    
                    // Create balanced ternary color index
                    const colorTrit = new BalancedTernary([r, g, b]);
                    const hexColor = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
                    
                    colors.set(colorTrit.toString(), {
                        hex: hexColor,
                        rgb: { r: red, g: green, b: blue },
                        trits: [r, g, b],
                        index: colorIndex++
                    });
                }
            }
        }
        
        return colors;
    }
    
    initializeCanvas() {
        if (typeof window !== 'undefined') {
            this.canvas = document.getElementById('ternaryGraphicsDisplay');
            if (this.canvas) {
                this.context = this.canvas.getContext('2d');
                this.canvas.width = this.width * this.pixelSize;
                this.canvas.height = this.height * this.pixelSize;
                this.clear();
            }
        }
    }
    
    clear() {
        if (this.context) {
            // Clear to black (color ---: dark dark dark)
            this.context.fillStyle = '#404040';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.pixelData.clear();
    }
    
    setPixel(x, y, colorTrits) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return; // Out of bounds
        }
        
        // Convert color trits to color key
        const colorKey = new BalancedTernary(colorTrits).toString();
        const color = this.colorPalette.get(colorKey);
        
        if (!color) {
            console.warn(`Invalid color trits: ${colorTrits}`);
            return;
        }
        
        // Store pixel data
        const pixelKey = `${x},${y}`;
        this.pixelData.set(pixelKey, colorTrits);
        
        // Update canvas if available
        if (this.context) {
            this.context.fillStyle = color.hex;
            this.context.fillRect(
                x * this.pixelSize, 
                y * this.pixelSize, 
                this.pixelSize, 
                this.pixelSize
            );
        }
    }
    
    getPixel(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        
        const pixelKey = `${x},${y}`;
        return this.pixelData.get(pixelKey) || [-1, -1, -1]; // Default to black
    }
    
    // Convert memory address to pixel coordinates
    addressToCoords(address) {
        const addr = address instanceof TernaryAddress ? address.toDecimal() : address;
        const x = addr % this.width;
        const y = Math.floor(addr / this.width);
        return { x, y };
    }
    
    // Convert pixel coordinates to memory address
    coordsToAddress(x, y) {
        return y * this.width + x;
    }
    
    // Write pixel data from memory value (6 trits: 2 trits per RGB component)
    writePixelFromTryte(address, tryte) {
        const coords = this.addressToCoords(address);
        const trits = tryte.getTrits();
        
        // Extract RGB components (2 trits each, so -3 to +3 range, map to -1,0,+1)
        const r = Math.sign(trits[0] * 3 + trits[1]); // First 2 trits for red
        const g = Math.sign(trits[2] * 3 + trits[3]); // Next 2 trits for green  
        const b = Math.sign(trits[4] * 3 + trits[5]); // Last 2 trits for blue
        
        this.setPixel(coords.x, coords.y, [r, g, b]);
    }
    
    // Read pixel data as tryte
    readPixelAsTryte(address) {
        const coords = this.addressToCoords(address);
        const colorTrits = this.getPixel(coords.x, coords.y);
        
        // Convert RGB trits back to 6-trit tryte
        const trits = [
            colorTrits[0], 0, // Red component as 2 trits
            colorTrits[1], 0, // Green component as 2 trits
            colorTrits[2], 0  // Blue component as 2 trits
        ];
        
        return new Tryte(new BalancedTernary(trits));
    }
    
    // Get display statistics
    getStats() {
        return {
            width: this.width,
            height: this.height,
            totalPixels: this.width * this.height,
            setPixels: this.pixelData.size,
            colorCount: this.colorPalette.size,
            canvasSize: `${this.canvas?.width || 0}x${this.canvas?.height || 0}`
        };
    }
    
    // Export display data for debugging
    exportData() {
        const data = {
            width: this.width,
            height: this.height,
            pixels: Array.from(this.pixelData.entries()),
            colorPalette: Array.from(this.colorPalette.entries())
        };
        return JSON.stringify(data, null, 2);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernaryGraphicsDisplay };
}