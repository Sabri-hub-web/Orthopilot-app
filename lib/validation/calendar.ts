import { CalendarEventType } from "@prisma/client";
import { z } from "zod";

const optionalId = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.union([z.string().min(1), z.null()]),
);

export const calendarFeedQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export const calendarEventCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Titre requis.").max(200),
    description: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : v),
      z.string().trim().max(2000).optional(),
    ),
    startAt: z.string().min(1),
    endAt: z.string().min(1),
    type: z.nativeEnum(CalendarEventType),
    patientId: optionalId.optional(),
    assigneeId: optionalId.optional(),
  })
  .refine(
    (data) => {
      const a = new Date(data.startAt);
      const b = new Date(data.endAt);
      return !Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && b > a;
    },
    { message: "La date de fin doit etre apres la date de debut.", path: ["endAt"] },
  );

export const calendarEventUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : v),
      z.string().trim().max(2000).optional(),
    ),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
    type: z.nativeEnum(CalendarEventType).optional(),
    patientId: optionalId.optional(),
    assigneeId: optionalId.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, { message: "Aucune modification." });
