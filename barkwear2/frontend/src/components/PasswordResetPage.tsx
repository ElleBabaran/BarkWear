import React, { useState, useEffect } from "react";
import { ArrowLeft, Lock, CheckCircle } from "lucide-react";

interface UserType {
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'staff';
}

interface PasswordResetPageProps {
  onBack: () => void;
}

const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ onBack }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    validateResetToken();
  }, []);

  const validateResetToken = async () => {
    // Get token from URL hash (#reset=token123)
    const hash = window.location.hash;
    const tokenMatch = hash.match(/#reset=(.+)/);
    
    if (!tokenMatch) {
      setError('Invalid or missing reset token');
      setLoading(false);
      return;
    }

    const token = tokenMatch[1];

    try {
      // Check if token exists and is valid
      let resetData;
      
      if (typeof window.storage !== 'undefined') {
        const result = await window.storage.get(`reset_${token}`);
        if (!result) {
          setError('Invalid or expired reset link');
          setLoading(false);
          return;
        }
        resetData = JSON.parse(result.value);
      } else {
        const data = localStorage.getItem(`reset_${token}`);
        if (!data) {
          setError('Invalid or expired reset link');
          setLoading(false);
          return;
        }
        resetData = JSON.parse(data);
      }

      // Check if token is expired (1 hour)
      if (Date.now() > resetData.expires) {
        setError('Reset link has expired. Please request a new one.');
        setLoading(false);
        return;
      }

      setEmail(resetData.email);
      setValidToken(true);
      setLoading(false);
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Error validating reset link');
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Get token from URL
      const hash = window.location.hash;
      const tokenMatch = hash.match(/#reset=(.+)/);
      const token = tokenMatch![1];

      // Get users list
      let users: UserType[] = [];
      
      if (typeof window.storage !== 'undefined') {
        const result = await window.storage.get('users');
        if (!result) {
          setError('System error. Please try again.');
          return;
        }
        users = JSON.parse(result.value);
      } else {
        const usersData = localStorage.getItem('users');
        if (!usersData) {
          setError('System error. Please try again.');
          return;
        }
        users = JSON.parse(usersData);
      }

      // Find user by email and update password
      const userIndex = users.findIndex(u => u.username.toLowerCase() === email.toLowerCase() || u.username === email);
      
      if (userIndex === -1) {
        setError('User not found');
        return;
      }

      // Update password
      users[userIndex].password = newPassword;

      // Save updated users
      if (typeof window.storage !== 'undefined') {
        await window.storage.set('users', JSON.stringify(users));
        // Delete the used reset token
        await window.storage.delete(`reset_${token}`);
      } else {
        localStorage.setItem('users', JSON.stringify(users));
        // Delete the used reset token
        localStorage.removeItem(`reset_${token}`);
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.hash = '';
        onBack();
      }, 3000);

    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: '1.5rem' }}>Validating reset link...</div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', overflow: 'hidden', margin: 0 }}>
        <button
          onClick={onBack}
          style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 20, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.8)', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(4px)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
          <span>Back to Login</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem 2rem', width: '100%', maxWidth: '28rem', textAlign: 'center' }}>
            <div style={{ background: '#fee2e2', borderRadius: '50%', width: '80px', height: '80px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={40} color="#991b1b" />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>Invalid Reset Link</h1>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={onBack}
              style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)', color: '#0f172a', fontWeight: 'bold', padding: '0.75rem 2rem', borderRadius: '0.75rem', border: '2px solid #0f172a', cursor: 'pointer' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2.5rem 2rem', width: '100%', maxWidth: '28rem', textAlign: 'center' }}>
          <div style={{ background: '#d1fae5', borderRadius: '50%', width: '80px', height: '80px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={40} color="#065f46" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>Password Reset Successful!</h1>
          <p style={{ color: '#64748b' }}>Your password has been updated. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', overflow: 'hidden', margin: 0 }}>
      <button
        onClick={onBack}
        style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 20, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.8)', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(4px)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
      >
        <ArrowLeft size={20} />
        <span>Back to Login</span>
      </button>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 10 }}>
        <div style={{ background: 'linear-gradient(to bottom, #d1d9e6, #b8c5d6)', borderRadius: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', padding: '2.5rem 2rem', width: '100%', maxWidth: '28rem', boxSizing: 'border-box' }}>
          
          {/* Lock Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)', borderRadius: '50%', padding: '1.5rem', boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.4)' }}>
              <Lock style={{ color: '#fbbf24' }} size={44} strokeWidth={2.5} />
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', textAlign: 'center', color: '#0f172a', marginBottom: '0.5rem', letterSpacing: '0.025em' }}>Reset Password</h1>
          <p style={{ textAlign: 'center', color: '#475569', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Enter your new password for <strong>{email}</strong>
          </p>

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
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'white', border: '2px solid #0f172a', borderRadius: '0.625rem', outline: 'none', color: '#0f172a', fontSize: '1rem', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#0f172a'}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#1e293b', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'white', border: '2px solid #0f172a', borderRadius: '0.625rem', outline: 'none', color: '#0f172a', fontSize: '1rem', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#0f172a'}
              />
            </div>

            <button
              onClick={handleResetPassword}
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
              Reset Password
            </button>
          </div>

          {/* Password Requirements */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#dbeafe', borderRadius: '0.75rem', border: '2px solid #3b82f6' }}>
            <p style={{ fontSize: '0.75rem', color: '#1e3a8a', margin: 0, fontWeight: '600' }}>
              Password must be at least 6 characters long
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;