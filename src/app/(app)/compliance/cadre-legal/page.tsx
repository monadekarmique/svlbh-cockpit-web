import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/lib/owner-gate";

export const metadata: Metadata = { title: "Cadre légal SVLBH · Compliance" };
export const dynamic = "force-dynamic";

export default async function CadreLegalPage() {
  await requireOwner();

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <Link href="/compliance" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Compliance
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
          ST6 · Owner · Compliance
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-blue-950">
          ⚖️ Cadre légal SVLBH
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Doctrine juridique de la pratique SVLBH — qualification des données
          vibratoires, bases légales LPD suisse, articulation avec le médical,
          périmètre opérationnel.
        </p>
      </header>

      {/* Préambule */}
      <section className="rounded-xl border-2 border-violet-300 bg-violet-50/40 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
          Préambule
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-800">
          La pratique SVLBH (Sciences Vibratoires des Lignées et de la
          Bénédiction Holistique) lit des <strong>mémoires
          transgénérationnelles</strong> déposées dans une lignée d&apos;âmes
          via plusieurs outils radiesthésiques (palette chromatique, VIFA,
          pierres, healing-path, Si Zhu, Linggui Bafa). Ces lectures sont des{" "}
          <em>hypothèses sensibles symboliques</em> qui éclairent une
          consultante sur des dynamiques relationnelles, sans poser de
          diagnostic médical ni prescrire de traitement.
        </p>
      </section>

      {/* Section 1 — Qualification des données */}
      <Section
        title="1. Qualification juridique des données vibratoires"
        anchor="qualification"
      >
        <p>
          Les données traitées par SVLBH ne sont <strong>pas des données de
          santé</strong> au sens :
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Art. 5 let. c LPD</strong> (Loi suisse fédérale sur la
            protection des données, RS 235.1) — qui définit les données
            sensibles comme incluant les données sur la santé, la sphère
            intime, l&apos;origine raciale ou ethnique.
          </li>
          <li>
            <strong>Art. 9 §1 RGPD</strong> (Règlement UE 2016/679) — qui
            définit les catégories particulières incluant les données
            concernant la santé.
          </li>
        </ul>
        <p className="mt-3">
          <strong>Raison</strong> : les lectures vibratoires SVLBH ne
          contiennent ni diagnostic clinique, ni signe biologique mesurable, ni
          recommandation thérapeutique. Ce sont des <em>hypothèses
          radiesthésiques symboliques</em> portant sur la lignée d&apos;âmes —
          objet conceptuel sans existence légale en droit médical.
        </p>
        <DocLink
          label="ADR-01 « Données hDOM hors Art. 9 RGPD »"
          href="https://app.asana.com/0/0/1214055788220527"
          sub="Arbitrage Patrick 2026-04-15 + confirmation feedback 2026-05-19"
        />
      </Section>

      {/* Section 2 — Bases légales */}
      <Section
        title="2. Bases légales utilisées"
        anchor="bases-legales"
      >
        <p>
          Conformément à l&apos;Art. 31 al. 1 LPD (justification du
          traitement) :
        </p>
        <ul className="ml-5 list-disc space-y-2 text-sm">
          <li>
            <strong>Consentement explicite</strong> (Art. 6 LPD) — pour les
            soins vibratoires, l&apos;inscription cohorte ST1, la newsletter,
            la communication WhatsApp.
          </li>
          <li>
            <strong>Exécution d&apos;un contrat</strong> — pour
            l&apos;authentification, la facturation, la pédagogie des
            formations ST4+.
          </li>
          <li>
            <strong>Obligation légale</strong> — pour la conservation
            comptable 10 ans (art. 958f CO Code des obligations) et les
            mesures de sécurité (Art. 8 LPD).
          </li>
          <li>
            <strong>Intérêt légitime</strong> — pour la gouvernance interne du
            Cercle de Lumière (memberships dhātu, dynamiques attribuées) et
            l&apos;audit interne Compliance.
          </li>
        </ul>
        <DocLink
          label="Registre des activités de traitement (Art. 31 LPD)"
          href="/compliance/registre"
          sub="8 finalités SVLBH documentées avec base légale par finalité"
        />
      </Section>

      {/* Section 3 — Articulation avec le médical */}
      <Section
        title="3. Articulation avec le domaine médical"
        anchor="medical"
      >
        <p>
          La pratique SVLBH s&apos;exerce <strong>à côté</strong> du suivi
          médical, jamais à sa place. Trois disciplines de clôture
          opérationnelle s&apos;imposent :
        </p>
        <ul className="ml-5 list-disc space-y-2 text-sm">
          <li>
            <strong>Anti-substitution médicale.</strong> Un signe corporel
            (douleur, masse, dyspnée, etc.) se vérifie médicalement. La
            lecture symbolique éclaire l&apos;intégration, jamais le
            diagnostic.
          </li>
          <li>
            <strong>Anti-recouvrement de personnes réelles.</strong> Les
            attributions à des aïeux nommés sont des hypothèses sensibles
            subjectives, non des accusations factuelles.
            L&apos;anonymisation (C*/P* dans les cas d&apos;école) réduit le
            dommage, pas le statut.
          </li>
          <li>
            <strong>Re-validation Chi à distance.</strong> Toute lecture
            vibratoire est ré-évaluée à J+30, J+90 — les indicateurs
            (plafond solaire, lune, mordant) se réévaluent dans le temps.
          </li>
        </ul>
        <p className="mt-3 rounded-md bg-amber-50 p-3 text-xs italic text-amber-900">
          Pour les praticiennes certifiées ASCA (ex. Anne #302 via OneDoc.ch),
          la qualification ASCA réglemente la naturopathie hors médecine
          conventionnelle — pas SVLBH. SVLBH = lecture vibratoire
          transgénérationnelle, ASCA = naturopathie. Les deux activités
          peuvent cohabiter, mais ne se confondent pas.
        </p>
      </Section>

      {/* Section 4 — Durées de conservation */}
      <Section
        title="4. Durées de conservation"
        anchor="conservation"
      >
        <ul className="ml-5 list-disc space-y-1.5 text-sm">
          <li>
            <strong>Comptes utilisateurs</strong> — tant qu&apos;ils sont
            actifs. Suppression sur demande (Art. 28 LPD, Art. 17 RGPD).
          </li>
          <li>
            <strong>Lectures vibratoires (session, relation, healing-path)</strong>{" "}
            — 7 ans après la dernière session (cohérence art. 70 CO + délais
            standards naturopathie suisse).
          </li>
          <li>
            <strong>Factures + lignes</strong> — 10 ans (art. 958f CO,
            conservation obligatoire des pièces comptables).
          </li>
          <li>
            <strong>Memberships akashiques (cercles dhātu, dynamiques)</strong>{" "}
            — indéfinis (mémoire akashique multi-incarnations).
          </li>
          <li>
            <strong>Communication WhatsApp (bridges z1-z4)</strong> — 90j sur
            le bridge local, durée Meta WhatsApp = responsabilité Meta.
          </li>
          <li>
            <strong>Audit log Compliance</strong> — 90j minimum, extension
            à 7 ans pour traces critiques (GRANT/REVOKE tokens, modifs
            profiles, exports).
          </li>
        </ul>
      </Section>

      {/* Section 5 — Périmètre opérationnel */}
      <Section
        title="5. Périmètre opérationnel"
        anchor="perimetre"
      >
        <p className="text-sm">
          <strong>Ce qui PEUT être affirmé</strong> dans la pratique SVLBH :
        </p>
        <ul className="ml-5 list-disc space-y-1 text-sm">
          <li>« Je perçois une teinte manquante dans votre lignée. »</li>
          <li>« Cette mémoire ne vous appartient pas en propre. »</li>
          <li>« Voici un protocole symbolique pour la rendre. »</li>
          <li>« Le suivi médical doit cohabiter avec ce travail. »</li>
        </ul>
        <p className="mt-3 text-sm">
          <strong>Ce qui NE PEUT PAS être affirmé</strong> :
        </p>
        <ul className="ml-5 list-disc space-y-1 text-sm">
          <li>« Vous avez telle pathologie / tel diagnostic. »</li>
          <li>« Arrêtez votre traitement médical / tel médicament. »</li>
          <li>« Cet ancêtre est responsable de ce que vous avez. »</li>
          <li>« Ce travail va guérir telle maladie. »</li>
        </ul>
        <DocLink
          label="Memory feedback_donnees_vibrations_transgen_pas_patient.md"
          sub="Confirmation Patrick 2026-05-19 : vibrations radiesthésiques ≠ données patient"
        />
      </Section>

      {/* Section 6 — Juridictions */}
      <Section
        title="6. Juridictions et extension future"
        anchor="juridictions"
      >
        <p className="text-sm">
          V1 (2026-05-21) : <strong>Patrick Bays, Suisse</strong> —
          praticienne unique enregistrée. Loi applicable : LPD (CH).
        </p>
        <p className="mt-2 text-sm">
          Extension V2 prévue pour les praticiennes certifiées hors Suisse,
          notamment <strong>Flavia (Italie)</strong>. Architecture déjà
          compatible :
        </p>
        <ul className="ml-5 list-disc space-y-1 text-sm">
          <li>
            Registre Art. 31 LPD est scopé par <code>praticienne_svlbh_id</code> —
            une praticienne IT aura son propre registre RGPD UE.
          </li>
          <li>
            RLS Supabase à élargir pour <code>SELECT</code> par owner du
            registre (actuellement Owner ST6 seul).
          </li>
          <li>
            Aucun transfert hors UE/CH pour les données vibratoires (data
            residency garantie via Supabase Frankfurt + Render EU).
          </li>
        </ul>
      </Section>

      {/* Section 7 — Autorité de contrôle */}
      <Section
        title="7. Autorité de contrôle"
        anchor="autorite"
      >
        <p className="text-sm">
          <strong>Suisse</strong> : Préposé fédéral à la protection des
          données et à la transparence (
          <a
            href="https://www.edoeb.admin.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 underline"
          >
            PFPDT / EDÖB
          </a>
          ). Pas de notification obligatoire 72h dans tous les cas (la LPD
          permet plus de souplesse que le RGPD).
        </p>
        <p className="mt-2 text-sm">
          <strong>UE</strong> (pour Flavia IT future) : Garante per la
          protezione dei dati personali. Notification 72h obligatoire en cas
          de violation (Art. 33 RGPD).
        </p>
      </Section>

      {/* Liens transverses */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-700">
          Documents liés
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li>
            →{" "}
            <Link href="/compliance/sous-traitants" className="text-blue-700 hover:underline">
              Inventaire sous-traitants + DPA
            </Link>
          </li>
          <li>
            →{" "}
            <Link href="/compliance/registre" className="text-blue-700 hover:underline">
              Registre Art. 31 LPD (8 finalités)
            </Link>
          </li>
          <li>
            →{" "}
            <Link href="/compliance/audit-log" className="text-blue-700 hover:underline">
              Audit log
            </Link>{" "}
            (traces GRANT/UPDATE/INSERT/DELETE)
          </li>
          <li>
            →{" "}
            <a
              href="https://app.asana.com/0/0/1214055788220527"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline"
            >
              ADR-01 « Données hDOM hors Art. 9 RGPD » (Asana)
            </a>
          </li>
        </ul>
      </section>

      <footer className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900">
        <strong>Document interne Owner ST6.</strong> Cette doctrine sert de
        référence pour les arbitrages de Patrick et de support pour répondre à
        une éventuelle interpellation PFPDT / Garante. Aucune transmission
        externe sans validation explicite. Version V1 — révision lors de
        l&apos;onboarding Flavia (extension RGPD UE).
      </footer>
    </main>
  );
}

function Section({
  title,
  anchor,
  children,
}: {
  title: string;
  anchor: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={anchor}
      className="space-y-2 rounded-xl border border-neutral-200 bg-white p-5"
    >
      <h2 className="text-base font-bold tracking-tight text-blue-950">
        {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-neutral-800">
        {children}
      </div>
    </section>
  );
}

function DocLink({
  label,
  href,
  sub,
}: {
  label: string;
  href?: string;
  sub?: string;
}) {
  const inner = (
    <span className="inline-flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-blue-700">{label}</span>
      {sub && <span className="text-[10px] text-neutral-500">{sub}</span>}
    </span>
  );
  return (
    <div className="mt-3 rounded-md bg-blue-50/40 p-2.5">
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="hover:underline"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}
