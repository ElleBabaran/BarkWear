import React, { useState, useRef, useEffect } from "react";
import { Camera, FileText, User, BookOpen, Search, Trash2, Edit2, Download, X, Save } from "lucide-react";

interface LiveDetectionProps {
  onBack?: () => void;
}

interface Detection {
  class: string;
  confidence: number;
  bbox: number[];
}

interface ScheduleOption {
  schedule_id: number;
  subject_name: string;
  subject_code: string;
  block: string;
  room_code: string;
  instructor_name: string;
  start_time: string;
  end_time: string;
  day_of_week: string;
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  subject_code: string;
  subject_name: string;
  time_in: string;
  time_out: string;
  status: 'present' | 'tardy' | 'absent';
  uniform_status: string;
  professor: string;
}

type RecordsView = null | 'do' | 'professor';

const LiveDetection: React.FC<LiveDetectionProps> = ({ onBack = () => {} }) => {
  const [detectedStudentName, setDetectedStudentName] = useState('');
  const [detectedStudentId, setDetectedStudentId] = useState('');
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [uniformStatus, setUniformStatus] = useState('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [faceBbox, setFaceBbox] = useState<number[] | null>(null);

  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOption[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleOption | null>(null);
  const [course, setCourse] = useState('');
  const [room, setRoom] = useState('');
  const [professor, setProfessor] = useState('');
  const [tardy, setTardy] = useState('15');
  const [customTardyTime, setCustomTardyTime] = useState('');
  const [showCustomTardy, setShowCustomTardy] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const [recordsView, setRecordsView] = useState<RecordsView>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessionStudents, setSessionStudents] = useState<Set<string>>(new Set());

  // Records UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editForm, setEditForm] = useState<Partial<AttendanceRecord>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const absentCheckRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = 'http://localhost:5000/detect';
  const SCHEDULE_API = 'http://localhost:5000/schedules/';

  const addLog = (msg: string) =>
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`].slice(-10));

  // ── Schedules ──
  const fetchSchedules = async () => {
    try {
      const res = await fetch(SCHEDULE_API);
      const data = await res.json();
      if (data.success) {
        setScheduleOptions(data.schedules);
        autoSelectSchedule(data.schedules);
        addLog(`✅ Loaded ${data.schedules.length} schedules`);
      }
    } catch (err: any) { addLog('❌ ' + err.message); }
  };

  const autoSelectSchedule = (schedules: ScheduleOption[]) => {
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 8);
    const matched = schedules.find(s =>
      s.day_of_week === currentDay &&
      s.start_time <= currentTime &&
      s.end_time >= currentTime
    );
    if (matched) {
      setSelectedSchedule(matched);
      setCourse(matched.subject_name);
      setRoom(matched.room_code);
      setProfessor(matched.instructor_name);
      addLog(`🎯 Auto-selected: ${matched.subject_name}`);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  // ── Camera ──
  const startCamera = async () => {
    try {
      setErrorMessage('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = async () => {
          await videoRef.current!.play();
          addLog('▶️ Camera playing');
        };
      }
    } catch (err: any) {
      const msg = 'Camera error: ' + err.message;
      setErrorMessage(msg);
      addLog('❌ ' + msg);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (absentCheckRef.current) clearInterval(absentCheckRef.current);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return null;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // ── Draw overlay ──
  const drawOverlay = (dets: Detection[], studentName: string, fbox: number[] | null) => {
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const labelRemap: { [k: string]: string } = { 'id_card': 'shoes' };
    const colors: { [k: string]: string } = {
      'shoes': '#ffff00', 'id_card': '#ffff00',
      'blue_polo': '#00ff00', 'black_pants': '#0000ff',
    };

    dets.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;
      const w = x2 - x1, h = y2 - y1;
      const displayClass = labelRemap[det.class.toLowerCase()] || det.class;
      const color = colors[det.class.toLowerCase()] || '#4ade80';
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, w, h);
      ctx.fillStyle = color + '30'; ctx.fillRect(x1, y1, w, h);
      const label = `${displayClass} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 16px Arial';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = color; ctx.fillRect(x1, y1 - 24, tw + 10, 24);
      ctx.fillStyle = '#000'; ctx.fillText(label, x1 + 5, y1 - 6);
    });

    if (fbox && studentName) {
      const [fx1, fy1, fx2, fy2] = fbox;
      const fw = fx2 - fx1, fh = fy2 - fy1;
      ctx.strokeStyle = '#ff6b00'; ctx.lineWidth = 3;
      ctx.strokeRect(fx1, fy1, fw, fh);
      ctx.fillStyle = 'rgba(255,107,0,0.15)'; ctx.fillRect(fx1, fy1, fw, fh);
      ctx.font = 'bold 18px Arial';
      const ntw = ctx.measureText(studentName).width;
      ctx.fillStyle = '#ff6b00'; ctx.fillRect(fx1, fy1 - 28, ntw + 10, 28);
      ctx.fillStyle = '#fff'; ctx.fillText(studentName, fx1 + 5, fy1 - 8);
    }
  };

  // ── Attendance recording ──
  const recordAttendance = (studentName: string, studentId: string, uniStatus: string) => {
    if (!studentName) return;
    const key = studentName.toLowerCase().trim();
    if (sessionStudents.has(key)) return;

    const now = new Date();
    const timeIn = now.toLocaleTimeString();
    let status: 'present' | 'tardy' | 'absent' = 'present';

    if (selectedSchedule && tardy !== 'none') {
      const [sh, sm] = selectedSchedule.start_time.split(':').map(Number);
      const classStart = new Date(now);
      classStart.setHours(sh, sm, 0, 0);
      let tardyMinutes: number;
      if (tardy === 'custom' && customTardyTime) {
        const [ch, cm] = customTardyTime.split(':').map(Number);
        const customTime = new Date(now);
        customTime.setHours(ch, cm, 0, 0);
        tardyMinutes = (customTime.getTime() - classStart.getTime()) / 60000;
      } else {
        tardyMinutes = parseInt(tardy, 10) || 15;
      }
      const tardyMs = tardyMinutes * 60 * 1000;
      if (now.getTime() > classStart.getTime() + tardyMs) status = 'tardy';
    }

    const record: AttendanceRecord = {
      id: Date.now().toString(),
      student_id: studentId || 'N/A',
      student_name: studentName,
      subject_code: selectedSchedule?.subject_code || course,
      subject_name: selectedSchedule?.subject_name || course,
      time_in: timeIn,
      time_out: '--',
      status,
      uniform_status: uniStatus,
      professor,
    };

    setAttendanceRecords(prev => [...prev, record]);
    setSessionStudents(prev => new Set([...prev, key]));
    addLog(`📝 Recorded: ${studentName} — ${status}`);
  };

  // ── Detection loop ──
  const doDetection = async () => {
    const imageData = captureFrame();
    if (!imageData) return;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success) {
        const name = result.student_name || '';
        const sid = result.student_id || 'N/A';
        const fbox = result.face_bbox || null;
        setDetectedStudentName(name);
        setDetectedStudentId(sid);
        setFaceBbox(fbox);
        setUniformStatus(result.uniform_status || '');
        setDetections(result.detections || []);
        if (result.detections?.length > 0) {
          setDetectedItems(result.detections.map((d: Detection) =>
            `${d.class === 'id_card' ? 'shoes' : d.class} (${(d.confidence * 100).toFixed(0)}%)`
          ));
        } else { setDetectedItems([]); }
        drawOverlay(result.detections || [], name, fbox);
        if (name) recordAttendance(name, sid, result.uniform_status || '');
        addLog(`🎯 ${result.detections?.length || 0} items | ${name || 'no face'}`);
      }
    } catch (err: any) { addLog('❌ ' + err.message); }
  };

  const handleStart = async () => {
    if (isRecording) return;
    setIsRecording(true); setIsPaused(false);
    setDetectedStudentName(''); setDetectedStudentId('');
    setSessionStudents(new Set());
    try { await fetch('http://localhost:5000/reload-faces', { method: 'POST' }); addLog('🔄 Face DB refreshed'); } catch (_) {}
    await startCamera();
    setTimeout(() => {
      doDetection();
      detectionIntervalRef.current = setInterval(doDetection, 1500);
      absentCheckRef.current = setInterval(() => {
        if (!selectedSchedule) return;
        const now = new Date();
        if (tardy === 'none') return;
        const [sh, sm] = selectedSchedule.start_time.split(':').map(Number);
        let tardyMinutes: number;
        if (tardy === 'custom' && customTardyTime) {
          const [ch, cm] = customTardyTime.split(':').map(Number);
          const customTime = new Date(now); customTime.setHours(ch, cm, 0, 0);
          const base = new Date(now); base.setHours(sh, sm, 0, 0);
          tardyMinutes = (customTime.getTime() - base.getTime()) / 60000;
        } else { tardyMinutes = parseInt(tardy, 10) || 15; }
        const tardyMs = tardyMinutes * 60 * 1000;
        const deadline = new Date(now); deadline.setHours(sh, sm, 0, 0);
        if (now.getTime() > deadline.getTime() + tardyMs) {
          setAttendanceRecords(prev => prev.map(r => r.time_in === '--' ? { ...r, status: 'absent' } : r));
        }
      }, 60000);
      addLog('🔁 Detection started');
    }, 2500);
  };

  const handleStop = () => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (absentCheckRef.current) clearInterval(absentCheckRef.current);
    // Mark time_out for all present/tardy students
    const timeOut = new Date().toLocaleTimeString();
    setAttendanceRecords(prev => prev.map(r =>
      r.time_out === '--' && r.status !== 'absent' ? { ...r, time_out: timeOut } : r
    ));
    stopCamera();
    setIsRecording(false); setIsPaused(false);
    setDetections([]); setDetectedItems([]); setUniformStatus('');
    overlayCanvasRef.current?.getContext('2d')?.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    addLog('🛑 Stopped');
  };

  const handlePause = () => {
    const p = !isPaused; setIsPaused(p);
    if (videoRef.current) p ? videoRef.current.pause() : videoRef.current.play();
    addLog(p ? '⏸️ Paused' : '▶️ Resumed');
  };

  // ── Records helpers ──
  const statusColor = (s: string) =>
    s === 'present' ? '#16a34a' : s === 'tardy' ? '#f59e0b' : '#dc2626';

  const filteredRecords = (view: RecordsView) => {
    let records = view === 'professor'
      ? attendanceRecords.filter(r => r.professor === professor)
      : attendanceRecords;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter(r =>
        r.student_name.toLowerCase().includes(q) ||
        r.student_id.toLowerCase().includes(q) ||
        r.subject_code.toLowerCase().includes(q)
      );
    }
    return records;
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this record?')) return;
    setAttendanceRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleEditOpen = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditForm({ ...record });
  };

  const handleEditSave = () => {
    if (!editingRecord) return;
    setAttendanceRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, ...editForm } as AttendanceRecord : r));
    setEditingRecord(null);
    setEditForm({});
  };

  // ── Export to Excel (CSV) ──
  const exportToExcel = (view: RecordsView) => {
    const records = filteredRecords(view);
    if (records.length === 0) { alert('No records to export.'); return; }

    let headers: string[];
    let rows: string[][];

    if (view === 'do') {
      headers = ['Student ID', 'Student Name', 'Uniform Status'];
      rows = records.map(r => [r.student_id, r.student_name, r.uniform_status]);
    } else {
      headers = ['Student Name', 'Subject Code', 'Time In', 'Time Out', 'Status'];
      rows = records.map(r => [r.student_name, r.subject_code, r.time_in, r.time_out, r.status]);
    }

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${view === 'do' ? 'DO_Records' : 'Professor_Records'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueCourses = Array.from(new Set(scheduleOptions.map(s => s.subject_name)));
  const uniqueRooms = Array.from(new Set(scheduleOptions.map(s => s.room_code)));
  const uniqueProfessors = Array.from(new Set(scheduleOptions.map(s => s.instructor_name)));

  // ── Edit Modal ──
  const EditModal = () => {
    if (!editingRecord) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '440px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ backgroundColor: '#1e3a8a', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#fbbf24', margin: 0, fontSize: '16px', fontWeight: 'bold' }}>✏️ Edit Record</h3>
            <button onClick={() => setEditingRecord(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Student Name', key: 'student_name', type: 'text' },
              { label: 'Student ID', key: 'student_id', type: 'text' },
              { label: 'Time In', key: 'time_in', type: 'text' },
              { label: 'Time Out', key: 'time_out', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(editForm as any)[f.key] || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '6px', padding: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Status</label>
              <select
                value={editForm.status || 'present'}
                onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '6px', padding: '8px', fontSize: '14px' }}
              >
                <option value="present">Present</option>
                <option value="tardy">Tardy</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Uniform Status</label>
              <select
                value={editForm.uniform_status || ''}
                onChange={e => setEditForm(prev => ({ ...prev, uniform_status: e.target.value }))}
                style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '6px', padding: '8px', fontSize: '14px' }}
              >
                <option value="Compliant">Compliant</option>
                <option value="Partially Compliant">Partially Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={handleEditSave} style={{ flex: 1, padding: '10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Save size={15} /> Save
              </button>
              <button onClick={() => setEditingRecord(null)} style={{ flex: 1, padding: '10px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Records Modal ──
  const RecordsModal = () => {
    if (!recordsView) return null;
    const records = filteredRecords(recordsView);
    const isDO = recordsView === 'do';

    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '92%', maxWidth: '960px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

          {/* Header */}
          <div style={{ backgroundColor: '#1e3a8a', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: '#fbbf24', margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
              {isDO ? '📋 D.O. Records' : '👩‍🏫 Professor Records'}
            </h2>
            <button onClick={() => setRecordsView(null)} style={{ background: 'none', border: '2px solid #fbbf24', color: '#fbbf24', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: 'bold' }}>✕ Close</button>
          </div>

          {/* Sub-nav */}
          <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setRecordsView('do')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: isDO ? '#1e3a8a' : '#e2e8f0', color: isDO ? 'white' : '#374151' }}>
              📋 D.O.
            </button>
            <button onClick={() => setRecordsView('professor')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: !isDO ? '#1e3a8a' : '#e2e8f0', color: !isDO ? 'white' : '#374151' }}>
              👩‍🏫 Professor
            </button>

            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '200px', backgroundColor: 'white', border: '2px solid #d1d5db', borderRadius: '6px', padding: '4px 10px' }}>
              <Search size={14} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search by name, ID, subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '13px', flex: 1 }}
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}><X size={13} /></button>}
            </div>

            {/* Export */}
            <button onClick={() => exportToExcel(recordsView)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', backgroundColor: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Download size={13} /> Export CSV
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {records.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>
                {searchQuery ? 'No records match your search.' : 'No records yet for this session.'}
              </div>
            ) : isDO ? (
              // D.O. Table: Student ID | Student Name | Uniform
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0 }}>
                    {['Student ID', 'Student Name', 'Uniform Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 'bold', color: '#374151', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 16px', color: '#6b7280', fontFamily: 'monospace' }}>{r.student_id}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 'bold', color: '#111827' }}>{r.student_name || '—'}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ color: r.uniform_status === 'Compliant' ? '#16a34a' : r.uniform_status === 'Partially Compliant' ? '#f59e0b' : '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>
                          {r.uniform_status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEditOpen(r)} style={{ padding: '5px 8px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><Edit2 size={13} /></button>
                          <button onClick={() => handleDelete(r.id)} style={{ padding: '5px 8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              // Professor Table: Student Name | Subject Code | Time In | Time Out | Status
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0 }}>
                    {['Student Name', 'Subject Code', 'Time In', 'Time Out', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 'bold', color: '#374151', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 'bold', color: '#111827' }}>{r.student_name || '—'}</td>
                      <td style={{ padding: '10px 16px', color: '#374151', fontFamily: 'monospace' }}>{r.subject_code}</td>
                      <td style={{ padding: '10px 16px', color: '#374151' }}>{r.time_in}</td>
                      <td style={{ padding: '10px 16px', color: '#374151' }}>{r.time_out}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ backgroundColor: statusColor(r.status) + '20', color: statusColor(r.status), padding: '3px 10px', borderRadius: '99px', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleEditOpen(r)} style={{ padding: '5px 8px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><Edit2 size={13} /></button>
                          <button onClick={() => handleDelete(r.id)} style={{ padding: '5px 8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer count */}
          <div style={{ padding: '10px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#6b7280' }}>
            {records.length} record{records.length !== 1 ? 's' : ''} {searchQuery ? '(filtered)' : ''}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1e3a8a', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <RecordsModal />
      <EditModal />

      {/* Top bar */}
      <div style={{ backgroundColor: '#fbbf24', padding: '12px 24px', borderBottom: '3px solid #78350f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#78350f', margin: 0 }}>Uniform Detection System</h1>
        <button onClick={() => setRecordsView('do')} style={{ backgroundColor: '#1e3a8a', color: '#fbbf24', fontWeight: 'bold', padding: '8px 18px', borderRadius: '8px', border: '2px solid #78350f', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={15} /> RECORDS
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, padding: '14px', gap: '14px', overflow: 'hidden', alignItems: 'flex-start' }}>

        {/* Left Panel */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 'bold', color: '#fbbf24', borderBottom: '2px solid #fbbf24', paddingBottom: '5px' }}>Detection Status</h2>
            <div style={{ marginBottom: '8px', fontSize: '13px', color: 'white' }}>
              <strong>Student:</strong>
              <div style={{ marginTop: '3px', padding: '7px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '5px', color: detectedStudentName ? '#fbbf24' : '#94a3b8', fontWeight: 'bold' }}>
                {detectedStudentName || 'Waiting...'}
              </div>
            </div>
            {detectedStudentId && <div style={{ marginBottom: '8px', fontSize: '12px', color: '#94a3b8' }}>ID: <span style={{ color: 'white' }}>{detectedStudentId}</span></div>}
            {uniformStatus && (
              <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                <strong style={{ color: 'white' }}>Uniform:</strong>
                <div style={{ marginTop: '3px', padding: '7px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '5px', color: uniformStatus === 'Compliant' ? '#4ade80' : '#f87171', fontWeight: 'bold', textAlign: 'center' }}>{uniformStatus}</div>
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'white' }}>
              <strong>Items:</strong>
              <div style={{ marginTop: '3px', padding: '7px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '5px', fontSize: '11px', color: '#e5e7eb', minHeight: '32px' }}>
                {detectedItems.length > 0 ? detectedItems.join(', ') : 'None'}
              </div>
            </div>
            {errorMessage && <div style={{ color: '#fca5a5', fontSize: '11px', marginTop: '8px', backgroundColor: 'rgba(239,68,68,0.2)', padding: '7px', borderRadius: '5px' }}>⚠️ {errorMessage}</div>}
          </div>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '10px', padding: '10px', maxHeight: '170px', overflowY: 'auto', fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
            <div style={{ color: '#fbbf24', marginBottom: '5px', fontWeight: 'bold', fontSize: '11px' }}>📊 Log</div>
            {debugLog.map((l, i) => <div key={i} style={{ marginBottom: '2px' }}>{l}</div>)}
          </div>

          <button onClick={onBack} style={{ backgroundColor: '#fbbf24', color: '#78350f', fontWeight: 'bold', padding: '9px', fontSize: '13px', border: '2px solid #78350f', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
        </div>

        {/* Camera */}
        <div style={{ flex: 1, maxWidth: '660px' }}>
          <div style={{ backgroundColor: '#000', borderRadius: '12px', position: 'relative', overflow: 'hidden', height: '495px', border: '4px solid #fbbf24', boxShadow: '0 8px 16px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isRecording ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }} />
                <canvas ref={overlayCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: isPaused ? '#f59e0b' : '#dc2626', color: 'white', padding: '5px 12px', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />
                  {isPaused ? 'PAUSED' : 'LIVE'}
                </div>
                {isDetecting && <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#fbbf24', color: '#000', padding: '5px 12px', borderRadius: '5px', fontWeight: 'bold', fontSize: '12px' }}>🔍 ANALYZING...</div>}
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Camera size={65} color="#94a3b8" />
                <p style={{ color: '#94a3b8', marginTop: '14px', fontSize: '15px' }}>Camera Ready</p>
                <p style={{ color: '#64748b', fontSize: '12px' }}>Click START to begin</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ width: '290px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Session */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '10px', padding: '12px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '2px solid #fbbf24', paddingBottom: '5px' }}>Session Details</h2>
            {[
              { label: 'Course', value: course, setter: setCourse, options: uniqueCourses },
              { label: 'Room', value: room, setter: setRoom, options: uniqueRooms },
              { label: 'Professor', value: professor, setter: setProfessor, options: uniqueProfessors },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: '7px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '3px', color: '#374151', textTransform: 'uppercase' }}>{f.label}</label>
                <select value={f.value} onChange={e => f.setter(e.target.value)} style={{ width: '100%', padding: '5px', borderRadius: '5px', border: '2px solid #d1d5db', fontSize: '12px' }}>
                  <option value="">Select {f.label}</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '3px', color: '#374151', textTransform: 'uppercase' }}>Tardy Threshold</label>
              <select
                value={tardy}
                onChange={e => {
                  const val = e.target.value;
                  setTardy(val);
                  setShowCustomTardy(val === 'custom');
                }}
                style={{ width: '100%', padding: '5px', borderRadius: '5px', border: '2px solid #d1d5db', fontSize: '12px' }}
              >
                <option value="none">None (No Tardy)</option>
                <option value="0">Exact Class Time</option>
                <option value="5">5 min late</option>
                <option value="10">10 min late</option>
                <option value="15">15 min late</option>
                <option value="20">20 min late</option>
                <option value="30">30 min late</option>
                <option value="custom">Set Time for Tardy</option>
              </select>
              {showCustomTardy && (
                <div style={{ marginTop: '5px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', marginBottom: '3px', color: '#374151' }}>Tardy starts at:</label>
                  <input
                    type="time"
                    value={customTardyTime}
                    onChange={e => setCustomTardyTime(e.target.value)}
                    style={{ width: '100%', padding: '5px', borderRadius: '5px', border: '2px solid #fbbf24', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '10px', padding: '12px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a' }}>Controls</h2>
            {[
              { label: isRecording ? '✓ STARTED' : '▶ START', onClick: handleStart, disabled: isRecording, bg: isRecording ? '#9ca3af' : '#10b981', color: 'white' },
              { label: '⏹ STOP', onClick: handleStop, disabled: !isRecording, bg: !isRecording ? '#9ca3af' : '#ef4444', color: 'white' },
              { label: isPaused ? '▶ RESUME' : '⏸ PAUSE', onClick: handlePause, disabled: !isRecording, bg: !isRecording ? '#9ca3af' : '#fbbf24', color: '#000' },
            ].map(b => (
              <button key={b.label} onClick={b.onClick} disabled={b.disabled} style={{ width: '100%', padding: '9px', borderRadius: '7px', fontWeight: 'bold', fontSize: '13px', backgroundColor: b.bg, color: b.color, border: 'none', cursor: b.disabled ? 'not-allowed' : 'pointer', marginBottom: '5px' }}>
                {b.label}
              </button>
            ))}
          </div>

          {/* Records */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '10px', padding: '12px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a' }}>Records</h2>
            <button onClick={() => setRecordsView('do')} style={{ width: '100%', padding: '9px', borderRadius: '7px', fontWeight: 'bold', fontSize: '13px', backgroundColor: '#1e3a8a', color: '#fbbf24', border: '2px solid #fbbf24', cursor: 'pointer', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <BookOpen size={14} /> D.O. Records
            </button>
            <button onClick={() => setRecordsView('professor')} style={{ width: '100%', padding: '9px', borderRadius: '7px', fontWeight: 'bold', fontSize: '13px', backgroundColor: '#7c3aed', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <User size={14} /> Professor Records
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
};

export default LiveDetection;