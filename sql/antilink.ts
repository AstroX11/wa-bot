import { DataTypes, Op } from "sequelize";
import sequelize from "../client/database.ts";

const AntiLink = sequelize.define(
  "antilinks",
  {
    jid: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    status: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false, defaultValue: "kick" },
  },
  { timestamps: false }
);

await AntiLink.sync();

export const antilinkSet = async (
  jid: string,
  status: number,
  action: "kick" | "delete" = "kick"
) => {
  return await AntiLink.upsert({ jid, status, action });
};

export type AntiLinkRecord = {
  jid: string;
  status: number;
  action: "kick" | "delete";
};

export const GetAntiLink = async (
  jid: string
): Promise<AntiLinkRecord | null> => {
  const record = await AntiLink.findOne({ where: { jid } });
  return record ? (record.get({ plain: true }) as AntiLinkRecord) : null;
};

export const DelAntiLink = async (jid: string) => {
  return await AntiLink.destroy({ where: { jid } });
};

export const GetAllAntiLinks = async () => {
  return await AntiLink.findAll();
};
