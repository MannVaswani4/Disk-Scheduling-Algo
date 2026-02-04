export function calculateCSCAN(requests, headStart, diskSize = 200, direction = 'right') {
    let currentHead = headStart;
    let totalSeek = 0;
    const steps = [];

    let queue = [...requests].sort((a, b) => a - b);
    let right = queue.filter(r => r >= headStart);
    let left = queue.filter(r => r < headStart);

    let sequence = [];

    // C-SCAN always goes one direction (usually right), then jumps to start
    if (direction === 'right') {
        sequence = [...right];
        if (left.length > 0) {
            sequence.push(diskSize - 1); // Go to end
            sequence.push(0); // Jump to 0 (Seek? Some definitions don't count jump, but we usually do or just reset)
            // Usually C-SCAN counts distance from end to 0? Or just 0 seek?
            // Let's assume standard: Head moves to end, then immediately to 0. 
            // The jump (size-1 -> 0) is often ignored in seek count calculation or treated as 0-seek jump. 
            // For this visualizer, let's show the jump.
            sequence = [...sequence, ...left];
        }
    } else {
        // Left C-SCAN
        sequence = [...queue.filter(r => r <= headStart).sort((a, b) => b - a)];
        if (queue.filter(r => r > headStart).length > 0) {
            sequence.push(0);
            sequence.push(diskSize - 1);
            sequence = [...sequence, ...queue.filter(r => r > headStart).sort((a, b) => b - a)];
        }
    }

    // Initial state
    steps.push({
        track: currentHead,
        seek: 0,
        totalSeek: 0,
        requestsLeft: [...requests],
        description: "Start"
    });

    let processed = new Set();

    for (let i = 0; i < sequence.length; i++) {
        const target = sequence[i];
        let distance = Math.abs(target - currentHead);

        // Check for the "Jump"
        let isJump = false;
        if (direction === 'right' && currentHead === diskSize - 1 && target === 0) {
            // This is the wrap-around
            distance = 0; // The jump does not consume seek time usually, but check text
            isJump = true;
        }
        // Handle Left direction jump 0 -> End
        else if (direction === 'left' && currentHead === 0 && target === diskSize - 1) {
            distance = 0;
            isJump = true;
        }

        if (distance >= 0) {
            totalSeek += distance;
            currentHead = target;

            if (requests.includes(target)) processed.add(target);

            steps.push({
                track: target,
                seek: distance,
                totalSeek: totalSeek,
                requestsLeft: requests.filter(r => !processed.has(r)),
                description: isJump ? "Jump to Start" : (requests.includes(target) ? `Serve ${target}` : `Scan`)
            });
        }
    }

    return { steps, totalSeek };
}
