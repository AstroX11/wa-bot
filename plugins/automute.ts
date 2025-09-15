import type { Command } from "../utils/plugins.ts";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { setAutoMute } from "../sql/automute.ts";

export default [
  {
    name: "automute",
    isGroup: true,
    category: "group",
    run: async (client: WASocket, message: Serialize, args: string) => {
      const [sub] = args.split(" ");
      if (!sub)
        return await message.send({
          text: "_provide a time e.g .automute 23:00_",
        });

      await setAutoMute(message.chat, sub, "mute");
      return await message.send({ text: `_group will mute at ${sub}_` });
    },
  },
  {
    name: "autounmute",
    isGroup: true,
    category: "group",
    run: async (client: WASocket, message: Serialize, args: string) => {
      const [sub] = args.split(" ");
      if (!sub)
        return await message.send({
          text: "_provide a time e.g .autounmute 07:00_",
        });

      await setAutoMute(message.chat, sub, "unmute");
      return await message.send({ text: `_group will unmute at ${sub}_` });
    },
  },
] satisfies Command[];
