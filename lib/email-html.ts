const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&eacute;": "é",
  "&egrave;": "è",
  "&agrave;": "à",
  "&ccedil;": "ç",
  "&ugrave;": "ù",
  "&ocirc;": "ô",
  "&euro;": "€",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
  "&rsquo;": "'",
  "&laquo;": "«",
  "&raquo;": "»",
};

export function decodeHtmlEntities(input: string): string {
  let out = input;
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    out = out.split(entity).join(char);
  }
  out = out.replace(/&#(\d+);/g, (_, code) => {
    const n = Number(code);
    return Number.isFinite(n) ? String.fromCodePoint(n) : "";
  });
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
    const n = parseInt(code, 16);
    return Number.isFinite(n) ? String.fromCodePoint(n) : "";
  });
  return out;
}

/**
 * Supprime les blocs CSS résiduels (sélecteur { ... }) y compris @font-face / @media,
 * même quand les balises HTML <style> ont déjà été retirées (cas des emails déjà importés
 * avec l'ancien parseur). On retire itérativement les accolades les plus internes pour
 * gérer les règles imbriquées (@media { selector { ... } }).
 */
function stripResidualCss(input: string): string {
  let text = input;
  let prev = "";
  let guard = 0;
  while (text !== prev && guard < 30) {
    prev = text;
    text = text.replace(/[^{}]*\{[^{}]*\}/g, " ");
    guard += 1;
  }
  // At-rules restantes sans bloc + accolades orphelines
  text = text.replace(/@(?:media|font-face|import|charset|keyframes|supports|page)[^;{}\n]*[;]?/gi, " ");
  text = text.replace(/[{}]/g, " ");
  return text;
}

/**
 * Convertit du HTML (ou du texte déjà partiellement dégradé contenant du CSS brut)
 * en texte propre et lisible : pas de balises, pas de CSS, entités décodées,
 * sauts de ligne sémantiques préservés.
 */
export function htmlToCleanText(input: string): string {
  if (!input) return "";
  let text = input;

  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<head[\s\S]*?<\/head>/gi, " ");

  text = text.replace(/<\/(p|div|tr|li|h[1-6]|table|blockquote|ul|ol)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "• ");

  text = text.replace(/<[^>]+>/g, " ");

  text = stripResidualCss(text);
  text = decodeHtmlEntities(text);

  text = text.replace(/[ \t\f\v]+/g, " ");
  text = text.replace(/ *\n */g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * Nettoyage à l'affichage : sûr à appeler sur n'importe quel bodyText stocké
 * (texte propre, HTML brut, ou texte avec CSS résiduel d'un ancien import).
 */
export function cleanEmailBody(raw: string | null | undefined): string {
  if (!raw) return "";
  return htmlToCleanText(raw);
}
