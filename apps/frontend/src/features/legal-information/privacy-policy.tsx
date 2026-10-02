import ContactEmail from './contact-email';

export default function PrivacyPolicy() {
  return (
    <article
      id="privacy-policy"
      aria-labelledby="privacy-policy-title"
      className="min-w-0 scroll-mt-8 space-y-4 leading-relaxed text-gray-700"
    >
      <h2
        id="privacy-policy-title"
        className="text-2xl font-bold text-gray-900"
      >
        Politique de confidentialité
      </h2>
      <p className="text-sm text-gray-500">
        Cityborn Games — Version 1.0 — 2025
      </p>
      <p>Traitement des données personnelles — Application Cityborn</p>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">PRÉAMBULE</h3>
      <p>
        La présente Politique de Confidentialité a pour objet d'informer les
        Utilisateurs de l'application mobile Cityborn (ci-après l'« Application
        ») sur la manière dont Cityborn Games collecte, utilise, conserve et
        protège leurs données à caractère personnel, conformément au Règlement
        (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016
        (ci-après le « RGPD ») et à la loi n° 78-17 du 6 janvier 1978 modifiée
        relative à l'informatique, aux fichiers et aux libertés.
      </p>
      <p>
        Cityborn Games s'engage à traiter les données personnelles de ses
        Utilisateurs avec le plus haut niveau de confidentialité et de sécurité,
        et à respecter en toutes circonstances les droits fondamentaux des
        personnes concernées.
      </p>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">
        ARTICLE 1 – IDENTITÉ DU RESPONSABLE DE TRAITEMENT
      </h3>
      <p>
        Le responsable du traitement des données personnelles collectées via
        l'Application est :
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Responsable du traitement</caption>
          <tbody>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Dénomination
              </th>
              <td className="border border-gray-300 p-3 align-top">
                Cityborn Games SAS
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                SIREN
              </th>
              <td className="border border-gray-300 p-3 align-top">
                101640894
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Contact RGPD
              </th>
              <td className="border border-gray-300 p-3 align-top">
                <ContactEmail />
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Représentant légal
              </th>
              <td className="border border-gray-300 p-3 align-top">
                Charles DESHAIES, Président
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">
        ARTICLE 2 – DONNÉES COLLECTÉES ET TRAITEMENTS
      </h3>
      <p>
        Le tableau ci-après récapitule l'ensemble des données à caractère
        personnel traitées par Cityborn Games, leurs finalités, leur base légale
        et leur durée de conservation.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Données collectées et traitements
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="border border-gray-300 bg-gray-100 p-3 align-top font-semibold"
              >
                Catégorie de données
              </th>
              <th
                scope="col"
                className="border border-gray-300 bg-gray-100 p-3 align-top font-semibold"
              >
                Finalité
              </th>
              <th
                scope="col"
                className="border border-gray-300 bg-gray-100 p-3 align-top font-semibold"
              >
                Base légale
              </th>
              <th
                scope="col"
                className="border border-gray-300 bg-gray-100 p-3 align-top font-semibold"
              >
                Destinataires
              </th>
              <th
                scope="col"
                className="border border-gray-300 bg-gray-100 p-3 align-top font-semibold"
              >
                Durée
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-3 align-top">
                Données d'identification (pseudonyme, identifiant de compte)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Création et gestion du Compte utilisateur
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Exécution du contrat (art. 6.1.b RGPD)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Cityborn Games (interne)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Durée du Compte + 5 ans
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 align-top">
                Adresse email
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Authentification, notifications, support client
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Exécution du contrat / Intérêt légitime
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Cityborn Games, prestataire email (ex. Brevo)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Durée du Compte + 3 ans
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 align-top">
                Données de jeu (progression, scores, achats virtuels, sessions)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Fonctionnement du jeu, sauvegarde, statistiques
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Exécution du contrat
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Cityborn Games, hébergeur (ex. AWS/GCP)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Durée du Compte + 2 ans
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 align-top">
                Données de transaction (montant, date, identifiant Apple/Google)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Gestion des achats in-app, comptabilité, litiges
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Exécution du contrat / Obligation légale
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Cityborn Games, plateforme de paiement Apple/Google
              </td>
              <td className="border border-gray-300 p-3 align-top">
                10 ans (archives comptables)
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 align-top">
                Identifiants techniques (Device ID, IP, IDFA/GAID avec
                consentement)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Analytics, détection de fraude, amélioration produit
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Consentement (art. 6.1.a RGPD) / Intérêt légitime
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Cityborn Games, outil analytics (ex. Firebase)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                13 mois glissants
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 align-top">
                Données de communication (messages support)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Traitement des demandes et réclamations
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Intérêt légitime
              </td>
              <td className="border border-gray-300 p-3 align-top">
                Cityborn Games (support interne)
              </td>
              <td className="border border-gray-300 p-3 align-top">
                3 ans après clôture du ticket
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Cityborn Games s'engage à ne collecter que les données strictement
        nécessaires aux finalités décrites et à ne pas traiter ces données à
        d'autres fins incompatibles avec celles indiquées.
      </p>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">
        ARTICLE 3 – BASE LÉGALE DES TRAITEMENTS
      </h3>
      <p>
        Conformément à l'article 6 du RGPD, chaque traitement est fondé sur
        l'une des bases légales suivantes :
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Exécution du contrat (art. 6.1.b) : traitements nécessaires à la
          fourniture du service, notamment la gestion du Compte, la sauvegarde
          de la progression et la gestion des achats ;
        </li>
        <li>
          Consentement (art. 6.1.a) : traitements soumis à consentement
          préalable, notamment les identifiants publicitaires (IDFA sur iOS,
          GAID sur Android), les cookies analytiques non essentiels et toute
          communication marketing ;
        </li>
        <li>
          Obligation légale (art. 6.1.c) : conservation des données comptables
          et de transaction, conformément aux obligations légales applicables
          (article L. 123-22 du Code de commerce) ;
        </li>
        <li>
          Intérêt légitime (art. 6.1.f) : traitements à des fins de détection de
          fraude, de sécurité du service et d'amélioration de l'expérience
          utilisateur, sous réserve que cet intérêt ne prévale pas sur les
          droits et libertés fondamentaux des personnes concernées.
        </li>
      </ul>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">
        ARTICLE 4 – MINEURS
      </h3>
      <p>
        L'Application est accessible aux personnes âgées d'au moins treize (13)
        ans. Cityborn Games ne collecte pas sciemment les données personnelles
        d'enfants de moins de treize (13) ans.
      </p>
      <p>
        Pour les Utilisateurs âgés de treize (13) à quinze (15) ans résidant en
        France, le traitement des données fondé sur le consentement requiert
        l'autorisation préalable du titulaire de l'autorité parentale,
        conformément à l'article 7-1 de la loi n° 78-17 modifiée. Cityborn Games
        met en place un mécanisme de recueil du consentement parental lors de la
        création du Compte par un utilisateur déclarant avoir moins de quinze
        (15) ans.
      </p>
      <p>
        Si Cityborn Games venait à avoir connaissance qu'elle a collecté des
        données d'un enfant de moins de treize (13) ans sans consentement
        parental valable, elle procéderait à la suppression immédiate de ces
        données et du Compte concerné.
      </p>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">
        ARTICLE 5 – DROITS DES PERSONNES CONCERNÉES
      </h3>
      <p>
        Conformément au RGPD, tout Utilisateur dispose des droits suivants sur
        ses données personnelles :
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Droits des personnes concernées</caption>
          <tbody>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Droit d'accès
              </th>
              <td className="border border-gray-300 p-3 align-top">
                Obtenir la confirmation que des données vous concernant sont
                traitées et en recevoir une copie (art. 15 RGPD).
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Droit de rectification
              </th>
              <td className="border border-gray-300 p-3 align-top">
                Faire corriger toute donnée inexacte ou incomplète vous
                concernant (art. 16 RGPD).
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Droit à l'effacement
              </th>
              <td className="border border-gray-300 p-3 align-top">
                Demander la suppression de vos données dans les cas prévus par
                la loi (art. 17 RGPD). Ce droit peut être exercé via la
                fonctionnalité « Supprimer mon compte » de l'Application.
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Droit à la portabilité
              </th>
              <td className="border border-gray-300 p-3 align-top">
                Recevoir vos données dans un format structuré, couramment
                utilisé et lisible par machine, et les transmettre à un autre
                responsable de traitement (art. 20 RGPD).
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Droit d'opposition
              </th>
              <td className="border border-gray-300 p-3 align-top">
                Vous opposer au traitement de vos données fondé sur l'intérêt
                légitime, notamment à des fins de prospection commerciale (art.
                21 RGPD).
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Droit à la limitation
              </th>
              <td className="border border-gray-300 p-3 align-top">
                Demander la limitation du traitement dans les cas prévus à
                l'article 18 du RGPD.
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="border border-gray-300 bg-gray-50 p-3 align-top font-semibold"
              >
                Retrait du consentement
              </th>
              <td className="border border-gray-300 p-3 align-top">
                Retirer à tout moment votre consentement pour les traitements
                qui en sont fondés, sans que cela ne remette en cause la licéité
                des traitements effectués avant le retrait.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Pour exercer l'un de ces droits, l'Utilisateur peut adresser sa demande
        à l'adresse : <ContactEmail />. Cityborn Games s'engage à répondre à
        toute demande dans un délai maximum de trente (30) jours suivant la
        réception. En cas de demande complexe ou multiple, ce délai peut être
        prolongé de deux (2) mois supplémentaires, l'Utilisateur en étant
        informé.
      </p>
      <p>
        En cas de réponse insatisfaisante ou d'absence de réponse dans le délai
        imparti, l'Utilisateur a le droit d'introduire une réclamation auprès de
        la Commission Nationale de l'Informatique et des Libertés (CNIL) —
        www.cnil.fr — ou auprès de toute autre autorité de contrôle compétente
        dans son État membre de résidence.
      </p>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">
        ARTICLE 6 – COOKIES ET TECHNOLOGIES SIMILAIRES
      </h3>
      <p>
        L'Application peut utiliser des cookies et technologies similaires
        (pixels, SDK tiers, etc.) à des fins fonctionnelles, analytiques ou
        publicitaires. Conformément à la réglementation française (délibération
        CNIL n° 2020-091) et aux orientations de l'EDPB, le dépôt de traceurs
        non essentiels est conditionné au consentement préalable et éclairé de
        l'Utilisateur. Ce consentement est recueilli via le bandeau de gestion
        des cookies présenté lors de la première connexion et accessible à tout
        moment depuis les paramètres de l'Application. Sur les appareils iOS,
        Cityborn Games respecte le cadre App Tracking Transparency (ATT) d'Apple
        et ne collecte pas l'identifiant publicitaire (IDFA) sans consentement
        explicite de l'Utilisateur.
      </p>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">
        ARTICLE 7 – SÉCURITÉ DES DONNÉES
      </h3>
      <p>
        Cityborn Games met en œuvre les mesures techniques et organisationnelles
        appropriées pour protéger les données personnelles des Utilisateurs
        contre tout accès non autorisé, toute divulgation, altération ou
        destruction accidentelle ou illicite, conformément à l'article 32 du
        RGPD. Ces mesures incluent notamment :
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>le chiffrement des données en transit (protocole TLS/HTTPS) ;</li>
        <li>
          le contrôle d'accès strict aux systèmes de traitement des données ;
        </li>
        <li>
          la mise en œuvre d'une politique de gestion des incidents de sécurité
          ;
        </li>
        <li>la réalisation régulière d'audits et de tests de sécurité.</li>
      </ul>
      <p>
        En cas de violation de données personnelles susceptible d'engendrer un
        risque pour les droits et libertés des Utilisateurs, Cityborn Games
        notifiera l'autorité de contrôle compétente (CNIL) dans les 72 heures
        suivant la prise de connaissance de la violation, conformément à
        l'article 33 du RGPD. Si la violation est susceptible d'engendrer un
        risque élevé pour les personnes concernées, ces dernières en seront
        informées sans délai injustifié.
      </p>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">
        ARTICLE 8 – DURÉE DE CONSERVATION
      </h3>
      <p>
        Les données personnelles sont conservées pour la durée strictement
        nécessaire aux finalités pour lesquelles elles ont été collectées,
        telles que définies à l'article 2, et en tout état de cause dans le
        respect des prescriptions légales applicables. À l'expiration de la
        durée de conservation, les données sont soit supprimées de manière
        sécurisée, soit anonymisées de façon irréversible à des fins
        statistiques.
      </p>
      <h3 className="pt-6 text-xl font-semibold text-gray-900">
        ARTICLE 9 – MODIFICATIONS DE LA PRÉSENTE POLITIQUE
      </h3>
      <p>
        Cityborn Games se réserve le droit de modifier la présente Politique de
        Confidentialité à tout moment, notamment en cas de modification des
        traitements mis en œuvre, d'évolution réglementaire ou
        jurisprudentielle. La version applicable est celle en vigueur au moment
        de l'utilisation de l'Application.
      </p>
      <p>
        L'Utilisateur sera informé de toute modification substantielle par une
        notification dans l'Application ou par voie électronique. La poursuite
        de l'utilisation de l'Application après notification vaut acceptation de
        la Politique modifiée pour les traitements fondés sur le consentement ou
        l'intérêt légitime. Pour les traitements fondés sur le consentement
        préalable, un nouveau recueil du consentement sera effectué si la
        modification l'exige.
      </p>
      <p>
        Document établi par Cityborn Games SAS — © 2025 — <ContactEmail />
      </p>
    </article>
  );
}
