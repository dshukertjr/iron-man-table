import { useState } from 'react'
import HandTracking from './components/HandTracking'
import CameraSelector from './components/CameraSelector'
import './App.css'

function App() {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  const handleCameraSelect = (deviceId: string) => {
    setSelectedCameraId(deviceId)
  }

  if (!selectedCameraId) {
    return <CameraSelector onCameraSelect={handleCameraSelect} />
  }

  return <HandTracking cameraId={selectedCameraId} />
}

export default App