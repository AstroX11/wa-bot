import type { WAMessageContent } from "baileys";
import { GetContact } from "../sql/contacts.ts";

export function extract_txt(message?: WAMessageContent): string | null {
  if (!message) return null;

  const getText = (obj: any, path: string) =>
    path.split(".").reduce((o, p) => o?.[p], obj);

  const pollText = (poll: any) =>
    poll
      ? `${poll.name || ""}\n${
          poll.options?.map((o: any) => o.optionName).join("\n") || ""
        }`
      : null;

  if (message.protocolMessage?.editedMessage) {
    return extract_txt(message.protocolMessage.editedMessage);
  }

  return (
    getText(message, "conversation") ||
    getText(message, "documentMessage.caption") ||
    getText(message, "videoMessage.caption") ||
    getText(message, "extendedTextMessage.text") ||
    (message.eventMessage
      ? `${message.eventMessage.name || ""}\n${
          message.eventMessage.description || ""
        }`
      : null) ||
    pollText(message.pollCreationMessageV3) ||
    pollText(message.pollCreationMessage) ||
    pollText(message.pollCreationMessageV2)
  );
}

export const getUser = async (
  id: string
): Promise<{ pn: string; lid: string }> => {
  id = id.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");

  const { pn, lid } = await GetContact(id);

  return {
    pn,
    lid,
  };
};
