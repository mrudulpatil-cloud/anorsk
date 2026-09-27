import LegalPage from "../legal";

export const metadata = {
  title: "Vilkår for bruk — NorskDive",
  description: "Vilkår for bruk av NorskDive. Terms of use for NorskDive.",
};

const UPDATED = "27. september 2026";
const EMAIL = "sprakanorsk@gmail.com";
const Mail = () => <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;

export default function Vilkar() {
  return (
    <LegalPage title="Vilkår for bruk" updated={UPDATED}>
      <h2>1. Om tjenesten</h2>
      <p>
        NorskDive (anorsk.no) er en gratis nettapp for å øve til Norskprøven. Tjenesten tilbys av Mrudul Patil,
        privatperson, Sandnes, Norge. Kontakt: <Mail />. Ved å bruke nettstedet godtar du disse vilkårene.
      </p>

      <h2>2. Gratis og uten konto</h2>
      <p>
        Tjenesten er gratis og krever ingen konto. Vi kan endre, utvide eller avslutte hele eller deler av tjenesten når
        som helst. Kommer det betalte funksjoner eller brukerkontoer senere, gjelder egne vilkår for dem, og vi gir
        beskjed før de tas i bruk.
      </p>

      <h2>3. Ikke en offisiell tjeneste</h2>
      <p>
        NorskDive er et uavhengig prosjekt og har ingen tilknytning til, godkjenning fra eller samarbeid med Direktoratet
        for høyere utdanning og kompetanse (HK-dir), som arrangerer Norskprøven. Øvingsoppgavene er laget for øving og
        er ikke offisielle prøveoppgaver. Nivåvurderinger og resultater i appen er veiledende og gir ingen garanti for
        resultatet på den ordinære prøven. Offisiell informasjon finner du på{" "}
        <a href="https://prove.hkdir.no" target="_blank" rel="noopener noreferrer">prove.hkdir.no</a>.
      </p>

      <h2>4. Innhold og opphavsrett</h2>
      <p>
        Tekster, oppgaver, lydmanus, design og kode i NorskDive er laget for tjenesten og tilhører Mrudul Patil, med
        mindre annet er oppgitt. Du kan bruke innholdet fritt til egen, personlig læring, og lærere kan bruke enkeltoppgaver
        i egen undervisning. Du kan ikke kopiere, publisere, selge eller systematisk hente ut (skrape) innhold uten
        skriftlig tillatelse.
      </p>

      <h2>5. Akseptabel bruk</h2>
      <p>Du må ikke:</p>
      <ul>
        <li>forsøke å skaffe deg uautorisert tilgang til nettstedet eller systemene bak det</li>
        <li>overbelaste tjenesten, for eksempel med automatiserte forespørsler</li>
        <li>bruke tilbakemeldingsskjemaet til reklame, søppelpost eller ulovlig eller krenkende innhold</li>
        <li>sende inn opplysninger om andre personer</li>
      </ul>

      <h2>6. Tilbakemeldinger</h2>
      <p>
        Vi setter stor pris på forslag. Når du sender inn en idé eller et forslag, kan vi bruke det fritt til å forbedre
        NorskDive, uten plikt til å betale for det eller oppgi hvem det kom fra. Hvordan tilbakemeldinger behandles,
        står i <a href="/personvern">personvernerklæringen</a>.
      </p>

      <h2>7. Fremgangen din</h2>
      <p>
        Fremgangen lagres bare i nettleseren på enheten din. Den kan gå tapt hvis du sletter nettleserdata, bytter enhet
        eller nettleser, eller bruker privat modus. Vi har ingen kopi og kan ikke gjenopprette den.
      </p>

      <h2>8. Ansvar</h2>
      <p>
        Tjenesten leveres «som den er». Vi gjør vårt beste for at innholdet skal være riktig og nettstedet tilgjengelig,
        men vi kan ikke garantere at det er feilfritt eller alltid oppe. Så langt loven tillater det, er vi ikke ansvarlige
        for tap som følge av bruk av tjenesten, feil i innholdet, nedetid eller tapt fremgang. Dette begrenser ikke
        rettigheter du har etter ufravikelig lov, for eksempel forbrukerlovgivningen, eller ansvar for skade voldt med
        forsett eller grov uaktsomhet.
      </p>

      <h2>9. Lenker til andre nettsteder</h2>
      <p>
        NorskDive lenker til andre nettsteder, som HK-dir og NTNU. Vi har ikke kontroll over disse og er ikke ansvarlige
        for innholdet der.
      </p>

      <h2>10. Endringer i vilkårene</h2>
      <p>
        Vi kan oppdatere vilkårene. Datoen øverst viser når de sist ble endret. Vesentlige endringer varsles på
        nettstedet.
      </p>

      <h2>11. Lovvalg og tvister</h2>
      <p>
        Norsk rett gjelder. Vi ønsker å løse uenigheter i minnelighet, så ta kontakt på <Mail /> først. Hvis det ikke
        lykkes, avgjøres tvisten av de alminnelige domstolene, med Sør-Rogaland tingrett som verneting. Dette begrenser
        ikke din rett som forbruker til å bringe saken inn for domstolen der du bor.
      </p>

      {/* ---------------- English ---------------- */}
      <hr className="divider" />
      <div id="english" lang="en">
        <h1>Terms of use</h1>
        <div className="meta">Last updated: 27 September 2026. The Norwegian version above takes precedence.</div>

        <h2>1. About the service</h2>
        <p>
          NorskDive (anorsk.no) is a free web app for practising for Norskprøven, provided by Mrudul Patil, a private
          individual in Sandnes, Norway. Contact: <Mail />. By using the site you accept these terms.
        </p>

        <h2>2. Free, no account</h2>
        <p>
          The service is free and needs no account. We may change, extend or discontinue all or part of it at any time.
          If paid features or user accounts are introduced later, separate terms will apply to them and we will announce
          them in advance.
        </p>

        <h2>3. Not an official service</h2>
        <p>
          NorskDive is independent and is not affiliated with, endorsed by or working with the Norwegian Directorate for
          Higher Education and Skills (HK-dir), which administers Norskprøven. Exercises are for practice and are not
          official test material. Level estimates and scores in the app are indicative only and do not guarantee any
          result in the real test. Official information is at{" "}
          <a href="https://prove.hkdir.no" target="_blank" rel="noopener noreferrer">prove.hkdir.no</a>.
        </p>

        <h2>4. Content and copyright</h2>
        <p>
          Texts, exercises, audio scripts, design and code in NorskDive were created for the service and belong to
          Mrudul Patil unless stated otherwise. You may use the content freely for your own personal learning, and
          teachers may use individual exercises in their own teaching. You may not copy, republish, sell or
          systematically extract (scrape) content without written permission.
        </p>

        <h2>5. Acceptable use</h2>
        <p>
          Don't try to gain unauthorised access to the site or its systems, overload it (for example with automated
          requests), use the feedback form for advertising, spam or unlawful or abusive content, or submit information
          about other people.
        </p>

        <h2>6. Feedback</h2>
        <p>
          We welcome suggestions. When you send an idea or suggestion, we may use it freely to improve NorskDive, with no
          obligation to pay for it or credit you. How feedback is handled is described in the{" "}
          <a href="/personvern">privacy policy</a>.
        </p>

        <h2>7. Your progress</h2>
        <p>
          Progress is stored only in the browser on your device. It can be lost if you clear browser data, switch device
          or browser, or use private mode. We have no copy and cannot restore it.
        </p>

        <h2>8. Liability</h2>
        <p>
          The service is provided "as is". We do our best to keep the content correct and the site available, but can't
          guarantee it is error-free or always online. To the extent permitted by law, we are not liable for losses
          arising from use of the service, errors in the content, downtime or lost progress. This does not limit any
          rights you have under mandatory law, such as consumer law, or liability for intentional or grossly negligent
          harm.
        </p>

        <h2>9. Links to other sites</h2>
        <p>
          NorskDive links to other sites, such as HK-dir and NTNU. We don't control them and aren't responsible for their
          content.
        </p>

        <h2>10. Changes to these terms</h2>
        <p>
          We may update these terms. The date above shows when they last changed. Significant changes will be announced
          on the site.
        </p>

        <h2>11. Governing law and disputes</h2>
        <p>
          Norwegian law applies. We'd like to resolve disagreements amicably, so please contact <Mail /> first. Otherwise,
          disputes are settled by the ordinary courts, with Sør-Rogaland District Court as the agreed venue. This does not
          limit your right as a consumer to bring a case before the court where you live.
        </p>
      </div>
    </LegalPage>
  );
}
