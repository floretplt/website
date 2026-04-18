type Props = {
  eyebrow?: string;
  title: string;
};

export function SectionHeading({ eyebrow, title }: Props) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      <h2 className="h-section text-balance">{title}</h2>
    </div>
  );
}
