import { checkedPracticalFacts, type PracticalFacts, type PracticalTopic } from './practical';
export type GuideParagraph = { text: string; refs?: string[] };
export type PracticalGuide = { intro: string; steps: GuideParagraph[]; rules: GuideParagraph[]; check: string; official: string };
export function practicalGuide(topic: PracticalTopic, input: PracticalFacts): PracticalGuide {
  const f = checkedPracticalFacts(input);
  if (topic === 'marriage') {
    if (f.location === 'abroad') return {
      intro: 'For a wedding outside Switzerland, first ask the local authority where you want to marry which procedure and documents it requires. The Swiss preparation procedure below does not automatically apply abroad.',
      steps: [{text:'Ask that authority for its document list. Before ordering translations or certificates, confirm the required form and validity.'}, {text:'If you need the marriage entered in the Swiss civil-status register, ask the Swiss representation responsible for that country about recognition and registration.'}],
      rules: [], check: 'The country of the wedding, your nationalities and any connection to the Swiss civil-status register matter. You do not need to enter names here.', official:'https://www.bj.admin.ch/de/faq-eheschliessung-ehe-fuer-alle'
    };
    return {
      intro: 'If you want to marry in Switzerland, start with the civil registry office. Ask to open the marriage preparation procedure.',
      steps: [
        {text: f.residence === 'no' ? 'Because both of you live abroad, contact the Swiss civil registry office where you want the ceremony to take place.' : f.residence === 'yes' ? 'Contact the civil registry office at the Swiss place of residence of either partner.' : 'If either of you lives in Switzerland, contact the civil registry office at that place of residence. If both live abroad, contact the Swiss office where you want the ceremony.', refs:['210:98','211.112.2:62']},
        {text:'Ask the office which documents it needs for both of you and arrange the preparation appointment. Normally you both attend in person; an exception is possible where personal attendance is manifestly unreasonable. Have the office confirm requirements for foreign documents before ordering them.',refs:['210:98']},
        {text:'The office checks the documents and whether the marriage conditions are met. The civil ceremony must take place within three months after the office tells you the preparation procedure is complete. Agree the date with the office.',refs:['210:99','210:100']},
      ],
      rules: [{text:'In Switzerland, the civil ceremony follows the preparation procedure. This guide does not establish whether either person meets all marriage conditions or has a right of residence.',refs:['210:97','210:99']}, {text:'Non-Swiss partners must provide evidence of lawful stay during the preparation procedure. If residence status is uncertain, obtain individual advice; this guide cannot resolve immigration questions.',refs:['210:98']}],
      check:'For the exact document list, the office needs your nationalities, residence and civil status, including any previous marriage. Share those documents with the office, not with this tool.',
      official:'https://www.bj.admin.ch/de/faq-eheschliessung-ehe-fuer-alle'
    };
  }
  const special = f.role === 'self' || f.role === 'employer' || f.regime === 'public';
  return {
    intro: f.role === 'self' ? 'Employee overtime rules do not by themselves give a self-employed person a right to extra pay or time off. Start by checking your client agreements and workload.' : f.role === 'employer' ? 'As an employer, first establish the hours worked and the employment rules that apply. Do not assume that extra work is unlimited or already covered by salary.' : f.regime === 'public' ? 'For public-law employment, start with the personnel regulations that apply to your job. Federal personnel law does not automatically apply to a cantonal, municipal or other public employer.' : 'Start by making a clear record of the extra hours and asking for a plan to reduce the balance. Time off and payment depend on the kind of extra hours and the rules that apply to your employment.',
    steps: f.role === 'self' ? [{text:'Compare the work agreed with the work requested. Ask the client to agree the scope, timing and any additional fee in writing.'}] : [
      {text:'Gather your time records: hours worked, breaks, contractual weekly hours, and who requested or knew about the extra work. Keep a copy of the contract and any collective agreement.'},
      {text: f.role === 'employer' ? 'Discuss workload and a written reduction or compensation plan with the employee. Check the applicable contract and personnel rules first.' : f.goal === 'pay' ? 'Ask for a written statement of the hours balance and the rule used to calculate compensation.' : f.goal === 'time' ? 'Propose dates for taking time off and ask for agreement. Do not decide unilaterally that you can stay away from work.' : 'Tell your employer in writing that the balance is too high. Ask which tasks take priority and propose a concrete plan to reduce the workload or agree time off.'},
      {text:f.regime === 'public' ? 'Ask HR which personnel law and working-time rules govern your job, including the provisions on approval, limits and compensation of extra hours.' : f.regime === 'private' ? 'Check whether the Labour Act’s working-time rules cover your role. Private employment law and statutory working-time protection are separate questions.' : 'Check whether your employment is governed by private or public law and whether the Labour Act’s working-time rules cover your role. These are separate questions.'},
    ],
    rules: special ? [] : [
      {text:'Hours above your agreed or usual workload can be contractual overtime (Überstunden), including in part-time work. This does not automatically mean statutory excess hours (Überzeit).',refs:['220:321c','822.11:9']},
      {text:'If private employment law applies: necessary extra work is required only as far as you can do it and it is reasonable. Time off of at least equal length within a reasonable period requires agreement. Otherwise the default is normal pay plus at least 25%, unless a written agreement, collective agreement or standard employment contract provides otherwise.',refs:['220:321c']},
      {text:'If the Labour Act’s working-time rules apply, the usual weekly maximum is 45 or 50 hours depending on the category of work. Exceeding it is permitted only exceptionally. There are exclusions and special rules; your occupation and working-time arrangement need checking.',refs:['822.11:9','822.11:12']},
      {text:'Where the Labour Act’s working-time rules apply, Article 13 normally requires a pay supplement of at least 25%. The supplement falls away if the employee agrees to equal time off within a reasonable period. For office staff, technical and other employees, including sales staff in large retail businesses, the statutory supplement applies only to excess hours beyond 60 in the calendar year. That does not by itself make the first 60 hours unpaid; contractual and private-law claims require separate checking.',refs:['822.11:13','220:321c']},
    ],
    check: f.role === 'self' ? 'Employment status depends on the actual working relationship, not only on the label in a contract. This employee guide cannot classify your status.' : f.regime === 'public' ? 'The employer, legal basis of the appointment and applicable personnel rules must be established before calculating any entitlement.' : 'The next useful facts are your contractual weekly hours, hours actually worked, occupation and applicable contract rules. An accumulated balance alone does not establish a payment claim or a statutory breach.',
    official:'https://www.seco.admin.ch/de/faq-ueberstunden'
  };
}
