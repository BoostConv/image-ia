import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GlobalSettingsPage() {
  const apiKeySet = !!process.env.NANO_BANANA_API_KEY;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Parametres globaux</h1>
        <p className="text-sm text-muted-foreground">
          Configuration de l'API et parametres generaux
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Nano Banana PRO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Statut</span>
            <Badge variant={apiKeySet ? "default" : "destructive"}>
              {apiKeySet ? "Connecte" : "Non configure"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Modele</span>
            <span className="text-sm text-muted-foreground font-mono">
              gemini-3-pro-image-preview
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Cout estime</span>
            <span className="text-sm text-muted-foreground">
              ~$0.134 / image
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
