#include <stdlib.h>
#include <stdio.h>

int compare(const void *a, const void *b) {
    return (*(int*)a - *(int*)b);
}

int scan(int head, int arr[], int n, int direction, int disk_size) {
    int totalSeek = 0;
    int current = head;

    int sorted[n];
    for(int i = 0; i < n; i++)
        sorted[i] = arr[i];

    qsort(sorted, n, sizeof(int), compare);

    if(direction == 1) { // RIGHT
        for(int i = 0; i < n; i++) {
            if(sorted[i] >= head) {
                totalSeek += abs(current - sorted[i]);
                current = sorted[i];
            }
        }

        totalSeek += abs(current - (disk_size - 1));
        current = disk_size - 1;

        for(int i = n - 1; i >= 0; i--) {
            if(sorted[i] < head) {
                totalSeek += abs(current - sorted[i]);
                current = sorted[i];
            }
        }
    }
    else { // LEFT
        for(int i = n - 1; i >= 0; i--) {
            if(sorted[i] <= head) {
                totalSeek += abs(current - sorted[i]);
                current = sorted[i];
            }
        }

        totalSeek += abs(current - 0);
        current = 0;

        for(int i = 0; i < n; i++) {
            if(sorted[i] > head) {
                totalSeek += abs(current - sorted[i]);
                current = sorted[i];
            }
        }
    }

    return totalSeek;
}