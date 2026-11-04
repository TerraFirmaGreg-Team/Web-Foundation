import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { GitFork, Star } from 'lucide-react';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';

interface RepositoryInfo {
  stars: number;
  forks: number;
}

async function fetchRepositoryInfo(
  owner: string,
  repo: string,
): Promise<RepositoryInfo | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        next: { revalidate: 3600 },
        headers: process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : undefined,
      } as RequestInit,
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      stars: data.stargazers_count,
      forks: data.forks_count,
    };
  } catch {
    return null;
  }
}

const formatterOptions: Intl.NumberFormatOptions = {
  notation: 'compact',
  maximumFractionDigits: 1,
};

export async function GithubInfo({
  owner,
  repo,
  locale,
  className,
}: {
  owner: string;
  repo: string;
  locale?: Intl.LocalesArgument;
  className?: string;
}) {
  const info = await fetchRepositoryInfo(owner, repo);
  const formatter = new Intl.NumberFormat(locale, formatterOptions);

  return (
    <ItemRow
      href={`https://github.com/${owner}/${repo}`}
      target="_blank"
      rel="noreferrer noopener"
      variant="outline"
      size="default"
      media={<SiGithub color="currentColor" className="size-3.5" />}
      title={`${owner}/${repo}`}
      description={
        info ? (
          <span className="flex items-center gap-1">
            <Star className="size-3" />
            {formatter.format(info.stars)}
            <GitFork className="ms-2 size-3" />
            {formatter.format(info.forks)}
          </span>
        ) : undefined
      }
      className={cn('bg-card', className)}
    />
  );
}

