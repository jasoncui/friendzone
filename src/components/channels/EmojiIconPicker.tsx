import { useState } from "react";
import { EMOJI_CATEGORIES } from "@/lib/emojiData";

interface Props {
  onSelect: (emoji: string) => void;
}

export function EmojiIconPicker({ onSelect }: Props) {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase().trim();

  const filtered = query
    ? EMOJI_CATEGORIES.map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter(
          (em) => em.e.includes(query) || em.k.includes(query)
        ),
      })).filter((cat) => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  const totalResults = filtered.reduce(
    (sum, cat) => sum + cat.emojis.length,
    0
  );

  return (
    <div className="mb-4 rounded-xl border border-border bg-bg-surface">
      <div className="border-b border-border p-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          className="w-full rounded-lg bg-bg-primary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
        />
      </div>
      <div className="max-h-48 overflow-y-auto p-2">
        {totalResults === 0 ? (
          <p className="py-4 text-center text-sm text-text-tertiary">
            No emoji found
          </p>
        ) : (
          filtered.map((cat) => (
            <div key={cat.name} className="mb-2 last:mb-0">
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                {cat.name}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {cat.emojis.map((em) => (
                  <button
                    key={em.e}
                    type="button"
                    onClick={() => onSelect(em.e)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-bg-elevated"
                  >
                    {em.e}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
