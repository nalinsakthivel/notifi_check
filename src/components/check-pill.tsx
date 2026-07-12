"use client";

export function CheckPill({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-sm transition-colors ${
        checked
          ? "border-accent bg-accent/10 text-foreground"
          : "border-border bg-panel text-mute hover:border-mute"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 shrink-0 accent-accent"
      />
      {label}
    </label>
  );
}
