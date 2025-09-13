import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";

export default async (msg: Serialize, client: WASocket) => {
  if (msg.text && msg.text == "ping") {
    const start = Date.now();
    const m = await msg.send({ text: "pong" });

    const end = Date.now();
    await msg.send({
      edit: { id: m.id },
      text: `\`\`\`::: ${end - start} ms :::\`\`\``,
    });
  }
};
