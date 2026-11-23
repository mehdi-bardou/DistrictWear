export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="font-display text-forest-700 text-sm tracking-widest uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="display-lg text-forest-950 mt-2">{title}</h1>
        {description && <p className="text-ink-700 mt-2 max-w-prose text-sm">{description}</p>}
      </div>
      {action}
    </header>
  );
}
