"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmailAiPanel } from "@/components/emails/email-ai-panel";
import { EmailCategoryBanner } from "@/components/emails/email-category-banner";
import { EmailComposeModal } from "@/components/emails/email-compose-modal";
import { EmailGmailBar } from "@/components/emails/email-gmail-bar";
import { EmailSidebar } from "@/components/emails/email-sidebar";
import { EmailViewer } from "@/components/emails/email-viewer";
import { EmailsLayout } from "@/components/emails/emails-layout";
import { EMAIL_CATEGORY_VALUES, EMAIL_STATUS_VALUES, emailCategoryLabelMap, emailStatusLabelMap } from "@/lib/emails";
import {
  matchesEmailFilter,
  matchesEmailSource,
  sortEmails,
  type EmailFilterTab,
  type EmailSortOption,
  type EmailSourceFilter,
} from "@/lib/emails-ui";
import { errorMessageFromResponse } from "@/lib/validation/client-errors";
import {
  EmailFormPayload,
  EmailCategoryApi,
  EmailStatusApi,
  EmailsListResponse,
  GmailConnectionStatus,
  PatientListItem,
  UsersListItem,
} from "@/types/domain";

const PAGE_SIZE = 50;

function localDatetimeInputValue(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const categoryOptions = EMAIL_CATEGORY_VALUES.map((value) => ({
  value,
  label: emailCategoryLabelMap[value],
}));

const statusOptions = EMAIL_STATUS_VALUES.map((value) => ({
  value,
  label: emailStatusLabelMap[value],
}));

const defaultForm: EmailFormPayload = {
  sender: "",
  subject: "",
  receivedAt: localDatetimeInputValue(),
  category: "ADMINISTRATIF",
  status: "A_TRAITER",
  comment: "",
  patientId: null,
  assigneeId: null,
};

export function EmailsView() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EmailsListResponse | null>(null);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [form, setForm] = useState<EmailFormPayload>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<EmailFilterTab>("all");
  const [sourceFilter, setSourceFilter] = useState<EmailSourceFilter>("all");
  const [sourceDefaultApplied, setSourceDefaultApplied] = useState(false);
  const [sortOption, setSortOption] = useState<EmailSortOption>("recent");
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<GmailConnectionStatus | null>(null);
  const [gmailStatusLoading, setGmailStatusLoading] = useState(true);
  const [gmailSyncing, setGmailSyncing] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const gmailParam = searchParams.get("gmail");
    if (gmailParam === "connected") {
      setSuccess("Gmail connecte avec succes.");
      window.history.replaceState({}, "", "/emails");
    } else if (gmailParam === "error") {
      setError("Connexion Gmail echouee. Reessayez.");
      window.history.replaceState({}, "", "/emails");
    }
  }, [searchParams]);

  const loadGmailStatus = useCallback(async () => {
    try {
      setGmailStatusLoading(true);
      const response = await fetch("/api/gmail/status", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as GmailConnectionStatus;
      setGmailStatus(payload);
    } catch {
      // statut Gmail facultatif
    } finally {
      setGmailStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGmailStatus();
  }, [loadGmailStatus]);

  useEffect(() => {
    if (gmailStatusLoading || sourceDefaultApplied || !gmailStatus) return;
    setSourceFilter(gmailStatus.connected ? "gmail" : "all");
    setSourceDefaultApplied(true);
  }, [gmailStatus, gmailStatusLoading, sourceDefaultApplied]);

  function handleConnectGmail() {
    window.location.href = "/api/gmail/connect";
  }

  async function handleSyncGmail() {
    try {
      setGmailSyncing(true);
      setError(null);
      const response = await fetch("/api/gmail/sync", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          typeof payload.message === "string"
            ? payload.message
            : "Synchronisation Gmail impossible.",
        );
        if (payload.reconnectRequired) {
          await loadGmailStatus();
        }
        return;
      }
      await loadEmails();
      await loadGmailStatus();
      const created = typeof payload.created === "number" ? payload.created : 0;
      const updated = typeof payload.updated === "number" ? payload.updated : 0;
      setSuccess(`Synchronisation Gmail : ${created} nouveau(x), ${updated} mis a jour.`);
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "Erreur inconnue.";
      setError(message);
    } finally {
      setGmailSyncing(false);
    }
  }

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const loadEmails = useCallback(async () => {
    const response = await fetch(`/api/emails?page=${page}&pageSize=${PAGE_SIZE}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Echec du chargement des emails.");
    const payload: EmailsListResponse = await response.json();
    setData(payload);
  }, [page]);

  useEffect(() => {
    async function loadEmailsData() {
      try {
        setLoading(true);
        await loadEmails();
        setError(null);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : "Erreur inconnue de chargement.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadEmailsData();
  }, [loadEmails]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [patientsRes, usersRes] = await Promise.all([
          fetch("/api/patients?page=1&pageSize=50", { cache: "no-store" }),
          fetch("/api/users", { cache: "no-store" }),
        ]);
        if (!patientsRes.ok || !usersRes.ok) return;
        const patientsPayload = await patientsRes.json();
        const usersPayload = await usersRes.json();
        setPatients(patientsPayload.items ?? []);
        setUsers(usersPayload.items ?? []);
      } catch {
        // options facultatives
      }
    }

    loadOptions();
  }, []);

  const sourceEmails = useMemo(() => {
    if (!data) return [];
    return data.items.filter((email) => matchesEmailSource(email, sourceFilter));
  }, [data, sourceFilter]);

  const filteredEmails = useMemo(() => {
    const byCategory = sourceEmails.filter((email) => matchesEmailFilter(email, filterTab));
    return sortEmails(byCategory, sortOption);
  }, [sourceEmails, filterTab, sortOption]);

  const selectedEmail = useMemo(
    () => filteredEmails.find((e) => e.id === selectedId) ?? data?.items.find((e) => e.id === selectedId) ?? null,
    [filteredEmails, selectedId, data],
  );

  useEffect(() => {
    if (filteredEmails.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredEmails.some((e) => e.id === selectedId)) {
      setSelectedId(filteredEmails[0]!.id);
    }
  }, [filteredEmails, selectedId]);

  useEffect(() => {
    setReplyDraft("");
  }, [selectedId]);

  function resetForm() {
    setEditingEmailId(null);
    setForm({ ...defaultForm, receivedAt: localDatetimeInputValue() });
  }

  function openCompose() {
    resetForm();
    setComposeOpen(true);
  }

  function closeCompose() {
    setComposeOpen(false);
    resetForm();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setSuccess(null);
      setError(null);
      const url = editingEmailId ? `/api/emails/${editingEmailId}` : "/api/emails";
      const method = editingEmailId ? "PATCH" : "POST";
      const body = {
        sender: form.sender,
        subject: form.subject,
        receivedAt: form.receivedAt,
        category: form.category,
        status: form.status,
        comment: form.comment === "" ? null : form.comment,
        patientId: form.patientId || null,
        assigneeId: form.assigneeId || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }

      await loadEmails();
      closeCompose();
      setSuccess(editingEmailId ? "Email mis a jour." : "Email enregistre.");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erreur inconnue.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(emailId: string) {
    if (!window.confirm("Supprimer cet email ? Cette action est definitive.")) return;
    try {
      setError(null);
      const response = await fetch(`/api/emails/${emailId}`, { method: "DELETE" });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadEmails();
      if (editingEmailId === emailId) closeCompose();
      if (selectedId === emailId) setSelectedId(null);
      setSuccess("Email supprime.");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  function startEdit(item: EmailsListResponse["items"][number]) {
    const categoryValue =
      categoryOptions.find((o) => o.label === item.category)?.value ?? ("ADMINISTRATIF" as EmailCategoryApi);
    const statusValue =
      statusOptions.find((o) => o.label === item.status)?.value ?? ("A_TRAITER" as EmailStatusApi);
    setEditingEmailId(item.id);
    setForm({
      sender: item.from,
      subject: item.subject,
      receivedAt: `${item.receivedDate}T${item.receivedAt}`,
      category: categoryValue,
      status: statusValue,
      comment: item.comment ?? "",
      patientId: item.patientId,
      assigneeId: item.assigneeId,
    });
    setComposeOpen(true);
  }

  async function quickStatusUpdate(emailId: string, status: EmailStatusApi) {
    try {
      setError(null);
      const response = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadEmails();
      setSuccess("Statut mis a jour.");
    } catch (statusError) {
      const message = statusError instanceof Error ? statusError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  async function quickAssignUpdate(emailId: string, assigneeId: string | null) {
    try {
      setError(null);
      const response = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadEmails();
      setSuccess("Assignation mise a jour.");
    } catch (assignError) {
      const message = assignError instanceof Error ? assignError.message : "Erreur inconnue.";
      setError(message);
    }
  }

  async function handleReplySubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedEmail || !replyDraft.trim()) return;
    try {
      setReplySending(true);
      setError(null);
      const newComment = selectedEmail.comment
        ? `${selectedEmail.comment}\n\n---\n${replyDraft.trim()}`
        : replyDraft.trim();
      const response = await fetch(`/api/emails/${selectedEmail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment }),
      });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadEmails();
      setReplyDraft("");
      setSuccess("Commentaire ajoute.");
    } catch (replyError) {
      const message = replyError instanceof Error ? replyError.message : "Erreur inconnue.";
      setError(message);
    } finally {
      setReplySending(false);
    }
  }

  async function handleGenerateAiSummary() {
    if (!selectedEmail) return;
    try {
      setAiLoading(true);
      setError(null);
      const response = await fetch(`/api/emails/${selectedEmail.id}/ai-summary`, { method: "POST" });
      if (!response.ok) {
        setError(await errorMessageFromResponse(response));
        return;
      }
      await loadEmails();
      setSuccess("Resume IA genere.");
    } catch (aiError) {
      const message = aiError instanceof Error ? aiError.message : "Erreur inconnue.";
      setError(message);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setLoading(true);
      await loadEmails();
      setError(null);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Erreur inconnue.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const canGoPrev = page > 1;
  const canGoNext = data ? page < data.totalPages : false;

  return (
    <>
      <EmailsLayout
        success={success}
        error={error}
        gmailBar={
          <EmailGmailBar
            status={gmailStatus}
            statusLoading={gmailStatusLoading}
            syncing={gmailSyncing}
            onConnect={handleConnectGmail}
            onSync={handleSyncGmail}
          />
        }
        categoryBanner={
          <EmailCategoryBanner
            allEmails={sourceEmails}
            activeTab={filterTab}
            onTabChange={setFilterTab}
          />
        }
        sidebar={
          <EmailSidebar
            emails={filteredEmails}
            loading={loading}
            selectedId={selectedId}
            searchQuery={searchQuery}
            sourceFilter={sourceFilter}
            sortOption={sortOption}
            gmailConnected={Boolean(gmailStatus?.connected)}
            page={data?.page ?? page}
            totalPages={data?.totalPages ?? 1}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onSearchChange={setSearchQuery}
            onSourceChange={setSourceFilter}
            onSortChange={setSortOption}
            onSelect={setSelectedId}
            onRefresh={handleRefresh}
            onPrevPage={() => setPage((prev) => prev - 1)}
            onNextPage={() => setPage((prev) => prev + 1)}
            onCompose={openCompose}
          />
        }
        viewer={
          <EmailViewer
            email={selectedEmail}
            replyDraft={replyDraft}
            replySending={replySending}
            onReplyChange={setReplyDraft}
            onReplySubmit={handleReplySubmit}
            onMarkTreated={() => selectedEmail && quickStatusUpdate(selectedEmail.id, "TRAITE")}
            onEdit={() => selectedEmail && startEdit(selectedEmail)}
            onDelete={() => selectedEmail && handleDelete(selectedEmail.id)}
          />
        }
        aiPanel={
          <EmailAiPanel
            email={selectedEmail}
            users={users}
            aiLoading={aiLoading}
            onGenerateAiSummary={handleGenerateAiSummary}
            onMarkTreated={() => selectedEmail && quickStatusUpdate(selectedEmail.id, "TRAITE")}
            onAddComment={() => document.getElementById("email-reply-input")?.focus()}
            onCreateTask={() => setSuccess("Creation de tache bientot disponible.")}
            onAssignChange={(assigneeId) =>
              selectedEmail && quickAssignUpdate(selectedEmail.id, assigneeId)
            }
            onStatusChange={(status) => selectedEmail && quickStatusUpdate(selectedEmail.id, status)}
          />
        }
      />

      <EmailComposeModal
        open={composeOpen}
        editing={Boolean(editingEmailId)}
        form={form}
        isSubmitting={isSubmitting}
        patients={patients}
        users={users}
        categoryOptions={categoryOptions}
        statusOptions={statusOptions}
        onClose={closeCompose}
        onSubmit={handleSubmit}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
      />
    </>
  );
}
