import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import type { Command } from "../utils/plugins.ts";
import { performance } from "perf_hooks";
import { formatRuntime } from "../utils/extras.ts";

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
  {
    name: "runtime",
    aliases: ["uptime"],
    category: "utility",
    run: async (_, m) => {
      return await m.send({
        text: `\`\`\`runtime ::: ${formatRuntime(performance.now())}\`\`\``,
      });
    },
  },
] satisfies Command[];
