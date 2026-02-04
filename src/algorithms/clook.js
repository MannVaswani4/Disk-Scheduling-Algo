export function calculateCLOOK(requests, headStart, direction = 'right') {
    let currentHead = headStart;
    let totalSeek = 0;
    const steps = [];

    let queue = [...requests].sort((a, b) => a - b);
    let right = queue.filter(r => r >= headStart);
    let left = queue.filter(r => r < headStart);

    let sequence = [];

    if (direction === 'right') {
        sequence = [...right, ...left];
    } else {
        // If left, we go leftwards, then wrap to the rightmost and continue left?
        // C-LOOK usually goes one direction only. Let's assume "Left" means scanning left, then jumping to right end.
        let leftSide = queue.filter(r => r <= headStart).sort((a, b) => b - a);
        let rightSide = queue.filter(r => r > headStart).sort((a, b) => b - a);
        sequence = [...leftSide, ...rightSide];
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

        // Check for "Jump"
        let isJump = false;
        // Right C-LOOK: Last of Right -> First of Left
        if (direction === 'right' && right.length > 0 && left.length > 0) {
            if (currentHead === right[right.length - 1] && target === left[0]) {
                distance = 0; // Jump doesn't count
                isJump = true;
            }
        }
        // Left C-LOOK
        if (direction === 'left') {
            // logic similar
        }

        // Actually, simple detecting of "Backward" movement in a Uni-directional algo implies a jump
        if (direction === 'right' && target < currentHead) {
            distance = 0;
            isJump = true;
        }
        if (direction === 'left' && target > currentHead) {
            distance = 0;
            isJump = true;
        }


        totalSeek += distance;
        currentHead = target;
        processed.add(target);

        steps.push({
            track: target,
            seek: distance,
            totalSeek: totalSeek,
            requestsLeft: requests.filter(r => !processed.has(r)),
            description: isJump ? "Jump" : `Serve ${target}`
        });
    }

    return { steps, totalSeek };
}
