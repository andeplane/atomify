import { ModifierInput, ModifierOutput } from "./types";

export interface ModifierProps {
  name: string;
  active: boolean;
}

class Modifier {
  public name: string;
  public key: string;
  public active: boolean;

  constructor({ name, active }: ModifierProps) {
    this.name = name;
    this.key = name;
    this.active = active;
  }

  run = (
    input: ModifierInput,
    output: ModifierOutput,
    everything: boolean = false,
  ): void => {
    throw new Error(
      `${this.constructor.name}.run() is not implemented. Subclasses must override run().`,
    );
  };
}
export default Modifier;
