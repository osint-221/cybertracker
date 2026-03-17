-- =============================================================================
-- Script pour uniformiser le format des dates dans la table cyberattacks
-- Problème: Les dates sont dans plusieurs formats text ("2015", "Sept 2024", "20/01/2026")
-- Solution: Convertir toutes les dates au format YYYY-MM-DD puis changer le type
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- Étape 1: Convertir toutes les dates en utilisant la colonne year
-- -----------------------------------------------------------------------------
UPDATE cyberattacks
SET date = TO_CHAR(year, '9999') || '-01-01'
WHERE year IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Étape 2: Vérifier les dates avant conversion du type
-- -----------------------------------------------------------------------------
SELECT id, victim, date, year FROM cyberattacks ORDER BY date DESC LIMIT 15;

-- -----------------------------------------------------------------------------
-- Étape 3: Changer le type de la colonne date de text à date
-- -----------------------------------------------------------------------------
ALTER TABLE cyberattacks
ALTER COLUMN date TYPE DATE
USING date::DATE;

-- -----------------------------------------------------------------------------
-- Étape 4: Vérifier que le type a bien changé
-- -----------------------------------------------------------------------------
SELECT id, victim, date, year FROM cyberattacks ORDER BY date DESC LIMIT 15;

-- -----------------------------------------------------------------------------
-- Vérifier le type de la colonne
-- -----------------------------------------------------------------------------
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cyberattacks' AND column_name = 'date';