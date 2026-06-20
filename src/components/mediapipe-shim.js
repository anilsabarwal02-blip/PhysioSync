// Shim for @mediapipe/pose to satisfy bundlers like Vite that expect ESM named exports
export class Pose {
  constructor() {
    console.warn("PhysioSync: Running MediaPipe Pose shim class. Real BlazePose functionality is disabled.");
  }
  setOptions() {}
  onResults() {}
  send() {}
  close() {}
}
export const POSE_CONNECTIONS = [];
