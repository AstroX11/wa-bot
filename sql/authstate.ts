import { DataTypes } from "sequelize";
import sequelize from "../client/database.ts";
import { BufferJSON, initAuthCreds, proto } from "baileys";
import { AddContact } from "./contacts.ts";

const Auth = sequelize.define(
  "auth",
  {
    name: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    data: { type: DataTypes.TEXT },
  },
  { timestamps: false, indexes: [{ fields: ["name"] }] }
);

await Auth.sync();

export default async () => {
  const writeData = async (data: any, name: string) => {
    await Auth.upsert({
      name,
      data: JSON.stringify(data, BufferJSON.replacer),
    });
    return true;
  };

  const removeData = async (name: string) => {
    await Auth.destroy({ where: { name } });
    return true;
  };

  const readData = async (name: string) => {
    const row = await Auth.findOne({ where: { name } });
    if (!row?.data) return null;
    return JSON.parse(row.data as string, BufferJSON.reviver);
  };

  const creds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof any>(
          type: T,
          ids: string[]
        ): Promise<{ [id: string]: any }> => {
          const data: { [id: string]: any } = {};
          const rows = await Auth.findAll({
            where: { name: ids.map((id) => `${type}-${id}`) },
            attributes: ["name", "data"],
          });
          for (const id of ids) {
            const name = `${type}-${id}`;
            const row = rows.find((r) => r.name === name);
            let value = row
              ? JSON.parse(row.data as string, BufferJSON.reviver)
              : null;
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.create(value);
            }
            data[id] = value;
          }
          return data;
        },
        set: async (data: any) => {
          const promises: Promise<any>[] = [];
          for (const category in data) {
            const categoryData = data[category];
            if (!categoryData) continue;
            for (const id in categoryData) {
              const dataValue = categoryData[id];
              const name = `${category}-${id}`;
              if (dataValue) {
                if (name.startsWith("lid-mapping-")) {
                  const base = name
                    .replace("lid-mapping-", "")
                    .replace("_reverse", "");
                  const [pn, lid] = name.endsWith("_reverse")
                    ? [String(dataValue) + "@s.whatsapp.net", base + "@lid"]
                    : [base + "@s.whatsapp.net", String(dataValue) + "@lid"];
                  promises.push(AddContact(pn, lid));
                  continue;
                }
                promises.push(writeData(dataValue, name));
              } else {
                promises.push(removeData(name));
              }
            }
          }
          if (promises.length > 0) await Promise.all(promises);
        },
      },
    },
    saveCreds: async () => {
      return writeData(creds, "creds");
    },
  };
};
