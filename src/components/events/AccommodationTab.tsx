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

const TYPE_ICONS: Record<string, string> = {
  airbnb: "\u{1F3E0}",
  hotel: "\u{1F3E8}",
  hostel: "\u{1F6CF}\uFE0F",
  other: "\u{1F4CD}",
};

export function AccommodationTab({ channelId }: Props) {
  const { currentUser, memberMap } = useGroupContext();
  const accommodations = useQuery(api.eventTravel.getAccommodations, {
    channelId,
  });
  const [showForm, setShowForm] = useState(false);

  if (!accommodations) return null;

  const booked = accommodations.filter((a) => a.status === "booked");
  const options = accommodations.filter((a) => a.status === "option");

  return (
    <div className="flex flex-col gap-4">
      {booked.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-hangout">
            Booked ({booked.length})
          </h4>
          <div className="flex flex-col gap-2">
            {booked.map((acc) => (
              <AccommodationCard
                key={acc._id}
                accommodation={acc}
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
            {options.map((acc) => (
              <AccommodationCard
                key={acc._id}
                accommodation={acc}
                currentUserId={currentUser._id}
                memberMap={memberMap}
              />
            ))}
          </div>
        </div>
      )}

      {accommodations.length === 0 && !showForm && (
        <p className="text-sm text-text-tertiary">
          No accommodation added yet.
        </p>
      )}

      {showForm ? (
        <AddAccommodationForm
          channelId={channelId}
          onClose={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-tertiary transition-colors hover:bg-bg-surface hover:text-text-secondary"
        >
          <span className="text-lg leading-none">+</span>
          Add accommodation
        </button>
      )}
    </div>
  );
}

function AccommodationCard({
  accommodation,
  currentUserId,
  memberMap,
}: {
  accommodation: Doc<"eventAccommodations">;
  currentUserId: Id<"users">;
  memberMap: Map<string, Doc<"users">>;
}) {
  const joinAccommodation = useMutation(api.eventTravel.joinAccommodation);
  const leaveAccommodation = useMutation(api.eventTravel.leaveAccommodation);
  const updateStatus = useMutation(api.eventTravel.updateAccommodationStatus);
  const deleteAccommodation = useMutation(api.eventTravel.deleteAccommodation);

  const isGuest = accommodation.guests.includes(currentUserId);
  const isCreator = accommodation.createdBy === currentUserId;

  const dateFormat: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-3">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-start gap-2">
          <span className="text-lg">
            {TYPE_ICONS[accommodation.type] || TYPE_ICONS.other}
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {accommodation.name}
            </p>
            <p className="text-xs capitalize text-text-tertiary">
              {accommodation.type}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            accommodation.status === "booked"
              ? "bg-accent-hangout/20 text-accent-hangout"
              : "bg-accent-event/20 text-accent-event"
          )}
        >
          {accommodation.status === "booked" ? "Booked" : "Option"}
        </span>
      </div>

      {accommodation.address && (
        <p className="mb-1 text-xs text-text-secondary">
          {"\u{1F4CD}"} {accommodation.address}
        </p>
      )}

      {(accommodation.checkIn || accommodation.checkOut) && (
        <p className="mb-1 text-xs text-text-tertiary">
          {accommodation.checkIn &&
            `In: ${new Date(accommodation.checkIn).toLocaleDateString(undefined, dateFormat)}`}
          {accommodation.checkIn && accommodation.checkOut && " \u2014 "}
          {accommodation.checkOut &&
            `Out: ${new Date(accommodation.checkOut).toLocaleDateString(undefined, dateFormat)}`}
        </p>
      )}

      {(accommodation.pricePerNight || accommodation.totalPrice) && (
        <p className="mb-1 text-xs text-text-tertiary">
          {accommodation.pricePerNight &&
            `$${(accommodation.pricePerNight / 100).toFixed(0)}/night`}
          {accommodation.pricePerNight && accommodation.totalPrice && " \u00B7 "}
          {accommodation.totalPrice &&
            `$${(accommodation.totalPrice / 100).toFixed(0)} total`}
        </p>
      )}

      {accommodation.bookingLink && (
        <a
          href={accommodation.bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 block text-xs text-accent-action hover:underline"
        >
          Booking link {"\u2197"}
        </a>
      )}

      {accommodation.notes && (
        <p className="mb-2 text-xs text-text-tertiary italic">
          {accommodation.notes}
        </p>
      )}

      <div className="mb-2 flex items-center gap-1">
        {accommodation.guests.map((userId) => {
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
        {isGuest ? (
          <button
            onClick={() =>
              leaveAccommodation({ accommodationId: accommodation._id })
            }
            className="rounded-lg border border-border px-2 py-1 text-xs text-text-tertiary hover:text-text-secondary"
          >
            Leave
          </button>
        ) : (
          <button
            onClick={() =>
              joinAccommodation({ accommodationId: accommodation._id })
            }
            className="rounded-lg bg-accent-event/20 px-2 py-1 text-xs font-medium text-accent-event hover:bg-accent-event/30"
          >
            I'm staying here
          </button>
        )}
        {isCreator && (
          <>
            <button
              onClick={() =>
                updateStatus({
                  accommodationId: accommodation._id,
                  status:
                    accommodation.status === "booked" ? "option" : "booked",
                })
              }
              className="rounded-lg border border-border px-2 py-1 text-xs text-text-tertiary hover:text-text-secondary"
            >
              {accommodation.status === "booked" ? "Unbook" : "Mark booked"}
            </button>
            <button
              onClick={() =>
                deleteAccommodation({ accommodationId: accommodation._id })
              }
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

function AddAccommodationForm({
  channelId,
  onClose,
}: {
  channelId: Id<"channels">;
  onClose: () => void;
}) {
  const addAccommodation = useMutation(api.eventTravel.addAccommodation);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "airbnb" as "airbnb" | "hotel" | "hostel" | "other",
    address: "",
    checkIn: "",
    checkOut: "",
    bookingLink: "",
    pricePerNight: "",
    totalPrice: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await addAccommodation({
        channelId,
        name: form.name.trim(),
        type: form.type,
        address: form.address.trim() || undefined,
        checkIn: form.checkIn ? new Date(form.checkIn).getTime() : undefined,
        checkOut: form.checkOut
          ? new Date(form.checkOut).getTime()
          : undefined,
        bookingLink: form.bookingLink.trim() || undefined,
        pricePerNight: form.pricePerNight
          ? Math.round(parseFloat(form.pricePerNight) * 100)
          : undefined,
        totalPrice: form.totalPrice
          ? Math.round(parseFloat(form.totalPrice) * 100)
          : undefined,
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
        Add Accommodation
      </h4>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Name (e.g. Airbnb Downtown)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
          autoFocus
        />
        <div className="flex gap-1">
          {(["airbnb", "hotel", "hostel", "other"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, type: t })}
              className={cn(
                "rounded-lg px-2 py-1 text-xs font-medium capitalize transition-colors",
                form.type === t
                  ? "bg-accent-event/20 text-accent-event"
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              {TYPE_ICONS[t]} {t}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Address (optional)"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className={inputClass}
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-text-tertiary">
              Check-in
            </label>
            <input
              type="date"
              value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-text-tertiary">
              Check-out
            </label>
            <input
              type="date"
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <input
          type="text"
          placeholder="Booking link (optional)"
          value={form.bookingLink}
          onChange={(e) => setForm({ ...form, bookingLink: e.target.value })}
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="$/night"
            value={form.pricePerNight}
            onChange={(e) =>
              setForm({ ...form, pricePerNight: e.target.value })
            }
            className={inputClass}
            step="0.01"
            min="0"
          />
          <input
            type="number"
            placeholder="$ total"
            value={form.totalPrice}
            onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
            className={inputClass}
            step="0.01"
            min="0"
          />
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
          disabled={loading || !form.name.trim()}
          className="rounded-lg bg-accent-action px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-accent-action/80 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}
