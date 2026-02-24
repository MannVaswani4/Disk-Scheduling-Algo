#include <stdlib.h>
#include <limits.h>
#include "../scheduler/scheduler.h"

int sstf(int head, int arr[], int n) {
    int totalSeek = 0;
    int current = head;
    int visited[n];

    for (int i = 0; i < n; i++)
        visited[i] = 0;

    for (int count = 0; count < n; count++) {
        int minDist = INT_MAX;
        int index = -1;

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                int dist = abs(current - arr[i]);
                if (dist < minDist) {
                    minDist = dist;
                    index = i;
                }
            }
        }

        visited[index] = 1;
        totalSeek += minDist;
        current = arr[index];
    }

    return totalSeek;
}