"use client";

import { useState } from "react";

import { buttonClass } from "@/components/ui";

/**
 * Subscribing to the feed rather than exporting a file: Google re-fetches it,
 * so when a milestone moves the student's calendar follows. A one-off .ics
 * download would go stale the first time a date changed.
 */
export function CalendarConnect({ feedUrl }: { feedUrl: string }) {
  const [copied, setCopied] = useState(false);

  const webcal = feedUrl.replace(/^https?:/, "webcal:");
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="font-bold text-ink">Your deadlines, in your own calendar</h3>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
        Every milestone across your projects, kept up to date. When a date moves here, it moves
        in your calendar too — you are subscribing to the feed, not downloading a copy.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={googleUrl}
          target="_blank"
          rel="noreferrer noopener"
          className={buttonClass("primary")}
        >
          Add to Google Calendar
        </a>
        <a href={webcal} className={buttonClass("secondary")}>
          Apple Calendar or Outlook
        </a>
        <button type="button" onClick={copy} className={buttonClass("ghost")}>
          {copied ? "Copied" : "Copy the link"}
        </button>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-royal-purple">
          Adding it by hand
        </summary>
        <ol className="mt-2 space-y-1 text-sm text-muted">
          <li>1. Google Calendar → Other calendars → <span className="font-semibold">From URL</span></li>
          <li>2. Paste the link below</li>
          <li>3. Google refreshes it on its own schedule, usually within a day</li>
        </ol>
        <code className="mt-2 block break-all rounded-lg bg-paper px-3 py-2 text-xs text-ink">
          {feedUrl}
        </code>
      </details>

      <p className="mt-3 text-xs text-muted">
        Treat the link like a password — anyone with it can see your deadlines.
      </p>
    </div>
  );
}
