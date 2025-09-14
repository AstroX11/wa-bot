import { readdirSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { jidNormalizedUser, type WASocket } from "baileys";
import { Settings } from "../sql/bot.ts";
import { isAdmin } from "./group.ts";
import type { Serialize } from "../utils/serialize.ts";

export type Command = {
  name?: string;
  isSudo?: boolean;
  isGroup?: boolean;
  requiresAdmin?: boolean;
  aliases?: string[];
  category?: string;
  event?: string | boolean;
  run: (client: WASocket, message: Serialize, args: string) => Promise<any>;
};

const commands = new Map<string, Command>();
const eventCommands: Command[] = [];

export const loadCommands = async () => {
  try {
    const files = readdirSync(join(process.cwd(), "plugins"));
    const cmds = new Map<string, Command>();
    const evts: Command[] = [];

    for (const file of files) {
      if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;
      try {
        const modulePath = pathToFileURL(
          join(process.cwd(), "plugins", file)
        ).href;
        const { default: exported } = await import(
          modulePath + `?update=${Date.now()}`
        );

        const list = Array.isArray(exported) ? exported : [exported];

        for (const command of list) {
          if (typeof command?.run !== "function") continue;

          // normal command (with name)
          if (command?.name) {
            const cmd: Command = {
              name: command.name.toLowerCase(),
              aliases:
                command?.aliases?.map((a: string) => a.toLowerCase()) || [],
              isGroup: command?.isGroup || false,
              requiresAdmin: command?.requiresAdmin || false,
              isSudo: command?.isSudo || false,
              category: command?.category || "extra",
              event: command?.event || false,
              run: command.run,
            };

            cmds.set(cmd.name!, cmd);
            for (const alias of cmd.aliases!) cmds.set(alias, cmd);
            if (cmd.event) evts.push(cmd);
          }
          // event-only command (no name)
          else if (command?.event) {
            const evt: Command = {
              event: command.event,
              run: command.run,
            };
            evts.push(evt);
          }
        }
      } catch (err) {
        console.error("failed to load", file, err);
      }
    }

    commands.clear();
    for (const [k, v] of cmds) commands.set(k, v);

    eventCommands.length = 0;
    eventCommands.push(...evts);
  } catch (err) {
    console.error("command loader error", err);
  }
};

setInterval(loadCommands, 2000);

const prefixes: string | string[] = (await Settings.prefix.get()) || "";

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

  // run event commands truly in parallel (non-blocking)
  for (const cmd of eventCommands) {
    (async () => {
      try {
        await cmd.run(client, message, message.text!);
      } catch (e) {
        console.error("event cmd error", cmd.name || "[event-only]", e);
      }
    })();
  }

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

  if (
    !(await Settings.sudo.get()).includes(message.sender!) &&
    (await Settings.mode.get()) == "private"
  ) {
    return;
  }

  if (cmd?.isSudo && (await Settings.sudo.get()).includes(message.sender!)) {
    return await message.send({ text: "_for my owners only!_" });
  }

  if (cmd?.isGroup && !message.isGroup) {
    return await message.send({ text: "_for group chats only!_" });
  }

  if (message.isGroup && cmd?.requiresAdmin) {
    const participants = await client
      .groupMetadata(message.chat)
      .then((p) => p.participants);

    const isBotAdmin = await isAdmin(
      participants,
      jidNormalizedUser(client.user!.id)
    );

    if (!(await isAdmin(participants, message.sender!))) {
      return await message.send({ text: "_You are not a group admin_" });
    }
    if (!isBotAdmin) {
      return await message.send({ text: "_I am not a group admin_" });
    }
  }

  try {
    await cmd.run(client, message, args);
  } catch (e) {
    console.error("command error", cmdName, e);
  }
};
