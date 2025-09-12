import {
  getContentType,
  isJidGroup,
  isJidNewsletter,
  normalizeMessageContent,
  type WASocket,
  type WAMessage,
} from "baileys";
import { extract_txt } from "./extract.ts";
import { add_contact } from "../sql/contacts.ts";
import { groupMetaDataCache } from "../client/main.ts";

export default async function serialize(msg: WAMessage, client: WASocket) {
  const { messageTimestamp, pushName, key, broadcast } = msg;

  const chat = key.remoteJid!;
  const isGroup = isJidGroup(chat);
  const isNewsletter = isJidNewsletter(chat);
  const isBroadcast = broadcast;
  const isPrivate = !isGroup && !isNewsletter && !isBroadcast;
  const message = normalizeMessageContent(msg.message);
  const text = extract_txt(msg.message!);
  const mtype = getContentType(message);
  const sender = isGroup ? msg.key.participant : chat;
  const senderAlt =
    isGroup || isNewsletter || isBroadcast
      ? msg.key.participantAlt
      : key.remoteJidAlt;

  const isMsgDlt = message?.protocolMessage?.type == 0;
  const isMsgEdit = message?.protocolMessage?.type == 14;
  const mentions =
    //@ts-ignore
    (message?.[mtype]?.contextInfo?.mentionedJid || null) as string[] | null;
  await add_contact(sender!, senderAlt);

  if (isGroup) {
    const isMetaDataAvailable = groupMetaDataCache.has(chat);
    if (!isMetaDataAvailable) {
      const metadata = await client.groupMetadata(chat);
      groupMetaDataCache.set(chat, metadata);
    }
  }

  return {
    chat,
    fromMe: key.fromMe,
    id: key.id,
    pushName,
    mtype,
    messageTimestamp,
    isGroup,
    isNewsletter,
    isPrivate,
    isBroadcast,
    isMsgDlt,
    isMsgEdit,
    sender,
    senderAlt,
    message,
    text,
    mentions,
  };
}

export type Serialize = Awaited<ReturnType<typeof serialize>>;
