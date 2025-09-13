import type { GroupMetadata } from "baileys";
import { groupDataCache } from "../client/main.ts";

export async function cachedGroupMetadata(jid: string) {
  return groupDataCache.get(jid) as GroupMetadata | undefined;
}
