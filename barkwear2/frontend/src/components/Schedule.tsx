import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface ScheduleProps {
  onBack?: () => void;
}

interface ScheduleItem {
  schedule_id: number;
  subject_name: string;
  block: string;
  start_time: string;
  end_time: string;
  room_code: string;
  instructor_name: string;
  day_of_week?: string;
  year_level?: number;
  is_active?: boolean;
  created_at?: string;
}

interface FormData {
  subject: string;      // maps to subject_name
  block: string;
  time: string;        // e.g. "9:00 - 10:30"
  room: string;        // maps to room_code
  professor: string;   // maps to instructor_name
}

export default function Schedule({ onBack }: ScheduleProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    block: '',
    time: '',
    room: '',
    professor: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:5000/schedules';

  // ---------- FETCH SCHEDULES ----------
  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE + '/');
      const data = await res.json();
      if (data.success) {
        setSchedules(data.schedules);
      } else {
        setError(data.error || 'Failed to load schedules');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Load schedules on mount
  useEffect(() => {
    fetchSchedules();
  }, []);

  const resetForm = () => {
    setFormData({
      subject: '',
      block: '',
      time: '',
      room: '',
      professor: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ---------- CREATE SCHEDULE ----------
  const handleAdd = async () => {
    if (!formData.subject || !formData.block || !formData.time || !formData.room || !formData.professor) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_name: formData.subject,
          block: formData.block,
          time: formData.time,
          room_code: formData.room,
          instructor_name: formData.professor
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchSchedules();  // refresh list
        resetForm();
        setIsAdding(false);
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- UPDATE SCHEDULE ----------
  const handleEdit = (schedule: ScheduleItem) => {
    // Format time from DB (HH:MM:SS) to "HH:MM - HH:MM"
    const start = schedule.start_time.slice(0, 5);
    const end = schedule.end_time.slice(0, 5);
    const timeString = `${start} - ${end}`;

    setEditingId(schedule.schedule_id);
    setFormData({
      subject: schedule.subject_name,
      block: schedule.block,
      time: timeString,
      room: schedule.room_code,
      professor: schedule.instructor_name
    });
  };

  const handleUpdate = async () => {
    if (!formData.subject || !formData.block || !formData.time || !formData.room || !formData.professor) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_name: formData.subject,
          block: formData.block,
          time: formData.time,
          room_code: formData.room,
          instructor_name: formData.professor
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchSchedules();
        resetForm();
        setEditingId(null);
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- DELETE SCHEDULE ----------
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchSchedules();
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsAdding(false);
    setEditingId(null);
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  // Format time for display (remove seconds)
  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  return (
    <div style={{ 
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', 
      padding: '16px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        flex: 1
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: 'white',
            margin: 0
          }}>
            Class Schedule
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            {onBack && (
              <button
                onClick={handleBack}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Back
              </button>
            )}
            {!isAdding && !editingId && (
              <button
                onClick={() => setIsAdding(true)}
                disabled={loading}
                style={{
                  backgroundColor: '#fbbf24',
                  color: 'black',
                  fontWeight: 'bold',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <Plus size={20} />
                Add Schedule
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto'
        }}>
          {/* Loading / Error */}
          {loading && !schedules.length && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
              Loading schedules...
            </div>
          )}
          {error && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              color: '#b91c1c', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '16px' 
            }}>
              Error: {error}
            </div>
          )}

          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '16px', 
              boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)' 
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                marginTop: 0
              }}>
                {isAdding ? 'Add New Schedule' : 'Edit Schedule'}
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px' 
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    marginBottom: '6px' 
                  }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      border: '2px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '7px 10px',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    marginBottom: '6px' 
                  }}>
                    Block
                  </label>
                  <input
                    type="text"
                    name="block"
                    value={formData.block}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      border: '2px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '7px 10px',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., Block A"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    marginBottom: '6px' 
                  }}>
                    Time
                  </label>
                  <input
                    type="text"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      border: '2px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '7px 10px',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., 9:00 - 10:30"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    marginBottom: '6px' 
                  }}>
                    Room
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      border: '2px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '7px 10px',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., Room 101"
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    marginBottom: '6px' 
                  }}>
                    Professor
                  </label>
                  <input
                    type="text"
                    name="professor"
                    value={formData.professor}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      border: '2px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '7px 10px',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., Dr. John Smith"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={loading}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '7px 20px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <Save size={16} />
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '7px 20px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px'
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Schedule List */}
          {!loading && schedules.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              padding: '40px', 
              textAlign: 'center', 
              boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)' 
            }}>
              <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
                No schedules added yet
              </p>
              <p style={{ color: '#9ca3af', marginTop: '8px', margin: '8px 0 0 0' }}>
                Click "Add Schedule" to create your first schedule
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {schedules.map((schedule) => (
                <div
                  key={schedule.schedule_id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start' 
                  }}>
                    <div style={{ 
                      flex: 1, 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                      gap: '12px' 
                    }}>
                      <div>
                        <p style={{ 
                          fontSize: '11px', 
                          color: '#6b7280', 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          margin: '0 0 4px 0'
                        }}>
                          SUBJECT
                        </p>
                        <p style={{ 
                          fontSize: '15px', 
                          fontWeight: 'bold', 
                          color: '#1e3a8a',
                          margin: 0
                        }}>
                          {schedule.subject_name}
                        </p>
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: '11px', 
                          color: '#6b7280', 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          margin: '0 0 4px 0'
                        }}>
                          BLOCK
                        </p>
                        <p style={{ 
                          fontSize: '15px', 
                          fontWeight: 'bold', 
                          color: '#1e3a8a',
                          margin: 0
                        }}>
                          {schedule.block}
                        </p>
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: '11px', 
                          color: '#6b7280', 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          margin: '0 0 4px 0'
                        }}>
                          TIME
                        </p>
                        <p style={{ 
                          fontSize: '15px', 
                          fontWeight: 'bold', 
                          color: '#1e3a8a',
                          margin: 0
                        }}>
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </p>
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: '11px', 
                          color: '#6b7280', 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          margin: '0 0 4px 0'
                        }}>
                          ROOM
                        </p>
                        <p style={{ 
                          fontSize: '15px', 
                          fontWeight: 'bold', 
                          color: '#1e3a8a',
                          margin: 0
                        }}>
                          {schedule.room_code}
                        </p>
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: '11px', 
                          color: '#6b7280', 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          margin: '0 0 4px 0'
                        }}>
                          PROFESSOR
                        </p>
                        <p style={{ 
                          fontSize: '15px', 
                          fontWeight: 'bold', 
                          color: '#1e3a8a',
                          margin: 0
                        }}>
                          {schedule.instructor_name}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                      <button
                        onClick={() => handleEdit(schedule)}
                        disabled={loading}
                        title="Edit"
                        style={{
                          backgroundColor: '#2563eb',
                          color: 'white',
                          padding: '6px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.schedule_id)}
                        disabled={loading}
                        title="Delete"
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          padding: '6px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}