# Swisslaw advice directory

Source review: 2026-10-25. This is a maintained editorial directory, not an assessment of individual lawyers, a referral contract or an exhaustive register.

The canonical dataset is `lib/swisslaw-chat/referrals-data.json`. It contains 82 records: regional first consultations, specialist support, official/provider directories neutral mediation and one explicitly requested external AI tool. All 26 cantons have a regional entry, while national directories extend local reach. This does not establish that every subject has direct advice in every canton. Canton matches are routing hints, not a determination of legal jurisdiction or eligibility.

## Inclusion and triage

Use primary provider, professional-body or government pages. Record remit, geographic reach, eligibility, initial cost and additional charges; never infer consultation languages from website translations. Do not describe an organisation as independent or qualified beyond what its source establishes. Political, membership, district and age restrictions must not disappear in summaries.

- `advice`: advice within the described remit; may include social or psychosocial support, not necessarily lawyer representation.
- `authority`: neutral official or procedural information, not representation.
- `mediation`: neutral dispute resolution, not personal legal counsel.
- `directory`: a route to services; the list owner is not necessarily an advice provider.
- `ai`: an external automated tool, clearly separated from personal advice. BeoBot is linked without an embedded widget, promo parameters or automatic question transfer. Provider processing, access restrictions and privacy terms are made explicit; this is not an evaluation of answer quality. Its limited legal-question quota does not qualify as free initial personal advice.

Within the selected topic, show regional entries before national entries, then alphabetically. Keep general initial guidance separately labelled. Services restricted to particular personal circumstances appear in a separate expandable group; no sensitive personal information is collected to choose that group.

The free-initial-advice filter includes `cost=free` or explicitly verified `freeInitial=true`. The latter permits a free initial conversation followed by chargeable work, but never assumes membership is free. Cost text and eligibility remain visible. Choosing general guidance preserves the cost and canton filters. Only an explicitly labelled action broadens the cost filter.

## Browser and source boundaries

The directory uses static public JSON and local deterministic filters. No model, classifier, geolocation, form submission, account or provider API is needed. The surrounding public portal has existing Cloudflare Analytics; the directory adds no analytics events and does not write filter changes to URLs or storage. The directory stores no filter preferences, narrative or conversation. Shared routes contain only an allowlisted topic in the URL fragment. External provider links are fixed, opened with `rel=noreferrer`, and carry no question, filter state or referral identifier. The external site still receives ordinary connection information after a person follows a link. The surrounding portal keeps its pre-existing language preference independently.

Interface and record summaries are provided in DE/FR/IT/RM/EN. Names remain native. These are editorial translations, not an assertion that advice is available in those languages; Romansh has not had independent native-language review.

## Maintenance

1. Run the test suite for schema, all-canton routing, multilingual copy, cost-filter behaviour and invalid-topic handling.
2. Run `node scripts/check-referral-links.mjs` for a bounded public URL health report. A status code is not a content review: a maintenance page can return 200, and automation blocks can return 403. The script never edits data, renews review dates or deletes providers.
3. Re-read the current provider page before changing price, eligibility or `verifiedAt`; update all five language summaries together. Preserve supporting evidence links here when one URL does not support every field.
4. Review records at least every 90 days; the UI flags older source reviews. No recurring job or automatic substantive review has been activated. Capacity and service quality are not verified by website review.
5. For withdrawn services, remove the entry and document the reason. For transient access problems, retain a clearly explained route only if its continuing availability is supported. Do not silently substitute a commercial paid service for a free route.

## Current evidence exceptions

- LAV Lucerne currently serves a maintenance page; its detail endpoint returns 500. The card names the current public secretariat contact and tells users to confirm booking/access. The underlying free resident-only consultation was verified on the provider's indexed detail page: https://www.lav.ch/de/rechtsauskunft . Current maintenance/contact evidence: https://www.lav.ch/ . A successful homepage HTTP status did not count as a functioning booking service.
- OATI's consultation page was readable with the web research tool on the review date; direct link checks timed out. The provider confirms CHF 30/30 minutes, booking first, and no more than two distinct consultations annually: https://www.oati.ch/servizi/consulenza-giuridica/ .
- ASLOCA's structure page was read during research but subsequently returned 403 to automated checks. It is a regional directory, not direct advice from the national office. ASI, ACSI and the Mieterverband are separately recorded.
- The Krankenversicherungsombudsstelle's free service was confirmed in the federal consumer-affairs directory; see the record's source URL and `national-sources.json`.
- FIZ's German service page supersedes its narrower/outdated English presentation. The card limits coverage to German-speaking/bilingual cantons and requires checking the applicable cantonal agreement; it does not promise universal representation.
- Emergency routes were verified against https://www.opferhilfe-schweiz.ch/de/wo-finde-ich-hilfe/ and https://www.bj.admin.ch/de/opferhilfe : police 117, medical emergency 144, victim support 142. The latter is not an emergency number.

The canonical public portal is this repository, deployed as the static Cloudflare Pages project `swisslaw`. The older private Sites prototype is not the deployment source. The directory does not alter guide publication gates. All entries are rendered as HTML; filtering is a progressive browser enhancement, so the directory remains readable without JavaScript.
