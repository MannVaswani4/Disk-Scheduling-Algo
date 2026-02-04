export function calculateSCAN(requests, headStart, diskSize = 200, direction = 'right') {
    let currentHead = headStart;
    let totalSeek = 0;
    const steps = [];

    // Sort requests
    let queue = [...requests].sort((a, b) => a - b);

    // Split into left and right of head
    let left = queue.filter(r => r < headStart).sort((a, b) => b - a); // Descending for left
    let right = queue.filter(r => r >= headStart).sort((a, b) => a - b); // Ascending for right

    let sequence = [];

    if (direction === 'right') {
        sequence = [...right];
        // If we have to change direction, we go to valid end
        if (left.length > 0) {
            sequence.push(diskSize - 1); // Go to end
            sequence = [...sequence, ...left];
        }
    } else {
        sequence = [...left];
        // If we have to change direction
        if (right.length > 0) {
            sequence.push(0); // Go to start
            sequence = [...sequence, ...right];
        }
    }

    // Initial state
    steps.push({
        track: currentHead,
        seek: 0,
        totalSeek: 0,
        requestsLeft: [...requests], // Approximate
        description: "Start"
    });

    let processed = new Set();

    for (let i = 0; i < sequence.length; i++) {
        const target = sequence[i];
        const distance = Math.abs(target - currentHead);

        // Only add distance if we moved
        if (distance > 0) {
            totalSeek += distance;
            currentHead = target;

            // Check if this target was a request
            if (requests.includes(target)) {
                processed.add(target);
            }

            steps.push({
                track: target,
                seek: distance,
                totalSeek: totalSeek,
                requestsLeft: requests.filter(r => !processed.has(r)),
                description: requests.includes(target) ? `Serve ${target}` : `Scan to End/Start`
            });
        }
    }

    return { steps, totalSeek };
}
