import { jidNormalizedUser, type WASocket } from "baileys";
import { isAdmin } from "../utils/group.ts";
import { getUser } from "../utils/extract.ts";
import type { Serialize } from "../utils/serialize.ts";
import type { Command } from "../utils/plugins.ts";

export default [
  {
    name: "kick",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      args =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || args;

      if (!args) {
        return await message.send({ text: "_provide a person to be removed_" });
      }

      const user = await getUser(args);

      await client.groupParticipantsUpdate(message.chat, [user.pn], "remove");
      return await message.send({
        text: `_@${user.pn.split("@")[0]} kicked from group_`,
        mentions: [user.pn, user.lid],
      });
    },
  },
  {
    name: "kickall",
    category: "group",
    isSudo: true,
    isGroup: true,
    requiresAdmin: true,
    run: async (client: WASocket, message: Serialize) => {
      const metadata = await client.groupMetadata(message.chat);
      const participants = metadata.participants;

      const isBotAdmin = await isAdmin(
        participants,
        jidNormalizedUser(client.user!.id)
      );
      if (!(await isAdmin(participants, message.sender!))) {
        return await message.send({ text: "_you are not a group admin_" });
      }
      if (!isBotAdmin) {
        return await message.send({ text: "_i am not a group admin_" });
      }
      const superAdmin = participants.find((p) => p.admin === "superadmin")?.id;

      const res = participants
        .map((p) => p.id)
        .filter((id) => id !== superAdmin && id !== message.sender);

      if (res.length === 0) {
        return await message.send({ text: "_no participants to remove_" });
      }

      await client.groupParticipantsUpdate(message.chat, res, "remove");
      return await message.send({
        text: `_removed ${res.length} participants_`,
      });
    },
  },
  {
    name: "promote",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      args =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || args;

      if (!args) {
        return await message.send({
          text: "_provide a person to be promoted_",
        });
      }
    },
  },
] satisfies Command[];
