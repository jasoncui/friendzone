import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "convex/react";
import { AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { getChannelIcon } from "@/lib/channelUtils";
import { MessageFeed } from "@/components/chat/MessageFeed";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { RsvpBar } from "@/components/events/RsvpBar";
import { EventSidebarPanel } from "@/components/events/EventSidebarPanel";
import type { SidebarTab } from "@/components/events/EventSidebarPanel";
import { EditChannelModal } from "@/components/channels/EditChannelModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const TAB_BUTTONS: { value: SidebarTab; label: string; icon: string }[] = [
  { value: "participants", label: "People", icon: "\u{1F465}" },
  { value: "checklist", label: "Checklist", icon: "\u2705" },
  { value: "flights", label: "Flights", icon: "\u2708\uFE0F" },
  { value: "accommodation", label: "Stay", icon: "\u{1F3E0}" },
  { value: "splits", label: "Splits", icon: "\u{1F4B5}" },
];

export function Channel() {
  const { channelId: channelIdParam } = useParams();
  const channelId = channelIdParam as Id<"channels">;

  const channel = useQuery(api.channels.getById, { channelId });
  const [showEdit, setShowEdit] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab | null>(null);

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isEvent = channel.type === "event";
  const accentText = {
    hangout: "text-accent-hangout",
    event: "text-accent-event",
    bracket: "text-accent-bracket",
  }[channel.type];

  const eventDate = channel.eventDate ? new Date(channel.eventDate) : null;
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-bg-secondary px-4 py-3">
        <div className="flex items-center gap-3">
          <span className={cn("text-lg", accentText)}>
            {getChannelIcon(channel.type, channel.icon)}
          </span>
          <button
            onClick={() => setShowEdit(true)}
            className="min-w-0 flex-1 cursor-pointer text-left"
          >
            <h2 className="font-display truncate text-lg font-semibold hover:text-text-secondary transition-colors">
              {channel.name}
            </h2>
            {isEvent && (
              <p className="text-text-tertiary text-xs">
                {eventDate
                  ? eventDate.toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "Date TBD"}
                {channel.eventLocation && ` \u00B7 ${channel.eventLocation}`}
                {daysUntil !== null && daysUntil > 0 && (
                  <span className="text-accent-event">
                    {" \u00B7 "}
                    {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                  </span>
                )}
              </p>
            )}
          </button>

          {isEvent && (
            <div className="flex shrink-0 items-center gap-2">
              <RsvpBar channelId={channelId} />
              <div className="mx-1 h-6 w-px bg-border" />
              <div className="flex gap-0.5">
                {TAB_BUTTONS.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() =>
                      setSidebarTab((prev) => (prev === value ? null : value))
                    }
                    className={cn(
                      "rounded-lg px-1.5 py-1 text-sm transition-colors",
                      sidebarTab === value
                        ? "bg-accent-event/20 text-accent-event"
                        : "text-text-tertiary hover:bg-bg-surface hover:text-text-secondary"
                    )}
                    title={label}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <MessageFeed channelId={channelId} />
          <MessageComposer channelId={channelId} />
        </div>

        <AnimatePresence>
          {isEvent && sidebarTab && (
            <EventSidebarPanel
              channelId={channelId}
              activeTab={sidebarTab}
              onClose={() => setSidebarTab(null)}
            />
          )}
        </AnimatePresence>
      </div>

      <EditChannelModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        channel={channel}
      />
    </div>
  );
}
