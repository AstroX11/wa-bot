import type { Command } from "../utils/plugins.ts";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { getUser } from "../utils/extract.ts";
import { jidNormalizedUser } from "baileys";
import {
  autoKickAdd,
  autoKickGet,
  autoKickDel,
  autoKickClear,
} from "../sql/autokick.ts";

export default {
  name: "autokick",
  isGroup: true,
  category: "group",
  run: async (client: WASocket, message: Serialize, args: string) => {
    const jid = jidNormalizedUser(message.chat);
    const [sub, target] = args.split(" ");

    if (!sub || sub === "help") {
      return await message.send({
        text: "```autokick usage\n\n.autokick add <@user>\n.autokick del <@user>\n.autokick list\n.autokick clear```",
      });
    }

    const addressmode = await client
      .groupMetadata(message.chat)
      .then((a) => a.addressingMode);

    if (sub === "add") {
      const user =
        //@ts-ignore
        message?.message?.[message.mtype]?.contextInfo?.participant || target;
      if (!user)
        return await message.send({
          text: "_mention or provide a user to autokick_",
        });

      const { pn, lid } = await getUser(user);

      await autoKickAdd(jid, pn, lid);

      if (addressmode == "pn") {
        client.ev.emit("group-participants.update", {
          id: message.chat,
          author: "",
          participants: [pn],
          action: "add",
        });
      } else {
        client.ev.emit("group-participants.update", {
          id: message.chat,
          author: "",
          participants: [lid],
          action: "add",
        });
      }

      return await message.send({
        text: `_autokick added for @${pn.split("@")[0]}_`,
        mentions: [pn],
      });
    }

    if (sub === "del") {
      if (!target)
        return await message.send({ text: "_provide user to delete_" });
      const { pn } = await getUser(target);
      await autoKickDel(jid, pn);
      return await message.send({
        text: `_autokick removed for @${pn.split("@")[0]}_`,
        mentions: [pn],
      });
    }

    if (sub === "list") {
      const records = await autoKickGet(jid);
      if (!records.length)
        return await message.send({ text: "_no autokick records_" });

      const mentions: string[] = [];
      const listLines = await Promise.all(
        records.map(async (r: any, i: number) => {
          const { pn } = await getUser(r.pn || r.lid);
          mentions.push(pn);
          return `${i + 1}. @${pn.split("@")[0]}`;
        }),
      );

      return await message.send({
        text: "```autokick list\n" + listLines.join("\n") + "```",
        mentions,
      });
    }

    if (sub === "clear") {
      await autoKickClear(jid);
      return await message.send({ text: "_autokick cleared_" });
    }

    return await message.send({ text: "_invalid subcommand_" });
  },
} satisfies Command;
