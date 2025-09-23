/**
 * High-Level Language Compiler for Ternary Assembly
 * Implements a simple C-like language that compiles to ternary assembly
 */

class TernaryHighLevelCompiler {
    constructor() {
        this.variables = new Map(); // variable name -> { address, type, size }
        this.structs = new Map(); // struct name -> { members, size }
        this.functions = new Map(); // function name -> { parameters, body, localVars }
        this.strings = new Map(); // string literals -> address
        this.nextAddress = 1000; // Start variables at address 1000
        this.stringAddress = 2000; // Start strings at address 2000
        this.labels = new Map();
        this.labelCounter = 0;
        this.output = [];
        this.currentLine = 0;
        this.currentFunction = null; // Track current function being compiled
        this.localVarCounter = 0; // For generating local variable addresses
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
        this.structs.clear();
        this.functions.clear();
        this.strings.clear();
        this.nextAddress = 1000;
        this.stringAddress = 2000;
        this.labels.clear();
        this.labelCounter = 0;
        this.output = [];
        this.currentLine = 0;
        this.currentFunction = null;
        this.localVarCounter = 0;
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
        // Struct definition: struct Point { int x; int y; };
        if (text.match(/^struct\s+\w+\s*\{[\s\S]*\}\s*;?\s*$/)) {
            return this.parseStructDefinition(text);
        }
        
        // Function definition: int add(int a, int b) { ... }
        if (text.match(/^(int|trit|void)\s+\w+\s*\([^)]*\)\s*\{[\s\S]*\}\s*$/)) {
            return this.parseFunctionDefinition(text);
        }
        
        // Variable declaration with pointers: int* ptr = &x;
        if (text.match(/^(int|trit|struct\s+\w+)\s*[\*]*\s*\w+(\s*=\s*[^;]+)?;?$/)) {
            return this.parseVariableDeclaration(text);
        }
        
        // Assignment with pointers: *ptr = 5; or ptr = &var;
        if (text.match(/^[\*]*\w+(\[[^\]]*\])?\s*=\s*[^;]+;?$/)) {
            return this.parseAssignment(text);
        }
        
        // Array declaration: int arr[10];
        if (text.match(/^(int|trit)\s+\w+\[[^\]]+\](\s*=\s*\{[^}]*\})?;?$/)) {
            return this.parseArrayDeclaration(text);
        }
        
        // If statement: if (x > 0)
        if (text.startsWith('if')) {
            return this.parseIfStatement(text);
        }
        
        // While loop: while (x > 0)
        if (text.startsWith('while')) {
            return this.parseWhileStatement(text);
        }
        
        // Return statement: return expr;
        if (text.startsWith('return')) {
            return this.parseReturnStatement(text);
        }
        
        // Function call: print(x);
        if (text.match(/^\w+\([^)]*\);?$/)) {
            return this.parseFunctionCall(text);
        }
        
        // Lock statement: lock(mutex) { ... }
        if (text.startsWith('lock')) {
            return this.parseLockStatement(text);
        }
        
        // Atomic statement: atomic { ... }
        if (text.startsWith('atomic')) {
            return this.parseAtomicStatement(text);
        }
        
        // Barrier statement: barrier()
        if (text.match(/^barrier\s*\(\s*\)\s*;?$/)) {
            return { type: 'barrier' };
        }
        
        // Thread creation: thread(function_name, arg)
        if (text.startsWith('thread')) {
            return this.parseThreadStatement(text);
        }
        
        return null;
    }

    parseVariableDeclaration(text) {
        // Enhanced pattern to match pointers and struct types
        const match = text.match(/^(int|trit|struct\s+\w+)\s*(\*?)\s*(\w+)(\[[^\]]+\])?(\s*=\s*([^;]+))?;?$/);
        if (!match) throw new Error(`Invalid variable declaration: ${text}`);
        
        const [, baseType, pointerStar, name, arraySize, , initialValue] = match;
        
        if (this.variables.has(name)) {
            throw new Error(`Variable '${name}' already declared`);
        }
        
        // Determine variable info
        const isPointer = pointerStar === '*';
        const isArray = arraySize !== undefined;
        let varSize = 1;
        let varType = baseType;
        
        if (isArray) {
            // Parse array size
            const sizeMatch = arraySize.match(/\[(\d+)\]/);
            if (sizeMatch) {
                varSize = parseInt(sizeMatch[1]);
            }
            varType = `${baseType}[]`;
        } else if (isPointer) {
            varType = `${baseType}*`;
        } else if (baseType.startsWith('struct')) {
            // Handle struct types
            const structName = baseType.split(' ')[1];
            if (this.structs.has(structName)) {
                varSize = this.structs.get(structName).size;
            } else {
                // If struct not found, default to size 1 for now
                varSize = 1;
                console.warn(`Warning: Struct type '${structName}' not defined, using size 1`);
            }
        }
        
        // Assign memory address
        const address = this.nextAddress;
        this.nextAddress += varSize;
        
        this.variables.set(name, {
            address: address,
            type: varType,
            size: varSize,
            isPointer: isPointer,
            isArray: isArray
        });
        
        return {
            type: 'declaration',
            varType: varType,
            name: name,
            size: varSize,
            isPointer: isPointer,
            isArray: isArray,
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
        const argList = args ? args.split(',').map(arg => this.parseExpression(arg.trim())) : [];
        
        return {
            type: 'call',
            name: name,
            arguments: argList
        };
    }

    parseStructDefinition(text) {
        const match = text.match(/^struct\s+(\w+)\s*\{([^}]*)\}\s*;?\s*$/);
        if (!match) throw new Error(`Invalid struct definition: ${text}`);
        
        const [, name, membersText] = match;
        const members = [];
        let totalSize = 0;
        
        // Parse struct members
        const memberLines = membersText.split(';').filter(line => line.trim());
        for (let memberLine of memberLines) {
            const memberMatch = memberLine.trim().match(/^(int|trit)\s+(\w+)$/);
            if (memberMatch) {
                const [, type, memberName] = memberMatch;
                members.push({ name: memberName, type: type, offset: totalSize });
                totalSize++;
            }
        }
        
        this.structs.set(name, { members: members, size: totalSize });
        
        return {
            type: 'struct',
            name: name,
            members: members,
            size: totalSize
        };
    }

    parseFunctionDefinition(text) {
        const match = text.match(/^(int|trit|void)\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*)\}\s*$/);
        if (!match) throw new Error(`Invalid function definition: ${text}`);
        
        const [, returnType, name, paramsText, bodyText] = match;
        
        // Parse parameters
        const parameters = [];
        if (paramsText.trim()) {
            const paramList = paramsText.split(',');
            for (let param of paramList) {
                const paramMatch = param.trim().match(/^(int|trit)\s+(\w+)$/);
                if (paramMatch) {
                    const [, type, paramName] = paramMatch;
                    parameters.push({ name: paramName, type: type });
                }
            }
        }
        
        // Parse function body (simplified - just collect statements)
        const bodyLines = bodyText.split(';').filter(line => line.trim());
        
        this.functions.set(name, {
            returnType: returnType,
            parameters: parameters,
            body: bodyLines,
            localVars: new Map()
        });
        
        return {
            type: 'function',
            name: name,
            returnType: returnType,
            parameters: parameters,
            body: bodyLines
        };
    }

    parseArrayDeclaration(text) {
        const match = text.match(/^(int|trit)\s+(\w+)\[(\d+)\](\s*=\s*\{([^}]*)\})?;?$/);
        if (!match) throw new Error(`Invalid array declaration: ${text}`);
        
        const [, type, name, sizeStr, , initValues] = match;
        const size = parseInt(sizeStr);
        
        if (this.variables.has(name)) {
            throw new Error(`Variable '${name}' already declared`);
        }
        
        // Assign memory address
        const address = this.nextAddress;
        this.nextAddress += size;
        
        this.variables.set(name, {
            address: address,
            type: `${type}[]`,
            size: size,
            isArray: true
        });
        
        // Parse initial values if provided
        let initialValues = null;
        if (initValues) {
            initialValues = initValues.split(',').map(val => 
                this.parseExpression(val.trim())
            );
        }
        
        return {
            type: 'arrayDeclaration',
            varType: `${type}[]`,
            name: name,
            size: size,
            initialValues: initialValues
        };
    }

    parseReturnStatement(text) {
        const match = text.match(/^return\s*([^;]*);?$/);
        if (!match) throw new Error(`Invalid return statement: ${text}`);
        
        const [, expression] = match;
        
        return {
            type: 'return',
            expression: expression.trim() ? this.parseExpression(expression.trim()) : null
        };
    }

    parseExpression(expr) {
        // String literals
        if (expr.match(/^"[^"]*"$/)) {
            const str = expr.slice(1, -1); // Remove quotes
            if (!this.strings.has(str)) {
                this.strings.set(str, this.stringAddress);
                this.stringAddress += str.length + 1; // Include null terminator
            }
            return { type: 'string', value: str, address: this.strings.get(str) };
        }
        
        // Number literal
        if (expr.match(/^-?\d+$/)) {
            return { type: 'literal', value: parseInt(expr) };
        }
        
        // Address-of operator: &variable
        if (expr.match(/^&\w+$/)) {
            const varName = expr.slice(1);
            return { type: 'addressOf', variable: varName };
        }
        
        // Dereference operator: *pointer
        if (expr.match(/^\*\w+$/)) {
            const varName = expr.slice(1);
            return { type: 'dereference', variable: varName };
        }
        
        // Array indexing: arr[index]
        const arrayMatch = expr.match(/^(\w+)\[([^\]]+)\]$/);
        if (arrayMatch) {
            const [, arrayName, indexExpr] = arrayMatch;
            return {
                type: 'arrayAccess',
                array: arrayName,
                index: this.parseExpression(indexExpr.trim())
            };
        }
        
        // Member access: struct.member
        const memberMatch = expr.match(/^(\w+)\.(\w+)$/);
        if (memberMatch) {
            const [, structVar, member] = memberMatch;
            return {
                type: 'memberAccess',
                object: structVar,
                member: member
            };
        }
        
        // Function call in expression: func(args)
        const funcCallMatch = expr.match(/^(\w+)\s*\(\s*([^)]*)\s*\)$/);
        if (funcCallMatch) {
            const [, name, args] = funcCallMatch;
            const argList = args ? args.split(',').map(arg => this.parseExpression(arg.trim())) : [];
            return {
                type: 'functionCall',
                name: name,
                arguments: argList
            };
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
        
        throw new Error(`Unable to parse expression: ${expr}`);
    }
        
    parseLockStatement(text) {
        // Parse: lock(mutex_name) { ... }
        const match = text.match(/^lock\s*\(\s*(\w+)\s*\)\s*\{([\s\S]*)\}\s*$/);
        if (!match) throw new Error(`Invalid lock statement: ${text}`);
        
        const [, mutexName, body] = match;
        
        // Parse the body statements
        const bodyStatements = [];
        if (body.trim()) {
            const bodyLines = body.split(';').filter(line => line.trim());
            for (const line of bodyLines) {
                const stmt = this.parseStatement(line.trim());
                if (stmt) bodyStatements.push(stmt);
            }
        }
        
        return {
            type: 'lock',
            mutex: mutexName,
            body: bodyStatements
        };
    }
    
    parseAtomicStatement(text) {
        // Parse: atomic { ... }
        const match = text.match(/^atomic\s*\{([\s\S]*)\}\s*$/);
        if (!match) throw new Error(`Invalid atomic statement: ${text}`);
        
        const body = match[1];
        
        // Parse the body statements
        const bodyStatements = [];
        if (body.trim()) {
            const bodyLines = body.split(';').filter(line => line.trim());
            for (const line of bodyLines) {
                const stmt = this.parseStatement(line.trim());
                if (stmt) bodyStatements.push(stmt);
            }
        }
        
        return {
            type: 'atomic',
            body: bodyStatements
        };
    }
    
    parseThreadStatement(text) {
        // Parse: thread(function_name, arg1, arg2, ...)
        const match = text.match(/^thread\s*\(\s*(\w+)(?:\s*,\s*([^)]*))?\s*\)\s*;?$/);
        if (!match) throw new Error(`Invalid thread statement: ${text}`);
        
        const [, functionName, args] = match;
        
        const argList = [];
        if (args && args.trim()) {
            const argTokens = args.split(',');
            for (const arg of argTokens) {
                argList.push(this.parseExpression(arg.trim()));
            }
        }
        
        return {
            type: 'thread',
            function: functionName,
            arguments: argList
        };
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
            case 'arrayDeclaration':
                this.generateArrayDeclaration(statement);
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
            case 'return':
                this.generateReturn(statement);
                break;
            case 'struct':
                this.generateStruct(statement);
                break;
            case 'function':
                this.generateFunction(statement);
                break;
            case 'lock':
                this.generateLock(statement);
                break;
            case 'atomic':
                this.generateAtomic(statement);
                break;
            case 'barrier':
                this.generateBarrier(statement);
                break;
            case 'thread':
                this.generateThread(statement);
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
            const varInfo = this.variables.get(statement.name);
            this.output.push(`STA ${varInfo.address}`);
        }
        this.output.push('');
    }

    generateAssignment(statement) {
        this.output.push(`; ${statement.name} = ...`);
        this.generateExpression(statement.expression);
        const varInfo = this.variables.get(statement.name);
        this.output.push(`STA ${varInfo.address}`);
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
                const varInfo = this.variables.get(expr.name);
                this.output.push(`LDA ${varInfo.address}`);
                break;
            case 'string':
                this.output.push(`LDA #${expr.address}`);
                break;
            case 'addressOf':
                if (!this.variables.has(expr.variable)) {
                    throw new Error(`Undefined variable: ${expr.variable}`);
                }
                const addrVarInfo = this.variables.get(expr.variable);
                this.output.push(`LDA #${addrVarInfo.address}`);
                break;
            case 'dereference':
                if (!this.variables.has(expr.variable)) {
                    throw new Error(`Undefined variable: ${expr.variable}`);
                }
                const ptrInfo = this.variables.get(expr.variable);
                this.output.push(`LDA ${ptrInfo.address}`); // Load pointer value
                this.output.push(`LDX ACC`); // Use as index
                this.output.push(`LDA (IX)`); // Indirect addressing
                break;
            case 'arrayAccess':
                if (!this.variables.has(expr.array)) {
                    throw new Error(`Undefined array: ${expr.array}`);
                }
                const arrayInfo = this.variables.get(expr.array);
                this.generateExpression(expr.index);
                this.output.push(`ADD #${arrayInfo.address}`);
                this.output.push(`LDX ACC`);
                this.output.push(`LDA (IX)`);
                break;
            case 'memberAccess':
                if (!this.variables.has(expr.object)) {
                    throw new Error(`Undefined struct: ${expr.object}`);
                }
                const structInfo = this.variables.get(expr.object);
                const structType = structInfo.type.replace('struct ', '');
                if (!this.structs.has(structType)) {
                    throw new Error(`Unknown struct type: ${structType}`);
                }
                const structDef = this.structs.get(structType);
                const member = structDef.members.find(m => m.name === expr.member);
                if (!member) {
                    throw new Error(`Unknown member: ${expr.member}`);
                }
                this.output.push(`LDA ${structInfo.address + member.offset}`);
                break;
            case 'functionCall':
                // Generate function call - simplified version
                this.output.push(`JSR ${expr.name}`);
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
                case '/':
                    this.output.push(`DIV #${expr.right.value}`);
                    break;
                case '%':
                    this.output.push(`MOD #${expr.right.value}`);
                    break;
                case '^':
                    this.output.push(`XOR #${expr.right.value}`);
                    break;
                case '&':
                    this.output.push(`AND #${expr.right.value}`);
                    break;
                case '|':
                    this.output.push(`OR #${expr.right.value}`);
                    break;
                // Binary mode operations (prefixed with b)
                case 'b+':
                    this.output.push(`BADD #${expr.right.value}`);
                    break;
                case 'b-':
                    this.output.push(`BSUB #${expr.right.value}`);
                    break;
                case 'b*':
                    this.output.push(`BMUL #${expr.right.value}`);
                    break;
                case 'b/':
                    this.output.push(`BDIV #${expr.right.value}`);
                    break;
                case 'b&':
                    this.output.push(`BAND #${expr.right.value}`);
                    break;
                case 'b|':
                    this.output.push(`BOR #${expr.right.value}`);
                    break;
                case 'b^':
                    this.output.push(`BXOR #${expr.right.value}`);
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
                case '/':
                    this.output.push(`DIV ${tempAddr2}`);
                    break;
                case '%':
                    this.output.push(`MOD ${tempAddr2}`);
                    break;
                case '^':
                    this.output.push(`XOR ${tempAddr2}`);
                    break;
                case '&':
                    this.output.push(`AND ${tempAddr2}`);
                    break;
                case '|':
                    this.output.push(`OR ${tempAddr2}`);
                    break;
                // Binary mode operations
                case 'b+':
                    this.output.push(`BADD ${tempAddr2}`);
                    break;
                case 'b-':
                    this.output.push(`BSUB ${tempAddr2}`);
                    break;
                case 'b*':
                    this.output.push(`BMUL ${tempAddr2}`);
                    break;
                case 'b/':
                    this.output.push(`BDIV ${tempAddr2}`);
                    break;
                case 'b&':
                    this.output.push(`BAND ${tempAddr2}`);
                    break;
                case 'b|':
                    this.output.push(`BOR ${tempAddr2}`);
                    break;
                case 'b^':
                    this.output.push(`BXOR ${tempAddr2}`);
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
            case 'ternaryToBinary':
                this.output.push(`; ternaryToBinary()`);
                if (statement.arguments.length === 1) {
                    this.generateExpression(statement.arguments[0]);
                }
                this.output.push('T2B');
                this.output.push('');
                break;
            case 'binaryToTernary':
                this.output.push(`; binaryToTernary()`);
                if (statement.arguments.length === 1) {
                    this.generateExpression(statement.arguments[0]);
                }
                this.output.push('B2T');
                this.output.push('');
                break;
            case 'binaryNot':
                this.output.push(`; binaryNot()`);
                if (statement.arguments.length === 1) {
                    this.generateExpression(statement.arguments[0]);
                }
                this.output.push('BNOT');
                this.output.push('');
                break;
            case 'wordDivide':
                if (statement.arguments.length !== 2) {
                    throw new Error('wordDivide() requires exactly two arguments');
                }
                this.output.push(`; wordDivide(...)`);
                this.generateExpression(statement.arguments[0]);
                this.output.push('LDAW');
                this.generateExpression(statement.arguments[1]);
                this.output.push('DIVW');
                this.output.push('');
                break;
            case 'tripleDivide':
                if (statement.arguments.length !== 2) {
                    throw new Error('tripleDivide() requires exactly two arguments');
                }
                this.output.push(`; tripleDivide(...)`);
                this.generateExpression(statement.arguments[0]);
                this.output.push('LDAT');
                this.generateExpression(statement.arguments[1]);
                this.output.push('DIVT');
                this.output.push('');
                break;
            case 'wordXor':
                if (statement.arguments.length !== 2) {
                    throw new Error('wordXor() requires exactly two arguments');
                }
                this.output.push(`; wordXor(...)`);
                this.generateExpression(statement.arguments[0]);
                this.output.push('LDAW');
                this.generateExpression(statement.arguments[1]);
                this.output.push('XORW');
                this.output.push('');
                break;
            case 'tripleXor':
                if (statement.arguments.length !== 2) {
                    throw new Error('tripleXor() requires exactly two arguments');
                }
                this.output.push(`; tripleXor(...)`);
                this.generateExpression(statement.arguments[0]);
                this.output.push('LDAT');
                this.generateExpression(statement.arguments[1]);
                this.output.push('XORT');
                this.output.push('');
                break;
            // Add standard library functions
            case 'strlen':
                this.generateStrlen(statement);
                break;
            case 'strcpy':
                this.generateStrcpy(statement);
                break;
            case 'abs':
                this.generateAbs(statement);
                break;
            case 'pow':
                this.generatePow(statement);
                break;
            case 'printf':
                this.generatePrintf(statement);
                break;
            case 'scanf':
                this.generateScanf(statement);
                break;
                
            // Extended string functions
            case 'strcat':
                this.generateStrcat(statement);
                break;
            case 'strcmp':
                this.generateStrcmp(statement);
                break;
            case 'prints':
                this.generatePrints(statement);
                break;
            case 'inputs':
                this.generateInputs(statement);
                break;
            case 'getkey':
                this.generateGetkey(statement);
                break;
            case 'putchar':
                this.generatePutchar(statement);
                break;
                
            // Graphics functions
            case 'setpixel':
                this.generateSetpixel(statement);
                break;
            case 'getpixel':
                this.generateGetpixel(statement);
                break;
            case 'drawline':
                this.generateDrawline(statement);
                break;
            case 'drawrect':
                this.generateDrawrect(statement);
                break;
            case 'drawcircle':
                this.generateDrawcircle(statement);
                break;
            case 'clearscreen':
                this.generateClearscreen(statement);
                break;
            case 'setcursor':
                this.generateSetcursor(statement);
                break;
            case 'getcursor':
                this.generateGetcursor(statement);
                break;
            case 'settextcolor':
                this.generateSettextcolor(statement);
                break;
            case 'setbackground':
                this.generateSetbackground(statement);
                break;
                
            default:
                // Check if this is a user-defined function
                if (this.functions.has(statement.name)) {
                    this.generateUserFunctionCall(statement);
                } else {
                    throw new Error(`Unknown function: ${statement.name}`);
                }
        }
    }

    generateUserFunctionCall(statement) {
        const func = this.functions.get(statement.name);
        
        if (statement.arguments.length !== func.parameters.length) {
            throw new Error(`Function ${statement.name} expects ${func.parameters.length} arguments, got ${statement.arguments.length}`);
        }
        
        this.output.push(`; Function call: ${statement.name}`);
        
        // Push arguments onto stack in reverse order (right to left)
        for (let i = statement.arguments.length - 1; i >= 0; i--) {
            this.generateExpression(statement.arguments[i]);
            this.output.push('PSH'); // Push argument onto stack
        }
        
        // Call the function
        this.output.push(`CALL ${statement.name}_func`);
        
        // Clean up stack (remove arguments)
        for (let i = 0; i < statement.arguments.length; i++) {
            this.output.push('POP'); // Remove arguments from stack
        }
        
        this.output.push(''); // Add blank line
    }

    // Standard library function implementations
    generateStrlen(statement) {
        if (statement.arguments.length !== 1) {
            throw new Error('strlen() requires exactly one argument');
        }
        this.output.push(`; strlen(...)`);
        this.generateExpression(statement.arguments[0]); // String address
        this.output.push('CALL strlen_func');
        this.output.push('');
    }

    generateStrcpy(statement) {
        if (statement.arguments.length !== 2) {
            throw new Error('strcpy() requires exactly two arguments');
        }
        this.output.push(`; strcpy(dest, src)`);
        this.generateExpression(statement.arguments[1]); // Source
        this.output.push('PSH');
        this.generateExpression(statement.arguments[0]); // Destination
        this.output.push('CALL strcpy_func');
        this.output.push('POP'); // Clean up stack
        this.output.push('');
    }

    generateAbs(statement) {
        if (statement.arguments.length !== 1) {
            throw new Error('abs() requires exactly one argument');
        }
        this.output.push(`; abs(...)`);
        this.generateExpression(statement.arguments[0]);
        this.output.push('CALL abs_func');
        this.output.push('');
    }

    generatePow(statement) {
        if (statement.arguments.length !== 2) {
            throw new Error('pow() requires exactly two arguments');
        }
        this.output.push(`; pow(base, exponent)`);
        this.generateExpression(statement.arguments[1]); // Exponent
        this.output.push('PSH');
        this.generateExpression(statement.arguments[0]); // Base
        this.output.push('CALL pow_func');
        this.output.push('POP'); // Clean up stack
        this.output.push('');
    }

    generatePrintf(statement) {
        // Simplified printf - just print the first argument for now
        if (statement.arguments.length === 0) {
            throw new Error('printf() requires at least one argument');
        }
        this.output.push(`; printf(...)`);
        this.generateExpression(statement.arguments[0]);
        this.output.push('OUT');
        this.output.push('');
    }

    generateScanf(statement) {
        // Simplified scanf - read into first argument
        if (statement.arguments.length === 0) {
            throw new Error('scanf() requires at least one argument');
        }
        this.output.push(`; scanf(...)`);
        this.output.push('IN'); // Read input
        // Store into the variable (simplified)
        this.output.push('OUT'); // Echo for now
        this.output.push('');
    }
    
    // =================== EXTENDED STRING FUNCTION GENERATORS ===================
    
    generateStrcat(statement) {
        if (statement.arguments.length !== 2) {
            throw new Error('strcat() requires exactly two arguments');
        }
        this.output.push(`; strcat(dest, src)`);
        this.generateExpression(statement.arguments[1]); // Source
        this.output.push('STA temp_src');
        this.generateExpression(statement.arguments[0]); // Destination  
        this.output.push('STA IX');
        this.output.push('LDA temp_src');
        this.output.push('STA IX1');
        this.output.push('STRCAT');
        this.output.push('');
    }
    
    generateStrcmp(statement) {
        if (statement.arguments.length !== 2) {
            throw new Error('strcmp() requires exactly two arguments');
        }
        this.output.push(`; strcmp(str1, str2)`);
        this.generateExpression(statement.arguments[1]); // String 2
        this.output.push('STA temp_str2');
        this.generateExpression(statement.arguments[0]); // String 1
        this.output.push('STA IX');
        this.output.push('LDA temp_str2');
        this.output.push('STA IX1');
        this.output.push('STRCMP');
        this.output.push('');
    }
    
    generatePrints(statement) {
        if (statement.arguments.length !== 1) {
            throw new Error('prints() requires exactly one argument');
        }
        this.output.push(`; prints(str)`);
        this.generateExpression(statement.arguments[0]); // String address
        this.output.push('PRINTS');
        this.output.push('');
    }
    
    generateInputs(statement) {
        if (statement.arguments.length !== 2) {
            throw new Error('inputs() requires exactly two arguments (buffer, maxlen)');
        }
        this.output.push(`; inputs(buffer, maxlen)`);
        this.generateExpression(statement.arguments[1]); // Max length
        this.output.push('STA temp_maxlen');
        this.generateExpression(statement.arguments[0]); // Buffer address
        this.output.push('STA IX');
        this.output.push('LDA temp_maxlen');
        this.output.push('STA IX1');
        this.output.push('INPUTS');
        this.output.push('');
    }
    
    generateGetkey(statement) {
        if (statement.arguments.length !== 0) {
            throw new Error('getkey() requires no arguments');
        }
        this.output.push(`; getkey()`);
        this.output.push('GETKEY');
        this.output.push('');
    }
    
    generatePutchar(statement) {
        if (statement.arguments.length !== 1) {
            throw new Error('putchar() requires exactly one argument');
        }
        this.output.push(`; putchar(ch)`);
        this.generateExpression(statement.arguments[0]); // Character
        this.output.push('PUTCHAR');
        this.output.push('');
    }
    
    // =================== GRAPHICS FUNCTION GENERATORS ===================
    
    generateSetpixel(statement) {
        if (statement.arguments.length !== 3) {
            throw new Error('setpixel() requires exactly three arguments (x, y, color)');
        }
        this.output.push(`; setpixel(x, y, color)`);
        this.generateExpression(statement.arguments[2]); // Color
        this.output.push('STA temp_color');
        this.generateExpression(statement.arguments[1]); // Y
        this.output.push('STA IX1');
        this.generateExpression(statement.arguments[0]); // X
        this.output.push('STA IX');
        this.output.push('LDA temp_color');
        this.output.push('SETPIX');
        this.output.push('');
    }
    
    generateGetpixel(statement) {
        if (statement.arguments.length !== 2) {
            throw new Error('getpixel() requires exactly two arguments (x, y)');
        }
        this.output.push(`; getpixel(x, y)`);
        this.generateExpression(statement.arguments[1]); // Y
        this.output.push('STA temp_y');
        this.generateExpression(statement.arguments[0]); // X
        this.output.push('STA IX');
        this.output.push('LDA temp_y');
        this.output.push('GETPIX');
        this.output.push('');
    }
    
    generateDrawline(statement) {
        if (statement.arguments.length !== 5) {
            throw new Error('drawline() requires exactly five arguments (x1, y1, x2, y2, color)');
        }
        this.output.push(`; drawline(x1, y1, x2, y2, color)`);
        this.generateExpression(statement.arguments[4]); // Color
        this.output.push('STA ACC'); // Store color in accumulator
        this.generateExpression(statement.arguments[3]); // Y2
        this.output.push('STA temp_y2');
        this.generateExpression(statement.arguments[2]); // X2
        this.output.push('STA IX2');
        this.generateExpression(statement.arguments[1]); // Y1
        this.output.push('STA IX1');
        this.generateExpression(statement.arguments[0]); // X1
        this.output.push('STA IX');
        this.output.push('LDA temp_y2');
        this.output.push('DRAWLINE');
        this.output.push('');
    }
    
    generateDrawrect(statement) {
        if (statement.arguments.length !== 5) {
            throw new Error('drawrect() requires exactly five arguments (x, y, width, height, color)');
        }
        this.output.push(`; drawrect(x, y, width, height, color)`);
        this.generateExpression(statement.arguments[4]); // Color
        this.output.push('STA ACC');
        this.generateExpression(statement.arguments[3]); // Height
        this.output.push('STA temp_height');
        this.generateExpression(statement.arguments[2]); // Width
        this.output.push('STA IX2');
        this.generateExpression(statement.arguments[1]); // Y
        this.output.push('STA IX1');
        this.generateExpression(statement.arguments[0]); // X
        this.output.push('STA IX');
        this.output.push('LDA temp_height');
        this.output.push('DRAWRECT');
        this.output.push('');
    }
    
    generateDrawcircle(statement) {
        if (statement.arguments.length !== 4) {
            throw new Error('drawcircle() requires exactly four arguments (x, y, radius, color)');
        }
        this.output.push(`; drawcircle(x, y, radius, color)`);
        this.generateExpression(statement.arguments[3]); // Color
        this.output.push('STA ACC');
        this.generateExpression(statement.arguments[2]); // Radius
        this.output.push('STA temp_radius');
        this.generateExpression(statement.arguments[1]); // Y
        this.output.push('STA IX1');
        this.generateExpression(statement.arguments[0]); // X
        this.output.push('STA IX');
        this.output.push('LDA temp_radius');
        this.output.push('DRAWCIRC');
        this.output.push('');
    }
    
    generateClearscreen(statement) {
        if (statement.arguments.length !== 1) {
            throw new Error('clearscreen() requires exactly one argument (color)');
        }
        this.output.push(`; clearscreen(color)`);
        this.generateExpression(statement.arguments[0]); // Color
        this.output.push('CLRSCR');
        this.output.push('');
    }
    
    generateSetcursor(statement) {
        if (statement.arguments.length !== 2) {
            throw new Error('setcursor() requires exactly two arguments (x, y)');
        }
        this.output.push(`; setcursor(x, y)`);
        this.generateExpression(statement.arguments[1]); // Y
        this.output.push('STA temp_y');
        this.generateExpression(statement.arguments[0]); // X
        this.output.push('STA IX');
        this.output.push('LDA temp_y');
        this.output.push('SETCURS');
        this.output.push('');
    }
    
    generateGetcursor(statement) {
        if (statement.arguments.length !== 0) {
            throw new Error('getcursor() requires no arguments');
        }
        this.output.push(`; getcursor()`);
        this.output.push('GETCURS');
        this.output.push('');
    }
    
    generateSettextcolor(statement) {
        if (statement.arguments.length !== 1) {
            throw new Error('settextcolor() requires exactly one argument (color)');
        }
        this.output.push(`; settextcolor(color)`);
        this.generateExpression(statement.arguments[0]); // Color
        this.output.push('SETTXT');
        this.output.push('');
    }
    
    generateSetbackground(statement) {
        if (statement.arguments.length !== 1) {
            throw new Error('setbackground() requires exactly one argument (color)');
        }
        this.output.push(`; setbackground(color)`);
        this.generateExpression(statement.arguments[0]); // Color
        this.output.push('SETBG');
        this.output.push('');
    }

    generateArrayDeclaration(statement) {
        this.output.push(`; Declare array ${statement.varType} ${statement.name}[${statement.size}]`);
        
        if (statement.initialValues) {
            const varInfo = this.variables.get(statement.name);
            for (let i = 0; i < statement.initialValues.length && i < statement.size; i++) {
                this.generateExpression(statement.initialValues[i]);
                this.output.push(`STA ${varInfo.address + i}`);
            }
        }
        this.output.push('');
    }

    generateStruct(statement) {
        this.output.push(`; Struct ${statement.name} defined with ${statement.members.length} members`);
        this.output.push('');
    }

    generateFunction(statement) {
        const func = this.functions.get(statement.name);
        
        this.output.push(`${statement.name}_func:`);
        this.output.push(`; Function: ${statement.name}`);
        
        // Set up stack frame
        this.output.push('PSH R1'); // Save old frame pointer
        this.output.push('LDA SP'); // Get current stack pointer
        this.output.push('STA R1'); // Set new frame pointer
        
        // Reserve space for local variables
        const localVarCount = func ? func.localVars.size : 0;
        if (localVarCount > 0) {
            this.output.push(`LDA #${localVarCount}`);
            this.output.push('ADD SP');
            this.output.push('STA SP'); // Adjust stack pointer
        }
        
        // Generate function body 
        for (let bodyLine of statement.body) {
            if (bodyLine.trim()) {
                try {
                    const stmt = this.parseStatement(bodyLine.trim());
                    if (stmt) {
                        this.generateStatement(stmt);
                    }
                } catch (e) {
                    // Simple statement generation for now
                    this.output.push(`; ${bodyLine.trim()}`);
                }
            }
        }
        
        // Function epilogue
        this.output.push(`${statement.name}_func_end:`);
        this.output.push('LDA R1'); // Restore stack pointer from frame pointer
        this.output.push('STA SP');
        this.output.push('POP R1'); // Restore old frame pointer
        
        if (statement.returnType !== 'void') {
            this.output.push('RET'); // Return value in ACC
        } else {
            this.output.push('RET'); // Return to caller
        }
        this.output.push('');
    }

    generateLock(statement) {
        const lockLabel = `lock_${this.labelCounter}`;
        const unlockLabel = `unlock_${this.labelCounter}`;
        const endLabel = `lock_end_${this.labelCounter++}`;
        
        this.output.push(`; Lock statement for mutex: ${statement.mutex}`);
        
        // Acquire the lock (simplified implementation)
        this.output.push(`${lockLabel}:`);
        this.output.push(`LDA #1`); // Try to acquire lock
        this.output.push(`STA ${statement.mutex}_mutex`); // Store in mutex variable
        
        // Check if lock was acquired (in real implementation, this would be atomic)
        this.output.push(`LDA ${statement.mutex}_mutex`);
        this.output.push(`CMP #1`);
        this.output.push(`JNZ ${lockLabel}`); // Spin if lock not acquired
        
        // Critical section - execute body statements
        this.output.push(`; Critical section start`);
        for (const bodyStmt of statement.body) {
            this.generateStatement(bodyStmt);
        }
        this.output.push(`; Critical section end`);
        
        // Release the lock
        this.output.push(`${unlockLabel}:`);
        this.output.push(`LDA #0`); // Release lock
        this.output.push(`STA ${statement.mutex}_mutex`);
        
        this.output.push(`${endLabel}:`);
        this.output.push('');
    }
    
    generateAtomic(statement) {
        const atomicLabel = `atomic_${this.labelCounter++}`;
        
        this.output.push(`; Atomic block start`);
        this.output.push(`${atomicLabel}:`);
        this.output.push(`CLI`); // Disable interrupts
        
        // Execute atomic operations
        for (const bodyStmt of statement.body) {
            this.generateStatement(bodyStmt);
        }
        
        this.output.push(`SEI`); // Re-enable interrupts
        this.output.push(`; Atomic block end`);
        this.output.push('');
    }
    
    generateBarrier(statement) {
        this.output.push(`; Memory barrier`);
        this.output.push(`NOP`); // In a real implementation, this would be a memory fence
        this.output.push(`NOP`); // Multiple NOPs to ensure memory ordering
        this.output.push(`NOP`);
        this.output.push('');
    }
    
    generateThread(statement) {
        const threadLabel = `thread_${this.labelCounter++}`;
        
        this.output.push(`; Create thread for function: ${statement.function}`);
        this.output.push(`${threadLabel}:`);
        
        // Push thread arguments onto stack
        for (let i = statement.arguments.length - 1; i >= 0; i--) {
            this.generateExpression(statement.arguments[i]);
            this.output.push('PSH');
        }
        
        // Create thread (simplified - in real implementation would use system call)
        this.output.push(`LDA #${statement.function}_func`); // Function address
        this.output.push(`STA IX`); // Pass function address in IX
        this.output.push(`LDA #8`); // System call for thread creation
        this.output.push(`SYSCALL`); // Create thread via system call
        
        // Clean up arguments
        for (let i = 0; i < statement.arguments.length; i++) {
            this.output.push('POP');
        }
        
        this.output.push('');
    }

    generateReturn(statement) {
        if (statement.expression) {
            this.generateExpression(statement.expression);
        }
        this.output.push('RTS');
        this.output.push('');
    }

    generateIf(statement) {
        const elseLabel = `else_${this.labelCounter++}`;
        const endLabel = `endif_${this.labelCounter++}`;
        
        this.generateExpression(statement.condition);
        this.output.push(`CMP #0`);
        this.output.push(`JZ ${elseLabel}`);
        this.output.push(`JMP ${endLabel}`);
        this.output.push(`${elseLabel}:`);
        this.output.push(`${endLabel}:`);
        this.output.push('');
    }

    generateWhile(statement) {
        const startLabel = `while_start_${this.labelCounter++}`;
        const endLabel = `while_end_${this.labelCounter++}`;
        
        this.output.push(`${startLabel}:`);
        this.generateExpression(statement.condition);
        this.output.push(`CMP #0`);
        this.output.push(`JZ ${endLabel}`);
        // Loop body would go here
        this.output.push(`JMP ${startLabel}`);
        this.output.push(`${endLabel}:`);
        this.output.push('');
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

    static getPointerExample() {
        return `// Pointer demonstration
int x = 42;
int* ptr = &x;
int value = *ptr;
print(value);`;
    }

    static getStructExample() {
        return `// Struct demonstration
struct Point {
    int x;
    int y;
};

struct Point p;
p.x = 10;
p.y = 20;
print(p.x);
print(p.y);`;
    }

    static getArrayExample() {
        return `// Array demonstration
int numbers[5] = {1, 2, 3, 4, 5};
int i = 0;
while (i < 5) {
    print(numbers[i]);
    i = i + 1;
}`;
    }

    static getFunctionExample() {
        return `// Function demonstration
int add(int a, int b) {
    return a + b;
}

int result = add(10, 20);
print(result);`;
    }

    static getStringExample() {
        return `// String demonstration
print("Hello World!");
print("Ternary Programming");`;
    }
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TernaryHighLevelCompiler };
} else {
    // Browser environment - make it globally available
    window.TernaryHighLevelCompiler = TernaryHighLevelCompiler;
}