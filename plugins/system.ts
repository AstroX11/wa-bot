import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { performance } from "perf_hooks";

export default [
  {
    name: "ping",
    aliases: ["speed"],
    category: "utility",
    run: async (client: WASocket, message: Serialize, args: string) => {
      const start = performance.now();
      const sent = await client.sendMessage(message.chat, { text: "pong!" });
      const end = performance.now();
      const diff = (end - start).toFixed(2);

      await client.sendMessage(message.chat, {
        edit: sent?.key,
        text: `\`\`\`speed: ${diff} ms\`\`\``,
      });
    },
  },
];
