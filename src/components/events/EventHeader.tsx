import type { Doc } from "../../../convex/_generated/dataModel";
import type { SidebarTab } from "./EventSidebarPanel";
import { RsvpBar } from "./RsvpBar";
import { cn } from "@/lib/utils";

interface Props {
  channel: Doc<"channels">;
  activeTab: SidebarTab | null;
  onTabChange: (tab: SidebarTab) => void;
}

const TAB_BUTTONS: { value: SidebarTab; label: string; icon: string }[] = [
  { value: "participants", label: "People", icon: "\u{1F465}" },
  { value: "checklist", label: "Checklist", icon: "\u2705" },
  { value: "flights", label: "Flights", icon: "\u2708\uFE0F" },
  { value: "accommodation", label: "Stay", icon: "\u{1F3E0}" },
  { value: "splits", label: "Splits", icon: "\u{1F4B5}" },
];

export function EventHeader({ channel, activeTab, onTabChange }: Props) {
  const eventDate = channel.eventDate
    ? new Date(channel.eventDate)
    : null;
  const isUpcoming = eventDate && eventDate.getTime() > Date.now();
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="border-b border-border bg-accent-event/5">
      <div className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {eventDate && (
              <div className="rounded-lg bg-accent-event/20 px-3 py-1.5 text-center">
                <div className="text-xs font-medium uppercase text-accent-event">
                  {eventDate.toLocaleDateString(undefined, { month: "short" })}
                </div>
                <div className="text-lg font-bold text-accent-event">
                  {eventDate.getDate()}
                </div>
              </div>
            )}
            <div>
              {channel.eventLocation && (
                <p className="text-sm text-text-secondary">
                  {"\u{1F4CD}"} {channel.eventLocation}
                </p>
              )}
              {isUpcoming && daysUntil !== null && daysUntil > 0 && (
                <p className="text-xs text-accent-event">
                  {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {TAB_BUTTONS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => onTabChange(value)}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  activeTab === value
                    ? "bg-accent-event/20 text-accent-event"
                    : "text-text-tertiary hover:bg-bg-surface hover:text-text-secondary"
                )}
                title={label}
              >
                <span className="text-sm">{icon}</span>
              </button>
            ))}
          </div>
        </div>

        <RsvpBar channelId={channel._id} />
      </div>
    </div>
  );
}
