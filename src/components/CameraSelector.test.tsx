import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CameraSelector from './CameraSelector';
import userEvent from '@testing-library/user-event';

// Mock MediaDevices API
const mockGetUserMedia = vi.fn();
const mockEnumerateDevices = vi.fn();

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices,
  },
});

describe('CameraSelector', () => {
  const mockOnCameraSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockGetUserMedia.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
    
    expect(screen.getByText('SCANNING DEVICES...')).toBeInTheDocument();
    expect(screen.queryByText('NEURAL INTERFACE')).not.toBeInTheDocument();
  });

  it('shows error when camera permissions are denied', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));
    
    render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('SYSTEM ERROR')).toBeInTheDocument();
      expect(screen.getByText('Unable to access cameras. Please ensure you have granted camera permissions.')).toBeInTheDocument();
    });
  });

  it('shows error when no cameras are found', async () => {
    mockGetUserMedia.mockResolvedValue({});
    mockEnumerateDevices.mockResolvedValue([]);
    
    render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('SYSTEM ERROR')).toBeInTheDocument();
      expect(screen.getByText('No cameras found on this device')).toBeInTheDocument();
    });
  });

  it('displays available cameras when found', async () => {
    const mockDevices = [
      { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' },
      { kind: 'videoinput', deviceId: 'camera2', label: 'Back Camera' },
      { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone' }, // Should be filtered out
    ];

    mockGetUserMedia.mockResolvedValue({});
    mockEnumerateDevices.mockResolvedValue(mockDevices);
    
    render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('NEURAL INTERFACE')).toBeInTheDocument();
      expect(screen.getByText('INPUT DEVICE')).toBeInTheDocument();
      expect(screen.getByText('2 DEVICES ONLINE')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('camera1');
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent('Front Camera');
    expect(options[1]).toHaveTextContent('Back Camera');
  });

  it('uses default labels when camera labels are not available', async () => {
    const mockDevices = [
      { kind: 'videoinput', deviceId: 'camera1', label: '' },
      { kind: 'videoinput', deviceId: 'camera2', label: '' },
    ];

    mockGetUserMedia.mockResolvedValue({});
    mockEnumerateDevices.mockResolvedValue(mockDevices);
    
    render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
    
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveTextContent('Camera 1');
      expect(options[1]).toHaveTextContent('Camera 2');
    });
  });

  it('handles camera selection change', async () => {
    const mockDevices = [
      { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' },
      { kind: 'videoinput', deviceId: 'camera2', label: 'Back Camera' },
    ];

    mockGetUserMedia.mockResolvedValue({});
    mockEnumerateDevices.mockResolvedValue(mockDevices);
    
    render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'camera2' } });
    
    expect(select).toHaveValue('camera2');
  });

  it('calls onCameraSelect when Initialize Tracking is clicked', async () => {
    const mockDevices = [
      { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' },
    ];

    mockGetUserMedia.mockResolvedValue({});
    mockEnumerateDevices.mockResolvedValue(mockDevices);
    
    render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('INITIALIZE TRACKING')).toBeInTheDocument();
    });

    const button = screen.getByText('INITIALIZE TRACKING');
    fireEvent.click(button);
    
    expect(mockOnCameraSelect).toHaveBeenCalledWith('camera1');
    expect(mockOnCameraSelect).toHaveBeenCalledTimes(1);
  });

  it('shows singular device text when only one camera is found', async () => {
    const mockDevices = [
      { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' },
    ];

    mockGetUserMedia.mockResolvedValue({});
    mockEnumerateDevices.mockResolvedValue(mockDevices);
    
    render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('1 DEVICE ONLINE')).toBeInTheDocument();
    });
  });

  it('logs error to console when camera access fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Camera access failed');
    mockGetUserMedia.mockRejectedValue(error);
    
    render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error accessing cameras:', error);
    });
    
    consoleSpy.mockRestore();
  });

  describe('Multiple camera selection scenarios', () => {
    it('preserves selected camera when switching between multiple cameras', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' },
        { kind: 'videoinput', deviceId: 'camera2', label: 'Back Camera' },
        { kind: 'videoinput', deviceId: 'camera3', label: 'External USB Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      
      // Switch to camera2
      fireEvent.change(select, { target: { value: 'camera2' } });
      expect(select).toHaveValue('camera2');
      
      // Switch to camera3
      fireEvent.change(select, { target: { value: 'camera3' } });
      expect(select).toHaveValue('camera3');
      
      // Click initialize with camera3 selected
      fireEvent.click(screen.getByText('INITIALIZE TRACKING'));
      expect(mockOnCameraSelect).toHaveBeenCalledWith('camera3');
    });

    it('handles rapid camera selection changes', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
        { kind: 'videoinput', deviceId: 'camera2', label: 'Camera 2' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      
      // Rapidly change selection multiple times
      fireEvent.change(select, { target: { value: 'camera2' } });
      fireEvent.change(select, { target: { value: 'camera1' } });
      fireEvent.change(select, { target: { value: 'camera2' } });
      fireEvent.change(select, { target: { value: 'camera1' } });
      
      expect(select).toHaveValue('camera1');
      
      fireEvent.click(screen.getByText('INITIALIZE TRACKING'));
      expect(mockOnCameraSelect).toHaveBeenCalledWith('camera1');
      expect(mockOnCameraSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error recovery and edge cases', () => {
    it('handles getUserMedia throwing non-Error objects', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserMedia.mockRejectedValue('String error');
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('SYSTEM ERROR')).toBeInTheDocument();
        expect(consoleSpy).toHaveBeenCalledWith('Error accessing cameras:', 'String error');
      });
      
      consoleSpy.mockRestore();
    });

    it('handles enumerateDevices failure after successful getUserMedia', async () => {
      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockRejectedValue(new Error('Enumerate failed'));
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('SYSTEM ERROR')).toBeInTheDocument();
        expect(screen.getByText('Unable to access cameras. Please ensure you have granted camera permissions.')).toBeInTheDocument();
      });
    });

    it('filters out non-video input devices correctly', async () => {
      const mockDevices = [
        { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone' },
        { kind: 'audiooutput', deviceId: 'speaker1', label: 'Speaker' },
        { kind: 'videoinput', deviceId: 'camera1', label: 'Web Camera' },
        { kind: 'audioinput', deviceId: 'mic2', label: 'Headset' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('1 DEVICE ONLINE')).toBeInTheDocument();
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent('Web Camera');
      });
    });

    it('handles devices with undefined properties gracefully', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: undefined },
        { kind: 'videoinput', deviceId: undefined, label: 'Camera 2' },
        { kind: undefined, deviceId: 'camera3', label: 'Camera 3' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        // Only the first device should be valid (undefined label becomes 'Camera 1')
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent('Camera 1');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Front Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        
        const button = screen.getByRole('button', { name: /initialize tracking/i });
        expect(button).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
        { kind: 'videoinput', deviceId: 'camera2', label: 'Camera 2' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      const button = screen.getByText('INITIALIZE TRACKING');
      
      // Focus on select
      select.focus();
      expect(document.activeElement).toBe(select);
      
      // Tab to button
      fireEvent.keyDown(select, { key: 'Tab' });
      button.focus();
      expect(document.activeElement).toBe(button);
      
      // Enter key on button
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockOnCameraSelect).toHaveBeenCalled();
    });
  });

  describe('Component lifecycle and cleanup', () => {
    it('does not update state after unmounting', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      // Create a promise that we can resolve later
      let resolveGetUserMedia;
      const getUserMediaPromise = new Promise((resolve) => {
        resolveGetUserMedia = resolve;
      });
      
      mockGetUserMedia.mockReturnValue(getUserMediaPromise);
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      const { unmount } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      // Component should be in loading state
      expect(screen.getByText('SCANNING DEVICES...')).toBeInTheDocument();
      
      // Unmount component
      unmount();
      
      // Resolve the promise after unmounting
      resolveGetUserMedia({});
      
      // Should not throw any errors about setting state on unmounted component
      await waitFor(() => {
        expect(screen.queryByText('SCANNING DEVICES...')).not.toBeInTheDocument();
      });
    });

    it('handles multiple rapid mounts and unmounts', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      // Mount and unmount multiple times rapidly
      const { unmount: unmount1 } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      unmount1();
      
      const { unmount: unmount2 } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      unmount2();
      
      const { unmount: unmount3 } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('NEURAL INTERFACE')).toBeInTheDocument();
      });
      
      unmount3();
    });
  });

  describe('Performance and optimization', () => {
    it('does not re-fetch cameras on re-render', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      const { rerender } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('NEURAL INTERFACE')).toBeInTheDocument();
      });
      
      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      expect(mockEnumerateDevices).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      // Should not call APIs again
      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      expect(mockEnumerateDevices).toHaveBeenCalledTimes(1);
    });

    it('handles extremely large number of cameras', async () => {
      const mockDevices = Array.from({ length: 50 }, (_, i) => ({
        kind: 'videoinput',
        deviceId: `camera${i}`,
        label: `Camera ${i + 1}`,
      }));

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('50 DEVICES ONLINE')).toBeInTheDocument();
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(50);
      });
    });
  });

  describe('Browser compatibility', () => {
    it('handles missing mediaDevices API', async () => {
      const originalMediaDevices = navigator.mediaDevices;
      
      // Remove mediaDevices
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: undefined,
      });
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('SYSTEM ERROR')).toBeInTheDocument();
      });
      
      // Restore
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: originalMediaDevices,
      });
    });

    it('handles partial MediaDevices API implementation', async () => {
      const originalMediaDevices = navigator.mediaDevices;
      
      // Mock partial implementation
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: mockGetUserMedia,
          // enumerateDevices is missing
        },
      });
      
      mockGetUserMedia.mockResolvedValue({});
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('SYSTEM ERROR')).toBeInTheDocument();
      });
      
      // Restore
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: originalMediaDevices,
      });
    });
  });

  describe('Visual styling and CSS classes', () => {
    it('applies correct styling classes for sci-fi theme', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        // Check for main container classes
        const mainContainer = screen.getByText('NEURAL INTERFACE').closest('div');
        expect(mainContainer).toHaveClass('bg-black', 'border-2', 'border-cyan-500');
        
        // Check for glow effect
        const glowElement = mainContainer?.previousElementSibling;
        expect(glowElement).toHaveClass('bg-cyan-500', 'opacity-20', 'blur-3xl');
        
        // Check button styling
        const button = screen.getByText('INITIALIZE TRACKING').parentElement;
        expect(button).toHaveClass('bg-cyan-900', 'border-2', 'border-cyan-500');
      });
    });

    it('shows correct animation classes for loading spinner', () => {
      mockGetUserMedia.mockImplementation(() => new Promise(() => {}));
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      const spinner = screen.getByText('SCANNING DEVICES...').previousElementSibling;
      expect(spinner).toHaveClass('animate-spin', 'border-cyan-500');
    });

    it('displays corner decorations correctly', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        const container = screen.getByText('NEURAL INTERFACE').closest('div');
        const corners = container?.querySelectorAll('div[class*="absolute"][class*="border"]');
        expect(corners).toHaveLength(4); // 4 corner decorations
      });
    });
  });

  describe('Security and permissions', () => {
    it('handles different permission error types', async () => {
      const permissionErrors = [
        { name: 'NotAllowedError', message: 'Permission denied' },
        { name: 'NotFoundError', message: 'No camera found' },
        { name: 'NotReadableError', message: 'Camera in use' },
        { name: 'OverconstrainedError', message: 'Constraints cannot be satisfied' },
        { name: 'SecurityError', message: 'Security restrictions' },
      ];

      for (const errorInfo of permissionErrors) {
        vi.clearAllMocks();
        const error = new Error(errorInfo.message);
        error.name = errorInfo.name;
        mockGetUserMedia.mockRejectedValue(error);
        
        const { unmount } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
        
        await waitFor(() => {
          expect(screen.getByText('SYSTEM ERROR')).toBeInTheDocument();
        });
        
        unmount();
      }
    });

    it('does not expose device IDs in error messages', async () => {
      const sensitiveError = new Error('Device camera-secret-id-12345 not found');
      mockGetUserMedia.mockRejectedValue(sensitiveError);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        // Should show generic error, not the specific device ID
        expect(screen.getByText('Unable to access cameras. Please ensure you have granted camera permissions.')).toBeInTheDocument();
        expect(screen.queryByText(/camera-secret-id-12345/)).not.toBeInTheDocument();
      });
    });
  });

  describe('User interaction edge cases', () => {
    it('prevents double-clicking initialize button', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('INITIALIZE TRACKING')).toBeInTheDocument();
      });

      const button = screen.getByText('INITIALIZE TRACKING');
      
      // Double click
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should only call once
      expect(mockOnCameraSelect).toHaveBeenCalledTimes(1);
    });

    it('handles clicking outside the component', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      const { container } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('NEURAL INTERFACE')).toBeInTheDocument();
      });

      // Click on background
      fireEvent.click(container.firstChild as Element);
      
      // Component should still be displayed
      expect(screen.getByText('NEURAL INTERFACE')).toBeInTheDocument();
    });

    it('supports user interaction with keyboard only', async () => {
      const user = userEvent.setup();
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera 1' },
        { kind: 'videoinput', deviceId: 'camera2', label: 'Camera 2' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Tab to select
      await user.tab();
      
      // Use arrow keys to navigate options
      await user.keyboard('{ArrowDown}');
      
      // Tab to button
      await user.tab();
      
      // Press space to activate button
      await user.keyboard(' ');
      
      expect(mockOnCameraSelect).toHaveBeenCalledWith('camera2');
    });
  });

  describe('Memory leaks and performance', () => {
    it('cleans up event listeners on unmount', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      const { unmount } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('NEURAL INTERFACE')).toBeInTheDocument();
      });

      const eventListenersAdded = addEventListenerSpy.mock.calls.length;
      
      unmount();
      
      // Should remove any event listeners that were added
      const eventListenersRemoved = removeEventListenerSpy.mock.calls.length;
      expect(eventListenersRemoved).toBeLessThanOrEqual(eventListenersAdded);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('handles memory pressure scenarios', async () => {
      // Simulate many devices to test memory handling
      const mockDevices = Array.from({ length: 100 }, (_, i) => ({
        kind: 'videoinput',
        deviceId: `camera${i}`,
        label: `Camera ${i + 1} with a very long label that might cause layout issues or memory problems`,
      }));

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      const { unmount } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        expect(screen.getByText('100 DEVICES ONLINE')).toBeInTheDocument();
      });

      // Component should handle large number of devices without crashing
      const select = screen.getByRole('combobox');
      expect(select.children).toHaveLength(100);
      
      unmount();
    });
  });

  describe('Concurrent operations and race conditions', () => {
    it('handles component unmounting during API calls', async () => {
      let rejectGetUserMedia;
      const getUserMediaPromise = new Promise((_, reject) => {
        rejectGetUserMedia = reject;
      });
      
      mockGetUserMedia.mockReturnValue(getUserMediaPromise);
      
      const { unmount } = render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      // Unmount while API call is pending
      unmount();
      
      // Reject after unmount
      act(() => {
        rejectGetUserMedia(new Error('Cancelled'));
      });
      
      // Should not throw
      await waitFor(() => {
        expect(screen.queryByText('SYSTEM ERROR')).not.toBeInTheDocument();
      });
    });

    it('handles rapid prop changes', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      
      const { rerender } = render(<CameraSelector onCameraSelect={callback1} />);
      
      // Rapidly change callbacks
      rerender(<CameraSelector onCameraSelect={callback2} />);
      rerender(<CameraSelector onCameraSelect={callback3} />);
      
      await waitFor(() => {
        expect(screen.getByText('INITIALIZE TRACKING')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('INITIALIZE TRACKING'));
      
      // Should use the latest callback
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).toHaveBeenCalledWith('camera1');
    });
  });

  describe('Integration scenarios', () => {
    it('works correctly when embedded in a modal or dialog', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      // Simulate being rendered inside a modal
      render(
        <div role="dialog" aria-modal="true">
          <CameraSelector onCameraSelect={mockOnCameraSelect} />
        </div>
      );
      
      await waitFor(() => {
        expect(screen.getByText('NEURAL INTERFACE')).toBeInTheDocument();
      });

      // Should work normally inside modal
      fireEvent.click(screen.getByText('INITIALIZE TRACKING'));
      expect(mockOnCameraSelect).toHaveBeenCalled();
    });

    it('handles being rendered multiple times on the same page', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      render(
        <>
          <div data-testid="selector1">
            <CameraSelector onCameraSelect={callback1} />
          </div>
          <div data-testid="selector2">
            <CameraSelector onCameraSelect={callback2} />
          </div>
        </>
      );
      
      await waitFor(() => {
        const buttons = screen.getAllByText('INITIALIZE TRACKING');
        expect(buttons).toHaveLength(2);
      });

      // Click first button
      const buttons = screen.getAllByText('INITIALIZE TRACKING');
      fireEvent.click(buttons[0]);
      
      expect(callback1).toHaveBeenCalledWith('camera1');
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('Fallback behaviors', () => {
    it('handles devices with empty device IDs', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: '', label: 'Camera 1' },
        { kind: 'videoinput', deviceId: 'camera2', label: 'Camera 2' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        // Should still show both cameras
        expect(options).toHaveLength(2);
      });
    });

    it('handles all cameras having the same label', async () => {
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'USB Camera' },
        { kind: 'videoinput', deviceId: 'camera2', label: 'USB Camera' },
        { kind: 'videoinput', deviceId: 'camera3', label: 'USB Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(3);
        // All should have same label but different values
        options.forEach(option => {
          expect(option).toHaveTextContent('USB Camera');
        });
      });
      
      // Should still be able to select different cameras
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'camera2' } });
      fireEvent.click(screen.getByText('INITIALIZE TRACKING'));
      
      expect(mockOnCameraSelect).toHaveBeenCalledWith('camera2');
    });
  });

  describe('Responsive behavior', () => {
    it('displays correctly on small screens', async () => {
      // Mock small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const mockDevices = [
        { kind: 'videoinput', deviceId: 'camera1', label: 'Camera' },
      ];

      mockGetUserMedia.mockResolvedValue({});
      mockEnumerateDevices.mockResolvedValue(mockDevices);
      
      render(<CameraSelector onCameraSelect={mockOnCameraSelect} />);
      
      await waitFor(() => {
        const container = screen.getByText('NEURAL INTERFACE').closest('div');
        // Has responsive margin class
        expect(container).toHaveClass('mx-4');
      });
    });
  });
});