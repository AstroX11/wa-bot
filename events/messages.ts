import type { WAMessage, WASocket } from "baileys";
import { addMessage } from "../sql/messages.ts";
import serialize from "../utils/serialize.ts";
import { handleCommand } from "../utils/plugins.ts";

export default async (message: WAMessage, client: WASocket) => {
  let tasks: unknown[] = [];

  const msg = await serialize(message, client);

  tasks.push(handleCommand(client, msg));

  tasks.push(addMessage(JSON.parse(JSON.stringify(message, null, 2))));

  await Promise.all(tasks);
};
