import {
  getContentType,
  isJidGroup,
  isJidNewsletter,
  normalizeMessageContent,
  type WASocket,
  type WAMessage,
  type AnyMessageContent,
  type MiscMessageGenerationOptions,
} from "baileys";
import { extract_txt } from "./extract.ts";
import { AddContact } from "../sql/contacts.ts";

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
  await AddContact(sender!, senderAlt);

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
    send: async (
      content: AnyMessageContent,
      options?: MiscMessageGenerationOptions
    ) => {
      return await serialize(
        (await client.sendMessage(chat, content, options)) as WAMessage,
        client
      );
    },
  };
}

export type Serialize = Awaited<ReturnType<typeof serialize>>;
