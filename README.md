# CyberTracker SN

> Cartographie des cyberattaques vérifiées et sourcées au Sénégal

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-Actif-green.svg)](#)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](#)

---

## Présentation

**CyberTracker SN** est une plateforme de suivi et de cartographie des cyberattaques ciblant le Sénégal. Elle permet de visualiser, analyser et documenter les incidents cybernétiques qui affectent les institutions gouvernementales, les entreprises et les citoyens.

### Fonctionnalités principales

- **Cartographie interactive** - Visualisation des attaques sur une carte interactive avec origine/destination des menaces
- **Timeline dynamique** - Chronologie des événements avec filtrage par année et niveau de gravité
- **Couverture médiatique** - Agrégation des sources d'information et réseaux sociaux
- **Tableau de bord admin** - Interface d'administration pour la gestion des données
- **Signalement d'incidents** - Formulaire de signalement pour les organisations victimes

---

## Stack technique

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Langage typé
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Composants UI
- **Mapbox GL** - Cartographie interactive
- **Recharts** - Visualisation de données
- **Vite** - Build tool

### Backend
- **Supabase** - Base de données PostgreSQL
- **Authentication** - Gestion des utilisateurs

---

## Installation

```bash
# Cloner le repository
git clone https://github.com/osint-221/cybertracker.git

# Naviguer dans le dossier
cd cybertracker

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

---

## Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine du projet:

```env
VITE_SUPABASE_URL=votre_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=votre_cle_publique
VITE_MAPBOX_TOKEN=votre_token_mapbox
```

### Base de données

Le fichier `scripts/data.sql` contient toutes les requêtes SQL pour initialiser les tables et insérer les données.

1. Créer un projet [Supabase](https://supabase.com)
2. Exécuter le script SQL dans l'éditeur Supabase
3. Configurer les variables d'environnement

---

## Structure du projet

```
├── public/                 # Fichiers statiques
├── scripts/               # Scripts SQL
├── src/
│   ├── components/       # Composants React
│   │   ├── admin/       # Composants admin
│   │   └── ui/         # Composants UI (shadcn)
│   ├── data/            # Données statiques
│   ├── hooks/           # Hooks React
│   ├── integrations/    # Intégrations (Supabase)
│   ├── lib/            # Utilitaires
│   └── pages/          # Pages principales
├── supabase/            # Migrations Supabase
└── Configuration
    ├── tailwind.config.ts
    ├── vite.config.ts
    └── tsconfig.json
```

---

## Contribution

Les contributions sont les bienvenues! Veuillez lire [CONTRIBUTING.md](./CONTRIBUTING.md) pour plus de détails.

---

## Licence

MIT License - voir [LICENSE](./LICENSE) pour plus de détails.

---

## Auteurs

**OSINT-221** - [https://osint-221.com](https://osint-221.com)
> Organisation de recherche en source ouverte spécialisée dans la cybersécurité et la veille des menaces numériques en Afrique de l'Ouest.

---

## Remerciements

- [ANSSI](https://ssi.gouv.fr) - Agence nationale de la sécurité des systèmes d'information
- [CERT-SN](https://cert.sn) - Centre d'opérations de réponse aux urgences informatiques du Sénégal
- [PressAfrik](https://www.pressafrik.com) - Média d'investigation

---

## Contact

Pour toute question ou suggestion:
- Email: contact@osint-221.com
- Twitter: [@OSINT221](https://twitter.com/OSINT221)

---

<p align="center">
  <sub>Propulsé par OSINT-221 | Surveillance active des cybermenaces au Sénégal</sub>
</p>
