export interface RegistryTags {
  [k: string]: TagEntry | undefined;
}
export interface TagEntry {
  id: string;
  members?: string[];
  producedBy?: string[];
  registry: string;
  replace: boolean;
  usedBy?: string[];
}

