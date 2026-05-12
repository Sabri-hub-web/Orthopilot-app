import { PresenceStatus } from "@prisma/client";
import { z } from "zod";

export const presenceMePatchSchema = z.object({
  presenceStatus: z.nativeEnum(PresenceStatus),
});
