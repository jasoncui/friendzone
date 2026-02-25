import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { useGroupContext } from "@/lib/UserContext";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface Props {
  channelId: Id<"channels">;
}

export function FlightsTab({ channelId }: Props) {
  const { currentUser, memberMap } = useGroupContext();
  const flights = useQuery(api.eventTravel.getFlights, { channelId });
  const [showForm, setShowForm] = useState(false);

  if (!flights) return null;

  const booked = flights.filter((f) => f.status === "booked");
  const options = flights.filter((f) => f.status === "option");

  return (
    <div className="flex flex-col gap-4">
      {booked.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-hangout">
            Booked ({booked.length})
          </h4>
          <div className="flex flex-col gap-2">
            {booked.map((flight) => (
              <FlightCard
                key={flight._id}
                flight={flight}
                currentUserId={currentUser._id}
                memberMap={memberMap}
              />
            ))}
          </div>
        </div>
      )}

      {options.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-event">
            Options ({options.length})
          </h4>
          <div className="flex flex-col gap-2">
            {options.map((flight) => (
              <FlightCard
                key={flight._id}
                flight={flight}
                currentUserId={currentUser._id}
                memberMap={memberMap}
              />
            ))}
          </div>
        </div>
      )}

      {flights.length === 0 && !showForm && (
        <p className="text-sm text-text-tertiary">
          No flights added yet.
        </p>
      )}

      {showForm ? (
        <AddFlightForm
          channelId={channelId}
          onClose={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-tertiary transition-colors hover:bg-bg-surface hover:text-text-secondary"
        >
          <span className="text-lg leading-none">+</span>
          Add flight
        </button>
      )}
    </div>
  );
}

function FlightCard({
  flight,
  currentUserId,
  memberMap,
}: {
  flight: Doc<"eventFlights">;
  currentUserId: Id<"users">;
  memberMap: Map<string, Doc<"users">>;
}) {
  const joinFlight = useMutation(api.eventTravel.joinFlight);
  const leaveFlight = useMutation(api.eventTravel.leaveFlight);
  const updateStatus = useMutation(api.eventTravel.updateFlightStatus);
  const deleteFlight = useMutation(api.eventTravel.deleteFlight);

  const isPassenger = flight.passengers.includes(currentUserId);
  const isCreator = flight.createdBy === currentUserId;
  const dep = new Date(flight.departureTime);
  const arr = new Date(flight.arrivalTime);

  const timeFormat: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-3">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">
            {flight.airline} {flight.flightNumber}
          </p>
          <p className="text-xs text-text-secondary">
            {flight.departureAirport} {"\u2192"} {flight.arrivalAirport}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            flight.status === "booked"
              ? "bg-accent-hangout/20 text-accent-hangout"
              : "bg-accent-event/20 text-accent-event"
          )}
        >
          {flight.status === "booked" ? "Booked" : "Option"}
        </span>
      </div>

      <div className="mb-2 text-xs text-text-tertiary">
        <p>{dep.toLocaleDateString(undefined, timeFormat)}</p>
        <p>{arr.toLocaleDateString(undefined, timeFormat)}</p>
      </div>

      {flight.notes && (
        <p className="mb-2 text-xs text-text-tertiary italic">{flight.notes}</p>
      )}

      <div className="mb-2 flex items-center gap-1">
        {flight.passengers.map((userId) => {
          const user = memberMap.get(userId as string);
          if (!user) return null;
          return (
            <Avatar
              key={userId}
              name={user.name}
              url={user.avatarUrl}
              size="sm"
            />
          );
        })}
      </div>

      <div className="flex gap-2">
        {isPassenger ? (
          <button
            onClick={() => leaveFlight({ flightId: flight._id })}
            className="rounded-lg border border-border px-2 py-1 text-xs text-text-tertiary hover:text-text-secondary"
          >
            Leave
          </button>
        ) : (
          <button
            onClick={() => joinFlight({ flightId: flight._id })}
            className="rounded-lg bg-accent-event/20 px-2 py-1 text-xs font-medium text-accent-event hover:bg-accent-event/30"
          >
            I'm on this flight
          </button>
        )}
        {isCreator && (
          <>
            <button
              onClick={() =>
                updateStatus({
                  flightId: flight._id,
                  status: flight.status === "booked" ? "option" : "booked",
                })
              }
              className="rounded-lg border border-border px-2 py-1 text-xs text-text-tertiary hover:text-text-secondary"
            >
              {flight.status === "booked" ? "Unbook" : "Mark booked"}
            </button>
            <button
              onClick={() => deleteFlight({ flightId: flight._id })}
              className="rounded-lg px-2 py-1 text-xs text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AddFlightForm({
  channelId,
  onClose,
}: {
  channelId: Id<"channels">;
  onClose: () => void;
}) {
  const addFlight = useMutation(api.eventTravel.addFlight);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    airline: "",
    flightNumber: "",
    departureAirport: "",
    arrivalAirport: "",
    departureTime: "",
    arrivalTime: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.airline.trim() || !form.flightNumber.trim()) return;
    setLoading(true);
    try {
      await addFlight({
        channelId,
        airline: form.airline.trim(),
        flightNumber: form.flightNumber.trim(),
        departureAirport: form.departureAirport.trim(),
        arrivalAirport: form.arrivalAirport.trim(),
        departureTime: new Date(form.departureTime).getTime(),
        arrivalTime: new Date(form.arrivalTime).getTime(),
        notes: form.notes.trim() || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-bg-surface p-3"
    >
      <h4 className="mb-3 text-sm font-medium text-text-primary">
        Add Flight
      </h4>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Airline"
            value={form.airline}
            onChange={(e) => setForm({ ...form, airline: e.target.value })}
            className={inputClass}
            autoFocus
          />
          <input
            type="text"
            placeholder="Flight #"
            value={form.flightNumber}
            onChange={(e) =>
              setForm({ ...form, flightNumber: e.target.value })
            }
            className={inputClass}
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="From (e.g. SFO)"
            value={form.departureAirport}
            onChange={(e) =>
              setForm({ ...form, departureAirport: e.target.value })
            }
            className={inputClass}
          />
          <input
            type="text"
            placeholder="To (e.g. JFK)"
            value={form.arrivalAirport}
            onChange={(e) =>
              setForm({ ...form, arrivalAirport: e.target.value })
            }
            className={inputClass}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-text-tertiary">
              Departure
            </label>
            <input
              type="datetime-local"
              value={form.departureTime}
              onChange={(e) =>
                setForm({ ...form, departureTime: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-text-tertiary">
              Arrival
            </label>
            <input
              type="datetime-local"
              value={form.arrivalTime}
              onChange={(e) =>
                setForm({ ...form, arrivalTime: e.target.value })
              }
              className={inputClass}
            />
          </div>
        </div>
        <input
          type="text"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={
            loading || !form.airline.trim() || !form.flightNumber.trim()
          }
          className="rounded-lg bg-accent-action px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-accent-action/80 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Flight"}
        </button>
      </div>
    </form>
  );
}
