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
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ---------- UI State ----------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        video: { facingMode: 'user' }
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

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);

        const photoData = canvas.toDataURL('image/jpeg');
        const newPhotos = [...capturedPhotos];
        newPhotos[currentPhoto - 1] = photoData;
        setCapturedPhotos(newPhotos);
      }
    }
  };

  const handleNext = () => {
    if (currentPhoto < 3) {
      setCurrentPhoto(currentPhoto + 1);
    }
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
    if (capturedPhotos.length !== 3 || capturedPhotos.some(p => !p)) {
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
          photos: capturedPhotos  // array of 3 base64 strings
          // face_image: optional – you could send one of the photos here if needed
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        alert(`Student ${studentId} registered successfully!`);
        // Go back to previous screen
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
        {/* Back Button */}
        <div style={{ height: '32px', flexShrink: 0 }}>
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
            Back
          </button>
        </div>

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
          {/* LIVE indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
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
          </div>

          {/* Video + Captured Image Overlay */}
          <div style={{
            position: 'relative',
            backgroundColor: '#f3f4f6',
            borderRadius: '3px',
            border: '3px solid #9ca3af',
            flex: 1,
            minHeight: 0
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
            {/* Green indicator dots */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3].map(num => (
                <div
                  key={num}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '3px',
                    backgroundColor: capturedPhotos[num - 1] ? '#22c55e' : '#9ca3af'
                  }}
                />
              ))}
            </div>

            <button
              onClick={capturePhoto}
              style={{
                backgroundColor: '#fbbf24',
                color: 'black',
                fontWeight: 'bold',
                padding: '8px 28px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                height: '38px'
              }}
            >
              Capture
            </button>
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
            disabled={currentPhoto === 3 && capturedPhotos.length < 3}
            style={{
              flex: 1,
              backgroundColor: (currentPhoto === 3 && capturedPhotos.length < 3) ? '#d1d5db' : '#fbbf24',
              color: 'black',
              fontWeight: 'bold',
              padding: '10px 0',
              borderRadius: '4px',
              border: 'none',
              cursor: (currentPhoto === 3 && capturedPhotos.length < 3) ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Next
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
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>

        {/* Photo requirement reminder */}
        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          {capturedPhotos.filter(p => p).length}/3 photos captured
        </div>
      </div>
    </div>
  );
}