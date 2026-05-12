interface FeaturePagePlaceholderProps {
  title: string;
  description: string;
}

export function FeaturePagePlaceholder({
  title,
  description,
}: FeaturePagePlaceholderProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </section>
  );
}
