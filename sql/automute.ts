import { DataTypes } from "sequelize";
import sequelize from "../client/database.ts";

export const AutoMute = sequelize.define("automute", {
  jid: { type: DataTypes.STRING, allowNull: false },
  time: { type: DataTypes.STRING, allowNull: false }, // "HH:MM"
  action: { type: DataTypes.STRING, allowNull: false }, // "mute" | "unmute"
});

await AutoMute.sync();

export const setAutoMute = async (
  jid: string,
  time: string,
  action: "mute" | "unmute",
) => {
  await AutoMute.upsert({ jid, time, action });
};

export const getAutoMutes = async () => {
  return await AutoMute.findAll({ raw: true });
};

export const clearAutoMute = async (jid: string, action: "mute" | "unmute") => {
  await AutoMute.destroy({ where: { jid, action } });
};
