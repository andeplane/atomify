import type { ModifierInput, ModifierOutput } from "./types";

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

  run = (_input: ModifierInput, _output: ModifierOutput, _everything: boolean = false) => {};
}
export default Modifier;
