import React, { useState, useRef, useEffect } from 'react';

interface PhotoCaptureProps {
  onBack?: () => void;
}

export default function PhotoCapture({ onBack }: PhotoCaptureProps) {
  const [studentName, setStudentName] = useState<string>('');
  const [currentPhoto, setCurrentPhoto] = useState<number>(1);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    } else if (studentName && capturedPhotos.length === 3) {
      alert(`Photos submitted for ${studentName}`);
    }
  };

  const handleSubmit = () => {
    if (studentName) {
      alert(`Name submitted: ${studentName}`);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

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
      {/* Left Section - Camera */}
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

          {/* Video */}
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
            {/* GREEN INDICATOR DOTS */}
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

        {/* Name Input */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          backgroundColor: '#1e3a8a',
          height: '38px',
          flexShrink: 0
        }}>
          <label style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: 'white',
            whiteSpace: 'nowrap'
          }}>
            Name:
          </label>
          <input 
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            style={{ 
              border: '2px solid #d1d5db', 
              borderRadius: '4px', 
              padding: '6px 10px', 
              fontSize: '13px', 
              width: '220px',
              height: '38px',
              boxSizing: 'border-box'
            }}
            placeholder=""
          />
          <button 
            onClick={handleSubmit}
            style={{ 
              backgroundColor: 'white', 
              border: '2px solid black', 
              padding: '6px 22px', 
              borderRadius: '19px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              height: '38px',
              boxSizing: 'border-box'
            }}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Right Section - Instructions */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '4px', 
        padding: '12px', 
        display: 'flex', 
        flexDirection: 'column',
        width: '240px',
        minHeight: 0,
        flexShrink: 0
      }}>
        <div style={{ flex: '0 0 auto' }}>
          <h1 style={{ 
            fontSize: '22px', 
            fontWeight: 'bold', 
            color: '#fbbf24', 
            margin: '0 0 10px 0',
            fontFamily: 'Arial, sans-serif'
          }}>
            Instruction
          </h1>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '28px',
            lineHeight: '1.3',
            fontFamily: 'Arial, sans-serif'
          }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ fontWeight: 'bold' }}>•</span>
              <span style={{ fontWeight: 'bold' }}>Enter student's name</span>
            </div>
            
            <div style={{ display: 'flex', gap: '5px' }}>
              <span style={{ fontWeight: 'bold' }}>•</span>
              <span style={{ fontWeight: 'bold' }}>
                Stand in front of camera, press Capture, ensure image is clear before Next.
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleNext}
          disabled={currentPhoto === 3 && capturedPhotos.length < 3}
          style={{ 
            backgroundColor: (currentPhoto === 3 && capturedPhotos.length < 3) ? '#d1d5db' : '#fbbf24',
            color: 'black', 
            fontWeight: 'bold', 
            padding: '10px 20px', 
            borderRadius: '4px', 
            marginTop: 'auto',
            width: '100%',
            border: 'none',
            cursor: (currentPhoto === 3 && capturedPhotos.length < 3) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            height: '40px',
            flexShrink: 0
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}