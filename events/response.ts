import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";

export default async (msg: Serialize, client: WASocket) => {
  if (msg.text && msg.text == "ping") {
    const start = Date.now();
    const m = await client.sendMessage(msg.chat, { text: "pong" });

    const end = Date.now();
    await client.sendMessage(msg.chat, {
      edit: m?.key,
      text: `\`\`\`::: ${end - start} ms :::\`\`\``,
    });
  }
};
