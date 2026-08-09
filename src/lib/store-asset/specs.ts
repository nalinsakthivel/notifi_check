export type StoreId = "google-play" | "app-store";

export interface AssetSpec {
  id: string;
  label: string;
  folder: string;
  width: number;
  height: number;
}

export interface StoreSpec {
  id: StoreId;
  label: string;
  assets: AssetSpec[];
}

export const STORES: StoreSpec[] = [
  {
    id: "google-play",
    label: "Google Play Store",
    assets: [
      { id: "gp-phone-portrait", label: "Phone — Portrait", folder: "google-play/phone-portrait-1080x1920", width: 1080, height: 1920 },
      { id: "gp-phone-landscape", label: "Phone — Landscape", folder: "google-play/phone-landscape-1920x1080", width: 1920, height: 1080 },
      { id: "gp-tablet-7in", label: "7-inch Tablet", folder: "google-play/tablet-7in-1200x1920", width: 1200, height: 1920 },
      { id: "gp-tablet-10in", label: "10-inch Tablet", folder: "google-play/tablet-10in-1600x2560", width: 1600, height: 2560 },
      { id: "gp-feature-graphic", label: "Feature Graphic", folder: "google-play/feature-graphic-1024x500", width: 1024, height: 500 },
    ],
  },
  {
    id: "app-store",
    label: "Apple App Store",
    assets: [
      { id: "as-iphone-6-9-portrait", label: "iPhone 6.9\" — Portrait", folder: "app-store/iphone-6.9in-portrait-1320x2868", width: 1320, height: 2868 },
      { id: "as-iphone-6-9-landscape", label: "iPhone 6.9\" — Landscape", folder: "app-store/iphone-6.9in-landscape-2868x1320", width: 2868, height: 1320 },
      { id: "as-iphone-6-5", label: "iPhone 6.5\"", folder: "app-store/iphone-6.5in-1284x2778", width: 1284, height: 2778 },
      { id: "as-iphone-15-16-pro", label: "iPhone 15/16 Pro", folder: "app-store/iphone-15-16-pro-1290x2796", width: 1290, height: 2796 },
      { id: "as-ipad-pro-13", label: "iPad Pro 13\"", folder: "app-store/ipad-pro-13in-2048x2732", width: 2048, height: 2732 },
    ],
  },
];

export const ALL_ASSETS: AssetSpec[] = STORES.flatMap((s) => s.assets);

/** Sensible default selection: the two Play Store phone sizes + one iPhone size. */
export const DEFAULT_ASSET_IDS = ["gp-phone-portrait", "gp-phone-landscape", "as-iphone-15-16-pro"];
