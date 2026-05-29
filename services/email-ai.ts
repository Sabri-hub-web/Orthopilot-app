export interface EmailAiInput {
  subject: string;
  sender: string;
  bodyText: string;
  category?: string;
}

export interface EmailAiResult {
  summary: string;
  category: string;
  priority: "Haute" | "Normale" | "Basse";
  recommendedAction: string;
}

function firstSentences(text: string, max = 2): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, max).join(" ").slice(0, 400);
}

function heuristicPriority(text: string): EmailAiResult["priority"] {
  const t = text.toLowerCase();
  if (t.includes("urgent") || t.includes("douleur") || t.includes("impay") || t.includes("relance")) {
    return "Haute";
  }
  if (t.includes("merci") || t.includes("information") || t.includes("newsletter")) {
    return "Basse";
  }
  return "Normale";
}

function heuristicCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("devis") || t.includes("estimation") || t.includes("proposition")) return "Devis";
  if (t.includes("rdv") || t.includes("rendez") || t.includes("appointment") || t.includes("doctolib")) return "RDV";
  if (t.includes("mutuelle") || t.includes("remboursement") || t.includes("prise en charge")) return "Mutuelle";
  if (t.includes("urgent") || t.includes("douleur") || t.includes("impay") || t.includes("relance")) return "Urgent";
  return "Administratif";
}

/**
 * Résumé IA — implémentation temporaire (extractive + heuristique).
 *
 * TODO(OpenAI) : remplacer le corps de cette fonction par un appel OpenAI.
 *   - Modèle suggéré : gpt-4o-mini (ou équivalent), via process.env.OPENAI_API_KEY
 *   - Prompt : envoyer subject + sender + bodyText (tronqué ~4000 caractères)
 *   - Demander un JSON : { summary, category, priority, recommendedAction }
 *   - Valider la sortie (zod) avant de retourner.
 * La signature et le type de retour (EmailAiResult) ne doivent pas changer
 * pour ne pas impacter l'appelant (generateEmailAiSummary).
 */
export function buildAiSummary(input: EmailAiInput): EmailAiResult {
  const haystack = `${input.subject} ${input.bodyText}`;
  const lead = firstSentences(input.bodyText) || input.subject;
  const category = heuristicCategory(haystack);
  const priority = heuristicPriority(haystack);

  const recommendedAction =
    priority === "Haute"
      ? "Traiter rapidement et assigner un responsable."
      : category === "RDV"
        ? "Vérifier le planning et confirmer le rendez-vous."
        : category === "Devis"
          ? "Préparer ou transmettre le devis demandé."
          : "Lire et classer selon le suivi habituel.";

  const summary = `${lead}`.trim();

  return {
    summary: summary || "Email sans contenu détaillé.",
    category,
    priority,
    recommendedAction,
  };
}
