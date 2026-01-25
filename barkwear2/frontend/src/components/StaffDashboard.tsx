// src/components/StaffDashboard.tsx
import React, { useState, useEffect } from "react";
import { Camera, Calendar, LogOut, Check } from "lucide-react";
import { User, AttendanceRecord, Schedule } from "../types";

interface StaffDashboardProps {
  user: User;
  onLogout: () => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState<'main' | 'attendance' | 'capture' | 'schedule'>('main');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [studentName, setStudentName] = useState('');
  const [status, setStatus] = useState<'present' | 'absent' | 'late'>('present');

  useEffect(() => {
    loadAttendance();
    loadSchedules();
  }, []);

  const loadAttendance = async () => {
    try {
      const result = await window.storage.get('attendance');
      if (result) {
        setAttendance(JSON.parse(result.value));
      }
    } catch (err) {
      setAttendance([]);
    }
  };

  const loadSchedules = async () => {
    try {
      const result = await window.storage.get('schedules');
      if (result) {
        setSchedules(JSON.parse(result.value));
      } else {
        // Default schedule
        const defaultSchedule = [
          { id: '1', day: 'Monday', startTime: '08:00', endTime: '10:00', class: 'Basic Training' },
          { id: '2', day: 'Wednesday', startTime: '14:00', endTime: '16:00', class: 'Advanced Training' },
          { id: '3', day: 'Friday', startTime: '10:00', endTime: '12:00', class: 'Agility Course' }
        ];
        await window.storage.set('schedules', JSON.stringify(defaultSchedule));
        setSchedules(defaultSchedule);
      }
    } catch (err) {
      const defaultSchedule = [
        { id: '1', day: 'Monday', startTime: '08:00', endTime: '10:00', class: 'Basic Training' },
        { id: '2', day: 'Wednesday', startTime: '14:00', endTime: '16:00', class: 'Advanced Training' },
        { id: '3', day: 'Friday', startTime: '10:00', endTime: '12:00', class: 'Agility Course' }
      ];
      await window.storage.set('schedules', JSON.stringify(defaultSchedule));
      setSchedules(defaultSchedule);
    }
  };

  const handleMarkAttendance = async () => {
    if (!studentName) {
      alert('Please enter student name');
      return;
    }

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      studentName,
      timestamp: new Date().toLocaleString(),
      status
    };

    const updatedAttendance = [newRecord, ...attendance];
    try {
      await window.storage.set('attendance', JSON.stringify(updatedAttendance));
      setAttendance(updatedAttendance);
      setStudentName('');
      alert('Attendance marked successfully!');
    } catch (err) {
      alert('Error saving attendance');
    }
  };

  const handleCapture = () => {
    alert('Camera feature would open here. In a real app, this would access the device camera to capture student photos.');
  };

  if (activeView === 'attendance') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => setActiveView('main')} className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </button>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Mark Attendance</h2>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Student Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setStatus('present')}
                  className={`flex-1 py-2 rounded-lg ${status === 'present' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                >
                  Present
                </button>
                <button
                  onClick={() => setStatus('late')}
                  className={`flex-1 py-2 rounded-lg ${status === 'late' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
                >
                  Late
                </button>
                <button
                  onClick={() => setStatus('absent')}
                  className={`flex-1 py-2 rounded-lg ${status === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
                >
                  Absent
                </button>
              </div>
              <button
                onClick={handleMarkAttendance}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
              >
                Mark Attendance
              </button>
            </div>
          </div>

          <h3 className="text-xl font-semibold mb-4">Recent Records</h3>
          <div className="space-y-3">
            {attendance.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-white rounded-xl">No attendance records yet</p>
            ) : (
              attendance.slice(0, 10).map(record => (
                <div key={record.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{record.studentName}</p>
                      <p className="text-sm text-gray-600">{record.timestamp}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'schedule') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => setActiveView('main')} className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </button>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Class Schedule</h2>
          <div className="space-y-4">
            {schedules.map(schedule => (
              <div key={schedule.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Calendar className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{schedule.class}</p>
                      <p className="text-sm text-gray-600">{schedule.day}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{schedule.startTime} - {schedule.endTime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user.fullName}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => setActiveView('attendance')}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all text-left group"
          >
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Check className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Attendance Details</h3>
            <p className="text-gray-600 text-sm">Mark and view student attendance records</p>
          </button>

          <button
            onClick={handleCapture}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all text-left group"
          >
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <Camera className="text-purple-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Capture Student Photos</h3>
            <p className="text-gray-600 text-sm">Take photos for attendance verification</p>
          </button>

          <button
            onClick={() => setActiveView('schedule')}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all text-left group"
          >
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <Calendar className="text-green-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Schedule Details</h3>
            <p className="text-gray-600 text-sm">View your class schedule and timings</p>
          </button>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
          {attendance.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No attendance records yet</p>
          ) : (
            <div className="space-y-3">
              {attendance.slice(0, 5).map(record => (
                <div key={record.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{record.studentName}</p>
                    <p className="text-sm text-gray-600">{record.timestamp}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    record.status === 'present' ? 'bg-green-100 text-green-800' :
                    record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {record.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;