#include "../scheduler/scheduler.h"
#include <stdlib.h>

int compare(const void *a, const void *b);

/*
 * N-Step SCAN
 * Divides the request queue into sub-queues of size N.
 * Each sub-queue is processed using SCAN.
 * The head position carries over between sub-queues.
 * Direction alternates after each sub-queue sweep.
 */
int nstep_scan(int head, int arr[], int n, int direction, int disk_size,
               int step_size) {
  int totalSeek = 0;
  int current = head;
  int dir = direction;

  /* If step_size <= 0 or >= n, treat as one big batch */
  if (step_size <= 0 || step_size >= n)
    step_size = n;

  for (int start = 0; start < n; start += step_size) {
    int end = start + step_size;
    if (end > n)
      end = n;
    int batch_n = end - start;

    /* Copy this batch and sort it */
    int batch[256];
    for (int i = 0; i < batch_n; i++)
      batch[i] = arr[start + i];

    qsort(batch, batch_n, sizeof(int), compare);

    if (dir == 1) { /* RIGHT */
      for (int i = 0; i < batch_n; i++) {
        if (batch[i] >= current) {
          totalSeek += abs(current - batch[i]);
          current = batch[i];
        }
      }

      totalSeek += abs(current - (disk_size - 1));
      current = disk_size - 1;

      for (int i = batch_n - 1; i >= 0; i--) {
        if (batch[i] < head) {
          totalSeek += abs(current - batch[i]);
          current = batch[i];
        }
      }
    } else { /* LEFT */
      for (int i = batch_n - 1; i >= 0; i--) {
        if (batch[i] <= current) {
          totalSeek += abs(current - batch[i]);
          current = batch[i];
        }
      }

      totalSeek += abs(current - 0);
      current = 0;

      for (int i = 0; i < batch_n; i++) {
        if (batch[i] > head) {
          totalSeek += abs(current - batch[i]);
          current = batch[i];
        }
      }
    }

    /* Alternate direction for next batch */
    dir = 1 - dir;
    /* Update head for next batch boundary check */
    head = current;
  }

  return totalSeek;
}
