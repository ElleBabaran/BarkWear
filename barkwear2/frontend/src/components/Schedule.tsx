import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface ScheduleProps {
  onBack?: () => void;
}

interface ScheduleItem {
  id: number;
  subject: string;
  block: string;
  time: string;
  room: string;
  professor: string;
}

interface FormData {
  subject: string;
  block: string;
  time: string;
  room: string;
  professor: string;
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdd = () => {
    if (formData.subject && formData.block && formData.time && formData.room && formData.professor) {
      setSchedules([...schedules, { ...formData, id: Date.now() }]);
      resetForm();
      setIsAdding(false);
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleEdit = (schedule: ScheduleItem) => {
    setEditingId(schedule.id);
    setFormData({
      subject: schedule.subject,
      block: schedule.block,
      time: schedule.time,
      room: schedule.room,
      professor: schedule.professor
    });
  };

  const handleUpdate = () => {
    if (formData.subject && formData.block && formData.time && formData.room && formData.professor) {
      setSchedules(schedules.map(s => 
        s.id === editingId ? { ...formData, id: editingId } : s
      ));
      resetForm();
      setEditingId(null);
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsAdding(false);
    setEditingId(null);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
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
                style={{
                  backgroundColor: '#fbbf24',
                  color: 'black',
                  fontWeight: 'bold',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px'
                }}
              >
                <Plus size={20} />
                Add Schedule
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto'
        }}>
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
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '7px 20px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px'
                  }}
                >
                  <Save size={16} />
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '7px 20px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
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
          {schedules.length === 0 ? (
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
                  key={schedule.id}
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
                          {schedule.subject}
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
                          {schedule.time}
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
                          {schedule.room}
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
                          {schedule.professor}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                      <button
                        onClick={() => handleEdit(schedule)}
                        title="Edit"
                        style={{
                          backgroundColor: '#2563eb',
                          color: 'white',
                          padding: '6px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        title="Delete"
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          padding: '6px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer'
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