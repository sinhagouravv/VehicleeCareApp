# VehicleeCare Mobile Employee Application - Analytics Calculation Reference

This document provides a detailed reference for how key performance metrics on the **Analytics** screen are calculated, including the formulas and business logic used for **Average Work Duration**, **Growth Rate**, **Success Rate**, and **now**.

---

## 1. Average Work Duration

The Average Work Duration measures the employee's average daily work duration across all days they were marked present.

### Formula

$$\text{Average Work Duration} = \frac{\text{Total Logged Work Milliseconds (Past Days)}}{\text{Total Present Days Count (Past Days)}}$$

### Detailed Business Rules

1. **Excluding Today**: 
   * Today's active attendance record (if any) is **fully excluded** from both the total duration and the denominator. This prevents partial shifts from artificially dragging down the average.
2. **Attendance Status Filter**:
   * Days are counted if the attendance status is `'Present'`, `'Late'`, or `'Overtime'`.
3. **Calculated Durations (Normal)**:
   * If both check-in (`checkIn`) and check-out (`checkOut`) timestamps exist, the duration is computed as:
     $$\text{Duration} = \text{checkOut} - \text{checkIn}$$
4. **Checkout Fallbacks (9-Hour Shift)**:
   * If a check-in exists but check-out is missing (`null`) for a past record (or if the employee was manually marked present/late by an administrator without timestamps), the duration falls back to the **standard 9-hour shift**:
     $$\text{Duration} = 9 \times 60 \times 60 \times 1000\text{ ms } (32,400,000\text{ ms})$$
5. **Auto-Checkout at 9:20 PM**:
   * A daily cron job triggers at **9:20 PM IST (21:20)**. Any checked-in employees who forgot to check out are automatically checked out. 
   * The check-out timestamp is set to `21:20:00` of that record's day, and the status is recalculated (except for **Evening** shift employees who do not receive the `Overtime` status).
6. **Formatting**:
   * If the final average is less than 60 minutes, it displays in minutes (e.g., `45 mins`).
   * If it is 60 minutes or more, it displays in hours formatted to one decimal place (e.g., `9.2 hrs`).

---

## 2. Task Growth Rate

The Growth Rate represents the month-over-month efficiency trend by comparing completed tasks in the current calendar month with those in the previous calendar month.

### Formula

$$\text{Growth Rate \%} = \frac{\text{Completed Tasks (This Month)} - \text{Completed Tasks (Last Month)}}{\text{Completed Tasks (Last Month)}} \times 100$$

### Detailed Business Rules

1. **Task Filter**:
   * Only bookings with a status of `'Completed'` or `'Delivered'` are counted.
2. **Month Partitioning**:
   * The date is parsed from either the scheduled date (`schedule.date`) or the creation timestamp (`createdAt`).
   * Current Month: The calendar month and year matching the current system date.
   * Previous Month: The calendar month and year matching `currentMonth - 1`.
3. **Zero-Baseline Handlers**:
   * **No activity in either month**: If completed tasks are 0 in both the previous and current months, the rate displays as `0%`.
   * **New activity (0 last month, >0 this month)**: To avoid division-by-zero errors, if the previous month has 0 completed tasks and this month has $N$ completed tasks, the rate displays as:
     $$\text{Growth Rate} = + (N \times 100)\%$$
     *(For example, 1 completed task this month and 0 last month results in `+100%`).*
4. **Sign Formatting**:
   * Positive growth results are prefixed with a `+` sign (e.g., `+12%`).
   * Negative growth results are prefixed with a `-` sign (e.g., `-100%`).
5. **Dynamic Visual Indicators**:
   * **Negative Growth**: Renders the `TrendingDown` icon in **red** (`#ef4444`) with a soft red background container (`bg-red-50`).
   * **Positive/Zero Growth**: Renders the `TrendingUp` icon in **green** (`#10b981`) with a soft green background container (`bg-emerald-50`).

---

## 3. Success Rate

The Success Rate measures the employee's efficiency and reliability in completing assigned tasks on time.

### Formula

$$\text{Success Rate \%} = \frac{\sum\text{Task Completion Scores}}{\text{Total Assigned Tasks}} \times 100$$

### Detailed Business Rules

1. **Zero-Tasks Baseline**:
   * If there are no tasks assigned to the employee (`totalTasksCount === 0`), the success rate defaults to **`0%`**.
2. **Single Completed Task Override**:
   * If there is exactly **1 task** assigned to the employee and it has been completed/delivered, the success rate overrides directly to **`100%`** (bypassing late penalties).
3. **On-Time Completion (Full Score)**:
   * If a task is completed/delivered within its assigned duration, it receives a score of **`1.0`**.
   * The actual duration is measured as the time elapsed between the task's creation timestamp (`createdAt`) and its completion timestamp (`updatedAt`).
   * The assigned duration is parsed dynamically from the task's `serviceDuration` field (e.g., `"2 hours"`, `"30 mins"`, `"1 day"`).
3. **Late Completion (Penalty)**:
   * If a task was completed/delivered but exceeded its assigned duration, it receives a penalty of **`0.3`**, resulting in a completion score of **`0.7`** for that task.
4. **Uncompleted Tasks**:
   * Tasks that are in progress, in service, pending, or cancelled receive a completion score of **`0.0`**.

---

## 4. Attendance Rate

The Attendance Rate measures the employee's consistency in reporting to work relative to the total number of workdays tracked for them in the system.

### Formula

$$\text{Attendance Rate \%} = \frac{\text{Present Count}}{\text{Total Tracked Days}} \times 100$$

### Detailed Business Rules

1. **Present Count**:
   * Counts the number of daily attendance records where the employee's status is `'Present'`, `'Late'`, or `'Overtime'`.
2. **Total Tracked Days**:
   * Counts the total number of daily attendance records created in the database for this employee (including `'Absent'` days and `'On Leave'` days).
3. **Rounding**:
   * The result is rounded to the nearest integer using standard rounding logic (`Math.round`).
4. **Empty Baseline**:
   * If there are no attendance records tracked for the employee (`totalCount === 0`), the rate defaults to **`100%`**.
