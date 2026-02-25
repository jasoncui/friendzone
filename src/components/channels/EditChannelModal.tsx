import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Modal } from "@/components/ui/Modal";
import { getChannelIcon } from "@/lib/channelUtils";
import { EmojiIconPicker } from "./EmojiIconPicker";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  channel: Doc<"channels">;
}

function toDateInputValue(timestamp: number | undefined): string {
  if (!timestamp) return "";
  return new Date(timestamp).toISOString().split("T")[0] ?? "";
}

export function EditChannelModal({ open, onClose, channel }: Props) {
  const updateChannel = useMutation(api.channels.update);

  const [name, setName] = useState(channel.name);
  const [icon, setIcon] = useState(channel.icon ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Event-specific fields
  const [eventDateMode, setEventDateMode] = useState<"single" | "range" | "tbd">(
    channel.eventDate ? (channel.eventEndDate ? "range" : "single") : "tbd"
  );
  const [eventDate, setEventDate] = useState(toDateInputValue(channel.eventDate));
  const [eventEndDate, setEventEndDate] = useState(toDateInputValue(channel.eventEndDate));
  const [eventLocation, setEventLocation] = useState(channel.eventLocation ?? "");

  useEffect(() => {
    if (open) {
      setName(channel.name);
      setIcon(channel.icon ?? "");
      setShowEmojiPicker(false);
      setLoading(false);
      setEventDateMode(
        channel.eventDate ? (channel.eventEndDate ? "range" : "single") : "tbd"
      );
      setEventDate(toDateInputValue(channel.eventDate));
      setEventEndDate(toDateInputValue(channel.eventEndDate));
      setEventLocation(channel.eventLocation ?? "");
    }
  }, [open, channel._id, channel.name, channel.icon, channel.eventDate, channel.eventEndDate, channel.eventLocation]);

  const displayIcon = icon || getChannelIcon(channel.type);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const isEvent = channel.type === "event";
      await updateChannel({
        channelId: channel._id,
        name: name.trim(),
        icon: icon,
        ...(isEvent && {
          eventDate:
            eventDateMode !== "tbd" && eventDate
              ? new Date(eventDate).getTime()
              : undefined,
          clearEventDate: eventDateMode === "tbd" ? true : undefined,
          eventEndDate:
            eventDateMode === "range" && eventEndDate
              ? new Date(eventEndDate).getTime()
              : undefined,
          clearEventEndDate: eventDateMode !== "range" ? true : undefined,
          eventLocation: eventLocation.trim() || undefined,
          clearEventLocation: !eventLocation.trim() ? true : undefined,
        }),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-bg-surface px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none";

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
          className={cn(inputClass, "mb-4")}
        />

        {channel.type === "event" && (
          <div className="mb-4 flex flex-col gap-2">
            <label className="text-xs font-medium text-text-secondary">
              Event Date
            </label>
            <div className="flex gap-1">
              {(["single", "range", "tbd"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setEventDateMode(mode)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    eventDateMode === mode
                      ? "bg-accent-event/20 text-accent-event"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  {mode === "tbd" ? "TBD" : mode === "single" ? "Date" : "Range"}
                </button>
              ))}
            </div>
            {eventDateMode !== "tbd" && (
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={inputClass}
              />
            )}
            {eventDateMode === "range" && (
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                className={inputClass}
              />
            )}
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Location (optional)"
              className={inputClass}
            />
          </div>
        )}

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
