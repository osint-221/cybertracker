/**
 * ============================================
 * CyberTracker SN - Base de données complète
 * Projet: jpknalqcncmwmedoypmh
 * ============================================
 * 
 * Instructions:
 * 1. Aller sur https://supabase.com/dashboard/project/jpknalqcncmwmedoypmh
 * 2. Cliquer sur "SQL Editor"
 * 3. Cliquer sur "New query"
 * 4. Copier tout ce code et le coller
 * 5. Cliquer sur "Run" pour exécuter
 * ============================================
 */

-- ============================================
-- CRÉATION DES TABLES
-- ============================================

-- Table principale des cyberattaques
CREATE TABLE IF NOT EXISTS cyberattacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT DEFAULT '',
    victim TEXT NOT NULL,
    attack_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    date TEXT NOT NULL,
    hacker_group TEXT,
    is_active BOOLEAN DEFAULT true,
    impact TEXT,
    description TEXT,
    target_data TEXT,
    lat DECIMAL(10, 6) DEFAULT 14.7167,
    lng DECIMAL(10, 6) DEFAULT -17.4677,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des sources d'information
CREATE TABLE IF NOT EXISTS attack_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attack_id UUID REFERENCES cyberattacks(id) ON DELETE SET NULL,
    source_name TEXT NOT NULL,
    source_type TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des événements d'attaques
CREATE TABLE IF NOT EXISTS attack_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attack_id UUID REFERENCES cyberattacks(id) ON DELETE SET NULL,
    event_date TIMESTAMPTZ NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('alert', 'critical', 'action', 'info', 'success')),
    event_description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des menaces actives
CREATE TABLE IF NOT EXISTS active_threats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    threat_name TEXT NOT NULL,
    threat_level TEXT NOT NULL CHECK (threat_level IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL CHECK (status IN ('active', 'monitoring', 'contained', 'resolved')),
    details TEXT,
    attack_id UUID REFERENCES cyberattacks(id) ON DELETE SET NULL,
    last_update TIMESTAMPTZ DEFAULT NOW()
);

-- Table des posts Twitter
CREATE TABLE IF NOT EXISTS attack_twitter_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attack_id UUID REFERENCES cyberattacks(id) ON DELETE CASCADE,
    post_url TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT,
    post_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des signalements d'incidents
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organisation TEXT NOT NULL,
    incident_date DATE NOT NULL,
    attack_type TEXT DEFAULT 'À catégoriser',
    description TEXT NOT NULL,
    source_url TEXT,
    reporter_email TEXT,
    status TEXT DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_cours', 'traité', 'rejeté')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisateurs admin
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- INSERTION DES DONNÉES
-- ============================================

-- Sources d'information
INSERT INTO attack_sources (source_name, source_type, source_url) VALUES
('SciELO Research', 'news', 'https://scielo.org.za'),
('Le Monde', 'news', 'https://lemonde.fr'),
('Jeune Afrique', 'news', 'https://jeuneafrique.com'),
('PT Security Analytics', 'security', 'https://global.ptsecurity.com'),
('Hunters Database', 'security', 'https://hunters.com'),
('ZATAZ', 'news', 'https://www.zataz.com'),
('PressAfrik', 'news', 'https://www.pressafrik.com'),
('Reuters', 'news', 'https://reuters.com'),
('Le Soleil', 'news', 'https://lesoleil.sn'),
('ANSSI', 'government', 'https://ssi.gouv.fr')
ON CONFLICT DO NOTHING;

-- 28 Cyberattaques réelles au Sénégal
INSERT INTO cyberattacks (name, victim, attack_type, severity, date, hacker_group, impact, description, is_active, lat, lng) VALUES
('', 'Victimes d''arnaques en ligne', 'Phishing/Arnaque', 'élevé', '2005', 'Groupes nigérians', 'Perte > 300 millions FCFA (496 000 USD)', 'Campagnes de phishing ciblant les particuliers et entreprises', true, 14.7167, -17.4677),
('', 'Site du journal Nettali', 'Malware', 'faible', '2008', 'Inconnu', 'Site rendu indisponible', 'Attaque malware ayant rendu le site indisponible', false, 14.7167, -17.4677),
('', 'Société Générale SGBS', 'Défiguration', 'moyen', '2011', 'Islamic Ghosts Team', 'Modification page d''accueil', 'Défiguration du site bancaire', false, 14.7167, -17.4677),
('', 'Wari (transfert d''argent)', 'Intrusion interne', 'moyen', '2012', 'Employé mécontent', 'Vol de 16 millions FCFA (26 000 USD)', 'Fraud by internal employee', false, 14.7167, -17.4677),
('', 'Ministère de l''Économie et Finances', 'Défiguration', 'faible', 'Jan 2014', 'Hackers divers', 'Page d''accueil modifiée', 'Sans perte de données', false, 14.7167, -17.4677),
('', '6 sites gouvernementaux', 'Défiguration', 'moyen', 'Avril 2014', 'Yunus Incredibl (Algérien)', 'Sites altérés', 'Avec messages et images', false, 14.7167, -17.4677),
('', 'Site de l''Agence de l''État', 'Défiguration', 'faible', 'Jan 2015', 'Anonymous', 'Page d''accueil modifiée', 'Représailles suite à interdiction Charlie Hebdo', false, 14.7167, -17.4677),
('', 'La Poste Sénégal', 'Intrusion interne', 'critique', 'Mars 2016', 'Infiltration interne', 'Perte de 411 millions FCFA (680 000 USD)', 'Fraude interne massive', true, 14.7167, -17.4677),
('', 'Plausible attaque WannaCry', 'Ransomware', 'moyen', 'Mai 2017', 'Groupe nord-coréen (attribué)', 'Pas de signalement officiel', 'Attaque mondiale WannaCry', false, 14.7167, -17.4677),
('', 'Plateforme Campusen', 'DDoS', 'moyen', 'Août 2018', 'Inconnu', 'Indisponibilité service', 'Service éducatif hors ligne', false, 14.6925, -17.4467),
('', 'Banque de Dakar', 'Malware', 'élevé', '2019', 'Nigérians et Sénégalais', 'Vol d''environ 18 millionsFCFA', 'Vol via malware bancaire', true, 14.7167, -17.4677),
('', 'École Supérieure Multinationale Télécom', 'Ransomware', 'faible', 'Mars 2019', 'El Profesor', 'Demande rançon 200 USD', 'Fichiers chiffrés', false, 14.6950, -17.4519),
('', 'Transpay', 'Intrusion interne', 'moyen', 'Juin 2020', 'Employé mécontent', 'Perte financière', 'En milliers d''euros', false, 14.7167, -17.4677),
('', 'Banque de l''Habitat Sénégal', 'Fraude', 'élevé', '2020', 'Groupe camerounais', '20,7 millionsFCFA', 'Fraude bancaire', true, 14.7167, -17.4677),
('', 'Presse en ligne PressAfrik', 'DDoS', 'faible', '2021', 'Inconnu', 'Indisponibilité site', 'Attaque contre médias', false, 14.7167, -17.4677),
('', 'Clients Wave, Orange Money', 'Phishing/Arnaque', 'critique', 'Oct 2021', 'Groupe complice + employé', 'Vol de 150 millionsFCFA', 'Arnaque massive mobile money', true, 14.7167, -17.4677),
('', 'Agence pour la Sécurité de la Navigation Aérienne (ASECNA)', 'Ransomware', 'élevé', '18/09/2022', 'LockBit group', '25 000 USD demandés', 'Pas de paiement signalé', true, 14.7298, -17.4000),
('', 'ARTP Régulateur Télécom', 'Extorsion', 'critique', '12/10/2022', 'Groupe Karakurt', 'Vol 149 Go données', 'Publication le 17 oct 2022', true, 14.7167, -17.4677),
('', 'Un site victime d''attaque Nqhd', 'Ransomware', 'moyen', '2022', 'Inconnu', 'Fichiers encryptés', 'Rançon 980 USD', false, 14.7167, -17.4677),
('', 'Gouvernement sénégalais', 'DDoS', 'élevé', '26/05/2023', 'Mysterious Team (Bangladesh)', 'Sites présidence et ministères hors ligne', 'Attaque hacktiviste', true, 14.6937, -17.4440),
('', 'Air Sénégal', 'DDoS', 'moyen', '26/05/2023', 'Mysterious Team', 'Service indisponible', '', false, 14.7298, -17.4000),
('', 'ANACIM (Agence Nationale Aviation)', 'Défiguration', 'faible', 'Août 2023', 'Hacktivistes', 'Page d''accueil modifiée', 'Aucune donnée perdue', false, 14.7167, -17.4677),
('', 'PRODAC Programme agricole', 'Défiguration', 'faible', 'Sept 2023', 'Anonymous', 'Publication d''images', 'Inappropriées', false, 14.7167, -17.4677),
('', 'AGEROUTE (Gestion routes)', 'Ransomware', 'critique', 'Oct 2023', 'LockBit3', 'Données sensibles publiées', 'Non-paiement rançon', true, 14.7167, -17.4677),
('', 'SESAM Informatics', 'Ransomware', 'élevé', 'Sept 2024', 'Hunters', 'Exfiltration et chiffrement', 'Données de santé', true, 14.7167, -17.4677),
('', 'Bank of Africa', 'Ransomware', 'critique', '2024', 'Medusa', 'Attaque bancaire', 'Infrastructure compromise', true, 14.7167, -17.4677),
('', 'DGID (Direction Générale des Impôts)', 'Ransomware', 'critique', '02/10/2025', 'Black Shrantac', '1 To données, rançon 6,5 milliardsFCFA', 'Systèmes paralisés', true, 14.6812, -17.4502),
('', 'Direction de l''Automatisation des Fichiers (DAF)', 'Ransomware', 'critique', '20/01/2026', 'The Green Blood Group', '139 To données biométriques', 'Suspension production pièces identité', true, 14.7167, -17.4677)
ON CONFLICT DO NOTHING;

-- Signalements d'incidents
INSERT INTO incident_reports (organisation, incident_date, attack_type, description, source_url, status) VALUES
('Société XYZ', '2025-03-01', 'Ransomware', 'Serveurs chiffrés, demande de rançon en Bitcoin', 'https://exemple.com', 'en_cours'),
('Université de Dakar', '2025-03-10', 'Phishing', 'Email de phishing ciblant les étudiants', NULL, 'traité'),
('Hopital Principal', '2025-03-15', 'DDoS', 'Site inaccessible, attaque massive', 'https://news.sn', 'nouveau'),
('PME locale', '2025-03-12', 'Intrusion', 'Employé a volé des données clients', NULL, 'traité'),
('Site e-commerce', '2025-03-18', 'Fuite de données', 'Base de données exposée sur dark web', 'https://forum.darkweb.com', 'en_cours')
ON CONFLICT DO NOTHING;

-- Utilisateurs admin
INSERT INTO admin_users (email, password_hash, role, full_name) VALUES
('admin@cybertracker.sn', 'CyberTracker2024!', 'admin', 'Administrateur'),
('editor@cybertracker.sn', 'CyberTracker2024!', 'editor', 'Éditeur')
ON CONFLICT (email) DO NOTHING;

-- Événements d'attaques
INSERT INTO attack_events (attack_id, event_date, event_type, event_description)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DGID%' LIMIT 1),
    '2025-10-02 08:30:00+00',
    'alert',
    'Alerte initiale: Systèmes DGID non accessibles'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DGID%' LIMIT 1) IS NOT NULL;

INSERT INTO attack_events (attack_id, event_date, event_type, event_description)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DGID%' LIMIT 1),
    '2025-10-02 10:00:00+00',
    'critical',
    'Confirmation attaque ransomware - Black Shrantac revendique'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DGID%' LIMIT 1) IS NOT NULL;

INSERT INTO attack_events (attack_id, event_date, event_type, event_description)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DGID%' LIMIT 1),
    '2025-10-02 14:00:00+00',
    'action',
    'Déclenchement du protocole de réponse aux incidents'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DGID%' LIMIT 1) IS NOT NULL;

INSERT INTO attack_events (attack_id, event_date, event_type, event_description)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1),
    '2026-01-20 06:00:00+00',
    'alert',
    'Détection anomalie: Accès inhabituel aux serveurs DAF'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1) IS NOT NULL;

INSERT INTO attack_events (attack_id, event_date, event_type, event_description)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1),
    '2026-01-20 07:30:00+00',
    'critical',
    'Confirmation exfiltration - 139 To compromis'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1) IS NOT NULL;

INSERT INTO attack_events (attack_id, event_date, event_type, event_description)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1),
    '2026-01-20 09:00:00+00',
    'action',
    'Isolement immédiat des systèmes affectés'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1) IS NOT NULL;

INSERT INTO attack_events (attack_id, event_date, event_type, event_description)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1),
    '2026-01-22 10:00:00+00',
    'action',
    'Une enquête est ouverte par les autorités compétentes'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1) IS NOT NULL;

-- Menaces actives
INSERT INTO active_threats (threat_name, threat_level, status, details, attack_id)
SELECT 
    'Exfiltration DAF - 139 To',
    'critical',
    'active',
    'The Green Blood Group menace de publier les données',
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1)
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1) IS NOT NULL;

INSERT INTO active_threats (threat_name, threat_level, status, details)
VALUES
('Campagne phishing institutions financières', 'high', 'active', 'Ciblant les banques sénégalaises'),
('Ransomware LockBit - Menace régionale', 'high', 'monitoring', 'Surveillance variants LockBit'),
('Vulnérabilités serveurs gov', 'medium', 'contained', 'Patch appliqué')
ON CONFLICT DO NOTHING;

-- Posts Twitter
INSERT INTO attack_twitter_posts (attack_id, post_url, author, content, post_date)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1),
    'https://twitter.com/senegalactu/status/19345678901',
    '@senegalactu',
    '🚨 URGENT - DAF victime cyberattaque massive. 139 To exfiltrés',
    '2026-01-20 11:00:00+00'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1) IS NOT NULL;

INSERT INTO attack_twitter_posts (attack_id, post_url, author, content, post_date)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1),
    'https://twitter.com/AbdouDialloSN/status/19345678902',
    '@AbdouDialloSN',
    'BREAKING: The Green Blood revendique exfiltration 139 To',
    '2026-01-20 12:30:00+00'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1) IS NOT NULL;

INSERT INTO attack_twitter_posts (attack_id, post_url, author, content, post_date)
SELECT 
    (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1),
    'https://twitter.com/secsn/status/19345678903',
    '@secsn',
    '🔴 ALERTE CRITIQUE - Attaque systèmes état civil',
    '2026-01-21 09:00:00+00'
WHERE (SELECT id FROM cyberattacks WHERE victim LIKE '%DAF%' LIMIT 1) IS NOT NULL;

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attack_events_attack_id ON attack_events(attack_id);
CREATE INDEX IF NOT EXISTS idx_attack_events_event_date ON attack_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_active_threats_status ON active_threats(status);
CREATE INDEX IF NOT EXISTS idx_active_threats_threat_level ON active_threats(threat_level);
CREATE INDEX IF NOT EXISTS idx_attack_twitter_posts_attack_id ON attack_twitter_posts(attack_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE cyberattacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attack_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE attack_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE attack_twitter_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Politiques pour toutes les tables
CREATE POLICY "cyberattacks_select" ON cyberattacks FOR SELECT USING (true);
CREATE POLICY "cyberattacks_insert" ON cyberattacks FOR INSERT WITH CHECK (true);
CREATE POLICY "cyberattacks_update" ON cyberattacks FOR UPDATE USING (true);
CREATE POLICY "cyberattacks_delete" ON cyberattacks FOR DELETE USING (true);

CREATE POLICY "attack_sources_select" ON attack_sources FOR SELECT USING (true);
CREATE POLICY "attack_sources_insert" ON attack_sources FOR INSERT WITH CHECK (true);
CREATE POLICY "attack_sources_update" ON attack_sources FOR UPDATE USING (true);
CREATE POLICY "attack_sources_delete" ON attack_sources FOR DELETE USING (true);

CREATE POLICY "attack_events_select" ON attack_events FOR SELECT USING (true);
CREATE POLICY "attack_events_insert" ON attack_events FOR INSERT WITH CHECK (true);
CREATE POLICY "attack_events_update" ON attack_events FOR UPDATE USING (true);
CREATE POLICY "attack_events_delete" ON attack_events FOR DELETE USING (true);

CREATE POLICY "active_threats_select" ON active_threats FOR SELECT USING (true);
CREATE POLICY "active_threats_insert" ON active_threats FOR INSERT WITH CHECK (true);
CREATE POLICY "active_threats_update" ON active_threats FOR UPDATE USING (true);
CREATE POLICY "active_threats_delete" ON active_threats FOR DELETE USING (true);

CREATE POLICY "attack_twitter_posts_select" ON attack_twitter_posts FOR SELECT USING (true);
CREATE POLICY "attack_twitter_posts_insert" ON attack_twitter_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "attack_twitter_posts_update" ON attack_twitter_posts FOR UPDATE USING (true);
CREATE POLICY "attack_twitter_posts_delete" ON attack_twitter_posts FOR DELETE USING (true);

CREATE POLICY "incident_reports_select" ON incident_reports FOR SELECT USING (true);
CREATE POLICY "incident_reports_insert" ON incident_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "incident_reports_update" ON incident_reports FOR UPDATE USING (true);
CREATE POLICY "incident_reports_delete" ON incident_reports FOR DELETE USING (true);

CREATE POLICY "admin_users_select" ON admin_users FOR SELECT USING (true);
CREATE POLICY "admin_users_insert" ON admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_users_update" ON admin_users FOR UPDATE USING (true);
CREATE POLICY "admin_users_delete" ON admin_users FOR DELETE USING (true);
