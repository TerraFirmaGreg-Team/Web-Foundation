export function Multiblock({
  id,
  children,
}: {
  id?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="not-prose my-4 rounded-xl border border-dashed border-border bg-secondary/40 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
        Multiblock{id ? ` · ${id}` : ''}
      </div>
      <div className="text-sm text-muted-foreground [&_pre]:overflow-x-auto [&_code]:font-mono">
        {children ?? 'Multiblock pattern will render here.'}
      </div>
    </div>
  );
}

