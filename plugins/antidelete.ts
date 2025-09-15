import type { Command } from "../utils/plugins.ts";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { setAntiDelete, getAntiDelete } from "../sql/antidelete.ts";

export default [
  {
    name: "antidelete",
    isGroup: true,
    category: "group",
    run: async (client: WASocket, message: Serialize, args: string) => {
      const sub = args ? args?.trim()?.toLowerCase() : undefined;

      if (!sub || sub === "help") {
        return await message.send({
          text: "```antidelete usage\n\n.antidelete on\n.antidelete off\n.antidelete status\n```",
        });
      }

      if (sub === "on") {
        await setAntiDelete(true);
        return await message.send({ text: "_antidelete enabled_" });
      }

      if (sub === "off") {
        await setAntiDelete(false);
        return await message.send({ text: "_antidelete disabled_" });
      }

      if (sub === "status") {
        const enabled = await getAntiDelete();
        return await message.send({
          text: `_antidelete is currently ${enabled ? "enabled" : "disabled"}_`,
        });
      }

      return await message.send({ text: "_invalid subcommand_" });
    },
  },
] satisfies Command[];
