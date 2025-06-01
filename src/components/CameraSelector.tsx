import React, { useEffect, useState } from 'react';

interface CameraSelectorProps {
  onCameraSelect: (deviceId: string) => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

const CameraSelector: React.FC<CameraSelectorProps> = ({ onCameraSelect }) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const getCameras = async () => {
      try {
        // Request camera permissions first
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Get all media devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${index + 1}`
          }));

        if (videoDevices.length === 0) {
          setError('No cameras found on this device');
        } else {
          setCameras(videoDevices);
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error accessing cameras:', err);
        setError('Unable to access cameras. Please ensure you have granted camera permissions.');
      } finally {
        setLoading(false);
      }
    };

    getCameras();
  }, []);

  const handleStartTracking = () => {
    if (selectedCamera) {
      onCameraSelect(selectedCamera);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-cyan-400 font-mono text-xl tracking-wider">SCANNING DEVICES...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500 opacity-20 blur-xl"></div>
          <div className="relative bg-black border-2 border-red-500 text-white p-8 max-w-md shadow-2xl shadow-red-500/50">
            <div className="flex items-center mb-4">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <h2 className="text-xl font-mono font-bold text-red-400">SYSTEM ERROR</h2>
            </div>
            <p className="font-mono text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(to right, cyan 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-cyan-500 opacity-20 blur-3xl"></div>
        
        <div className="relative bg-black border-2 border-cyan-500 p-8 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/50">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
          
          <h1 className="text-3xl font-mono font-bold text-cyan-400 mb-8 text-center tracking-wider">
            NEURAL INTERFACE
          </h1>
          
          <div className="mb-8">
            <label className="block text-cyan-300 text-sm font-mono mb-3 tracking-wider">
              INPUT DEVICE
            </label>
            <div className="relative">
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full bg-black border-2 border-cyan-700 text-cyan-100 px-4 py-3 font-mono focus:outline-none focus:border-cyan-400 transition-colors appearance-none"
              >
                {cameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex items-center mt-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
              <p className="text-green-400 text-sm font-mono">
                {cameras.length} DEVICE{cameras.length !== 1 ? 'S' : ''} ONLINE
              </p>
            </div>
          </div>

          <button
            onClick={handleStartTracking}
            className="w-full relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-cyan-900 border-2 border-cyan-500 text-cyan-100 font-mono font-bold py-4 px-6 tracking-wider group-hover:bg-transparent transition-colors">
              INITIALIZE TRACKING
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraSelector;