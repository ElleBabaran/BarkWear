import React from "react";

interface LandingPageProps {
  setRole: (role: 'admin' | 'staff') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setRole }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflow: 'hidden',
      margin: 0
    }}>
      {/* Main content */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10,
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%'
      }}>
        
        {/* Tagline */}
        <p style={{
          color: '#fbbf24',
          fontSize: '1.5rem',
          fontStyle: 'italic',
          fontWeight: '500',
          marginBottom: '1rem'
        }}>
          Education that works.
        </p>

        {/* Logo section */}
        <div style={{ marginBottom: '2rem' }}>
          {/* BARK text */}
          <h1 style={{
            fontSize: '5rem',
            fontWeight: '900',
            color: '#fbbf24',
            letterSpacing: '-0.05em',
            lineHeight: '1',
            margin: '0 0 1.5rem 0',
            textShadow: '4px 4px 8px rgba(0,0,0,0.5)'
          }}>
            BARK
          </h1>
          
          {/* Bulldog mascot */}
          <div style={{ margin: '1.5rem auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              background: 'white',
              borderRadius: '50%',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '8px solid #fbbf24',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="55" r="35" fill="#F59E0B"/>
                <circle cx="48" cy="50" r="6" fill="#1F2937"/>
                <circle cx="72" cy="50" r="6" fill="#1F2937"/>
                <circle cx="50" cy="50" r="3" fill="white"/>
                <circle cx="74" cy="50" r="3" fill="white"/>
                <ellipse cx="60" cy="65" rx="8" ry="6" fill="#1F2937"/>
                <path d="M 45 70 Q 60 80 75 70" stroke="#1F2937" strokeWidth="3" fill="none"/>
                <ellipse cx="60" cy="85" rx="25" ry="8" fill="#1E40AF"/>
                <circle cx="60" cy="85" r="4" fill="#FBBF24"/>
                <ellipse cx="35" cy="45" rx="12" ry="18" fill="#D97706" transform="rotate(-20 35 45)"/>
                <ellipse cx="85" cy="45" rx="12" ry="18" fill="#D97706" transform="rotate(20 85 45)"/>
              </svg>
            </div>
          </div>
          
          {/* WEAR text */}
          <h1 style={{
            fontSize: '5rem',
            fontWeight: '900',
            color: '#fbbf24',
            letterSpacing: '-0.05em',
            lineHeight: '1',
            margin: '1.5rem 0 0 0',
            textShadow: '4px 4px 8px rgba(0,0,0,0.5)'
          }}>
            WEAR
          </h1>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          marginTop: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setRole('staff')}
            style={{
              background: '#fbbf24',
              color: '#111827',
              fontWeight: 'bold',
              fontSize: '1.25rem',
              padding: '1rem 4rem',
              borderRadius: '9999px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '4px solid #111827',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#fbbf24';
            }}
          >
            Staff
          </button>
          
          <button
            onClick={() => setRole('admin')}
            style={{
              background: '#fbbf24',
              color: '#111827',
              fontWeight: 'bold',
              fontSize: '1.25rem',
              padding: '1rem 4rem',
              borderRadius: '9999px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '4px solid #111827',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#fbbf24';
            }}
          >
            Admin
          </button>
        </div>

        {/* Footer text */}
        <div style={{ marginTop: '3rem' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
            National University
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;