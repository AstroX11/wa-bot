import type { GroupMetadata } from "baileys";
import { groupMetaDataCache } from "../client/main.ts";

export async function cachedGroupMetadata(jid: string) {
  return groupMetaDataCache.get(jid) as GroupMetadata | undefined;
}
