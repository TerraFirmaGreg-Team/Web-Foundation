export type DatasetLinkIcon = 'github' | 'curseforge' | 'modrinth' | 'discord';

export type DatasetLink = {
  label: string;
  url: string;
  icon?: DatasetLinkIcon;
};

export const datasetLink = {
  github: (repo: `${string}/${string}`): DatasetLink => ({
    label: 'GitHub',
    url: `https://github.com/${repo}`,
    icon: 'github',
  }),
  curseforge: (slug: string): DatasetLink => ({
    label: 'CurseForge',
    url: `https://www.curseforge.com/minecraft/modpacks/${slug}`,
    icon: 'curseforge',
  }),
  modrinth: (slug: string): DatasetLink => ({
    label: 'Modrinth',
    url: `https://modrinth.com/modpack/${slug}`,
    icon: 'modrinth',
  }),
  discord: (url: string): DatasetLink => ({
    label: 'Discord',
    url,
    icon: 'discord',
  }),
};

