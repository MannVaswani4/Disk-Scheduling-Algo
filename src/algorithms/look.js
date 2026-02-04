export function calculateLOOK(requests, headStart, direction = 'right') {
    let currentHead = headStart;
    let totalSeek = 0;
    const steps = [];

    // Sort requests
    let queue = [...requests].sort((a, b) => a - b);

    // Split
    let left = queue.filter(r => r < headStart).sort((a, b) => b - a);
    let right = queue.filter(r => r >= headStart).sort((a, b) => a - b);

    let sequence = [];

    if (direction === 'right') {
        sequence = [...right, ...left];
    } else {
        sequence = [...left, ...right];
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
        const distance = Math.abs(target - currentHead);

        if (distance > 0) {
            totalSeek += distance;
            currentHead = target;
            processed.add(target);

            steps.push({
                track: target,
                seek: distance,
                totalSeek: totalSeek,
                requestsLeft: requests.filter(r => !processed.has(r)),
                description: `Serve ${target}`
            });
        }
    }

    return { steps, totalSeek };
}
