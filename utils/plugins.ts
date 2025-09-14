import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";

type Command = {
  name: string;
  aliases?: string[];
  category?: string;
  event?: string | boolean;
  run: (client: WASocket, message: Serialize, args: string) => Promise<any>;
};

const commands = new Map<string, Command>();

export const loadCommands = async () => {
  try {
    const files = readdirSync(join(process.cwd(), "plugins"));
    const cmds = new Map<string, Command>();

    for (const file of files) {
      if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;
      try {
        const modulePath = pathToFileURL(
          join(process.cwd(), "plugins", file)
        ).href;
        const { default: command } = await import(
          modulePath + `?update=${Date.now()}`
        );
        if (!command?.name || typeof command.run !== "function") continue;

        const cmd: Command = {
          name: command?.name?.toLowerCase(),
          aliases: command?.aliases?.map((a: string) => a.toLowerCase()) || [],
          category: command?.category || "extra",
          run: command?.run,
        };

        cmds.set(cmd.name, cmd);
        for (const alias of cmd?.aliases!) cmds.set(alias, cmd);
      } catch {}
    }

    commands.clear();
    for (const [k, v] of cmds) commands.set(k, v);
  } catch {}
};

setInterval(loadCommands, 2000);

const prefixes: string | string[] = [".", "!"]; // can be ".", "!@.", [".", "!", "@"], or ""

function matchPrefix(text: string): { prefix: string; content: string } | null {
  if (typeof prefixes === "string") {
    if (prefixes === "") return { prefix: "", content: text.trim() };
    for (const p of prefixes.split("")) {
      if (text.trim().startsWith(p))
        return { prefix: p, content: text.trim().slice(p.length).trim() };
    }
    return null;
  } else {
    for (const p of prefixes) {
      if (p === "" || text.trim().startsWith(p))
        return { prefix: p, content: text.trim().slice(p.length).trim() };
    }
    return null;
  }
}

export const handleCommand = async (client: WASocket, message: Serialize) => {
  if (!message.text) return;

  const prefMatch = matchPrefix(message.text);
  if (!prefMatch) return;
  const withoutPrefix = prefMatch.content;
  if (!withoutPrefix) return;

  const normalized = withoutPrefix.replace(/\s+/g, " ").trim();
  const [rawCmd, ...rest] = normalized.split(" ");
  const cmdName = rawCmd.toLowerCase();
  const args = rest.join(" ");

  const cmd = commands.get(cmdName);
  if (!cmd) return;

  try {
    await cmd.run(client, message, args);
  } catch {}
};
