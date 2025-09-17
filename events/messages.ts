import type { WAMessage, WASocket } from "baileys";
import { addMessage } from "../sql/messages.ts";
import serialize from "../utils/serialize.ts";
import { handleCommand } from "../utils/plugins.ts";

export default async (message: WAMessage, client: WASocket) => {
  const msg = await serialize(message, client);

  handleCommand(client, msg).catch(console.error);
  addMessage(JSON.parse(JSON.stringify(message, null, 2))).catch(console.error);
};
