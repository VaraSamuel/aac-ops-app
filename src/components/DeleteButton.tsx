"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({
  action,
  confirmMessage = "Delete this? This can't be undone.",
  label = "Delete",
  className = "",
  redirectTo,
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
  label?: string;
  className?: string;
  redirectTo?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(confirmMessage)) return;
        startTransition(async () => {
          await action();
          if (redirectTo) router.push(redirectTo);
        });
      }}
      className={`text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md px-2 py-1 disabled:opacity-50 ${className}`}
    >
      {isPending ? "Deleting…" : label}
    </button>
  );
}
