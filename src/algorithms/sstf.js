export function calculateSSTF(requests, headStart) {
    let currentHead = headStart;
    let totalSeek = 0;
    const steps = [];
    let queue = [...requests];

    // Initial state
    steps.push({
        track: currentHead,
        seek: 0,
        totalSeek: 0,
        requestsLeft: [...queue],
        description: "Start"
    });

    while (queue.length > 0) {
        // Find closest request
        let minDistance = Infinity;
        let closestIndex = -1;

        for (let i = 0; i < queue.length; i++) {
            const distance = Math.abs(queue[i] - currentHead);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }

        const target = queue[closestIndex];
        totalSeek += minDistance;
        currentHead = target;

        // Remove processed request
        queue.splice(closestIndex, 1);

        steps.push({
            track: target,
            seek: minDistance,
            totalSeek: totalSeek,
            requestsLeft: [...queue],
            description: `Seek to ${target} (Dist: ${minDistance})`
        });
    }

    return { steps, totalSeek };
}
