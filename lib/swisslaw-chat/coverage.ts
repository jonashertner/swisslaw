// What swisslaw.io intends to cover, in the order of knowledge/COVERAGE.md. Topic names only; legal content lives in knowledge/.
// A topic in waves 1 to 3 counts as live once its situation is public. Romansh (rm) is a first translation and needs review by a native speaker.
import type { KnowledgeLanguage } from './knowledge';

type Entry = Record<KnowledgeLanguage, string>;
const e = (de: string, fr: string, it: string, rm: string, en: string): Entry => ({ de, fr, it, rm, en });

export type CoverageTopic = { id?: string; title: Entry };
export type CoverageGroup = { area: string; label?: Entry; topics: CoverageTopic[] };

/** Wave 1: every topic has a situation file. Labels for these areas come from AREA_TEXT. */
export const WAVE_1: readonly CoverageGroup[] = [
  { area: 'tenancy', topics: [
    { id: 'tenancy.landlord-notice', title: e('Kündigung durch den Vermieter', 'Résiliation par le bailleur', 'Disdetta da parte del locatore', 'Disditga da vart dal locatur', 'Notice from the landlord') },
    { id: 'tenancy.rent-increase', title: e('Mietzinserhöhung', 'Hausse de loyer', 'Aumento della pigione', 'Augment dal tschains', 'Rent increase') },
    { id: 'tenancy.rent-reduction', title: e('Mietzinssenkung verlangen', 'Demander une baisse de loyer', 'Chiedere una riduzione della pigione', 'Pretender ina reducziun dal tschains', 'Asking for a rent reduction') },
    { id: 'tenancy.defects', title: e('Mängel in der Wohnung', 'Défauts dans le logement', 'Difetti nell’abitazione', 'Mancanzas en l’abitaziun', 'Defects in the flat') },
    { id: 'tenancy.deposit', title: e('Mietkaution zurückerhalten', 'Récupérer la garantie de loyer', 'Recuperare la garanzia della pigione', 'Survegnir enavos la garanzia', 'Getting the rent deposit back') },
    { id: 'tenancy.early-exit', title: e('Vorzeitig ausziehen', 'Quitter le logement avant terme', 'Lasciare l’abitazione anticipatamente', 'Bandunar l’abitaziun avant temp', 'Moving out early') },
  ] },
  { area: 'employment', topics: [
    { id: 'employment.dismissal', title: e('Kündigung durch den Arbeitgeber', 'Licenciement par l’employeur', 'Disdetta da parte del datore di lavoro', 'Disditga da vart dal patrun', 'Notice from the employer') },
    { id: 'employment.summary-dismissal', title: e('Fristlose Entlassung', 'Licenciement immédiat', 'Licenziamento immediato', 'Relaschada immediata', 'Summary dismissal') },
    { id: 'employment.unpaid-wages', title: e('Lohn wird nicht bezahlt', 'Salaire impayé', 'Salario non pagato', 'Salari betg pajà', 'Unpaid wages') },
    { id: 'employment.sick-pay', title: e('Lohn bei Krankheit', 'Salaire en cas de maladie', 'Salario in caso di malattia', 'Salari en cas da malsogna', 'Pay during illness') },
    { id: 'employment.reference', title: e('Arbeitszeugnis', 'Certificat de travail', 'Certificato di lavoro', 'Attestat da lavur', 'Work reference') },
  ] },
  { area: 'debt', topics: [
    { id: 'debt.payment-order', title: e('Zahlungsbefehl erhalten', 'Commandement de payer reçu', 'Precetto esecutivo ricevuto', 'Cumond da pajament retschavì', 'Payment order received') },
    { id: 'debt.garnishment', title: e('Lohnpfändung und Existenzminimum', 'Saisie de salaire et minimum vital', 'Pignoramento del salario e minimo vitale', 'Pigneraziun dal salari e minimum d’existenza', 'Wage garnishment and subsistence minimum') },
  ] },
  { area: 'consumer', topics: [
    { id: 'consumer.defective-purchase', title: e('Gekaufte Sache ist mangelhaft', 'Achat défectueux', 'Acquisto difettoso', 'Chaussa cumprada defectusa', 'Defective purchase') },
    { id: 'consumer.doorstep-withdrawal', title: e('Widerruf bei Haustür- und Telefonverkauf', 'Révoquer un achat à domicile ou par téléphone', 'Revocare un acquisto a domicilio o per telefono', 'Revocar ina cumpra a chasa u per telefon', 'Withdrawing from a doorstep or phone sale') },
    { id: 'consumer.faulty-work', title: e('Mangelhafte Handwerkerarbeit', 'Travaux mal exécutés', 'Lavori eseguiti male', 'Lavur da mastergnant manglusa', 'Poor work by a tradesperson') },
  ] },
  { area: 'traffic', topics: [
    { id: 'traffic.penalty-order', title: e('Strafbefehl erhalten', 'Ordonnance pénale reçue', 'Decreto d’accusa ricevuto', 'Cumond penal retschavì', 'Penalty order received') },
    { id: 'traffic.fixed-fine', title: e('Ordnungsbusse', 'Amende d’ordre', 'Multa disciplinare', 'Multa disciplinara', 'Fixed fine') },
  ] },
  { area: 'admin', topics: [
    { id: 'admin.tax-assessment', title: e('Steuerveranlagung anfechten', 'Contester une taxation fiscale', 'Contestare una tassazione', 'Contestar ina taxaziun da taglia', 'Challenging a tax assessment') },
    { id: 'admin.decision-appeal', title: e('Entscheid einer Behörde anfechten', 'Recourir contre une décision administrative', 'Impugnare una decisione dell’autorità', 'Recurrer cunter ina decisiun d’ina autoritad', 'Appealing a decision by an authority') },
  ] },
  { area: 'data', topics: [
    { id: 'data.access-request', title: e('Auskunft über eigene Daten', 'Accès à ses données personnelles', 'Accesso ai propri dati', 'Infurmaziun davart las atgnas datas', 'Access to your personal data') },
  ] },
];

/** Wave 2: every topic has a situation file. */
export const WAVE_2: readonly CoverageGroup[] = [
  { area: 'family', topics: [
    { id: 'family.separation', title: e('Trennung', 'Séparation', 'Separazione', 'Separaziun', 'Separation') },
    { id: 'family.divorce', title: e('Scheidung: die Grundlagen', 'Divorce : les bases', 'Divorzio: le basi', 'Divorzi: las basas', 'Divorce basics') },
    { id: 'family.child-maintenance', title: e('Kinderunterhalt', 'Contribution d’entretien pour l’enfant', 'Contributo di mantenimento per i figli', 'Contribuziun da mantegniment per uffants', 'Child maintenance') },
    { id: 'family.parental-care', title: e('Elterliche Sorge und Kontakt', 'Autorité parentale et relations personnelles', 'Autorità parentale e relazioni personali', 'Tgira genituriala e contact', 'Parental responsibility and contact') },
  ] },
  { area: 'social', topics: [
    { id: 'social.unemployment', title: e('Arbeitslos melden und Einstelltage', 'S’inscrire au chômage et jours de suspension', 'Iscriversi alla disoccupazione e giorni di sospensione', 'S’annunziar sco dischoccupà e dis da suspensiun', 'Registering as unemployed and benefit suspensions') },
    { id: 'social.invalidity-application', title: e('Anmeldung bei der IV', 'Demande à l’AI', 'Richiesta all’AI', 'Annunzia tar l’AI', 'Registering with disability insurance (DI)') },
    { id: 'social.work-accident', title: e('Unfall bei der Arbeit', 'Accident professionnel', 'Infortunio professionale', 'Accident a la lavur', 'Accident at work') },
    { id: 'social.ahv-gaps', title: e('Beitragslücken in der AHV', 'Lacunes de cotisation AVS', 'Lacune contributive AVS', 'Mancanzas da contribuziun a l’AVS', 'Gaps in OASI contributions') },
  ] },
];

/** Wave 3: topics with a situation file, drafted for review. */
export const WAVE_3: readonly CoverageGroup[] = [
  { area: 'inheritance', topics: [
    { id: 'inheritance.will', title: e('Testament errichten', 'Rédiger un testament', 'Redigere un testamento', 'Far in testament', 'Making a will') },
    { id: 'inheritance.compulsory-shares', title: e('Pflichtteile', 'Réserves héréditaires', 'Porzioni legittime', 'Parts obligatoricas', 'Compulsory shares') },
    { id: 'inheritance.refusal', title: e('Erbschaft ausschlagen', 'Répudier une succession', 'Rinunciare all’eredità', 'Refusar l’ierta', 'Refusing an inheritance') },
    { id: 'inheritance.debts', title: e('Schulden der verstorbenen Person', 'Dettes de la personne décédée', 'Debiti della persona defunta', 'Debits da la persuna morta', 'Debts of the deceased') },
    { id: 'inheritance.power-of-attorney', title: e('Vorsorgeauftrag und Patientenverfügung', 'Mandat pour cause d’inaptitude et directives anticipées', 'Mandato precauzionale e direttive del paziente', 'Mandat da precauziun', 'Power of attorney and advance directive') },
  ] },
  { area: 'health', topics: [
    { id: 'health.refused-bill', title: e('Die Kasse zahlt eine Rechnung nicht', 'La caisse refuse de payer une facture', 'La cassa non paga una fattura', 'La cassa na paja betg in quint', 'The insurer refuses to pay a bill') },
    { id: 'health.switching', title: e('Die Kasse wechseln: Fristen', 'Changer de caisse : les délais', 'Cambiare cassa: i termini', 'Midar la cassa: ils termins', 'Changing insurer: deadlines') },
    { id: 'health.supplementary', title: e('Streit um die Zusatzversicherung', 'Litige sur l’assurance complémentaire', 'Controversia sull’assicurazione complementare', 'Dispita davart l’assicuranza cumplementara', 'Supplementary insurance disputes') },
  ] },
  { area: 'protection', topics: [
    { id: 'protection.domestic-violence', title: e('Häusliche Gewalt', 'Violence domestique', 'Violenza domestica', 'Violenza a chasa', 'Domestic violence') },
    { id: 'protection.victim-support', title: e('Opferhilfe', 'Aide aux victimes', 'Aiuto alle vittime', 'Agid a las victimas', 'Victim support') },
    { id: 'protection.police-questioning', title: e('Rechte bei einer Befragung durch die Polizei', 'Vos droits lors d’une audition par la police', 'Diritti durante un interrogatorio di polizia', 'Dretgs durant in interrogatori da la polizia', 'Your rights when questioned by the police') },
  ] },
  { area: 'courts', topics: [
    { id: 'courts.conciliation', title: e('So läuft eine Schlichtung', 'Comment se déroule une conciliation', 'Come si svolge una conciliazione', 'Uschia funcziuna ina conciliaziun', 'How conciliation works') },
    { id: 'courts.legal-aid', title: e('Unentgeltliche Rechtspflege', 'Assistance judiciaire gratuite', 'Gratuito patrocinio', 'Assistenza giudiziala gratuita', 'Free legal aid') },
    { id: 'courts.lawyer', title: e('Eine Anwältin oder einen Anwalt finden und bezahlen', 'Trouver et payer un avocat', 'Trovare e pagare un avvocato', 'Chattar e pajar in advocat', 'Finding and paying a lawyer') },
  ] },
  { area: 'environment', topics: [
    { id: 'environment.report-pollution', title: e('Umweltverschmutzung melden', 'Signaler une pollution', 'Segnalare un inquinamento', 'Annunziar ina contaminaziun da l’ambient', 'Reporting pollution') },
    { id: 'environment.project-participation', title: e('Bei Bauprojekten mitreden', 'Participer aux projets de construction', 'Partecipare ai progetti di costruzione', 'Participar a projects da construcziun', 'Having a say in building projects') },
    { id: 'environment.information', title: e('Umweltinformationen erhalten', 'Obtenir des informations environnementales', 'Ottenere informazioni ambientali', 'Survegnir infurmaziuns davart l’ambient', 'Getting environmental information') },
    { id: 'environment.climate', title: e('Klimaschutz: rechtliche Wege', 'Protection du climat : les voies juridiques', 'Protezione del clima: le vie legali', 'Protecziun dal clima: vias giuridicas', 'Climate protection: legal routes') },
    { id: 'environment.invasive-plants', title: e('Invasive Pflanzen', 'Plantes exotiques envahissantes', 'Piante esotiche invasive', 'Plantas invasivas', 'Invasive plants') },
    { id: 'environment.contaminated-soil', title: e('Belastete Böden und Standorte', 'Sols et sites pollués', 'Suoli e siti inquinati', 'Terrens e lieus contaminads', 'Contaminated soil and sites') },
    { id: 'environment.traffic-noise', title: e('Strassen- und Bahnlärm', 'Bruit routier et ferroviaire', 'Rumore stradale e ferroviario', 'Canera da la via e da la viafier', 'Road and rail noise') },
  ] },
];

/** The long tail: planned, not yet drafted. */
export const LATER: readonly CoverageGroup[] = [
  { area: 'more', label: e('Weitere Themen', 'Autres thèmes', 'Altri temi', 'Ulteriurs temas', 'Further topics'), topics: [
    { title: e('Nachbarn: Lärm, Bäume, Grenzen', 'Voisins : bruit, arbres, limites', 'Vicini: rumore, alberi, confini', 'Vischins: canera, plantas, cunfins', 'Neighbours: noise, trees, boundaries') },
    { title: e('Forderungen bis 30 000 Franken', 'Créances jusqu’à 30 000 francs', 'Crediti fino a 30 000 franchi', 'Pretensiuns fin 30 000 francs', 'Claims up to CHF 30,000') },
    { title: e('Die Versicherung lehnt einen Schaden ab', 'L’assurance refuse un sinistre', 'L’assicurazione respinge un sinistro', 'L’assicuranza refusa in donn', 'An insurance claim is refused') },
    { title: e('Verkehrsunfall', 'Accident de la circulation', 'Incidente stradale', 'Accident da traffic', 'Road accident') },
    { title: e('Flugverspätung und Annullierung', 'Retard et annulation de vol', 'Ritardo e cancellazione del volo', 'Retard ed annullaziun dal sgol', 'Flight delays and cancellations') },
    { title: e('Hundebiss', 'Morsure de chien', 'Morso di cane', 'Morsa da chaun', 'Dog bites') },
    { title: e('Lehre', 'Apprentissage', 'Apprendistato', 'Emprendissadi', 'Apprenticeships') },
    { title: e('Entscheide von Schule und Ausbildung', 'Décisions scolaires et de formation', 'Decisioni scolastiche e di formazione', 'Decisiuns da scola e furmaziun', 'School and education decisions') },
    { title: e('Aufenthaltsbewilligung', 'Autorisation de séjour', 'Permesso di dimora', 'Permissiun da dimora', 'Residence permits') },
    { title: e('Betrug im Internet', 'Escroquerie en ligne', 'Truffa online', 'Engion en l’internet', 'Online fraud') },
    { title: e('Eigene Daten löschen lassen', 'Faire effacer ses données', 'Far cancellare i propri dati', 'Laschar stizzar las atgnas datas', 'Deleting your personal data') },
  ] },
];
