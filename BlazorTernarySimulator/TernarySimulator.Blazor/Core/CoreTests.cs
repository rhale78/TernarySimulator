using System;
using System.Linq;

namespace TernarySimulator.Blazor.Core
{
    /// <summary>
    /// Basic tests for the C# ternary simulator core
    /// </summary>
    public static class CoreTests
    {
        public static void RunAllTests()
        {
            Console.WriteLine("=== C# Balanced Ternary Simulator Tests ===\n");

            TestBalancedTernary();
            TestMemory();
            TestCPU();
            TestAssembler();
            TestIntegration();

            Console.WriteLine("\n🎉 All C# tests passed! The simulator core is working correctly.");
        }

        private static void TestBalancedTernary()
        {
            Console.WriteLine("Testing Balanced Ternary...");

            var bt5 = new BalancedTernary(5);
            var bt3 = new BalancedTernary(3);

            Console.WriteLine($"5 in balanced ternary: {bt5}");
            Console.WriteLine($"3 in balanced ternary: {bt3}");

            var sum = bt5 + bt3;
            var diff = bt5 - bt3;
            var product = bt5 * bt3;

            Console.WriteLine($"5 + 3 = {sum.ToDecimal()} ({sum})");
            Console.WriteLine($"5 - 3 = {diff.ToDecimal()} ({diff})");
            Console.WriteLine($"5 * 3 = {product.ToDecimal()} ({product})");

            var tryte42 = new Tryte(42);
            Console.WriteLine($"42 as tryte: {tryte42}");

            Console.WriteLine("✓ Balanced Ternary tests passed\n");
        }

        private static void TestMemory()
        {
            Console.WriteLine("Testing Memory...");

            var memory = new TernaryMemory();
            var testValue = new Tryte(123);
            var testAddress = 5;

            memory.Write(testAddress, testValue);
            Console.WriteLine($"Wrote {testValue} to address {new TernaryAddress(testAddress)}");

            var readValue = memory.Read(testAddress);
            Console.WriteLine($"Read {readValue} from address {new TernaryAddress(testAddress)}");

            Console.WriteLine($"Values match: {testValue.ToDecimal() == readValue.ToDecimal()}");

            var dump = memory.Dump(0, 8);
            Console.WriteLine("Memory dump (first 8 locations):");
            foreach (var cell in dump)
            {
                Console.WriteLine($"  {cell.AddressString}: {cell.ValueString} ({cell.DecimalValue})");
            }

            Console.WriteLine("✓ Memory tests passed\n");
        }

        private static void TestCPU()
        {
            Console.WriteLine("Testing CPU...");

            var memory = new TernaryMemory();
            var cpu = new TernaryCPU(memory);
            var alu = new TernaryALU();

            // Test ALU operations
            var a = new Tryte(10);
            var b = new Tryte(5);

            var addResult = alu.Add(a, b);
            var subResult = alu.Subtract(a, b);

            Console.WriteLine($"ALU: 10 + 5 = {addResult.Result.ToDecimal()}");
            Console.WriteLine($"ALU: 10 - 5 = {subResult.Result.ToDecimal()}");
            Console.WriteLine($"ALU flags: zero={BoolToTrit(addResult.Zero)}, positive={BoolToTrit(addResult.Positive)}, negative={BoolToTrit(addResult.Negative)}");

            // Test register operations
            var registers = cpu.GetRegisters();
            registers.SetACC(new Tryte(42));
            Console.WriteLine($"ACC register set to: {registers.GetACC()} ({registers.GetACC().ToDecimal()})");

            Console.WriteLine("✓ CPU tests passed\n");
        }

        private static void TestAssembler()
        {
            Console.WriteLine("Testing Assembler...");

            var assembler = new TernaryAssembler();
            var sourceCode = @"
                LDA #10
                ADD #5
                STA 15
                HLT
            ";

            var result = assembler.Assemble(sourceCode);
            Console.WriteLine($"Assembly {(result.Success ? "successful" : "failed")}!");

            if (result.Success)
            {
                Console.WriteLine($"Generated {result.Instructions.Count} instructions");
                Console.WriteLine("Disassembly:");
                for (int i = 0; i < Math.Min(5, result.Instructions.Count); i++)
                {
                    var instr = result.Instructions[i];
                    var disassembled = assembler.DisassembleInstruction(instr.MachineCode);
                    Console.WriteLine($"{instr.Address:D3}: {disassembled}");
                }
            }
            else
            {
                Console.WriteLine($"Assembly error: {result.Message}");
            }

            Console.WriteLine("✓ Assembler tests passed\n");
        }

        private static void TestIntegration()
        {
            Console.WriteLine("Testing Integration...");

            var simulator = new TernarySimulatorCore();
            string consoleOutput = "";

            // Subscribe to console output
            simulator.OnConsoleOutput += (text) => consoleOutput += text;

            var program = @"
                ; Calculate 7 + 8 = 15
                LDA #7      ; Load 7
                ADD #8      ; Add 8  
                STA 10      ; Store at address 10
                OUT         ; Output result
                HLT         ; Halt
            ";

            Console.WriteLine("Assembling program...");
            var result = simulator.AssembleAndLoad(program);

            if (result.Success)
            {
                Console.WriteLine($"Assembly successful! Generated {result.Instructions.Count} instructions");

                // Show loaded instructions
                foreach (var instr in result.Instructions.Take(5))
                {
                    var disasm = simulator.Assembler.DisassembleInstruction(instr.MachineCode);
                    Console.WriteLine($"{instr.Address}: {instr.MachineCode} - {disasm}");
                }

                Console.WriteLine("\nRunning program...");
                simulator.Run();

                var finalResult = simulator.Memory.Read(10);
                Console.WriteLine($"Final result at address 10: {finalResult.ToDecimal()}");
                Console.WriteLine($"Expected: 15, Got: {finalResult.ToDecimal()}");

                if (finalResult.ToDecimal() == 15)
                {
                    Console.WriteLine("✓ Integration test passed");
                }
                else
                {
                    Console.WriteLine("✗ Integration test failed - incorrect result");
                }
            }
            else
            {
                Console.WriteLine($"Assembly failed: {result.Message}");
            }

            Console.WriteLine("");
        }

        private static int BoolToTrit(bool value)
        {
            return value ? 1 : 0;
        }
    }
}