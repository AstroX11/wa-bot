import os from "os";
import process from "process";
import { performance } from "perf_hooks";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { Settings } from "../sql/bot.ts";
import { commands } from "../utils/plugins.ts";

function formatRuntime(ms: number) {
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / (1000 * 60)) % 60;
  const hr = Math.floor(ms / (1000 * 60 * 60));
  return `${hr}h ${min}m ${sec}s`;
}

function formatMemUsage() {
  const mem = process.memoryUsage().rss / 1024 / 1024;
  return `${mem.toFixed(2)} MB`;
}

function fancyText(text: string) {
  return text[0].toUpperCase() + text.slice(1);
}

export default {
  name: "menu",
  aliases: ["help", "commands"],
  run: async (client: WASocket, message: Serialize) => {
    const botName = (await Settings.botname.get()) || "Bot";
    const owner = (await Settings.sudo.get())[0] || "unknown";
    const mode = await Settings.mode.get();
    const uptime = performance.now();

    const allCommands = Array.from(commands.values());

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
    for (const cat of categories) {
      const cmds = categorized[cat];
      const fancyCat = fancyText(cat);

      cmdBlock += "```" + `╭─── ${fancyCat} ───\n`;
      cmds.forEach((cmd, i) => {
        cmdBlock += `│ ${i + 1} ${cmd}\n`;
      });
      cmdBlock += "╰───────```\n";
    }

    return await message.send({
      text: infoBlock + cmdBlock,
      mentions: [message.sender],
    });
  },
};
