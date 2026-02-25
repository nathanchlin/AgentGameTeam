export class GameLoop {
  private isRunning = false;
  private lastTime = 0;
  private accumulatedTime = 0;
  private readonly fixedDeltaTime: number;
  private animationFrameId: number | null = null;

  constructor(
    targetFPS: number,
    private updateCallback: (deltaTime: number) => void,
    private renderCallback: () => void
  ) {
    this.fixedDeltaTime = 1000 / targetFPS;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Prevent spiral of death
    this.accumulatedTime += Math.min(frameTime, this.fixedDeltaTime * 2);

    // Fixed timestep updates
    while (this.accumulatedTime >= this.fixedDeltaTime) {
      this.updateCallback(this.fixedDeltaTime / 1000);
      this.accumulatedTime -= this.fixedDeltaTime;
    }

    // Render
    this.renderCallback();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
