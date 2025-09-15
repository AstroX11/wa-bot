import type { Command } from "../utils/plugins.ts";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { getUser } from "../utils/extract.ts";
import { jidNormalizedUser } from "baileys";
import {
  pmuteAdd,
  pmuteDel,
  pmuteGet,
  pmuteClear,
  isPMuted,
} from "../sql/pmute.ts";

export default [
  {
    name: "pmute",
    category: "group",
    isGroup: true,
    run: async (client: WASocket, message: Serialize, args: string) => {
      const jid = jidNormalizedUser(message.chat);
      const [sub, target] = args.split(" ");

      if (!sub || sub === "help") {
        return await message.send({
          text: "```pmute usage\n\n.pmute add <@user>\n.pmute del <@user>\n.pmute list\n.pmute clear```",
        });
      }

      if (sub === "add") {
        const user =
          //@ts-ignore
          message?.message?.[message.mtype]?.contextInfo?.participant || target;
        if (!user)
          return await message.send({
            text: "_mention or provide a user to mute_",
          });

        const { pn, lid } = await getUser(user);
        await pmuteAdd(jid, pn, lid);
        return await message.send({
          text: `_pmute added for @${pn.split("@")[0]}_`,
          mentions: [pn],
        });
      }

      if (sub === "del") {
        if (!target)
          return await message.send({ text: "_provide user to unmute_" });
        const { pn } = await getUser(target);
        await pmuteDel(jid, pn);
        return await message.send({
          text: `_pmute removed for @${pn.split("@")[0]}_`,
          mentions: [pn],
        });
      }

      if (sub === "list") {
        const records = await pmuteGet(jid);
        if (!records.length)
          return await message.send({ text: "_no pmute records_" });

        const list = records
          .map((r: any, i: number) => `${i + 1}. @${r.pn.split("@")[0]}`)
          .join("\n");
        return await message.send({
          text: "```pmute list\n" + list + "```",
          mentions: records.map((p: any) => p.pn),
        });
      }

      if (sub === "clear") {
        await pmuteClear(jid);
        return await message.send({ text: "_pmute cleared_" });
      }

      return await message.send({ text: "_invalid subcommand_" });
    },
  },
  {
    event: true,
    run: async (client: WASocket, message: Serialize) => {
      if (!message.isGroup || !message.sender) return;

      const muted = await isPMuted(message.chat, message.sender);
      if (!muted) return;

      await message.send({
        delete: {
          id: message.id,
          fromMe: false,
          remoteJid: message.chat,
          participant: message.sender,
        },
      });
    },
  },
] satisfies Command[];
