/**
 * WASM Bridge - Wraps all disk scheduling algorithms to expose them to
 * JavaScript.
 *
 * Each wrapper function:
 *   - Computes the totalSeek using the original C algorithm
 *   - Fills an output buffer with the ordered sequence of tracks visited
 *   - Returns the number of steps written to the output buffer
 *
 * JavaScript reads totalSeek from the original function, and the step
 * sequence from the shared output buffer.
 */

#include "../scheduler/scheduler.h"
#include <emscripten/emscripten.h>
#include <stdlib.h>

/* Shared buffers for passing data between JS and WASM */
#define MAX_REQUESTS 256
#define MAX_STEPS 512

static int g_requests[MAX_REQUESTS];
static int g_steps_out[MAX_STEPS]; /* output: ordered tracks visited */
static int g_num_steps;
static int g_total_seek;

/* ---- Helpers exposed to JS for setting input data ---- */

EMSCRIPTEN_KEEPALIVE
int *get_request_buffer(void) { return g_requests; }

EMSCRIPTEN_KEEPALIVE
int *get_steps_buffer(void) { return g_steps_out; }

EMSCRIPTEN_KEEPALIVE
int get_num_steps(void) { return g_num_steps; }

EMSCRIPTEN_KEEPALIVE
int get_total_seek(void) { return g_total_seek; }

/* compare function (defined in scan.c, declared here for sorting) */
int compare(const void *a, const void *b);

/* ---- FCFS Steps ---- */
EMSCRIPTEN_KEEPALIVE
void run_fcfs(int head, int n) {
  g_total_seek = fcfs(head, g_requests, n);

  int idx = 0;
  g_steps_out[idx++] = head; /* Start position */

  for (int i = 0; i < n; i++) {
    g_steps_out[idx++] = g_requests[i];
  }
  g_num_steps = idx;
}

/* ---- SSTF Steps ---- */
EMSCRIPTEN_KEEPALIVE
void run_sstf(int head, int n) {
  g_total_seek = sstf(head, g_requests, n);

  int idx = 0;
  int current = head;
  int visited[MAX_REQUESTS] = {0};

  g_steps_out[idx++] = head;

  for (int count = 0; count < n; count++) {
    int minDist = 0x7FFFFFFF;
    int minIdx = -1;
    for (int i = 0; i < n; i++) {
      if (!visited[i]) {
        int dist = abs(current - g_requests[i]);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
    }
    if (minIdx == -1)
      break;
    visited[minIdx] = 1;
    current = g_requests[minIdx];
    g_steps_out[idx++] = current;
  }
  g_num_steps = idx;
}

/* ---- SCAN Steps ---- */
EMSCRIPTEN_KEEPALIVE
void run_scan(int head, int n, int direction, int disk_size) {
  g_total_seek = scan(head, g_requests, n, direction, disk_size);

  int sorted[MAX_REQUESTS];
  for (int i = 0; i < n; i++)
    sorted[i] = g_requests[i];
  qsort(sorted, n, sizeof(int), compare);

  int idx = 0;
  g_steps_out[idx++] = head;

  if (direction == 1) { /* RIGHT */
    for (int i = 0; i < n; i++) {
      if (sorted[i] >= head)
        g_steps_out[idx++] = sorted[i];
    }
    g_steps_out[idx++] = disk_size - 1; /* end of disk */
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] < head)
        g_steps_out[idx++] = sorted[i];
    }
  } else { /* LEFT */
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] <= head)
        g_steps_out[idx++] = sorted[i];
    }
    g_steps_out[idx++] = 0; /* start of disk */
    for (int i = 0; i < n; i++) {
      if (sorted[i] > head)
        g_steps_out[idx++] = sorted[i];
    }
  }
  g_num_steps = idx;
}

/* ---- LOOK Steps ---- */
EMSCRIPTEN_KEEPALIVE
void run_look(int head, int n, int direction) {
  g_total_seek = look(head, g_requests, n, direction);

  int sorted[MAX_REQUESTS];
  for (int i = 0; i < n; i++)
    sorted[i] = g_requests[i];
  qsort(sorted, n, sizeof(int), compare);

  int idx = 0;
  g_steps_out[idx++] = head;

  if (direction == 1) { /* RIGHT */
    for (int i = 0; i < n; i++) {
      if (sorted[i] >= head)
        g_steps_out[idx++] = sorted[i];
    }
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] < head)
        g_steps_out[idx++] = sorted[i];
    }
  } else { /* LEFT */
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] <= head)
        g_steps_out[idx++] = sorted[i];
    }
    for (int i = 0; i < n; i++) {
      if (sorted[i] > head)
        g_steps_out[idx++] = sorted[i];
    }
  }
  g_num_steps = idx;
}

/* ---- CSCAN Steps ---- */
EMSCRIPTEN_KEEPALIVE
void run_cscan(int head, int n, int direction, int disk_size) {
  g_total_seek = cscan(head, g_requests, n, direction, disk_size);

  int sorted[MAX_REQUESTS];
  for (int i = 0; i < n; i++)
    sorted[i] = g_requests[i];
  qsort(sorted, n, sizeof(int), compare);

  int idx = 0;
  g_steps_out[idx++] = head;

  if (direction == 1) { /* RIGHT */
    for (int i = 0; i < n; i++) {
      if (sorted[i] >= head)
        g_steps_out[idx++] = sorted[i];
    }
    g_steps_out[idx++] = disk_size - 1;
    g_steps_out[idx++] = 0;
    for (int i = 0; i < n; i++) {
      if (sorted[i] < head)
        g_steps_out[idx++] = sorted[i];
    }
  } else { /* LEFT */
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] <= head)
        g_steps_out[idx++] = sorted[i];
    }
    g_steps_out[idx++] = 0;
    g_steps_out[idx++] = disk_size - 1;
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] > head)
        g_steps_out[idx++] = sorted[i];
    }
  }
  g_num_steps = idx;
}

/* ---- CLOOK Steps ---- */
EMSCRIPTEN_KEEPALIVE
void run_clook(int head, int n, int direction) {
  g_total_seek = clook(head, g_requests, n, direction);

  int sorted[MAX_REQUESTS];
  for (int i = 0; i < n; i++)
    sorted[i] = g_requests[i];
  qsort(sorted, n, sizeof(int), compare);

  int idx = 0;
  g_steps_out[idx++] = head;

  if (direction == 1) { /* RIGHT */
    for (int i = 0; i < n; i++) {
      if (sorted[i] >= head)
        g_steps_out[idx++] = sorted[i];
    }
    for (int i = 0; i < n; i++) {
      if (sorted[i] < head)
        g_steps_out[idx++] = sorted[i];
    }
  } else { /* LEFT */
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] <= head)
        g_steps_out[idx++] = sorted[i];
    }
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] > head)
        g_steps_out[idx++] = sorted[i];
    }
  }
  g_num_steps = idx;
}

/* ---- FSCAN Steps ---- */
EMSCRIPTEN_KEEPALIVE
void run_fscan(int head, int n, int direction, int disk_size) {
  g_total_seek = fscan(head, g_requests, n, direction, disk_size);

  int sorted[MAX_REQUESTS];
  for (int i = 0; i < n; i++)
    sorted[i] = g_requests[i];
  qsort(sorted, n, sizeof(int), compare);

  int idx = 0;
  g_steps_out[idx++] = head;

  if (direction == 1) { /* RIGHT */
    for (int i = 0; i < n; i++) {
      if (sorted[i] >= head)
        g_steps_out[idx++] = sorted[i];
    }
    g_steps_out[idx++] = disk_size - 1; /* end of disk */
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] < head)
        g_steps_out[idx++] = sorted[i];
    }
  } else { /* LEFT */
    for (int i = n - 1; i >= 0; i--) {
      if (sorted[i] <= head)
        g_steps_out[idx++] = sorted[i];
    }
    g_steps_out[idx++] = 0; /* start of disk */
    for (int i = 0; i < n; i++) {
      if (sorted[i] > head)
        g_steps_out[idx++] = sorted[i];
    }
  }
  g_num_steps = idx;
}

/* ---- N-Step SCAN Steps ---- */
EMSCRIPTEN_KEEPALIVE
void run_nstep_scan(int head, int n, int direction, int disk_size,
                    int step_size) {
  g_total_seek =
      nstep_scan(head, g_requests, n, direction, disk_size, step_size);

  int idx = 0;
  int current = head;
  int dir = direction;
  int cur_head = head;

  if (step_size <= 0 || step_size >= n)
    step_size = n;

  g_steps_out[idx++] = head;

  for (int start = 0; start < n; start += step_size) {
    int end = start + step_size;
    if (end > n)
      end = n;
    int batch_n = end - start;

    int batch[MAX_REQUESTS];
    for (int i = 0; i < batch_n; i++)
      batch[i] = g_requests[start + i];
    qsort(batch, batch_n, sizeof(int), compare);

    if (dir == 1) { /* RIGHT */
      for (int i = 0; i < batch_n; i++) {
        if (batch[i] >= current)
          g_steps_out[idx++] = batch[i];
      }
      g_steps_out[idx++] = disk_size - 1;
      for (int i = batch_n - 1; i >= 0; i--) {
        if (batch[i] < cur_head)
          g_steps_out[idx++] = batch[i];
      }
    } else { /* LEFT */
      for (int i = batch_n - 1; i >= 0; i--) {
        if (batch[i] <= current)
          g_steps_out[idx++] = batch[i];
      }
      g_steps_out[idx++] = 0;
      for (int i = 0; i < batch_n; i++) {
        if (batch[i] > cur_head)
          g_steps_out[idx++] = batch[i];
      }
    }

    current = g_steps_out[idx - 1];
    cur_head = current;
    dir = 1 - dir;
  }
  g_num_steps = idx;
}
