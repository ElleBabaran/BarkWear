import React, { useState, useRef, useEffect } from 'react';

interface PhotoCaptureProps {
  onBack?: () => void;
}

export default function PhotoCapture({ onBack }: PhotoCaptureProps) {
  // ---------- Student Information Fields ----------
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [block, setBlock] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [collegeCode, setCollegeCode] = useState('');

  // ---------- Photo Capture State ----------
  const [currentPhoto, setCurrentPhoto] = useState<number>(1);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>(['', '', '']);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ---------- UI State ----------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [faceGuideMsg, setFaceGuideMsg] = useState<string>('Position your face in the center');

  // 🆕 Face Detection Settings
  const [faceConfidence, setFaceConfidence] = useState<number>(0.2); // Default 20% - lenient for far faces
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [detectionQuality, setDetectionQuality] = useState<'fast' | 'accurate'>('accurate');
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);

  // ---------- Camera Setup ----------
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);
    setFaceGuideMsg('🔍 Detecting face...');

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) { setCapturing(false); return; }

    // Draw full frame to canvas
    ctx.drawImage(video, 0, 0);
    const fullFrame = canvas.toDataURL('image/jpeg', 0.9);

    try {
      const res = await fetch('http://localhost:5000/detect-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: fullFrame,
          confidence: faceConfidence,
          quality: detectionQuality
        }),
        signal: AbortSignal.timeout(10000),
      });

      const result = await res.json();
      const fbox: number[] | null = result.face_bbox || null;
      const faceConfidenceScore = result.confidence || 0;

      if (fbox && fbox.length === 4 && faceConfidenceScore >= faceConfidence) {
        // Face detected — crop tightly around face only
        const [fx1, fy1, fx2, fy2] = fbox;
        const padX = (fx2 - fx1) * 0.05;
        const padY = (fy2 - fy1) * 0.08;
        
        const cx1 = Math.max(0, fx1 - padX);
        const cy1 = Math.max(0, fy1 - padY);
        const cw = Math.min(video.videoWidth - cx1, (fx2 - fx1) + padX * 2);
        const ch = Math.min(video.videoHeight - cy1, (fy2 - fy1) + padY * 2);

        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = cw;
        faceCanvas.height = ch;
        const faceCtx = faceCanvas.getContext('2d');
        
        if (faceCtx) {
          faceCtx.drawImage(video, cx1, cy1, cw, ch, 0, 0, cw, ch);
          const photoData = faceCanvas.toDataURL('image/jpeg', 0.95);
          
          const newPhotos = [...capturedPhotos];
          newPhotos[currentPhoto - 1] = photoData;
          setCapturedPhotos(newPhotos);
          setFaceGuideMsg(`✅ Face captured! (${(faceConfidenceScore * 100).toFixed(0)}% confidence)`);

          if (currentPhoto < 3) {
            setCurrentPhoto(currentPhoto + 1);
            setTimeout(() => setFaceGuideMsg('Position your face in the center'), 2000);
          } else {
            setTimeout(() => setFaceGuideMsg('All 3 photos captured!'), 2000);
          }
        }
      } else {
        // No face or low confidence — do NOT save, force retry
        if (fbox && faceConfidenceScore < faceConfidence) {
          setFaceGuideMsg(`⚠️ Confidence too low (${(faceConfidenceScore * 100).toFixed(0)}%) — subukan ulit`);
          setError(`Face detected but confidence too low (${(faceConfidenceScore * 100).toFixed(0)}%). Lower the threshold or move closer.`);
        } else {
          setFaceGuideMsg('⚠️ Walang nakitang mukha — subukan ulit');
          setError('No face detected. Make sure your face is clearly visible and well-lit.');
        }
        setTimeout(() => setError(null), 4000);
      }

    } catch (err: any) {
      // Backend offline — do NOT save, show error only
      console.warn('Face detection unavailable:', err.message);
      setFaceGuideMsg('⚠️ Backend offline — hindi ma-detect ang mukha');
      setError('Backend is offline. Cannot capture without face detection.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setCapturing(false);
    }
  };

  const handleNext = () => {
    if (currentPhoto < 3 && capturedPhotos[currentPhoto - 1]) {
      setCurrentPhoto(currentPhoto + 1);
    }
  };

  // 🆕 Retake current photo
  const handleRetake = () => {
    const newPhotos = [...capturedPhotos];
    newPhotos[currentPhoto - 1] = '';
    setCapturedPhotos(newPhotos);
    setFaceGuideMsg('Position your face in the center');
    setError(null);
  };

  // 🆕 Adjust confidence threshold
  const adjustConfidence = (delta: number) => {
    const newConf = Math.max(0.1, Math.min(0.9, faceConfidence + delta));
    setFaceConfidence(newConf);
  };

  // ---------- Form Submission ----------
  const handleSubmit = async () => {
    // Basic validation
    if (!studentId.trim()) {
      alert('Student ID is required');
      return;
    }
    if (!firstName.trim()) {
      alert('First name is required');
      return;
    }
    if (!lastName.trim()) {
      alert('Last name is required');
      return;
    }
    if (!block.trim()) {
      alert('Block is required');
      return;
    }
    if (!yearLevel.trim()) {
      alert('Year level is required');
      return;
    }
    if (capturedPhotos.filter(p => p).length !== 3) {
      alert('Please capture all 3 photos first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          middle_name: middleName.trim() || undefined,
          email: email.trim() || undefined,
          block: block.trim(),
          year_level: parseInt(yearLevel, 10),
          college_code: collegeCode.trim() || undefined,
          photos: capturedPhotos
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);

        // Reload face recognition DB
        try {
          await fetch('http://localhost:5000/reload-faces', { method: 'POST' });
        } catch (_) {}

        alert(`Student ${studentId} registered successfully!`);
        if (onBack) onBack();
      } else {
        setError(data.error || 'Registration failed');
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Network error');
      alert('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  // ---------- Render ----------
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#1e3a8a',
      padding: '8px',
      boxSizing: 'border-box',
      display: 'flex',
      gap: '8px',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      margin: 0
    }}>
      {/* ---------- LEFT SECTION - CAMERA ---------- */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        gap: '6px',
        minHeight: 0
      }}>
        {/* Back Button & Settings Toggle */}
        <div style={{ height: '32px', flexShrink: 0, display: 'flex', gap: '8px' }}>
          <button
            onClick={handleBack}
            style={{
              backgroundColor: '#fbbf24',
              color: 'black',
              fontWeight: 'bold',
              padding: '6px 20px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              height: '32px'
            }}
          >
            ← Back
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              backgroundColor: showSettings ? '#10b981' : '#6b7280',
              color: 'white',
              fontWeight: 'bold',
              padding: '6px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              height: '32px'
            }}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* 🆕 Settings Panel */}
        {showSettings && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '4px',
            padding: '12px',
            flexShrink: 0
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a' }}>
              Face Detection Settings
            </h3>
            
            {/* Confidence Threshold */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                Confidence Threshold: {(faceConfidence * 100).toFixed(0)}%
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => adjustConfidence(-0.1)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  -
                </button>
                
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={faceConfidence * 100}
                  onChange={(e) => setFaceConfidence(parseInt(e.target.value) / 100)}
                  style={{ flex: 1 }}
                />
                
                <button
                  onClick={() => adjustConfidence(0.1)}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  +
                </button>
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                Lower = more lenient, Higher = more strict
              </div>
            </div>

            {/* Detection Quality */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                Detection Quality
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setDetectionQuality('fast')}
                  style={{
                    flex: 1,
                    backgroundColor: detectionQuality === 'fast' ? '#10b981' : '#d1d5db',
                    color: detectionQuality === 'fast' ? 'white' : 'black',
                    fontWeight: 'bold',
                    padding: '6px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ⚡ Fast
                </button>
                <button
                  onClick={() => setDetectionQuality('accurate')}
                  style={{
                    flex: 1,
                    backgroundColor: detectionQuality === 'accurate' ? '#10b981' : '#d1d5db',
                    color: detectionQuality === 'accurate' ? 'white' : 'black',
                    fontWeight: 'bold',
                    padding: '6px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🎯 Accurate
                </button>
              </div>
            </div>

            {/* Face Guide Toggle */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showFaceGuide}
                  onChange={(e) => setShowFaceGuide(e.target.checked)}
                />
                <span>Show face guide overlay</span>
              </label>
            </div>
          </div>
        )}

        {/* Camera Box */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '8px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          gap: '6px'
        }}>
          {/* LIVE indicator & Confidence Display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '24px',
            flexShrink: 0
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '12px',
              border: '2px solid black'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                backgroundColor: 'white',
                borderRadius: '50%'
              }}></div>
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>LIVE</span>
            </div>
            
            <div style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#1e3a8a',
              backgroundColor: '#fbbf24',
              padding: '4px 10px',
              borderRadius: '12px'
            }}>
              Threshold: {(faceConfidence * 100).toFixed(0)}%
            </div>
          </div>

          {/* Video + Captured Image Overlay */}
          <div style={{
            position: 'relative',
            backgroundColor: '#f3f4f6',
            borderRadius: '3px',
            border: '3px solid #9ca3af',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden'
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '3px'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* 🆕 Face Guide Overlay */}
            {showFaceGuide && !capturedPhotos[currentPhoto - 1] && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{
                  width: '420px',
                  height: '420px',
                  borderRadius: '50%',
                  border: '3px dashed #fbbf24',
                  flexShrink: 0
                }} />
              </div>
            )}

            {capturedPhotos[currentPhoto - 1] && (
              <img
                src={capturedPhotos[currentPhoto - 1]}
                alt="Captured"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '3px'
                }}
              />
            )}

            {/* Counter */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'black',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '2px 10px',
              borderRadius: '4px'
            }}>
              {currentPhoto}/3
            </div>
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '38px',
            flexShrink: 0
          }}>
            {/* Photo thumbnails */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3].map(num => (
                <div
                  key={num}
                  onClick={() => setCurrentPhoto(num)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '3px',
                    backgroundColor: capturedPhotos[num - 1] ? '#22c55e' : '#9ca3af',
                    border: currentPhoto === num ? '3px solid #fbbf24' : '2px solid transparent',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {capturedPhotos[num - 1] && (
                    <img
                      src={capturedPhotos[num - 1]}
                      alt={`Photo ${num}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Capture & Retake buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {capturedPhotos[currentPhoto - 1] && (
                <button
                  onClick={handleRetake}
                  disabled={capturing}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: capturing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    height: '38px'
                  }}
                >
                  🔄 Retake
                </button>
              )}
              
              <button
                onClick={capturePhoto}
                disabled={capturing}
                style={{
                  backgroundColor: capturing ? '#9ca3af' : '#fbbf24',
                  color: 'black',
                  fontWeight: 'bold',
                  padding: '8px 24px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: capturing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  height: '38px'
                }}
              >
                {capturing ? '🔍 Detecting...' : '📸 Capture'}
              </button>
            </div>
          </div>

          {/* Face guide message */}
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: faceGuideMsg.startsWith('⚠️') ? '#b91c1c' : faceGuideMsg.startsWith('✅') ? '#15803d' : '#6b7280',
            fontWeight: faceGuideMsg.startsWith('✅') || faceGuideMsg.startsWith('⚠️') ? 'bold' : 'normal',
            padding: '2px 0',
            minHeight: '18px',
            flexShrink: 0
          }}>
            {faceGuideMsg}
          </div>
        </div>
      </div>

      {/* ---------- RIGHT SECTION - STUDENT FORM ---------- */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '4px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        width: '320px',
        minHeight: 0,
        flexShrink: 0,
        overflowY: 'auto'
      }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 'bold',
          color: '#fbbf24',
          margin: '0 0 16px 0',
          fontFamily: 'Arial, sans-serif'
        }}>
          Student Registration
        </h1>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: '13px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
              Student ID <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              style={{
                width: '100%',
                border: '2px solid #d1d5db',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="e.g., 2021-00001"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
              First Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{
                width: '100%',
                border: '2px solid #d1d5db',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Juan"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
              Last Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{
                width: '100%',
                border: '2px solid #d1d5db',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Dela Cruz"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
              Middle Name
            </label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              style={{
                width: '100%',
                border: '2px solid #d1d5db',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Santos (optional)"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                border: '2px solid #d1d5db',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="juan@example.com (optional)"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
              Block <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              style={{
                width: '100%',
                border: '2px solid #d1d5db',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="e.g., A"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
              Year Level <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              style={{
                width: '100%',
                border: '2px solid #d1d5db',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: 'white'
              }}
            >
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
              <option value="5">5th Year</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
              College Code
            </label>
            <input
              type="text"
              value={collegeCode}
              onChange={(e) => setCollegeCode(e.target.value)}
              style={{
                width: '100%',
                border: '2px solid #d1d5db',
                borderRadius: '4px',
                padding: '8px 10px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="e.g., CCS (optional)"
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={handleNext}
            disabled={currentPhoto === 3}
            style={{
              flex: 1,
              backgroundColor: currentPhoto === 3 ? '#d1d5db' : '#fbbf24',
              color: 'black',
              fontWeight: 'bold',
              padding: '10px 0',
              borderRadius: '4px',
              border: 'none',
              cursor: currentPhoto === 3 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Next →
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: loading ? '#9ca3af' : '#1e3a8a',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 0',
              borderRadius: '4px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {loading ? 'Submitting...' : '✓ Submit'}
          </button>
        </div>

        {/* Photo requirement reminder */}
        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          📸 {capturedPhotos.filter(p => p).length}/3 photos captured
        </div>
      </div>
    </div>
  );
}