import { DataTypes } from "sequelize";
import { Mutex } from "async-mutex";
import sequelize from "../client/database.ts";
import {
  BufferJSON,
  initAuthCreds,
  proto,
  type SignalDataSet,
  type AuthenticationCreds,
  type SignalDataTypeMap,
} from "baileys";
import { AddContact } from "./contacts.ts";

const Auth = sequelize.define(
  "auth",
  {
    name: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    data: { type: DataTypes.BLOB },
  },
  { timestamps: false, indexes: [{ fields: ["name"] }] }
);

await Auth.sync();

const batchMutex = new Mutex();

export default async () => {
  const writeData = async (data: any, name: string) => {
    const t = await sequelize.transaction();
    try {
      const result = await Auth.upsert(
        { name, data: Buffer.from(JSON.stringify(data, BufferJSON.replacer)) },
        { transaction: t }
      );
      await t.commit();
      return result;
    } catch (e) {
      console.error(e);
      await t.rollback();
      throw e;
    }
  };

  const writeBatch = async (items: Array<{ name: string; data: any }>) => {
    return batchMutex.acquire().then(async (release) => {
      const t = await sequelize.transaction();
      try {
        const records = items.map(({ name, data }) => ({
          name,
          data: Buffer.from(JSON.stringify(data, BufferJSON.replacer)),
        }));

        await Auth.bulkCreate(records, {
          updateOnDuplicate: ["data"],
          transaction: t,
          logging: false,
        });

        await t.commit();
        return true;
      } catch (e) {
        console.error(e);
        await t.rollback();
        throw e;
      } finally {
        release();
      }
    });
  };

  const removeBatch = async (names: string[]) => {
    if (names.length === 0) return;
    return batchMutex.acquire().then(async (release) => {
      const t = await sequelize.transaction();
      try {
        const result = await Auth.destroy({
          where: { name: names },
          transaction: t,
        });
        await t.commit();
        return result;
      } catch (e) {
        console.error(e);
        await t.rollback();
        throw e;
      } finally {
        release();
      }
    });
  };

  const readData = async (name: string) => {
    try {
      const row = await Auth.findOne({ where: { name } });
      if (!row) return null;
      const buf = row.get("data") as Buffer;
      if (!buf) return null;
      return JSON.parse(buf.toString("utf-8"), BufferJSON.reviver);
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const readBatch = async (names: string[]) => {
    try {
      const rows = await Auth.findAll({
        where: { name: names },
        attributes: ["name", "data"],
      });
      const results = new Map<string, any>();
      for (const row of rows) {
        const name = row.get("name") as string;
        const buf = row.get("data") as Buffer;
        if (buf) {
          try {
            results.set(name, JSON.parse(buf.toString(), BufferJSON.reviver));
          } catch (e) {
            console.error(e);
          }
        }
      }
      return results;
    } catch (e) {
      console.error(e);
      return new Map();
    }
  };

  const creds: AuthenticationCreds =
    (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(
          type: T,
          ids: string[]
        ): Promise<{ [id: string]: SignalDataTypeMap[T] }> => {
          const names = ids.map((id) => `${type}-${id}`);
          const batchResults = await readBatch(names);
          const data: { [id: string]: SignalDataTypeMap[T] } = {};
          for (const id of ids) {
            const name = `${type}-${id}`;
            let value = batchResults.get(name) || null;
            if (type === "app-state-sync-key" && value) {
              value = proto.Message.AppStateSyncKeyData.create(value);
            }
            data[id] = value as SignalDataTypeMap[T];
          }
          return data;
        },
        set: async (data: SignalDataSet) => {
          const writeItems: Array<{ name: string; data: any }> = [];
          const removeNames: string[] = [];

          for (const category in data) {
            const categoryData = data[category as keyof SignalDataTypeMap];
            if (!categoryData) continue;

            for (const id in categoryData) {
              const data = categoryData[id];
              const name = `${category}-${id}`;

              if (data) {
                if (name.startsWith("lid-mapping-")) {
                  const base = name
                    .replace("lid-mapping-", "")
                    .replace("_reverse", "");
                  const [pn, lid] = name.endsWith("_reverse")
                    ? [String(data) + "@s.whatsapp.net", base + "@lid"]
                    : [base + "@s.whatsapp.net", String(data) + "@lid"];

                  await AddContact(pn, lid);
                  continue;
                }

                writeItems.push({ name, data });
              } else {
                removeNames.push(name);
              }
            }
          }

          const promises: Promise<any>[] = [];
          if (writeItems.length > 0) promises.push(writeBatch(writeItems));
          if (removeNames.length > 0) promises.push(removeBatch(removeNames));
          if (promises.length > 0) await Promise.all(promises);
        },
      },
    },
    saveCreds: async () => {
      return await writeData(creds, "creds");
    },
  };
};
