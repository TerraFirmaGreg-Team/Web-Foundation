export interface RegistryGroups {
  [k: string]: StackGroupValue | undefined;
}
export interface StackGroupValue {
  members: string[];
  name?: null | DumpText;
}
export interface DumpText {
  extra?: DumpText[];
  keybind?: string;
  text?: string;
  translate?: string;
  with?: DumpText[];
}

