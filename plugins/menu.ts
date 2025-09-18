import os from "os";
import process from "process";
import { performance } from "perf_hooks";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { Settings } from "../sql/bot.ts";
import { type Command, uniqueCommands } from "../utils/plugins.ts";
import { fancyText, formatMemUsage, formatRuntime } from "../utils/extras.ts";

export default {
  name: "menu",
  aliases: ["help", "commands"],
  category: "utility",
  run: async (client: WASocket, message: Serialize) => {
    const botName = (await Settings.botname.get()) || "Bot";
    const owner = client.user?.name || "Unknown";
    const mode = await Settings.mode.get();
    const uptime = performance.now();

    const allCommands = uniqueCommands;

    const categorized: Record<string, string[]> = {};
    for (const cmd of allCommands) {
      if (!cmd.name) continue;
      const cat = cmd.category || "extra";
      if (!categorized[cat]) categorized[cat] = [];
      categorized[cat].push(cmd.name);
    }

    const categories = Object.keys(categorized);

    const date = new Date();
    const day = date.toLocaleDateString("en-US", { weekday: "long" });
    const tm = date.toLocaleTimeString("en-US");

    let infoBlock =
      "```" +
      `╭─── ${botName} ────\n` +
      `│ User: @${message.sender.split("@")[0]}\n` +
      `│ Owner: ${owner}\n` +
      `│ Plugins: ${allCommands.length}\n` +
      `│ Mode: ${mode}\n` +
      `│ Uptime: ${formatRuntime(uptime)}\n` +
      `│ Platform: ${os.platform()}\n` +
      `│ Ram: ${formatMemUsage()}\n` +
      `│ Day: ${day}\n` +
      `│ Date: ${date.toLocaleDateString()}\n` +
      `│ Time: ${tm}\n` +
      `│ Node: ${process.version}\n` +
      "╰─────────────```\n";

    let cmdBlock = "";
    let counter = 1;
    for (const cat of categories) {
      const cmds = categorized[cat];
      const fancyCat = fancyText(cat);

      cmdBlock += "```" + `╭─── ${fancyCat} ───\n`;
      for (const cmd of cmds) {
        cmdBlock += `│ ${counter++} ${cmd}\n`;
      }
      cmdBlock += "╰───────```\n";
    }

    return await message.send({
      text: infoBlock + cmdBlock,
      mentions: [message.sender],
    });
  },
} satisfies Command;
