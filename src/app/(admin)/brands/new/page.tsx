import { BrandWizard } from "@/components/brand/brand-wizard";

export default function NewBrandPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle marque</h1>
        <p className="text-sm text-muted-foreground">
          Configurez l&apos;identite de votre marque pour enrichir
          automatiquement vos prompts
        </p>
      </div>
      <BrandWizard />
    </div>
  );
}
