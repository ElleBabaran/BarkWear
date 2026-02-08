import React, { useState, useRef, useEffect } from "react";
import { Camera } from "lucide-react";

interface LiveDetectionProps {
  onBack?: () => void;
}

interface Detection {
  class: string;
  confidence: number;
  bbox: number[];
}

const LiveDetection: React.FC<LiveDetectionProps> = ({ onBack = () => {} }) => {
  const [detectedStudentName, setDetectedStudentName] = useState('');
  const [detectedItems, setDetectedItems] = useState<string[]>([]);
  const [uniformStatus, setUniformStatus] = useState('');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [course, setCourse] = useState('');
  const [room, setRoom] = useState('');
  const [professor, setProfessor] = useState('');
  const [tardy, setTardy] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = 'http://localhost:5000/detect';

  const addLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-10));
  };

  const startCamera = async () => {
    try {
      setErrorMessage('');
      addLog('🎥 Requesting camera access...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };

      addLog('📋 Camera constraints: ' + JSON.stringify(constraints));
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      addLog('✅ Camera stream obtained!');
      addLog('📹 Stream active: ' + mediaStream.active);
      addLog('🎬 Video tracks: ' + mediaStream.getVideoTracks().length);
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        addLog('📺 Setting video source...');
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = async () => {
          addLog('📊 Video metadata loaded');
          try {
            await videoRef.current!.play();
            addLog('▶️ Video playing');
            
            setTimeout(() => {
              setDetectedStudentName('Juan Dela Cruz');
              addLog('👤 Student detected: Juan Dela Cruz');
            }, 2000);
          } catch (playError) {
            addLog('❌ Play error: ' + playError);
          }
        };

        videoRef.current.onerror = (e) => {
          addLog('❌ Video error: ' + e);
        };
      } else {
        addLog('⚠️ Video ref is null');
      }
    } catch (err: any) {
      addLog('❌ Camera error: ' + err.name + ' - ' + err.message);
      
      let errorMsg = 'Camera Error: ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg += 'Camera permission denied. Please allow camera access and refresh the page.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg += 'No camera found. Please connect a camera.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg += 'Camera is busy. Please close other apps using the camera.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg += 'Camera constraints not supported. Trying basic mode...';
        tryBasicCamera();
        return;
      } else if (err.name === 'TypeError') {
        errorMsg += 'getUserMedia not supported. Please use a modern browser (Chrome, Firefox, Edge).';
      } else {
        errorMsg += err.message || 'Unknown error';
      }
      
      setErrorMessage(errorMsg);
      alert(errorMsg);
    }
  };

  const tryBasicCamera = async () => {
    try {
      addLog('🔄 Trying basic camera mode...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      
      addLog('✅ Basic camera stream obtained!');
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        addLog('▶️ Basic video playing');
      }
    } catch (err: any) {
      addLog('❌ Basic camera also failed: ' + err.message);
      setErrorMessage('Cannot access camera: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        addLog('🛑 Stopped track: ' + track.kind);
      });
      setStream(null);
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    addLog('🛑 Camera fully stopped');
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      addLog('⚠️ Cannot capture: video or canvas ref missing');
      return null;
    }
    
    const video = videoRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      addLog('⚠️ Video not ready for capture');
      return null;
    }
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      addLog('⚠️ Cannot get canvas context');
      return null;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const drawBoundingBoxes = (detections: Detection[]) => {
  console.log('🎨 drawBoundingBoxes called with', detections.length, 'detections');
  
  const video = videoRef.current;
  const canvas = overlayCanvasRef.current;
  
  if (!video) {
    console.error('❌ No video ref');
    return;
  }
  
  if (!canvas) {
    console.error('❌ No canvas ref');
    return;
  }
  
  console.log('📺 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
  console.log('🖼️ Canvas dimensions:', canvas.width, 'x', canvas.height);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('❌ Cannot get canvas context');
    return;
  }
  
  // Ensure canvas matches video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  console.log('🧹 Canvas cleared');
  
  detections.forEach((det, index) => {
    const [x1, y1, x2, y2] = det.bbox;
    const width = x2 - x1;
    const height = y2 - y1;
    
    console.log(`   Box ${index + 1}:`, {
      class: det.class,
      confidence: det.confidence,
      bbox: [x1, y1, x2, y2],
      size: [width, height]
    });
    
    // Different colors for different items
    const colors: { [key: string]: string } = {
      'id_card': '#ff0000',      // Red
      'blue_polo': '#00ff00',    // Green
      'black_pants': '#0000ff',  // Blue
      'id': '#ff0000',
      'polo': '#00ff00',
      'pants': '#0000ff',
      'shoes': '#ffff00'
    };
    const color = colors[det.class.toLowerCase()] || '#4ade80';
    
    // Draw THICK bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;  // Thick line
    ctx.strokeRect(x1, y1, width, height);
    
    // Draw semi-transparent fill
    ctx.fillStyle = color + '40';
    ctx.fillRect(x1, y1, width, height);
    
    // Draw label
    const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
    ctx.font = 'bold 20px Arial';
    const textMetrics = ctx.measureText(label);
    
    ctx.fillStyle = color;
    ctx.fillRect(x1, y1 - 28, textMetrics.width + 10, 28);
    
    ctx.fillStyle = '#000000';
    ctx.fillText(label, x1 + 5, y1 - 8);
    
    console.log(`   ✅ Drew box ${index + 1}`);
  });
  
  console.log('✅ Finished drawing all boxes');
  addLog(`✅ Drew ${detections.length} boxes`);
};

  const runDetection = async () => {
    if (isPaused || !isRecording) {
      console.log('⏸️ Skipping detection - paused or not recording');
      return;
    }
    
    console.log('🚀 runDetection() called');
    addLog('🔍 Starting detection...');
    
    setIsDetecting(true);
    
    try {
      // Step 1: Capture frame
      console.log('📸 Capturing frame...');
      const imageData = captureFrame();
      
      if (!imageData) {
        console.error('❌ No image data captured');
        addLog('❌ No image data');
        setIsDetecting(false);
        return;
      }
      
      console.log('✅ Frame captured, length:', imageData.length);
      addLog(`📤 Sending ${(imageData.length / 1024).toFixed(0)}KB to backend...`);
      
      // Step 2: Send to backend
      console.log('🌐 Fetching:', API_URL);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
        signal: AbortSignal.timeout(10000)  // Increased timeout to 10s
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Step 3: Parse response
      const result = await response.json();
      console.log('📦 Result:', result);
      
      addLog(`📥 Response: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success) {
        console.log('✅ Detections:', result.detections);
        addLog(`🎯 Found ${result.detections.length} items`);
        
        if (result.detections.length > 0) {
          const items = result.detections.map((det: Detection) => 
            `${det.class} (${(det.confidence * 100).toFixed(0)}%)`
          );
          console.log('📋 Items:', items);
          addLog(`📋 Items: ${items.join(', ')}`);
          setDetectedItems(items);
        } else {
          console.warn('⚠️ No detections in response');
          addLog('⚠️ No items detected');
          setDetectedItems(['No items detected']);
        }
        
        setUniformStatus(result.uniform_status);
        setDetections(result.detections);
        
        // Step 4: Draw boxes
        if (result.detections.length > 0) {
          console.log('🎨 Drawing bounding boxes...');
          addLog('🎨 Drawing boxes...');
          drawBoundingBoxes(result.detections);
        }
        
      } else {
        console.error('❌ Backend returned error:', result.error);
        addLog('❌ Error: ' + result.error);
        setDetectedItems(['Error: ' + result.error]);
      }
      
    } catch (error: any) {
      console.error('🔥 EXCEPTION in runDetection:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.name === 'AbortError') {
        console.error('⏱️ Request timed out after 10 seconds');
        addLog('⏱️ Request timeout');
        setDetectedItems(['⏱️ Timeout']);
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🌐 Network error - cannot reach backend');
        addLog('🌐 Cannot reach backend');
        setDetectedItems(['🌐 Backend offline']);
      } else {
        addLog('❌ Error: ' + error.message);
        setDetectedItems(['❌ ' + error.message]);
      }
      
    } finally {
      setIsDetecting(false);
      console.log('✅ runDetection() completed');
    }
  };

  const handleStart = async () => {
    if (isRecording) {
      addLog('⚠️ Already recording');
      return;
    }
    
    addLog('🎬 START button clicked');
    setErrorMessage('');
    setIsRecording(true);
    setIsPaused(false);
    
    await startCamera();
    
    setTimeout(() => {
      addLog('🔁 Starting detection loop...');
      
      // Function to run detection without checking state
      const doDetection = async () => {
        console.log('🚀 RUNNING DETECTION');
        
        try {
          const imageData = captureFrame();
          
          if (!imageData) {
            console.error('❌ No image data captured');
            return;
          }
          
          console.log('✅ Frame captured, length:', imageData.length);
          addLog(`📤 Sending to backend...`);
          
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData }),
            signal: AbortSignal.timeout(10000)
          });
          
          console.log('📥 Response status:', response.status);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const result = await response.json();
          console.log('📦 Result:', result);
          
          if (result.success) {
            addLog(`🎯 Found ${result.detections.length} items`);
            
            if (result.detections.length > 0) {
              const items = result.detections.map((det: Detection) => 
                `${det.class} (${(det.confidence * 100).toFixed(0)}%)`
              );
              console.log('📋 Items:', items);
              setDetectedItems(items);
              setUniformStatus(result.uniform_status);
              setDetections(result.detections);
              
              console.log('🎨 Drawing bounding boxes...');
              drawBoundingBoxes(result.detections);
            } else {
              setDetectedItems(['No items detected']);
            }
          }
          
        } catch (error: any) {
          console.error('🔥 ERROR:', error);
          addLog('❌ Error: ' + error.message);
        }
      };
      
      // Run first detection immediately
      doDetection();
      
      // Then start interval (500ms = 0.5 seconds, faster detection)
      detectionIntervalRef.current = setInterval(doDetection, 500);
      
    }, 3000);
  };
  const handleStop = () => {
    addLog('🛑 STOP button clicked');
    
    // Clear interval first
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    stopCamera();
    setIsRecording(false);
    setIsPaused(false);
    setDetections([]);
    setDetectedItems([]);
    setUniformStatus('');
    
    // Clear canvas
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
    }
  };

  const handlePause = () => {
    const newPauseState = !isPaused;
    setIsPaused(newPauseState);
    
    if (videoRef.current) {
      if (newPauseState) {
        videoRef.current.pause();
        addLog('⏸️ Paused');
      } else {
        videoRef.current.play();
        addLog('▶️ Resumed');
      }
    }
  };

  const handleRecords = () => {
    if (!course || !room || !professor) {
      alert('Please fill in Course, Room, and Professor');
      return;
    }
    
    const recordData = {
      studentName: detectedStudentName || 'Unknown',
      course,
      room,
      professor,
      tardy: tardy || '0',
      uniformStatus,
      detectedItems,
      timestamp: new Date().toISOString()
    };
    
    addLog('📝 Record saved: ' + detectedStudentName);
    console.log('Full record:', recordData);
    alert(`✅ Record Saved!\n\nStudent: ${detectedStudentName}\nStatus: ${uniformStatus}\nItems: ${detectedItems.join(', ')}`);
    
    setCourse('');
    setRoom('');
    setProfessor('');
    setTardy('');
  };

  useEffect(() => {
    addLog('🚀 Component mounted');
    
    return () => {
      addLog('🔚 Component unmounting');
      stopCamera();
    };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1e3a8a',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{
        backgroundColor: '#fbbf24',
        padding: '16px 24px',
        borderBottom: '3px solid #78350f'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#78350f',
          margin: 0
        }}>
          Uniform Detection System
        </h1>
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        padding: '24px',
        gap: '24px',
        overflow: 'hidden',
        alignItems: 'flex-start'
      }}>
        {/* Left Panel - Status and Debug */}
        <div style={{ 
          width: '350px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Status */}
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#fbbf24',
              borderBottom: '2px solid #fbbf24',
              paddingBottom: '8px'
            }}>
              Detection Status
            </h2>
            <div style={{ marginBottom: '12px', fontSize: '15px', color: 'white' }}>
              <strong>Student:</strong> 
              <div style={{ 
                marginTop: '4px',
                padding: '8px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '6px',
                color: detectedStudentName ? '#fbbf24' : '#94a3b8',
                fontWeight: 'bold'
              }}>
                {detectedStudentName || 'Waiting for detection...'}
              </div>
            </div>
            {uniformStatus && (
              <div style={{ marginBottom: '12px', fontSize: '15px' }}>
                <strong style={{ color: 'white' }}>Uniform Status:</strong>
                <div style={{ 
                  marginTop: '4px',
                  padding: '8px',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  color: uniformStatus === 'Compliant' ? '#4ade80' : '#f87171',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {uniformStatus}
                </div>
              </div>
            )}
            <div style={{ fontSize: '14px', color: 'white' }}>
              <strong>Detected Items:</strong>
              <div style={{ 
                marginTop: '6px',
                padding: '10px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '6px',
                minHeight: '40px',
                fontSize: '13px',
                color: '#e5e7eb'
              }}>
                {detectedItems.length > 0 ? detectedItems.join(', ') : 'No items detected'}
              </div>
            </div>
            {errorMessage && (
              <div style={{ 
                color: '#fca5a5', 
                fontSize: '13px', 
                marginTop: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #fca5a5'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}
          </div>

          {/* Debug Log */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            borderRadius: '12px',
            padding: '16px',
            flex: 1,
            minHeight: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
            fontSize: '11px',
            color: '#94a3b8',
            fontFamily: 'monospace',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
          }}>
            <div style={{ color: '#fbbf24', marginBottom: '8px', fontWeight: 'bold', fontSize: '12px' }}>
              📊 System Log
            </div>
            {debugLog.map((log, i) => (
              <div key={i} style={{ marginBottom: '3px', lineHeight: '1.4' }}>{log}</div>
            ))}
          </div>

          <button
            onClick={onBack}
            style={{
              backgroundColor: '#fbbf24',
              color: '#78350f',
              fontWeight: 'bold',
              padding: '14px',
              fontSize: '15px',
              border: '3px solid #78350f',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ← Back to Menu
          </button>
        </div>

        {/* Center - Camera Feed */}
        <div style={{
          flex: 1,
          maxWidth: '700px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0'
        }}>
          <div style={{
            backgroundColor: '#000',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden',
            height: '525px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '4px solid #fbbf24',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
          }}>
            {isRecording ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000'
                  }}
                />
                <canvas
                  ref={overlayCanvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none'
                  }}
                />
                
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: isPaused ? '#f59e0b' : '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    animation: isPaused ? 'none' : 'pulse 1.5s ease-in-out infinite'
                  }} />
                  {isPaused ? 'PAUSED' : 'LIVE'}
                </div>
                
                {isDetecting && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: '#fbbf24',
                    color: '#000',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}>
                    🔍 ANALYZING...
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Camera size={80} color="#94a3b8" />
                <p style={{ color: '#94a3b8', marginTop: '20px', fontSize: '18px', fontWeight: '500' }}>
                  Camera Ready
                </p>
                <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
                  Click START to begin detection
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Form and Controls */}
        <div style={{
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: '#1e3a8a',
              borderBottom: '2px solid #fbbf24',
              paddingBottom: '6px'
            }}>
              Session Details
            </h2>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', color: '#374151' }}>Course</label>
              <select value={course} onChange={(e) => setCourse(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '2px solid #d1d5db', fontSize: '14px', fontWeight: '500' }}>
                <option value="">Select Course</option>
                <option value="BSIT">BSIT</option>
                <option value="BSCS">BSCS</option>
                <option value="BSIS">BSIS</option>
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', color: '#374151' }}>Room</label>
              <select value={room} onChange={(e) => setRoom(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '2px solid #d1d5db', fontSize: '14px', fontWeight: '500' }}>
                <option value="">Select Room</option>
                <option value="Room 101">Room 101</option>
                <option value="Room 102">Room 102</option>
                <option value="Room 201">Room 201</option>
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', color: '#374151' }}>Professor</label>
              <select value={professor} onChange={(e) => setProfessor(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '2px solid #d1d5db', fontSize: '14px', fontWeight: '500' }}>
                <option value="">Select Professor</option>
                <option value="Prof. Smith">Prof. Smith</option>
                <option value="Prof. Johnson">Prof. Johnson</option>
                <option value="Prof. Williams">Prof. Williams</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase', color: '#374151' }}>Tardy Threshold</label>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select 
                  value={tardy} 
                  onChange={(e) => setTardy(e.target.value)} 
                  style={{ 
                    flex: 1, 
                    padding: '7px', 
                    borderRadius: '6px', 
                    border: '2px solid #d1d5db', 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  <option value="">Select Time</option>
                  <option value="0">Exact Class Time</option>
                  <option value="5">5 minutes late</option>
                  <option value="10">10 minutes late</option>
                  <option value="15">15 minutes late</option>
                  <option value="20">20 minutes late</option>
                  <option value="30">30 minutes late</option>
                  <option value="custom">Custom...</option>
                </select>
                <button
                  onClick={() => {
                    if (!tardy) {
                      alert('Please select a tardy threshold');
                      return;
                    }
                    if (tardy === 'custom') {
                      const customTime = prompt('Enter custom tardy time (in minutes):');
                      if (customTime && !isNaN(Number(customTime))) {
                        setTardy(customTime);
                        alert(`Tardy threshold set to ${customTime} minutes`);
                      }
                    } else {
                      const timeText = tardy === '0' ? 'Exact Class Time' : `${tardy} minutes late`;
                      alert(`✓ Tardy threshold saved: ${timeText}`);
                    }
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(59,130,246,0.3)'
                  }}
                >
                  SET
                </button>
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                {tardy && tardy !== 'custom' ? `Late after ${tardy === '0' ? 'class start' : tardy + ' min'}` : 'Set tardiness rule'}
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              margin: '0 0 10px 0', 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: '#1e3a8a'
            }}>
              Controls
            </h2>

            <button
              onClick={handleStart}
              disabled={isRecording}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '15px',
                backgroundColor: isRecording ? '#9ca3af' : '#10b981',
                color: '#fff',
                border: 'none',
                cursor: isRecording ? 'not-allowed' : 'pointer',
                marginBottom: '8px',
                boxShadow: isRecording ? 'none' : '0 2px 4px rgba(16,185,129,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {isRecording ? '✓ STARTED' : '▶ START DETECTION'}
            </button>

            <button
              onClick={handleStop}
              disabled={!isRecording}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '15px',
                backgroundColor: !isRecording ? '#9ca3af' : '#ef4444',
                color: '#fff',
                border: 'none',
                cursor: !isRecording ? 'not-allowed' : 'pointer',
                marginBottom: '8px',
                boxShadow: !isRecording ? 'none' : '0 2px 4px rgba(239,68,68,0.3)',
                transition: 'all 0.2s'
              }}
            >
              ⏹ STOP
            </button>

            <button
              onClick={handlePause}
              disabled={!isRecording}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '15px',
                backgroundColor: !isRecording ? '#9ca3af' : '#fbbf24',
                color: '#000',
                border: 'none',
                cursor: !isRecording ? 'not-allowed' : 'pointer',
                boxShadow: !isRecording ? 'none' : '0 2px 4px rgba(251,191,36,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
          </div>

          <button
            onClick={handleRecords}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              backgroundColor: '#1e3a8a',
              color: '#fbbf24',
              border: '3px solid #fbbf24',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#fbbf24';
              e.currentTarget.style.color = '#1e3a8a';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#1e3a8a';
              e.currentTarget.style.color = '#fbbf24';
            }}
          >
            💾 SAVE RECORD
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default LiveDetection;