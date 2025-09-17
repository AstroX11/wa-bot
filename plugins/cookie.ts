import type { Command } from "../utils/plugins.ts";
import type { WASocket } from "baileys";
import type { Serialize } from "../utils/serialize.ts";
import { setCookie, getCookie, clearCookie, Cookie } from "../sql/cookie.ts";

export default [
  {
    name: "cookie",
    category: "utility",
    run: async (client: WASocket, message: Serialize, args: string) => {
      const platformsRows = await Cookie.findAll({ attributes: ["platform"] });
      const platforms = platformsRows.map(
        (row) => row.get("platform") as string
      );

      if (!args) {
        const list = platforms.length
          ? platforms
              .map(
                (p) => `.cookie ${p}=<value>\n.cookie ${p}\n.cookie clear ${p}`
              )
              .join("\n")
          : ".cookie bing=<value>\n.cookie bing\n.cookie clear bing";
        return await message.send({
          text: `\`\`\`COOKIE SETUP\n\n${list}\`\`\``,
        });
      }

      const lowerArgs = args.trim().toLowerCase();

      if (lowerArgs.startsWith("clear")) {
        const platform = lowerArgs.replace("clear", "").trim();
        if (!platforms.includes(platform)) {
          return await message.send({
            text: `_invalid platform: ${platform}_`,
          });
        }
        await clearCookie(platform);
        return await message.send({ text: `_cookie cleared for ${platform}_` });
      }

      if (lowerArgs.includes("=")) {
        const [platform, ...rest] = lowerArgs.split("=");
        const value = rest.join("=").trim();
        if (!platform || !value) {
          return await message.send({
            text: "_invalid format, use platform=value_",
          });
        }
        await setCookie(platform, value);
        return await message.send({ text: `_cookie set for ${platform}_` });
      }

      const platform = lowerArgs;
      if (!platforms.includes(platform)) {
        return await message.send({
          text: `_unsupported platform: ${platform}_`,
        });
      }

      const cookie = await getCookie(platform);
      if (!cookie) {
        return await message.send({ text: `_no cookie set for ${platform}_` });
      }

      return await message.send({ text: `cookie for ${platform}:\n${cookie}` });
    },
  },
] satisfies Command[];
