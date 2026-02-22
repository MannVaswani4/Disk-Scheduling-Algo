/**
 * F-SCAN Algorithm
 *
 * Splits the request queue into two sub-queues:
 *   - Active queue (F1): frozen snapshot of all pending requests when a scan begins.
 *   - Deferred queue (F2): requests that arrive while F1 is being processed (simulated here
 *     by splitting the input queue in half at the midpoint to illustrate the two-queue concept).
 *
 * The head sweeps through F1 using SCAN, then F2 becomes the new F1, and the process repeats.
 * This prevents arm starvation and arm "stickiness".
 *
 * Simulation note: Since all requests are known upfront, we split them into two equal halves
 * to demonstrate the two-pass F-SCAN behaviour.  In a live OS, F2 would accumulate dynamically.
 *
 * @param {number[]} requests  - Array of track numbers to service
 * @param {number}   headStart - Initial head position
 * @param {number}   diskSize  - Total number of tracks (default 200)
 * @param {string}   direction - Initial scan direction: 'right' | 'left'
 */
export function calculateFSCAN(requests, headStart, diskSize = 200, direction = 'right') {
    let currentHead = headStart;
    let totalSeek = 0;
    const steps = [];

    // Initial state
    steps.push({
        track: currentHead,
        seek: 0,
        totalSeek: 0,
        requestsLeft: [...requests],
        description: 'Start'
    });

    /**
     * Split into two queues:
     * F1 - first half (the "frozen active" queue)
     * F2 - second half  (the "deferred new arrivals" queue)
     */
    const mid = Math.ceil(requests.length / 2);
    const queues = [
        requests.slice(0, mid),  // F1
        requests.slice(mid)       // F2
    ];

    const processed = new Set();
    let currentDirection = direction;

    for (let q = 0; q < queues.length; q++) {
        const queue = queues[q];
        if (queue.length === 0) continue;

        const label = q === 0 ? 'F1 (Active)' : 'F2 (Deferred)';

        // Sort into left / right of current head for SCAN
        let left = queue.filter(r => r < currentHead).sort((a, b) => b - a);
        let right = queue.filter(r => r >= currentHead).sort((a, b) => a - b);

        let sequence = [];
        if (currentDirection === 'right') {
            sequence = [...right];
            if (left.length > 0) {
                sequence.push(diskSize - 1); // go to far end
                sequence = [...sequence, ...left];
            }
        } else {
            sequence = [...left];
            if (right.length > 0) {
                sequence.push(0); // go to near end
                sequence = [...sequence, ...right];
            }
        }

        for (let i = 0; i < sequence.length; i++) {
            const target = sequence[i];
            const distance = Math.abs(target - currentHead);

            if (distance >= 0) {
                totalSeek += distance;
                currentHead = target;

                const isRequest = queue.includes(target);
                if (isRequest) processed.add(target);

                steps.push({
                    track: target,
                    seek: distance,
                    totalSeek,
                    requestsLeft: requests.filter(r => !processed.has(r)),
                    description: isRequest
                        ? `Serve ${target} [${label}]`
                        : `Scan to End/Start [${label}]`
                });
            }
        }

        // Flip direction after each queue (F-SCAN uses SCAN internally)
        currentDirection = currentDirection === 'right' ? 'left' : 'right';
    }

    return { steps, totalSeek };
}
