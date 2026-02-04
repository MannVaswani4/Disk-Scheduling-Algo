export function calculateFCFS(requests, headStart) {
    let currentHead = headStart;
    let totalSeek = 0;
    const steps = [];

    // Initial state
    steps.push({
        track: currentHead,
        seek: 0,
        totalSeek: 0,
        requestsLeft: [...requests],
        description: "Start"
    });

    const queue = [...requests];

    for (let i = 0; i < queue.length; i++) {
        const target = queue[i];
        const distance = Math.abs(target - currentHead);
        totalSeek += distance;
        currentHead = target;

        steps.push({
            track: target,
            seek: distance,
            totalSeek: totalSeek,
            requestsLeft: queue.slice(i + 1),
            description: `Seek to ${target}`
        });
    }

    return { steps, totalSeek };
}
