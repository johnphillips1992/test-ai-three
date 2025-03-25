import { useState, useEffect, useRef } from 'react';

interface WebcamOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

export const useWebcam = (options: WebcamOptions = {}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  const defaultOptions: WebcamOptions = {
    width: 640,
    height: 480,
    facingMode: 'user',
    ...options
  };

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            width: defaultOptions.width,
            height: defaultOptions.height,
            facingMode: defaultOptions.facingMode
          }
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError(err as Error);
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [defaultOptions.width, defaultOptions.height, defaultOptions.facingMode]);

  const handleCanPlay = () => {
    setIsReady(true);
  };

  return {
    videoRef,
    stream,
    error,
    isReady,
    handleCanPlay
  };
};