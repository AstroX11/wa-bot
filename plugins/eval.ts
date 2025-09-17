import { inspect } from "node:util";
import { Settings } from "../sql/bot.ts";
import type { Command } from "../utils/plugins.ts";

export default {
  event: true,
  run: async (client, msg) => {
    const text = msg.text;
    if (!text) return;

    if (text.startsWith("$")) {
      const sudo = await Settings.sudo.get();
      if (!sudo.includes(msg.sender)) return;
      try {
        const result = await eval(`(async () => { ${text.slice(1)} })()`);
        const output = inspect(result, { depth: 1 });
        await msg.send({ text: "```" + output + "```" });
      } catch (e) {
        await msg.send({ text: "```error: " + e + "```" });
      }
    }
  },
} satisfies Command;
