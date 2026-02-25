import { motion } from "framer-motion";
import type { Id } from "../../../convex/_generated/dataModel";
import { Checklist } from "./Checklist";
import { EventSplits } from "./EventSplits";
import { ParticipantsTab } from "./ParticipantsTab";
import { FlightsTab } from "./FlightsTab";
import { AccommodationTab } from "./AccommodationTab";

export type SidebarTab =
  | "participants"
  | "checklist"
  | "flights"
  | "accommodation"
  | "splits";

const TAB_LABELS: Record<SidebarTab, string> = {
  participants: "People",
  checklist: "Checklist",
  flights: "Flights",
  accommodation: "Accommodation",
  splits: "Splits",
};

interface Props {
  channelId: Id<"channels">;
  activeTab: SidebarTab;
  onClose: () => void;
}

export function EventSidebarPanel({
  channelId,
  activeTab,
  onClose,
}: Props) {
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex shrink-0 flex-col overflow-hidden border-l border-border bg-bg-secondary"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h3 className="text-sm font-semibold text-text-primary">
          {TAB_LABELS[activeTab]}
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-text-tertiary transition-colors hover:bg-bg-surface hover:text-text-primary"
        >
          <span className="text-sm">{"\u2715"}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "participants" && (
          <ParticipantsTab channelId={channelId} />
        )}
        {activeTab === "checklist" && <Checklist channelId={channelId} />}
        {activeTab === "flights" && <FlightsTab channelId={channelId} />}
        {activeTab === "accommodation" && (
          <AccommodationTab channelId={channelId} />
        )}
        {activeTab === "splits" && <EventSplits channelId={channelId} />}
      </div>
    </motion.div>
  );
}
