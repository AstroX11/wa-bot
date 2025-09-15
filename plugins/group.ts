import { isAdmin } from "../utils/group.ts";
import { getUser } from "../utils/extract.ts";
import type { Command } from "../utils/plugins.ts";
import { downloadMediaMessage, type WAContextInfo } from "baileys";

const getQuotedImage = (message: any) => {
  const ctx = message?.message?.[message.mtype]?.contextInfo as
    | WAContextInfo
    | undefined;
  return ctx?.quotedMessage?.imageMessage ? ctx : null;
};

const formatMention = (jid: string) => `@${jid.split("@")[0]}`;

export default [
  {
    name: "kick",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message, args) => {
      args =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || args;
      if (!args)
        return await message.send({ text: "_provide a person to be removed_" });
      const user = await getUser(args);
      await client.groupParticipantsUpdate(message.chat, [user.pn], "remove");
      return await message.send({
        text: `${formatMention(user.pn)} kicked from group`,
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
    run: async (client, message) => {
      const participants = await client
        .groupMetadata(message.chat)
        .then((p) => p.participants);
      const superAdmin = participants.find((p) => p.admin === "superadmin")?.id;
      const res = participants
        .map((p) => p.id)
        .filter((id) => id !== superAdmin && id !== message.sender);
      if (res.length === 0)
        return await message.send({ text: "_no participants to remove_" });
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
    run: async (client, message, args) => {
      args =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || args;
      if (!args)
        return await message.send({
          text: "_provide a person to be promoted_",
        });
      const participants = await client
        .groupMetadata(message.chat)
        .then((p) => p.participants);
      const user = await getUser(args);
      if (await isAdmin(participants, user.pn)) {
        return await message.send({
          text: `${formatMention(user.pn)} is already a group admin`,
          mentions: [user.pn],
        });
      }
      await client.groupParticipantsUpdate(message.chat, [user.pn], "promote");
      return await message.send({
        text: `${formatMention(user.pn)} is now a group admin`,
        mentions: [user.pn],
      });
    },
  },
  {
    name: "demote",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message, args) => {
      args =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || args;
      if (!args)
        return await message.send({ text: "_provide a person to be demoted_" });
      const participants = await client
        .groupMetadata(message.chat)
        .then((p) => p.participants);
      const user = await getUser(args);
      if (!(await isAdmin(participants, user.pn))) {
        return await message.send({
          text: `${formatMention(user.pn)} is not an admin`,
          mentions: [user.pn],
        });
      }
      await client.groupParticipantsUpdate(message.chat, [user.pn], "demote");
      return await message.send({
        text: `${formatMention(user.pn)} has been demoted`,
        mentions: [user.pn],
      });
    },
  },
  {
    name: "gname",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message, args) => {
      if (!args)
        return await message.send({ text: "_provide a new group name_" });
      await client.groupUpdateSubject(message.chat, args);
      return await message.send({ text: `_group name updated to:_ *${args}*` });
    },
  },
  {
    name: "gdesc",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message, args) => {
      if (!args)
        return await message.send({
          text: "_provide a new group description_",
        });
      await client.groupUpdateDescription(message.chat, args);
      return await message.send({ text: `_group description updated_` });
    },
  },
  {
    name: "gpp",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message) => {
      const ctx = getQuotedImage(message);
      if (!ctx)
        return await message.send({
          text: "_reply with an image to set as group profile picture_",
        });
      const buffer = await downloadMediaMessage(
        { key: { id: ctx.stanzaId }, message: ctx.quotedMessage },
        "buffer",
        {},
      );
      await client.updateProfilePicture(message.chat, buffer);
      return await message.send({ text: "_group profile picture updated_" });
    },
  },
  {
    name: "fullgpp",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message) => {
      const ctx = getQuotedImage(message);
      if (!ctx)
        return await message.send({
          text: "_reply with an image to set full resolution group profile picture_",
        });
      const buffer = await downloadMediaMessage(
        { key: { id: ctx.stanzaId }, message: ctx.quotedMessage },
        "buffer",
        {},
      );
      await client.updateProfilePicture(message.chat, buffer, {
        width: 324,
        height: 720,
      });
      return await message.send({ text: "_group profile picture updated_" });
    },
  },
  {
    name: "mute",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message) => {
      await client.groupSettingUpdate(message.chat, "announcement");
      return await message.send({
        text: "_group muted, only admins can send messages_",
      });
    },
  },
  {
    name: "unmute",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message) => {
      await client.groupSettingUpdate(message.chat, "not_announcement");
      return await message.send({
        text: "_group unmuted, all members can send messages_",
      });
    },
  },
  {
    name: "lock",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message) => {
      await client.groupSettingUpdate(message.chat, "locked");
      return await message.send({
        text: "_group settings restricted to admins_",
      });
    },
  },
  {
    name: "unlock",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message) => {
      await client.groupSettingUpdate(message.chat, "unlocked");
      return await message.send({ text: "_group settings unrestricted_" });
    },
  },
  {
    name: "invite",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message) => {
      const code = await client.groupInviteCode(message.chat);
      return await message.send({
        text: `_https://chat.whatsapp.com/${code}_`,
      });
    },
  },
  {
    name: "revoke",
    category: "group",
    isGroup: true,
    requiresAdmin: true,
    run: async (client, message) => {
      const code = await client.groupRevokeInvite(message.chat);
      return await message.send({
        text: `_https://chat.whatsapp.com/${code}_`,
      });
    },
  },
  {
    name: "leave",
    category: "group",
    isGroup: true,
    isSudo: true,
    run: async (client, message) => {
      await client.groupLeave(message.chat);
    },
  },

  {
    name: "tag",
    category: "group",
    isGroup: true,
    run: async (client, message, args) => {
      const metadata = await client.groupMetadata(message.chat);
      const participants = metadata.participants.map((p) => p.id);
      return await client.relayMessage(
        message.chat,
        {
          extendedTextMessage: {
            text: args || "",
            contextInfo: {
              mentionedJid: participants,
              groupMentions: [
                { groupJid: message.chat, groupSubject: metadata.subject },
              ],
            },
          },
        },
        {},
      );
    },
  },
  {
    name: "poll",
    category: "group",
    isGroup: true,
    run: async (client, message, args) => {
      if (!args || !args.includes(";"))
        return message.send({
          text: "_usage: poll question; option1, option2, option3_",
        });
      const [question, optionsRaw] = args.split(";").map((s) => s.trim());
      const options = optionsRaw
        .split(",")
        .map((opt) => opt.trim())
        .filter(Boolean);
      if (options.length < 2)
        return message.send({ text: "_add at least 2 options_" });
      await client.sendMessage(message.chat, {
        poll: { name: question, values: options, selectableCount: 1 },
      });
    },
  },
] satisfies Command[];
