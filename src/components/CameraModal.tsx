import React, { useEffect, useRef, useState } from 'react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const requestCameraAccess = async () => {
    console.log('Requesting camera access...');
    setError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err instanceof Error) {
          setError(`Error accessing camera: ${err.message}`);
        } else {
          setError('An unknown error occurred while accessing the camera.');
        }
      }
    } else {
      setError('Camera access is not supported by this browser.');
    }
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.log('Camera stream stopped.');
    }
  };

  const handleCapture = () => {
    console.log('Capture button clicked');
    if (videoRef.current && stream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/png');
        onCapture(imageDataUrl);
        // No need to call handleClose here, let the parent component decide
        // handleClose(); // Optionally close after capture
      } else {
        setError('Could not capture image.');
      }
    } else {
      setError('Camera stream not available for capture.');
    }
  };

  const handleClose = () => {
    console.log('Close button clicked');
    stopCameraStream();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      requestCameraAccess();
    } else {
      stopCameraStream();
    }

    // Cleanup function to stop stream when component unmounts or isOpen changes to false
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.header}>Use Camera</h2>
        {error && <p style={styles.errorText}>{error}</p>}
        <div style={styles.videoContainer}>
          <video ref={videoRef} autoPlay playsInline style={styles.videoElement} />
          {!stream && !error && <p>Starting camera...</p>}
        </div>
        <div style={styles.controls}>
          <button onClick={handleCapture} style={styles.button} disabled={!stream}>
            Capture
          </button>
          <button onClick={handleClose} style={{ ...styles.button, ...styles.closeButton }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--secondary-bg)', // Using CSS variable
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '90%',
    maxWidth: '500px',
    color: 'var(--text-primary)', // Using CSS variable
  },
  header: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '1.5rem',
    textAlign: 'center',
    color: 'var(--text-primary)', // Using CSS variable
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#000',
    marginBottom: '15px',
    minHeight: '200px', // Ensure container has a minimum height
    display: 'flex',
    alignItems: 'center',
    borderRadius: '4px', // Added border radius
    justifyContent: 'center',
  },
  videoElement: {
    width: '100%',
    maxHeight: '400px',
    display: 'block', // Remove extra space below video
    borderRadius: '4px', // Added border radius
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    backgroundColor: 'var(--primary-accent)', // Using CSS variable
    color: 'white',
    flex: 1, // Make buttons take equal width
  },
  closeButton: {
    backgroundColor: 'var(--button-secondary-bg)', // Using CSS variable
    color: 'var(--text-primary)', // Using CSS variable
  },
  errorText: {
    color: 'var(--error-color)', // Using CSS variable for error text
    textAlign: 'center',
    marginBottom: '10px',
  },
};

export default CameraModal;
