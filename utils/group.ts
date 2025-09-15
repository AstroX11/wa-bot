import type { GroupMetadataParticipants } from "baileys";
import { getUser } from "./extract.ts";

export const isAdmin = async (
  participants: GroupMetadataParticipants["participants"],
  userId: string,
) => {
  if (!userId) return false;

  const { pn, lid } = await getUser(userId);

  const admins = participants
    .filter((p) => p.admin === "admin" || p.admin === "superadmin")
    .map((p) => p.id);

  return admins.includes(pn) || admins.includes(lid);
};
