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
      overflow: 'hidden',
      margin: 0,
    }}>
      <img
        src="/LAYOUT%20PRESENTATION%20(3)_imgupscaler.ai_General_4K.jpg"
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '38% 20%',
          imageRendering: 'crisp-edges',
          zIndex: 0,
        }}
      />

      {/* Buttons */}
      <div style={{
        position: 'absolute',
        bottom: '2rem',
        left: 0,
        right: 0,
        display: 'flex',
        gap: '3rem',
        justifyContent: 'center',
        zIndex: 10,
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
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            border: '4px solid #111827',
            cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s',
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
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            border: '4px solid #111827',
            cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s',
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
    </div>
  );
};

export default LandingPage;
