import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Shield, Globe, Target, TrendingUp, Database, ExternalLink, Map, Calendar, BarChart3, Search } from "lucide-react";
import osint221Logo from "@/assets/osint-221-logo.png";
import cybersentinelLogo from "@/assets/cybersentinel-logo.png";

export const AboutDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" title="À propos de CyberTracker">
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">À propos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            CyberTracker <span className="text-primary">Sénégal</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Stats Banner */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-primary/10 via-destructive/10 to-primary/10 rounded-xl border border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">28</div>
              <div className="text-xs text-muted-foreground">Incidents documentés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">2005-2026</div>
              <div className="text-xs text-muted-foreground">Période couverte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">15+</div>
              <div className="text-xs text-muted-foreground">Pays sources identifiés</div>
            </div>
          </div>

          {/* Mission */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Notre Mission
            </h3>
            <p className="text-sm text-muted-foreground">
              CyberTracker est une plateforme de veille et de cartographie des cybermenaces ciblant le Sénégal. 
              Notre objectif est de sensibiliser les organisations et le grand public aux risques cybernétiques 
              en documentant et visualisant les incidents passés.
            </p>
          </div>

          {/* Fonctionnalités */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Fonctionnalités
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                <Map className="h-5 w-5 text-cyan-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Carte Interactive</div>
                  <div className="text-xs text-muted-foreground">Visualisation géographique des attaques</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                <Calendar className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Timeline</div>
                  <div className="text-xs text-muted-foreground">Filtrage par période chronologique</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                <BarChart3 className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Statistiques</div>
                  <div className="text-xs text-muted-foreground">Analyses et tendances détaillées</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background border">
                <Search className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Recherche Avancée</div>
                  <div className="text-xs text-muted-foreground">Filtres par type, gravité, cible</div>
                </div>
              </div>
            </div>
          </div>

          {/* Partenaires */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Partenaires
            </h3>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30">
                <img 
                  src={osint221Logo} 
                  alt="OSINT-221" 
                  className="h-16 w-auto object-contain"
                />
                <span className="text-sm font-medium text-muted-foreground">OSINT-221</span>
                <Badge variant="outline" className="text-xs">Recherche OSINT</Badge>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/30">
                <img 
                  src={cybersentinelLogo} 
                  alt="CyberSentinel" 
                  className="h-16 w-auto object-contain"
                />
                <span className="text-sm font-medium text-muted-foreground">CyberSentinel</span>
                <Badge variant="outline" className="text-xs">Cybersécurité</Badge>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              Sources de données
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                SciELO Research - Publications académiques
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                Checkpoint / PT Security Analytics - Rapports de threat intelligence
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                Jeune Afrique, Le Monde - Médias internationaux
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                PressAfrik, Seneweb - Médias locaux
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                ZATAZ, Hunters Database - Bases de données spécialisée
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Disclaimer:</strong> Les données présentées sont collectées depuis des sources publiques 
              et peuvent ne pas refléter l'intégralité des incidents. Certaines attaques ne sont pas rendues 
              publiques pour des raisons de sécurité nationale ou commerciale.
            </p>
          </div>

          {/* Version */}
          <div className="text-center text-xs text-muted-foreground">
            Version 1.0.0 • Dernière mise à jour: Mars 2026
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};