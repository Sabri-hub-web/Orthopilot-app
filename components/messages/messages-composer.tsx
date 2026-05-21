"use client";

import { Loader2, Paperclip, Send, Smile, X } from "lucide-react";
import {
  MESSAGE_ATTACHMENT_MAX_FILES,
  MESSAGE_FILE_ACCEPT,
  formatFileSize,
} from "@/lib/messages-ui";
import type { FormEvent, KeyboardEvent, RefObject } from "react";

export interface PendingMessageFile {
  id: string;
  file: File;
  previewUrl?: string;
}

interface MessagesComposerProps {
  value: string;
  sending: boolean;
  pendingFiles: PendingMessageFile[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onPickFiles: () => void;
  onFilesSelected: (files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
}

export function MessagesComposer({
  value,
  sending,
  pendingFiles,
  fileInputRef,
  onChange,
  onSubmit,
  onPickFiles,
  onFilesSelected,
  onRemoveFile,
}: MessagesComposerProps) {
  const canSend = !sending && (value.trim().length > 0 || pendingFiles.length > 0);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        const form = e.currentTarget.form;
        if (form) form.requestSubmit();
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={MESSAGE_FILE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          onFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />

      {pendingFiles.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {pendingFiles.map((pf) => (
            <li
              key={pf.id}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
            >
              {pf.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pf.previewUrl} alt="" className="h-5 w-5 rounded object-cover" />
              ) : null}
              <span className="max-w-[120px] truncate">{pf.file.name}</span>
              <span className="text-slate-400">{formatFileSize(pf.file.size)}</span>
              <button type="button" onClick={() => onRemoveFile(pf.id)} className="text-slate-500 hover:text-slate-800">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message…"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={onPickFiles}
          disabled={sending || pendingFiles.length >= MESSAGE_ATTACHMENT_MAX_FILES}
          title="Pièce jointe"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled
          title="Emojis — bientôt disponible"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 opacity-50"
        >
          <Smile className="h-4 w-4" />
        </button>
        <button
          type="submit"
          disabled={!canSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5D5CDE] text-white shadow-md transition hover:bg-[#4f4fc8] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Envoyer"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}
