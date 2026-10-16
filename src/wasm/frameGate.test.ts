import { describe, expect, it } from "vitest";
import { FrameGate } from "./frameGate";
import { emptyEngineFrame, type EngineFrame } from "./engineFrame";

const frame = (step: number): EngineFrame => ({ ...emptyEngineFrame(), step });

const setup = () => {
  const posted: number[] = [];
  const gate = new FrameGate((f) => posted.push(f.step));
  return { gate, posted };
};

describe("FrameGate", () => {
  it("posts a frame when nothing is in flight", () => {
    const { gate, posted } = setup();
    gate.offer(frame(1));
    expect(posted).toEqual([1]);
    expect(gate.pending).toBe(1);
  });

  it("skips frames while one is unacked, keeping only the latest", () => {
    const { gate, posted } = setup();
    gate.offer(frame(1));
    gate.offer(frame(2));
    gate.offer(frame(3));
    expect(posted).toEqual([1]);
    expect(gate.hasParked).toBe(true);

    // The ack releases the newest skipped frame (the run kept going).
    gate.ack();
    expect(posted).toEqual([1, 3]);
    expect(gate.hasParked).toBe(false);
    expect(gate.pending).toBe(1);

    gate.ack();
    gate.offer(frame(4));
    expect(posted).toEqual([1, 3, 4]);
  });

  it("delivers the frame a run stopped at once the ack arrives (pause)", () => {
    const { gate, posted } = setup();
    gate.offer(frame(1));
    // The run pauses after syncing step 2: no further offer will come.
    gate.offer(frame(2));
    gate.ack();
    expect(posted).toEqual([1, 2]);
  });

  it("forces the final frame past an unacked one at run end", () => {
    const { gate, posted } = setup();
    gate.offer(frame(1));
    gate.offer(frame(2));
    gate.offer(frame(3), true);
    expect(posted).toEqual([1, 3]);
    // The forced frame superseded the parked one.
    expect(gate.hasParked).toBe(false);
    gate.flush();
    expect(posted).toEqual([1, 3]);

    // Both in-flight frames must be acked before the next is posted.
    expect(gate.pending).toBe(2);
    gate.ack();
    gate.offer(frame(4));
    expect(posted).toEqual([1, 3]);
    gate.ack();
    expect(posted).toEqual([1, 3, 4]);
  });

  it("flush() posts a parked frame without waiting (stopped or failed run)", () => {
    const { gate, posted } = setup();
    gate.offer(frame(1));
    gate.offer(frame(2));
    gate.flush();
    expect(posted).toEqual([1, 2]);
    gate.flush();
    expect(posted).toEqual([1, 2]);
  });

  it("ignores stray acks", () => {
    const { gate, posted } = setup();
    gate.ack();
    expect(gate.pending).toBe(0);
    gate.offer(frame(1));
    expect(posted).toEqual([1]);
  });
});
