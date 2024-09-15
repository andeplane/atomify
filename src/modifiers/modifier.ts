import { ModifierInput, ModifierOutput } from "./types";

interface ModifierProps {
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
  ) => {};
}
export default Modifier;
