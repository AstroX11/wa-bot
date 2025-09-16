import { DataTypes } from "sequelize";
import sequelize from "../client/database.ts";

const Cookie = sequelize.define(
  "cookies",
  {
    platform: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    value: { type: DataTypes.TEXT, allowNull: false },
  },
  { timestamps: false }
);

await Cookie.sync();

export const setCookie = async (
  platform: "youtube" | "facebook",
  value: string
) => {
  return await Cookie.upsert({ platform, value });
};

export const getCookie = async (platform: "youtube" | "facebook") => {
  const record = await Cookie.findOne({ where: { platform } });
  return record ? (record.get("value") as string) : undefined;
};

export const clearCookie = async (platform: "youtube" | "facebook") => {
  return await Cookie.destroy({ where: { platform } });
};
