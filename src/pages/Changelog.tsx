import { Link } from "react-router";
import { motion } from "framer-motion";
import { useChangelog } from "@/lib/useChangelog";
import type { ChangelogEntry } from "@/lib/useChangelog";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const TAG_STYLES: Record<
  ChangelogEntry["tag"],
  { label: string; bg: string; text: string; dot: string }
> = {
  feature: {
    label: "Feature",
    bg: "bg-accent-hangout/15",
    text: "text-accent-hangout",
    dot: "bg-accent-hangout",
  },
  fix: {
    label: "Fix",
    bg: "bg-accent-action/15",
    text: "text-accent-action",
    dot: "bg-accent-action",
  },
  improvement: {
    label: "Improvement",
    bg: "bg-accent-event/15",
    text: "text-accent-event",
    dot: "bg-accent-event",
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function groupByDate(entries: ChangelogEntry[]): [string, ChangelogEntry[]][] {
  const groups = new Map<string, ChangelogEntry[]>();
  for (const entry of entries) {
    const key = formatDate(entry.date);
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }
  return Array.from(groups.entries());
}

export function Changelog() {
  const { entries, loading, error } = useChangelog();

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <header className="mb-12">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
          >
            {"\u2190"} Back
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Changelog
          </h1>
          <p className="mt-2 text-text-secondary">
            New features, improvements, and fixes.
          </p>
        </header>

        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-accent-action/30 bg-accent-action/10 p-4 text-center text-sm text-accent-action">
            {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="py-16 text-center text-text-tertiary">
            No changelog entries yet.
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-0 w-px bg-border" />

            {groupByDate(entries).map(([date, group], groupIdx) => (
              <div key={date} className="relative mb-10 last:mb-0">
                {/* Date marker */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: groupIdx * 0.1 }}
                  className="mb-4 flex items-center gap-3"
                >
                  <div className="relative z-10 h-[15px] w-[15px] rounded-full border-2 border-border bg-bg-secondary" />
                  <span className="font-display text-sm font-semibold text-text-secondary">
                    {date}
                  </span>
                </motion.div>

                {/* Entries for this date */}
                <div className="ml-[30px] flex flex-col gap-3">
                  {group.map((entry, i) => {
                    const style = TAG_STYLES[entry.tag];
                    return (
                      <motion.div
                        key={entry.prNumber}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: groupIdx * 0.1 + (i + 1) * 0.05,
                        }}
                        className="rounded-xl border border-border bg-bg-surface p-5"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                          >
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`}
                            />
                            {style.label}
                          </span>
                          <a
                            href={entry.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-text-tertiary transition-colors hover:text-text-secondary"
                          >
                            #{entry.prNumber}
                          </a>
                        </div>
                        <h3 className="font-display text-base font-semibold text-text-primary">
                          {entry.title}
                        </h3>
                        {entry.summary && (
                          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                            {entry.summary}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
