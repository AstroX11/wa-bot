import { DataTypes, Op } from "sequelize";
import sequelize from "../client/database.ts";
import { isLidUser, isPnUser } from "baileys";

const Contact = sequelize.define(
  "contacts",
  {
    pn: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    lid: { type: DataTypes.STRING, allowNull: false },
  },
  { timestamps: false }
);

await Contact.sync();

export const add_contact = async (id: string, second?: string) => {
  let pn: string | null = null;
  let lid: string | null = null;

  if (isPnUser(id)) pn = id;
  else if (isLidUser(id)) lid = id;
  else throw new Error("invalid id");

  if (second) {
    if (isPnUser(second)) pn = second;
    else if (isLidUser(second)) lid = second;
  }

  if (!pn || !lid) throw new Error("both pn and lid required");

  return await Contact.upsert({ pn, lid });
};

export const get_contacts = async () => {
  return await Contact.findAll();
};

export const get_contact = async (id: string) => {
  let queryIds = [id];

  if (!id.endsWith("@s.whatsapp.net") && !id.endsWith("@lid")) {
    queryIds.push(`${id}@s.whatsapp.net`, `${id}@lid`);
  }

  const contact = await Contact.findOne({
    where: { [Op.or]: [{ pn: queryIds }, { lid: queryIds }] },
    attributes: ["pn", "lid"],
  });

  return contact ? contact.get({ plain: true }) : null;
};
