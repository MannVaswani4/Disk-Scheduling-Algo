/**
 * wasm_loader.js - Loads the WASM scheduler module and provides
 * high-level calculate* functions for each disk scheduling algorithm.
 *
 * Each function returns { steps: [{ track, description }], totalSeek }
 * which is the format Engine.js expects.
 */

import createSchedulerModule from '../wasm/scheduler.mjs';

let wasmModule = null;
let isReady = false;
let readyPromise = null;

/**
 * Initialize the WASM module. Call this once at startup.
 * Returns a promise that resolves when WASM is loaded.
 */
export function initWasm() {
    if (readyPromise) return readyPromise;

    readyPromise = createSchedulerModule().then((module) => {
        wasmModule = module;
        isReady = true;
        console.log('[WASM] Scheduler module loaded successfully');
        return module;
    });

    return readyPromise;
}

/**
 * Helper: Write the request array into WASM memory, run the algorithm,
 * then read back the steps and totalSeek.
 */
function runAlgorithm(algoFn, requests, head, extraArgs = []) {
    if (!isReady) throw new Error('WASM module not initialized. Call initWasm() first.');

    const n = requests.length;

    // Get pointer to the request buffer in WASM memory
    const reqBufPtr = wasmModule._get_request_buffer();

    // Write request values into WASM memory (int32 = 4 bytes each)
    for (let i = 0; i < n; i++) {
        wasmModule.HEAP32[(reqBufPtr >> 2) + i] = requests[i];
    }

    // Call the algorithm wrapper
    algoFn(head, n, ...extraArgs);

    // Read results
    const totalSeek = wasmModule._get_total_seek();
    const numSteps = wasmModule._get_num_steps();
    const stepsBufPtr = wasmModule._get_steps_buffer();

    // Read the track sequence from WASM memory
    const steps = [];
    for (let i = 0; i < numSteps; i++) {
        const track = wasmModule.HEAP32[(stepsBufPtr >> 2) + i];
        let description;

        if (i === 0) {
            description = 'Start';
        } else {
            const prevTrack = wasmModule.HEAP32[(stepsBufPtr >> 2) + (i - 1)];
            const seek = Math.abs(track - prevTrack);
            description = `Serve ${track} (seek: ${seek})`;
        }

        steps.push({ track, description });
    }

    return { steps, totalSeek };
}

/* ---- Public API matching what Engine.js expects ---- */

export function calculateFCFS(requests, headStart) {
    return runAlgorithm(
        (head, n) => wasmModule._run_fcfs(head, n),
        requests, headStart
    );
}

export function calculateSSTF(requests, headStart) {
    return runAlgorithm(
        (head, n) => wasmModule._run_sstf(head, n),
        requests, headStart
    );
}

export function calculateSCAN(requests, headStart, diskSize, direction) {
    const dir = direction === 'right' ? 1 : 0;
    return runAlgorithm(
        (head, n, ds, d) => wasmModule._run_scan(head, n, d, ds),
        requests, headStart, [diskSize, dir]
    );
}

export function calculateLOOK(requests, headStart, direction) {
    const dir = direction === 'right' ? 1 : 0;
    return runAlgorithm(
        (head, n, d) => wasmModule._run_look(head, n, d),
        requests, headStart, [dir]
    );
}

export function calculateCSCAN(requests, headStart, diskSize, direction) {
    const dir = direction === 'right' ? 1 : 0;
    return runAlgorithm(
        (head, n, ds, d) => wasmModule._run_cscan(head, n, d, ds),
        requests, headStart, [diskSize, dir]
    );
}

export function calculateCLOOK(requests, headStart, direction) {
    const dir = direction === 'right' ? 1 : 0;
    return runAlgorithm(
        (head, n, d) => wasmModule._run_clook(head, n, d),
        requests, headStart, [dir]
    );
}

export function calculateFSCAN(requests, headStart, diskSize, direction) {
    const dir = direction === 'right' ? 1 : 0;
    return runAlgorithm(
        (head, n, ds, d) => wasmModule._run_fscan(head, n, d, ds),
        requests, headStart, [diskSize, dir]
    );
}

export function calculateNStepSCAN(requests, headStart, diskSize, direction, stepSize) {
    const dir = direction === 'right' ? 1 : 0;
    return runAlgorithm(
        (head, n, ds, d, ss) => wasmModule._run_nstep_scan(head, n, d, ds, ss),
        requests, headStart, [diskSize, dir, stepSize]
    );
}
