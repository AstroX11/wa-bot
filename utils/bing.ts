import axios from "axios";
import * as cheerio from "cheerio";
import { getCookie } from "../sql/cookie.ts";

export const BingSearch = async (query: string) => {
  const cookies = await getCookie("bing");

  if (!cookies)
    return `\`\`\`BING SETUP\n\nplease get bing cookies first\nvisit https://bing.com\nf12 and type 'document.cookie' in console, copy and paste the cookies in the format below\n\ncookies bing=yourcookies\`\`\``;

  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
      Cookie: cookies,
    },
  });

  const $ = cheerio.load(data);
  const results: string[] = [];

  $("li.b_algo h2 a").each((_, el) => {
    const title = $(el).text().trim();
    const link = $(el).attr("href") || "";
    results.push(`${title}\n${link}`);
  });

  return results;
};
