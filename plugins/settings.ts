import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import type { Command } from "../utils/plugins.ts";
import { Settings } from "../sql/bot.ts";
import { getUser } from "../utils/extract.ts";

const prefix = (await Settings.prefix.get()) || ".";

export default [
  {
    name: "setprefix",
    category: "settings",
    isSudo: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      const newPrefix = args?.trim();
      if (!newPrefix) {
        await Settings.prefix.set(null);
        return await message.send({ text: "_prefix cleared (set to null)_" });
      }

      await Settings.prefix.set(newPrefix.split(""));
      return await message.send({ text: `_prefix set to ${newPrefix}_` });
    },
  },
  {
    name: "setsudo",
    category: "settings",
    isSudo: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      args =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || args;

      if (!args) {
        return await message.send({ text: `_usage: ${prefix}setsudo <user>_` });
      }

      const user = await getUser(args);
      await Settings.sudo.set([user.pn, user.lid].filter(Boolean));

      return await message.send({
        text: `\`\`\`_sudo added:_ @${user.pn.split("@")[0]}\`\`\``,
        mentions: [user.pn],
      });
    },
  },
  {
    name: "getsudo",
    category: "settings",
    isSudo: true,
    run: async (client: WASocket, message: Serialize) => {
      const sudo = await Settings.sudo.get();
      const pnOnly = sudo.filter((s) => s.endsWith("@s.whatsapp.net"));

      if (!pnOnly.length) {
        return await message.send({ text: "_no sudo numbers set_" });
      }

      return await message.send({
        text: `_sudo list:_\n${pnOnly
          .map((s, i) => `${i + 1}. @${s.split("@")[0]}`)
          .join("\n")}`,
        mentions: pnOnly,
      });
    },
  },
  {
    name: "delsudo",
    category: "settings",
    isSudo: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      args =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || args;

      if (!args) {
        return await message.send({ text: `_usage: ${prefix}delsudo <user>_` });
      }

      const user = await getUser(args);
      const current = await Settings.sudo.get();
      const updated = current.filter((s) => s !== user.pn && s !== user.lid);

      await Settings.sudo.set(updated);

      return await message.send({
        text: `\`\`\`_sudo removed:_ @${user.pn.split("@")[0]}\`\`\``,
        mentions: [user.pn],
      });
    },
  },
  {
    name: "ban",
    category: "settings",
    isSudo: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      args =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || args;

      if (!args) {
        return await message.send({ text: `_usage: ${prefix}ban <user>_` });
      }

      const user = await getUser(args);
      await Settings.banned.set([user.pn, user.lid].filter(Boolean));

      return await message.send({
        text: `\`\`\`_banned:_ @${user.pn.split("@")[0]}\`\`\``,
        mentions: [user.pn],
      });
    },
  },
  {
    name: "getban",
    category: "settings",
    isSudo: true,
    run: async (client: WASocket, message: Serialize) => {
      const banned = await Settings.banned.get();
      const pnOnly = banned.filter((s) => s.endsWith("@s.whatsapp.net"));

      if (!pnOnly.length) {
        return await message.send({ text: "_no banned users_" });
      }

      return await message.send({
        text: `_banned list:_\n${pnOnly
          .map((s, i) => `${i + 1}. @${s.split("@")[0]}`)
          .join("\n")}`,
        mentions: pnOnly,
      });
    },
  },
  {
    name: "delban",
    category: "settings",
    isSudo: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      args =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || args;

      if (!args) {
        return await message.send({ text: `_usage: ${prefix}delban <user>_` });
      }

      const user = await getUser(args);
      const current = await Settings.banned.get();
      const updated = current.filter((s) => s !== user.pn && s !== user.lid);

      await Settings.banned.set(updated);

      return await message.send({
        text: `\`\`\`_ban removed:_ @${user.pn.split("@")[0]}\`\`\``,
        mentions: [user.pn],
      });
    },
  },
  {
    name: "mode",
    category: "settings",
    isSudo: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      const newMode = args?.trim()?.toLowerCase();
      if (!newMode || !["private", "public"].includes(newMode)) {
        const current = await Settings.mode.get();
        return await message.send({
          text: `_usage: ${prefix}mode <private|public>_\n_current mode:_ *${current}*`,
        });
      }

      await Settings.mode.set(newMode);
      return await message.send({ text: `_mode set to:_ *${newMode}*` });
    },
  },
] satisfies Command[];
