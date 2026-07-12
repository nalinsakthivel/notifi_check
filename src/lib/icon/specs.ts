export type PlatformId = "android" | "ios" | "web" | "macos" | "windows";

export interface IconSpec {
  /** Path inside the ZIP */
  path: string;
  size: number;
  /** Flatten transparency onto the background color (required for iOS) */
  flatten?: boolean;
  /** Scale icon to ~80% and fill background (PWA maskable safe zone) */
  maskable?: boolean;
  /** Apply the user's shape mask (Android launcher icons) */
  shaped?: boolean;
}

interface IosEntry {
  idiom: "iphone" | "ipad" | "ios-marketing";
  pt: number;
  scale: 1 | 2 | 3;
}

const IOS_ENTRIES: IosEntry[] = [
  { idiom: "iphone", pt: 20, scale: 2 },
  { idiom: "iphone", pt: 20, scale: 3 },
  { idiom: "iphone", pt: 29, scale: 2 },
  { idiom: "iphone", pt: 29, scale: 3 },
  { idiom: "iphone", pt: 40, scale: 2 },
  { idiom: "iphone", pt: 40, scale: 3 },
  { idiom: "iphone", pt: 60, scale: 2 },
  { idiom: "iphone", pt: 60, scale: 3 },
  { idiom: "ipad", pt: 20, scale: 1 },
  { idiom: "ipad", pt: 20, scale: 2 },
  { idiom: "ipad", pt: 29, scale: 1 },
  { idiom: "ipad", pt: 29, scale: 2 },
  { idiom: "ipad", pt: 40, scale: 1 },
  { idiom: "ipad", pt: 40, scale: 2 },
  { idiom: "ipad", pt: 76, scale: 1 },
  { idiom: "ipad", pt: 76, scale: 2 },
  { idiom: "ipad", pt: 83.5, scale: 2 },
  { idiom: "ios-marketing", pt: 1024, scale: 1 },
];

const iosFilename = (e: IosEntry) => `AppIcon-${e.pt}@${e.scale}x.png`;

export function iosContentsJson(): string {
  return JSON.stringify(
    {
      images: IOS_ENTRIES.map((e) => ({
        filename: iosFilename(e),
        idiom: e.idiom,
        scale: `${e.scale}x`,
        size: `${e.pt}x${e.pt}`,
      })),
      info: { author: "xcode", version: 1 },
    },
    null,
    2
  );
}

export function webManifestSnippet(): string {
  return JSON.stringify(
    {
      name: "Your App",
      short_name: "App",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    },
    null,
    2
  );
}

const ANDROID_DENSITIES: [string, number][] = [
  ["mdpi", 48],
  ["hdpi", 72],
  ["xhdpi", 96],
  ["xxhdpi", 144],
  ["xxxhdpi", 192],
];

const MACOS_POINTS = [16, 32, 128, 256, 512];

export interface PlatformSpec {
  id: PlatformId;
  label: string;
  pngs: IconSpec[];
  /** .ico files to build from multiple PNG sizes */
  icos: { path: string; sizes: number[] }[];
  extraFiles: { path: string; content: string }[];
}

export const PLATFORMS: PlatformSpec[] = [
  {
    id: "android",
    label: "Android",
    pngs: [
      ...ANDROID_DENSITIES.map(([density, size]) => ({
        path: `android/mipmap-${density}/ic_launcher.png`,
        size,
        shaped: true,
      })),
      { path: "android/play-store-512.png", size: 512, flatten: true },
    ],
    icos: [],
    extraFiles: [],
  },
  {
    id: "ios",
    label: "iOS",
    // iPhone and iPad share some pt@scale combos — Contents.json references the same
    // file from both idioms, so dedupe by filename.
    pngs: [
      ...new Map(
        IOS_ENTRIES.map((e) => [
          iosFilename(e),
          {
            path: `ios/AppIcon.appiconset/${iosFilename(e)}`,
            size: Math.round(e.pt * e.scale),
            flatten: true,
          },
        ])
      ).values(),
    ],
    icos: [],
    extraFiles: [{ path: "ios/AppIcon.appiconset/Contents.json", content: iosContentsJson() }],
  },
  {
    id: "web",
    label: "Web / PWA",
    pngs: [
      { path: "web/favicon-16.png", size: 16 },
      { path: "web/favicon-32.png", size: 32 },
      { path: "web/favicon-48.png", size: 48 },
      { path: "web/apple-touch-icon.png", size: 180, flatten: true },
      { path: "web/icon-192.png", size: 192 },
      { path: "web/icon-512.png", size: 512 },
      { path: "web/maskable-512.png", size: 512, maskable: true },
    ],
    icos: [{ path: "web/favicon.ico", sizes: [16, 32, 48] }],
    extraFiles: [{ path: "web/site.webmanifest", content: webManifestSnippet() }],
  },
  {
    id: "macos",
    label: "macOS",
    pngs: MACOS_POINTS.flatMap((pt) => [
      { path: `macos/AppIcon.iconset/icon_${pt}x${pt}.png`, size: pt },
      { path: `macos/AppIcon.iconset/icon_${pt}x${pt}@2x.png`, size: pt * 2 },
    ]),
    icos: [],
    extraFiles: [],
  },
  {
    id: "windows",
    label: "Windows",
    pngs: [],
    icos: [{ path: "windows/icon.ico", sizes: [16, 32, 48, 256] }],
    extraFiles: [],
  },
];

export function readmeText(selected: PlatformId[]): string {
  const lines = [
    "App icons generated with Notifi Check — https://notifi-check tools",
    "All files were generated locally in your browser; your image was never uploaded.",
    "",
  ];
  if (selected.includes("android"))
    lines.push(
      "android/  — copy the mipmap-* folders into app/src/main/res/. Upload play-store-512.png",
      "            in Play Console. For adaptive icons, use your source art as the foreground",
      "            layer (Android Studio: New > Image Asset).",
      ""
    );
  if (selected.includes("ios"))
    lines.push(
      "ios/      — drag AppIcon.appiconset into your Xcode asset catalog (Assets.xcassets),",
      "            replacing the existing AppIcon set. Contents.json is included.",
      ""
    );
  if (selected.includes("web"))
    lines.push(
      "web/      — copy to your site root. Link favicon.ico and apple-touch-icon.png in <head>,",
      "            and merge site.webmanifest into your PWA manifest.",
      ""
    );
  if (selected.includes("macos"))
    lines.push(
      "macos/    — run: iconutil -c icns AppIcon.iconset   to produce AppIcon.icns.",
      ""
    );
  if (selected.includes("windows"))
    lines.push("windows/  — icon.ico contains 16/32/48/256 px for desktop apps and installers.", "");
  return lines.join("\n");
}
