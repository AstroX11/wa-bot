import type { Command } from "../utils/plugins.ts";
import { BingSearch } from "../utils/bing.ts";

export default [
  {
    name: "bing",
    category: "search",
    run: async (_, message, args) => {
      if (!args) return await message.send({ text: "_provide a query_" });
      const results = await BingSearch(args);
      if (typeof results === "string")
        return await message.send({ text: results });
      return await message.send({ text: results.join("\n\n") });
    },
  },
] satisfies Command[];
