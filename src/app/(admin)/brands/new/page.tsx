import { BrandWizardV2 } from "@/components/brand/brand-wizard-v2";

export default function NewBrandPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle marque</h1>
        <p className="text-sm text-muted-foreground">
          Entrez le nom et l&apos;URL de votre marque — notre IA generera
          automatiquement un brief strategique complet
        </p>
      </div>
      <BrandWizardV2 />
    </div>
  );
}
