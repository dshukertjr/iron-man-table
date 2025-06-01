import React, { useRef, useEffect, useState } from 'react';
import { Hands, Results, NormalizedLandmark } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
import { useSupabaseTables } from '../hooks/useSupabaseTables';

interface HandTrackingProps {
  cameraId: string;
}

interface TableObject {
  id: string;
  name: string;
  x: number;
  y: number;
  isDragging: boolean;
}

const HandTracking: React.FC<HandTrackingProps> = ({ cameraId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { tables: availableTables, loading: tablesLoading } = useSupabaseTables();
  
  // Use refs for mutable state to avoid re-renders during drag
  const tablesRef = useRef<TableObject[]>([]);
  const draggedTableRef = useRef<string | null>(null);
  const tablesInitialized = useRef(false);
  
  const pinchStateRef = useRef<{
    isPinching: boolean;
    x: number;
    y: number;
  }>({ isPinching: false, x: 0, y: 0 });
  
  const handResultsRef = useRef<Results | null>(null);

  // Initialize tables when available
  useEffect(() => {
    if (!tablesLoading && !tablesInitialized.current) {
      const displayTables = availableTables.length > 0 ? availableTables : ['users', 'posts', 'comments', 'products'];
      
      // Create table objects aligned at the top
      const tableObjects: TableObject[] = displayTables.map((tableName, index) => ({
        id: `${tableName}-${Date.now()}-${index}`,
        name: tableName,
        x: 0.1 + (index * 0.15), // Space tables horizontally
        y: 0.1, // Align at top
        isDragging: false
      }));
      
      tablesRef.current = tableObjects;
      tablesInitialized.current = true;
    }
  }, [availableTables, tablesLoading]);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    let animationId: number;
    let renderAnimationId: number;
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        // First, get the camera stream with the selected device
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: cameraId },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready
          await new Promise((resolve) => {
            videoRef.current!.onloadedmetadata = () => {
              videoRef.current!.play();
              resolve(true);
            };
          });
        }

        // Initialize MediaPipe hands
        const hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: Results) => {
          handResultsRef.current = results;
          setIsLoading(false);
        });

        // Separate render loop for smooth animation
        const renderLoop = () => {
          if (!canvasRef.current || !videoRef.current) return;

          const canvasCtx = canvasRef.current.getContext('2d');
          if (!canvasCtx) return;

          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;

          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          // Draw table objects
          const currentTables = tablesRef.current;
          currentTables.forEach(table => {
            const tableX = table.x * canvasRef.current.width;
            const tableY = table.y * canvasRef.current.height;
            const size = 60;
            
            // Draw table background
            canvasCtx.fillStyle = table.isDragging ? '#10B981' : '#3B82F6';
            canvasCtx.fillRect(tableX - size/2, tableY - size/2, size, size);
            
            // Draw table icon
            canvasCtx.strokeStyle = 'white';
            canvasCtx.lineWidth = 2;
            
            // Table grid lines
            const padding = 10;
            const innerSize = size - padding * 2;
            const x = tableX - size/2 + padding;
            const y = tableY - size/2 + padding;
            
            // Horizontal lines
            canvasCtx.beginPath();
            canvasCtx.moveTo(x, y + innerSize/3);
            canvasCtx.lineTo(x + innerSize, y + innerSize/3);
            canvasCtx.moveTo(x, y + 2*innerSize/3);
            canvasCtx.lineTo(x + innerSize, y + 2*innerSize/3);
            
            // Vertical lines
            canvasCtx.moveTo(x + innerSize/3, y);
            canvasCtx.lineTo(x + innerSize/3, y + innerSize);
            canvasCtx.moveTo(x + 2*innerSize/3, y);
            canvasCtx.lineTo(x + 2*innerSize/3, y + innerSize);
            
            // Border
            canvasCtx.rect(x, y, innerSize, innerSize);
            canvasCtx.stroke();
            
            // Table name
            canvasCtx.fillStyle = 'white';
            canvasCtx.font = '12px sans-serif';
            canvasCtx.textAlign = 'center';
            canvasCtx.fillText(table.name, tableX, tableY + size/2 + 15);
          });

          // Process hand landmarks if available
          const results = handResultsRef.current;
          if (results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
              const landmarks = results.multiHandLandmarks[i];
              
              // Draw hand skeleton
              drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 5,
              });
              drawLandmarks(canvasCtx, landmarks, { 
                color: '#FF0000', 
                lineWidth: 2,
                radius: 5,
              });

              // Detect pinch gesture (thumb tip and index finger tip)
              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];
              
              // Calculate distance between thumb and index finger
              const distance = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) + 
                Math.pow(thumbTip.y - indexTip.y, 2)
              );
              
              // Pinch threshold (adjust as needed)
              const pinchThreshold = 0.05;
              const isPinching = distance < pinchThreshold;
              const pinchState = pinchStateRef.current;
              
              if (isPinching) {
                // Calculate pinch center
                const pinchX = (thumbTip.x + indexTip.x) / 2;
                const pinchY = (thumbTip.y + indexTip.y) / 2;
                
                if (!pinchState.isPinching) {
                  // Start pinching - check if near any table
                  const tableSize = 60 / Math.min(canvasRef.current.width, canvasRef.current.height);
                  
                  for (const table of currentTables) {
                    const distToTable = Math.sqrt(
                      Math.pow(pinchX - table.x, 2) + 
                      Math.pow(pinchY - table.y, 2)
                    );
                    
                    if (distToTable < tableSize) {
                      // Start dragging this table
                      draggedTableRef.current = table.id;
                      table.isDragging = true;
                      break;
                    }
                  }
                  
                  pinchStateRef.current = { isPinching: true, x: pinchX, y: pinchY };
                } else {
                  // Continue pinching - update dragged table position
                  if (draggedTableRef.current) {
                    const deltaX = pinchX - pinchState.x;
                    const deltaY = pinchY - pinchState.y;
                    
                    const draggedTable = currentTables.find(t => t.id === draggedTableRef.current);
                    if (draggedTable) {
                      draggedTable.x = Math.max(0.05, Math.min(0.95, draggedTable.x + deltaX));
                      draggedTable.y = Math.max(0.05, Math.min(0.95, draggedTable.y + deltaY));
                    }
                  }
                  
                  pinchStateRef.current = { isPinching: true, x: pinchX, y: pinchY };
                }
                
                // Draw pinch indicator
                canvasCtx.fillStyle = 'rgba(16, 185, 129, 0.5)';
                canvasCtx.beginPath();
                canvasCtx.arc(
                  pinchX * canvasRef.current.width, 
                  pinchY * canvasRef.current.height, 
                  20, 0, 2 * Math.PI
                );
                canvasCtx.fill();
              } else if (pinchState.isPinching) {
                // Release pinch
                if (draggedTableRef.current) {
                  const draggedTable = currentTables.find(t => t.id === draggedTableRef.current);
                  if (draggedTable) {
                    draggedTable.isDragging = false;
                  }
                  draggedTableRef.current = null;
                }
                pinchStateRef.current = { isPinching: false, x: 0, y: 0 };
              }
            }
          } else if (pinchStateRef.current.isPinching) {
            // No hands detected, release pinch
            if (draggedTableRef.current) {
              const draggedTable = currentTables.find(t => t.id === draggedTableRef.current);
              if (draggedTable) {
                draggedTable.isDragging = false;
              }
              draggedTableRef.current = null;
            }
            pinchStateRef.current = { isPinching: false, x: 0, y: 0 };
          }

          canvasCtx.restore();
          renderAnimationId = requestAnimationFrame(renderLoop);
        };

        renderLoop();

        // Manual frame processing instead of using Camera utility
        const processFrame = async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            await hands.send({ image: videoRef.current });
          }
          animationId = requestAnimationFrame(processFrame);
        };

        processFrame();

      } catch (error) {
        console.error('Error starting camera:', error);
        setIsLoading(false);
      }
    };

    setupCamera();

    return () => {
      // Cancel animation frames
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderAnimationId) {
        cancelAnimationFrame(renderAnimationId);
      }
      
      // Stop all video tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraId]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-2xl font-semibold">Loading hand tracking...</div>
        </div>
      )}
    </div>
  );
};

export default HandTracking;