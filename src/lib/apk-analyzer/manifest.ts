import { attr, findChildren, parseAxml, type AxmlElement } from "./axml.ts";

export interface ManifestInfo {
  packageName: string | null;
  versionCode: string | null;
  versionName: string | null;
  minSdkVersion: string | null;
  targetSdkVersion: string | null;
  permissions: string[];
  declaredPermissions: string[];
  components: {
    type: "activity" | "activity-alias" | "service" | "receiver" | "provider";
    name: string;
  }[];
  /** Fields we couldn't confidently extract, for "unknown" messaging in the UI. */
  unknownFields: string[];
}

/** Parses an APK's binary-XML AndroidManifest.xml. Throws on malformed AXML; unresolved fields remain null. */
export function parseApkManifest(bytes: Uint8Array): ManifestInfo {
  const root = parseAxml(bytes);

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

  const permissions = [
    ...findChildren(root, "uses-permission"),
    ...findChildren(root, "uses-permission-sdk-23"),
  ]
    .map((el) => attr(el, "name"))
    .filter((v): v is string => !!v);

  const application = findChildren(root, "application")[0];
  const components: ManifestInfo["components"] = [];
  if (application) {
    const kinds: Array<
      [
        "activity" | "activity-alias" | "service" | "receiver" | "provider",
        string,
      ]
    > = [
      ["activity", "activity"],
      ["activity-alias", "activity-alias"],
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
    permissions: [...new Set(permissions)],
    declaredPermissions: findChildren(root, "permission")
      .map((el) => attr(el, "name"))
      .filter((v): v is string => !!v),
    components,
    unknownFields,
  };
}
