"use client";

import { ExternalLink, FileSpreadsheet, FileText, ImageIcon, Paperclip } from "lucide-react";
import { formatAttachmentSize } from "@/lib/emails-ui";
import type { EmailAttachmentInfo } from "@/types/domain";

interface EmailAttachmentsProps {
  attachments: EmailAttachmentInfo[];
  gmailThreadUrl: string | null;
}

function AttachmentIcon({ mimeType }: { mimeType: string }) {
  const m = mimeType.toLowerCase();
  if (m.startsWith("image/")) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <ImageIcon className="h-4 w-4" />
      </span>
    );
  }
  if (m.includes("spreadsheet") || m.includes("excel") || m.includes("csv")) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <FileSpreadsheet className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
      <FileText className="h-4 w-4" />
    </span>
  );
}

export function EmailAttachments({ attachments, gmailThreadUrl }: EmailAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <Paperclip className="h-3.5 w-3.5 text-slate-400" />
        Pièces jointes ({attachments.length})
      </p>
      {attachments.map((file) => {
        const size = formatAttachmentSize(file.sizeBytes);
        return (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 transition hover:border-violet-200"
          >
            <AttachmentIcon mimeType={file.mimeType} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{file.fileName}</p>
              <p className="truncate text-[11px] text-slate-500">
                {file.mimeType}
                {size ? ` · ${size}` : ""}
              </p>
            </div>
            {gmailThreadUrl ? (
              <a
                href={gmailThreadUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Ouvrir dans Gmail"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
