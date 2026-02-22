/**
 * N-Step SCAN Algorithm
 *
 * Divides the request queue into sub-queues of size N.
 * Processes one sub-queue at a time using the SCAN strategy.
 * New requests arriving during processing are deferred to the next sub-queue.
 * This bounds response time and avoids starvation.
 *
 * @param {number[]} requests  - Array of track numbers to service
 * @param {number}   headStart - Initial head position
 * @param {number}   diskSize  - Total number of tracks (default 200)
 * @param {string}   direction - Initial scan direction: 'right' | 'left'
 * @param {number}   n         - Sub-queue (batch) size (default 4)
 */
export function calculateNSTEPSCAN(requests, headStart, diskSize = 200, direction = 'right', n = 4) {
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

    // Split all requests into chunks of size N
    const batches = [];
    for (let i = 0; i < requests.length; i += n) {
        batches.push(requests.slice(i, i + n));
    }

    const processed = new Set();
    let currentDirection = direction;

    for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];

        // Sort the batch appropriately for current direction
        let left = batch.filter(r => r < currentHead).sort((a, b) => b - a);  // descending
        let right = batch.filter(r => r >= currentHead).sort((a, b) => a - b); // ascending

        let sequence = [];
        if (currentDirection === 'right') {
            sequence = [...right];
            if (left.length > 0) {
                sequence.push(diskSize - 1); // scan to end
                sequence = [...sequence, ...left];
            }
        } else {
            sequence = [...left];
            if (right.length > 0) {
                sequence.push(0); // scan to start
                sequence = [...sequence, ...right];
            }
        }

        for (let i = 0; i < sequence.length; i++) {
            const target = sequence[i];
            const distance = Math.abs(target - currentHead);

            if (distance >= 0) {
                totalSeek += distance;
                currentHead = target;

                const isRequest = batch.includes(target);
                if (isRequest) processed.add(target);

                steps.push({
                    track: target,
                    seek: distance,
                    totalSeek,
                    requestsLeft: requests.filter(r => !processed.has(r)),
                    description: isRequest
                        ? `Serve ${target} [Batch ${b + 1}]`
                        : `Scan to End/Start [Batch ${b + 1}]`
                });
            }
        }

        // After finishing a batch, flip direction for the next batch
        currentDirection = currentDirection === 'right' ? 'left' : 'right';
    }

    return { steps, totalSeek };
}
