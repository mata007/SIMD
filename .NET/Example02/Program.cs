using JM.LinqFaster.SIMD;
using System;
using System.Diagnostics;
using System.Linq;
using System.Numerics;

namespace Example02
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine($"Vector length {Vector<ushort>.Count}");
            test(100000);
            test(1000000);
            test(10000000);
            test(100000000);
            Console.ReadLine();
        }

        static void test(int count)
        {
            ushort min, max;
            var array = GenerateArray(count);
            var sw = Stopwatch.StartNew();
            min = array.Min();
            max = array.Max();
            var time = sw.ElapsedMilliseconds;
            Console.WriteLine($"{count:#,###}\t\t[{min}, {max}], {time}ms");
            sw = Stopwatch.StartNew();
            min = array.MinS();
            max = array.MaxS();
            time = sw.ElapsedMilliseconds;
            Console.WriteLine($"{count:#,###}\t\t[{min}, {max}], {time}ms");
            Console.WriteLine();
        }

        public static ushort[] GenerateArray(int length)
        {
            var random = new Random();
            var array = new ushort[length];
            for (var i = 0; i < length; i++)
                array[i] = (ushort)random.Next(ushort.MaxValue);
            return array;
        }
    }
}
