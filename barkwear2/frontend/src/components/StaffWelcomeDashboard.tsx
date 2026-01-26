// src/components/StaffWelcomeDashboard.tsx

declare global {
  interface Window {
    storage: {
      get(key: string, shared?: boolean): Promise<{ key: string; value: string; shared: boolean } | null>;
      set(key: string, value: string, shared?: boolean): Promise<{ key: string; value: string; shared: boolean } | null>;
      delete(key: string, shared?: boolean): Promise<{ key: string; deleted: boolean; shared: boolean } | null>;
      list(prefix?: string, shared?: boolean): Promise<{ keys: string[]; prefix?: string; shared: boolean } | null>;
    };
  }
}

import React, { useState, useEffect } from "react";
import { Calendar, User, Clock, LogOut, Camera } from "lucide-react";

type StaffPage = "attendance" | "students" | "schedule";

interface UserType {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AttendanceRecord {
  id: string;
  studentName: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late';
}

interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  class: string;
}

interface StaffWelcomeDashboardProps {
  user?: UserType;
  onLogout?: () => void;
  onNavigate?: (page: StaffPage) => void;
}

const LiveDetection = ({ onBack }: { onBack: () => void }) => {
  const [detectedStudentName, setDetectedStudentName] = useState('');
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [course, setCourse] = useState('');
  const [room, setRoom] = useState('');
  const [professor, setProfessor] = useState('');
  const [tardy, setTardy] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
      setTimeout(() => {
        setDetectedStudentName('John Doe');
        setDetectedItems(['Face detected', 'Student ID visible']);
      }, 2000);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleStart = async () => {
    if (!isRecording) {
      await startCamera();
      setIsRecording(true);
    }
  };

  const handleRecords = () => {
    if (!course || !room || !professor) {
      alert('Please fill in all required fields');
      return;
    }
    alert(`Record saved for ${detectedStudentName || 'student'}`);
    setCourse('');
    setRoom('');
    setProfessor('');
    setTardy('');
    setDetectedItems([]);
    setDetectedStudentName('');
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1e3a8a', display: 'flex', flexDirection: 'column' }}>
      <div style={{ backgroundColor: '#fbbf24', padding: '16px 32px', borderBottom: '3px solid #78350f' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#78350f', margin: 0 }}>Live Detection</h1>
      </div>

      <div style={{ display: 'flex', flex: 1, padding: '24px', gap: '24px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>Student Name:</span>
              <span style={{ color: 'white', marginLeft: '8px' }}>{detectedStudentName || ''}</span>
            </div>
            <div>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>Detected Items:</span>
              {detectedItems.length > 0 && (
                <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                  {detectedItems.map((item, idx) => (
                    <div key={idx} style={{ color: 'white', fontSize: '14px' }}>• {item}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, backgroundColor: 'white', border: '4px solid #9ca3af', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '400px' }}>
              {isRecording ? (
                <>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: '#dc2626', color: 'white', padding: '4px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px', border: '2px solid black' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%' }}></div>
                    LIVE
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Camera size={60} color="#9ca3af" strokeWidth={1.5} style={{ margin: '0 auto 8px' }} />
                  <p style={{ color: '#6b7280', fontSize: '18px', margin: 0 }}>Camera access required</p>
                </div>
              )}
            </div>
            <div style={{ backgroundColor: '#d1d5db', padding: '12px', display: 'flex', gap: '12px' }}>
              <div style={{ width: '80px', height: '56px', backgroundColor: '#9ca3af' }}></div>
              <div style={{ width: '80px', height: '56px', backgroundColor: '#9ca3af' }}></div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button onClick={onBack} style={{ backgroundColor: '#fbbf24', color: '#78350f', fontWeight: 'bold', padding: '12px 48px', fontSize: '20px', border: '2px solid #78350f', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              Back
            </button>
          </div>
        </div>

        <div style={{ width: '256px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ backgroundColor: 'white', padding: '12px 16px', border: '2px solid #9ca3af', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px', textTransform: 'uppercase' }}>Course</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} style={{ width: '100%', border: '1px solid #9ca3af', padding: '4px 8px', color: '#1f2937', backgroundColor: '#f3f4f6' }}>
              <option value="">Select Course</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
              <option value="BSIS">BSIS</option>
            </select>
          </div>

          <div style={{ backgroundColor: 'white', padding: '12px 16px', border: '2px solid #9ca3af', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px', textTransform: 'uppercase' }}>Room</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)} style={{ width: '100%', border: '1px solid #9ca3af', padding: '4px 8px', color: '#1f2937', backgroundColor: '#f3f4f6' }}>
              <option value="">Select Room</option>
              <option value="Room 101">Room 101</option>
              <option value="Room 102">Room 102</option>
              <option value="Room 201">Room 201</option>
            </select>
          </div>

          <div style={{ backgroundColor: 'white', padding: '12px 16px', border: '2px solid #9ca3af', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px', textTransform: 'uppercase' }}>Professor</label>
            <select value={professor} onChange={(e) => setProfessor(e.target.value)} style={{ width: '100%', border: '1px solid #9ca3af', padding: '4px 8px', color: '#1f2937', backgroundColor: '#f3f4f6' }}>
              <option value="">Select Professor</option>
              <option value="Prof. Smith">Prof. Smith</option>
              <option value="Prof. Johnson">Prof. Johnson</option>
              <option value="Prof. Williams">Prof. Williams</option>
            </select>
          </div>

          <div style={{ backgroundColor: 'white', padding: '12px 16px', border: '2px solid #9ca3af', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase' }}>Tardy</label>
            <input type="number" value={tardy} onChange={(e) => setTardy(e.target.value)} style={{ flex: 1, border: '1px solid #9ca3af', padding: '4px 8px', color: '#1f2937', backgroundColor: '#f3f4f6' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
            <button onClick={handleStart} disabled={isRecording} style={{ width: '100%', fontWeight: 'bold', padding: '12px', border: '2px solid black', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '16px', backgroundColor: isRecording ? '#d1d5db' : 'white', color: isRecording ? '#6b7280' : '#1f2937', cursor: isRecording ? 'not-allowed' : 'pointer' }}>
              START
            </button>
            <button onClick={handleRecords} style={{ width: '100%', backgroundColor: 'white', color: '#1f2937', fontWeight: 'bold', padding: '12px', border: '2px solid black', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '16px', cursor: 'pointer' }}>
              RECORDS
            </button>
            <button disabled={!isRecording} style={{ width: '100%', fontWeight: 'bold', padding: '12px', border: '2px solid black', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '16px', backgroundColor: !isRecording ? '#d1d5db' : 'white', color: !isRecording ? '#6b7280' : '#1f2937', cursor: !isRecording ? 'not-allowed' : 'pointer' }}>
              PAUSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffWelcomeDashboard: React.FC<StaffWelcomeDashboardProps> = ({ 
  user = { id: '1', fullName: 'Staff Member', name: 'Staff Member', email: 'staff@example.com', role: 'staff' }, 
  onLogout = () => {}, 
  onNavigate = () => {}
}) => {
  const [activeView, setActiveView] = useState<'welcome' | 'attendance' | 'students' | 'schedule'>('welcome');
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const result = await window.storage.get('schedules');
      if (result) {
        setSchedules(JSON.parse(result.value));
      } else {
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
      setSchedules(defaultSchedule);
    }
  };

  if (activeView === 'attendance' || activeView === 'students') {
    return <LiveDetection onBack={() => setActiveView('welcome')} />;
  }

  if (activeView === 'schedule') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <nav style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
            <button onClick={() => setActiveView('welcome')} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
              ← Back to Dashboard
            </button>
          </div>
        </nav>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '32px 16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Class Schedule</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {schedules.map(schedule => (
              <div key={schedule.id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ backgroundColor: '#dbeafe', padding: '12px', borderRadius: '8px' }}>
                      <Calendar color="#2563eb" size={24} />
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 4px 0' }}>{schedule.class}</p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{schedule.day}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{schedule.startTime} - {schedule.endTime}</p>
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 50%, #312e81 100%)', overflow: 'auto', margin: 0, padding: '2rem', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fbbf24', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Welcome!</h1>
          <p style={{ color: 'white', fontSize: '1.1rem', marginTop: '0.5rem', opacity: 0.9 }}>Hello, {user.fullName || user.name || 'Staff Member'}</p>
        </div>
        <button onClick={onLogout} style={{ background: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(4px)', color: 'white', fontWeight: '600', fontSize: '1rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '2px solid rgba(255, 255, 255, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={20} />
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div onClick={() => setActiveView('attendance')} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '1.5rem', padding: '2.5rem 2rem', cursor: 'pointer', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)', border: '3px solid rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.3 }}>Attendance<br/>details</h2>
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', width: '100%', maxWidth: '150px' }}>
            <Calendar size={80} strokeWidth={2} color="#0f172a" />
          </div>
          <button style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', width: '100%', maxWidth: '180px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>Start</button>
        </div>

        <div onClick={() => setActiveView('students')} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '1.5rem', padding: '2.5rem 2rem', cursor: 'pointer', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)', border: '3px solid rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.3 }}>Student<br/>Details</h2>
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', width: '100%', maxWidth: '150px' }}>
            <User size={80} strokeWidth={2} color="#0f172a" />
          </div>
          <button style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', width: '100%', maxWidth: '180px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>Capture</button>
        </div>

        <div onClick={() => setActiveView('schedule')} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '1.5rem', padding: '2.5rem 2rem', cursor: 'pointer', boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)', border: '3px solid rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.3 }}>Schedule<br/>Details</h2>
          <div style={{ background: 'rgba(0, 0, 0, 0.15)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', width: '100%', maxWidth: '150px' }}>
            <Clock size={80} strokeWidth={2} color="#0f172a" />
          </div>
          <button style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', width: '100%', maxWidth: '180px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>Add</button>
        </div>
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'left' }}>
        <button onClick={onLogout} style={{ background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)', color: '#fbbf24', fontWeight: 'bold', fontSize: '1.1rem', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: '2px solid rgba(251, 191, 36, 0.5)', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' }}>
          Back
        </button>
      </div>
    </div>
  );
};

export default StaffWelcomeDashboard;