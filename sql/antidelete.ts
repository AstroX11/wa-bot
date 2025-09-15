import { DataTypes } from "sequelize";
import sequelize from "../client/database.ts";

const AntiDelete = sequelize.define(
  "antidelete",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { timestamps: false },
);

await AntiDelete.sync();

export const setAntiDelete = async (enabled: boolean) => {
  const record = await AntiDelete.findByPk(1);
  if (record) {
    return await record.update({ enabled });
  }
  return await AntiDelete.create({ id: 1, enabled });
};

export const getAntiDelete = async (): Promise<boolean> => {
  const record = await AntiDelete.findByPk(1);
  return record ? (record.get("enabled") as boolean) : false;
};

export const clearAntiDelete = async () => {
  return await AntiDelete.destroy({ where: {} });
};
