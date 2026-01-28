// src/components/LiveDetection.tsx

import React, { useState, useEffect } from "react";

interface LiveDetectionProps {
  onBack: () => void;
}

const LiveDetection: React.FC<LiveDetectionProps> = ({ onBack }) => {
  const [detectedStudentName, setDetectedStudentName] = useState('');
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [course, setCourse] = useState('');
  const [room, setRoom] = useState('');
  const [professor, setProfessor] = useState('');
  const [tardy, setTardy] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
      // Simulate detection after 2 seconds
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
    }
  };

  const handleRecords = () => {
    if (!course || !room || !professor) {
      alert('Please fill in all required fields');
      return;
    }
    alert(`Record saved for ${detectedStudentName || 'student'}`);
    // Reset form
    setCourse('');
    setRoom('');
    setProfessor('');
    setTardy('');
    setDetectedItems([]);
    setDetectedStudentName('');
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      backgroundColor: '#1e3a8a', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        backgroundColor: '#fbbf24', 
        padding: '12px 24px', 
        borderBottom: '3px solid #78350f' 
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
        minHeight: 0
      }}>
        {/* Left Section - Camera and Controls */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0
        }}>
          {/* Detection Info */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '6px' }}>
              <span style={{ 
                color: 'white', 
                fontWeight: 'bold', 
                fontSize: '15px' 
              }}>
                Student Name:
              </span>
              <span style={{ 
                color: 'white', 
                marginLeft: '8px' 
              }}>
                {detectedStudentName || ''}
              </span>
            </div>
            <div>
              <span style={{ 
                color: 'white', 
                fontWeight: 'bold', 
                fontSize: '15px' 
              }}>
                Detected Items:
              </span>
              {detectedItems.length > 0 && (
                <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                  {detectedItems.map((item, idx) => (
                    <div key={idx} style={{ 
                      color: 'white', 
                      fontSize: '13px' 
                    }}>
                      • {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Camera View */}
          <div style={{ 
            flex: 1, 
            backgroundColor: 'white', 
            border: '3px solid #9ca3af', 
            display: 'flex', 
            flexDirection: 'column',
            minHeight: 0
          }}>
            <div style={{ 
              flex: 1, 
              backgroundColor: '#e5e7eb', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              position: 'relative',
              minHeight: 0
            }}>
              {isRecording ? (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }} 
                  />
                  <div style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    left: '12px', 
                    backgroundColor: '#dc2626', 
                    color: 'white', 
                    padding: '4px 10px', 
                    borderRadius: '4px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontWeight: 'bold', 
                    fontSize: '12px', 
                    border: '2px solid black' 
                  }}>
                    <div style={{ 
                      width: '7px', 
                      height: '7px', 
                      backgroundColor: 'white', 
                      borderRadius: '50%' 
                    }}></div>
                    LIVE
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>📹</div>
                  <div style={{ fontSize: '15px', color: '#6b7280' }}>
                    Click START to begin detection
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control Buttons */}
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
                fontSize: '14px', 
                backgroundColor: isRecording ? '#d1d5db' : 'white', 
                color: isRecording ? '#6b7280' : '#1f2937', 
                cursor: isRecording ? 'not-allowed' : 'pointer',
                borderRadius: '4px'
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
                fontSize: '14px', 
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              RECORDS
            </button>
            <button 
              disabled={!isRecording} 
              style={{ 
                width: '100%', 
                fontWeight: 'bold', 
                padding: '10px', 
                border: '2px solid black', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                fontSize: '14px', 
                backgroundColor: !isRecording ? '#d1d5db' : 'white', 
                color: !isRecording ? '#6b7280' : '#1f2937', 
                cursor: !isRecording ? 'not-allowed' : 'pointer',
                borderRadius: '4px'
              }}
            >
              PAUSE
            </button>
          </div>
        </div>

        {/* Right Section - Form */}
        <div style={{ 
          width: '350px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          minHeight: 0
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '16px', 
            borderRadius: '8px', 
            border: '2px solid #9ca3af',
            flex: 1,
            minHeight: 0,
            overflow: 'auto'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '16px', 
              color: '#1f2937',
              marginTop: 0
            }}>
              Attendance Form
            </h2>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px' 
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  marginBottom: '6px', 
                  color: '#1f2937',
                  fontSize: '13px'
                }}>
                  Course:
                </label>
                <input 
                  type="text" 
                  value={course} 
                  onChange={(e) => setCourse(e.target.value)} 
                  placeholder="Enter course name" 
                  style={{ 
                    width: '100%', 
                    padding: '7px', 
                    border: '2px solid #9ca3af', 
                    borderRadius: '4px', 
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  marginBottom: '6px', 
                  color: '#1f2937',
                  fontSize: '13px'
                }}>
                  Room:
                </label>
                <input 
                  type="text" 
                  value={room} 
                  onChange={(e) => setRoom(e.target.value)} 
                  placeholder="Enter room number" 
                  style={{ 
                    width: '100%', 
                    padding: '7px', 
                    border: '2px solid #9ca3af', 
                    borderRadius: '4px', 
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  marginBottom: '6px', 
                  color: '#1f2937',
                  fontSize: '13px'
                }}>
                  Professor:
                </label>
                <input 
                  type="text" 
                  value={professor} 
                  onChange={(e) => setProfessor(e.target.value)} 
                  placeholder="Enter professor name" 
                  style={{ 
                    width: '100%', 
                    padding: '7px', 
                    border: '2px solid #9ca3af', 
                    borderRadius: '4px', 
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  marginBottom: '6px', 
                  color: '#1f2937',
                  fontSize: '13px'
                }}>
                  Tardy:
                </label>
                <input 
                  type="text" 
                  value={tardy} 
                  onChange={(e) => setTardy(e.target.value)} 
                  placeholder="Enter tardiness (optional)" 
                  style={{ 
                    width: '100%', 
                    padding: '7px', 
                    border: '2px solid #9ca3af', 
                    borderRadius: '4px', 
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={onBack} 
            style={{ 
              width: '100%', 
              backgroundColor: '#6b7280', 
              color: 'white', 
              fontWeight: 'bold', 
              padding: '10px', 
              border: '2px solid black', 
              borderRadius: '4px', 
              fontSize: '14px', 
              cursor: 'pointer' 
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveDetection;