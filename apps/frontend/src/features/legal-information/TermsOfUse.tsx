import ContactEmail from './ContactEmail';
import {
  LegalDocument,
  LegalDocumentTitle,
  LegalDocumentVersion,
  LegalHeading,
  LegalLink,
  LegalList,
  LegalListItem,
  LegalParagraph,
  LegalSubheading,
} from './LegalText';

export default function TermsOfUse() {
  return (
    <LegalDocument id="terms-of-use" aria-labelledby="terms-of-use-title">
      <LegalDocumentTitle id="terms-of-use-title">
        Conditions générales d’utilisation
      </LegalDocumentTitle>
      <LegalDocumentVersion>
        Cityborn Games — Version 1.0 — 2025
      </LegalDocumentVersion>
      <LegalParagraph>Application mobile Cityborn</LegalParagraph>
      <LegalHeading>PRÉAMBULE</LegalHeading>
      <LegalParagraph>
        Les présentes Conditions Générales d'Utilisation (ci-après « CGU »)
        régissent l'accès et l'utilisation de l'application mobile et/ou du
        service en ligne Cityborn (ci-après le « Jeu » ou l'« Application »),
        édités par la société Cityborn Games, Société par Actions Simplifiée au
        capital de 19 euros, dont le siège social est situé au 10 Rue de
        Quimper, 35700 Rennes, immatriculée au Registre du Commerce et des
        Sociétés de Rennes sous le numéro SIREN : 101640894 (ci-après « Cityborn
        Games », « la Société » ou « nous »). L'accès au Jeu, la création d'un
        compte utilisateur et l'utilisation de toute fonctionnalité de
        l'Application impliquent l'acceptation pleine, entière et sans réserve
        des présentes CGU. Si vous n'acceptez pas les présentes CGU, vous devez
        immédiatement cesser d'utiliser l'Application. Les présentes CGU peuvent
        être modifiées à tout moment. L'utilisateur sera informé de toute
        modification substantielle par une notification dans l'Application ou
        par voie électronique. La poursuite de l'utilisation de l'Application
        après notification de la modification vaut acceptation des nouvelles
        CGU.
      </LegalParagraph>
      <LegalHeading>ARTICLE 1 – DÉFINITIONS</LegalHeading>
      <LegalParagraph>
        Au sens des présentes CGU, les termes suivants ont la signification qui
        leur est attribuée ci-après : « Application » ou « Jeu » : désigne le
        jeu vidéo mobile Cityborn développé et édité par Cityborn Games,
        accessible sur les plateformes iOS (App Store d'Apple) et Android
        (Google Play Store de Google), ainsi que tout contenu, fonctionnalité,
        mise à jour ou service associé.
      </LegalParagraph>
      <LegalParagraph>
        « Compte » : désigne le compte personnel créé par l'Utilisateur pour
        accéder aux fonctionnalités de l'Application, identifié par un
        identifiant unique et protégé par un mot de passe ou un système
        d'authentification tiers.
      </LegalParagraph>
      <LegalParagraph>
        « Contenu » : désigne l'ensemble des éléments composant l'Application,
        incluant sans limitation les graphismes, textes, sons, musiques,
        animations, personnages, scénarios, codes sources et données.
      </LegalParagraph>
      <LegalParagraph>
        « Données Personnelles » : désigne toute information au sens du
        Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) permettant d'identifier
        directement ou indirectement un Utilisateur.
      </LegalParagraph>
      <LegalParagraph>
        « Monnaie Virtuelle » : désigne tout actif numérique fictif propre à
        l'Application, sans valeur monétaire réelle, ne pouvant être converti en
        monnaie légale, utilisé exclusivement au sein du Jeu.
      </LegalParagraph>
      <LegalParagraph>
        « Utilisateur » : désigne toute personne physique, majeure ou mineure
        sous responsabilité parentale, accédant à l'Application, qu'elle ait
        créé un Compte ou non.
      </LegalParagraph>
      <LegalHeading>ARTICLE 2 – ACCÈS À L'APPLICATION</LegalHeading>
      <LegalSubheading>2.1 – Conditions d'accès</LegalSubheading>
      <LegalParagraph>
        L'Application est accessible gratuitement sur les plateformes iOS et
        Android, sous réserve des conditions tarifaires applicables aux achats
        intégrés définis aux présentes et dans les Conditions Générales de
        Vente. L'Utilisateur est seul responsable des frais de connexion à
        l'Internet et d'utilisation des équipements nécessaires pour accéder à
        l'Application.
      </LegalParagraph>
      <LegalSubheading>2.2 – Création de Compte</LegalSubheading>
      <LegalParagraph>
        La création d'un Compte requiert que l'Utilisateur soit âgé d'au moins
        treize (13) ans. Pour les Utilisateurs âgés de moins de quinze (15) ans
        et résidant en France, la création d'un Compte est conditionnée à
        l'obtention préalable du consentement d'un titulaire de l'autorité
        parentale, conformément à l'article 7-1 de la loi n° 78-17 du 6 janvier
        1978 modifiée.
      </LegalParagraph>
      <LegalParagraph>
        L'Utilisateur s'engage à fournir des informations exactes, complètes et
        à jour lors de la création de son Compte. Tout Compte créé avec des
        informations fausses ou appartenant à un tiers pourra être suspendu ou
        supprimé sans préavis.
      </LegalParagraph>
      <LegalSubheading>2.3 – Sécurité du Compte</LegalSubheading>
      <LegalParagraph>
        L'Utilisateur est seul responsable de la confidentialité de ses
        identifiants de connexion. Toute utilisation du Compte intervenue sous
        ses identifiants est présumée avoir été effectuée par l'Utilisateur
        lui-même. En cas de suspicion de compromission du Compte, l'Utilisateur
        doit en informer sans délai Cityborn Games à l'adresse :{' '}
        <ContactEmail />
      </LegalParagraph>
      <LegalSubheading>2.4 – Disponibilité</LegalSubheading>
      <LegalParagraph>
        Cityborn Games s'efforce d'assurer la disponibilité de l'Application 24
        heures sur 24 et 7 jours sur 7. Toutefois, la Société se réserve le
        droit d'interrompre l'accès pour des opérations de maintenance, de mise
        à jour ou pour toute autre raison technique, sans que cela ne génère de
        droit à indemnisation au profit de l'Utilisateur.
      </LegalParagraph>
      <LegalHeading>ARTICLE 3 – PROPRIÉTÉ INTELLECTUELLE</LegalHeading>
      <LegalSubheading>3.1 – Droits de Cityborn Games</LegalSubheading>
      <LegalParagraph>
        L'Application, son Contenu et tous les éléments la composant (incluant
        sans limitation : le code source, les algorithmes, les graphismes, les
        illustrations, les musiques, les effets sonores, les noms, les
        personnages, les logos, les marques et les interfaces utilisateur) sont
        soit la propriété exclusive de Cityborn Games, soit utilisés avec
        l'autorisation de leurs titulaires respectifs, et sont protégés par le
        droit de la propriété intellectuelle.
      </LegalParagraph>
      <LegalParagraph>
        Certains éléments visuels intégrés à l'Application sont la propriété de
        leurs auteurs respectifs et sont utilisés avec leur autorisation ou dans
        le cadre d'une licence. Ces éléments sont identifiés dans la section
        Crédits de l'Application.
      </LegalParagraph>
      <LegalParagraph>
        La marque Cityborn ainsi que les marques et logos associés à Cityborn
        Games sont des marques déposées. Toute reproduction, imitation ou
        utilisation, totale ou partielle, de ces signes distinctifs sans
        autorisation expresse et préalable de Cityborn Games est interdite.
      </LegalParagraph>
      <LegalSubheading>3.2 – Licence d'utilisation</LegalSubheading>
      <LegalParagraph>
        Cityborn Games concède à l'Utilisateur, pour la durée des présentes et à
        titre personnel, non-exclusif, non-transférable et non-sous-licenciable,
        un droit limité d'accès et d'utilisation de l'Application, exclusivement
        à des fins personnelles et non commerciales. Cette licence ne confère
        aucun droit de propriété sur l'Application ou son Contenu.
      </LegalParagraph>
      <LegalSubheading>3.3 – Interdictions</LegalSubheading>
      <LegalParagraph>
        Il est strictement interdit à l'Utilisateur de :
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          copier, reproduire, modifier, adapter, traduire, décompiler,
          désassembler ou procéder à de l'ingénierie inverse de tout ou partie
          de l'Application ;
        </LegalListItem>
        <LegalListItem>
          commercialiser, distribuer, louer, prêter, sous-licencier ou
          transférer à des tiers tout ou partie de l'Application ou de son
          Contenu ;
        </LegalListItem>
        <LegalListItem>
          créer des œuvres dérivées à partir de l'Application sans autorisation
          écrite préalable de Cityborn Games ;
        </LegalListItem>
        <LegalListItem>
          supprimer, modifier ou contourner toute mention de propriété
          intellectuelle figurant dans l'Application ;
        </LegalListItem>
        <LegalListItem>
          utiliser l'Application à des fins commerciales ou professionnelles
          sans accord préalable de Cityborn Games.
        </LegalListItem>
      </LegalList>
      <LegalHeading>
        ARTICLE 4 – RÈGLES D'UTILISATION ET COMPORTEMENTS PROHIBÉS
      </LegalHeading>
      <LegalSubheading>4.1 – Usage licite</LegalSubheading>
      <LegalParagraph>
        L'Utilisateur s'engage à utiliser l'Application conformément aux
        présentes CGU, aux lois et réglementations en vigueur, et dans le
        respect des droits des tiers et des autres Utilisateurs.
      </LegalParagraph>
      <LegalSubheading>4.2 – Comportements prohibés</LegalSubheading>
      <LegalParagraph>
        Sont strictement interdits, sous peine de suspension ou de suppression
        définitive du Compte, les comportements suivants :
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          utiliser tout logiciel, script, robot, bot, macro, ou tout autre outil
          automatisé visant à modifier, contourner ou automatiser l'expérience
          de jeu (ci-après « cheat », « hack » ou « triche ») ;
        </LegalListItem>
        <LegalListItem>
          exploiter tout bug, faille ou erreur de l'Application à des fins
          d'avantage injustifié, et ne pas signaler à Cityborn Games toute
          anomalie découverte ;
        </LegalListItem>
        <LegalListItem>
          harceler, menacer, insulter ou tenir des propos discriminatoires,
          racistes, homophobes ou autrement offensants à l'égard d'autres
          Utilisateurs ;
        </LegalListItem>
        <LegalListItem>
          tenter d'accéder sans autorisation aux systèmes informatiques de
          Cityborn Games, à d'autres Comptes ou à des données d'autres
          Utilisateurs ;
        </LegalListItem>
        <LegalListItem>
          vendre, acheter, louer ou transférer tout Compte, Monnaie Virtuelle ou
          tout autre actif du Jeu contre de l'argent réel ou contre toute
          contrepartie de valeur, en dehors des mécanismes expressément prévus
          et autorisés par Cityborn Games ;
        </LegalListItem>
        <LegalListItem>
          diffuser dans l'Application tout contenu illicite, obscène,
          pornographique, violents, diffamatoire ou attentatoire à la dignité
          humaine.
        </LegalListItem>
      </LegalList>
      <LegalSubheading>4.3 – Sanctions</LegalSubheading>
      <LegalParagraph>
        En cas de manquement aux présentes CGU, Cityborn Games se réserve le
        droit, sans préavis ni indemnité, de suspendre temporairement ou
        définitivement le Compte de l'Utilisateur concerné, de supprimer le
        Contenu litigieux et, le cas échéant, d'engager toute action judiciaire
        appropriée.
      </LegalParagraph>
      <LegalHeading>
        ARTICLE 5 – CONTENU GÉNÉRÉ PAR LES UTILISATEURS
      </LegalHeading>
      <LegalParagraph>
        Dans l'hypothèse où l'Application permet aux Utilisateurs de créer,
        soumettre ou partager du contenu (pseudonyme, avatar, messages dans des
        espaces communautaires, etc.), l'Utilisateur concède à Cityborn Games, à
        titre gratuit, non-exclusif, mondial et pour la durée légale de
        protection des droits d'auteur, une licence d'utilisation, de
        reproduction, de modification, d'adaptation, de publication et de
        diffusion de ce contenu, aux fins du fonctionnement et de la promotion
        de l'Application.
      </LegalParagraph>
      <LegalParagraph>
        L'Utilisateur garantit être titulaire de tous les droits nécessaires sur
        le contenu qu'il soumet et s'engage à ce que ce contenu ne viole aucun
        droit de tiers ni aucune disposition légale ou réglementaire.
      </LegalParagraph>
      <LegalHeading>
        ARTICLE 6 – PROTECTION DES DONNÉES PERSONNELLES
      </LegalHeading>
      <LegalParagraph>
        Le traitement des Données Personnelles des Utilisateurs est régi par la
        Politique de Confidentialité de Cityborn Games, disponible à l'adresse{' '}
        <LegalLink href="#privacy-policy">
          https://www.cityborn.app/terms-and-policies#privacy-policy
        </LegalLink>{' '}
        et accessible depuis l'Application, laquelle fait partie intégrante des
        présentes CGU. La Politique de Confidentialité décrit notamment les
        données collectées, les finalités du traitement, la base légale
        applicable, les destinataires des données ainsi que les droits dont
        disposent les Utilisateurs.
      </LegalParagraph>
      <LegalParagraph>
        Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6
        janvier 1978 modifiée, l'Utilisateur dispose notamment d'un droit
        d'accès, de rectification, d'effacement, de portabilité et d'opposition
        concernant ses Données Personnelles, qu'il peut exercer à l'adresse :{' '}
        <ContactEmail />.
      </LegalParagraph>
      <LegalHeading>
        ARTICLE 7 – MONNAIE VIRTUELLE ET ACHATS INTÉGRÉS
      </LegalHeading>
      <LegalParagraph>
        Les modalités relatives aux éventuels achats intégrés, à la Monnaie
        Virtuelle et à la monétisation de l'Application sont régies par les
        Conditions Générales de Vente de Cityborn Games, disponibles dans
        l'Application et le site web www.cityborn.app, lesquelles complètent les
        présentes CGU.
      </LegalParagraph>
      <LegalParagraph>
        La Monnaie Virtuelle disponible dans le Jeu est dépourvue de toute
        valeur monétaire réelle, n'est pas convertible en monnaie légale, n'est
        pas remboursable (sauf disposition légale contraire impérative) et ne
        peut faire l'objet d'aucun échange ou transaction entre Utilisateurs en
        dehors des mécanismes expressément autorisés par l'Application.
      </LegalParagraph>
      <LegalHeading>ARTICLE 8 – LIMITATION DE RESPONSABILITÉ</LegalHeading>
      <LegalSubheading>8.1 – Responsabilité de Cityborn Games</LegalSubheading>
      <LegalParagraph>
        Dans les limites autorisées par la loi applicable, Cityborn Games ne
        saurait être tenue responsable de tout dommage indirect, accessoire,
        spécial, punitif ou consécutif résultant de l'utilisation ou de
        l'impossibilité d'utiliser l'Application, y compris la perte de données
        de jeu, de Monnaie Virtuelle ou d'avancement dans le jeu. Cityborn Games
        ne garantit pas que l'Application sera exempte d'erreurs, de bugs ou
        d'interruptions de service. Elle s'engage toutefois à mettre en œuvre
        ses meilleurs efforts pour résoudre tout dysfonctionnement signalé dans
        les meilleurs délais.
      </LegalParagraph>
      <LegalSubheading>8.2 – Responsabilité de l'Utilisateur</LegalSubheading>
      <LegalParagraph>
        L'Utilisateur est seul responsable de l'utilisation qu'il fait de
        l'Application et des conséquences qui en résultent, notamment vis-à-vis
        des tiers. Il assume l'entière responsabilité des contenus qu'il soumet,
        partage ou diffuse via l'Application.
      </LegalParagraph>
      <LegalHeading>ARTICLE 9 – SUSPENSION ET RÉSILIATION</LegalHeading>
      <LegalSubheading>9.1 – Résiliation par l'Utilisateur</LegalSubheading>
      <LegalParagraph>
        L'Utilisateur peut à tout moment résilier son Compte en adressant une
        demande de suppression à l'adresse <ContactEmail /> ou via les
        paramètres de l'Application (rubrique « Supprimer mon compte »). La
        résiliation entraîne la suppression définitive et irréversible du
        Compte, des données de jeu associées et de tout avoir en Monnaie
        Virtuelle non utilisé. Aucun remboursement ne sera accordé du fait de la
        résiliation à l'initiative de l'Utilisateur, sauf disposition légale
        contraire impérative.
      </LegalParagraph>
      <LegalSubheading>9.2 – Résiliation par Cityborn Games</LegalSubheading>
      <LegalParagraph>
        Cityborn Games se réserve le droit de suspendre ou résilier tout Compte
        en cas de violation des présentes CGU, et ce sans préavis ni indemnité.
        En cas de résiliation pour faute grave (notamment triche caractérisée,
        tentative de fraude ou comportements illicites avérés), aucun
        remboursement ne sera accordé.
      </LegalParagraph>
      <LegalSubheading>9.3 – Fermeture du service</LegalSubheading>
      <LegalParagraph>
        Cityborn Games se réserve le droit de mettre fin à l'exploitation de
        l'Application avec un préavis raisonnable communiqué par voie de
        notification dans l'Application ou sur le site internet de la Société.
        En cas de fermeture définitive du service, les modalités de
        remboursement des achats récents seront déterminées conformément à la
        réglementation applicable et aux règles des plateformes de distribution.
      </LegalParagraph>
      <LegalHeading>ARTICLE 10 – DISPOSITIONS DIVERSES</LegalHeading>
      <LegalSubheading>
        10.1 – Droit applicable et juridiction compétente
      </LegalSubheading>
      <LegalParagraph>
        Les présentes CGU sont soumises au droit français. En cas de litige
        relatif à l'interprétation, à la validité ou à l'exécution des
        présentes, les parties s'engagent à rechercher une solution amiable
        avant tout recours judiciaire. À défaut de résolution amiable dans un
        délai de trente (30) jours, tout litige sera soumis à la compétence
        exclusive des tribunaux compétents du ressort de la Cour d'appel de
        Rennes, nonobstant pluralité de défendeurs ou appel en garantie.
      </LegalParagraph>
      <LegalParagraph>
        Conformément à l'article L. 612-1 du Code de la consommation,
        l'Utilisateur ayant la qualité de consommateur a le droit de recourir
        gratuitement à un médiateur de la consommation.
      </LegalParagraph>
      <LegalSubheading>10.2 – Nullité partielle</LegalSubheading>
      <LegalParagraph>
        Si l'une quelconque des stipulations des présentes CGU est déclarée
        nulle ou inapplicable en vertu d'une loi, d'un règlement ou d'une
        décision judiciaire définitive, les autres stipulations demeureront
        pleinement en vigueur.
      </LegalParagraph>
      <LegalSubheading>10.3 – Non-renonciation</LegalSubheading>
      <LegalParagraph>
        Le fait pour Cityborn Games de ne pas se prévaloir à un moment donné
        d'une disposition des présentes CGU ne peut être interprété comme valant
        renonciation à s'en prévaloir ultérieurement.
      </LegalParagraph>
      <LegalSubheading>10.4 – Contact</LegalSubheading>
      <LegalParagraph>
        Pour toute question relative aux présentes CGU, l'Utilisateur peut
        contacter Cityborn Games aux coordonnées suivantes :
      </LegalParagraph>
      <LegalList>
        <LegalListItem>
          Adresse postale : Cityborn Games SAS — 10 Rue de Quimper, 35700 Rennes
        </LegalListItem>
        <LegalListItem>
          Adresse électronique : <ContactEmail />
        </LegalListItem>
      </LegalList>
      <LegalParagraph>
        Document établi par Cityborn Games SAS — © 2025 Tous droits réservés
      </LegalParagraph>
    </LegalDocument>
  );
}
