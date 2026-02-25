import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";

// ─── HELPERS ──────────────────────────────────────────────

import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function getChannelAndAssertMember(
  ctx: QueryCtx | MutationCtx,
  channelId: Id<"channels">
) {
  const user = await getCurrentUser(ctx);
  const channel = await ctx.db.get(channelId);
  if (!channel) throw new Error("Channel not found");
  await assertGroupMember(ctx, channel.groupId, user._id);
  return { user, channel };
}

// ─── FLIGHTS ──────────────────────────────────────────────

export const getFlights = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await getChannelAndAssertMember(ctx, args.channelId);
    return await ctx.db
      .query("eventFlights")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();
  },
});

export const addFlight = mutation({
  args: {
    channelId: v.id("channels"),
    airline: v.string(),
    flightNumber: v.string(),
    departureAirport: v.string(),
    arrivalAirport: v.string(),
    departureTime: v.number(),
    arrivalTime: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getChannelAndAssertMember(ctx, args.channelId);
    return await ctx.db.insert("eventFlights", {
      ...args,
      createdBy: user._id,
      status: "option",
      passengers: [user._id],
      createdAt: Date.now(),
    });
  },
});

export const joinFlight = mutation({
  args: { flightId: v.id("eventFlights") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flightId);
    if (!flight) throw new Error("Flight not found");
    const { user } = await getChannelAndAssertMember(ctx, flight.channelId);
    if (flight.passengers.includes(user._id)) return;
    await ctx.db.patch(args.flightId, {
      passengers: [...flight.passengers, user._id],
    });
  },
});

export const leaveFlight = mutation({
  args: { flightId: v.id("eventFlights") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flightId);
    if (!flight) throw new Error("Flight not found");
    const { user } = await getChannelAndAssertMember(ctx, flight.channelId);
    await ctx.db.patch(args.flightId, {
      passengers: flight.passengers.filter((id) => id !== user._id),
    });
  },
});

export const updateFlightStatus = mutation({
  args: {
    flightId: v.id("eventFlights"),
    status: v.union(v.literal("option"), v.literal("booked")),
  },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flightId);
    if (!flight) throw new Error("Flight not found");
    const { user } = await getChannelAndAssertMember(ctx, flight.channelId);
    if (flight.createdBy !== user._id) throw new Error("Only the creator can update status");
    await ctx.db.patch(args.flightId, { status: args.status });
  },
});

export const deleteFlight = mutation({
  args: { flightId: v.id("eventFlights") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.flightId);
    if (!flight) throw new Error("Flight not found");
    const { user } = await getChannelAndAssertMember(ctx, flight.channelId);
    if (flight.createdBy !== user._id) throw new Error("Only the creator can delete");
    await ctx.db.delete(args.flightId);
  },
});

// ─── ACCOMMODATIONS ───────────────────────────────────────

export const getAccommodations = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    await getChannelAndAssertMember(ctx, args.channelId);
    return await ctx.db
      .query("eventAccommodations")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();
  },
});

export const addAccommodation = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.string(),
    type: v.union(
      v.literal("airbnb"),
      v.literal("hotel"),
      v.literal("hostel"),
      v.literal("other")
    ),
    address: v.optional(v.string()),
    checkIn: v.optional(v.number()),
    checkOut: v.optional(v.number()),
    bookingLink: v.optional(v.string()),
    pricePerNight: v.optional(v.number()),
    totalPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await getChannelAndAssertMember(ctx, args.channelId);
    return await ctx.db.insert("eventAccommodations", {
      ...args,
      createdBy: user._id,
      status: "option",
      guests: [user._id],
      createdAt: Date.now(),
    });
  },
});

export const joinAccommodation = mutation({
  args: { accommodationId: v.id("eventAccommodations") },
  handler: async (ctx, args) => {
    const accommodation = await ctx.db.get(args.accommodationId);
    if (!accommodation) throw new Error("Accommodation not found");
    const { user } = await getChannelAndAssertMember(ctx, accommodation.channelId);
    if (accommodation.guests.includes(user._id)) return;
    await ctx.db.patch(args.accommodationId, {
      guests: [...accommodation.guests, user._id],
    });
  },
});

export const leaveAccommodation = mutation({
  args: { accommodationId: v.id("eventAccommodations") },
  handler: async (ctx, args) => {
    const accommodation = await ctx.db.get(args.accommodationId);
    if (!accommodation) throw new Error("Accommodation not found");
    const { user } = await getChannelAndAssertMember(ctx, accommodation.channelId);
    await ctx.db.patch(args.accommodationId, {
      guests: accommodation.guests.filter((id) => id !== user._id),
    });
  },
});

export const updateAccommodationStatus = mutation({
  args: {
    accommodationId: v.id("eventAccommodations"),
    status: v.union(v.literal("option"), v.literal("booked")),
  },
  handler: async (ctx, args) => {
    const accommodation = await ctx.db.get(args.accommodationId);
    if (!accommodation) throw new Error("Accommodation not found");
    const { user } = await getChannelAndAssertMember(ctx, accommodation.channelId);
    if (accommodation.createdBy !== user._id) throw new Error("Only the creator can update status");
    await ctx.db.patch(args.accommodationId, { status: args.status });
  },
});

export const deleteAccommodation = mutation({
  args: { accommodationId: v.id("eventAccommodations") },
  handler: async (ctx, args) => {
    const accommodation = await ctx.db.get(args.accommodationId);
    if (!accommodation) throw new Error("Accommodation not found");
    const { user } = await getChannelAndAssertMember(ctx, accommodation.channelId);
    if (accommodation.createdBy !== user._id) throw new Error("Only the creator can delete");
    await ctx.db.delete(args.accommodationId);
  },
});
