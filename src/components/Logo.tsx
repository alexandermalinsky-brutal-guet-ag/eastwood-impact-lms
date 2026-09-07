/**
 * Eastwood Montreux logo artwork.
 *
 * The symbol paths are lifted verbatim from the vector artwork sheet
 * ("Eastwood Montreux-Logo Sheet-Final.pdf", stand-alone symbol). The
 * translate() offset moves the artwork's original page coordinates to the
 * origin — do not re-draw these paths by hand.
 */

type SymbolProps = {
  className?: string;
  title?: string;
};

export function LogoSymbol({ className, title }: SymbolProps) {
  return (
    <svg
      viewBox="0 0 69.582 75.457"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
    >
      {title ? <title>{title}</title> : null}
      <g transform="translate(-1107.777344,-463.382812)">
        <path d="M 1177.359375 475.917969 L 1177.359375 463.382812 L 1142.570312 481.65625 L 1142.570312 494.191406 Z M 1177.359375 475.917969" />
        <path d="M 1142.566406 516.515625 L 1177.359375 498.246094 L 1177.359375 485.710938 L 1142.566406 503.980469 Z M 1142.566406 516.515625" />
        <path d="M 1177.359375 511.132812 L 1177.359375 508.070312 L 1142.570312 526.304688 L 1122.214844 515.617188 C 1119.554688 514.222656 1118.875 513.101562 1118.875 510.089844 L 1118.875 481.65625 L 1142.570312 481.65625 L 1142.570312 470.558594 L 1107.777344 470.558594 L 1107.777344 511.132812 C 1107.777344 511.644531 1107.757812 513.695312 1107.957031 514.867188 C 1108.464844 517.917969 1110.050781 520.683594 1112.410156 522.667969 C 1113.554688 523.628906 1115.289062 524.515625 1116.753906 525.285156 L 1142.570312 538.839844 L 1168.382812 525.285156 C 1169.847656 524.515625 1171.582031 523.628906 1172.726562 522.667969 C 1175.085938 520.683594 1176.671875 517.917969 1177.179688 514.867188 C 1177.378906 513.695312 1177.359375 511.644531 1177.359375 511.132812" />
      </g>
    </svg>
  );
}

/**
 * Official logo, landscape lock-up — the preferred configuration per the
 * artwork sheet. `tone` follows the sheet's approved colour usage rules.
 */
export function Logo({
  className = "",
  tone = "colour",
  wordmark = true,
}: {
  className?: string;
  tone?: "colour" | "reversed" | "tinted";
  wordmark?: boolean;
}) {
  const symbolColour =
    tone === "colour"
      ? "text-[var(--royal-purple)]"
      : tone === "reversed"
        ? "text-white"
        : "text-[var(--light-purple)]";
  const primaryText =
    tone === "colour" ? "text-[var(--deep-blue)]" : "text-white";
  const secondaryText =
    tone === "colour"
      ? "text-[var(--royal-purple)]"
      : tone === "reversed"
        ? "text-[var(--light-purple)]"
        : "text-[var(--light-purple)]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoSymbol
        className={`h-8 w-auto shrink-0 ${symbolColour}`}
        title="Eastwood Montreux International School"
      />
      {wordmark ? (
        <span className="flex flex-col leading-none">
          <span
            className={`text-[0.94rem] font-bold tracking-[0.055em] ${primaryText}`}
          >
            EASTWOOD MONTREUX
          </span>
          <span
            className={`mt-[0.2rem] text-[0.6rem] font-medium tracking-[0.176em] ${secondaryText}`}
          >
            INTERNATIONAL SCHOOL
          </span>
        </span>
      ) : null}
    </span>
  );
}
