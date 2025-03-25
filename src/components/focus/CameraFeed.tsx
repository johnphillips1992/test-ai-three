import React, { RefObject } from 'react';

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ videoRef, canvasRef }) => {
  return (
    <div className="camera-feed">
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline
        width="640"
        height="480"
      />
      <canvas 
        ref={canvasRef} 
        className="detection-canvas"
        width="640"
        height="480"
      />
    </div>
  );
};

export default CameraFeed;