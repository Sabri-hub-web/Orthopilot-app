import { prisma } from "@/server/db/client";
import { taskPriorityLabelMap, taskStatusLabelMap } from "@/lib/tasks";
import { reglementStatusLabelMap } from "@/lib/reglements";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDaysLate(dueDate: Date): number {
  const diffMs = Date.now() - dueDate.getTime();
  return diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
}

function formatTaskDueDate(date: Date): string {
  return formatDate(date);
}

export async function getDashboardData() {
  const [paymentsRaw, tasksRaw, patientTotal, attentionAdminCount] = await Promise.all([
    prisma.reglement.findMany({
      select: {
        id: true,
        patientId: true,
        amountDue: true,
        dueDate: true,
        status: true,
        comment: true,
        relanceCount: true,
        lastRelanceAt: true,
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 12,
    }),
    prisma.task.findMany({
      select: {
        id: true,
        title: true,
        comment: true,
        assigneeId: true,
        assignee: true,
        patientId: true,
        dueDate: true,
        priority: true,
        status: true,
        createdAt: true,
        assignedUser: { select: { fullName: true } },
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 20,
    }),
    prisma.patient.count(),
    prisma.patient.count({ where: { hubStatus: "ATTENTION_ADMIN" } }),
  ]);

  const payments = paymentsRaw.map((payment) => ({
    id: payment.id,
    patientId: payment.patientId,
    patientName: `${payment.patient.firstName} ${payment.patient.lastName}`,
    amountDue: payment.amountDue,
    dueDate: formatDate(payment.dueDate),
    daysLate: getDaysLate(payment.dueDate),
    status: reglementStatusLabelMap[payment.status],
    comment: payment.comment,
    relanceCount: payment.relanceCount,
    lastRelanceAt: payment.lastRelanceAt ? payment.lastRelanceAt.toISOString() : null,
  }));

  const emails = [] as const;

  const tasks = tasksRaw.map((task) => ({
    id: task.id,
    title: task.title,
    comment: task.comment,
    assigneeId: task.assigneeId,
    assignee: task.assignedUser?.fullName ?? task.assignee ?? "Non assignee",
    patientId: task.patientId,
    patientName: task.patient ? `${task.patient.firstName} ${task.patient.lastName}` : null,
    dueDate: formatTaskDueDate(task.dueDate),
    priority: taskPriorityLabelMap[task.priority],
    status: taskStatusLabelMap[task.status],
  }));

  return {
    payments,
    emails,
    tasks,
    patientsSummary: {
      total: patientTotal,
      attentionAdminCount: attentionAdminCount,
    },
  };
}
