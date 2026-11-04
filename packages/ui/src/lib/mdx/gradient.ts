export type GradientProps = {
  from?: string;
  to?: string;
  dir?: string;
  image?: string;
};

export function gradientImage({
  from = '#fa18cf',
  to = '#ff7967',
  dir = 'to right',
  image,
}: GradientProps): string {
  return image ?? `linear-gradient(${dir}, ${from}, ${to})`;
}

