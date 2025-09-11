import makeWASocket, {
  delay,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  type CacheStore,
} from "../../Baileys/lib/index.js";
import { Boom } from "@hapi/boom";
import NodeCache from "@cacheable/node-cache";
import * as P from "pino";
import authstate from "../sql/authstate.ts";
import { add_message, getMessage } from "../sql/messages.ts";
import messages from "../events/messages.ts";

const logger = P.pino({
  level: "debug",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: { colorize: true },
        level: "warn",
      },
      {
        target: "pino/file",
        options: { destination: "./wa-logs.txt" },
        level: "debug",
      },
    ],
  },
});

const msgRetryCounterCache = new NodeCache() as CacheStore;

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
  });

  if (!sock.authState.creds.registered) {
    await delay(10000);
    const code = await sock.requestPairingCode("2348060598064", "12345678");
    console.log(`Pairing code: ${code}`);
  }

  sock.ev.process(
    // events is a map for event name => event data
    async (events) => {
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

        if (connection === "open") {
          console.log("connection update", update);
        }
      }

      if (events.call) {
        console.log("recv call event", events.call);
      }

      if (events["messages.upsert"]) {
        const upsert = events["messages.upsert"];

        const protocolMessage = upsert.messages?.[0]?.message?.protocolMessage;
        if (protocolMessage?.type === 0) {
          sock.ev.emit("messages.delete", {
            keys: [protocolMessage.key!],
          });
        }
        await messages(upsert.messages[0]);
      }

      if (events["presence.update"]) {
        console.log(events["presence.update"]);
      }

      if (events["chats.update"]) {
        console.log(events["chats.update"][0].messages?.[0].message);
      }

      if (events["messaging-history.set"]) {
        for (const message of events["messaging-history.set"].messages) {
          await add_message(message);
        }
      }

      if (events["messages.delete"]) {
        console.log("deleted message:", events["messages.delete"]);
      }
    }
  );
  return sock;
};

startSock();
