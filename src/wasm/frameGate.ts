import type { EngineFrame } from "./engineFrame";

/**
 * Backpressure for the worker's frame stream.
 *
 * The engine can sync far faster than the main thread renders (small systems,
 * a busy or backgrounded tab). Posting every frame would queue them in the
 * main thread's message queue faster than it drains, growing memory and
 * delaying input and run control behind stale frames. So at most one frame is
 * in flight: the main thread acks each `step` once it has consumed it, and a
 * frame offered while the previous one is unacked is not posted. Only the
 * latest skipped frame is kept, and it is posted as soon as the ack arrives —
 * so the state a run pauses or stops at still reaches the screen even though
 * no further sync will happen to carry it.
 *
 * Nothing ever waits on an ack: the run continues while frames are skipped,
 * so a main thread that is slow (or not rendering) can't stall the engine.
 * Run end is the one place a frame is posted unacked (`force`): the final
 * frame must land before `runFinished`, which the store reads it after, and a
 * run must never wait on the main thread to finish.
 */
export class FrameGate {
  private inFlight = 0;
  private parked: EngineFrame | null = null;

  constructor(private readonly postFrame: (frame: EngineFrame) => void) {}

  /** Post `frame` now if nothing is in flight (or forced); else park it. */
  offer(frame: EngineFrame, force = false) {
    if (force || this.inFlight === 0) {
      this.post(frame);
    } else {
      // Replaces any older parked frame; its buffers were never transferred.
      this.parked = frame;
    }
  }

  /** The main thread consumed a frame: post the parked one, if any. */
  ack() {
    this.inFlight = Math.max(0, this.inFlight - 1);
    if (this.inFlight === 0 && this.parked) this.post(this.parked);
  }

  /** Post the parked frame even though one is in flight (run end). */
  flush() {
    if (this.parked) this.post(this.parked);
  }

  /** Frames posted and not yet acked. */
  get pending(): number {
    return this.inFlight;
  }

  /** True while a skipped frame waits for an ack. */
  get hasParked(): boolean {
    return this.parked !== null;
  }

  private post(frame: EngineFrame) {
    this.parked = null;
    this.inFlight += 1;
    this.postFrame(frame);
  }
}
