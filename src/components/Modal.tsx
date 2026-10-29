"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * Built on the native <dialog> rather than a floating div: showModal() already
 * gives us the top layer, a focus trap, inert content behind, and Escape to
 * close. Re-implementing those by hand is where accessible modals go wrong.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();

    // The dialog traps the keyboard but not the wheel, so the page behind it
    // would still scroll away underneath.
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape closes the dialog on its own; this keeps React in step with it.
      onClose={onClose}
      // The backdrop belongs to the dialog element, so a click landing on the
      // element itself rather than on the panel is a click outside.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="card m-auto w-[min(30rem,calc(100vw-2rem))] p-5 text-left backdrop:bg-ink/45 backdrop:backdrop-blur-[2px]"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-m-1 rounded-lg p-1 text-muted transition-colors hover:text-royal-purple"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M4.5 3.1 10 8.6l5.5-5.5 1.4 1.4-5.5 5.5 5.5 5.5-1.4 1.4-5.5-5.5-5.5 5.5-1.4-1.4 5.5-5.5-5.5-5.5z" />
          </svg>
        </button>
      </div>
      {children}
    </dialog>
  );
}
