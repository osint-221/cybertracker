-- Requête pour récupérer toutes les dates des cyberattaques au format DD-MM-AAAA
SELECT id, victim, TO_CHAR(date, 'DD-MM-YYYY') as date_format
FROM cyberattacks
ORDER BY date DESC;

-- OU au format AAAA-MM-DD (ISO)
SELECT id, victim, date
FROM cyberattacks
ORDER BY date DESC;