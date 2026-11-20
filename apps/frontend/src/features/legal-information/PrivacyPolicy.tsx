import { View } from 'tamagui';
import ContactEmail from './ContactEmail';
import {
  LegalDocument,
  LegalDocumentTitle,
  LegalDocumentVersion,
  LegalFact,
  LegalFacts,
  LegalHeading,
  LegalList,
  LegalListItem,
  LegalParagraph,
} from './LegalText';

export default function PrivacyPolicy() {
  return (
    <LegalDocument id="privacy-policy" aria-labelledby="privacy-policy-title">
      <LegalDocumentTitle id="privacy-policy-title">
        Politique de confidentialité
      </LegalDocumentTitle>
      <LegalDocumentVersion>
        Cityborn Games — Version 1.0 — 2025
      </LegalDocumentVersion>
      <LegalParagraph>
        Traitement des données personnelles — Application Cityborn
      </LegalParagraph>
      <LegalHeading>PRÉAMBULE</LegalHeading>
      <LegalParagraph>
        La présente Politique de Confidentialité a pour objet d'informer les
        Utilisateurs de l'application mobile Cityborn (ci-après l'« Application
        ») sur la manière dont Cityborn Games collecte, utilise, conserve et
        protège leurs données à caractère personnel, conformément au Règlement
        (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016
        (ci-après le « RGPD ») et à la loi n° 78-17 du 6 janvier 1978 modifiée
        relative à l'informatique, aux fichiers et aux libertés.
      </LegalParagraph>
      <LegalParagraph>
        Cityborn Games s'engage à traiter les données personnelles de ses
        Utilisateurs avec le plus haut niveau de confidentialité et de sécurité,
        et à respecter en toutes circonstances les droits fondamentaux des
        personnes concernées.
      </LegalParagraph>
      <LegalHeading>
        ARTICLE 1 – IDENTITÉ DU RESPONSABLE DE TRAITEMENT
      </LegalHeading>
      <LegalParagraph>
        Le responsable du traitement des données personnelles collectées via
        l'Application est :
      </LegalParagraph>
      <LegalFacts>
        <LegalFact term="Dénomination">Cityborn Games SAS</LegalFact>
        <LegalFact term="SIREN">101640894</LegalFact>
        <LegalFact term="Contact RGPD">
          <ContactEmail />
        </LegalFact>
        <LegalFact term="Représentant légal">
          Charles DESHAIES, Président
        </LegalFact>
      </LegalFacts>
      <LegalHeading>ARTICLE 2 – DONNÉES COLLECTÉES ET TRAITEMENTS</LegalHeading>
      <LegalParagraph>
        Le tableau ci-après récapitule l'ensemble des données à caractère
        personnel traitées par Cityborn Games, leurs finalités, leur base légale
        et leur durée de conservation.
      </LegalParagraph>
      <View gap="2">
        <LegalFacts title="Données d'identification (pseudonyme, identifiant de compte)">
          <LegalFact term="Finalité">
            Création et gestion du Compte utilisateur
          </LegalFact>
          <LegalFact term="Base légale">
            Exécution du contrat (art. 6.1.b RGPD)
          </LegalFact>
          <LegalFact term="Destinataires">Cityborn Games (interne)</LegalFact>
          <LegalFact term="Durée">Durée du Compte + 5 ans</LegalFact>
        </LegalFacts>
        <LegalFacts title="Adresse email">
          <LegalFact term="Finalité">
            Authentification, notifications, support client
          </LegalFact>
          <LegalFact term="Base légale">
            Exécution du contrat / Intérêt légitime
          </LegalFact>
          <LegalFact term="Destinataires">
            Cityborn Games, prestataire email (ex. Brevo)
          </LegalFact>
          <LegalFact term="Durée">Durée du Compte + 3 ans</LegalFact>
        </LegalFacts>
        <LegalFacts title="Données de jeu (progression, scores, achats virtuels, sessions)">
          <LegalFact term="Finalité">
            Fonctionnement du jeu, sauvegarde, statistiques
          </LegalFact>
          <LegalFact term="Base légale">Exécution du contrat</LegalFact>
          <LegalFact term="Destinataires">
            Cityborn Games, hébergeur (ex. AWS/GCP)
          </LegalFact>
          <LegalFact term="Durée">Durée du Compte + 2 ans</LegalFact>
        </LegalFacts>
        <LegalFacts title="Données de transaction (montant, date, identifiant Apple/Google)">
          <LegalFact term="Finalité">
            Gestion des achats in-app, comptabilité, litiges
          </LegalFact>
          <LegalFact term="Base légale">
            Exécution du contrat / Obligation légale
          </LegalFact>
          <LegalFact term="Destinataires">
            Cityborn Games, plateforme de paiement Apple/Google
          </LegalFact>
          <LegalFact term="Durée">10 ans (archives comptables)</LegalFact>
        </LegalFacts>
        <LegalFacts title="Identifiants techniques (Device ID, IP, IDFA/GAID avec consentement)">
          <LegalFact term="Finalité">
            Analytics, détection de fraude, amélioration produit
          </LegalFact>
          <LegalFact term="Base légale">
            Consentement (art. 6.1.a RGPD) / Intérêt légitime
          </LegalFact>
          <LegalFact term="Destinataires">
            Cityborn Games, outil analytics (ex. Firebase)
          </LegalFact>
          <LegalFact term="Durée">13 mois glissants</LegalFact>
        </LegalFacts>
        <LegalFacts title="Données de communication (messages support)">
          <LegalFact term="Finalité">
            Traitement des demandes et réclamations
          </LegalFact>
          <LegalFact term="Base légale">Intérêt légitime</LegalFact>
          <LegalFact term="Destinataires">
            Cityborn Games (support interne)
          </LegalFact>
          <LegalFact term="Durée">3 ans après clôture du ticket</LegalFact>
        </LegalFacts>
      </View>
      <LegalParagraph>
        Cityborn Games s'engage à ne collecter que les données strictement
        nécessaires aux finalités décrites et à ne pas traiter ces données à
        d'autres fins incompatibles avec celles indiquées.
      </LegalParagraph>
      <LegalHeading>ARTICLE 3 – BASE LÉGALE DES TRAITEMENTS</LegalHeading>
      <LegalParagraph>
        Conformément à l'article 6 du RGPD, chaque traitement est fondé sur
        l'une des bases légales suivantes :
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          Exécution du contrat (art. 6.1.b) : traitements nécessaires à la
          fourniture du service, notamment la gestion du Compte, la sauvegarde
          de la progression et la gestion des achats ;
        </LegalListItem>
        <LegalListItem>
          Consentement (art. 6.1.a) : traitements soumis à consentement
          préalable, notamment les identifiants publicitaires (IDFA sur iOS,
          GAID sur Android), les cookies analytiques non essentiels et toute
          communication marketing ;
        </LegalListItem>
        <LegalListItem>
          Obligation légale (art. 6.1.c) : conservation des données comptables
          et de transaction, conformément aux obligations légales applicables
          (article L. 123-22 du Code de commerce) ;
        </LegalListItem>
        <LegalListItem>
          Intérêt légitime (art. 6.1.f) : traitements à des fins de détection de
          fraude, de sécurité du service et d'amélioration de l'expérience
          utilisateur, sous réserve que cet intérêt ne prévale pas sur les
          droits et libertés fondamentaux des personnes concernées.
        </LegalListItem>
      </LegalList>
      <LegalHeading>ARTICLE 4 – MINEURS</LegalHeading>
      <LegalParagraph>
        L'Application est accessible aux personnes âgées d'au moins treize (13)
        ans. Cityborn Games ne collecte pas sciemment les données personnelles
        d'enfants de moins de treize (13) ans.
      </LegalParagraph>
      <LegalParagraph>
        Pour les Utilisateurs âgés de treize (13) à quinze (15) ans résidant en
        France, le traitement des données fondé sur le consentement requiert
        l'autorisation préalable du titulaire de l'autorité parentale,
        conformément à l'article 7-1 de la loi n° 78-17 modifiée. Cityborn Games
        met en place un mécanisme de recueil du consentement parental lors de la
        création du Compte par un utilisateur déclarant avoir moins de quinze
        (15) ans.
      </LegalParagraph>
      <LegalParagraph>
        Si Cityborn Games venait à avoir connaissance qu'elle a collecté des
        données d'un enfant de moins de treize (13) ans sans consentement
        parental valable, elle procéderait à la suppression immédiate de ces
        données et du Compte concerné.
      </LegalParagraph>
      <LegalHeading>ARTICLE 5 – DROITS DES PERSONNES CONCERNÉES</LegalHeading>
      <LegalParagraph>
        Conformément au RGPD, tout Utilisateur dispose des droits suivants sur
        ses données personnelles :
      </LegalParagraph>
      <LegalFacts>
        <LegalFact term="Droit d'accès">
          Obtenir la confirmation que des données vous concernant sont traitées
          et en recevoir une copie (art. 15 RGPD).
        </LegalFact>
        <LegalFact term="Droit de rectification">
          Faire corriger toute donnée inexacte ou incomplète vous concernant
          (art. 16 RGPD).
        </LegalFact>
        <LegalFact term="Droit à l'effacement">
          Demander la suppression de vos données dans les cas prévus par la loi
          (art. 17 RGPD). Ce droit peut être exercé via la fonctionnalité «
          Supprimer mon compte » de l'Application.
        </LegalFact>
        <LegalFact term="Droit à la portabilité">
          Recevoir vos données dans un format structuré, couramment utilisé et
          lisible par machine, et les transmettre à un autre responsable de
          traitement (art. 20 RGPD).
        </LegalFact>
        <LegalFact term="Droit d'opposition">
          Vous opposer au traitement de vos données fondé sur l'intérêt
          légitime, notamment à des fins de prospection commerciale (art. 21
          RGPD).
        </LegalFact>
        <LegalFact term="Droit à la limitation">
          Demander la limitation du traitement dans les cas prévus à l'article
          18 du RGPD.
        </LegalFact>
        <LegalFact term="Retrait du consentement">
          Retirer à tout moment votre consentement pour les traitements qui en
          sont fondés, sans que cela ne remette en cause la licéité des
          traitements effectués avant le retrait.
        </LegalFact>
      </LegalFacts>
      <LegalParagraph>
        Pour exercer l'un de ces droits, l'Utilisateur peut adresser sa demande
        à l'adresse : <ContactEmail />. Cityborn Games s'engage à répondre à
        toute demande dans un délai maximum de trente (30) jours suivant la
        réception. En cas de demande complexe ou multiple, ce délai peut être
        prolongé de deux (2) mois supplémentaires, l'Utilisateur en étant
        informé.
      </LegalParagraph>
      <LegalParagraph>
        En cas de réponse insatisfaisante ou d'absence de réponse dans le délai
        imparti, l'Utilisateur a le droit d'introduire une réclamation auprès de
        la Commission Nationale de l'Informatique et des Libertés (CNIL) —
        www.cnil.fr — ou auprès de toute autre autorité de contrôle compétente
        dans son État membre de résidence.
      </LegalParagraph>
      <LegalHeading>
        ARTICLE 6 – COOKIES ET TECHNOLOGIES SIMILAIRES
      </LegalHeading>
      <LegalParagraph>
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
      </LegalParagraph>
      <LegalHeading>ARTICLE 7 – SÉCURITÉ DES DONNÉES</LegalHeading>
      <LegalParagraph>
        Cityborn Games met en œuvre les mesures techniques et organisationnelles
        appropriées pour protéger les données personnelles des Utilisateurs
        contre tout accès non autorisé, toute divulgation, altération ou
        destruction accidentelle ou illicite, conformément à l'article 32 du
        RGPD. Ces mesures incluent notamment :
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          le chiffrement des données en transit (protocole TLS/HTTPS) ;
        </LegalListItem>
        <LegalListItem>
          le contrôle d'accès strict aux systèmes de traitement des données ;
        </LegalListItem>
        <LegalListItem>
          la mise en œuvre d'une politique de gestion des incidents de sécurité
          ;
        </LegalListItem>
        <LegalListItem>
          la réalisation régulière d'audits et de tests de sécurité.
        </LegalListItem>
      </LegalList>
      <LegalParagraph>
        En cas de violation de données personnelles susceptible d'engendrer un
        risque pour les droits et libertés des Utilisateurs, Cityborn Games
        notifiera l'autorité de contrôle compétente (CNIL) dans les 72 heures
        suivant la prise de connaissance de la violation, conformément à
        l'article 33 du RGPD. Si la violation est susceptible d'engendrer un
        risque élevé pour les personnes concernées, ces dernières en seront
        informées sans délai injustifié.
      </LegalParagraph>
      <LegalHeading>ARTICLE 8 – DURÉE DE CONSERVATION</LegalHeading>
      <LegalParagraph>
        Les données personnelles sont conservées pour la durée strictement
        nécessaire aux finalités pour lesquelles elles ont été collectées,
        telles que définies à l'article 2, et en tout état de cause dans le
        respect des prescriptions légales applicables. À l'expiration de la
        durée de conservation, les données sont soit supprimées de manière
        sécurisée, soit anonymisées de façon irréversible à des fins
        statistiques.
      </LegalParagraph>
      <LegalHeading>
        ARTICLE 9 – MODIFICATIONS DE LA PRÉSENTE POLITIQUE
      </LegalHeading>
      <LegalParagraph>
        Cityborn Games se réserve le droit de modifier la présente Politique de
        Confidentialité à tout moment, notamment en cas de modification des
        traitements mis en œuvre, d'évolution réglementaire ou
        jurisprudentielle. La version applicable est celle en vigueur au moment
        de l'utilisation de l'Application.
      </LegalParagraph>
      <LegalParagraph>
        L'Utilisateur sera informé de toute modification substantielle par une
        notification dans l'Application ou par voie électronique. La poursuite
        de l'utilisation de l'Application après notification vaut acceptation de
        la Politique modifiée pour les traitements fondés sur le consentement ou
        l'intérêt légitime. Pour les traitements fondés sur le consentement
        préalable, un nouveau recueil du consentement sera effectué si la
        modification l'exige.
      </LegalParagraph>
      <LegalParagraph>
        Document établi par Cityborn Games SAS — © 2025 — <ContactEmail />
      </LegalParagraph>
    </LegalDocument>
  );
}
