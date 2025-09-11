import {
  getContentType,
  isJidGroup,
  isJidNewsletter,
  normalizeMessageContent,
  type WAMessage,
} from "baileys";
import { extract_txt } from "./extract.ts";
import { get_contact } from "../sql/contacts.ts";

export default async (message: WAMessage) => {
  const chatId = message.key.remoteJid!;
  const group = isJidGroup(chatId);
  const newsletter = isJidNewsletter(chatId);
  const broadcast = message.broadcast
  const content = normalizeMessageContent(message.message);
  const text = extract_txt(message.message!);
  const sender = group ? message.key.participant : chatId;

  return {
    chat: chatId,
    fromMe: message.key.fromMe,
    id: message.key.id,
    pushName: message.pushName,
    mtype: getContentType(content),
    timestamp: message.messageTimestamp,
    isGroup: group,
    isNewsletter: newsletter,
    isPrivate: !group && !newsletter && !broadcast,
    isBroadcast: broadcast,
    sender,
    senderAlt: await get_contact(sender!).then((contact) => contact?.lid),
    message: content,
    text,
  };
};
