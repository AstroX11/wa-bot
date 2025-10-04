import makeWASocket, {
  delay,
  DisconnectReason,
  isJidGroup,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  type CacheStore,
} from "baileys";
import { Boom } from "@hapi/boom";
import NodeCache from "@cacheable/node-cache";
import { pino } from "pino";
import authstate from "../sql/authstate.ts";
import messages from "../events/messages.ts";
import { getMessage, getMessageFull } from "../sql/messages.ts";
import { cachedGroupMetadata } from "../utils/cache.ts";
import config from "../config.ts";
import { AddContact } from "../sql/contacts.ts";
import { loadCommands } from "../utils/plugins.ts";
import { Settings } from "../sql/bot.ts";
import { isAutoKick } from "../sql/autokick.ts";
import { startScheduler } from "../utils/timer.ts";
import { getAntiDelete } from "../sql/antidelete.ts";

const logger = pino({
  level: config.NODE_ENV == "development" ? "info" : "error",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: { colorize: true },
        level: config.NODE_ENV == "development" ? "info" : "error",
      },
      {
        target: "pino/file",
        options: { destination: "./wa-logs.txt" },
        level: config.NODE_ENV == "development" ? "info" : "error",
      },
    ],
  },
});

logger.level = config.NODE_ENV == "development" ? "info" : "error";

const msgRetryCounterCache = new NodeCache() as CacheStore;
export const groupDataCache = new NodeCache();

const startSock = async () => {
  const { state, saveCreds } = await authstate();
  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    logger,
    syncFullHistory: false,
    getMessage,
    cachedGroupMetadata,
  });

  if (!sock.authState.creds.registered) {
    await delay(10000);
    const code = await sock.requestPairingCode("2348060598064", "12345678");
    console.log(`Pairing code: ${code}`);
  }

  loadCommands();

  sock.ev.process(async (events) => {
    if (events["creds.update"]) {
      await saveCreds();
    }

    if (events["connection.update"]) {
      const update = events["connection.update"];
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        if (
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut
        ) {
          startSock();
        } else {
          console.log("Connection closed. You are logged out.");
        }
      }

      if (connection == "open") {
        await sock.sendMessage(sock.user!.id, {
          text: `\`\`\`Bot Started\nPrefix: ${(await Settings.prefix.get()) || "non"
            }\`\`\``,
        });

        await Settings.sudo.set([
          jidNormalizedUser(sock.user!.id),
          jidNormalizedUser(sock.user!.lid),
        ]);
      }
    }

    if (events.call) {
      console.log("recv call event", events.call);
    }
    if (events["lid-mapping.update"]) {
      const { lid, pn } = events["lid-mapping.update"];
      await AddContact(pn, lid);
    }

    if (events["messages.upsert"]) {
      const upsert = events["messages.upsert"];
      if (upsert.type != "notify") return;

      if (isJidGroup(upsert.messages[0].key.remoteJid!)) {
        const chat = upsert.messages[0].key.remoteJid!;

        if (!groupDataCache.has(chat)) {
          const metadata = await sock.groupMetadata(chat);
          groupDataCache.set(chat, metadata);
        }
      }

      const protocolMessage = upsert.messages?.[0]?.message?.protocolMessage;
      if (protocolMessage?.type === 0) {
        sock.ev.emit("messages.delete", {
          keys: [protocolMessage.key!],
        });
      }
      await messages(upsert.messages[0], sock);
    }

    if (events["group-participants.update"]) {
      const update = events["group-participants.update"];

      if (update && update.action == "add") {
        const shouldKick = await isAutoKick(update.id, update.participants[0]);
        if (shouldKick) {
          await sock.groupParticipantsUpdate(
            update.id,
            [update.participants[0]],
            "remove"
          );
          await sock.sendMessage(update.id, {
            text: `_@${update.participants[0].split("@")[0]
              } kicked due to autokick_`,
            mentions: [update.participants[0]],
          });
        }
      }
    }

    if (events["messages.delete"]) {
      const update = events["messages.delete"];
      const isEnabled = await getAntiDelete();
      if (!isEnabled) return;

      if ("keys" in update) {
        for (const key of update.keys) {
          let msg = await getMessageFull(key);
          if (!msg) continue;

          await sock.sendMessage(
            sock.user!.id,
            { forward: msg },
            { quoted: msg }
          );
        }
      }
    }
  });
  startScheduler(sock);
  return sock;
};

startSock();
