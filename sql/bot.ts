import { DataTypes } from "sequelize";
import sequelize from "../client/database.ts";

const SettingsModel = sequelize.define("settings", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  botname: { type: DataTypes.STRING, allowNull: true },
  prefix: { type: DataTypes.TEXT, allowNull: true },
  sudo: { type: DataTypes.TEXT, allowNull: true },
  banned: { type: DataTypes.TEXT, allowNull: true },
  mode: { type: DataTypes.STRING, allowNull: true, defaultValue: "private" },
});

await SettingsModel.sync();

async function setField(field: string, value: any) {
  let val = value;
  if (Array.isArray(value)) val = JSON.stringify(value);

  const row = await SettingsModel.findByPk(1);
  if (row) {
    row.set(field, val);
    await row.save();
  } else {
    await SettingsModel.create({ [field]: val });
  }
}

async function getField(field: string) {
  const row = await SettingsModel.findByPk(1);
  if (!row) return null;

  const val = row.get(field) as string | null;
  if (!val) return null;

  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

async function delField(field: string) {
  const row = await SettingsModel.findByPk(1);
  if (!row) return;
  row.set(field, null);
  await row.save();
}

export const Settings = {
  botname: {
    set: async (v: string) => await setField("botname", v),
    get: async () => (await getField("botname")) as string | null,
    del: async () => await delField("botname"),
  },
  prefix: {
    set: async (v: string | string[] | null) => await setField("prefix", v),
    get: async () => (await getField("prefix")) as string | string[] | null,
    del: async () => await delField("prefix"),
  },
  sudo: {
    set: async function (v: string | string[]) {
      const current = (await this.get()) || [];
      const values = Array.isArray(v) ? v : [v];
      const merged = Array.from(new Set([...current, ...values]));
      await setField("sudo", merged);
    },
    get: async () => {
      const v = await getField("sudo");
      return (Array.isArray(v) ? v : v ? [v] : []) as string[];
    },
    del: async () => await delField("sudo"),
  },
  banned: {
    set: async function (v: string | string[]) {
      const current = (await this.get()) || [];
      const values = Array.isArray(v) ? v : [v];
      const merged = Array.from(new Set([...current, ...values]));
      await setField("banned", merged);
    },
    get: async () => {
      const v = await getField("banned");
      return (Array.isArray(v) ? v : v ? [v] : []) as string[];
    },
    del: async () => await delField("banned"),
  },
  mode: {
    set: async (v: string) => await setField("mode", v),
    get: async () =>
      (await getField("mode").then((v) => v || "private")) as string | null,
    del: async () => await delField("mode"),
  },
};
