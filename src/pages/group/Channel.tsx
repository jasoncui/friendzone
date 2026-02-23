import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { cn } from "../../lib/utils";

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return (
    date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  );
}

function MessageBubble({
  message,
  isOwn,
  authorName,
  avatarUrl,
}: {
  message: Doc<"messages">;
  isOwn: boolean;
  authorName: string;
  avatarUrl?: string;
}) {
  if (message.messageType === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="text-text-tertiary text-xs italic">
          {message.body}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-end gap-2 max-w-[80%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={authorName}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-elevated text-text-secondary text-xs font-semibold">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        {!isOwn && (
          <span className="text-text-secondary text-xs font-medium px-1">
            {authorName}
          </span>
        )}
        <div
          className={cn(
            "rounded-2xl px-3 py-2",
            isOwn
              ? "bg-accent-hangout text-bg-primary rounded-br-sm"
              : "bg-bg-elevated text-text-primary rounded-bl-sm"
          )}
        >
          {message.isDeleted ? (
            <p className="text-text-tertiary italic text-sm">
              [message deleted]
            </p>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.body}
            </p>
          )}
        </div>
        <span
          className={cn(
            "text-text-tertiary text-[10px] px-1",
            isOwn ? "text-right" : "text-left"
          )}
        >
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

function MessageBubbleWrapper({
  message,
  currentUserId,
}: {
  message: Doc<"messages">;
  currentUserId: Id<"users"> | undefined;
}) {
  const author = useQuery(api.users.getById, { userId: message.authorId });
  const isOwn = message.authorId === currentUserId;

  return (
    <MessageBubble
      message={message}
      isOwn={isOwn}
      authorName={author?.name ?? author?.username ?? "..."}
      avatarUrl={author?.avatarUrl}
    />
  );
}

function MessageComposer({ channelId }: { channelId: Id<"channels"> }) {
  const [body, setBody] = useState("");
  const sendMessage = useMutation(api.messages.send);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody("");
    await sendMessage({ channelId, body: trimmed });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border bg-bg-secondary p-3 flex gap-2"
    >
      <input
        type="text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-xl bg-bg-surface px-4 py-2 text-text-primary text-sm placeholder:text-text-tertiary border border-border focus:border-border-focus focus:outline-none"
      />
      <button
        type="submit"
        disabled={!body.trim()}
        className={cn(
          "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
          body.trim()
            ? "bg-accent-action text-white hover:bg-accent-action/80"
            : "bg-bg-elevated text-text-tertiary cursor-not-allowed"
        )}
      >
        Send
      </button>
    </form>
  );
}

export function Channel() {
  const { channelId: channelIdParam } = useParams();
  const channelId = channelIdParam as Id<"channels"> | undefined;

  const currentUser = useQuery(api.users.me);
  const channel = useQuery(
    api.channels.getById,
    channelId ? { channelId } : "skip"
  );
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.listByChannel,
    channelId ? { channelId } : "skip",
    { initialNumItems: 25 }
  );

  const messages = [...(results ?? [])].reverse();

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (currentUser === undefined || channel === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-tertiary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="bg-bg-secondary border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          # {channel?.name ?? "Channel"}
        </h2>
      </header>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {status === "CanLoadMore" && (
          <button
            onClick={() => loadMore(25)}
            className="text-text-secondary hover:text-text-primary self-center text-sm"
          >
            Load earlier messages
          </button>
        )}
        {status === "LoadingMore" && (
          <p className="text-text-tertiary self-center text-sm">Loading...</p>
        )}

        {messages.length === 0 && status !== "LoadingFirstPage" && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-text-tertiary">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubbleWrapper
            key={msg._id}
            message={msg}
            currentUserId={currentUser?._id}
          />
        ))}
      </div>

      {channelId && <MessageComposer channelId={channelId} />}
    </div>
  );
}
