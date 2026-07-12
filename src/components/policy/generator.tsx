"use client";

import { useEffect, useRef, useState } from "react";
import {
  APP_CATEGORIES,
  AGE_GROUPS,
  DATA_GROUPS,
  PERMISSIONS,
  SERVICES,
  STEP_FIELDS,
  emptyPolicyInput,
  policySchema,
  type PolicyInput,
} from "@/lib/policy/types";
import { generatePolicy, markdownToHtml, policyHtmlDocument } from "@/lib/policy/engine";
import { TEMPLATES } from "@/lib/policy/templates";
import { CheckPill } from "@/components/check-pill";

const STEPS = [
  "App Information",
  "App Details",
  "Data Collection",
  "Permissions",
  "Third-Party Services",
  "Children",
  "Policy Options",
];

const DRAFT_KEY = "ppg:draft";
const RECENT_KEY = "ppg:recent";

interface RecentPolicy {
  appName: string;
  savedAt: string;
  input: PolicyInput;
}

type Errors = Partial<Record<keyof PolicyInput, string>>;

const inputCls =
  "w-full rounded-md border border-border bg-panel px-4 py-3 text-sm text-foreground placeholder-mute/60 outline-none transition-colors focus:border-accent aria-[invalid=true]:border-red-400/60";

const RETENTION_OPTIONS = [
  "as long as your account is active or as needed to provide the service",
  "for 30 days after collection, unless a longer period is required by law",
  "for 90 days after collection, unless a longer period is required by law",
  "for 12 months after your last activity in the App",
  "until you request deletion of your data",
];

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-accent">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-mute/70">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function YesNo({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={label}>
        {[true, false].map((v) => (
          <label
            key={String(v)}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors ${
              value === v
                ? "border-accent bg-accent/10 text-foreground"
                : "border-border bg-panel text-mute hover:border-mute"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={value === v}
              onChange={() => onChange(v)}
              className="sr-only"
            />
            {v ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PolicyGenerator() {
  const [input, setInput] = useState<PolicyInput>(emptyPolicyInput);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [output, setOutput] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [notice, setNotice] = useState<{ text: string } | null>(null);
  const [recent, setRecent] = useState<RecentPolicy[]>([]);
  const loaded = useRef(false);

  // Load draft + recent list once on mount (deferred so hydration compares against defaults).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) setInput({ ...emptyPolicyInput(), ...JSON.parse(draft) });
        const rec = localStorage.getItem(RECENT_KEY);
        if (rec) setRecent(JSON.parse(rec));
      } catch {
        // corrupted storage — start fresh
      }
      loaded.current = true;
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss notices.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  // Autosave draft (debounced).
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(input));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [input]);

  const set = <K extends keyof PolicyInput>(key: K, value: PolicyInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const toggle = (key: "data" | "permissions" | "services", id: string, on: boolean) =>
    set(key, on ? [...input[key], id] : input[key].filter((x) => x !== id));

  function validateStep(i: number): boolean {
    const fields = STEP_FIELDS[i];
    const mask = Object.fromEntries(fields.map((f) => [f, true]));
    const result = policySchema.pick(mask as Record<keyof PolicyInput, true>).safeParse(input);
    if (result.success) {
      return true;
    }
    const next: Errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof PolicyInput;
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    const first = fields.find((f) => next[f]);
    if (first) document.getElementById(first)?.focus();
    return false;
  }

  function flash(message: string) {
    setNotice({ text: message });
  }

  function applyTemplate(values: Partial<PolicyInput>) {
    setInput({ ...emptyPolicyInput(), ...values });
    setErrors({});
    setStep(0);
    setOutput(null);
    flash("Template applied — fill in your app details");
  }

  function loadRecent(r: RecentPolicy) {
    setInput({ ...emptyPolicyInput(), ...r.input });
    setErrors({});
    setStep(0);
    setOutput(null);
    flash(`Loaded "${r.appName}"`);
  }

  function handleGenerate() {
    for (let i = 0; i < STEPS.length; i++) {
      if (!validateStep(i)) {
        setStep(i);
        flash("Please fix the highlighted fields");
        return;
      }
    }
    setOutput(generatePolicy(input));
    setEditMode(false);
    const entry: RecentPolicy = { appName: input.appName, savedAt: new Date().toISOString(), input };
    const next = [entry, ...recent.filter((r) => r.appName !== input.appName)].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    flash("Copied to clipboard");
  }

  function handlePrint() {
    if (!output) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(policyHtmlDocument(output, input.appName));
    w.document.close();
    w.focus();
    w.print();
  }

  async function handleShare() {
    if (!output) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Privacy Policy — ${input.appName}`, text: output });
      } catch {
        // user cancelled
      }
    } else {
      await handleCopy();
    }
  }

  const slug = (input.appName || "privacy-policy").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  /* ---------------- Output view ---------------- */
  if (output !== null) {
    const tools: { label: string; onClick: () => void }[] = [
      { label: editMode ? "Preview" : "Edit", onClick: () => setEditMode((v) => !v) },
      { label: "Copy", onClick: handleCopy },
      { label: "Markdown", onClick: () => downloadFile(`${slug}.md`, output, "text/markdown") },
      {
        label: "HTML",
        onClick: () => downloadFile(`${slug}.html`, policyHtmlDocument(output, input.appName), "text/html"),
      },
      { label: "PDF / Print", onClick: handlePrint },
      { label: "Share", onClick: handleShare },
    ];
    return (
      <div className="ppg-fade-up">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOutput(null)}
            className="cursor-pointer rounded-md border border-border bg-panel px-4 py-2 text-sm text-mute transition-colors hover:border-mute hover:text-foreground"
          >
            ← Back to form
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            {tools.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={t.onClick}
                className="cursor-pointer rounded-md border border-border bg-panel px-4 py-2 text-sm text-mute transition-colors hover:border-accent hover:text-foreground"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div aria-live="polite" className="min-h-6 text-sm text-live">
          {notice?.text}
        </div>
        <div className="rounded-md border border-border bg-panel p-6 sm:p-10">
          {editMode ? (
            <>
              <label htmlFor="policy-editor" className="mb-2 block text-sm font-medium text-foreground">
                Edit policy (Markdown)
              </label>
              <textarea
                id="policy-editor"
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                rows={30}
                className="w-full resize-y rounded-md border border-border bg-background p-4 font-mono text-sm leading-relaxed text-foreground outline-none focus:border-accent"
              />
            </>
          ) : (
            <article
              className="ppg-prose"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(output) }}
            />
          )}
        </div>
        <p className="mt-4 text-xs text-mute/70">
          This generated document is a starting point, not legal advice. Review it (ideally with a
          lawyer) before publishing.
        </p>
      </div>
    );
  }

  /* ---------------- Form view ---------------- */
  return (
    <div>
      {/* Templates + recent */}
      <div className="mb-8 flex flex-col gap-3">
        <p className="text-sm text-mute">Start from a template (optional):</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.values)}
              title={t.description}
              className="cursor-pointer rounded-md border border-border bg-panel px-4 py-1.5 text-xs text-mute transition-colors hover:border-accent hover:text-foreground"
            >
              {t.label}
            </button>
          ))}
        </div>
        {recent.length > 0 && (
          <>
            <p className="mt-2 text-sm text-mute">Recent policies:</p>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r.appName + r.savedAt}
                  type="button"
                  onClick={() => loadRecent(r)}
                  className="cursor-pointer rounded-md border border-border bg-panel px-4 py-1.5 text-xs text-mute transition-colors hover:border-live hover:text-foreground"
                >
                  {r.appName}
                  <span className="ml-2 text-foreground/30">{new Date(r.savedAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stepper */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                aria-current={i === step ? "step" : undefined}
                disabled={i > step}
                className={`rounded-md border px-3.5 py-1.5 text-xs transition-colors ${
                  i === step
                    ? "border-accent bg-accent/15 text-foreground"
                    : i < step
                      ? "cursor-pointer border-live/40 bg-live/10 text-live hover:border-live"
                      : "border-border text-mute/70"
                }`}
              >
                {i + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-4 h-1 overflow-hidden rounded-md bg-border">
          <div
            className="h-full rounded-md bg-accent transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </nav>

      <div aria-live="polite" className="min-h-6 text-sm text-live">
        {notice?.text}
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < STEPS.length - 1) {
            if (validateStep(step)) setStep(step + 1);
          } else {
            handleGenerate();
          }
        }}
        className="ppg-fade-up rounded-md border border-border bg-panel p-6 sm:p-10"
      >
        <h2 className="mb-6 text-xl font-semibold text-foreground">
          {STEPS[step]}
        </h2>

        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="appName" label="App Name" required error={errors.appName}>
              <input id="appName" className={inputCls} value={input.appName} aria-invalid={!!errors.appName} autoComplete="off" placeholder="My Awesome App" onChange={(e) => set("appName", e.target.value)} />
            </Field>
            <Field id="developerName" label="Developer Name" required error={errors.developerName}>
              <input id="developerName" className={inputCls} value={input.developerName} aria-invalid={!!errors.developerName} autoComplete="name" placeholder="Jane Doe" onChange={(e) => set("developerName", e.target.value)} />
            </Field>
            <Field id="developerEmail" label="Developer Email" required error={errors.developerEmail} hint="Shown in the policy as the privacy contact">
              <input id="developerEmail" type="email" className={inputCls} value={input.developerEmail} aria-invalid={!!errors.developerEmail} autoComplete="email" placeholder="contact@example.com" onChange={(e) => set("developerEmail", e.target.value)} />
            </Field>
            <Field id="website" label="Website (optional)" error={errors.website}>
              <input id="website" type="url" className={inputCls} value={input.website} aria-invalid={!!errors.website} placeholder="https://example.com" onChange={(e) => set("website", e.target.value)} />
            </Field>
            <Field id="country" label="Country" required error={errors.country} hint="Where you or your company are based">
              <input id="country" className={inputCls} value={input.country} aria-invalid={!!errors.country} autoComplete="country-name" placeholder="India" onChange={(e) => set("country", e.target.value)} />
            </Field>
            <Field id="companyName" label="Company Name (optional)">
              <input id="companyName" className={inputCls} value={input.companyName} autoComplete="organization" placeholder="Acme Pvt Ltd" onChange={(e) => set("companyName", e.target.value)} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <Field id="category" label="App Category" required error={errors.category}>
              <select id="category" className={`${inputCls} cursor-pointer`} value={input.category} onChange={(e) => set("category", e.target.value as PolicyInput["category"])}>
                {APP_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-panel">{c}</option>
                ))}
              </select>
            </Field>
            <Field id="ageGroup" label="Age Group" required error={errors.ageGroup}>
              <select id="ageGroup" className={`${inputCls} cursor-pointer`} value={input.ageGroup} onChange={(e) => set("ageGroup", e.target.value as PolicyInput["ageGroup"])}>
                {AGE_GROUPS.map((a) => (
                  <option key={a} value={a} className="bg-panel">{a}</option>
                ))}
              </select>
            </Field>
            <Field id="pricing" label="Paid or Free" required error={errors.pricing}>
              <select id="pricing" className={`${inputCls} cursor-pointer`} value={input.pricing} onChange={(e) => set("pricing", e.target.value as PolicyInput["pricing"])}>
                <option value="Free" className="bg-panel">Free</option>
                <option value="Paid" className="bg-panel">Paid</option>
              </select>
            </Field>
            <div className="grid gap-6 sm:grid-cols-3">
              <YesNo name="requiresLogin" label="Requires login?" value={input.requiresLogin} onChange={(v) => set("requiresLogin", v)} />
              <YesNo name="ads" label="Contains ads?" value={input.ads} onChange={(v) => set("ads", v)} />
              <YesNo name="iap" label="In-app purchases?" value={input.iap} onChange={(v) => set("iap", v)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <p className="text-sm text-mute">
              Select everything your app collects — each selection adds matching sections to the policy.
            </p>
            {DATA_GROUPS.map((group) => (
              <fieldset key={group.label}>
                <legend className="mb-2.5 text-sm font-medium text-foreground">{group.label}</legend>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <CheckPill
                      key={item.id}
                      label={item.label}
                      checked={input.data.includes(item.id)}
                      onChange={(on) => toggle("data", item.id, on)}
                    />
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {step === 3 && (
          <fieldset>
            <legend className="mb-2.5 text-sm text-mute">
              Which Android permissions does your app request?
            </legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PERMISSIONS.map((p) => (
                <CheckPill
                  key={p.id}
                  label={p.label}
                  checked={input.permissions.includes(p.id)}
                  onChange={(on) => toggle("permissions", p.id, on)}
                />
              ))}
            </div>
          </fieldset>
        )}

        {step === 4 && (
          <fieldset>
            <legend className="mb-2.5 text-sm text-mute">
              Which third-party SDKs and services does your app use?
            </legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s) => (
                <CheckPill
                  key={s.id}
                  label={s.label}
                  checked={input.services.includes(s.id)}
                  onChange={(on) => toggle("services", s.id, on)}
                />
              ))}
            </div>
          </fieldset>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <YesNo
              name="childDirected"
              label="Is the app directed towards children under 13?"
              value={input.childDirected}
              onChange={(v) => set("childDirected", v)}
            />
            <p className="text-sm text-mute">
              Answering yes adds a COPPA / Google Play Families section with parental-consent language.
            </p>
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col gap-6">
            <Field id="retention" label="Retention Period" required error={errors.retention} hint='Completes the sentence "We retain your information …"'>
              <select id="retention" className={`${inputCls} cursor-pointer`} value={input.retention} onChange={(e) => set("retention", e.target.value)}>
                {RETENTION_OPTIONS.map((r) => (
                  <option key={r} value={r} className="bg-panel">{r}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CheckPill label="Delete account supported in-app" checked={input.deleteAccount} onChange={(v) => set("deleteAccount", v)} />
              <CheckPill label="GDPR compliance (EU users)" checked={input.gdpr} onChange={(v) => set("gdpr", v)} />
              <CheckPill label="CCPA compliance (California)" checked={input.ccpa} onChange={(v) => set("ccpa", v)} />
              <CheckPill label="COPPA compliance (children)" checked={input.coppa} onChange={(v) => set("coppa", v)} />
              <CheckPill label="Data encrypted in transit & at rest" checked={input.encryption} onChange={(v) => set("encryption", v)} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="deletionEmail" label="Data Deletion Request Email (optional)" error={errors.deletionEmail} hint="Defaults to the developer email">
                <input id="deletionEmail" type="email" className={inputCls} value={input.deletionEmail} aria-invalid={!!errors.deletionEmail} placeholder="privacy@example.com" onChange={(e) => set("deletionEmail", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field id="effectiveDate" label="Effective Date" required error={errors.effectiveDate}>
                  <input id="effectiveDate" type="date" className={inputCls} value={input.effectiveDate} aria-invalid={!!errors.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
                </Field>
                <Field id="lastUpdated" label="Last Updated" required error={errors.lastUpdated}>
                  <input id="lastUpdated" type="date" className={inputCls} value={input.lastUpdated} aria-invalid={!!errors.lastUpdated} onChange={(e) => set("lastUpdated", e.target.value)} />
                </Field>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="cursor-pointer rounded-md border border-border px-5 py-2.5 text-sm text-mute transition-colors hover:border-mute hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-85"
          >
            {step === STEPS.length - 1 ? "Generate Policy" : "Continue"}
          </button>
        </div>
      </form>

      <p className="mt-4 text-xs text-mute/70">
        Your answers are autosaved in this browser only — nothing is sent to a server.
      </p>
    </div>
  );
}
