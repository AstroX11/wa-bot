import { DataTypes } from "sequelize";
import sequelize from "../client/database.ts";
import { proto, type WAMessage } from "baileys";

const Message = sequelize.define(
  "messages",
  {
    id: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    message: { type: DataTypes.TEXT }, // Changed from BLOB to TEXT
  },
  { timestamps: false }
);

await Message.sync();

export const addMessage = async (message: WAMessage) => {
  return await Message.upsert({
    id: message.key.id,
    message: JSON.stringify(message || {}), // Store as JSON string directly
  });
};

export const getMessage = async (key: proto.IMessageKey) => {
  const msg = await Message.findOne({
    where: { id: key.id },
    attributes: ["message"],
  });

  return msg
    ? proto.Message.create(JSON.parse(msg.get({ plain: true }).message))
    : undefined;
};

export const getMessageFull = async (key: proto.IMessageKey) => {
  const msg = await Message.findOne({
    where: { id: key.id },
  });

  if (!msg) return undefined;

  const raw = msg.get({ plain: true });

  const m = JSON.parse(raw.message); // No need for .toString() since it's already a string

  return proto.WebMessageInfo.create(m);
};
