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

import React, { useState } from "react";
import { Calendar, User, Clock, LogOut } from "lucide-react";
import Schedule from './Schedule';
import PhotoCapture from './Capture';
import LiveDetection from './LiveDetection';

type StaffPage = "attendance" | "students" | "schedule";

interface UserType {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface StaffWelcomeDashboardProps {
  user?: UserType;
  onLogout?: () => void;
  onNavigate?: (page: StaffPage) => void;
}

const StaffWelcomeDashboard: React.FC<StaffWelcomeDashboardProps> = ({ 
  user = { id: '1', fullName: 'Staff Member', name: 'Staff Member', email: 'staff@example.com', role: 'staff' }, 
  onLogout = () => {}, 
  onNavigate = () => {}
}) => {
  const [activeView, setActiveView] = useState<'welcome' | 'attendance' | 'students' | 'schedule'>('welcome');

  if (activeView === 'attendance') return <LiveDetection onBack={() => setActiveView('welcome')} />;
  if (activeView === 'students') return <PhotoCapture onBack={() => setActiveView('welcome')} />;
  if (activeView === 'schedule') return <Schedule onBack={() => setActiveView('welcome')} />;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', overflow: 'hidden', margin: 0 }}>
      
      {/* Background image */}
      <img
        src="/LAYOUT%20PRESENTATION%20(4)_imgupscaler.ai_General_4K.jpg"
        alt=""
        style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center top',
          imageRendering: 'crisp-edges', zIndex: 0,
        }}
      />

      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 10, 60, 0.55)', zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', overflow: 'auto', padding: '2rem', boxSizing: 'border-box' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: '900',
              fontStyle: 'italic',
              color: '#fbbf24',
              margin: 0,
              textShadow: '3px 3px 8px rgba(0,0,0,0.5)',
              letterSpacing: '-0.02em',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>Welcome!</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginTop: '0.4rem' }}>
              Hello, {user.fullName || user.name || 'Staff Member'}
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: '#fbbf24', color: '#111827',
              fontWeight: 'bold', fontSize: '1rem',
              padding: '0.75rem 1.75rem', borderRadius: '0.6rem',
              border: '3px solid #92600a', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Attendance */}
          <div onClick={() => setActiveView('attendance')} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '1.5rem', padding: '2.5rem 2rem', cursor: 'pointer', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4)', border: '3px solid #92600a', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.3 }}>Attendance<br/>details</h2>
            <div style={{ background: 'rgba(0,0,0,0.12)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', width: '100%', maxWidth: '150px' }}>
              <Calendar size={80} strokeWidth={2} color="#0f172a" />
            </div>
            <button style={{ background: '#fbbf24', color: '#111827', fontWeight: 'bold', fontSize: '1.1rem', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: '3px solid #92600a', cursor: 'pointer', width: '100%', maxWidth: '180px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>Start</button>
          </div>

          {/* Students */}
          <div onClick={() => setActiveView('students')} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '1.5rem', padding: '2.5rem 2rem', cursor: 'pointer', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4)', border: '3px solid #92600a', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.3 }}>Student<br/>Details</h2>
            <div style={{ background: 'rgba(0,0,0,0.12)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', width: '100%', maxWidth: '150px' }}>
              <User size={80} strokeWidth={2} color="#0f172a" />
            </div>
            <button style={{ background: '#fbbf24', color: '#111827', fontWeight: 'bold', fontSize: '1.1rem', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: '3px solid #92600a', cursor: 'pointer', width: '100%', maxWidth: '180px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>Capture</button>
          </div>

          {/* Schedule */}
          <div onClick={() => setActiveView('schedule')} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', borderRadius: '1.5rem', padding: '2.5rem 2rem', cursor: 'pointer', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4)', border: '3px solid #92600a', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1.5rem', lineHeight: 1.3 }}>Schedule<br/>Details</h2>
            <div style={{ background: 'rgba(0,0,0,0.12)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', width: '100%', maxWidth: '150px' }}>
              <Clock size={80} strokeWidth={2} color="#0f172a" />
            </div>
            <button style={{ background: '#fbbf24', color: '#111827', fontWeight: 'bold', fontSize: '1.1rem', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: '3px solid #92600a', cursor: 'pointer', width: '100%', maxWidth: '180px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>Add</button>
          </div>
        </div>

        {/* Back button */}
        <div style={{ marginTop: '3rem', textAlign: 'left' }}>
          <button onClick={onLogout} style={{ background: '#fbbf24', color: '#111827', fontWeight: 'bold', fontSize: '1.1rem', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', border: '3px solid #92600a', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffWelcomeDashboard;