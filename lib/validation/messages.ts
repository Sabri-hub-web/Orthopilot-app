import { z } from "zod";

export const internalMessageSendSchema = z
  .object({
    recipientId: z.string().min(1),
    body: z.string().trim().max(8000, "Maximum 8000 caracteres."),
  })
  .refine((d) => d.body.length > 0, { message: "Message vide.", path: ["body"] });

export const internalMessageMultipartSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().trim().max(8000, "Maximum 8000 caracteres.").optional().default(""),
});

export const internalMessageReadPeerSchema = z.object({
  peerId: z.string().min(1),
});
