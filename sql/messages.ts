import { DataTypes } from "sequelize";
import sequelize from "../client/database.ts";
import { proto, type WAMessage } from "baileys";

const Message = sequelize.define(
  "messages",
  {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    message: { type: DataTypes.BLOB },
  },
  { timestamps: false }
);

await Message.sync();

export const addMessage = async (message: WAMessage) => {
  return await Message.upsert({
    id: message.key.id,
    message: Buffer.from(JSON.stringify(message || {})),
  });
};

export const getMessage = async (key: proto.IMessageKey) => {
  const msg = await Message.findOne({
    where: { id: key.id },
    attributes: ["message"],
  });

  return msg
    ? proto.Message.create(msg.get({ plain: true }).message)
    : undefined;
};
