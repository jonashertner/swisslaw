// Removes personal details from a submitted question. Runs in the browser before sending and again on
// the server before storing. Deliberately conservative: it replaces identifiers, not the legal substance
// (dates, amounts, cantons and roles stay, because the question needs them).
export type Redaction = { text: string; replaced: number };

const RULES: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[E-Mail]'],
  [/\b756[.\s]?\d{4}[.\s]?\d{4}[.\s]?\d{2}\b/g, '[AHV-Nr.]'],
  [/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g, '[IBAN]'],
  [/(?:\+41|0041|\b0)\s?\(?0?\)?\s?[1-9]\d(?:[\s./-]?\d){7}\b/g, '[Telefon]'],
  [/\b[A-ZÄÖÜ][\wäöüéèàç-]*(?:strasse|str\.|gasse|weg|platz|rain|allee|ring|halde|matte|rue|chemin|avenue|via|piazza)\s+\d+\s?[a-z]?\b/gi, '[Adresse]'],
  [/\b(?:Herr|Herrn|Frau|Hr\.|Fr\.|Monsieur|Madame|M\.|Mme|Signor|Signora|Sig\.|Sig\.ra|Mr\.?|Mrs\.?|Ms\.?|Dr\.)\s+[A-ZÄÖÜ][\wäöüéèàç'-]+(?:\s+[A-ZÄÖÜ][\wäöüéèàç'-]+)?/g, '[Name]'],
  [/\b(?:AG|AI|AR|BE|BL|BS|FR|GE|GL|GR|JU|LU|NE|NW|OW|SG|SH|SO|SZ|TG|TI|UR|VD|VS|ZG|ZH)\s?\d{2,6}\b/g, '[Kennzeichen]'],
  [/\b\d{7,}\b/g, '[Nummer]'],
];

export function redact(input: string): Redaction {
  let text = input.normalize('NFC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  let replaced = 0;
  for (const [pattern, label] of RULES) text = text.replace(pattern, () => { replaced++; return label; });
  return { text: text.trim(), replaced };
}
