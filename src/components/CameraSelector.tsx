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
        <div className="text-white text-xl">Detecting cameras...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="bg-red-900 border border-red-700 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">Camera Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Hand Tracking Setup</h1>
        
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-3">
            Select Camera
          </label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label}
              </option>
            ))}
          </select>
          <p className="text-gray-400 text-sm mt-2">
            {cameras.length} camera{cameras.length !== 1 ? 's' : ''} detected
          </p>
        </div>

        <button
          onClick={handleStartTracking}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
        >
          Start Hand Tracking
        </button>
      </div>
    </div>
  );
};

export default CameraSelector;