
export class Renderer {
    constructor(canvas, diskCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Optional Circular View
        this.diskCanvas = diskCanvas;
        this.diskCtx = diskCanvas ? diskCanvas.getContext('2d') : null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        // Dynamic resizing for high DPI
        const dpr = window.devicePixelRatio || 1;

        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;

        if (this.diskCanvas) {
            const dRect = this.diskCanvas.parentElement.getBoundingClientRect();
            this.diskCanvas.width = dRect.width * dpr;
            this.diskCanvas.height = dRect.height * dpr;
            this.diskCtx.scale(dpr, dpr);
            this.dWidth = dRect.width;
            this.dHeight = dRect.height;
        }
    }

    render(state) {
        if (!state) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
        if (this.diskCtx) this.diskCtx.clearRect(0, 0, this.dWidth, this.dHeight);

        this.drawTimeline(state);
        if (this.diskCtx) this.drawDisk(state);
    }

    drawTimeline(state) {
        const { steps, currentTrack, diskSize } = state;
        const ctx = this.ctx;

        const padding = 40;
        const chartHeight = this.height - padding * 2;
        const chartWidth = this.width - padding * 2;

        // Scale X: Step index
        // Scale Y: Track number (0 at top or bottom? Traditionally 0 at top in some, but let's do 0 bottom for graph)
        // Actually for Disk Scheduling, Y axis is Track Number. X axis is Time (Step).

        const stepWidth = chartWidth / (steps.length > 1 ? steps.length - 1 : 1);

        // Grid
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        // Horizontal lines (Tracks)
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight * i) / 4;
            ctx.moveTo(padding, y);
            ctx.lineTo(this.width - padding, y);

            // Label
            ctx.fillStyle = '#aaa';
            ctx.font = '10px Rajdhani';
            const trackVal = Math.round(diskSize - (diskSize * i) / 4); // Inverted visually?
            // Let's put 0 at TOP usually for Disk diagrams (like usually seen in textbooks)
            // Or 0 at Top Y.
            // Let's do 0 at Top.
            ctx.fillText((i * diskSize / 4).toString(), 10, padding + (chartHeight * i) / 4 + 4);
        }
        ctx.stroke();

        // Draw Path
        ctx.beginPath();
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';

        steps.forEach((step, index) => {
            const x = padding + index * stepWidth;
            const y = padding + (step.track / diskSize) * chartHeight;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Reset Shadow
        ctx.shadowBlur = 0;

        // Draw Points
        steps.forEach((step, index) => {
            const x = padding + index * stepWidth;
            const y = padding + (step.track / diskSize) * chartHeight;

            // Served requests
            if (step.description.includes("Serve") || step.description === "Start") {
                ctx.beginPath();
                ctx.fillStyle = '#ff00ff';
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw Current Head Position (Animated)
        // Need to find X based on current partial step
        // currentStepIndex + progress
        const interpIndex = state.stepIndex + state.progress;
        const curX = padding + interpIndex * stepWidth;
        const curY = padding + (currentTrack / diskSize) * chartHeight;

        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fff';
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw current track value tooltip
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(curX + 10, curY - 20, 60, 24);
        ctx.fillStyle = '#0aff00';
        ctx.font = 'bold 12px Rajdhani';
        ctx.fillText(`TRK: ${Math.round(currentTrack)}`, curX + 15, curY - 4);

        // Draw "Sweeper" line line vertical
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.moveTo(curX, padding);
        ctx.lineTo(curX, this.height - padding);
        ctx.stroke();
    }

    drawDisk(state) {
        const ctx = this.diskCtx;
        const cx = this.dWidth / 2;
        const cy = this.dHeight / 2;
        const maxRadius = Math.min(cx, cy) - 20;

        const { currentTrack, diskSize } = state;

        // Concentric circles representing tracks
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
        ctx.lineWidth = 1;

        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const r = maxRadius * (i + 1) / 5;
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Current Head Ring
        const headRadius = (currentTrack / diskSize) * maxRadius;
        ctx.beginPath();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.arc(cx, cy, Math.max(0, headRadius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Simulation of "Spinning" platter
        const time = performance.now() / 1000;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 2); // Spin

        // Draw sectors lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(maxRadius, 0);
            ctx.stroke();
        }

        ctx.restore();
    }
}
