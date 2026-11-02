"use client";

import { useState } from "react";

export default function ImageUploadField({ initialValue = "" }: { initialValue?: string }) {
  const [url, setUrl] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      setUrl(result.url);
      setMessage("Image uploaded. Save the project to keep this URL.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="md:col-span-2">
    <label className="block text-sm font-medium">Cover image URL
      <input name="image_url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--bg)] px-4 py-3" />
    </label>
    <label className="mt-3 block text-sm font-medium">Or upload an image (JPEG, PNG, WebP, AVIF; max 4 MB)
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => void upload(event.target.files?.[0])} className="mt-2 block w-full text-sm" />
    </label>
    {busy && <p className="mt-2 text-sm text-[var(--muted)]">Uploading image…</p>}
    {message && <p role="status" className="mt-2 text-sm text-[var(--muted)]">{message}</p>}
    {url && <img src={url} alt="Selected project cover preview" className="mt-4 max-h-48 rounded-xl border border-[var(--card-border)] object-contain" />}
  </div>;
}
