
import { Engine } from './simulation/Engine.js';
import { Renderer } from './ui/Renderer.js';
import { initWasm } from './algorithms/wasm_loader.js';
import './style.css';

// DOM Elements
const els = {
    algoSelect: document.getElementById('algo-select'),
    directionGroup: document.getElementById('direction-group'),
    dirLeft: document.getElementById('dir-left'),
    dirRight: document.getElementById('dir-right'),
    stepsizeGroup: document.getElementById('stepsize-group'),
    stepSize: document.getElementById('step-size'),
    stepSizeVal: document.getElementById('step-size-val'),
    requestInput: document.getElementById('request-input'),
    btnRandomize: document.getElementById('btn-randomize'),
    headStart: document.getElementById('head-start'),
    headVal: document.getElementById('head-val'),
    btnRun: document.getElementById('btn-run'),
    btnPlay: document.getElementById('btn-play'),
    btnPause: document.getElementById('btn-pause'),
    btnStop: document.getElementById('btn-stop'),
    simSpeed: document.getElementById('sim-speed'),
    timelineCanvas: document.getElementById('timeline-canvas'),
    diskCanvas: document.getElementById('disk-canvas'),
    scrubber: document.getElementById('scrubber'),
    logMonitor: document.getElementById('log-monitor'),
    statTotalSeek: document.getElementById('stat-total-seek'),
    statAvgSeek: document.getElementById('stat-avg-seek')
};

// UI State
const uiState = {
    requests: [],
    headStart: 53,
    diskSize: 200,
    algorithm: 'FCFS',
    direction: 'right',
    stepSize: 5
};

// Algorithms that support direction
const DIRECTIONAL_ALGOS = ['SCAN', 'LOOK', 'CSCAN', 'CLOOK', 'FSCAN', 'NSTEP'];

function updateDirectionVisibility() {
    const algo = els.algoSelect.value;
    const show = DIRECTIONAL_ALGOS.includes(algo);
    els.directionGroup.style.display = show ? '' : 'none';
}

function updateStepSizeVisibility() {
    const algo = els.algoSelect.value;
    els.stepsizeGroup.style.display = algo === 'NSTEP' ? '' : 'none';
}

// Log Helper
function log(msg) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = `> ${msg}`;
    els.logMonitor.prepend(line);
}

// Engine Setup
const engine = new Engine({
    onCalculationDone: (result) => {
        log(`Algorithm: ${uiState.algorithm}`);
        log(`Total Seek: ${result.totalSeek}`);
        log(`Steps: ${result.steps.length}`);

        // Update Scale
        els.statTotalSeek.textContent = result.totalSeek;
        const avg = result.steps.length > 1 ? (result.totalSeek / (result.steps.length - 1)).toFixed(2) : 0;
        els.statAvgSeek.textContent = avg;

        // Reset Scrubber
        els.scrubber.max = 1000;
        els.scrubber.value = 0;
    },
    onRender: (renderState) => {
        renderer.render(renderState);

        // Update Scrubber UI to match Engine state
        // state.stepIndex + state.progress
        // Mapping 0..steps.length-1 to 0..1000
        const total = renderState.totalSteps - 1;
        if (total > 0) {
            const current = renderState.stepIndex + renderState.progress;
            const ratio = current / total;
            if (document.activeElement !== els.scrubber) {
                els.scrubber.value = ratio * 1000;
            }
        }
    },
    onStepComplete: (step) => {
        // Optional: Log each step
        // log(step.description); 
    },
    onStateChange: (state) => {
        if (state) renderer.render(state);
    }
});

const renderer = new Renderer(els.timelineCanvas, els.diskCanvas);
renderer.resize();

// Event Listeners
els.headStart.addEventListener('input', (e) => {
    els.headVal.textContent = e.target.value;
    uiState.headStart = parseInt(e.target.value);
});

// Direction toggle buttons
els.dirLeft.addEventListener('click', () => {
    uiState.direction = 'left';
    els.dirLeft.classList.add('active');
    els.dirRight.classList.remove('active');
    log('Direction set: LEFT');
});

els.dirRight.addEventListener('click', () => {
    uiState.direction = 'right';
    els.dirRight.classList.add('active');
    els.dirLeft.classList.remove('active');
    log('Direction set: RIGHT');
});

// Show/hide direction & step-size on algorithm change
els.algoSelect.addEventListener('change', () => {
    updateDirectionVisibility();
    updateStepSizeVisibility();
});

// Step size slider
els.stepSize.addEventListener('input', (e) => {
    els.stepSizeVal.textContent = e.target.value;
    uiState.stepSize = parseInt(e.target.value);
});

els.btnRandomize.addEventListener('click', () => {
    const count = 8 + Math.floor(Math.random() * 10);
    const reqs = [];
    for (let i = 0; i < count; i++) {
        reqs.push(Math.floor(Math.random() * 199));
    }
    els.requestInput.value = reqs.join(', ');
    log("Generated Random Sequence");
});

els.btnRun.addEventListener('click', () => {
    parseInput();
    const algo = els.algoSelect.value;
    engine.init({
        requests: uiState.requests,
        headStart: uiState.headStart,
        algorithm: algo,
        diskSize: 200,
        direction: uiState.direction,
        stepSize: uiState.stepSize
    });
    engine.play();
    uiState.algorithm = algo;
    if (DIRECTIONAL_ALGOS.includes(algo)) {
        log(`Direction: ${uiState.direction.toUpperCase()}`);
    }
    if (algo === 'NSTEP') {
        log(`Step Size: ${uiState.stepSize}`);
    }
});

els.btnPlay.addEventListener('click', () => engine.play());
els.btnPause.addEventListener('click', () => engine.pause());
els.btnStop.addEventListener('click', () => engine.stop());

els.simSpeed.addEventListener('input', (e) => {
    engine.setSpeed(parseInt(e.target.value));
});

els.scrubber.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const ratio = val / 1000;
    engine.seek(ratio);
});

function parseInput() {
    const str = els.requestInput.value;
    uiState.requests = str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
}

// Initial Launch — must wait for WASM to load
(async () => {
    await initWasm();
    log('WASM MODULE LOADED.');

    parseInput(); // load default
    updateDirectionVisibility(); // set initial visibility
    updateStepSizeVisibility(); // set initial step-size visibility
    engine.init({
        requests: uiState.requests,
        headStart: 53,
        algorithm: 'FCFS',
        diskSize: 200,
        direction: 'right',
        stepSize: 5
    });
    renderer.render(engine.getRenderState());
})();

// Educational Mode Logic
const algoInfo = {
    'FCFS': {
        title: 'First-Come, First-Served (FCFS)',
        desc: 'Requests are addressed in the order they arrive in the disk queue.',
        pros: 'Simple, fair (no starvation).',
        cons: 'Poor performance, high seek time (wild swings).'
    },
    'SSTF': {
        title: 'Shortest Seek Time First (SSTF)',
        desc: 'Selects the request with the minimum seek time from the current head position.',
        pros: 'Reduces total seek time compared to FCFS.',
        cons: 'May cause starvation for distant requests.'
    },
    'SCAN': {
        title: 'SCAN (Elevator)',
        desc: ' The disk arm starts at one end of the disk, and moves toward the other end, servicing requests, then reverses.',
        pros: 'High throughput, low variance of response time.',
        cons: 'Long wait times for requests at the far end.'
    },
    'LOOK': {
        title: 'LOOK',
        desc: 'Similar to SCAN, but only goes as far as the last request in each direction, then reverses immediately.',
        pros: 'Better than SCAN (avoids useless seek to end).',
        cons: 'Still has directional bias.'
    },
    'CSCAN': {
        title: 'C-SCAN (Circular SCAN)',
        desc: 'Restricts scanning to one direction only. When the end is reached, it jumps to the beginning without servicing.',
        pros: 'Provides more uniform wait time.',
        cons: 'Wasted seek time jumping to start.'
    },
    'CLOOK': {
        title: 'C-LOOK',
        desc: 'Version of C-SCAN that only goes to the last request, then jumps to the first request.',
        pros: 'More efficient than C-SCAN.',
        cons: 'Implementation overhead.'
    },
    'FSCAN': {
        title: 'FSCAN (Freeze-SCAN)',
        desc: 'Uses two queues: the current queue is frozen and serviced with SCAN while new requests go into a second queue.',
        pros: 'Prevents starvation, fair to new arrivals.',
        cons: 'New requests must wait for next sweep.'
    },
    'NSTEP': {
        title: 'N-Step SCAN',
        desc: 'Divides the request queue into sub-queues of size N. Each sub-queue is processed using SCAN independently.',
        pros: 'Balances response time, prevents starvation.',
        cons: 'Performance depends on choice of N.'
    }
};

const overlay = document.getElementById('education-overlay');
const btnInfo = document.getElementById('btn-info');

btnInfo.addEventListener('click', () => {
    overlay.classList.toggle('hidden');
    updateOverlay();
});

function updateOverlay() {
    const info = algoInfo[els.algoSelect.value];
    overlay.innerHTML = `
      <div class="glass-panel info-card">
         <button class="close-btn" onclick="document.getElementById('education-overlay').classList.add('hidden')">×</button>
         <h2>${info.title}</h2>
         <p>${info.desc}</p>
         <div class="pros-cons">
            <div class="col">
               <h4>PROS</h4>
               <ul>${info.pros.split(',').map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
             <div class="col">
               <h4>CONS</h4>
               <ul>${info.cons.split(',').map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
         </div>
      </div>
   `;
}

els.algoSelect.addEventListener('change', () => {
    if (!overlay.classList.contains('hidden')) updateOverlay();
});

log("SYSTEM ONLINE. WAITING FOR INPUT.");
