// Lien externe vers une autre app SVLBH (Priv, Pro, vslbh).
// Convention iPad : boussole compass + label sous l'icône (DEC Patrick 2026-05-12).
// Couleurs : Priv jaune doré #F2BF1A, Pro magenta #DB338C.

export function ExternalAppLink({
  href,
  label,
  color,
  title,
}: {
  href: string;
  label: string;
  color: string;
  title?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="inline-flex flex-col items-center gap-0 rounded-lg bg-white px-2 py-1 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
    >
      {/* Compass SVG — équivalent SF Symbol "safari.fill" iPad */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
        style={{ color }}
      >
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm4.05-12.05L11 10l-1.95 5.05L14 13zM12 11a1 1 0 1 0 1 1 1 1 0 0 0-1-1z" />
      </svg>
      <span className="text-[10px] font-semibold text-neutral-500">
        {label}
      </span>
    </a>
  );
}
