import { PointerCoordinate, TrackingSensor } from '../types/game';

interface MediaPipeLandmark {
  x: number;
  y: number;
  z?: number;
}

interface MediaPipeHandsResults {
  multiHandLandmarks?: MediaPipeLandmark[][];
}

export class HandTracker {
  private handsInstance: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private isRunning: boolean = false;
  private isProcessingFrame: boolean = false;
  private animFrameId: number | null = null;
  private sensor: TrackingSensor = 'CAMERA';

  private pointer: PointerCoordinate = {
    x: 0.5,
    y: 0.5,
    velocity: 0,
    isDetected: false,
  };

  private prevPointer: PointerCoordinate = { ...this.pointer };
  private readonly LERP_FACTOR = 0.35; // Silky smooth response without lag

  private onUpdateCallback: ((pointer: PointerCoordinate) => void) | null = null;

  public setSensor(sensor: TrackingSensor) {
    this.sensor = sensor;
  }

  public getSensor(): TrackingSensor {
    return this.sensor;
  }

  public async initialize(): Promise<boolean> {
    try {
      const HandsClass = (window as any).Hands;
      if (!HandsClass) {
        console.warn('MediaPipe Hands script waiting...');
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!(window as any).Hands) {
          console.error('MediaPipe Hands failed to load from CDN');
          return false;
        }
      }

      this.handsInstance = new (window as any).Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      this.handsInstance.setOptions({
        maxNumHands: 1, // Single primary hand only for peak 60 FPS
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.handsInstance.onResults((results: MediaPipeHandsResults) => {
        this.processLandmarks(results);
      });

      return true;
    } catch (err) {
      console.error('Hands initialization error', err);
      return false;
    }
  }

  public setVideoSource(video: HTMLVideoElement) {
    this.videoElement = video;
  }

  public onPointerUpdate(cb: (pointer: PointerCoordinate) => void) {
    this.onUpdateCallback = cb;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private loop = async () => {
    if (!this.isRunning) return;

    // Only pump video frames if CAMERA mode is active
    if (
      this.sensor === 'CAMERA' &&
      this.handsInstance &&
      this.videoElement &&
      this.videoElement.readyState >= 2 &&
      !this.videoElement.paused &&
      !this.isProcessingFrame
    ) {
      this.isProcessingFrame = true;
      try {
        await this.handsInstance.send({ image: this.videoElement });
      } catch (err) {
        // frame dropped
      } finally {
        this.isProcessingFrame = false;
      }
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private processLandmarks(results: MediaPipeHandsResults) {
    if (this.sensor !== 'CAMERA') return;

    const hands = results.multiHandLandmarks;
    if (!hands || hands.length === 0 || !hands[0]) {
      this.pointer.isDetected = false;
      if (this.onUpdateCallback) this.onUpdateCallback(this.pointer);
      return;
    }

    const landmarks = hands[0];
    const indexTip = landmarks[8]; // Landmark 8: Index Finger Tip ONLY

    if (!indexTip) {
      this.pointer.isDetected = false;
      if (this.onUpdateCallback) this.onUpdateCallback(this.pointer);
      return;
    }

    // Mirrored screen coordinate: user views camera like a mirror
    const targetX = 1 - indexTip.x;
    const targetY = indexTip.y;

    if (!this.pointer.isDetected) {
      this.pointer = {
        x: targetX,
        y: targetY,
        velocity: 0,
        isDetected: true,
      };
    } else {
      const smoothedX = this.pointer.x + (targetX - this.pointer.x) * this.LERP_FACTOR;
      const smoothedY = this.pointer.y + (targetY - this.pointer.y) * this.LERP_FACTOR;
      const dist = Math.hypot(smoothedX - this.pointer.x, smoothedY - this.pointer.y);
      const velocity = this.pointer.velocity * 0.5 + dist * 0.5;

      this.pointer = {
        x: smoothedX,
        y: smoothedY,
        velocity,
        isDetected: true,
      };
    }

    this.prevPointer = { ...this.pointer };
    if (this.onUpdateCallback) this.onUpdateCallback(this.pointer);
  }

  // Instant Mouse Pointer Fallback
  public setMousePosition(x: number, y: number) {
    const dist = Math.hypot(x - this.pointer.x, y - this.pointer.y);
    this.pointer = {
      x,
      y,
      velocity: dist,
      isDetected: true,
    };
    if (this.onUpdateCallback) this.onUpdateCallback(this.pointer);
  }

  public getPointer(): PointerCoordinate {
    return this.pointer;
  }
}

export const handTracker = new HandTracker();
