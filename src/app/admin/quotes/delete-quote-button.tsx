"use client";

import { useState } from "react";

export default function DeleteQuoteButton({
  id,
  action,
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirmed) {
          event.preventDefault();

          const result = window.confirm(
            "Are you sure you want to permanently delete this quotation?"
          );

          if (result) {
            setConfirmed(true);
            event.currentTarget.requestSubmit();
          }
        }
      }}
    >
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        className="rounded-xl border border-red-500/40 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10"
      >
        Delete quotation
      </button>
    </form>
  );
}
