"use client";

import { Download, FileText } from "lucide-react";
import { attachmentDownloadUrl, formatFileSize } from "@/lib/messages-ui";
import type { MessageAttachmentMeta } from "@/types/domain";

interface MessagesMessageAttachmentsProps {
  attachments: MessageAttachmentMeta[];
  variant: "sent" | "received";
}

export function MessagesMessageAttachments({ attachments, variant }: MessagesMessageAttachmentsProps) {
  if (!attachments.length) return null;

  const linkClass =
    variant === "sent"
      ? "border-white/25 bg-white/15 text-white hover:bg-white/25"
      : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100";

  return (
    <ul className={`mt-2 space-y-1.5 ${attachments.length ? "" : ""}`}>
      {attachments.map((att) => {
        const isImage = att.mimeType.startsWith("image/");
        const href = attachmentDownloadUrl(att.id);
        const previewHref = attachmentDownloadUrl(att.id, true);

        if (isImage) {
          return (
            <li key={att.id}>
              <a href={href} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewHref}
                  alt={att.fileName}
                  className="max-h-40 max-w-full rounded-lg object-cover"
                />
              </a>
              <p className={`mt-0.5 text-[10px] ${variant === "sent" ? "text-white/70" : "text-slate-400"}`}>
                {att.fileName} · {formatFileSize(att.sizeBytes)}
              </p>
            </li>
          );
        }

        return (
          <li key={att.id}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition ${linkClass}`}
            >
              <FileText className="h-4 w-4 shrink-0 opacity-80" />
              <span className="min-w-0 flex-1 truncate font-medium">{att.fileName}</span>
              <span className="shrink-0 opacity-70">{formatFileSize(att.sizeBytes)}</span>
              <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
