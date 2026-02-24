#include <stdlib.h>
#include "../scheduler/scheduler.h"

int fcfs(int head, int arr[], int n) {
    int totalSeek = 0;
    int current = head;

    for (int i = 0; i < n; i++) {
        totalSeek += abs(current - arr[i]);
        current = arr[i];
    }

    return totalSeek;
}