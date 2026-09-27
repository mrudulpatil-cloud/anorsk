import LegalPage from "../legal";

export const metadata = {
  title: "Personvernerklæring — NorskDive",
  description: "Hvordan NorskDive behandler personopplysninger. Privacy policy for NorskDive.",
};

const UPDATED = "27. september 2026";
const EMAIL = "sprakanorsk@gmail.com";
const Mail = () => <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;

export default function Personvern() {
  return (
    <LegalPage title="Personvernerklæring" updated={UPDATED}>
      <div className="box">
        <strong>Kort fortalt:</strong> NorskDive har ingen brukerkontoer og bruker ingen informasjonskapsler (cookies) til
        sporing eller reklame. Fremgangen din lagres bare på din egen enhet. Vi får bare opplysninger om deg hvis du selv
        sender en tilbakemelding, og e-post er alltid valgfritt. Besøksstatistikken er anonym.
      </div>

      <h2>1. Hvem er ansvarlig?</h2>
      <p>
        Behandlingsansvarlig er <strong>Mrudul Patil</strong>, privatperson, Sandnes, Norge. NorskDive (anorsk.no) er et
        gratis ikke-kommersielt prosjekt. Kontakt: <Mail />.
      </p>

      <h2>2. Opplysninger som bare lagres på din enhet</h2>
      <p>
        For at appen skal huske hvor langt du har kommet, lagres dette i nettleserens lokale lagring (localStorage) på
        din enhet: XP, merker, dager på rad, resultater fra prøver og quizer, repetisjonsstatus for ord, valgt nivåpar,
        eksamensdato (hvis du har lagt den inn), egne fraser og valg av lys/mørk modus.
      </p>
      <ul>
        <li>Disse opplysningene sendes <strong>ikke</strong> til oss, og vi kan ikke se dem.</li>
        <li>Du sletter dem ved å slette nettstedsdata for anorsk.no i nettleseren din.</li>
        <li>
          Lagringen er strengt nødvendig for tjenesten du selv ber om, og krever derfor ikke samtykke etter ekomloven
          § 3-15.
        </li>
      </ul>
      <h3>Mikrofon og opptak</h3>
      <p>
        Hvis du bruker «Ta opp deg selv», ber nettleseren om tilgang til mikrofonen. Opptaket blir liggende i
        nettleserens minne slik at du kan spille det av. Det lagres ikke, sendes ikke til oss og forsvinner når du lukker
        eller laster siden på nytt.
      </p>
      <h3>Opplesning (tale)</h3>
      <p>
        Opplesning bruker stemmene som finnes i nettleseren eller på enheten din. Noen nettlesere bruker nettbaserte
        stemmer (for eksempel «Google»-stemmer i Chrome), og da kan teksten som leses opp sendes til nettleserleverandøren.
        Det gjelder bare øvingstekst fra appen, og det reguleres av nettleserleverandørens egne vilkår.
      </p>

      <h2>3. Besøksstatistikk</h2>
      <p>
        Vi bruker Vercel Web Analytics for å se hvor mange som bruker nettstedet og hvilke sider som brukes. Verktøyet
        bruker ikke informasjonskapsler og lagrer ingenting på enheten din. Det registreres: tidspunkt, side, henvisende
        nettsted, omtrentlig sted (land/region/by), operativsystem, nettleser og enhetstype. For å telle unike besøk lages
        en anonym kode (hash) av forespørselen, og den slettes automatisk etter 24 timer. IP-adressen lagres ikke.
      </p>
      <p>
        Rettslig grunnlag: berettiget interesse (GDPR art. 6 nr. 1 bokstav f) i å forstå bruken og forbedre tjenesten.
        Du kan protestere ved å kontakte oss, eller blokkere statistikken med nettleserinnstillinger eller en
        innholdsblokkerer.
      </p>

      <h2>4. Tilbakemeldingsskjemaet</h2>
      <p>Når du sender en tilbakemelding, lagres dette:</p>
      <ul>
        <li>tidspunkt, type tilbakemelding og meldingen din</li>
        <li>nivåparet du har valgt i appen (for eksempel A2–B1), hvis du har valgt ett</li>
        <li>e-postadressen din, bare hvis du selv oppgir den og krysser av for samtykke</li>
      </ul>
      <p>
        Meldingen sendes via nettstedets server og lagres i et privat Google-regneark som bare NorskDive har tilgang til.
        IP-adresse og nettleserdata lagres ikke sammen med meldingen.
      </p>
      <ul>
        <li>
          <strong>Formål og grunnlag:</strong> å lese forslag og forbedre appen (berettiget interesse, art. 6 nr. 1 f).
          E-post brukes bare til å svare deg, på grunnlag av samtykket ditt (art. 6 nr. 1 a). Du kan trekke samtykket
          tilbake når som helst ved å skrive til <Mail />.
        </li>
        <li>
          <strong>Lagringstid:</strong> e-postadresser slettes senest 12 måneder etter siste kontakt. Meldinger slettes
          når de ikke lenger er nyttige, og senest etter 24 måneder.
        </li>
        <li>Ikke skriv sensitive opplysninger eller opplysninger om andre personer i meldingen.</li>
      </ul>

      <h2>5. Drift av nettstedet</h2>
      <p>
        Nettstedet driftes av Vercel. Som alle nettsteder mottar serveren teknisk informasjon som IP-adresse og
        nettlesertype når du besøker siden. Dette er nødvendig for å levere siden og beskytte den mot misbruk
        (berettiget interesse, art. 6 nr. 1 f), og slike serverlogger lagres bare i kort tid etter Vercels rutiner.
      </p>

      <h2>6. Hvem vi deler opplysninger med</h2>
      <p>Vi selger aldri opplysninger og bruker dem ikke til reklame eller profilering. Disse leverandørene behandler opplysninger på våre vegne:</p>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Leverandør</th><th>Hva</th><th>Hvor</th></tr></thead>
          <tbody>
            <tr><td>Vercel Inc.</td><td>Drift av nettstedet og besøksstatistikk</td><td>USA / globalt</td></tr>
            <tr><td>Google LLC</td><td>Lagring av tilbakemeldinger (Google Regneark / Apps Script)</td><td>USA / globalt</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Begge selskapene er sertifisert under EU–US Data Privacy Framework. EUs beslutning om tilstrekkelig
        beskyttelsesnivå gjelder også for Norge gjennom EØS-avtalen, og leverandørenes databehandleravtaler inneholder i
        tillegg EUs standard personvernbestemmelser.
      </p>

      <h2>7. Barn</h2>
      <p>
        NorskDive er laget for voksne som øver til Norskprøven. Vi ber ikke om alder. Er du under 13 år, må du ikke
        oppgi e-postadressen din i tilbakemeldingsskjemaet uten at en forelder har godkjent det.
      </p>

      <h2>8. Dine rettigheter</h2>
      <p>
        Du har rett til innsyn i, retting og sletting av opplysninger om deg, til å begrense behandlingen, til
        dataportabilitet, til å protestere mot behandling som bygger på berettiget interesse, og til å trekke tilbake
        samtykke. Skriv til <Mail />, så svarer vi innen én måned. Opplysningene i localStorage finnes bare på din enhet,
        og dem kan du slette selv.
      </p>
      <p>
        Mener du at vi behandler opplysninger i strid med regelverket, kan du klage til{" "}
        <a href="https://www.datatilsynet.no" target="_blank" rel="noopener noreferrer">Datatilsynet</a>.
        Vi setter pris på om du tar kontakt med oss først.
      </p>

      <h2>9. Sikkerhet</h2>
      <p>
        All trafikk til og fra nettstedet er kryptert (HTTPS). Regnearket med tilbakemeldinger er ikke delt med noen,
        og nøkkelen som gir tilgang til det, ligger bare på serveren.
      </p>

      <h2>10. Endringer</h2>
      <p>
        Hvis vi endrer hvordan opplysninger behandles, for eksempel når det kommer brukerkontoer, oppdaterer vi denne
        erklæringen og datoen øverst før endringen tas i bruk.
      </p>

      {/* ---------------- English ---------------- */}
      <hr className="divider" />
      <div id="english" lang="en">
        <h1>Privacy policy</h1>
        <div className="meta">Last updated: 27 September 2026. The Norwegian version above takes precedence.</div>

        <div className="box">
          <strong>In short:</strong> NorskDive has no user accounts and uses no tracking or advertising cookies. Your
          progress is stored only on your own device. We only receive information about you if you send feedback, and
          email is always optional. Visitor statistics are anonymous.
        </div>

        <h2>1. Who is responsible?</h2>
        <p>
          The data controller is <strong>Mrudul Patil</strong>, a private individual in Sandnes, Norway. NorskDive
          (anorsk.no) is a free, non-commercial project. Contact: <Mail />.
        </p>

        <h2>2. Data stored only on your device</h2>
        <p>
          To remember your progress, the app stores the following in your browser's local storage (localStorage): XP,
          badges, streaks, test and quiz results, word-review status, chosen level pair, exam date (if entered), your own
          phrases and light/dark mode. This data is <strong>not</strong> sent to us and we cannot see it. You can delete
          it by clearing site data for anorsk.no in your browser. This storage is strictly necessary for the service you
          request and therefore does not require consent under section 3-15 of the Norwegian Electronic Communications
          Act (ekomloven).
        </p>
        <p>
          <strong>Microphone:</strong> "Record yourself" keeps the recording in browser memory for playback only. It is
          not saved or sent to us and disappears when you close or reload the page. <strong>Text-to-speech:</strong> uses
          voices in your browser or device. Some browsers use online voices (for example "Google" voices in Chrome), in
          which case the practice text being read aloud may be sent to the browser vendor under its own terms.
        </p>

        <h2>3. Visitor statistics</h2>
        <p>
          We use Vercel Web Analytics to see how many people use the site and which pages are used. It sets no cookies
          and stores nothing on your device. It records time, page, referring site, approximate location
          (country/region/city), operating system, browser and device type. Unique visits are counted with an anonymous
          hash of the request that is discarded after 24 hours; IP addresses are not stored. Legal basis: legitimate
          interest (GDPR Art. 6(1)(f)) in understanding usage and improving the service. You may object by contacting us,
          or block it with browser settings or a content blocker.
        </p>

        <h2>4. Feedback form</h2>
        <p>
          When you send feedback we store the time, feedback type, your message, the level pair selected in the app (if
          any), and your email address only if you enter it and tick the consent box. It is passed through the site's
          server and stored in a private Google Sheet that only NorskDive can access. No IP address or browser data is
          stored with it. Messages are used to improve the app (legitimate interest, Art. 6(1)(f)); email is used only to
          reply to you, based on your consent (Art. 6(1)(a)), which you can withdraw at any time by writing to <Mail />.
          Email addresses are deleted no later than 12 months after the last contact; messages are deleted when no
          longer useful and after 24 months at the latest. Please don't include sensitive information or details about
          other people.
        </p>

        <h2>5. Hosting</h2>
        <p>
          The site is hosted by Vercel. Like any website, the server receives technical information such as your IP
          address and browser type when you visit. This is necessary to deliver the site and protect it from abuse
          (legitimate interest, Art. 6(1)(f)); such server logs are kept only briefly under Vercel's procedures.
        </p>

        <h2>6. Who we share data with</h2>
        <p>
          We never sell data or use it for advertising or profiling. Vercel Inc. (hosting and analytics) and Google LLC
          (feedback storage via Google Sheets/Apps Script) process data on our behalf, in the USA and globally. Both are
          certified under the EU–US Data Privacy Framework; the EU adequacy decision also applies to Norway through the
          EEA Agreement, and their data processing agreements additionally include the EU Standard Contractual Clauses.
        </p>

        <h2>7. Children</h2>
        <p>
          NorskDive is designed for adults preparing for Norskprøven. We don't ask for age. If you are under 13, don't
          enter your email address in the feedback form without a parent's approval.
        </p>

        <h2>8. Your rights</h2>
        <p>
          You have the right to access, rectify and erase your data, to restrict processing, to data portability, to
          object to processing based on legitimate interest, and to withdraw consent. Write to <Mail /> and we will reply
          within one month. Data in localStorage exists only on your device and you can delete it yourself. You can
          complain to the Norwegian Data Protection Authority,{" "}
          <a href="https://www.datatilsynet.no/en/" target="_blank" rel="noopener noreferrer">Datatilsynet</a>, though
          we'd appreciate hearing from you first.
        </p>

        <h2>9. Security</h2>
        <p>
          All traffic to and from the site is encrypted (HTTPS). The feedback sheet is not shared with anyone, and the key
          that grants access to it is kept only on the server.
        </p>

        <h2>10. Changes</h2>
        <p>
          If we change how data is processed, for example when user accounts are introduced, we will update this policy
          and the date above before the change takes effect.
        </p>
      </div>
    </LegalPage>
  );
}
