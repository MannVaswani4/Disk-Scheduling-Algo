#ifndef SCHEDULER_H
#define SCHEDULER_H

int fcfs(int head, int arr[], int n);
int sstf(int head, int arr[], int n);
int scan(int head, int arr[], int n, int direction, int disk_size);
int cscan(int head, int arr[], int n, int direction, int disk_size);
int look(int head, int arr[], int n, int direction);
int clook(int head, int arr[], int n, int direction);
int fscan(int head, int arr[], int n, int direction, int disk_size);
int nstep_scan(int head, int arr[], int n, int direction, int disk_size,
               int step_size);

#endif