import React, { useState, useRef, useEffect } from "react";
import { Camera } from "lucide-react";

interface LiveDetectionProps {
  onBack?: () => void;
}

const LiveDetection: React.FC<LiveDetectionProps> = ({ onBack = () => {} }) => {
  const [detectedStudentName, setDetectedStudentName] = useState('');
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [course, setCourse] = useState('');
  const [room, setRoom] = useState('');
  const [professor, setProfessor] = useState('');
  const [tardy, setTardy] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
      
      setTimeout(() => {
        setDetectedStudentName('John Doe');
        setDetectedItems(['Face detected', 'Student ID visible']);
      }, 2000);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleStart = async () => {
    if (!isRecording) {
      await startCamera();
      setIsRecording(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleRecords = () => {
    if (!course || !room || !professor) {
      alert('Please fill in all required fields');
      return;
    }
    
    alert(`Record saved for ${detectedStudentName || 'student'}`);
    
    setCourse('');
    setRoom('');
    setProfessor('');
    setTardy('');
    setDetectedItems([]);
    setDetectedStudentName('');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1e3a8a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#fbbf24',
        padding: '12px 32px',
        borderBottom: '3px solid #78350f',
        flexShrink: 0
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#78350f',
          margin: 0
        }}>
          Live Detection
        </h1>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        padding: '16px',
        gap: '16px',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Left Side */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Student Info */}
          <div style={{ marginBottom: '12px', flexShrink: 0 }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                Student Name:
              </span>
              <span style={{ color: 'white', marginLeft: '8px', fontSize: '16px' }}>
                {detectedStudentName || ''}
              </span>
            </div>
            <div>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                Detected Items:
              </span>
              {detectedItems.length > 0 && (
                <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                  {detectedItems.map((item, idx) => (
                    <div key={idx} style={{ color: 'white', fontSize: '13px' }}>
                      • {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Video Display */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            border: '4px solid #9ca3af',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            minHeight: 0,
            overflow: 'hidden'
          }}>
            <div style={{
              flex: 1,
              backgroundColor: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: 0,
              overflow: 'hidden'
            }}>
              {isRecording ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    border: '2px solid black'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: 'white',
                      borderRadius: '50%'
                    }}></div>
                    LIVE
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Camera size={60} color="#9ca3af" strokeWidth={1.5} style={{ margin: '0 auto 8px' }} />
                  <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
                    Camera access required
                  </p>
                </div>
              )}
            </div>
            <div style={{
              backgroundColor: '#d1d5db',
              padding: '8px',
              display: 'flex',
              gap: '8px',
              flexShrink: 0
            }}>
              <div style={{ width: '60px', height: '45px', backgroundColor: '#9ca3af' }}></div>
              <div style={{ width: '60px', height: '45px', backgroundColor: '#9ca3af' }}></div>
            </div>
          </div>

          {/* Back Button */}
          <div style={{ marginTop: '12px', flexShrink: 0 }}>
            <button
              onClick={onBack}
              style={{
                backgroundColor: '#fbbf24',
                color: '#78350f',
                fontWeight: 'bold',
                padding: '10px 40px',
                fontSize: '18px',
                border: '2px solid #78350f',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              Back
            </button>
          </div>
        </div>

        {/* Right Side - Controls */}
        <div style={{
          width: '240px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flexShrink: 0,
          overflow: 'visible'
        }}>
          {/* Course */}
          <div style={{
            backgroundColor: 'white',
            padding: '10px 14px',
            border: '2px solid #9ca3af',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
              Course
            </label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #9ca3af',
                padding: '4px 6px',
                color: '#1f2937',
                backgroundColor: '#f3f4f6',
                fontSize: '13px'
              }}
            >
              <option value="">Select Course</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
              <option value="BSIS">BSIS</option>
            </select>
          </div>

          {/* Room */}
          <div style={{
            backgroundColor: 'white',
            padding: '10px 14px',
            border: '2px solid #9ca3af',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
              Room
            </label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #9ca3af',
                padding: '4px 6px',
                color: '#1f2937',
                backgroundColor: '#f3f4f6',
                fontSize: '13px'
              }}
            >
              <option value="">Select Room</option>
              <option value="Room 101">Room 101</option>
              <option value="Room 102">Room 102</option>
              <option value="Room 201">Room 201</option>
            </select>
          </div>

          {/* Professor */}
          <div style={{
            backgroundColor: 'white',
            padding: '10px 14px',
            border: '2px solid #9ca3af',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
              Professor
            </label>
            <select
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid #9ca3af',
                padding: '4px 6px',
                color: '#1f2937',
                backgroundColor: '#f3f4f6',
                fontSize: '13px'
              }}
            >
              <option value="">Select Professor</option>
              <option value="Prof. Smith">Prof. Smith</option>
              <option value="Prof. Johnson">Prof. Johnson</option>
              <option value="Prof. Williams">Prof. Williams</option>
            </select>
          </div>

          {/* Tardy */}
          <div style={{
            backgroundColor: 'white',
            padding: '10px 14px',
            border: '2px solid #9ca3af',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <label style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#1f2937',
              textTransform: 'uppercase'
            }}>
              Tardy
            </label>
            <input
              type="number"
              value={tardy}
              onChange={(e) => setTardy(e.target.value)}
              placeholder=""
              style={{
                flex: 1,
                border: '1px solid #9ca3af',
                padding: '4px 6px',
                color: '#1f2937',
                backgroundColor: '#f3f4f6',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginTop: '16px'
          }}>
            <button
              onClick={handleStart}
              disabled={isRecording}
              style={{
                width: '100%',
                fontWeight: 'bold',
                padding: '10px',
                border: '2px solid black',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontSize: '15px',
                backgroundColor: isRecording ? '#d1d5db' : 'white',
                color: isRecording ? '#6b7280' : '#1f2937',
                cursor: isRecording ? 'not-allowed' : 'pointer'
              }}
            >
              START
            </button>

            <button
              onClick={handleRecords}
              style={{
                width: '100%',
                backgroundColor: 'white',
                color: '#1f2937',
                fontWeight: 'bold',
                padding: '10px',
                border: '2px solid black',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              RECORDS
            </button>

            <button
              onClick={handlePause}
              disabled={!isRecording}
              style={{
                width: '100%',
                fontWeight: 'bold',
                padding: '10px',
                border: '2px solid black',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                fontSize: '15px',
                backgroundColor: !isRecording ? '#d1d5db' : 'white',
                color: !isRecording ? '#6b7280' : '#1f2937',
                cursor: !isRecording ? 'not-allowed' : 'pointer'
              }}
            >
              PAUSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDetection;