/** Prepared translations; independent legal and language review remains required, especially for Romansh. */
export type Language = 'de' | 'fr' | 'it' | 'rm' | 'en';
const COPY: Record<string, readonly [string, string, string, string]> = {
  "The rules behind this guide": [
    "Die Regeln hinter dieser Orientierung",
    "Les règles sur lesquelles repose ce guide",
    "Le regole alla base di questa guida",
    "Las reglas davos questa orientaziun"
  ],
  "For a wedding outside Switzerland, first ask the local authority where you want to marry which procedure and documents it requires. The Swiss preparation procedure below does not automatically apply abroad.": [
    "Wenn Sie ausserhalb der Schweiz heiraten möchten, fragen Sie zuerst die dort zuständige Behörde nach dem Verfahren und den nötigen Dokumenten. Das unten beschriebene Schweizer Vorbereitungsverfahren gilt im Ausland nicht automatisch.",
    "Pour un mariage hors de Suisse, demandez d’abord à l’autorité locale du lieu choisi quelle procédure suivre et quels documents fournir. La procédure préparatoire suisse décrite ci-dessous ne s’applique pas automatiquement à l’étranger.",
    "Per sposarsi fuori dalla Svizzera, chieda prima all’autorità locale del luogo scelto quale procedura seguire e quali documenti servono. La procedura preparatoria svizzera descritta sotto non si applica automaticamente all’estero.",
    "Per maridar ordaifer la Svizra, dumandai l’emprim l’autoritad locala dal lieu tschernì tge procedura e documents ch’ella pretenda. La procedura preparatorica svizra descritta qua sut na vala betg automaticamain a l’exteriur."
  ],
  "Ask that authority for its document list. Before ordering translations or certificates, confirm the required form and validity.": [
    "Bitten Sie diese Behörde um eine Dokumentenliste. Klären Sie Form und Gültigkeitsdauer, bevor Sie Übersetzungen oder Bescheinigungen bestellen.",
    "Demandez à cette autorité la liste des documents. Avant de commander des traductions ou des attestations, faites confirmer la forme requise et la durée de validité.",
    "Chieda a quell’autorità l’elenco dei documenti. Prima di ordinare traduzioni o certificati, si faccia confermare la forma richiesta e la durata di validità.",
    "Dumandai quella autoritad ina glista dals documents. Avant che empustar translaziuns u attestats, laschai confermar la furma pretendida e la durada da valaivladad."
  ],
  "If you need the marriage entered in the Swiss civil-status register, ask the Swiss representation responsible for that country about recognition and registration.": [
    "Wenn die Ehe im Schweizer Personenstandsregister eingetragen werden soll, fragen Sie die für das Land zuständige Schweizer Vertretung nach Anerkennung und Eintragung.",
    "Si le mariage doit être inscrit au registre suisse de l’état civil, renseignez-vous auprès de la représentation suisse compétente pour ce pays sur la reconnaissance et l’inscription.",
    "Se il matrimonio deve essere iscritto nel registro svizzero dello stato civile, chieda alla rappresentanza svizzera competente per quel Paese informazioni sul riconoscimento e sulla registrazione.",
    "Sche la lètg duai vegnir inscritta en il register svizzer dal stadi civil, dumandai la represchentanza svizra cumpetenta per quel pajais davart la renconuschientscha e l’inscripziun."
  ],
  "The country of the wedding, your nationalities and any connection to the Swiss civil-status register matter. You do not need to enter names here.": [
    "Wichtig sind das Land der Heirat, Ihre Staatsangehörigkeiten und ein allfälliger Bezug zum Schweizer Personenstandsregister. Namen müssen Sie hier nicht angeben.",
    "Le pays du mariage, vos nationalités et tout lien avec le registre suisse de l’état civil sont importants. Vous n’avez pas besoin de saisir des noms ici.",
    "Contano il Paese del matrimonio, le vostre cittadinanze e l’eventuale legame con il registro svizzero dello stato civile. Qui non occorre inserire nomi.",
    "Il pajais dal matrimoni, Vossas naziunalitads ed in eventual connex cun il register svizzer dal stadi civil èn impurtants. Qua na stuais Vus inditgar nagins nums."
  ],
  "Because both of you live abroad, contact the Swiss civil registry office where you want the ceremony to take place.": [
    "Da Sie beide im Ausland wohnen, wenden Sie sich an das Schweizer Zivilstandsamt des gewünschten Trauungsorts.",
    "Puisque vous habitez tous deux à l’étranger, contactez l’office suisse de l’état civil du lieu où vous souhaitez célébrer le mariage.",
    "Poiché vivete entrambi all’estero, contatti l’ufficio svizzero dello stato civile del luogo in cui desiderate celebrare il matrimonio.",
    "Perquai che Vus abitais tuts dus a l’exteriur, contactai l’uffizi svizzer dal stadi civil dal lieu nua che Vus vulais celebrar il matrimoni."
  ],
  "Contact the civil registry office at the Swiss place of residence of either partner.": [
    "Wenden Sie sich an das Zivilstandsamt am Schweizer Wohnort einer der beiden Personen.",
    "Contactez l’office de l’état civil du domicile suisse de l’un des partenaires.",
    "Contatti l’ufficio dello stato civile del domicilio svizzero di uno dei partner.",
    "Contactai l’uffizi dal stadi civil al domicil svizzer dad ina da las duas persunas."
  ],
  "If either of you lives in Switzerland, contact the civil registry office at that place of residence. If both live abroad, contact the Swiss office where you want the ceremony.": [
    "Wenn eine der beiden Personen in der Schweiz wohnt, wenden Sie sich an das Zivilstandsamt dieses Wohnorts. Wohnen Sie beide im Ausland, kontaktieren Sie das Schweizer Amt am gewünschten Trauungsort.",
    "Si l’un de vous habite en Suisse, contactez l’office de l’état civil de ce domicile. Si vous habitez tous deux à l’étranger, contactez l’office suisse du lieu souhaité pour la cérémonie.",
    "Se uno di voi vive in Svizzera, contatti l’ufficio dello stato civile di quel domicilio. Se vivete entrambi all’estero, contatti l’ufficio svizzero del luogo scelto per la cerimonia.",
    "Sche ina da las duas persunas viva en Svizra, contactai l’uffizi dal stadi civil da quel domicil. Sche tuts dus vivan a l’exteriur, contactai l’uffizi svizzer dal lieu tschernì per la ceremonia."
  ],
  "Ask the office which documents it needs for both of you and arrange the preparation appointment. Normally you both attend in person; an exception is possible where personal attendance is manifestly unreasonable. Have the office confirm requirements for foreign documents before ordering them.": [
    "Fragen Sie das Amt, welche Dokumente es von Ihnen beiden braucht, und vereinbaren Sie den Vorbereitungstermin. Normalerweise erscheinen Sie beide persönlich. Eine Ausnahme ist möglich, wenn das persönliche Erscheinen offensichtlich unzumutbar ist. Lassen Sie die Anforderungen an ausländische Dokumente bestätigen, bevor Sie diese bestellen.",
    "Demandez à l’office les documents nécessaires pour chacun de vous et fixez le rendez-vous préparatoire. En principe, vous devez vous présenter tous deux en personne. Une exception est possible si votre comparution personnelle ne peut manifestement pas être exigée. Faites confirmer les exigences relatives aux documents étrangers avant de les commander.",
    "Chieda all’ufficio quali documenti servono per entrambi e fissi l’appuntamento preparatorio. Di regola dovete presentarvi entrambi di persona. È possibile un’eccezione se la presenza personale non può manifestamente essere pretesa. Si faccia confermare i requisiti per i documenti esteri prima di ordinarli.",
    "Dumandai l’uffizi tge documents ch’el dovra da Vus tuts dus e fixai il termin preparatoric. Normalmain stuais Vus tuts dus cumparair persunalmain. In’excepziun è pussaivla sche la preschientscha persunala na po evidentamain betg vegnir pretendida. Laschai confermar las pretensiuns per documents esters avant che als empustar."
  ],
  "In Switzerland, the civil ceremony follows the preparation procedure. This guide does not establish whether either person meets all marriage conditions or has a right of residence.": [
    "In der Schweiz folgt die zivile Trauung auf das Vorbereitungsverfahren. Diese Orientierung klärt nicht, ob Sie beide alle Ehevoraussetzungen erfüllen oder ein Aufenthaltsrecht haben.",
    "En Suisse, la cérémonie civile a lieu après la procédure préparatoire. Ce guide ne permet pas d’établir si chacun de vous remplit toutes les conditions du mariage ou dispose d’un droit de séjour.",
    "In Svizzera la cerimonia civile segue la procedura preparatoria. Questa guida non accerta se entrambi soddisfate tutte le condizioni per il matrimonio o avete un diritto di soggiorno.",
    "En Svizra suonda la ceremonia civila a la procedura preparatorica. Questa orientaziun na constatescha betg sche mintgina da las duas persunas ademplescha tut las premissas per il matrimoni u ha in dretg da dimora."
  ],
  "Non-Swiss partners must provide evidence of lawful stay during the preparation procedure. If residence status is uncertain, obtain individual advice; this guide cannot resolve immigration questions.": [
    "Personen ohne Schweizer Staatsangehörigkeit müssen ihren rechtmässigen Aufenthalt während des Vorbereitungsverfahrens nachweisen. Ist der Aufenthaltsstatus unklar, lassen Sie sich individuell beraten. Fragen zum Ausländerrecht kann diese Orientierung nicht klären.",
    "Les partenaires sans nationalité suisse doivent prouver la légalité de leur séjour pendant la procédure préparatoire. Si le statut de séjour est incertain, demandez un conseil individuel : ce guide ne peut pas résoudre les questions de droit des étrangers.",
    "I partner senza cittadinanza svizzera devono dimostrare la legalità del soggiorno durante la procedura preparatoria. Se lo status di soggiorno è incerto, chieda una consulenza individuale: questa guida non può risolvere le questioni di diritto degli stranieri.",
    "Persunas senza naziunalitad svizra ston cumprovar lur dimora legala durant la procedura preparatorica. Sche il status da dimora è intschert, tschertgai cussegl individual. Questa orientaziun na po betg sclerir dumondas dal dretg da persunas estras."
  ],
  "For the exact document list, the office needs your nationalities, residence and civil status, including any previous marriage. Share those documents with the office, not with this tool.": [
    "Für die genaue Dokumentenliste braucht das Amt Ihre Staatsangehörigkeiten, Ihren Wohnsitz und Ihren Zivilstand, einschliesslich einer früheren Ehe. Reichen Sie diese Unterlagen beim Amt ein, nicht bei diesem Tool.",
    "Pour établir la liste exacte des documents, l’office doit connaître vos nationalités, votre domicile et votre état civil, y compris un éventuel mariage antérieur. Transmettez ces documents à l’office, pas à cet outil.",
    "Per l’elenco esatto dei documenti, l’ufficio deve conoscere le vostre cittadinanze, il domicilio e lo stato civile, compreso un eventuale matrimonio precedente. Trasmettete questi documenti all’ufficio, non a questo strumento.",
    "Per la glista exacta dals documents dovra l’uffizi Vossas naziunalitads, Voss domicil e Voss stadi civil, inclusiv in eventual matrimoni anteriur. Dai quels documents a l’uffizi, betg a quest instrument."
  ],
  "Employee overtime rules do not by themselves give a self-employed person a right to extra pay or time off. Start by checking your client agreements and workload.": [
    "Die Überstundenregeln für Angestellte geben Selbständigen für sich allein keinen Anspruch auf zusätzliche Bezahlung oder Freizeit. Prüfen Sie zuerst Ihre Vereinbarungen mit den Kunden und den Arbeitsumfang.",
    "Les règles sur les heures supplémentaires des salariés ne donnent pas, à elles seules, à une personne indépendante un droit à un paiement supplémentaire ou à du temps libre. Commencez par vérifier vos accords avec les clients et votre charge de travail.",
    "Le regole sulle ore supplementari dei dipendenti non danno, da sole, a chi lavora in proprio un diritto a un pagamento aggiuntivo o a tempo libero. Inizi verificando gli accordi con i clienti e il carico di lavoro.",
    "Las reglas davart uras supplementaras d’emploiads na dattan betg da sasezzas ad ina persuna independenta in dretg a pajament supplementar u temp liber. Examinai l’emprim Vossas cunvegnas cun ils clients e la chargia da lavur."
  ],
  "As an employer, first establish the hours worked and the employment rules that apply. Do not assume that extra work is unlimited or already covered by salary.": [
    "Klären Sie als Arbeitgeberin oder Arbeitgeber zuerst die geleisteten Stunden und die geltenden Arbeitsregeln. Gehen Sie nicht davon aus, dass Mehrarbeit unbegrenzt möglich oder bereits im Lohn enthalten ist.",
    "En tant qu’employeur, établissez d’abord les heures travaillées et les règles applicables à l’emploi. Ne supposez pas que le travail supplémentaire est illimité ou déjà compris dans le salaire.",
    "Come datore di lavoro, accerti prima le ore lavorate e le regole applicabili al rapporto di lavoro. Non presuma che il lavoro in più sia illimitato o già compreso nel salario.",
    "Sco patrun, scleriai l’emprim las uras lavuradas e las reglas da lavur applicablas. Na supponi betg che lavur supplementara saja illimitada u gia cumpigliada en il salari."
  ],
  "For public-law employment, start with the personnel regulations that apply to your job. Federal personnel law does not automatically apply to a cantonal, municipal or other public employer.": [
    "Bei einer öffentlich-rechtlichen Anstellung prüfen Sie zuerst die Personalvorschriften für Ihre Stelle. Das Bundespersonalrecht gilt nicht automatisch für einen kantonalen, kommunalen oder anderen öffentlichen Arbeitgeber.",
    "Pour un emploi de droit public, commencez par les règles du personnel applicables à votre poste. Le droit du personnel fédéral ne s’applique pas automatiquement à un employeur cantonal, communal ou à un autre employeur public.",
    "Per un impiego di diritto pubblico, inizi dalle norme sul personale applicabili al suo posto. Il diritto del personale federale non si applica automaticamente a un datore di lavoro cantonale, comunale o a un altro datore pubblico.",
    "Tar in engaschament da dretg public, examinai l’emprim las prescripziuns dal persunal che valan per Vossa plazza. Il dretg federal dal persunal na vala betg automaticamain per in patrun chantunal, communal u in auter patrun public."
  ],
  "Start by making a clear record of the extra hours and asking for a plan to reduce the balance. Time off and payment depend on the kind of extra hours and the rules that apply to your employment.": [
    "Halten Sie zuerst die zusätzlichen Stunden übersichtlich fest und bitten Sie um einen Plan zum Abbau des Saldos. Freizeit und Bezahlung hängen davon ab, um welche zusätzlichen Stunden es geht und welche Regeln für Ihr Arbeitsverhältnis gelten.",
    "Commencez par établir un relevé clair des heures en plus et demandez un plan pour réduire le solde. Le temps libre et le paiement dépendent du type d’heures et des règles applicables à votre emploi.",
    "Inizi con un conteggio chiaro delle ore in più e chieda un piano per ridurre il saldo. Il tempo libero e il pagamento dipendono dal tipo di ore e dalle regole applicabili al suo rapporto di lavoro.",
    "Faschai l’emprim ina survista clera da las uras supplementaras e dumandai in plan per reducir il saldo. Temp liber e pajament dependan dal tip d’uras supplementaras e da las reglas che valan per Vossa relaziun da lavur."
  ],
  "Compare the work agreed with the work requested. Ask the client to agree the scope, timing and any additional fee in writing.": [
    "Vergleichen Sie den vereinbarten Auftrag mit der verlangten Arbeit. Bitten Sie den Kunden, Umfang, Zeitplan und eine allfällige zusätzliche Vergütung schriftlich zu vereinbaren.",
    "Comparez le travail convenu avec le travail demandé. Proposez au client de convenir par écrit de l’étendue du travail, du calendrier et d’une éventuelle rémunération supplémentaire.",
    "Confronti il lavoro concordato con quello richiesto. Chieda al cliente di concordare per iscritto l’entità del lavoro, i tempi e l’eventuale compenso aggiuntivo.",
    "Cumparegliai la lavur cunvegnida cun la lavur pretendida. Dumandai il client da fixar en scrit il volumen, ils termins ed ina eventuala indemnisaziun supplementara."
  ],
  "Gather your time records: hours worked, breaks, contractual weekly hours, and who requested or knew about the extra work. Keep a copy of the contract and any collective agreement.": [
    "Sammeln Sie Ihre Zeitaufzeichnungen: Arbeitsstunden, Pausen, vertragliche Wochenstunden und Angaben dazu, wer die Mehrarbeit verlangt hat oder davon wusste. Bewahren Sie den Vertrag und einen allfälligen Gesamtarbeitsvertrag auf.",
    "Rassemblez vos relevés : heures travaillées, pauses, durée hebdomadaire prévue au contrat et personne ayant demandé le travail en plus ou en ayant connaissance. Gardez une copie du contrat et de toute convention collective applicable.",
    "Raccolga i conteggi: ore lavorate, pause, ore settimanali contrattuali e chi ha richiesto il lavoro in più o ne era a conoscenza. Conservi una copia del contratto e dell’eventuale contratto collettivo.",
    "Rimnai Vossas registraziuns dal temp: uras lavuradas, pausas, uras emnilas tenor contract e tgi che ha pretendì la lavur supplementara u saveva da quella. Conservai ina copia dal contract e d’in eventual contract collectiv."
  ],
  "Discuss workload and a written reduction or compensation plan with the employee. Check the applicable contract and personnel rules first.": [
    "Besprechen Sie mit der angestellten Person die Arbeitslast und einen schriftlichen Plan für Abbau oder Entschädigung. Prüfen Sie zuerst den geltenden Vertrag und die Personalvorschriften.",
    "Discutez avec le salarié de la charge de travail et d’un plan écrit de réduction ou de compensation. Vérifiez d’abord le contrat et les règles du personnel applicables.",
    "Discuta con il dipendente il carico di lavoro e un piano scritto di riduzione o compensazione. Verifichi prima il contratto e le norme sul personale applicabili.",
    "Discutai cun la persuna emploiada la chargia da lavur ed in plan en scrit per reducir u cumpensar las uras. Examinai l’emprim il contract e las reglas dal persunal applicablas."
  ],
  "Propose dates for taking time off and ask for agreement. Do not decide unilaterally that you can stay away from work.": [
    "Schlagen Sie Termine für den Freizeitausgleich vor und bitten Sie um Zustimmung. Bleiben Sie nicht eigenmächtig der Arbeit fern.",
    "Proposez des dates pour prendre du temps libre et demandez un accord. Ne décidez pas unilatéralement de vous absenter du travail.",
    "Proponga date per il tempo libero compensativo e chieda un accordo. Non decida unilateralmente di assentarsi dal lavoro.",
    "Proponi datas per prender temp liber e dumandai il consentiment. Na decidai betg unilateralmain da restar davent da la lavur."
  ],
  "Tell your employer in writing that the balance is too high. Ask which tasks take priority and propose a concrete plan to reduce the workload or agree time off.": [
    "Teilen Sie Ihrem Arbeitgeber schriftlich mit, dass der Stundensaldo zu hoch ist. Fragen Sie, welche Aufgaben Vorrang haben, und schlagen Sie einen konkreten Plan für weniger Arbeit oder vereinbarten Freizeitausgleich vor.",
    "Indiquez par écrit à votre employeur que le solde est trop élevé. Demandez quelles tâches sont prioritaires et proposez un plan concret pour réduire la charge ou convenir de temps libre.",
    "Comunichi per iscritto al datore di lavoro che il saldo è troppo alto. Chieda quali compiti hanno la priorità e proponga un piano concreto per ridurre il carico o concordare tempo libero.",
    "Communitgai en scrit a Voss patrun ch’il saldo è memia aut. Dumandai tge incumbensas che han prioritad e proponi in plan concret per reducir la chargia u cunvegnir temp liber."
  ],
  "Ask HR which personnel law and working-time rules govern your job, including the provisions on approval, limits and compensation of extra hours.": [
    "Fragen Sie die Personalabteilung, welches Personalrecht und welche Arbeitszeitregeln für Ihre Stelle gelten. Dazu gehören die Regeln über Bewilligung, Grenzen und Ausgleich zusätzlicher Stunden.",
    "Demandez aux ressources humaines quel droit du personnel et quelles règles sur le temps de travail s’appliquent à votre poste, y compris les dispositions sur l’autorisation, les limites et la compensation des heures en plus.",
    "Chieda alle risorse umane quale diritto del personale e quali regole sull’orario di lavoro si applicano al suo posto, comprese quelle sull’autorizzazione, sui limiti e sulla compensazione delle ore in più.",
    "Dumandai la partiziun dal persunal tge dretg dal persunal e tge reglas dal temp da lavur che valan per Vossa plazza, inclusiv las disposiziuns davart l’approvaziun, ils cunfins e la cumpensaziun d’uras supplementaras."
  ],
  "Check whether your employment is governed by private or public law and whether the Labour Act’s working-time rules cover your role. These are separate questions.": [
    "Prüfen Sie, ob Ihr Arbeitsverhältnis dem privaten oder öffentlichen Recht untersteht. Klären Sie gesondert, ob die Arbeitszeitregeln des Arbeitsgesetzes für Ihre Tätigkeit gelten.",
    "Vérifiez si votre emploi relève du droit privé ou public et si les règles sur le temps de travail de la loi sur le travail s’appliquent à votre activité. Ce sont deux questions distinctes.",
    "Verifichi se il suo rapporto di lavoro è retto dal diritto privato o pubblico e se le regole sull’orario della legge sul lavoro si applicano alla sua attività. Sono due questioni distinte.",
    "Examinai sche Vossa relaziun da lavur è suttamessa al dretg privat u public e sche las reglas dal temp da lavur da la Lescha davart la lavur valan per Vossa activitad. Quai èn duas dumondas separadas."
  ],
  "Hours above your agreed or usual workload can be contractual overtime (Überstunden), including in part-time work. This does not automatically mean statutory excess hours (Überzeit).": [
    "Stunden über das vereinbarte oder übliche Pensum hinaus können Überstunden sein, auch bei Teilzeit. Sie sind deshalb nicht automatisch Überzeit im Sinn des Arbeitsgesetzes.",
    "Les heures au-delà de la durée convenue ou habituelle peuvent être des heures supplémentaires contractuelles (Überstunden), même à temps partiel. Il ne s’agit pas automatiquement de travail supplémentaire au sens de la loi (Überzeit).",
    "Le ore oltre il carico concordato o abituale possono essere ore supplementari contrattuali (Überstunden), anche a tempo parziale. Non si tratta automaticamente di ore oltre l’orario massimo legale (Überzeit).",
    "Uras sur il pensum cunvegnì u usità pon esser uras supplementaras tenor contract (Überstunden), er tar lavur a temp parzial. Quai n’èn betg automaticamain uras sur il temp maximal legal (Überzeit)."
  ],
  "If the Labour Act’s working-time rules apply, the usual weekly maximum is 45 or 50 hours depending on the category of work. Exceeding it is permitted only exceptionally. There are exclusions and special rules; your occupation and working-time arrangement need checking.": [
    "Wenn die Arbeitszeitregeln des Arbeitsgesetzes gelten, beträgt die wöchentliche Höchstarbeitszeit je nach Tätigkeit normalerweise 45 oder 50 Stunden. Sie darf nur ausnahmsweise überschritten werden. Es gibt Ausnahmen vom Geltungsbereich und besondere Regeln. Ihre Tätigkeit und Ihr Arbeitszeitmodell müssen geprüft werden.",
    "Si les règles sur le temps de travail de la loi sur le travail s’appliquent, le maximum hebdomadaire usuel est de 45 ou 50 heures selon la catégorie d’activité. Il ne peut être dépassé qu’à titre exceptionnel. Il existe des exclusions et des règles particulières : votre profession et l’organisation du temps de travail doivent être vérifiées.",
    "Se si applicano le regole sull’orario della legge sul lavoro, il massimo settimanale usuale è di 45 o 50 ore secondo la categoria di attività. Il superamento è ammesso solo eccezionalmente. Esistono esclusioni e regole speciali: occorre verificare la sua professione e l’organizzazione dell’orario.",
    "Sche las reglas dal temp da lavur da la Lescha davart la lavur valan, è il maximum emnil usità 45 u 50 uras, tenor la categoria da lavur. Surpassar quel è permess mo excepziunalmain. I dat exclusiuns e reglas spezialas; Vossa professiun e Voss model dal temp da lavur ston vegnir examinads."
  ],
  "Employment status depends on the actual working relationship, not only on the label in a contract. This employee guide cannot classify your status.": [
    "Ob Sie angestellt oder selbständig sind, hängt von den tatsächlichen Arbeitsverhältnissen ab, nicht nur von der Bezeichnung im Vertrag. Diese Orientierung für Angestellte kann Ihren Status nicht bestimmen.",
    "Le statut professionnel dépend de la relation de travail réelle, pas seulement de l’intitulé du contrat. Ce guide destiné aux salariés ne peut pas déterminer votre statut.",
    "Lo status lavorativo dipende dal rapporto effettivo, non solo dalla denominazione nel contratto. Questa guida per dipendenti non può determinare il suo status.",
    "Il status da lavur dependa da la relaziun effectiva, betg mo da la designaziun en il contract. Questa orientaziun per emploiads na po betg determinar Voss status."
  ],
  "The employer, legal basis of the appointment and applicable personnel rules must be established before calculating any entitlement.": [
    "Bevor sich ein Anspruch berechnen lässt, müssen der Arbeitgeber, die Rechtsgrundlage der Anstellung und die geltenden Personalvorschriften feststehen.",
    "Avant de calculer un éventuel droit, il faut établir qui est l’employeur, la base juridique de l’engagement et les règles du personnel applicables.",
    "Prima di calcolare un eventuale diritto, occorre accertare il datore di lavoro, la base giuridica dell’assunzione e le norme sul personale applicabili.",
    "Avant che calcular in eventual dretg, ston il patrun, la basa giuridica da l’engaschament e las reglas dal persunal applicablas esser sclerids."
  ],
  "The next useful facts are your contractual weekly hours, hours actually worked, occupation and applicable contract rules. An accumulated balance alone does not establish a payment claim or a statutory breach.": [
    "Als Nächstes helfen Ihre vertraglichen Wochenstunden, die tatsächlich geleisteten Stunden, Ihre Tätigkeit und die geltenden Vertragsregeln. Ein angesammelter Stundensaldo allein belegt weder einen Zahlungsanspruch noch einen Gesetzesverstoss.",
    "Les prochaines informations utiles sont la durée hebdomadaire prévue au contrat, les heures réellement travaillées, votre profession et les règles contractuelles applicables. Un solde accumulé ne suffit pas à établir une créance de paiement ou une violation de la loi.",
    "Le prossime informazioni utili sono le ore settimanali contrattuali, quelle effettivamente lavorate, la professione e le regole contrattuali applicabili. Un saldo accumulato, da solo, non dimostra un diritto al pagamento né una violazione della legge.",
    "Las proximas infurmaziuns utilas èn Vossas uras emnilas tenor contract, las uras effectivamain lavuradas, Vossa professiun e las reglas contractualas applicablas. In saldo accumulà sulet na cumprova ni in dretg da pajament ni ina violaziun da la lescha."
  ],
  "Ask for a written statement of the hours balance and the rule used to calculate compensation.": [
    "Bitten Sie um eine schriftliche Aufstellung des Stundensaldos und die Regel, nach der die Entschädigung berechnet wird.",
    "Demandez un décompte écrit du solde d’heures et la règle utilisée pour calculer la compensation.",
    "Chieda un conteggio scritto del saldo delle ore e la regola usata per calcolare la compensazione.",
    "Dumandai ina survista en scrit dal saldo d’uras e la regla duvrada per calcular la cumpensaziun."
  ],
  "If private employment law applies: necessary extra work is required only as far as you can do it and it is reasonable. Time off of at least equal length within a reasonable period requires agreement. Otherwise the default is normal pay plus at least 25%, unless a written agreement, collective agreement or standard employment contract provides otherwise.": [
    "Wenn privates Arbeitsrecht gilt: Notwendige Mehrarbeit ist nur geschuldet, soweit Sie sie leisten können und sie Ihnen zumutbar ist. Freizeitausgleich von mindestens gleicher Dauer innerhalb eines angemessenen Zeitraums setzt Einverständnis voraus. Sonst gilt grundsätzlich der normale Lohn mit mindestens 25% Zuschlag. Eine schriftliche Vereinbarung, ein Gesamtarbeitsvertrag oder ein Normalarbeitsvertrag kann etwas anderes vorsehen.",
    "Si le droit privé du travail s’applique : le travail en plus nécessaire n’est exigible que dans la mesure où vous pouvez l’effectuer et où il peut raisonnablement être exigé. Un congé d’une durée au moins égale dans un délai raisonnable nécessite un accord. Sinon, le salaire normal majoré d’au moins 25 % s’applique en principe, sauf disposition contraire d’un accord écrit, d’une convention collective ou d’un contrat-type de travail.",
    "Se si applica il diritto privato del lavoro: il lavoro in più necessario è dovuto solo nella misura in cui è in grado di svolgerlo ed è ragionevolmente esigibile. Il tempo libero di durata almeno equivalente entro un periodo ragionevole richiede un accordo. Altrimenti vale di regola il salario normale con un supplemento di almeno il 25%, salvo diversa disposizione di un accordo scritto, di un contratto collettivo o di un contratto normale di lavoro.",
    "Sch’il dretg privat da lavur vala: lavur supplementara necessaria è pretendida mo uschenavant che Vus la pudais prestar e ch’ella As po vegnir pretendida raschunaivlamain. Temp liber d’ina durada almain eguala entaifer in temp commensurà dovra in accord. Uschiglio vala da princip il salari normal cun in supplement d’almain 25%, nun ch’ina cunvegna en scrit, in contract collectiv u in contract normal da lavur prevesia insatge auter."
  ],
  "Where the Labour Act’s working-time rules apply, Article 13 normally requires a pay supplement of at least 25%. The supplement falls away if the employee agrees to equal time off within a reasonable period. For office staff, technical and other employees, including sales staff in large retail businesses, the statutory supplement applies only to excess hours beyond 60 in the calendar year. That does not by itself make the first 60 hours unpaid; contractual and private-law claims require separate checking.": [
    "Wenn die Arbeitszeitregeln des Arbeitsgesetzes gelten, sieht Artikel 13 grundsätzlich einen Lohnzuschlag von mindestens 25% vor. Der Zuschlag entfällt, wenn die angestellte Person mit gleich langem Freizeitausgleich innerhalb eines angemessenen Zeitraums einverstanden ist. Für Büropersonal sowie technische und andere Angestellte, einschliesslich Verkaufspersonal in Grossbetrieben des Detailhandels, gilt der gesetzliche Zuschlag erst für Überzeit über 60 Stunden im Kalenderjahr. Die ersten 60 Stunden sind deshalb nicht automatisch unbezahlt. Vertragliche und privatrechtliche Ansprüche müssen gesondert geprüft werden.",
    "Lorsque les règles sur le temps de travail de la loi sur le travail s’appliquent, l’article 13 prévoit en principe un supplément de salaire d’au moins 25 %. Ce supplément n’est pas dû si le salarié accepte un congé de même durée dans un délai raisonnable. Pour le personnel de bureau, les techniciens et les autres employés, y compris le personnel de vente des grandes entreprises de commerce de détail, le supplément légal ne s’applique qu’au travail supplémentaire dépassant 60 heures dans l’année civile. Cela ne rend pas automatiquement les 60 premières heures non rémunérées : les droits contractuels et de droit privé doivent être examinés séparément.",
    "Quando si applicano le regole sull’orario della legge sul lavoro, l’articolo 13 prevede di regola un supplemento salariale di almeno il 25%. Il supplemento viene meno se il dipendente acconsente a tempo libero di uguale durata entro un periodo ragionevole. Per il personale d’ufficio, i tecnici e gli altri impiegati, compreso il personale di vendita delle grandi aziende del commercio al dettaglio, il supplemento legale si applica solo alle ore oltre il massimo legale che superano le 60 nell’anno civile. Ciò non rende automaticamente non retribuite le prime 60 ore: i diritti contrattuali e di diritto privato vanno verificati separatamente.",
    "Sche las reglas dal temp da lavur da la Lescha davart la lavur valan, prevesa l’artitgel 13 da princip in supplement da salari d’almain 25%. Il supplement croda davent sche la persuna emploiada è d’accord cun temp liber da medema durada entaifer in temp commensurà. Per il persunal da biro, ils emploiads tecnics ed auters, inclusiv il persunal da vendita en grondas interpresas dal commerzi en detagl, vala il supplement legal mo per uras sur il temp maximal che surpassan 60 uras en l’onn chalendar. Quai na fa betg automaticamain che las emprimas 60 uras restan nunpajadas; ils dretgs contractuals e da dretg privat ston vegnir examinads separadamain."
  ],
  "If you want to marry in Switzerland, start with the civil registry office. Ask to open the marriage preparation procedure.": [
    "Wenn Sie in der Schweiz heiraten möchten, wenden Sie sich zuerst an das Zivilstandsamt. Bitten Sie darum, das Ehevorbereitungsverfahren zu eröffnen.",
    "Pour vous marier en Suisse, adressez-vous d’abord à l’office de l’état civil. Demandez l’ouverture de la procédure préparatoire du mariage.",
    "Per sposarsi in Svizzera, si rivolga prima all’ufficio dello stato civile. Chieda di avviare la procedura preparatoria del matrimonio.",
    "Sche Vus vulais maridar en Svizra, As drizzai l’emprim a l’uffizi dal stadi civil. Dumandai d’avrir la procedura preparatorica dal matrimoni."
  ],
  "Check whether the Labour Act’s working-time rules cover your role. Private employment law and statutory working-time protection are separate questions.": [
    "Prüfen Sie, ob die Arbeitszeitregeln des Arbeitsgesetzes für Ihre Tätigkeit gelten. Privates Arbeitsrecht und gesetzlicher Arbeitszeitschutz sind zwei getrennte Fragen.",
    "Vérifiez si les règles sur le temps de travail de la loi sur le travail s’appliquent à votre activité. Le droit privé du travail et la protection légale du temps de travail sont deux questions distinctes.",
    "Verifichi se le regole sull’orario della legge sul lavoro si applicano alla sua attività. Il diritto privato del lavoro e la tutela legale dell’orario sono due questioni distinte.",
    "Examinai sche las reglas dal temp da lavur da la Lescha davart la lavur valan per Vossa activitad. Il dretg privat da lavur e la protecziun legala dal temp da lavur èn duas dumondas separadas."
  ],
  "The office checks the documents and whether the marriage conditions are met. The civil ceremony must take place within three months after the office tells you the preparation procedure is complete. Agree the date with the office.": [
    "Das Amt prüft die Dokumente und die Ehevoraussetzungen. Die zivile Trauung muss innerhalb von drei Monaten stattfinden, nachdem das Amt Ihnen den Abschluss des Vorbereitungsverfahrens mitgeteilt hat. Vereinbaren Sie den Termin mit dem Amt.",
    "L’office vérifie les documents et les conditions du mariage. La cérémonie civile doit avoir lieu dans les trois mois suivant la communication par l’office de la clôture de la procédure préparatoire. Convenez de la date avec l’office.",
    "L’ufficio verifica i documenti e le condizioni per il matrimonio. La cerimonia civile deve svolgersi entro tre mesi dalla comunicazione dell’ufficio che la procedura preparatoria è conclusa. Concordate la data con l’ufficio.",
    "L’uffizi controllescha ils documents e las premissas per il matrimoni. La ceremonia civila sto avair lieu entaifer trais mais suenter che l’uffizi As ha communitgà che la procedura preparatorica è concludida. Fixai la data cun l’uffizi."
  ]
};

const COLUMN: Record<Exclude<Language, 'en'>, number> = { de: 0, fr: 1, it: 2, rm: 3 };
export function practicalContentText(key: string, language: Language): string {
  if (language === 'en') return key;
  return COPY[key]?.[COLUMN[language]] ?? key;
}
