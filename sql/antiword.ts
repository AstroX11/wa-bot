import { DataTypes } from "sequelize";
import sequelize from "../client/database.ts";
import { rectifyConfusion } from "unicode-confusables";

const AntiWord = sequelize.define(
  "antiwords",
  {
    jid: { type: DataTypes.STRING, allowNull: false },
    word: { type: DataTypes.STRING, allowNull: false },
  },
  { timestamps: false },
);

await AntiWord.sync();

export const antiWordAdd = async (jid: string, words: string | string[]) => {
  const arr = Array.isArray(words) ? words : [words];
  return await Promise.all(
    arr.map((w) => AntiWord.upsert({ jid, word: w.trim().toLowerCase() })),
  );
};

export const antiWordDel = async (jid: string, word: string) => {
  return await AntiWord.destroy({ where: { jid, word: word.toLowerCase() } });
};

export const antiWordGet = async (jid: string) => {
  const records = await AntiWord.findAll({ where: { jid } });
  return records.map(
    (r) => r.get({ plain: true }) as { jid: string; word: string },
  );
};

export const antiWordClear = async (jid: string) => {
  return await AntiWord.destroy({ where: { jid } });
};

function normalizeText(input: string): string {
  if (!input) return "";
  // Normalize compatibility + decomposition
  let out = input.normalize("NFKD");
  // rectify confusable chars to ASCII-like
  out = rectifyConfusion(out);
  // lower case
  out = out.toLowerCase();
  return out;
}

export const matchAntiWord = async (jid: string, text: string) => {
  if (!text) return false;
  const words = await antiWordGet(jid);
  if (!words.length) return false;

  const norm = normalizeText(text);

  return words.some((w) => {
    const pattern = w.word.trim();
    if (!pattern) return false;
    try {
      const regex = new RegExp(pattern, "iu"); // case-insensitive + unicode
      return regex.test(norm);
    } catch {
      // fallback: plain substring in normalized
      const safe = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex2 = new RegExp(safe, "iu");
      return regex2.test(norm);
    }
  });
};
