import React from "react";
import { Calendar, User as UserIcon, Clock, LogOut } from "lucide-react";

interface User {
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'staff';
}

interface StaffWelcomeDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (page: 'attendance' | 'students' | 'schedule') => void;
}

const StaffWelcomeDashboard: React.FC<StaffWelcomeDashboardProps> = ({ 
  user, 
  onLogout, 
  onNavigate 
}) => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 50%, #312e81 100%)',
      overflow: 'auto',
      margin: 0,
      padding: '2rem',
      boxSizing: 'border-box'
    }}>
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '3rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: '#fbbf24', 
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Welcome!
          </h1>
          <p style={{ 
            color: 'white', 
            fontSize: '1.1rem', 
            marginTop: '0.5rem',
            opacity: 0.9
          }}>
            Hello, {user?.fullName || user?.username || 'User'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={onLogout}
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(4px)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <LogOut size={20} />
            Logout
          </button>

          <button
            style={{ 
              background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
              color: '#0f172a',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              padding: '0.875rem 2rem',
              borderRadius: '0.75rem',
              border: '2px solid #0f172a',
              cursor: 'pointer',
              boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 20px -4px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(0, 0, 0, 0.4)';
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Cards Container */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        
        {/* Attendance Details Card */}
        <div 
          onClick={() => onNavigate('attendance')}
          style={{ 
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            borderRadius: '1.5rem',
            padding: '2.5rem 2rem',
            cursor: 'pointer',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s',
            border: '3px solid rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.4)';
          }}
        >
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: '#0f172a',
            marginBottom: '1.5rem',
            lineHeight: 1.3
          }}>
            Attendance<br/>details
          </h2>
          
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.15)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            width: '100%',
            maxWidth: '150px'
          }}>
            <Calendar size={80} strokeWidth={2} color="#0f172a" />
          </div>

          <button style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            color: '#fbbf24',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            padding: '0.875rem 2.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '180px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }}>
            Start
          </button>
        </div>

        {/* Student Details Card */}
        <div 
          onClick={() => onNavigate('students')}
          style={{ 
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            borderRadius: '1.5rem',
            padding: '2.5rem 2rem',
            cursor: 'pointer',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s',
            border: '3px solid rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.4)';
          }}
        >
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: '#0f172a',
            marginBottom: '1.5rem',
            lineHeight: 1.3
          }}>
            Student<br/>Details
          </h2>
          
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.15)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            width: '100%',
            maxWidth: '150px'
          }}>
            <UserIcon size={80} strokeWidth={2} color="#0f172a" />
          </div>

          <button style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            color: '#fbbf24',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            padding: '0.875rem 2.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '180px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }}>
            Capture
          </button>
        </div>

        {/* Schedule Details Card */}
        <div 
          onClick={() => onNavigate('schedule')}
          style={{ 
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            borderRadius: '1.5rem',
            padding: '2.5rem 2rem',
            cursor: 'pointer',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4)',
            transition: 'all 0.3s',
            border: '3px solid rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(0, 0, 0, 0.4)';
          }}
        >
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: '#0f172a',
            marginBottom: '1.5rem',
            lineHeight: 1.3
          }}>
            Schedule<br/>Details
          </h2>
          
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.15)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            width: '100%',
            maxWidth: '150px'
          }}>
            <Clock size={80} strokeWidth={2} color="#0f172a" />
          </div>

          <button style={{ 
            background: 'rgba(15, 23, 42, 0.8)',
            color: '#fbbf24',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            padding: '0.875rem 2.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '180px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }}>
            Add
          </button>
        </div>

      </div>

      {/* Back Button */}
      <div style={{ marginTop: '3rem', textAlign: 'left' }}>
        <button
          onClick={onLogout}
          style={{ 
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            color: '#fbbf24',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            padding: '0.875rem 2.5rem',
            borderRadius: '0.75rem',
            border: '2px solid rgba(251, 191, 36, 0.5)',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Back
        </button>
      </div>

    </div>
  );
};

export default StaffWelcomeDashboard;