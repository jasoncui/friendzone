import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Modal } from "@/components/ui/Modal";
import { getChannelIcon } from "@/lib/channelUtils";
import { EmojiIconPicker } from "./EmojiIconPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  channel: Doc<"channels">;
}

export function EditChannelModal({ open, onClose, channel }: Props) {
  const updateChannel = useMutation(api.channels.update);

  const [name, setName] = useState(channel.name);
  const [icon, setIcon] = useState(channel.icon ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(channel.name);
      setIcon(channel.icon ?? "");
      setShowEmojiPicker(false);
      setLoading(false);
    }
  }, [open, channel._id, channel.name, channel.icon]);

  const displayIcon = icon || getChannelIcon(channel.type);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateChannel({
        channelId: channel._id,
        name: name.trim(),
        icon: icon,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Channel">
      <form onSubmit={handleSave}>
        <div className="mb-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-bg-surface text-3xl transition-colors hover:border-border-focus"
          >
            {displayIcon}
          </button>
          <p className="mt-1 text-xs text-text-tertiary">
            Tap to change icon
          </p>
          {icon && (
            <button
              type="button"
              onClick={() => setIcon("")}
              className="mt-1 text-xs text-text-tertiary hover:text-text-secondary"
            >
              Reset to default
            </button>
          )}
        </div>

        {showEmojiPicker && (
          <EmojiIconPicker
            onSelect={(emoji) => {
              setIcon(emoji);
              setShowEmojiPicker(false);
            }}
          />
        )}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Channel name"
          autoFocus
          className="mb-4 w-full rounded-lg border border-border bg-bg-surface px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-lg bg-accent-action px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-action/80 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
