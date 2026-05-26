"use client";

import { Download, FileText } from "lucide-react";

/** Pièces jointes simulées côté UI (pas de backend PJ email) */
interface MockAttachment {
  id: string;
  name: string;
  size: string;
  type: "pdf" | "image" | "doc";
}

function inferMockAttachments(subject: string, comment: string | null): MockAttachment[] {
  const text = `${subject} ${comment ?? ""}`.toLowerCase();
  const attachments: MockAttachment[] = [];
  if (text.includes("devis") || text.includes("document")) {
    attachments.push({ id: "1", name: "Document.pdf", size: "245 Ko", type: "pdf" });
  }
  if (text.includes("radio") || text.includes("photo") || text.includes("image")) {
    attachments.push({ id: "2", name: "Radio.jpg", size: "1,2 Mo", type: "image" });
  }
  return attachments;
}

interface EmailAttachmentsProps {
  subject: string;
  comment: string | null;
}

export function EmailAttachments({ subject, comment }: EmailAttachmentsProps) {
  const items = inferMockAttachments(subject, comment);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3">
        <p className="text-xs text-slate-400">Aucune pièce jointe</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-700">Pièces jointes</p>
      {items.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-violet-200"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
            <p className="text-[11px] text-slate-500">{file.size}</p>
          </div>
          <button
            type="button"
            title="Télécharger"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
