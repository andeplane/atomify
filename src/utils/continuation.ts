export function validContinuationSteps(steps: number): boolean {
  return Number.isInteger(steps) && steps > 0 && steps <= 2147483647;
}

export function continuationScript(steps: number): string {
  if (!validContinuationSteps(steps))
    throw new Error("Enter a whole number of steps between 1 and 2147483647.");
  return `run ${steps}\n`;
}
