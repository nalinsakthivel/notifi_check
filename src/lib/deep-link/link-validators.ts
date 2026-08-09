/**
 * Client-side fetch + structural lint for Android `assetlinks.json` and iOS
 * `apple-app-site-association` (AASA). Both files are commonly served without permissive
 * CORS headers, so a fetch failure here is expected and reported as "couldn't fetch",
 * not treated as a hard validation failure.
 */

export interface RuleCheck {
  label: string;
  pass: boolean;
  detail: string;
}

export interface FetchLintResult {
  fetched: boolean;
  fetchError: string | null;
  status: number | null;
  raw: string | null;
  rules: RuleCheck[];
}

const SHA256_FINGERPRINT_RE = /^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/;

function normalizeDomain(input: string): string {
  const trimmed = input.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).hostname;
  } catch {
    return trimmed.replace(/\/.*$/, "");
  }
}

async function fetchText(url: string): Promise<{ text: string; status: number } | { error: string }> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();
    return { text, status: res.status };
  } catch {
    return {
      error:
        "Couldn't fetch — likely blocked by CORS (most sites don't send permissive CORS headers for well-known files). Check the Network tab or fetch it server-side to be sure.",
    };
  }
}

/** Validates Android's `.well-known/assetlinks.json` structure per Digital Asset Links spec. */
export async function checkAssetLinks(domain: string): Promise<FetchLintResult> {
  const host = normalizeDomain(domain);
  const url = `https://${host}/.well-known/assetlinks.json`;
  const fetched = await fetchText(url);

  if ("error" in fetched) {
    return { fetched: false, fetchError: fetched.error, status: null, raw: null, rules: [] };
  }

  const rules: RuleCheck[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(fetched.text);
  } catch {
    return {
      fetched: true,
      fetchError: null,
      status: fetched.status,
      raw: fetched.text,
      rules: [{ label: "Valid JSON", pass: false, detail: "Response body is not valid JSON." }],
    };
  }

  rules.push({
    label: "Top level is an array",
    pass: Array.isArray(parsed),
    detail: Array.isArray(parsed) ? `${parsed.length} entr${parsed.length === 1 ? "y" : "ies"}` : "Not an array",
  });
  if (!Array.isArray(parsed)) {
    return { fetched: true, fetchError: null, status: fetched.status, raw: fetched.text, rules };
  }

  parsed.forEach((entry, i) => {
    const e = entry as Record<string, unknown>;
    const relation = Array.isArray(e?.relation) ? (e.relation as unknown[]) : [];
    const hasHandleAllUrls = relation.some(
      (r) => typeof r === "string" && r === "delegate_permission/common.handle_all_urls"
    );
    rules.push({
      label: `Entry ${i}: relation includes handle_all_urls`,
      pass: hasHandleAllUrls,
      detail: hasHandleAllUrls ? "OK" : `relation: ${JSON.stringify(e?.relation)}`,
    });

    const target = e?.target as Record<string, unknown> | undefined;
    const namespaceOk = target?.namespace === "android_app";
    rules.push({
      label: `Entry ${i}: target.namespace is "android_app"`,
      pass: namespaceOk,
      detail: namespaceOk ? "OK" : `namespace: ${JSON.stringify(target?.namespace)}`,
    });

    const packageOk = typeof target?.package_name === "string" && target.package_name.length > 0;
    rules.push({
      label: `Entry ${i}: target.package_name is a string`,
      pass: packageOk,
      detail: packageOk ? String(target?.package_name) : `package_name: ${JSON.stringify(target?.package_name)}`,
    });

    const fingerprints = target?.sha256_cert_fingerprints;
    const fingerprintsArray = Array.isArray(fingerprints) ? fingerprints : [];
    const fingerprintsOk =
      fingerprintsArray.length > 0 &&
      fingerprintsArray.every((f) => typeof f === "string" && SHA256_FINGERPRINT_RE.test(f));
    rules.push({
      label: `Entry ${i}: sha256_cert_fingerprints look valid`,
      pass: fingerprintsOk,
      detail: fingerprintsOk
        ? `${fingerprintsArray.length} fingerprint(s), format OK`
        : "Expected a non-empty array of AA:BB:CC:... (32 byte) hex strings",
    });
  });

  return { fetched: true, fetchError: null, status: fetched.status, raw: fetched.text, rules };
}

/** Validates iOS's `.well-known/apple-app-site-association` structure (legacy + modern schema, loosely). */
export async function checkAasa(domain: string): Promise<FetchLintResult> {
  const host = normalizeDomain(domain);
  const url = `https://${host}/.well-known/apple-app-site-association`;
  const fetched = await fetchText(url);

  if ("error" in fetched) {
    return { fetched: false, fetchError: fetched.error, status: null, raw: null, rules: [] };
  }

  const rules: RuleCheck[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(fetched.text);
  } catch {
    return {
      fetched: true,
      fetchError: null,
      status: fetched.status,
      raw: fetched.text,
      rules: [
        {
          label: "Valid JSON",
          pass: false,
          detail:
            "Response body is not valid JSON (AASA is sometimes served as application/pkcs7-mime — check it's plain JSON).",
        },
      ],
    };
  }

  const root = parsed as Record<string, unknown>;
  const applinks = root?.applinks as Record<string, unknown> | undefined;
  rules.push({
    label: "Has top-level applinks",
    pass: typeof applinks === "object" && applinks !== null,
    detail: applinks ? "OK" : "Missing applinks key",
  });
  if (!applinks) {
    return { fetched: true, fetchError: null, status: fetched.status, raw: fetched.text, rules };
  }

  const details = applinks.details;
  const detailsArray = Array.isArray(details) ? details : [];
  rules.push({
    label: "applinks.details is an array",
    pass: Array.isArray(details),
    detail: Array.isArray(details) ? `${detailsArray.length} entr${detailsArray.length === 1 ? "y" : "ies"}` : "Not an array",
  });

  detailsArray.forEach((entry, i) => {
    const e = entry as Record<string, unknown>;
    // Support both legacy `appID` (single string) and newer `appIDs` (array).
    const hasAppId = typeof e?.appID === "string" && e.appID.length > 0;
    const hasAppIds = Array.isArray(e?.appIDs) && (e.appIDs as unknown[]).length > 0;
    rules.push({
      label: `Entry ${i}: has appID or appIDs`,
      pass: hasAppId || hasAppIds,
      detail: hasAppId ? `appID: ${e.appID}` : hasAppIds ? `appIDs: ${JSON.stringify(e.appIDs)}` : "Missing both",
    });

    const pathsOk = Array.isArray(e?.paths) && (e.paths as unknown[]).length > 0;
    rules.push({
      label: `Entry ${i}: paths is a non-empty array`,
      pass: pathsOk,
      detail: pathsOk ? `${(e.paths as unknown[]).length} path(s)` : "Missing or empty paths array",
    });
  });

  return { fetched: true, fetchError: null, status: fetched.status, raw: fetched.text, rules };
}
