import { attr, findChildren, parseAxml, type AxmlElement } from "./axml";

export interface ManifestInfo {
  packageName: string | null;
  versionCode: string | null;
  versionName: string | null;
  minSdkVersion: string | null;
  targetSdkVersion: string | null;
  permissions: string[];
  components: { type: "activity" | "service" | "receiver" | "provider"; name: string }[];
  /** Fields we couldn't confidently extract, for "unknown" messaging in the UI. */
  unknownFields: string[];
}

const EMPTY_MANIFEST: ManifestInfo = {
  packageName: null,
  versionCode: null,
  versionName: null,
  minSdkVersion: null,
  targetSdkVersion: null,
  permissions: [],
  components: [],
  unknownFields: [
    "packageName",
    "versionCode",
    "versionName",
    "minSdkVersion",
    "targetSdkVersion",
  ],
};

/** Parses an APK's binary-XML AndroidManifest.xml. Never throws — degrades field-by-field. */
export function parseApkManifest(bytes: Uint8Array): ManifestInfo {
  let root: AxmlElement;
  try {
    root = parseAxml(bytes);
  } catch {
    return { ...EMPTY_MANIFEST };
  }

  const unknownFields: string[] = [];
  const get = (name: string, from: AxmlElement = root) => {
    const v = attr(from, name);
    if (v === undefined) unknownFields.push(name);
    return v ?? null;
  };

  const packageName = get("package");
  const versionCode = get("versionCode");
  const versionName = get("versionName");

  let minSdkVersion: string | null = null;
  let targetSdkVersion: string | null = null;
  const usesSdk = findChildren(root, "uses-sdk")[0];
  if (usesSdk) {
    minSdkVersion = attr(usesSdk, "minSdkVersion") ?? null;
    targetSdkVersion = attr(usesSdk, "targetSdkVersion") ?? null;
  }
  if (minSdkVersion === null) unknownFields.push("minSdkVersion");
  if (targetSdkVersion === null) unknownFields.push("targetSdkVersion");

  const permissions = findChildren(root, "uses-permission")
    .map((el) => attr(el, "name"))
    .filter((v): v is string => !!v);

  const application = findChildren(root, "application")[0];
  const components: ManifestInfo["components"] = [];
  if (application) {
    const kinds: Array<["activity" | "service" | "receiver" | "provider", string]> = [
      ["activity", "activity"],
      ["service", "service"],
      ["receiver", "receiver"],
      ["provider", "provider"],
    ];
    for (const [type, tag] of kinds) {
      for (const el of findChildren(application, tag)) {
        const name = attr(el, "name");
        if (name) components.push({ type, name });
      }
    }
  }

  return {
    packageName,
    versionCode,
    versionName,
    minSdkVersion,
    targetSdkVersion,
    permissions,
    components,
    unknownFields,
  };
}
