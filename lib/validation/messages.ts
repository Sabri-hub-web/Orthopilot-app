import { z } from "zod";

export const internalMessageSendSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().trim().min(1, "Message vide.").max(8000, "Maximum 8000 caracteres."),
});

export const internalMessageReadPeerSchema = z.object({
  peerId: z.string().min(1),
});
