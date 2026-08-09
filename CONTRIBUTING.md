# Contributing

Thanks for considering a contribution. This is a small, opinionated codebase — please read
[CLAUDE.md](CLAUDE.md) before opening a PR, it documents the route structure, the SEO/metadata
recipe every tool page follows, and the "nothing sensitive persisted server-side" invariant that
applies to every tool.

## Setup

```bash
pnpm install
pnpm dev
```

No environment variables are required to work on any tool — see [.env.example](.env.example) if
you need the feedback form or visitor counter running locally.

## Before opening a PR

- `pnpm lint` — must pass clean.
- `pnpm build` — must succeed (also typechecks).
- If you're adding a new tool, follow the checklist in CLAUDE.md's "Route structure" section:
  route under `src/app/(notifi)/<tool>/page.tsx`, add it to `src/app/sitemap.ts`, add a footer
  link in `src/components/footer.tsx`, add an entry to the `tools` array in `(notifi)/page.tsx`.
- Match the existing SEO/metadata pattern (see CLAUDE.md) rather than inventing a new one — every
  tool page has the same `metadata`/`jsonLd` shape.
- Keep new tools client-first: no server round-trip unless the tool genuinely needs one (e.g. the
  push tester calling FCM/OneSignal). If credentials are involved, they must never be persisted or
  logged server-side.

## Reporting bugs / requesting features

Open a GitHub issue, or use the in-app [Feedback](https://notifi-check.vercel.app/feedback) form.

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
