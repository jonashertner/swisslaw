/** Prepared translations; independent legal and language review remains required, especially for Romansh. */
export type Language = 'de' | 'fr' | 'it' | 'rm' | 'en';
const COPY: Record<string, readonly [string, string, string, string]> = {
  "A useful starting point": [
    "Ein hilfreicher Anfang",
    "Un point de départ utile",
    "Un punto di partenza utile",
    "In punct da partenza util"
  ],
  "Is this what you mean?": [
    "Geht es Ihnen darum?",
    "Est-ce bien de cela qu’il s’agit ?",
    "È questo che intende?",
    "Manegiais Vus quai?"
  ],
  "Extra working hours": [
    "Zusätzliche Arbeitsstunden",
    "Heures de travail en plus",
    "Ore di lavoro in più",
    "Uras da lavur supplementaras"
  ],
  "Getting married": [
    "Heiraten",
    "Se marier",
    "Sposarsi",
    "Maridar"
  ],
  "Choose what fits. It is fine not to know yet.": [
    "Wählen Sie, was zutrifft. Sie können auch angeben, dass Sie es noch nicht wissen.",
    "Choisissez ce qui correspond à votre situation. Vous pouvez aussi indiquer que vous ne savez pas encore.",
    "Scelga ciò che corrisponde alla sua situazione. Può anche indicare che non lo sa ancora.",
    "Tschernei quai che correspunda a Vossa situaziun. Vus pudais era inditgar che Vus na savais anc betg."
  ],
  "Your role": [
    "Ihre Rolle",
    "Votre rôle",
    "Il suo ruolo",
    "Vossa rolla"
  ],
  "I am an employee": [
    "Ich bin angestellt",
    "Je suis salarié",
    "Sono dipendente",
    "Jau sun emploià"
  ],
  "I am an employer": [
    "Ich bin Arbeitgeberin oder Arbeitgeber",
    "Je suis employeur",
    "Sono datore di lavoro",
    "Jau sun patrun"
  ],
  "I work for myself": [
    "Ich bin selbständig",
    "Je travaille à mon compte",
    "Lavoro in proprio",
    "Jau lavur independentamain"
  ],
  "Employment rules": [
    "Recht für das Arbeitsverhältnis",
    "Droit applicable à l’emploi",
    "Diritto applicabile al rapporto di lavoro",
    "Dretg applicabel a la relaziun da lavur"
  ],
  "Private employment law": [
    "Privates Arbeitsrecht",
    "Droit privé du travail",
    "Diritto privato del lavoro",
    "Dretg privat da lavur"
  ],
  "Public employment law": [
    "Öffentliches Personalrecht",
    "Droit public du personnel",
    "Diritto pubblico del personale",
    "Dretg public dal persunal"
  ],
  "I’m not sure": [
    "Ich bin nicht sicher",
    "Je ne sais pas",
    "Non ne sono sicuro",
    "Jau na sun betg segir"
  ],
  "Check your contract. A public employer can also use a private-law contract.": [
    "Schauen Sie in Ihren Vertrag. Auch ein öffentlicher Arbeitgeber kann einen privatrechtlichen Vertrag abschliessen.",
    "Consultez votre contrat. Un employeur public peut aussi conclure un contrat de droit privé.",
    "Controlli il suo contratto. Anche un datore di lavoro pubblico può stipulare un contratto di diritto privato.",
    "Consultai Voss contract. Er in patrun public po far in contract da dretg privat."
  ],
  "What would help most?": [
    "Was würde Ihnen am meisten helfen?",
    "Qu’est-ce qui vous aiderait le plus ?",
    "Che cosa le sarebbe più utile?",
    "Tge As gidass il pli fitg?"
  ],
  "Less extra work": [
    "Weniger zusätzliche Arbeit",
    "Moins d’heures en plus",
    "Meno lavoro in più",
    "Main lavur supplementara"
  ],
  "Time off": [
    "Ausgleich durch Freizeit",
    "Du temps libre en compensation",
    "Tempo libero in compensazione",
    "Temp liber sco cumpensaziun"
  ],
  "Payment": [
    "Bezahlung",
    "Un paiement",
    "Un pagamento",
    "In pajament"
  ],
  "Understand my options": [
    "Meine Möglichkeiten verstehen",
    "Comprendre mes options",
    "Capire le mie possibilità",
    "Chapir mias pussaivladads"
  ],
  "Where do you want to marry?": [
    "Wo möchten Sie heiraten?",
    "Où souhaitez-vous vous marier ?",
    "Dove desidera sposarsi?",
    "Nua vulais Vus maridar?"
  ],
  "In Switzerland": [
    "In der Schweiz",
    "En Suisse",
    "In Svizzera",
    "En Svizra"
  ],
  "Outside Switzerland": [
    "Ausserhalb der Schweiz",
    "Hors de Suisse",
    "Fuori dalla Svizzera",
    "Ordaifer la Svizra"
  ],
  "Does either of you live in Switzerland?": [
    "Wohnt mindestens eine der beiden Personen in der Schweiz?",
    "L’un de vous habite-t-il en Suisse ?",
    "Almeno uno di voi vive in Svizzera?",
    "Viva ina da vus duas persunas en Svizra?"
  ],
  "Yes": [
    "Ja",
    "Oui",
    "Sì",
    "Gea"
  ],
  "No": [
    "Nein",
    "Non",
    "No",
    "Na"
  ],
  "Before reading the sources": [
    "Bevor Sie die Quellen lesen",
    "Avant de lire les sources",
    "Prima di leggere le fonti",
    "Avant che leger las funtaunas"
  ],
  "Only these public article references go to OpenCaseLaw. They can reveal the topic. Your question and choices stay in this tab.": [
    "Nur diese Verweise auf öffentliche Gesetzesartikel werden an OpenCaseLaw gesendet. Daraus kann das Thema erkennbar sein. Ihre Frage und Ihre Angaben bleiben in diesem Tab.",
    "Seules ces références à des articles publics sont envoyées à OpenCaseLaw. Elles peuvent révéler le sujet. Votre question et vos réponses restent dans cet onglet.",
    "Solo questi riferimenti ad articoli pubblici vengono inviati a OpenCaseLaw. Possono rivelare l’argomento. La sua domanda e le sue risposte restano in questa scheda.",
    "Mo quests renviaments ad artitgels publics vegnan tramess ad OpenCaseLaw. Els pon revelar il tema. Vossa dumonda e Vossas respostas restan en quest tab."
  ],
  "Read my guide": [
    "Meine Übersicht lesen",
    "Lire mon guide",
    "Leggere la mia guida",
    "Leger mia orientaziun"
  ],
  "Reading the public provisions…": [
    "Öffentliche Bestimmungen werden gelesen…",
    "Lecture des dispositions publiques…",
    "Lettura delle disposizioni pubbliche…",
    "Leger las disposiziuns publicas…"
  ],
  "Prepared guide · not generated by the model": [
    "Vorbereitete Orientierung · nicht vom Modell erstellt",
    "Guide préparé · non généré par le modèle",
    "Guida preparata · non generata dal modello",
    "Orientaziun preparada · betg generada dal model"
  ],
  "Practical next steps": [
    "Praktische nächste Schritte",
    "Prochaines étapes pratiques",
    "Prossimi passi pratici",
    "Proxims pass pratics"
  ],
  "What matters in your situation": [
    "Was in Ihrer Situation wichtig ist",
    "Ce qui compte dans votre situation",
    "Ciò che conta nella sua situazione",
    "Tge che quinta en Vossa situaziun"
  ],
  "Read the provisions": [
    "Bestimmungen lesen",
    "Lire les dispositions",
    "Leggere le disposizioni",
    "Leger las disposiziuns"
  ],
  "Change my choices": [
    "Meine Angaben ändern",
    "Modifier mes réponses",
    "Modificare le mie risposte",
    "Midar mias respostas"
  ],
  "This is about something else": [
    "Es geht um etwas anderes",
    "Il s’agit d’autre chose",
    "Si tratta di altro",
    "I sa tracta d’insatge auter"
  ],
  "Continue with my own question": [
    "Mit meiner eigenen Frage fortfahren",
    "Continuer avec ma propre question",
    "Continuare con la mia domanda",
    "Cuntinuar cun mia atgna dumonda"
  ],
  "These sources could not be checked. The guide has not been released. Try again or read the official information.": [
    "Diese Quellen konnten nicht geprüft werden. Die Orientierung wird deshalb nicht angezeigt. Versuchen Sie es erneut oder lesen Sie die offiziellen Informationen.",
    "Ces sources n’ont pas pu être vérifiées. Le guide n’est donc pas affiché. Réessayez ou consultez les informations officielles.",
    "Non è stato possibile verificare queste fonti. La guida non viene quindi mostrata. Riprovi o consulti le informazioni ufficiali.",
    "Questas funtaunas n’han betg pudì vegnir controlladas. L’orientaziun na vegn perquai betg mussada. Empruvai anc ina giada u legiai las infurmaziuns uffizialas."
  ],
  "Try again": [
    "Erneut versuchen",
    "Réessayer",
    "Riprovare",
    "Empruvar anc ina giada"
  ],
  "Official information": [
    "Offizielle Informationen",
    "Informations officielles",
    "Informazioni ufficiali",
    "Infurmaziuns uffizialas"
  ],
  "No model download needed for this guide.": [
    "Für diese Orientierung müssen Sie kein Modell herunterladen.",
    "Aucun téléchargement de modèle n’est nécessaire pour ce guide.",
    "Per questa guida non occorre scaricare un modello.",
    "Per questa orientaziun na stuais Vus telechargiar nagin model."
  ],
  "The source text matches this guide’s reference version. That is not a guarantee that every applicable rule has been covered.": [
    "Der Quellentext stimmt mit der Referenzversion dieser Orientierung überein. Das garantiert nicht, dass alle anwendbaren Regeln berücksichtigt sind.",
    "Le texte de la source correspond à la version de référence de ce guide. Cela ne garantit pas que toutes les règles applicables ont été couvertes.",
    "Il testo della fonte corrisponde alla versione di riferimento di questa guida. Ciò non garantisce che siano state considerate tutte le regole applicabili.",
    "Il text da la funtauna correspunda a la versiun da referenza da questa orientaziun. Quai na garantescha betg che tut las reglas applicablas èn vegnidas resguardadas."
  ],
  "This guided starting point uses prepared explanations and checks the cited provisions through OpenCaseLaw. Free questions use the experimental local model.": [
    "Dieser geführte Einstieg verwendet vorbereitete Erläuterungen und prüft die zitierten Bestimmungen über OpenCaseLaw. Frei formulierte Fragen nutzen das experimentelle lokale Modell.",
    "Ce parcours guidé utilise des explications préparées et vérifie les dispositions citées via OpenCaseLaw. Les questions libres utilisent le modèle local expérimental.",
    "Questo percorso guidato usa spiegazioni preparate e verifica le disposizioni citate tramite OpenCaseLaw. Le domande libere utilizzano il modello locale sperimentale.",
    "Quest cumenzament guidà dovra decleraziuns preparadas e controllescha las disposiziuns citadas via OpenCaseLaw. Dumondas libras dovran il model local experimental."
  ],
  "Source": [
    "Quelle",
    "Source",
    "Fonte",
    "Funtauna"
  ],
  "Checked on": [
    "Geprüft am",
    "Vérifié le",
    "Verificato il",
    "Controllà ils"
  ],
  "The source provisions are in German. Translations still need independent review.": [
    "Die Originalbestimmungen sind auf Deutsch. Die Übersetzungen müssen noch unabhängig geprüft werden.",
    "Les dispositions sources sont en allemand. Les traductions doivent encore faire l’objet d’une vérification indépendante.",
    "Le disposizioni originali sono in tedesco. Le traduzioni devono ancora essere verificate in modo indipendente.",
    "Las disposiziuns originalas èn per tudestg. Las translaziuns ston anc vegnir controlladas independentamain."
  ],
  "Pay or another work issue": [
    "Lohn oder eine andere Arbeitsfrage",
    "Salaire ou autre question de travail",
    "Salario o un’altra questione di lavoro",
    "Salari u in’autra dumonda da lavur"
  ],
  "Another family question": [
    "Eine andere Familienfrage",
    "Une autre question familiale",
    "Un’altra questione familiare",
    "In’autra dumonda da famiglia"
  ],
  "Sources are retrieved automatically. Only the legal terms or article references shown here go to OpenCaseLaw; your conversation stays in this tab.": [
    "Die Quellen werden automatisch abgerufen. Nur die hier angezeigten Rechtsbegriffe oder Artikelverweise werden an OpenCaseLaw gesendet. Ihr Gespräch bleibt in diesem Tab.",
    "Les sources sont consultées automatiquement. Seuls les termes juridiques ou les références d’articles affichés ici sont envoyés à OpenCaseLaw ; votre conversation reste dans cet onglet.",
    "Le fonti vengono recuperate automaticamente. Solo i termini giuridici o i riferimenti agli articoli mostrati qui vengono inviati a OpenCaseLaw; la conversazione resta in questa scheda.",
    "Las funtaunas vegnan consultadas automaticamain. Mo ils terms giuridics u ils renviaments ad artitgels mussads qua vegnan tramess ad OpenCaseLaw; Vossa conversaziun resta en quest tab."
  ],
  "Legal sources": [
    "Rechtsquellen",
    "Sources juridiques",
    "Fonti giuridiche",
    "Funtaunas giuridicas"
  ],
  "Selected topic": [
    "Gewähltes Thema",
    "Sujet choisi",
    "Argomento scelto",
    "Tema tschernì"
  ],
  "Opening this site and downloading a model uses the internet. The site host and download providers receive ordinary connection details, including your IP address. OpenCaseLaw receives public legal search terms and connection details. Your conversation is not sent to a cloud AI.": [
    "Das Öffnen dieser Website und das Herunterladen eines Modells nutzen das Internet. Der Website-Host und die Download-Anbieter erhalten gewöhnliche Verbindungsdaten, einschliesslich Ihrer IP-Adresse. OpenCaseLaw erhält öffentliche rechtliche Suchbegriffe und Verbindungsdaten. Ihr Gespräch wird nicht an eine Cloud-KI gesendet.",
    "L’ouverture de ce site et le téléchargement d’un modèle utilisent internet. L’hébergeur du site et les fournisseurs de téléchargement reçoivent les données de connexion habituelles, dont votre adresse IP. OpenCaseLaw reçoit des termes de recherche juridiques publics et des données de connexion. Votre conversation n’est pas envoyée à une IA dans le cloud.",
    "L’apertura di questo sito e il download di un modello utilizzano internet. Il servizio che ospita il sito e i fornitori dei download ricevono i normali dati di connessione, compreso il suo indirizzo IP. OpenCaseLaw riceve termini di ricerca giuridici pubblici e dati di connessione. La conversazione non viene inviata a un’IA nel cloud.",
    "Avrir questa website e telechargiar in model dovra l’internet. Il purschider che ospitescha la website ed ils purschiders dals downloads retschaivan las datas da connexiun usitadas, inclusiv Vossa adressa IP. OpenCaseLaw retschaiva terms publics da tschertga giuridica e datas da connexiun. Vossa conversaziun na vegn betg tramessa ad in’IA en il cloud."
  ]
};

const COLUMN: Record<Exclude<Language, 'en'>, number> = { de: 0, fr: 1, it: 2, rm: 3 };
export function practicalText(key: string, language: Language): string {
  if (language === 'en') return key;
  return COPY[key]?.[COLUMN[language]] ?? key;
}
