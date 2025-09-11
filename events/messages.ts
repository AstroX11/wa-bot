import type { WAMessage, WASocket } from "baileys";
import { add_message } from "../sql/messages.ts";
import serialize from "../utils/serialize.ts";
import response from "./response.ts";

export default async (message: WAMessage, client: WASocket) => {
  let tasks: unknown[] = [];

  const msg = await serialize(message);

  tasks.push(response(msg, client));

  tasks.push(add_message(message));

  await Promise.all(tasks);
};
