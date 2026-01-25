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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

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

  const handleForgotPassword = async () => {
    setResetMessage('');
    
    if (!email) {
      setResetMessage('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setResetMessage('Please enter a valid email address');
      return;
    }

    try {
      // ⚠️ REPLACE THESE 3 VALUES WITH YOUR ACTUAL EMAILJS CREDENTIALS ⚠️
      const serviceId = 'service_syp3r78';  // ✅ Your service ID
      const templateId = 'template_gslovmj'; // 👈 CHANGE THIS - Get from EmailJS template page
      const publicKey = 'v5UWyazp2jiHWISxW';   // 👈 CHANGE THIS - Get from EmailJS Account section

      // Generate a password reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetLink = `${window.location.origin}#reset=${resetToken}`;
      
      // Store the reset token temporarily (expires in 1 hour)
      const resetData = {
        email: email,
        token: resetToken,
        expires: Date.now() + (60 * 60 * 1000) // 1 hour from now
      };
      
      if (typeof window.storage !== 'undefined') {
        await window.storage.set(`reset_${resetToken}`, JSON.stringify(resetData));
      } else {
        localStorage.setItem(`reset_${resetToken}`, JSON.stringify(resetData));
      }

      // Template parameters - matching your EmailJS template variables
      const templateParams = {
        email: email,        // for {{email}} in template
        link: resetLink,     // for {{link}} in template
        to_email: email      // recipient email
      };

      // Send email using EmailJS API
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: templateParams
        })
      });

      if (response.ok) {
        setResetMessage('Password reset link has been sent to your email!');
        setTimeout(() => {
          setShowForgotPassword(false);
          setEmail('');
          setResetMessage('');
        }, 3000);
      } else {
        setResetMessage('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setResetMessage('Failed to send email. Please try again.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', overflow: 'hidden', margin: 0 }}>
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '24rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>Reset Password</h2>
            <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            {resetMessage && (
              <div style={{ 
                background: resetMessage.includes('sent') ? '#d1fae5' : '#fee2e2', 
                border: `1px solid ${resetMessage.includes('sent') ? '#86efac' : '#fca5a5'}`, 
                color: resetMessage.includes('sent') ? '#065f46' : '#991b1b', 
                padding: '0.75rem 1rem', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem', 
                fontSize: '0.875rem' 
              }}>
                {resetMessage}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#1e293b', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'white', border: '2px solid #cbd5e1', borderRadius: '0.625rem', outline: 'none', color: '#0f172a', fontSize: '1rem', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setEmail('');
                  setResetMessage('');
                }}
                style={{ flex: 1, padding: '0.75rem 1.5rem', background: '#e2e8f0', color: '#475569', fontWeight: '600', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#cbd5e1'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#e2e8f0'}
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                style={{ flex: 1, padding: '0.75rem 1.5rem', background: 'linear-gradient(to right, #4f46e5, #3730a3)', color: 'white', fontWeight: '600', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}

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
                {role === 'staff' && (
                  <button 
                    onClick={() => setShowForgotPassword(true)}
                    style={{ color: '#4f46e5', fontSize: '0.75rem', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'none' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#3730a3'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#4f46e5'}
                  >
                    Forgot Password?
                  </button>
                )}
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