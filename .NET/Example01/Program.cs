using System;
using System.Diagnostics;
using System.Numerics;

namespace Example01
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
            NonSIMDMinMax(array, out min, out max);
            var time = sw.ElapsedMilliseconds;
            Console.WriteLine($"{count:#,###}\t\t[{min}, {max}], {time}ms");            
            sw = Stopwatch.StartNew();
            SIMDMinMax(array, out min, out max);
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

        // Pro spravny efekt musi byt aplikace nastavena jako 64bit
        public static void SIMDMinMax(ushort[] input, out ushort min, out ushort max)
        {
            var simdLength = Vector<ushort>.Count;            
            var vmin = new Vector<ushort>(ushort.MaxValue);
            var vmax = new Vector<ushort>(ushort.MinValue);
            var i = 0;

            for (i = 0; i <= input.Length - simdLength; i += simdLength)
            {
                var va = new Vector<ushort>(input, i);
                vmin = Vector.Min(va, vmin);
                vmax = Vector.Max(va, vmax);
            }

            min = ushort.MaxValue;
            max = ushort.MinValue;
            for (var j = 0; j < simdLength; ++j)
            {
                min = Math.Min(min, vmin[j]);
                max = Math.Max(max, vmax[j]);
            }

            for (; i < input.Length; ++i)
            {
                min = Math.Min(min, input[i]);
                max = Math.Max(max, input[i]);
            }
        }

        public static void NonSIMDMinMax(ushort[] input, out ushort min, out ushort max)
        {
            min = ushort.MaxValue;
            max = ushort.MinValue;
            foreach (var value in input)
            {
                min = Math.Min(min, value);
                max = Math.Max(max, value);
            }
        }
    }
}
