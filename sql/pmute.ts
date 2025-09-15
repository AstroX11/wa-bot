import { DataTypes, Op } from "sequelize";
import sequelize from "../client/database.ts";

const PMute = sequelize.define(
  "pmutes",
  {
    jid: { type: DataTypes.STRING, allowNull: false },
    pn: { type: DataTypes.STRING, allowNull: false },
    lid: { type: DataTypes.STRING, allowNull: true },
  },
  { timestamps: false },
);

await PMute.sync();

export const pmuteAdd = async (jid: string, pn: string, lid?: string) => {
  return await PMute.upsert({ jid, pn, lid });
};

export const pmuteDel = async (jid: string, pn: string) => {
  return await PMute.destroy({ where: { jid, pn } });
};

export const pmuteGet = async (jid: string) => {
  const records = await PMute.findAll({ where: { jid } });
  return records.map(
    (r: any) =>
      r.get({ plain: true }) as { jid: string; pn: string; lid?: string },
  );
};

export const pmuteClear = async (jid: string) => {
  return await PMute.destroy({ where: { jid } });
};

export const isPMuted = async (jid: string, id: string) => {
  const record = await PMute.findOne({
    where: {
      jid,
      [Op.or]: [{ pn: id }, { lid: id }],
    },
  });
  return !!record;
};
