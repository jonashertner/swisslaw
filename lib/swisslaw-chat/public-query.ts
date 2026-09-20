import { safeQuery } from './policy';
/** Only these public legal words can leave in an automatic text search. This is
 * deliberately lossy; an unrecognised topic asks for clarification, never sends
 * the original question. A vocabulary match is NOT a legal classification. */
const WORDS = `Arbeitsvertrag Arbeitsrecht Arbeitszeit Arbeitsverhältnis Arbeitnehmer Arbeitgeber Kündigung Kündigungsfrist Kündigungsschutz Probezeit Überstunden Überzeit Lohn Lohnzahlung Lohnfortzahlung Ferien Urlaub Krankheit Unfall Mutterschaft Vaterschaft Elternzeit Diskriminierung Mobbing Zeugnis Arbeitszeugnis Freistellung Befristung Lehrvertrag GAV Normalarbeitsvertrag Personalrecht Bundespersonal kantonal öffentlich privatrechtlich fristlos ordentlich missbräuchlich
Miete Mietvertrag Mietrecht Mietzins Mietzinserhöhung Mietzinssenkung Nebenkosten Kaution Mangel Mängel Wohnung Vermieter Mieter Untermiete Ausweisung Räumung Kündigungsanfechtung Erstreckung Schlichtung Nachbarn Nachbarrecht Lärm Eigentum Stockwerkeigentum Baurecht Baubewilligung Dienstbarkeit Grundbuch
Heirat heiraten Eheschliessung Ehevorbereitung Zivilstandsamt Ehe Ehevertrag Scheidung Trennung Unterhalt Sorgerecht Obhut Besuchsrecht Kindeswohl Vaterschaft Adoption Kindesunterhalt Erwachsenenschutz Vorsorgeauftrag Patientenverfügung Beistandschaft KESB
Erbrecht Erbschaft Testament Erbvertrag Pflichtteil Erbteilung Ausschlagung Nachlass Willensvollstrecker
Kauf Kaufvertrag Konsument Gewährleistung Garantie Rücktritt Widerruf Rückgabe Onlinekauf Bestellung Lieferung Zahlungsverzug Mahnung Inkasso Betreibung Rechtsvorschlag Pfändung Konkurs Verlustschein Schulden Verjährung Forderung Darlehen Zins Schadenersatz Haftung Vertrag Abschluss Auflösung Auftrag Werkvertrag Abnahme
Strafrecht Strafanzeige Strafantrag Strafbefehl Einsprache Beschwerde Berufung Frist Strafverfahren Polizei Aufgaben Einvernahme Beschuldigter Opferhilfe Diebstahl Betrug Nötigung Drohung Körperverletzung häusliche Gewalt Sexualdelikt Verleumdung Datenschutz Persönlichkeitsrecht Auskunft Löschung Einwilligung Bildrecht
Sozialversicherung AHV IV EL Invalidenversicherung Arbeitslosenversicherung Unfallversicherung Krankenversicherung Krankenkasse Prämie Franchise Selbstbehalt Sozialhilfe Ergänzungsleistungen Rente Pensionskasse Freizügigkeit Vorsorge
Ausländerrecht Aufenthalt Aufenthaltsbewilligung Niederlassung Einbürgerung Familiennachzug Asyl Wegweisung Visum
Steuer Steuern Steuererklärung Einkommen Vermögen Mehrwertsteuer Einsprache Verwaltungsrecht Verfügung Rechtsmittel Zuständigkeit unentgeltliche Rechtspflege Prozesskosten Zivilprozess Beweis Gerichtsstand Vollstreckung
Stiftung Verein Gesellschaft Aktiengesellschaft GmbH Gründung Verwaltungsrat Generalversammlung Statuten Haftpflicht Handelsregister Aktionär Kapital Insolvenz Immaterialgüterrecht Urheberrecht Marke Lizenz Wettbewerb Verkehr Strassenverkehr Führerausweis Führerschein Busse Ordnungsbusse Schule Bildung Prüfung Kinder Jugendliche Teilzeit Vollzeit Schweiz Schweizer Bund Kanton Gemeinde Zürich Bern Luzern Uri Schwyz Obwalden Nidwalden Glarus Zug Freiburg Solothurn Basel Schaffhausen Appenzell Gallen Graubünden Aargau Thurgau Tessin Waadt Wallis Neuenburg Genf Jura`;
const modifiers=new Set('öffentlich privatrechtlich kantonal fristlos ordentlich missbräuchlich Teilzeit Vollzeit Schweiz Schweizer Bund Kanton Gemeinde Zürich Bern Luzern Uri Schwyz Obwalden Nidwalden Glarus Zug Freiburg Solothurn Basel Schaffhausen Appenzell Gallen Graubünden Aargau Thurgau Tessin Waadt Wallis Neuenburg Genf Jura'.split(' '));
const vocabulary = new Map(WORDS.split(/\s+/u).map(word => [normal(word), word]));
function normal(s:string) { return s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase(); }
export function publicLegalQuery(proposed: string): string {
  if(typeof proposed!=='string'||proposed.length>2000) throw new Error('INVALID_QUERY');
  // Remove addresses/URLs as wholes, even if their local part contains legal words.
  const clean=proposed.normalize('NFC').replace(/\S*@\S*|https?:\/\/\S*|www\.\S*/giu,' ');
  const tokens=new Set((clean.match(/[\p{L}]+/gu)??[]).map(normal));
  const selected=[...vocabulary.entries()].filter(([key])=>tokens.has(key)).map(([,value])=>value).slice(0,5);
  if(!selected.some(word=>!modifiers.has(word))) throw new Error('INVALID_QUERY');
  while(selected.join(' ').length>180) selected.pop();
  const query=selected.join(' ');
  return safeQuery(query.length<4 ? `Schweiz ${query}` : query);
}
