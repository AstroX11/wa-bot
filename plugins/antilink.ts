import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import type { Command } from "../utils/plugins.ts";
import { Settings } from "../sql/bot.ts";
import { antilinkSet, GetAntiLink, DelAntiLink } from "../sql/antilink.ts";
import { extractUrlFromText, jidNormalizedUser } from "baileys";
import { isAdmin } from "../utils/group.ts";

const prefix = (await Settings.prefix.get()) || ".";

export default [
  {
    name: "antilink",
    category: "group",
    isGroup: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      const [sub, action] = args?.toLowerCase().split(" ") || [];
      const jid = jidNormalizedUser(message.chat);

      if (!sub || sub === "help") {
        return await message.send({
          text: `\`\`\`\tANTILINK SETUP\n\n${prefix}antilink on/off\n${prefix}antilink set kick/delete\n${prefix}antilink get\n${prefix}antilink del\`\`\``,
        });
      }

      if (sub === "on") {
        await antilinkSet(jid, 1, "delete");
        return await message.send({ text: "_antilink enabled_" });
      } else if (sub === "off") {
        await antilinkSet(jid, 0, "delete");
        return await message.send({ text: "_antilink disabled_" });
      } else if (sub === "set") {
        if (action !== "kick" && action !== "delete")
          return await message.send({
            text: "_invalid action, use kick or delete_",
          });
        await antilinkSet(jid, 1, action);
        return await message.send({ text: `_antilink set to ${action}_` });
      } else if (sub === "get") {
        const record = await GetAntiLink(jid);
        return await message.send({
          text: record
            ? `_status: ${record.status}, action: ${record.action}_`
            : "_no antilink record found_",
        });
      } else if (sub === "del") {
        await DelAntiLink(jid);
        return await message.send({ text: "_antilink record deleted_" });
      }

      return await message.send({
        text: "_invalid argument, use on/off/set/get/del_",
      });
    },
  },
  {
    event: true,
    run: async (client: WASocket, message: Serialize) => {
      if (!message.isGroup || !message.text) return;

      const record = await GetAntiLink(message.chat);
      if (!record || record.status === 0) return;

      const metadata = await client.groupMetadata(message.chat);
      const isSenderAdmin = await isAdmin(
        metadata.participants,
        message.sender!,
      );
      const isBotAdmin =
        (await isAdmin(
          metadata.participants,
          jidNormalizedUser(client.user!.id),
        )) || (await isAdmin(metadata.participants, client.user!.lid!));

      if (isSenderAdmin || !isBotAdmin) return;

      const urls = extractUrlFromText(message.text);
      if (!urls?.length) return;

      await message.send({
        delete: {
          id: message.id,
          fromMe: false,
          remoteJid: message.chat,
          participant: message.sender,
        },
      });

      const senderTag = `@${message.sender.split("@")[0]}`;

      if (record.action === "kick") {
        await client.groupParticipantsUpdate(
          message.chat,
          [message.sender!],
          "remove",
        );
        return await message.send({
          text: `_${senderTag} kicked from group for sending links_`,
          mentions: [message.sender],
        });
      }

      return await message.send({
        text: `_${senderTag} links are not allowed in this group_`,
        mentions: [message.sender],
      });
    },
  },
] satisfies Command[];
