import type { WAMessage, WASocket } from "baileys";
import { addMessage } from "../sql/messages.ts";
import serialize from "../utils/serialize.ts";
import response from "./response.ts";

export default async (message: WAMessage, client: WASocket) => {
  let tasks: unknown[] = [];

  const msg = await serialize(message, client);

  tasks.push(response(msg, client));

  tasks.push(addMessage(message));

  await Promise.all(tasks);
};
