import { ModifierInput, ModifierOutput } from "./types";

interface ModifierProps {
  name: string;
  active: boolean;
}

abstract class Modifier {
  public name: string;
  public key: string;
  public active: boolean;

  constructor({ name, active }: ModifierProps) {
    this.name = name;
    this.key = name;
    this.active = active;
  }

  abstract run(
    input: ModifierInput,
    output: ModifierOutput,
    everything?: boolean
  ): void;
}
export default Modifier;
