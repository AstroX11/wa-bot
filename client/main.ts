import makeWASocket, {
  delay,
  DisconnectReason,
  isJidGroup,
  makeCacheableSignalKeyStore,
  type CacheStore,
} from "baileys";
import { Boom } from "@hapi/boom";
import NodeCache from "@cacheable/node-cache";
import { pino } from "pino";
import authstate from "../sql/authstate.ts";
import messages from "../events/messages.ts";
import { getMessage } from "../sql/messages.ts";
import { cachedGroupMetadata } from "../utils/cache.ts";
import config from "../config.ts";
import { add_contact } from "../sql/contacts.ts";

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
    getMessage,
    cachedGroupMetadata,
  });

  if (!sock.authState.creds.registered) {
    await delay(10000);
    const code = await sock.requestPairingCode("2348060598064", "12345678");
    console.log(`Pairing code: ${code}`);
  }

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
    }

    if (events.call) {
      console.log("recv call event", events.call);
    }
    if (events["lid-mapping.update"]) {
      const { lid, pn } = events["lid-mapping.update"];
      await add_contact(pn, lid);
    }

    if (events["messages.upsert"]) {
      const upsert = events["messages.upsert"];

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

    if (events["messages.delete"]) {
      console.log("deleted message:", events["messages.delete"]);
    }
  });
  return sock;
};

startSock();
