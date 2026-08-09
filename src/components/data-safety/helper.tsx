"use client";

import { useMemo, useState } from "react";
import { CheckPill } from "@/components/check-pill";
import { DATA_GROUPS, SERVICES } from "@/lib/policy/types";
import {
  buildDataSafetyRows,
  emptyAnswer,
  emptyDataSafetyInput,
  toPlainText,
  type DataSafetyInput,
} from "@/lib/data-safety/engine";
import { CATEGORY_PURPOSE_HINTS, PURPOSES } from "@/lib/data-safety/purposes";

const labelClass = "text-xs tracking-widest text-mute";

export function DataSafetyHelper() {
  const [input, setInput] = useState<DataSafetyInput>(emptyDataSafetyInput());
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => buildDataSafetyRows(input), [input]);
  const text = useMemo(() => toPlainText(input), [input]);

  function toggleDataType(id: string, on: boolean) {
    setInput((prev) => {
      const answers = { ...prev.answers };
      if (on) {
        answers[id] = emptyAnswer();
      } else {
        delete answers[id];
      }
      return { ...prev, answers };
    });
  }

  function updateAnswer(id: string, patch: Partial<(typeof input.answers)[string]>) {
    setInput((prev) => ({
      ...prev,
      answers: { ...prev.answers, [id]: { ...prev.answers[id], ...patch } },
    }));
  }

  function togglePurpose(id: string, purpose: (typeof PURPOSES)[number], on: boolean) {
    setInput((prev) => {
      const current = prev.answers[id];
      if (!current) return prev;
      const purposes = on
        ? [...current.purposes, purpose]
        : current.purposes.filter((p) => p !== purpose);
      return { ...prev, answers: { ...prev.answers, [id]: { ...current, purposes } } };
    });
  }

  function toggleService(id: string, on: boolean) {
    setInput((prev) => ({
      ...prev,
      services: on ? [...prev.services, id] : prev.services.filter((s) => s !== id),
    }));
  }

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Data types */}
      <div className="flex flex-col gap-6">
        <p className="text-sm text-mute">
          Check every data type your app collects. Each one expands into the questions Play
          Console asks about it.
        </p>
        {DATA_GROUPS.map((group) => (
          <fieldset key={group.label} className="flex flex-col gap-2.5">
            <legend className="mb-1 text-sm font-medium text-foreground">{group.label}</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <CheckPill
                  key={item.id}
                  label={item.label}
                  checked={Boolean(input.answers[item.id])}
                  onChange={(on) => toggleDataType(item.id, on)}
                />
              ))}
            </div>
            {group.items
              .filter((item) => input.answers[item.id])
              .map((item) => {
                const answer = input.answers[item.id];
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-md border border-border/60 p-4"
                  >
                    <span className="text-xs tracking-widest text-accent">{item.label}</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-1.5">
                        <span className={labelClass}>SHARED_WITH_THIRD_PARTIES</span>
                        <select
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                          value={answer.shared ? "yes" : "no"}
                          onChange={(e) => updateAnswer(item.id, { shared: e.target.value === "yes" })}
                        >
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className={labelClass}>COLLECTION_IS</span>
                        <select
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
                          value={answer.optional ? "optional" : "required"}
                          onChange={(e) =>
                            updateAnswer(item.id, { optional: e.target.value === "optional" })
                          }
                        >
                          <option value="optional">Optional</option>
                          <option value="required">Required</option>
                        </select>
                      </label>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className={labelClass}>PURPOSE(S)_OF_COLLECTION</span>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {PURPOSES.map((purpose) => (
                          <CheckPill
                            key={purpose}
                            label={purpose}
                            checked={answer.purposes.includes(purpose)}
                            onChange={(on) => togglePurpose(item.id, purpose, on)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </fieldset>
        ))}
      </div>

      {/* Services */}
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-sm font-medium text-foreground">
          SDKs & services you use (optional — for purpose hints)
        </legend>
        <p className="text-xs text-mute">
          Checking a service just suggests likely purposes below — it does not check any data type
          for you.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <CheckPill
              key={s.id}
              label={s.label}
              checked={input.services.includes(s.id)}
              onChange={(on) => toggleService(s.id, on)}
            />
          ))}
        </div>
        {input.services.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
            {input.services.map((id) => {
              const service = SERVICES.find((s) => s.id === id);
              const hints = service ? CATEGORY_PURPOSE_HINTS[service.category] : undefined;
              if (!service || !hints || hints.length === 0) return null;
              return (
                <span key={id}>
                  <span className="text-accent">{service.label}</span> → {hints.join(", ")}
                </span>
              );
            })}
          </div>
        )}
      </fieldset>

      {/* Global toggles */}
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckPill
          label="Data is encrypted in transit"
          checked={input.encryptedInTransit}
          onChange={(v) => setInput((prev) => ({ ...prev, encryptedInTransit: v }))}
        />
        <CheckPill
          label="Users can request data deletion"
          checked={input.deletionSupported}
          onChange={(v) => setInput((prev) => ({ ...prev, deletionSupported: v }))}
        />
      </div>

      {/* Output */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className={labelClass}>WORKSHEET_OUTPUT</span>
          <button
            type="button"
            onClick={copy}
            disabled={rows.length === 0}
            className="rounded-sm border border-border px-3 py-1.5 text-xs tracking-widest text-mute transition-colors hover:border-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? "COPIED" : "COPY_AS_TEXT"}
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-md border border-border bg-background p-4 text-sm text-mute">
            Check a data type above to see it here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs tracking-widest text-mute">
                  <th className="px-3 py-2 font-normal">DATA_TYPE</th>
                  <th className="px-3 py-2 font-normal">COLLECTED</th>
                  <th className="px-3 py-2 font-normal">SHARED</th>
                  <th className="px-3 py-2 font-normal">OPTIONAL/REQUIRED</th>
                  <th className="px-3 py-2 font-normal">PURPOSE(S)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 text-foreground">{row.label}</td>
                    <td className="px-3 py-2 text-mute">Yes</td>
                    <td className="px-3 py-2 text-mute">{row.shared ? "Yes" : "No"}</td>
                    <td className="px-3 py-2 text-mute">{row.optional ? "Optional" : "Required"}</td>
                    <td className="px-3 py-2 text-mute">
                      {row.purposes.length > 0 ? row.purposes.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <pre className="max-h-96 overflow-auto rounded-md border border-border bg-background p-4 text-xs leading-relaxed text-foreground">
          <code>{text}</code>
        </pre>

        <p className="text-xs text-mute/70">
          This is a worksheet to help you fill out Play Console&apos;s Data Safety form faster —
          it is not legal advice, nothing here is submitted anywhere, and it is not a substitute
          for reading Google&apos;s own Data Safety policy. You&apos;re responsible for the
          accuracy of what you submit; Google can suspend apps over Data Safety mismatches, so
          double-check every row before transcribing it.
        </p>
      </div>
    </div>
  );
}
