#include "../scheduler/scheduler.h"
#include <stdlib.h>

int compare(const void *a, const void *b);

/*
 * FSCAN: Freeze-SCAN
 * Uses two queues. The current queue is "frozen" and serviced using SCAN.
 * New requests go into the second queue. Here we treat the entire input
 * as one frozen batch (since we don't have real-time arrival).
 * Essentially equivalent to a single SCAN pass over all requests.
 */
int fscan(int head, int arr[], int n, int direction, int disk_size) {
  int totalSeek = 0;
  int current = head;

  int sorted[256];
  for (int i = 0; i < n; i++)
    sorted[i] = arr[i];

  qsort(sorted, n, sizeof(int), compare);

  if (direction == 1) { /* RIGHT */
    for (int i = 0; i < n; i++) {
      if (sorted[i] >= head) {
        totalSeek += abs(current - sorted[i]);
        current = sorted[i];
      }
    }

    totalSeek += abs(current - (disk_size - 1));
    current = disk_size - 1;

    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] < head) {
        totalSeek += abs(current - sorted[i]);
        current = sorted[i];
      }
    }
  } else { /* LEFT */
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] <= head) {
        totalSeek += abs(current - sorted[i]);
        current = sorted[i];
      }
    }

    totalSeek += abs(current - 0);
    current = 0;

    for (int i = 0; i < n; i++) {
      if (sorted[i] > head) {
        totalSeek += abs(current - sorted[i]);
        current = sorted[i];
      }
    }
  }

  return totalSeek;
}
