/**
 * High-Level Language Compiler for Ternary Assembly
 * Implements a simple C-like language that compiles to ternary assembly
 */

class TernaryHighLevelCompiler {
    constructor() {
        this.variables = new Map(); // variable name -> memory address
        this.nextAddress = 1000; // Start variables at address 1000
        this.labels = new Map();
        this.labelCounter = 0;
        this.output = [];
        this.currentLine = 0;
    }

    // Main compilation function
    compile(sourceCode) {
        try {
            this.reset();
            const lines = this.preprocessSource(sourceCode);
            const ast = this.parse(lines);
            const assembly = this.generate(ast);
            
            return {
                success: true,
                assembly: assembly,
                variables: Object.fromEntries(this.variables),
                labels: Object.fromEntries(this.labels)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                line: this.currentLine
            };
        }
    }

    reset() {
        this.variables.clear();
        this.nextAddress = 1000;
        this.labels.clear();
        this.labelCounter = 0;
        this.output = [];
        this.currentLine = 0;
    }

    preprocessSource(sourceCode) {
        return sourceCode
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('//'))
            .map((line, index) => ({ text: line, number: index + 1 }));
    }

    parse(lines) {
        const ast = { type: 'program', statements: [] };
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            this.currentLine = line.number;
            
            if (line.text.endsWith('{') || line.text.endsWith('}')) {
                continue; // Skip block markers for now
            }
            
            const statement = this.parseStatement(line.text);
            if (statement) {
                ast.statements.push(statement);
            }
        }
        
        return ast;
    }

    parseStatement(text) {
        // Variable declaration: int x = 5;
        if (text.match(/^(int|trit)\s+\w+(\s*=\s*[^;]+)?;?$/)) {
            return this.parseVariableDeclaration(text);
        }
        
        // Assignment: x = y + 5;
        if (text.match(/^\w+\s*=\s*[^;]+;?$/)) {
            return this.parseAssignment(text);
        }
        
        // If statement: if (x > 0)
        if (text.startsWith('if')) {
            return this.parseIfStatement(text);
        }
        
        // While loop: while (x > 0)
        if (text.startsWith('while')) {
            return this.parseWhileStatement(text);
        }
        
        // Function call: print(x);
        if (text.match(/^\w+\([^)]*\);?$/)) {
            return this.parseFunctionCall(text);
        }
        
        return null;
    }

    parseVariableDeclaration(text) {
        const match = text.match(/^(int|trit)\s+(\w+)(\s*=\s*([^;]+))?;?$/);
        if (!match) throw new Error(`Invalid variable declaration: ${text}`);
        
        const [, type, name, , initialValue] = match;
        
        if (this.variables.has(name)) {
            throw new Error(`Variable '${name}' already declared`);
        }
        
        // Assign memory address
        this.variables.set(name, this.nextAddress++);
        
        return {
            type: 'declaration',
            varType: type,
            name: name,
            initialValue: initialValue ? this.parseExpression(initialValue.trim()) : null
        };
    }

    parseAssignment(text) {
        const match = text.match(/^(\w+)\s*=\s*([^;]+);?$/);
        if (!match) throw new Error(`Invalid assignment: ${text}`);
        
        const [, name, expression] = match;
        
        if (!this.variables.has(name)) {
            throw new Error(`Undefined variable '${name}'`);
        }
        
        return {
            type: 'assignment',
            name: name,
            expression: this.parseExpression(expression.trim())
        };
    }

    parseIfStatement(text) {
        const match = text.match(/^if\s*\(\s*([^)]+)\s*\)(.*)$/);
        if (!match) throw new Error(`Invalid if statement: ${text}`);
        
        const [, condition] = match;
        
        return {
            type: 'if',
            condition: this.parseExpression(condition.trim())
        };
    }

    parseWhileStatement(text) {
        const match = text.match(/^while\s*\(\s*([^)]+)\s*\)(.*)$/);
        if (!match) throw new Error(`Invalid while statement: ${text}`);
        
        const [, condition] = match;
        
        return {
            type: 'while',
            condition: this.parseExpression(condition.trim())
        };
    }

    parseFunctionCall(text) {
        const match = text.match(/^(\w+)\s*\(\s*([^)]*)\s*\);?$/);
        if (!match) throw new Error(`Invalid function call: ${text}`);
        
        const [, name, args] = match;
        const arguments = args ? args.split(',').map(arg => this.parseExpression(arg.trim())) : [];
        
        return {
            type: 'call',
            name: name,
            arguments: arguments
        };
    }

    parseExpression(expr) {
        // Handle simple expressions for now
        
        // Number literal
        if (expr.match(/^-?\d+$/)) {
            return { type: 'literal', value: parseInt(expr) };
        }
        
        // Variable reference
        if (expr.match(/^\w+$/)) {
            return { type: 'variable', name: expr };
        }
        
        // Binary operation: x + y, x - y, etc.
        const binaryMatch = expr.match(/^(.+?)\s*([+\-*/<>=!]+)\s*(.+)$/);
        if (binaryMatch) {
            const [, left, operator, right] = binaryMatch;
            return {
                type: 'binary',
                operator: operator.trim(),
                left: this.parseExpression(left.trim()),
                right: this.parseExpression(right.trim())
            };
        }
        
        throw new Error(`Cannot parse expression: ${expr}`);
    }

    generate(ast) {
        this.output = [];
        this.output.push('.org 0');
        this.output.push('');
        
        // Generate code for each statement
        for (const statement of ast.statements) {
            this.generateStatement(statement);
        }
        
        // Add halt at the end
        this.output.push('HLT');
        this.output.push('');
        
        // Add variable storage section
        this.output.push('; Variable storage');
        for (const [name, address] of this.variables) {
            this.output.push(`; ${name} at address ${address}`);
        }
        
        return this.output.join('\n');
    }

    generateStatement(statement) {
        switch (statement.type) {
            case 'declaration':
                this.generateDeclaration(statement);
                break;
            case 'assignment':
                this.generateAssignment(statement);
                break;
            case 'if':
                this.generateIf(statement);
                break;
            case 'while':
                this.generateWhile(statement);
                break;
            case 'call':
                this.generateCall(statement);
                break;
            default:
                throw new Error(`Unknown statement type: ${statement.type}`);
        }
    }

    generateDeclaration(statement) {
        this.output.push(`; Declare ${statement.varType} ${statement.name}`);
        
        if (statement.initialValue) {
            // Generate code to evaluate initial value and store it
            this.generateExpression(statement.initialValue);
            this.output.push(`STA ${this.variables.get(statement.name)}`);
        }
        this.output.push('');
    }

    generateAssignment(statement) {
        this.output.push(`; ${statement.name} = ...`);
        this.generateExpression(statement.expression);
        this.output.push(`STA ${this.variables.get(statement.name)}`);
        this.output.push('');
    }

    generateExpression(expr) {
        switch (expr.type) {
            case 'literal':
                this.output.push(`LDA #${expr.value}`);
                break;
            case 'variable':
                if (!this.variables.has(expr.name)) {
                    throw new Error(`Undefined variable: ${expr.name}`);
                }
                this.output.push(`LDA ${this.variables.get(expr.name)}`);
                break;
            case 'binary':
                this.generateBinaryOperation(expr);
                break;
            default:
                throw new Error(`Unknown expression type: ${expr.type}`);
        }
    }

    generateBinaryOperation(expr) {
        // For now, simplify - just do operations directly without using registers
        // Generate left operand
        this.generateExpression(expr.left);
        
        // For simple operations, use immediate addressing where possible
        if (expr.right.type === 'literal') {
            // Right operand is a literal - use immediate addressing
            switch (expr.operator) {
                case '+':
                    this.output.push(`ADD #${expr.right.value}`);
                    break;
                case '-':
                    this.output.push(`SUB #${expr.right.value}`);
                    break;
                case '*':
                    this.output.push(`MUL #${expr.right.value}`);
                    break;
                default:
                    throw new Error(`Unsupported operator: ${expr.operator}`);
            }
        } else {
            // Right operand needs to be loaded from memory/register
            // Store left operand temporarily in a memory location
            const tempAddr = this.nextAddress++;
            this.output.push(`STA ${tempAddr}`);
            
            // Generate right operand
            this.generateExpression(expr.right);
            
            // Store right operand in another temp location
            const tempAddr2 = this.nextAddress++;
            this.output.push(`STA ${tempAddr2}`);
            
            // Load left operand back
            this.output.push(`LDA ${tempAddr}`);
            
            // Perform operation with right operand
            switch (expr.operator) {
                case '+':
                    this.output.push(`ADD ${tempAddr2}`);
                    break;
                case '-':
                    this.output.push(`SUB ${tempAddr2}`);
                    break;
                case '*':
                    this.output.push(`MUL ${tempAddr2}`);
                    break;
                default:
                    throw new Error(`Unsupported operator: ${expr.operator}`);
            }
        }
    }

    generateIf(statement) {
        const endLabel = `end_if_${this.labelCounter++}`;
        
        this.output.push(`; if condition`);
        this.generateCondition(statement.condition, endLabel);
        this.output.push(`${endLabel}:`);
        this.output.push('');
    }

    generateWhile(statement) {
        const startLabel = `while_start_${this.labelCounter}`;
        const endLabel = `while_end_${this.labelCounter++}`;
        
        this.output.push(`${startLabel}:`);
        this.output.push(`; while condition`);
        this.generateCondition(statement.condition, endLabel);
        this.output.push(`JMP ${startLabel}`);
        this.output.push(`${endLabel}:`);
        this.output.push('');
    }

    generateCondition(condition, endLabel) {
        if (condition.type === 'binary') {
            // Generate comparison using temporary memory addresses
            this.generateExpression(condition.left);
            const tempAddr1 = this.nextAddress++;
            this.output.push(`STA ${tempAddr1}`);
            
            this.generateExpression(condition.right);
            const tempAddr2 = this.nextAddress++;
            this.output.push(`STA ${tempAddr2}`);
            
            this.output.push(`LDA ${tempAddr1}`);
            this.output.push(`CMP ${tempAddr2}`);
            
            // Jump based on operator (note: logic might need to be inverted)
            switch (condition.operator) {
                case '==':
                    this.output.push(`JZ ${endLabel}`);
                    break;
                case '>':
                    this.output.push(`JP ${endLabel}`);
                    break;
                case '<':
                    this.output.push(`JN ${endLabel}`);
                    break;
                default:
                    throw new Error(`Unsupported comparison operator: ${condition.operator}`);
            }
        }
    }

    generateCall(statement) {
        switch (statement.name) {
            case 'print':
                if (statement.arguments.length !== 1) {
                    throw new Error('print() requires exactly one argument');
                }
                this.output.push(`; print(...)`);
                this.generateExpression(statement.arguments[0]);
                this.output.push('OUT');
                this.output.push('');
                break;
            default:
                throw new Error(`Unknown function: ${statement.name}`);
        }
    }

    // Example programs
    static getExampleProgram() {
        return `// Simple program that adds two numbers
int x = 10;
int y = 20;
int result = x + y;
print(result);`;
    }

    static getLoopExample() {
        return `// Countdown loop
int counter = 5;
while (counter > 0) {
    print(counter);
    counter = counter - 1;
}`;
    }

    static getConditionExample() {
        return `// Conditional logic
int x = 15;
if (x > 10) {
    print(x);
}`;
    }
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernaryHighLevelCompiler };
} else {
    // Browser environment - make it globally available
    window.TernaryHighLevelCompiler = TernaryHighLevelCompiler;
}