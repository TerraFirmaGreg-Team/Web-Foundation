export interface RegistryRecipes {
  [k: string]: PreparedRecipeRow[] | undefined;
}
export interface PreparedRecipeRow {
  id: string;
  category: string;
  bucket: string;
  order?: number;
  inputs: string[];
  outputs: string[];
  image?: string;
  w?: number;
  h?: number;
}
