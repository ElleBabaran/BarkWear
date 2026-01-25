// src/types.ts
export interface User {
  username: string;
  password: string;
  role: 'admin' | 'staff';
  fullName: string;
}

export interface AttendanceRecord {
  id: string;
  studentName: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late';
  photoUrl?: string;
}

export interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  class: string;
}