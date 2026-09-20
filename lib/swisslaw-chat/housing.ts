import type { GuideParagraph, PracticalGuide } from './practical-content';

export const HOUSING_TOPICS = ['rent-increase', 'housing-defect', 'tenancy-end'] as const;
export type HousingTopic = typeof HOUSING_TOPICS[number];
export function isHousingTopic(value: string): value is HousingTopic { return (HOUSING_TOPICS as readonly string[]).includes(value); }
export type HousingFacts = {
  scope: 'home' | 'special' | 'unknown';
  situation: 'increase' | 'initial' | 'unknown';
  notified: 'yes' | 'no' | 'unknown';
  exit: 'own' | 'early' | 'received' | 'unknown';
};
export const EMPTY_HOUSING_FACTS: HousingFacts = { scope: 'unknown', situation: 'unknown', notified: 'unknown', exit: 'unknown' };
export function checkedHousingFacts(value: HousingFacts): HousingFacts {
  if (!value || Object.keys(value).length !== 4 || !['home','special','unknown'].includes(value.scope) || !['increase','initial','unknown'].includes(value.situation) || !['yes','no','unknown'].includes(value.notified) || !['own','early','received','unknown'].includes(value.exit)) throw new Error('INVALID_CONTEXT');
  return {...value};
}
export const HOUSING_TITLES: Record<HousingTopic, string> = { 'rent-increase': 'My rent has increased', 'housing-defect': 'Something is wrong with my home', 'tenancy-end': 'Ending a tenancy' };
export type HousingQuestion = { key: keyof HousingFacts; title: string; help?: string; options: readonly (readonly [string, string])[] };
const scope: HousingQuestion = {key:'scope',title:'What kind of tenancy is this?',help:'This path is for tenants of homes in Switzerland. Furnished rooms, holiday lets, subsidised housing and special rent arrangements need separate checking.',options:[['home','I rent a home in Switzerland, with ordinary rent'],['special','I am the landlord, or this is another kind of tenancy'],['unknown','I’m not sure']]};
export function housingQuestions(topic: HousingTopic): HousingQuestion[] {
  if (topic === 'rent-increase') return [{key:'situation',title:'Has the rent changed during your tenancy?',options:[['increase','Yes, my existing rent is going up'],['initial','No, this is the rent in a new tenancy'],['unknown','I’m not sure']]},scope];
  if (topic === 'housing-defect') return [scope,{key:'notified',title:'Does the landlord know about the problem?',options:[['yes','Yes, I have reported it'],['no','Not yet'],['unknown','I’m not sure']]}];
  return [{key:'exit',title:'Who wants to end the tenancy?',options:[['own','I want to give ordinary notice'],['early','I want to leave before the next possible end date'],['received','The landlord has given me notice'],['unknown','I’m not sure']]},scope];
}
const official = 'https://www.bwo.admin.ch/de/schlichtungsverfahren';
const para = (text: string, articles: string[] = []): GuideParagraph => ({text, ...(articles.length ? {refs: articles.map(a => `220:${a}`)} : {})});
export function housingGuide(topic: HousingTopic, input: HousingFacts): PracticalGuide {
  const f = checkedHousingFacts(input);
  const limited = f.scope !== 'home';
  const scopeCheck = f.scope === 'special'
    ? 'Business premises, furnished rooms, holiday lets, subsidised housing, agricultural leases, indexed or stepped rents and other special arrangements need a separate assessment. This overview does not determine the rules for them.'
    : 'Check the contract for a fixed term, indexed or stepped rent and other special arrangements. This overview concerns ordinary residential tenancies in Switzerland; it does not calculate a personal deadline.';
  if (f.scope === 'special') return {intro:'Your tenancy needs a separate assessment. The ordinary residential rules in this guide may not apply.',steps:[para('Keep the contract and any notice, including its envelope and delivery information. Contact the competent tenancy or housing authority promptly; short deadlines may apply.'),para('Explain whether the premises are a home or business, and whether the rent is officially controlled, indexed or increases in agreed steps. Ask which authority and procedure apply before relying on an ordinary tenancy rule.')],rules:[],check:scopeCheck,official};
  if (topic === 'rent-increase') {
    if (f.situation === 'initial') return {intro:'The starting rent in a new tenancy is a different issue from a later rent increase. This guide cannot establish whether you can challenge the starting rent.',steps:[para('Keep the contract, any official rent form and a record of when you took over the home. Contact the tenancy conciliation authority promptly: a short challenge period may apply.')],rules:[],check:scopeCheck,official};
    return {
      intro: limited || f.situation === 'unknown' ? 'First establish whether this is an increase to an existing residential rent. Keep the notice and obtain prompt advice from the tenancy conciliation authority if that is unclear.' : 'Keep the increase notice and check the challenge period first. You do not have to decide on your own whether the increase is lawful.',
      steps:[
        para('For an increase to an existing rent covered by these rules, you must initiate conciliation proceedings to challenge it within 30 days after legal receipt of the notice. Do not wait until the higher rent starts. Asking the landlord to reconsider does not preserve that period.',['270b']),
        para('Keep the notice, envelope, delivery information and contract. Legal receipt can differ from the day you read or collect a letter. Have uncertain dates checked promptly; this tool does not calculate them.'),
        para('For an ordinary rent increase, check the cantonal official form, stated reasons and timing. It can take effect no earlier than the next permissible termination date; the notice must arrive at least ten days before the start of the notice period. Formal defects can affect validity; do not assume this lets you ignore the notice.',['269d']),
        para('Contact the tenancy conciliation authority for the place where the home is located. Ask how to submit a challenge in time. Prepare the notice, current contract and earlier rent changes; do not rely on an ordinary email as a valid filing.'),
      ],
      rules:[para('A proper form does not by itself make the amount lawful. The permitted increase depends on its reasons and the relevant tenancy facts. This guide does not calculate a lawful rent or predict the outcome.',['269d','270b'])],check:scopeCheck,official
    };
  }
  if (topic === 'housing-defect') return {
    intro: limited ? 'First check which tenancy rules apply. For an ordinary rented home, start by documenting the problem and notifying the landlord.' : f.notified === 'no' ? 'Report the problem to the landlord in writing and keep evidence. A clear description and a repair request are the useful first steps.' : f.notified === 'unknown' ? 'Keep evidence of the problem. If you are unsure whether the landlord knows about it, report it in writing and request repair.' : 'Keep evidence of the problem and of when the landlord was informed. Follow up in writing with a clear request for repair.',
    steps:[
      para('If there is an immediate danger to health or safety, protect yourself and contact the appropriate emergency or repair service. Do not wait for this guide.'),
      para('Record what is wrong, which rooms or facilities are affected and since when. Keep photographs and messages. Tell the landlord or property manager in writing, request repair and keep proof of delivery.'),
      para('For defects you did not cause and do not have to remedy yourself, the law can provide rights to repair and other remedies. Minor maintenance, responsibility for the damage and the seriousness of the problem matter. Do not assume every inconvenience creates the same rights.',['259a','259b']),
      para('If use of the home is impaired, a proportionate rent reduction may be due from when the landlord knew of the defect until it is remedied. This is not an automatic fixed percentage. Keep paying as agreed unless a reduction or lawful procedure has been established.',['259d']),
      para('If repair is not arranged, ask the tenancy conciliation authority about the next step. Do not simply stop paying rent or send it to an account of your choice. Formal rent deposit requires advance written steps and the officially designated deposit office.',['259g']),
    ],
    rules:[para('For formal rent deposit, set a reasonable written repair deadline and warn that you will deposit future rent if it expires without repair. If the defect remains after that deadline, notify the landlord in writing of the deposit and follow the designated authority’s procedure. Claims must be brought before the conciliation authority within 30 days after the first deposited rent becomes due. Have the procedure checked before using it.',['259g','259h']),para('Serious defects can raise further rights, including termination in specified circumstances. This guide does not establish that immediate departure or ordering repairs at the landlord’s expense is justified.',['259b'])],check:scopeCheck,official
  };
  if (f.exit === 'received') return {
    intro:'Act promptly on a notice from the landlord. Check both a challenge to the notice and whether an extension of the tenancy is possible.',
    steps:[para('For residential tenancies covered by these rules, a challenge to termination and a request to extend an indefinite tenancy generally have a 30-day period after legal receipt of the notice. Contact the tenancy conciliation authority promptly. A conversation with the landlord does not preserve the period.',['273']),para('Keep the notice, envelope, delivery information and contract. Legal receipt may be earlier than the day you collected or read the letter. Do not wait for a reply from the landlord before checking the deadline.'),para('Check whether the landlord used the cantonal official form. For a family home, separate service on the tenant and their spouse or registered partner may be required. Defective form can make notice void, but have this checked rather than ignoring it.',['266l','266n','266o']),para('Ask the conciliation authority at the location of the home how to make a valid submission. An extension is not automatic and is excluded in some situations. This tool does not decide whether the notice is valid or whether you qualify for an extension.')],rules:[],check:scopeCheck,official
  };
  if (f.exit === 'early') return {
    intro:'Moving out early does not by itself end the duty to pay rent. Check whether the landlord agrees to an earlier end or whether the replacement-tenant rule applies.',
    steps:[para('Check the contract and ask the landlord to confirm any agreed early release in writing.'),para('To be released under the replacement-tenant rule, propose a solvent replacement who is reasonable for the landlord to accept and willing to take over on the same terms. One qualifying replacement can be enough; a name alone does not establish that the conditions are met.',['264']),para('Give the landlord the necessary information and a reasonable opportunity to assess the proposed replacement. Keep evidence of the proposal and the candidate’s willingness. Arrange and document the return of the premises. Proposing a replacement alone does not release you while you retain possession; handing back the keys alone does not establish release either.'),para('If there is no qualifying replacement or agreed release, rent can remain due until the contractual or legal end date, subject to the deductions required by law. Have a disputed release or calculation checked.',['264'])],rules:[],check:scopeCheck,official
  };
  if (f.exit === 'unknown') return {intro:'The next step depends on who is ending the tenancy. A notice from the landlord may need a quick response.',steps:[para('If you received notice from the landlord, check it promptly with the tenancy conciliation authority. A 30-day period after legal receipt can apply to a challenge or an extension request.',['273']),para('If you want to leave yourself, check whether you can give ordinary notice or need an earlier release. Select the matching option above; this tool will not assume one for you.')],rules:[],check:scopeCheck,official};
  return {
    intro:limited ? 'Check first whether the ordinary residential notice rules apply to your contract. Do not choose an end date from a general rule alone.' : 'Check your contract before choosing an end date. Notice must reach the landlord in time; posting it on the last day may be too late.',
    steps:[para('Check whether the contract has a fixed end date, a minimum duration or agreed notice dates. For an ordinary indefinite residential tenancy, the statutory default is three months to a locally customary date or, if none exists, the end of a three-month rental period. A longer agreed period and agreed termination dates can matter.',['266a','266c']),para('Give notice in writing. For a family home, the tenant needs the express consent of their spouse; the same rule applies to registered partners. If several people are tenants, check who must sign.',['266l','266m']),para('Send the signed notice early enough for receipt before the notice deadline and keep delivery evidence. Ask for written confirmation of the end date. Do not rely on a normal email or a chat message.'),para('If you want to leave sooner, use the early-departure path to check agreement or a replacement tenant instead.',['264'])],rules:[],check:scopeCheck,official
  };
}
