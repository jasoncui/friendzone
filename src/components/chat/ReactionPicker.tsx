import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { EMOJI_CATEGORIES } from "@/lib/emojiData";

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  isOwn?: boolean;
}

export function ReactionPicker({ onSelect, onClose, anchorRef, isOwn }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const pickerWidth = 288;
      const pickerApproxHeight = 340;

      let top =
        rect.top > pickerApproxHeight + 8
          ? rect.top - pickerApproxHeight - 8
          : rect.bottom + 8;

      let left = isOwn ? rect.right - pickerWidth : rect.left;

      if (left < 8) left = 8;
      if (left + pickerWidth > window.innerWidth - 8)
        left = window.innerWidth - pickerWidth - 8;
      if (top < 8) top = 8;

      setPosition({ top, left });
    }
  }, [anchorRef, isOwn]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

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

  if (!position) return null;

  return createPortal(
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      style={{ position: "fixed", top: position.top, left: position.left }}
      className="z-50 w-72 rounded-xl border border-border bg-bg-elevated shadow-2xl"
    >
      <div className="border-b border-border p-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          autoFocus
          className="w-full rounded-lg bg-bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-border-focus"
        />
      </div>

      <div className="max-h-56 overflow-y-auto p-2">
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
                    onClick={() => onSelect(em.e)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-bg-surface"
                  >
                    {em.e}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>,
    document.body
  );
}
