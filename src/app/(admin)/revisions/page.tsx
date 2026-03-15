export const dynamic = "force-dynamic";

import { getPendingRevisions } from "@/lib/db/queries/revisions";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { RevisionsClient } from "./revisions-client";

export default async function RevisionsPage() {
  const revisions = await getPendingRevisions();

  const pending = revisions.filter((r) => r.status === "pending");
  const completed = revisions.filter((r) => r.status === "completed");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demandes de revision</h1>
        <p className="text-sm text-muted-foreground">
          Revisions demandees par les clients via les liens de partage
        </p>
      </div>

      {revisions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Aucune demande de revision
          </h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Les demandes de revision des clients apparaitront ici
          </p>
        </Card>
      ) : (
        <RevisionsClient pending={pending} completed={completed} />
      )}
    </div>
  );
}
