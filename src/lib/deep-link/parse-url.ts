export interface ParsedDeepLink {
  href: string;
  scheme: string;
  isHttpLink: boolean;
  host: string;
  port: string;
  path: string;
  fragment: string;
  params: { key: string; value: string }[];
}

export interface ParseResult {
  ok: boolean;
  value: ParsedDeepLink | null;
  error: string | null;
}

/**
 * Parse a custom-scheme deep link (`myapp://path?x=1`) or an HTTPS App/Universal Link
 * (`https://example.com/path?x=1`) using the native `URL` constructor — it accepts
 * arbitrary schemes fine. Never throws; parse failures come back as `{ ok: false }`.
 */
export function parseDeepLink(raw: string): ParseResult {
  const input = raw.trim();
  if (!input) return { ok: false, value: null, error: "Enter a URL to parse." };

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return {
      ok: false,
      value: null,
      error:
        "Couldn't parse that as a URL. It needs a scheme, e.g. myapp://path or https://example.com/path.",
    };
  }

  const scheme = url.protocol.replace(/:$/, "");
  const isHttpLink = scheme === "http" || scheme === "https";
  const params: { key: string; value: string }[] = [];
  url.searchParams.forEach((value, key) => params.push({ key, value }));

  return {
    ok: true,
    error: null,
    value: {
      href: url.href,
      scheme,
      isHttpLink,
      host: url.hostname,
      port: url.port,
      path: url.pathname,
      fragment: url.hash.replace(/^#/, ""),
      params,
    },
  };
}
