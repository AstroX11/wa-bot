import { DataTypes } from "sequelize";
import sequelize from "../client/database.ts";

const AutoKick = sequelize.define(
  "autokicks",
  {
    jid: { type: DataTypes.STRING, allowNull: false },
    pn: { type: DataTypes.STRING, allowNull: false },
    lid: { type: DataTypes.STRING, allowNull: true },
  },
  { timestamps: false },
);

await AutoKick.sync();

export const autoKickAdd = async (jid: string, pn: string, lid?: string) => {
  return await AutoKick.upsert({ jid, pn, lid });
};

export const autoKickGet = async (jid: string) => {
  const records = await AutoKick.findAll({ where: { jid } });
  return records.map(
    (r) => r.get({ plain: true }) as { jid: string; pn: string; lid?: string },
  );
};

export const autoKickDel = async (jid: string, pn: string) => {
  return await AutoKick.destroy({ where: { jid, pn } });
};

export const autoKickClear = async (jid: string) => {
  return await AutoKick.destroy({ where: { jid } });
};

export const isAutoKick = async (jid: string, id: string): Promise<boolean> => {
  const records = await autoKickGet(jid);
  for (const r of records) {
    if (r.pn === id || r.lid === id) return true;
  }
  return false;
};
