import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams } from "react-router";
import { cn } from "@/lib/utils";
import { getChannelIcon } from "@/lib/channelUtils";
import type { Doc } from "../../../convex/_generated/dataModel";

interface Props {
  channel: Doc<"channels">;
  onEdit?: (channel: Doc<"channels">) => void;
}

export function ChannelSidebarItem({ channel, onEdit }: Props) {
  const { channelId, bracketId } = useParams();
  const isActive =
    channelId === channel._id || bracketId === channel._id;

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const href =
    channel.type === "bracket"
      ? `/g/${channel.groupId}/bracket/${channel._id}`
      : `/g/${channel.groupId}/channel/${channel._id}`;

  const accentColor = {
    hangout: "text-accent-hangout",
    event: "text-accent-event",
    bracket: "text-accent-bracket",
  }[channel.type];

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <>
      <Link
        to={href}
        onContextMenu={handleContextMenu}
        className={cn(
          "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-bg-elevated text-text-primary"
            : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
        )}
      >
        <span className={cn("text-base", accentColor)}>
          {getChannelIcon(channel.type, channel.icon)}
        </span>
        <span className={cn("min-w-0 flex-1 truncate", channel.isArchived && "line-through opacity-50")}>
          {channel.name}
        </span>
        {onEdit && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(channel);
            }}
            className="shrink-0 rounded p-0.5 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-secondary"
          >
            <span className="text-xs">{"\u2022\u2022\u2022"}</span>
          </button>
        )}
      </Link>

      {contextMenu && onEdit && createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 rounded-lg border border-border bg-bg-elevated py-1 shadow-xl"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                setContextMenu(null);
                onEdit(channel);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-surface"
            >
              <span>{"\u270F\uFE0F"}</span> Edit Channel
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
