import type { WAMessage } from "baileys";
import { add_message } from "../sql/messages.ts";
import serialize from "../utils/serialize.ts";

export default async (message: WAMessage) => {
  let tasks: unknown[] = [];

  tasks.push(add_message(message));

  tasks.push(serialize(message).then((data) => console.log(data)));

  await Promise.all(tasks);
};
