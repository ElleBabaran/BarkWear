import React, { useState, useRef, useEffect } from 'react';

export default function PhotoCapture() {
  const [studentName, setStudentName] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState(1);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
      ctx.drawImage(video, 0, 0);
      
      const photoData = canvas.toDataURL('image/jpeg');
      const newPhotos = [...capturedPhotos];
      newPhotos[currentPhoto - 1] = photoData;
      setCapturedPhotos(newPhotos);
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

  return (
    <div className="min-h-screen bg-blue-900 p-6 flex gap-6">
      {/* Left Section - Camera */}
      <div className="flex-1 flex flex-col">
        <button className="bg-yellow-500 text-black font-bold px-12 py-3 rounded mb-6 hover:bg-yellow-400 self-start text-2xl">
          Back
        </button>

        <div className="bg-white rounded-lg p-6 flex-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full border-2 border-black">
              <div className="w-3 h-3 bg-white rounded-full"></div>
              <span className="font-bold text-lg">LIVE</span>
            </div>
          </div>

          <div className="relative bg-gray-100 rounded border-4 border-gray-400" style={{ aspectRatio: '4/3', minHeight: '400px' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full h-full object-cover rounded"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {capturedPhotos[currentPhoto - 1] && (
              <img 
                src={capturedPhotos[currentPhoto - 1]} 
                alt="Captured" 
                className="absolute inset-0 w-full h-full object-cover rounded"
              />
            )}

            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-4xl font-bold text-black">
              {currentPhoto}/3
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-3">
              {[1, 2, 3].map(num => (
                <div 
                  key={num}
                  className={`w-16 h-16 rounded ${
                    capturedPhotos[num - 1] ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button 
              onClick={capturePhoto}
              className="bg-yellow-500 text-black font-bold px-12 py-4 rounded hover:bg-yellow-400 text-xl"
            >
              Capture
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6 bg-blue-900">
          <label className="text-3xl font-bold text-white">Name:</label>
          <input 
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="flex-1 border-2 border-gray-300 rounded px-6 py-3 text-xl max-w-md"
            placeholder=""
          />
          <button 
            onClick={handleSubmit}
            className="bg-white border-2 border-black px-12 py-3 rounded-full font-bold hover:bg-gray-100 text-xl"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Right Section - Instructions */}
      <div className="bg-white rounded-lg p-8 flex flex-col" style={{ width: '400px' }}>
        <h1 className="text-6xl font-bold text-yellow-500 mb-8">Instruction</h1>
        
        <div className="space-y-6 text-lg flex-1">
          <div className="flex gap-3">
            <span className="font-bold">•</span>
            <span className="font-bold">Enter student's name</span>
          </div>
          
          <div className="flex gap-3">
            <span className="font-bold">•</span>
            <span className="font-bold">
              Stand correctly in front of the camera, then press the Capture button to take your photo. Ensure the image is clear before proceeding by clicking Next.
            </span>
          </div>
        </div>

        <button 
          onClick={handleNext}
          disabled={currentPhoto === 3 && capturedPhotos.length < 3}
          className="bg-yellow-500 text-black font-bold px-12 py-4 rounded mt-8 w-full hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed text-2xl"
        >
          Next
        </button>
      </div>
    </div>
  );
}