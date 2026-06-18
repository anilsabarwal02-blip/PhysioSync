import React, { Component, useState, useRef, useEffect } from 'react';
import { Gamepad2, Trophy, Star, Target, Camera, XCircle } from 'lucide-react';

// Error Boundary to catch and display the exact error causing the blank screen
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', background: '#fef2f2', color: '#991b1b', height: '100vh' }}>
          <h2>Something went wrong in the Gamified Rehab component.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fee2e2', padding: '20px', borderRadius: '8px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap the actual component so we can catch top-level errors
const GamifiedRehabInner = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [tfjsError, setTfjsError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const requestRef = useRef(null);
  const squatStateRef = useRef('up');

  // Dynamically import TFJS only when component mounts to prevent top-level bundler crashes
  const loadDependencies = async () => {
    try {
      const tf = await import('@tensorflow/tfjs');
      const poseDetection = await import('@tensorflow-models/pose-detection');
      return { tf, poseDetection };
    } catch (err) {
      setTfjsError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    return () => stopGame();
  }, []);

  const calculateAngle = (A, B, C) => {
    const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const drawSkeleton = (keypoints, ctx, poseDetection) => {
    const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;

    keypoints.forEach((keypoint) => {
      if (keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    adjacentKeyPoints.forEach((pair) => {
      const p1 = keypoints[pair[0]];
      const p2 = keypoints[pair[1]];
      if (p1.score > 0.3 && p2.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    });
  };

  const detectPose = async (poseDetection) => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState !== 4) {
      requestRef.current = requestAnimationFrame(() => detectPose(poseDetection));
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const poses = await detectorRef.current.estimatePoses(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poses.length > 0) {
      const keypoints = poses[0].keypoints;
      drawSkeleton(keypoints, ctx, poseDetection);

      const leftHip = keypoints[11];
      const leftKnee = keypoints[13];
      const leftAnkle = keypoints[15];

      if (leftHip.score > 0.3 && leftKnee.score > 0.3 && leftAnkle.score > 0.3) {
        const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);

        if (kneeAngle < 100 && squatStateRef.current === 'up') {
          squatStateRef.current = 'down';
          setFeedback('Good depth! Now stand up.');
        } else if (kneeAngle > 160 && squatStateRef.current === 'down') {
          squatStateRef.current = 'up';
          setReps(r => r + 1);
          setScore(s => s + 100);
          setFeedback('PERFECT SQUAT! +100 Points');
          setTimeout(() => setFeedback(''), 2000);
        }
      }
    }

    requestRef.current = requestAnimationFrame(() => detectPose(poseDetection));
  };

  const startGame = async () => {
    setIsModelLoading(true);
    setTfjsError('');
    
    try {
      const { tf, poseDetection } = await loadDependencies();
      await tf.ready();

      const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
      detectorRef.current = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsPlaying(true);
          setIsModelLoading(false);
          detectPose(poseDetection);
        };
      }
    } catch (err) {
      console.error(err);
      setTfjsError(err.message || 'Failed to start camera or AI model.');
      setIsModelLoading(false);
    }
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  if (tfjsError) {
    return (
      <div className="main-content" style={{ padding: '40px' }}>
        <h2 style={{ color: '#ef4444' }}>Error Loading Component</h2>
        <p>{tfjsError}</p>
        <button className="glass-button" onClick={() => setTfjsError('')}>Retry</button>
      </div>
    );
  }

  return (
    <div className="main-content">
      <header className="dashboard-header">
        <div>
          <h1>Gamified Rehab 🎮</h1>
          <p>Real-time AI pose detection for accurate exercise tracking.</p>
        </div>
      </header>

      <div className="dashboard-content-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Active Quest: Real Squat Tracking</h3>
            {isPlaying && (
              <button className="glass-button" onClick={stopGame} style={{ padding: '6px 12px', background: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={16} /> Stop Camera
              </button>
            )}
          </div>

          <div style={{ minHeight: '400px', background: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            {!isPlaying ? (
              <div style={{ textAlign: 'center' }}>
                {isModelLoading ? (
                  <>
                    <p style={{ color: 'var(--primary)', marginBottom: '10px' }}>Loading TensorFlow.js MoveNet Model...</p>
                    <div style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                  </>
                ) : (
                  <>
                    <Gamepad2 size={64} style={{ opacity: 0.5, color: 'white', marginBottom: '20px' }} />
                    <br />
                    <button className="glass-button" onClick={startGame} style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
                      Start Camera & Play
                    </button>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px' }}>
                      Ensure your full body is visible.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <video 
                  ref={videoRef} 
                  style={{ width: '100%', maxHeight: '500px', transform: 'scaleX(-1)' }} 
                  playsInline 
                  muted 
                />
                <canvas 
                  ref={canvasRef} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} 
                />
                {feedback && (
                  <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', textAlign: 'center', zIndex: 4 }}>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#10b981', textShadow: '0 0 10px rgba(16,185,129,0.8)' }}>
                      {feedback}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <Trophy size={48} color="#fbbf24" style={{ margin: '0 auto 10px' }} />
            <h2 style={{ fontSize: '2.5rem', margin: '0' }}>{score}</h2>
            <p style={{ color: 'var(--text-muted)' }}>Total Points</p>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Current Mission</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Squats Completed</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{reps} / 15</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Form Tracking</span>
                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>MoveNet ML</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const GamifiedRehab = () => (
  <ErrorBoundary>
    <GamifiedRehabInner />
  </ErrorBoundary>
);

export default GamifiedRehab;
