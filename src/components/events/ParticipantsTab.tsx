import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useGroupContext } from "@/lib/UserContext";
import { Avatar } from "@/components/ui/Avatar";

interface Props {
  channelId: Id<"channels">;
}

const STATUS_SECTIONS = [
  { status: "going" as const, label: "Going", color: "text-accent-hangout" },
  { status: "maybe" as const, label: "Maybe", color: "text-accent-event" },
  { status: "not_going" as const, label: "Can't make it", color: "text-text-tertiary" },
];

export function ParticipantsTab({ channelId }: Props) {
  const { memberMap } = useGroupContext();
  const rsvps = useQuery(api.events.getRsvps, { channelId });

  if (!rsvps) return null;

  return (
    <div className="flex flex-col gap-4">
      {STATUS_SECTIONS.map(({ status, label, color }) => {
        const people = rsvps.filter((r) => r.status === status);
        if (people.length === 0) return null;
        return (
          <div key={status}>
            <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wider ${color}`}>
              {label} ({people.length})
            </h4>
            <div className="flex flex-col gap-1.5">
              {people.map((rsvp) => {
                const user = memberMap.get(rsvp.userId as string);
                if (!user) return null;
                return (
                  <div
                    key={rsvp._id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  >
                    <Avatar
                      name={user.name}
                      url={user.avatarUrl}
                      size="sm"
                    />
                    <span className="text-sm text-text-primary">
                      {user.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {rsvps.length === 0 && (
        <p className="text-sm text-text-tertiary">
          No RSVPs yet. Use the buttons above to respond.
        </p>
      )}
    </div>
  );
}
