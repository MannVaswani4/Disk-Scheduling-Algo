
import { calculateFCFS } from '../algorithms/fcfs.js';
import { calculateSSTF } from '../algorithms/sstf.js';
import { calculateSCAN } from '../algorithms/scan.js';
import { calculateLOOK } from '../algorithms/look.js';
import { calculateCSCAN } from '../algorithms/cscan.js';
import { calculateCLOOK } from '../algorithms/clook.js';
import { calculateNSTEPSCAN } from '../algorithms/nscan.js';
import { calculateFSCAN } from '../algorithms/fscan.js';

export class Engine {
    constructor(callbacks) {
        this.callbacks = callbacks || {};
        this.state = {
            requests: [],
            headStart: 53,
            diskSize: 200,
            direction: 'right',
            algorithm: 'FCFS',

            // Simulation state
            steps: [],
            totalSeek: 0,
            currentStepIndex: 0,
            progress: 0, // 0.0 to 1.0 within current step
            isPlaying: false,
            speed: 1.0, // Multiplier
            isFinished: false
        };

        this.lastFrameTime = 0;
        this.animationId = null;
    }

    init(config) {
        this.stop();
        this.state.requests = config.requests || [];
        this.state.headStart = config.headStart || 0;
        this.state.diskSize = config.diskSize || 200;
        this.state.direction = config.direction || 'right';
        this.state.algorithm = config.algorithm || 'FCFS';

        this.calculate();
        this.reset();
    }

    calculate() {
        const { algorithm, requests, headStart, diskSize, direction } = this.state;
        let result;

        switch (algorithm) {
            case 'FCFS': result = calculateFCFS(requests, headStart); break;
            case 'SSTF': result = calculateSSTF(requests, headStart); break;
            case 'SCAN': result = calculateSCAN(requests, headStart, diskSize, direction); break;
            case 'LOOK': result = calculateLOOK(requests, headStart, direction); break;
            case 'CSCAN': result = calculateCSCAN(requests, headStart, diskSize, direction); break;
            case 'CLOOK': result = calculateCLOOK(requests, headStart, direction); break;
            case 'NSTEPSCAN': result = calculateNSTEPSCAN(requests, headStart, diskSize, direction); break;
            case 'FSCAN': result = calculateFSCAN(requests, headStart, diskSize, direction); break;
            default: result = calculateFCFS(requests, headStart);
        }

        this.state.steps = result.steps;
        this.state.totalSeek = result.totalSeek;

        if (this.callbacks.onCalculationDone) {
            this.callbacks.onCalculationDone(result);
        }
    }

    reset() {
        this.state.currentStepIndex = 0;
        this.state.progress = 0;
        this.state.isFinished = false;
        this.state.isPlaying = false;
        if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.getRenderState());
    }

    play() {
        if (this.state.isFinished) this.reset();
        this.state.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.loop();
    }

    pause() {
        this.state.isPlaying = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    stop() {
        this.pause();
        this.reset();
    }

    setSpeed(val) {
        this.state.speed = val;
    }

    seek(progressPercent) {
        // 0.0 to 1.0
        // Map to total steps
        const totalSteps = this.state.steps.length - 1;
        if (totalSteps <= 0) return;

        const val = progressPercent * totalSteps;
        this.state.currentStepIndex = Math.floor(val);
        this.state.progress = val - Math.floor(val);
        this.state.isFinished = false;
        this.callbacks.onStateChange(this.getRenderState());
    }

    loop(timestamp) {
        if (!this.state.isPlaying) return;

        if (!timestamp) timestamp = performance.now();
        const dt = (timestamp - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = timestamp;

        this.update(dt);

        if (this.callbacks.onRender) {
            this.callbacks.onRender(this.getRenderState());
        }

        this.animationId = requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        if (this.state.currentStepIndex >= this.state.steps.length - 1) {
            this.state.isFinished = true;
            this.pause();
            return;
        }

        // Speed calculation
        // Base speed: 1 step per second?
        // distance based? usually time based for visualization is better for step-by-step
        // Let's maximize visual appeal. 
        // Constant time between stops? Or constant speed (long seek takes longer)?
        // "Interactive" means we probably want constant speed for realism, but maybe capped.

        const currentStep = this.state.steps[this.state.currentStepIndex];
        const nextStep = this.state.steps[this.state.currentStepIndex + 1];
        const distance = Math.abs(nextStep.track - currentStep.track);

        // speed multiplier
        const speedFactor = this.state.speed * 60; // tracks per second

        // time to cover distance
        // if distance is 0 (instant), handle
        let stepDuration = 0.5; // default 0.5s per step if constant time
        if (distance > 0) {
            stepDuration = distance / speedFactor;
            // visual cap: don't be too slow or too fast
            if (stepDuration < 0.1) stepDuration = 0.1;
            if (stepDuration > 2.0) stepDuration = 2.0;
        } else {
            stepDuration = 0.1; // jump
        }

        const progressIncrement = dt / stepDuration;

        this.state.progress += progressIncrement;

        if (this.state.progress >= 1) {
            this.state.progress = 0;
            this.state.currentStepIndex++;
            // Trigger "Step Done" event
            if (this.callbacks.onStepComplete) {
                this.callbacks.onStepComplete(this.state.steps[this.state.currentStepIndex]);
            }
        }
    }

    getRenderState() {
        if (this.state.steps.length === 0) return null;

        const currentStr = this.state.steps[this.state.currentStepIndex];
        const nextStr = this.state.steps[this.state.currentStepIndex + 1];

        let currentTrack = currentStr.track;

        if (nextStr) {
            // Interpolate
            // Using easeInOut
            const t = this.easeInOutQuad(this.state.progress);
            currentTrack = currentStr.track + (nextStr.track - currentStr.track) * t;
        }

        return {
            currentTrack,
            currentStep: currentStr,
            nextStep: nextStr,
            progress: this.state.progress,
            stepIndex: this.state.currentStepIndex,
            totalSteps: this.state.steps.length,
            steps: this.state.steps,
            diskSize: this.state.diskSize
        };
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
}
