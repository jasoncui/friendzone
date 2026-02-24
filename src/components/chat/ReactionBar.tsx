import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useGroupContext } from "@/lib/UserContext";

interface Props {
  messageId: Id<"messages">;
}

export function ReactionBar({ messageId }: Props) {
  const { currentUser } = useGroupContext();
  const reactions = useQuery(api.reactions.getByMessage, { messageId });
  const addReaction = useMutation(api.reactions.add);
  const removeReaction = useMutation(api.reactions.remove);

  if (!reactions || reactions.length === 0) {
    return null;
  }

  function handleToggle(emoji: string, userIds: string[]) {
    if (userIds.includes(currentUser._id as string)) {
      removeReaction({ messageId, emoji });
    } else {
      addReaction({ messageId, emoji });
    }
  }

  return (
    <div className="relative mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((r) => {
        const hasReacted = r.userIds.includes(currentUser._id as string);
        return (
          <motion.button
            key={r.emoji}
            layout
            onClick={() => handleToggle(r.emoji, r.userIds)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              hasReacted
                ? "border-accent-action/40 bg-accent-action/10 text-text-primary"
                : "border-border bg-bg-surface text-text-secondary hover:border-border-focus"
            )}
          >
            <span>{r.emoji}</span>
            <span className="font-mono text-[10px]">{r.count}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
