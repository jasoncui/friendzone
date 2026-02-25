import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { useGroupContext } from "@/lib/UserContext";
import { Avatar } from "@/components/ui/Avatar";

const GRID_SIZE = 16; // 16x16 pixel grid for authentic 8-bit look
const CELL_SIZE = 8;  // each pixel renders as 8x8 in the SVG

function imageToPixelSvg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      canvas.width = GRID_SIZE;
      canvas.height = GRID_SIZE;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE);

      const { data } = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
      const totalSize = GRID_SIZE * CELL_SIZE;

      let rects = "";
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const i = (y * GRID_SIZE + x) * 4;
          const r = data[i] ?? 0, g = data[i + 1] ?? 0, b = data[i + 2] ?? 0, a = data[i + 3] ?? 0;
          if (a > 10) {
            rects += `<rect x="${x * CELL_SIZE}" y="${y * CELL_SIZE}" width="${CELL_SIZE}" height="${CELL_SIZE}" fill="rgb(${r},${g},${b})" opacity="${(a / 255).toFixed(2)}"/>`;
          }
        }
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges">${rects}</svg>`;
      resolve(`data:image/svg+xml;base64,${btoa(svg)}`);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export function Profile() {
  const { currentUser, group } = useGroupContext();
  const updateProfile = useMutation(api.users.updateProfile);

  const currentMember = group.members.find((m) => m.userId === currentUser._id);

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(currentUser.avatarUrl);
  const [pendingAvatarDataUrl, setPendingAvatarDataUrl] = useState<string | undefined>();
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    try {
      const dataUrl = await imageToPixelSvg(file);
      setPendingAvatarDataUrl(dataUrl);
      setAvatarPreview(dataUrl);
    } catch {
      // failed to process image
    } finally {
      setProcessing(false);
      // reset so the same file can be re-selected
      e.target.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: name.trim(),
        username: username.trim(),
        avatarDataUrl: pendingAvatarDataUrl,
      });
      setPendingAvatarDataUrl(undefined);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-bg-secondary px-4 py-3">
        <h2 className="font-display text-lg font-semibold">👤 Profile</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-md space-y-8">

          {/* Avatar */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Avatar
            </h3>
            <div className="rounded-xl border border-border bg-bg-surface p-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <Avatar
                    name={name || currentUser.name}
                    url={avatarPreview}
                    size="lg"
                  />
                  {processing && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-bg-primary/70 text-xs">
                      ⟳
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-sm text-text-secondary">
                    Upload a photo — it'll be pixelated into 8-bit style.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Choose photo"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Display Name */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Display Name
            </h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-border bg-bg-surface px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
            />
          </section>

          {/* Username */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Username
            </h3>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-4 py-3 focus-within:border-border-focus">
              <span className="text-text-tertiary">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />
            </div>
          </section>

          {/* Role (read-only) */}
          {currentMember && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Role in {group.name}
              </h3>
              <div className="rounded-xl border border-border bg-bg-surface px-4 py-3">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium capitalize",
                    currentMember.role === "owner"
                      ? "bg-trophy-gold/20 text-trophy-gold"
                      : currentMember.role === "admin"
                        ? "bg-accent-bracket/20 text-accent-bracket"
                        : "bg-bg-elevated text-text-tertiary"
                  )}
                >
                  {currentMember.role}
                </span>
              </div>
            </section>
          )}

          {/* Save */}
          {error && (
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !username.trim()}
            className="w-full rounded-lg bg-accent-action px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-accent-action/80 disabled:opacity-50"
          >
            {saved ? "Saved!" : saving ? "Saving..." : "Save Profile"}
          </button>

        </div>
      </div>
    </div>
  );
}
