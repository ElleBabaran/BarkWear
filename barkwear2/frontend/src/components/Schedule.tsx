import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface ScheduleProps {
  onBack?: () => void;
}

interface ScheduleItem {
  schedule_id: number;
  subject_name: string;
  subject_code: string;
  block: string;
  start_time: string;
  end_time: string;
  room_code: string;
  instructor_name: string;
  day_of_week?: string;
  year_level?: number;
  is_active?: boolean;
}

interface FormData {
  subject_name: string;
  subject_code: string;
  block: string;
  day_of_week: string;
  year_level: string;
  start_hour: string;
  start_minute: string;
  start_period: string;
  end_hour: string;
  end_minute: string;
  end_period: string;
  room_code: string;
  instructor_name: string;
}

const EMPTY_FORM: FormData = {
  subject_name: '',
  subject_code: '',
  block: '',
  day_of_week: 'Monday',
  year_level: '1',
  start_hour: '8',
  start_minute: '00',
  start_period: 'AM',
  end_hour: '9',
  end_minute: '00',
  end_period: 'AM',
  room_code: '',
  instructor_name: '',
};

// Convert 12h form values to "HH:MM:SS" for the backend
function toMySQLTime(hour: string, minute: string, period: string): string {
  let h = parseInt(hour, 10);
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}:00`;
}

// Convert "HH:MM:SS" from DB back to 12h form values
function fromMySQLTime(time: string): { hour: string; minute: string; period: string } {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { hour: String(h), minute: mStr, period };
}

export default function Schedule({ onBack }: ScheduleProps) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:5000/schedules';

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE + '/');
      const data = await res.json();
      if (data.success) setSchedules(data.schedules);
      else setError(data.error || 'Failed to load schedules');
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const resetForm = () => setFormData(EMPTY_FORM);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    subject_name: formData.subject_name,
    subject_code: formData.subject_code,
    block: formData.block,
    day_of_week: formData.day_of_week,
    year_level: parseInt(formData.year_level, 10),
    start_time: toMySQLTime(formData.start_hour, formData.start_minute, formData.start_period),
    end_time: toMySQLTime(formData.end_hour, formData.end_minute, formData.end_period),
    room_code: formData.room_code,
    instructor_name: formData.instructor_name,
  });

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (data.success) { await fetchSchedules(); resetForm(); setIsAdding(false); }
      else alert('Error: ' + (data.error || 'Unknown error'));
    } catch (err: any) { alert('Network error: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleEdit = (s: ScheduleItem) => {
    const start = fromMySQLTime(s.start_time);
    const end = fromMySQLTime(s.end_time);
    setEditingId(s.schedule_id);
    setFormData({
      subject_name: s.subject_name,
      subject_code: s.subject_code || '',
      block: s.block,
      day_of_week: s.day_of_week || 'Monday',
      year_level: String(s.year_level || 1),
      start_hour: start.hour,
      start_minute: start.minute,
      start_period: start.period,
      end_hour: end.hour,
      end_minute: end.minute,
      end_period: end.period,
      room_code: s.room_code,
      instructor_name: s.instructor_name,
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (data.success) { await fetchSchedules(); resetForm(); setEditingId(null); }
      else alert('Error: ' + (data.error || 'Unknown error'));
    } catch (err: any) { alert('Network error: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this schedule?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) await fetchSchedules();
      else alert('Error: ' + (data.error || 'Unknown error'));
    } catch (err: any) { alert('Network error: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleCancel = () => { resetForm(); setIsAdding(false); setEditingId(null); };

  const formatTime = (t: string) => {
    const { hour, minute, period } = fromMySQLTime(t);
    return `${hour}:${minute} ${period}`;
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '2px solid #d1d5db', borderRadius: '4px',
    padding: '7px 10px', fontSize: '13px', boxSizing: 'border-box',
    backgroundColor: 'white',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px',
  };

  const TimeSelector = ({ prefix }: { prefix: 'start' | 'end' }) => (
    <div style={{ display: 'flex', gap: '6px' }}>
      <select name={`${prefix}_hour`} value={(formData as any)[`${prefix}_hour`]} onChange={handleChange} style={{ ...selectStyle, flex: 1 }}>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <select name={`${prefix}_minute`} value={(formData as any)[`${prefix}_minute`]} onChange={handleChange} style={{ ...selectStyle, flex: 1 }}>
        {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select name={`${prefix}_period`} value={(formData as any)[`${prefix}_period`]} onChange={handleChange} style={{ ...selectStyle, flex: 1 }}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, overflowY: 'auto', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: 0 }}>Class Schedule</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              {onBack && (
                <button onClick={onBack} style={{ backgroundColor: '#6b7280', color: 'white', fontWeight: 'bold', padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                  Back
                </button>
              )}
              {!isAdding && !editingId && (
                <button onClick={() => setIsAdding(true)} disabled={loading} style={{ backgroundColor: '#fbbf24', color: 'black', fontWeight: 'bold', padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                  <Plus size={20} /> Add Schedule
                </button>
              )}
            </div>
          </div>

          {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>Error: {error}</div>}
          {loading && !schedules.length && <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>Loading...</div>}

          {/* Add / Edit Form */}
          {(isAdding || editingId) && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', marginTop: 0 }}>
                {isAdding ? 'Add New Schedule' : 'Edit Schedule'}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>

                <div>
                  <label style={labelStyle}>Subject Name</label>
                  <input name="subject_name" value={formData.subject_name} onChange={handleChange} placeholder="e.g., Mathematics" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Subject Code</label>
                  <input name="subject_code" value={formData.subject_code} onChange={handleChange} placeholder="e.g., MATH101" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Block</label>
                  <input name="block" value={formData.block} onChange={handleChange} placeholder="e.g., Block A" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Day</label>
                  <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} style={selectStyle}>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Year Level</label>
                  <select name="year_level" value={formData.year_level} onChange={handleChange} style={selectStyle}>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Start Time</label>
                  <TimeSelector prefix="start" />
                </div>

                <div>
                  <label style={labelStyle}>End Time</label>
                  <TimeSelector prefix="end" />
                </div>

                <div>
                  <label style={labelStyle}>Room</label>
                  <input name="room_code" value={formData.room_code} onChange={handleChange} placeholder="e.g., Room 101" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Professor</label>
                  <input name="instructor_name" value={formData.instructor_name} onChange={handleChange} placeholder="e.g., Dr. Smith" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={loading}
                  style={{ backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold', padding: '7px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Save size={16} /> {editingId ? 'Update' : 'Save'}
                </button>
                <button onClick={handleCancel} style={{ backgroundColor: '#6b7280', color: 'white', fontWeight: 'bold', padding: '7px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Schedule List */}
          {!loading && schedules.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>No schedules added yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {schedules.map(s => (
                <div key={s.schedule_id} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                      {[
                        { label: 'SUBJECT', value: s.subject_name },
                        { label: 'CODE', value: s.subject_code },
                        { label: 'BLOCK', value: s.block },
                        { label: 'DAY', value: s.day_of_week },
                        { label: 'TIME', value: `${formatTime(s.start_time)} - ${formatTime(s.end_time)}` },
                        { label: 'ROOM', value: s.room_code },
                        { label: 'PROFESSOR', value: s.instructor_name },
                      ].map(item => (
                        <div key={item.label}>
                          <p style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', margin: '0 0 4px 0' }}>{item.label}</p>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                      <button onClick={() => handleEdit(s)} disabled={loading} title="Edit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(s.schedule_id)} disabled={loading} title="Delete" style={{ backgroundColor: '#dc2626', color: 'white', padding: '6px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ height: '24px' }} />
        </div>
      </div>
    </>
  );
}