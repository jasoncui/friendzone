import { useEffect, useState } from "react";

export interface ChangelogEntry {
  title: string;
  summary: string;
  date: string;
  tag: "feature" | "fix" | "improvement";
  prNumber: number;
  prUrl: string;
}

const REPO = "jasoncui/friendzone";

function classifyTag(title: string): ChangelogEntry["tag"] {
  const lower = title.toLowerCase();
  if (/\bfix\b/.test(lower)) return "fix";
  if (/\b(add|implement|wire up|create|build)\b/.test(lower)) return "feature";
  return "improvement";
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold**
    .replace(/\*(.+?)\*/g, "$1")        // *italic*
    .replace(/__(.+?)__/g, "$1")        // __bold__
    .replace(/_(.+?)_/g, "$1")          // _italic_
    .replace(/`(.+?)`/g, "$1")          // `code`
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // [link](url)
    .replace(/^#+\s*/gm, "");           // headings
}

function extractSummary(body: string | null): string {
  if (!body) return "";
  const summaryMatch = body.match(/## Summary\s*\n([\s\S]*?)(?=\n## |\n---|\n\n🤖|$)/);
  if (!summaryMatch?.[1]) return "";
  const lines = summaryMatch[1]
    .split("\n")
    .map((l) => stripMarkdown(l.replace(/^[-*]\s*/, "").trim()))
    .filter(Boolean)
    .slice(0, 3);
  return lines.join(". ");
}

export function useChangelog() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPRs() {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=50`
        );
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

        const prs = await res.json();

        const merged = prs
          .filter((pr: { merged_at: string | null }) => pr.merged_at !== null)
          .map(
            (pr: {
              title: string;
              body: string | null;
              merged_at: string;
              number: number;
              html_url: string;
            }): ChangelogEntry => ({
              title: pr.title,
              summary: extractSummary(pr.body),
              date: pr.merged_at,
              tag: classifyTag(pr.title),
              prNumber: pr.number,
              prUrl: pr.html_url,
            })
          )
          .sort(
            (a: ChangelogEntry, b: ChangelogEntry) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          );

        if (!cancelled) {
          setEntries(merged);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch changelog");
          setLoading(false);
        }
      }
    }

    fetchPRs();
    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, loading, error };
}
