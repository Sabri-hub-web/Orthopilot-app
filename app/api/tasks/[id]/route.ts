import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { deleteTask, updateTask } from "@/services/tasks-service";
import { taskUpdateSchema } from "@/lib/validation/tasks";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import type { TaskFormPayload } from "@/types/domain";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "tasks:manage");
    if (auth.response) return auth.response;
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = taskUpdateSchema.parse(raw);
    const { id } = await params;
    const task = await updateTask(id, payload as Partial<TaskFormPayload>);

    if (!task) {
      return NextResponse.json({ message: "Tache introuvable." }, { status: 404 });
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("PATCH /api/tasks/:id failed", error);
    return NextResponse.json({ message: "Impossible de modifier la tache." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "tasks:manage");
    if (auth.response) return auth.response;
    const { id } = await params;
    const result = await deleteTask(id);
    if (!result) {
      return NextResponse.json({ message: "Tache introuvable." }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/tasks/:id failed", error);
    return NextResponse.json({ message: "Impossible de supprimer la tache." }, { status: 500 });
  }
}
