export type PriorityLevel = "faible" | "normale" | "importante" | "urgente";

export interface StatCardData {
  id: string;
  label: string;
  value: number;
  trend: string;
  priority: PriorityLevel;
}

export type ReglementStatusApi =
  | "EN_ATTENTE"
  | "EN_RETARD"
  | "RELANCE_ENVOYEE"
  | "PARTIEL"
  | "REGLE";

export interface PaymentFollowUp {
  id: string;
  patientId: string;
  patientName: string;
  amountDue: number;
  dueDate: string;
  daysLate: number;
  status: "En attente" | "En retard" | "Relance envoyee" | "Partiel" | "Regle";
  comment: string | null;
  relanceCount: number;
  lastRelanceAt: string | null;
}

export interface ReglementFormPayload {
  patientId: string;
  amountDue: number;
  dueDate: string;
  status: ReglementStatusApi;
  comment?: string | null;
}

export type EmailCategoryApi = "URGENT" | "ADMINISTRATIF" | "SUIVI_CLINIQUE";

export type EmailStatusApi = "A_TRAITER" | "EN_COURS" | "TRAITE" | "ARCHIVE";

export interface EmailAttachmentInfo {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PriorityEmail {
  id: string;
  from: string;
  subject: string;
  receivedDate: string;
  receivedAt: string;
  category: "Urgent" | "Administratif" | "Suivi clinique";
  status: "A traiter" | "En cours" | "Traite" | "Archive";
  comment: string | null;
  snippet?: string | null;
  bodyText?: string | null;
  importedFrom?: "MANUAL" | "GMAIL";
  gmailMessageId?: string | null;
  gmailThreadId?: string | null;
  hasAttachments?: boolean;
  attachments?: EmailAttachmentInfo[];
  aiSummary?: string | null;
  aiCategory?: string | null;
  aiPriority?: string | null;
  aiGeneratedAt?: string | null;
  patientId: string | null;
  patientName: string | null;
  assigneeId: string | null;
  assignee: string;
}

export interface GmailConnectionStatus {
  connected: boolean;
  configured?: boolean;
  gmailEmail?: string;
  lastSyncAt?: string | null;
  lastSyncCount?: number;
  importedTotal?: number;
}

export interface EmailFormPayload {
  sender: string;
  subject: string;
  receivedAt: string;
  category: EmailCategoryApi;
  status?: EmailStatusApi;
  comment?: string | null;
  patientId?: string | null;
  assigneeId?: string | null;
}

export interface InternalTask {
  id: string;
  title: string;
  comment: string | null;
  assigneeId: string | null;
  assignee: string;
  patientId: string | null;
  patientName: string | null;
  dueDate: string;
  priority: PriorityLevel;
  status: "A faire" | "En cours" | "En attente" | "Terminee";
}

export interface ActivityLog {
  id: string;
  message: string;
  actor: string;
  createdAt: string;
}

export interface DashboardPatientsSummary {
  total: number;
  attentionAdminCount: number;
}

export interface DashboardSummaryResponse {
  payments: PaymentFollowUp[];
  emails: PriorityEmail[];
  tasks: InternalTask[];
  patientsSummary: DashboardPatientsSummary;
}

export interface ReglementsListResponse {
  items: PaymentFollowUp[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EmailsListResponse {
  items: PriorityEmail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TasksListResponse {
  items: InternalTask[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TaskFormPayload {
  title: string;
  comment?: string | null;
  dueDate: string;
  priority: "FAIBLE" | "NORMALE" | "IMPORTANTE" | "URGENTE";
  status: "A_FAIRE" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE";
  assigneeId?: string | null;
  patientId?: string | null;
}

export interface UsersListItem {
  id: string;
  fullName: string;
  email: string;
}

export type PatientHubStatusApi = "ACTIF" | "ATTENTION_ADMIN" | "ARCHIVE";

export interface PatientListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  reglementsCount: number;
  tasksCount: number;
  emailsCount: number;
  nextAppointmentAt: string | null;
  hubStatus: "Actif" | "Suivi admin" | "Archive";
}

export interface PatientFormPayload {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  legalGuardian?: string | null;
  nextAppointmentAt?: string | null;
  mutuelle?: string | null;
  internalComment?: string | null;
  hubStatus?: PatientHubStatusApi;
}

export interface PatientHubDetail {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  legalGuardian: string | null;
  nextAppointmentAt: string | null;
  mutuelle: string | null;
  internalComment: string | null;
  hubStatus: "Actif" | "Suivi admin" | "Archive";
}

export interface PatientHubLogLine {
  id: string;
  actor: string;
  message: string;
  createdAt: string;
}

export interface PatientCommentLine {
  id: string;
  authorId: string | null;
  authorName: string;
  recipientId: string | null;
  recipientName: string | null;
  content: string;
  isDone: boolean;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientDocumentLine {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number;
  storagePath: string | null;
  downloadUrl: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export interface PatientHubResponse {
  patient: PatientHubDetail;
  reglements: PaymentFollowUp[];
  tasks: InternalTask[];
  emails: PriorityEmail[];
  comments: PatientCommentLine[];
  documents: PatientDocumentLine[];
  logs: PatientHubLogLine[];
}

export interface PatientsListResponse {
  items: PatientListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type PatientCsvImportLineStatus = "created" | "updated" | "skipped" | "error";

export interface PatientCsvImportLineResult {
  line: number;
  status: PatientCsvImportLineStatus;
  message?: string;
  patientId?: string;
}

export interface PatientCsvImportResponse {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  lines: PatientCsvImportLineResult[];
}

export interface LogsListResponse {
  items: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
}

export interface NotificationsListResponse {
  items: AppNotification[];
  unreadCount: number;
}

export type PresenceStatusApi =
  | "DISPONIBLE"
  | "EN_CONSULTATION"
  | "EN_REUNION"
  | "ABSENT";

export interface MyPresenceResponse {
  presenceStatus: PresenceStatusApi;
  presenceLabel: string;
}

export interface PresenceTeamMember {
  userId: string;
  fullName: string;
  role: "ADMIN" | "RESPONSABLE" | "SECRETAIRE" | "PRATICIEN" | "ASSISTANTE";
  roleLabel: string;
  presenceStatus: PresenceStatusApi;
  presenceLabel: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface PresenceTeamResponse {
  members: PresenceTeamMember[];
}

export type CalendarEventTypeApi =
  | "CONSULTATION"
  | "RDV_PATIENT"
  | "REUNION"
  | "TACHE"
  | "PAUSE"
  | "AUTRE";

export interface CalendarEventItem {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  type: CalendarEventTypeApi;
  typeLabel: string;
  patientId: string | null;
  patientName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdById: string | null;
  createdByName: string | null;
}

export interface CalendarFeedResponse {
  events: CalendarEventItem[];
  tasks: InternalTask[];
}

export interface ConversationSummary {
  peerId: string;
  peerName: string;
  lastMessageAt: string;
  lastPreview: string;
  unreadCount: number;
}

export interface ConversationsResponse {
  conversations: ConversationSummary[];
}

export interface MessageAttachmentMeta {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt?: string;
}

export interface InternalMessageLine {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  isMine: boolean;
  attachments: MessageAttachmentMeta[];
}

export interface MessagesThreadResponse {
  peer: { id: string; fullName: string };
  messages: InternalMessageLine[];
}

export interface RecipientOption {
  id: string;
  fullName: string;
  roleLabel?: string;
}

export interface SettingModuleStatus {
  name: string;
  status: "Actif" | "En preparation";
  detail: string;
}

export interface SettingsOverviewResponse {
  appName: string;
  appVersion: string;
  environment: string;
  databaseProvider: string;
  counts: {
    patients: number;
    reglements: number;
    emails: number;
    tasks: number;
    logs: number;
  };
  modules: SettingModuleStatus[];
}
