export type Locale = 'en' | 'fr';

export const DEFAULT_LOCALE: Locale = 'en';

interface AuthCopy {
  layoutSubtitle: string;
  login: {
    title: string;
    emailLabel: string;
    passwordLabel: string;
    rememberMe: string;
    submit: string;
    noAccount: string;
    signUp: string;
    loginFailed: string;
    welcomeBackToast: string;
    genericError: string;
  };
  register: {
    title: string;
    firstNameLabel: string;
    lastNameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    organizationNameLabel: string;
    passwordHelper: string;
    submit: string;
    hasAccount: string;
    signIn: string;
    errors: {
      firstNameRequired: string;
      lastNameRequired: string;
      validEmailRequired: string;
      passwordMinLength: string;
      organizationNameRequired: string;
      fixFormErrors: string;
      registrationFailed: string;
      accountCreated: string;
      genericError: string;
    };
  };
}

interface HomeCopy {
  nav: {
    signIn: string;
    getStarted: string;
  };
  hero: {
    titlePrefix: string;
    titleHighlight: string;
    titleSuffix: string;
    description: string;
    startTrial: string;
    learnMore: string;
  };
  features: {
    sectionTitle: string;
    cards: Array<{
      title: string;
      description: string;
    }>;
  };
  pricing: {
    sectionTitle: string;
    monthlySuffix: string;
    mostPopular: string;
    tiers: {
      starter: {
        name: string;
        subtitle: string;
        cta: string;
        features: string[];
      };
      professional: {
        name: string;
        subtitle: string;
        cta: string;
        features: string[];
      };
      enterprise: {
        name: string;
        subtitle: string;
        cta: string;
        features: string[];
      };
    };
  };
  cta: {
    title: string;
    description: string;
    button: string;
  };
  footer: {
    rights: string;
  };
}

interface Dictionary {
  auth: AuthCopy;
  home: HomeCopy;
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    auth: {
      layoutSubtitle: 'Create stunning 360° virtual tours',
      login: {
        title: 'Welcome Back',
        emailLabel: 'Email',
        passwordLabel: 'Password',
        rememberMe: 'Remember me',
        submit: 'Sign In',
        noAccount: "Don't have an account?",
        signUp: 'Sign up',
        loginFailed: 'Login failed',
        welcomeBackToast: 'Welcome back!',
        genericError: 'An error occurred. Please try again.',
      },
      register: {
        title: 'Create Account',
        firstNameLabel: 'First Name',
        lastNameLabel: 'Last Name',
        emailLabel: 'Email',
        passwordLabel: 'Password',
        organizationNameLabel: 'Organization Name',
        passwordHelper: 'At least 8 characters',
        submit: 'Create Account',
        hasAccount: 'Already have an account?',
        signIn: 'Sign in',
        errors: {
          firstNameRequired: 'First name is required',
          lastNameRequired: 'Last name is required',
          validEmailRequired: 'Valid email is required',
          passwordMinLength: 'Password must be at least 8 characters',
          organizationNameRequired: 'Organization name is required',
          fixFormErrors: 'Please fix the errors below',
          registrationFailed: 'Registration failed',
          accountCreated: 'Account created! Welcome to BATIVY',
          genericError: 'An error occurred. Please try again.',
        },
      },
    },
    home: {
      nav: {
        signIn: 'Sign In',
        getStarted: 'Get Started',
      },
      hero: {
        titlePrefix: 'Create Stunning',
        titleHighlight: '360 Virtual Tours',
        titleSuffix: 'in Minutes',
        description:
          'BATIVY makes it easy to create, customize, and share immersive 360° virtual tours. Perfect for real estate, hospitality, tourism, and more.',
        startTrial: 'Start Free Trial',
        learnMore: 'Learn More',
      },
      features: {
        sectionTitle: 'Powerful Features',
        cards: [
          {
            title: 'Easy Upload',
            description:
              'Upload 360° images with a simple drag-and-drop interface. Support for multiple formats.',
          },
          {
            title: 'Interactive Editor',
            description:
              'Add hotspots, links, and information points to create immersive experiences.',
          },
          {
            title: 'Share Anywhere',
            description:
              'Generate shareable links and embed code. Perfect for websites and social media.',
          },
          {
            title: 'Team Collaboration',
            description:
              'Invite team members and work together on projects in real-time.',
          },
        ],
      },
      pricing: {
        sectionTitle: 'Simple Pricing',
        monthlySuffix: '/month',
        mostPopular: 'Most Popular',
        tiers: {
          starter: {
            name: 'Free',
            subtitle: 'Perfect for getting started',
            cta: 'Start Free Trial',
            features: [
              '1 Virtual Tour',
              '10 Scenes per Tour',
              '15-Day Free Trial',
            ],
          },
          professional: {
            name: 'Professional',
            subtitle: 'For growing teams',
            cta: 'Get Started',
            features: [
              '5 to Unlimited Virtual Tours',
              'Multiple Scenes per Tour',
              'Team Members (1 to Unlimited)',
     
            ],
          },
          enterprise: {
            name: 'Enterprise',
            subtitle: 'For large scale operations',
            cta: 'Request a Quote',
            features: [
              'Unlimited Tours',
              'Unlimited Scenes',
              'Unlimited Team Members',
              'Custom Integrations',
          
            ],
          },
        },
      },
      cta: {
        title: 'Ready to Create Your First Tour?',
        description: 'Start your 14-day free trial today. No credit card required.',
        button: 'Start Free Trial',
      },
      footer: {
        rights: 'All rights reserved.',
      },
    },
  },
  fr: {
    auth: {
      layoutSubtitle: 'Creez des visites virtuelles 360° impressionnantes',
      login: {
        title: 'Bon retour',
        emailLabel: 'Email',
        passwordLabel: 'Mot de passe',
        rememberMe: 'Se souvenir de moi',
        submit: 'Se connecter',
        noAccount: "Vous n'avez pas de compte ?",
        signUp: "S'inscrire",
        loginFailed: 'Connexion echouee',
        welcomeBackToast: 'Content de vous revoir !',
        genericError: 'Une erreur est survenue. Veuillez reessayer.',
      },
      register: {
        title: 'Creer un compte',
        firstNameLabel: 'Prenom',
        lastNameLabel: 'Nom',
        emailLabel: 'Email',
        passwordLabel: 'Mot de passe',
        organizationNameLabel: "Nom de l'organisation",
        passwordHelper: 'Au moins 8 caracteres',
        submit: 'Creer un compte',
        hasAccount: 'Vous avez deja un compte ?',
        signIn: 'Se connecter',
        errors: {
          firstNameRequired: 'Le prenom est obligatoire',
          lastNameRequired: 'Le nom est obligatoire',
          validEmailRequired: 'Un email valide est obligatoire',
          passwordMinLength: 'Le mot de passe doit contenir au moins 8 caracteres',
          organizationNameRequired: "Le nom de l'organisation est obligatoire",
          fixFormErrors: 'Veuillez corriger les erreurs ci-dessous',
          registrationFailed: "L'inscription a echoue",
          accountCreated: 'Compte cree ! Bienvenue sur BATIVY',
          genericError: 'Une erreur est survenue. Veuillez reessayer.',
        },
      },
    },
    home: {
      nav: {
        signIn: 'Connexion',
        getStarted: 'Commencer',
      },
      hero: {
        titlePrefix: 'Creez des',
        titleHighlight: 'visites virtuelles 360°',
        titleSuffix: 'en quelques minutes',
        description:
          "BATIVY vous permet de creer, personnaliser et partager facilement des visites virtuelles 360° immersives. Ideal pour l'immobilier, l'hotellerie, le tourisme et plus encore.",
        startTrial: "Demarrer l'essai gratuit",
        learnMore: 'En savoir plus',
      },
      features: {
        sectionTitle: 'Fonctionnalites puissantes',
        cards: [
          {
            title: 'Import simplifie',
            description:
              "Importez vos images 360° avec une interface glisser-deposer simple. Prise en charge de plusieurs formats.",
          },
          {
            title: 'Editeur interactif',
            description:
              'Ajoutez des hotspots, des liens et des points dinformation pour creer des experiences immersives.',
          },
          {
            title: 'Partage partout',
            description:
              'Generez des liens partageables et du code dembarquement. Parfait pour les sites web et les reseaux sociaux.',
          },
          {
            title: "Collaboration d'equipe",
            description:
              'Invitez des membres et collaborez en temps reel sur vos projets.',
          },
        ],
      },
      pricing: {
        sectionTitle: 'Tarifs simples',
        monthlySuffix: '/mois',
        mostPopular: 'Le plus populaire',
        tiers: {
          starter: {
            name: 'Gratuit',
            subtitle: 'Parfait pour debuter',
            cta: 'Demarrer l\'essai gratuit',
            features: [
              '1 visite virtuelle',
              '10 scenes par visite',
              'Essai gratuit de 15 jours',
            ],
          },
          professional: {
            name: 'Professional',
            subtitle: 'Pour les equipes en croissance',
            cta: 'Commencer',
            features: [
              '5 à illimites de visites virtuelles',
              'Plusieurs scenes par visite',
              'De 1 à illimites de membres d\'equipe',
         
            ],
          },
          enterprise: {
            name: 'Enterprise',
            subtitle: 'Pour les operations a grande echelle',
            cta: 'Demander un devis',
            features: [
              'Visites illimitees',
              'Scenes illimitees',
              'Equipe illimitee',
              'Integrations personnalisees',
            ],
          },
        },
      },
      cta: {
        title: 'Pret a creer votre premiere visite ?',
        description: "Demarrez votre essai gratuit de 14 jours. Aucune carte bancaire requise.",
        button: "Demarrer l'essai gratuit",
      },
      footer: {
        rights: 'Tous droits reserves.',
      },
    },
  },
};
