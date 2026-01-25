// Type declarations for window.storage
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
import { User, Plus, Minus, X } from "lucide-react";

interface UserType {
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'staff';
}

interface AdminDashboardProps {
  user: UserType;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      if (typeof window.storage !== 'undefined') {
        const result = await window.storage.get('users');
        if (result) {
          setUsers(JSON.parse(result.value));
        }
      } else {
        const usersData = localStorage.getItem('users');
        if (usersData) {
          setUsers(JSON.parse(usersData));
        }
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      alert('Please fill all fields');
      return;
    }

    if (users.find(u => u.username === newUser.username)) {
      alert('Username already exists');
      return;
    }

    const updatedUsers = [...users, { ...newUser, role: 'staff' as const }];
    try {
      if (typeof window.storage !== 'undefined') {
        await window.storage.set('users', JSON.stringify(updatedUsers));
      } else {
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      }
      setUsers(updatedUsers);
      setNewUser({ username: '', password: '', fullName: '' });
      setShowAddModal(false);
      alert('Staff account created successfully!');
    } catch (err) {
      alert('Error adding user');
    }
  };

  const handleRemoveUser = async (username: string) => {
    if (username === 'admin') {
      alert('Cannot remove admin account');
      return;
    }
    
    const updatedUsers = users.filter(u => u.username !== username);
    try {
      if (typeof window.storage !== 'undefined') {
        await window.storage.set('users', JSON.stringify(updatedUsers));
      } else {
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      }
      setUsers(updatedUsers);
      alert('Staff account removed successfully!');
    } catch (err) {
      alert('Error removing user');
    }
  };

  const staffUsers = users.filter(u => u.role === 'staff');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)', overflow: 'auto' }}>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: '48rem' }}>
          
          {/* Header Card */}
          <div style={{ background: 'linear-gradient(to bottom, #e2e8f0, #cbd5e1)', borderRadius: '1.5rem 1.5rem 0 0', padding: '2rem', textAlign: 'center', borderBottom: '4px solid #312e81' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #4f46e5, #312e81)', borderRadius: '50%', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}>
                <User style={{ color: '#fbbf24' }} size={48} strokeWidth={2.5} />
              </div>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>ADMIN</h1>
            <p style={{ color: '#374151', marginTop: '0.5rem' }}>Welcome, {user?.fullName || 'Admin'}</p>
          </div>

          {/* Action Buttons Card */}
          <div style={{ background: 'linear-gradient(135deg, #4338ca, #3730a3)', borderRadius: '0 0 1.5rem 1.5rem', padding: '3rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
              
              {/* Add Account Button */}
              <button
                onClick={() => setShowAddModal(true)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{ background: '#fbbf24', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', border: '4px solid #312e81', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Plus size={64} style={{ color: '#312e81' }} strokeWidth={3} />
                </div>
                <span style={{ color: '#111827', fontWeight: 'bold', fontSize: '1.125rem' }}>Add new account</span>
              </button>

              {/* Remove Account Button */}
              <button
                onClick={() => setShowRemoveModal(true)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{ background: '#fbbf24', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', border: '4px solid #312e81', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Minus size={64} style={{ color: '#312e81' }} strokeWidth={3} />
                </div>
                <span style={{ color: '#111827', fontWeight: 'bold', fontSize: '1.125rem' }}>Remove account</span>
              </button>
            </div>

            {/* Logout Button */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button
                onClick={onLogout}
                style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', maxWidth: '30rem', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Add New Staff Account</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#4b5563'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #d1d5db', borderRadius: '0.5rem', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Username</label>
                <input
                  type="text"
                  placeholder="johndoe"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #d1d5db', borderRadius: '0.5rem', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '2px solid #d1d5db', borderRadius: '0.5rem', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                <button
                  onClick={handleAddUser}
                  style={{ flex: 1, background: 'linear-gradient(to right, #fbbf24, #f59e0b)', color: '#111827', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', border: '2px solid #111827', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Create Account
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, background: '#e5e7eb', color: '#1f2937', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove User Modal */}
      {showRemoveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', maxWidth: '28rem', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Remove Staff Account</h3>
              <button 
                onClick={() => setShowRemoveModal(false)}
                style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#4b5563'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '24rem', overflowY: 'auto' }}>
              {staffUsers.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>No staff accounts to remove</p>
              ) : (
                staffUsers.map(u => (
                  <div key={u.username} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '2px solid #e5e7eb', borderRadius: '0.5rem', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#fca5a5';
                      e.currentTarget.style.background = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem 0' }}>{u.fullName}</p>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>@{u.username}</p>
                    </div>
                    <button
                      onClick={() => {
                        handleRemoveUser(u.username);
                        setShowRemoveModal(false);
                      }}
                      style={{ background: '#dc2626', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowRemoveModal(false)}
              style={{ width: '100%', marginTop: '1.5rem', background: '#e5e7eb', color: '#1f2937', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;