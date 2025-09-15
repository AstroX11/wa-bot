import type { Command } from "../utils/plugins.ts";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import {
  antiWordAdd,
  antiWordDel,
  antiWordGet,
  antiWordClear,
  matchAntiWord,
} from "../sql/antiword.ts";
import { isAdmin } from "../utils/group.ts";

export default [
  {
    name: "antiword",
    isGroup: true,
    category: "group",
    run: async (client: WASocket, message: Serialize, args: string) => {
      const jid = message.chat;
      const [sub, ...rest] = args.split(" ");
      const input = rest.join(" ").trim();

      if (!sub || sub === "help") {
        return await message.send({
          text: "```antiword usage\n\n.antiword add <word1,word2>\n.antiword del <word>\n.antiword list\n.antiword clear```",
        });
      }

      if (sub === "add") {
        if (!input)
          return await message.send({ text: "_provide words to add_" });
        const words = input
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean);
        await antiWordAdd(jid, words);
        return await message.send({
          text: `_antiword added: ${words.join(", ")}_`,
        });
      }

      if (sub === "del") {
        if (!input)
          return await message.send({ text: "_provide a word to delete_" });
        await antiWordDel(jid, input);
        return await message.send({
          text: `_antiword removed for "${input}"_`,
        });
      }

      if (sub === "list") {
        const list = await antiWordGet(jid);
        if (!list.length)
          return await message.send({ text: "_no antiword records_" });
        return await message.send({
          text:
            "```antiword list\n" +
            list.map((r, i) => `${i + 1}. ${r.word}`).join("\n") +
            "```",
        });
      }

      if (sub === "clear") {
        await antiWordClear(jid);
        return await message.send({ text: "_antiword cleared_" });
      }

      return await message.send({ text: "_invalid subcommand_" });
    },
  },
  {
    event: true,
    run: async (client: WASocket, message: Serialize) => {
      if (!message.isGroup || !message.text) return;

      const participants = await client
        .groupMetadata(message.chat)
        .then((p) => p.participants);

      if (await isAdmin(participants, message.sender)) return;
      const hit = await matchAntiWord(message.chat, message.text);
      if (!hit) return;

      await client.sendMessage(message.chat, {
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
