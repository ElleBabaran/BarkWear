import React, { useState, useEffect } from "react";
import { ArrowLeft, User } from "lucide-react";

interface UserType {
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'staff';
}

interface LoginPageProps {
  role: 'admin' | 'staff';
  onLogin: (user: UserType) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ role, onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    initializeUsers();
  }, []);

  const initializeUsers = async () => {
    try {
      // Check if running in Claude artifact environment
      if (typeof window.storage !== 'undefined') {
        const result = await window.storage.get('users');
        if (!result) {
          const defaultUsers = [
            { username: 'admin', password: 'admin123', fullName: 'Administrator', role: 'admin' as const }
          ];
          await window.storage.set('users', JSON.stringify(defaultUsers));
        }
      } else {
        // Use localStorage for regular web environments
        const users = localStorage.getItem('users');
        if (!users) {
          const defaultUsers = [
            { username: 'admin', password: 'admin123', fullName: 'Administrator', role: 'admin' as const }
          ];
          localStorage.setItem('users', JSON.stringify(defaultUsers));
        }
      }
    } catch (err) {
      console.error('Error initializing users:', err);
    }
  };

  const handleLogin = async () => {
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      let users: UserType[] = [];
      
      // Check if running in Claude artifact environment
      if (typeof window.storage !== 'undefined') {
        const result = await window.storage.get('users');
        if (!result) {
          setError('System error. Please try again.');
          return;
        }
        users = JSON.parse(result.value);
      } else {
        // Use localStorage for regular web environments
        const usersData = localStorage.getItem('users');
        if (!usersData) {
          setError('System error. Please try again.');
          return;
        }
        users = JSON.parse(usersData);
      }

      console.log('All users:', users);
      console.log('Looking for:', { username, password, role });
      
      const user = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password && 
        u.role === role
      );

      console.log('Found user:', user);

      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials or wrong portal');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', overflow: 'hidden', margin: 0 }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 20, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.8)', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(4px)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Login Card */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 10 }}>
        <div style={{ background: 'linear-gradient(to bottom, #d1d9e6, #b8c5d6)', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', padding: '2.5rem 2rem', width: '100%', maxWidth: '28rem', boxSizing: 'border-box' }}>
          
          {/* User Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)', borderRadius: '50%', padding: '1.5rem', boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.4)' }}>
              <User style={{ color: '#fbbf24' }} size={44} strokeWidth={2.5} />
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: '#0f172a', marginBottom: '2rem', letterSpacing: '0.025em' }}>LOGIN</h1>

          {/* Error Message */}
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: '#1e293b', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'white', border: '2px solid #0f172a', borderRadius: '0.625rem', outline: 'none', color: '#0f172a', fontSize: '1rem', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#0f172a'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', color: '#1e293b', fontWeight: '700', fontSize: '0.875rem' }}>
                  Password
                </label>
                <button style={{ color: '#4f46e5', fontSize: '0.75rem', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#3730a3'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#4f46e5'}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'white', border: '2px solid #0f172a', borderRadius: '0.625rem', outline: 'none', color: '#0f172a', fontSize: '1rem', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#0f172a'}
              />
            </div>

            <button
              onClick={handleLogin}
              style={{ width: '100%', background: 'linear-gradient(to right, #fbbf24, #f59e0b)', color: '#0f172a', fontWeight: 'bold', fontSize: '1rem', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.3)', border: '2px solid #0f172a', marginTop: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 20px -4px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(0, 0, 0, 0.3)';
              }}
            >
              Log In
            </button>
          </div>

          {/* Helper text for admin */}
          {role === 'admin' && (
            <div style={{ marginTop: '1.75rem', padding: '1rem', background: '#dbeafe', borderRadius: '0.75rem', border: '2px solid #3b82f6' }}>
              <p style={{ fontSize: '0.825rem', color: '#1e3a8a', textAlign: 'center', margin: 0, fontWeight: '600' }}>
                <strong>Default Admin:</strong> admin / admin123
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;