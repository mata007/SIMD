
const maxFloat = 3.40282347e+38;
const minFloat = -3.40282347e+38;

function generateArray(count) {
    let result = new Float32Array(count);
    for (let i = 0; i < count; i++)
        //result[i] = maxFloat * 2 * Math.random() - maxFloat;
        result[i] = 32000 * 2 * Math.random() - 32000;
    return result;
}

function SIMDMinMax(input) {
    const simdLength = 16 / 4 | 0;
    let vmax = SIMD.Float32x4(minFloat, minFloat, minFloat, minFloat);
    let vmin = SIMD.Float32x4(maxFloat, maxFloat, maxFloat, maxFloat);
    let i = 0;
    const lenght1 = input.length - simdLength;
    for (i = 0; i <= lenght1; i += simdLength) {
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

    const lenght2 = input.length;
    for (; i < lenght2; ++i) {
        min = Math.min(min, input[i]);
        max = Math.max(max, input[i]);
    }

    return { min, max };
}

function SIMDMinMaxModule(stdlib, foreign, buffer) {
    "use asm";
    const maxFloat = 3.40282347e+38;
    const minFloat = -3.40282347e+38;

    const f4 = stdlib.SIMD.Float32x4;
    const f4load = f4.load; // stdlib.SIMD.Float32x4.load nejde použít jelokož v asm.js mohou být maximálně 2 tečky
    const f4min = f4.min;
    const f4max = f4.max;
    const f4EL = f4.extractLane;
    const mmax = stdlib.Math.max;
    const mmin = stdlib.Math.min;

    const inputU8 = new stdlib.Uint8Array(buffer);
    const inputF32 = new stdlib.Float32Array(buffer);
    const simdLength = 4;
    const simdLengthBytes = 16;
    const mk4 = 0x000ffff0;

    //const vmaxC = f4(+minFloat, +minFloat, +minFloat, +minFloat);
    //const vminC = f4(+maxFloat, +maxFloat, +maxFloat, +maxFloat);

    const vmaxC = f4(-3.40282347e+38, -3.40282347e+38, -3.40282347e+38, -3.40282347e+38);
    const vminC = f4(3.40282347e+38, 3.40282347e+38, 3.40282347e+38, 3.40282347e+38);

    function minmax(length) {
        length = length | 0;
        var vmax = vmaxC;
        var vmin = vminC;
        var va = vmaxC;
        var i = 0;
        var length1 = 0;
        var min = 0.0;
        var max = 0.0;
        var j = 0;

        length1 = (length * 4) | 0 - simdLengthBytes | 0;
        for (i = 0; (i | 0) <= (length1 | 0) ; i = (i + simdLengthBytes) | 0) {
            va = f4load(inputU8, i);
            vmin = f4min(va, vmin);
            vmax = f4max(va, vmax);
        }
        /*
        min = mmin(+maxFloat, +f4EL(vmin, 0), +f4EL(vmin, 1), +f4EL(vmin, 2), +f4EL(vmin, 3)); // musí být "+" před f4EL aby doslo k přetypování jinak kompilator řve že float neni double :-(
        max = mmax(+minFloat, +f4EL(vmax, 0), +f4EL(vmax, 1), +f4EL(vmax, 2), +f4EL(vmax, 3));
        */
        /*
        i = (i|0 / 4|0) | 0;
        for (; (i|0) < (length|0); ++i) {
            min = mmin(min, inputF32[i]);
            max = mmax(max, inputF32[i]);
        }
        */

        inputF32[0] = min;
        inputF32[1] = max;
    }

    return minmax;
}

function MinMax(input) {
    let min = maxFloat;
    let max = minFloat;
    const lenght = input.length;

    for (let i = 0; i < lenght; ++i) {
        min = Math.min(min, input[i]);
        max = Math.max(max, input[i]);
    }

    return { min, max };
    }

let logData = [];

function log(text) {
    logData.push(text);
}

function sendLogs() {
    console.log(logData);
    postMessage(logData);
    logData = [];
}

function testCount(count) {
    let startTime = performance.now();
    let array = generateArray(count);
    let endTime = performance.now();
    log(`Iterations: ${count}, ${endTime - startTime}ms`);

    /*
    try {
        let startTime = performance.now();
        let result = { min: Math.min(...array), max: Math.max(...array) };
        let endTime = performance.now();
        log(`01 find:                   [${result.min}, ${result.max}], ${endTime - startTime}ms`);
    }  catch (e) {
          console.error(e);
          log(`01 Error: ${e.message}`);
    }
    */

    try {
        let startTime = performance.now();
        let result = MinMax(array);
        let endTime = performance.now();
        log(`02 find:                   [${result.min}, ${result.max}], ${endTime - startTime}ms`);
    } catch (e) {
        console.error(e);
        log(`02 Error: ${e.message}`);
    }

    if (self.SIMD && SIMD.Float32x4) {
        try {
            let startTime = performance.now();
            let result = SIMDMinMax(array);
            let endTime = performance.now();
            log(`03 SIMD find:          [${result.min}, ${result.max}], ${endTime - startTime}ms`);
        } catch (e) {
            console.error(e);
            log(`03 Error: ${e.message}`);
        }

        try {
            let startTime = performance.now();
            let minmax = SIMDMinMaxModule(self, null, array.buffer);
            minmax(count);
            let result = { min: array[0], max: array[1] };
            let endTime = performance.now();
            log(`04 SIMD asm.js find:   [${result.min}, ${result.max}], ${endTime - startTime}ms`);
        } catch (e) {
            console.error(e);
            log(`04 Error: ${e.message}`);
        }        
    }

    sendLogs();
}


function test() {
    testCount((0x10000 / 4) | 0); // heap pro asm.js nemuze mit jakoukoli velikost
    testCount((0x80000 / 4) | 0);
    testCount((0x400000 / 4) | 0);
    testCount((0x3000000 / 4) | 0);
    testCount((0x18000000 / 4) | 0);
    testCount((0x30000000 / 4) | 0);
    testCount((0x78000000 / 4) | 0);
}

onmessage = () => { test(); }
