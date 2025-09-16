import type { Command } from "../utils/plugins.ts";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { setCookie, getCookie, clearCookie } from "../sql/cookie.ts";

export default [
  {
    name: "cookie",
    category: "utility",
    run: async (client: WASocket, message: Serialize, args: string) => {
      if (!args) {
        return await message.send({
          text: "```COOKIE SETUP\n\n.cookie youtube=<value>\n.cookie facebook=<value>\n.cookie youtube\n.cookie facebook\n.cookie clear youtube\n.cookie clear facebook```",
        });
      }

      if (args.startsWith("clear")) {
        const platform = args.replace("clear", "").trim().toLowerCase();
        if (!["youtube", "facebook"].includes(platform)) {
          return await message.send({
            text: "_usage: cookie clear youtube_",
          });
        }
        await clearCookie(platform as "youtube" | "facebook");
        return await message.send({
          text: `_cookie cleared for ${platform}_`,
        });
      }

      if (args.includes("=")) {
        const [platform, ...rest] = args.split("=");
        const value = rest.join("=").trim();

        if (!platform || !value) {
          return await message.send({
            text: "_invalid format, use platform=value_",
          });
        }

        if (!["youtube", "facebook"].includes(platform)) {
          return await message.send({
            text: "_supported platforms: youtube, facebook_",
          });
        }

        await setCookie(platform as "youtube" | "facebook", value);
        return await message.send({
          text: `_cookie set for ${platform}_`,
        });
      }

      const platform = args.trim().toLowerCase();
      if (!["youtube", "facebook"].includes(platform)) {
        return await message.send({
          text: "_supported platforms: youtube, facebook_",
        });
      }

      const cookie = await getCookie(platform as "youtube" | "facebook");
      if (!cookie) {
        return await message.send({
          text: `_no cookie set for ${platform}_`,
        });
      }

      return await message.send({
        text: `cookie for ${platform}:\n${cookie}`,
      });
    },
  },
] satisfies Command[];
