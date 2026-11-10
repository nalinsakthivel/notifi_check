import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

test("root layout uses the vendored variable Geist Mono without Google font fetching", () => {
  const layout = readFileSync(
    new URL("../src/app/layout.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(layout, /next\/font\/google/);
  assert.match(layout, /import localFont from "next\/font\/local"/);
  assert.match(layout, /src: "\.\/fonts\/GeistMono-Variable\.woff2"/);
  assert.match(layout, /variable: "--font-geist-mono"/);
  assert.match(layout, /weight: "100 900"/);
  const font = readFileSync(
    new URL("../src/app/fonts/GeistMono-Variable.woff2", import.meta.url),
  );
  assert.equal(font.toString("ascii", 0, 4), "wOF2");
  assert.equal(
    createHash("sha256").update(font).digest("hex"),
    "3ef2c50dc1042ebfa89ca66bb6901e9dde5737970547c21b4de7a44dfb2ab948",
  );
});
