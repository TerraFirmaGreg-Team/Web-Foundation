export const sites = {
  wiki: 'https://wiki.terrafirmagreg.team',
  map: 'https://map.terrafirmagreg.team',
} as const;

export type SiteKey = keyof typeof sites;

export const discordUrl = 'https://discord.com/invite/terrafirmagreg';

export const siteLinks = {
  website: 'https://terrafirmagreg.team',
  discord: discordUrl,
  github: 'https://github.com/TerraFirmaGreg-Team',
  curseforge: 'https://www.curseforge.com/members/terrafirmagreg/projects',
  modrinth: 'https://modrinth.com/organization/terrafirmagreg-team',
} as const;
