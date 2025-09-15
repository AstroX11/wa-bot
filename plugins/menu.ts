import os from "os";
import process from "process";
import { performance } from "perf_hooks";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { Settings } from "../sql/bot.ts";
import { uniqueCommands } from "../utils/plugins.ts";

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

const fancyMap: Record<string, string> = {
  a: "ᴀ",
  b: "ʙ",
  c: "ᴄ",
  d: "ᴅ",
  e: "ᴇ",
  f: "ғ",
  g: "ɢ",
  h: "ʜ",
  i: "ɪ",
  j: "ᴊ",
  k: "ᴋ",
  l: "ʟ",
  m: "ᴍ",
  n: "ɴ",
  o: "ᴏ",
  p: "ᴘ",
  q: "ǫ",
  r: "ʀ",
  s: "s",
  t: "ᴛ",
  u: "ᴜ",
  v: "ᴠ",
  w: "ᴡ",
  x: "x",
  y: "ʏ",
  z: "ᴢ",
};

function fancyText(input: string): string {
  let out = "";
  for (const ch of input) {
    const lower = ch.toLowerCase();
    out += fancyMap[lower] || ch;
  }
  return out;
}

export default {
  name: "menu",
  aliases: ["help", "commands"],
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
