# Paralelní zpracování pomocí SIMD

 V tomto projektu je něco málo o SIMD a několik jednoduchých příkládků v C# a Javacriptu

### Trochu historie

Je to zkratka pro Single Instruction, Multiple Data. 

Počátky v architektuře x86 sahají do konce devadesátých let, kdy byla zavedená instrukční sada MMX. Ta používala zatím jen 64 bitové registry, ale i tehdy jsme mohli zpracovat například 4 16bit, nebo 8 8bit čísel naráz. Následovali 3DNow!, SSE(128bit.), AVX (256bit), až po poslední Intelácký počin AVX-512 (už delší dobu v Xeon procesorech a od 2018 v Cannonlake generaci procesorů). 

Podobné technologie byli i na jiných procesorových architekturách. Na PowerPC už koncem devadesátých let AltiVec (128bit). 
V ARMech je například technologie NEON (zatím pouze 128bit).

### .NET

S příchodem .NET 4.6 a jeho 64bit JIT kompilátorem RyuJIT, přichází i podpora SSE2 a AVX2 (https://blogs.msdn.microsoft.com/dotnet/2015/07/20/announcing-net-framework-4-6/). V NuGet balíčku System.Numerics.Vectors je implementovaná podpora pro HW akcelerované vektory (se SSE2 128bit s AVX2 256bit). Abychom tohle mohli využít misí aplikace běžet jako 64 bitová. Property Vector<T>.Count uvádí velikost vektoru na základě HW.

```
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
```

### JavaScript

Podpora SIMD pomalu přichází i do webu.

Původně se plánovalo zavést přímo do ECMAScriptu třídu SIMD, ale nakonec se od toho odstoupilo, jelikož kód stejně hodně ztrácel výkon tím, že to běží ve scriptu.
Testovací implementace je v Edge a nočních buildech Firefoxu. Rozumně se tato technologie stejně dala využít pouze v asm.js, ale ani tam to není ideální, a tak se rozhodlo, že se to bude implementovat pouze ve WebAssembly.

Příklady:
http://peterjensen.github.io/idf2014-simd/idf2014-simd

```
function SIMDMinMax(input) {
    const simdLength = 16 / 4 | 0;
    let vmax = SIMD.Float32x4(minFloat, minFloat, minFloat, minFloat);
    let vmin = SIMD.Float32x4(maxFloat, maxFloat, maxFloat, maxFloat);
    let i = 0;
    const length = input.length - simdLength;
    for (i = 0; i <= length; i += simdLength) {
        var va = SIMD.Float32x4.load(input, i);
        vmin = SIMD.Float32x4.min(va, vmin);
        vmax = SIMD.Float32x4.max(va, vmax);
    }

    let min = maxFloat;
    let max = minFloat;
    for (var j = 0; j < simdLength; ++j) {
        min = Math.min(min, SIMD.Float32x4.extractLane(vmin, j));
        max = Math.max(max, SIMD.Float32x4.extractLane(vmax, j));
    }

    const length2 = input.length;
    for (; i < length2; ++i) {
        min = Math.min(min, input[i]);
        max = Math.max(max, input[i]);
    }

    return { min, max };
}
```

