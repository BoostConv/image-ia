"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  ImageIcon,
  Upload,
  Trash2,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/images/url";

interface BrandDocument {
  id: string;
  name: string;
  type: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes: number | null;
  extractedText: string | null;
  summary: string | null;
  keyInsights: string[] | null;
  createdAt: string;
}

interface InspirationAd {
  id: string;
  name: string | null;
  source: string | null;
  competitorName: string | null;
  filePath: string;
  mimeType: string;
  analysis: string | null;
  tags: string[] | null;
  rating: number | null;
  notes: string | null;
  createdAt: string;
}

const DOC_TYPES = [
  { value: "brand_book", label: "Brand Book / Plateforme de marque" },
  { value: "style_guide", label: "Guide de style" },
  { value: "brief", label: "Brief creatif" },
  { value: "other", label: "Autre document" },
];

const SOURCES = [
  { value: "brand", label: "Meilleure ad de la marque" },
  { value: "competitor", label: "Ad concurrente" },
  { value: "inspiration", label: "Inspiration generale" },
];

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Documents de marque ─────────────────────────────────────

export function BrandDocumentsClient({
  brandId,
  initialDocuments,
}: {
  brandId: string;
  initialDocuments: BrandDocument[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("brand_book");
  const docFileRef = useRef<HTMLInputElement>(null);

  async function handleDocUpload() {
    const file = docFileRef.current?.files?.[0];
    if (!file || !docName.trim()) return;

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("brandId", brandId);
      formData.append("name", docName);
      formData.append("type", docType);

      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setDocuments((prev) => [
          {
            id: data.id,
            name: docName,
            type: docType,
            filePath: data.filePath,
            mimeType: file.type,
            fileSizeBytes: file.size,
            extractedText: null,
            summary: null,
            keyInsights: null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setDocName("");
        setShowDocForm(false);
        if (docFileRef.current) docFileRef.current.value = "";
      }
    } finally {
      setIsUploadingDoc(false);
    }
  }

  async function handleDeleteDoc(id: string) {
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents de marque ({documents.length})
        </h2>
        <Button variant="outline" size="sm" onClick={() => setShowDocForm(!showDocForm)}>
          <Plus className="mr-1 h-3 w-3" />
          Ajouter
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Uploadez vos brand books, plateformes de marque et guides de style.
        L&apos;IA extrait et resume automatiquement le contenu.
      </p>

      {showDocForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nom du document</label>
                <Input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Ex: Plateforme de marque 2024"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <Select value={docType} onValueChange={(v) => v && setDocType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Fichier</label>
              <Input
                ref={docFileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDocUpload} disabled={isUploadingDoc || !docName.trim()}>
                {isUploadingDoc ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Uploader
              </Button>
              <Button variant="ghost" onClick={() => setShowDocForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <div className="grid gap-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() =>
                      setExpandedDocId(expandedDocId === doc.id ? null : doc.id)
                    }
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      {doc.summary && (
                        <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                      )}
                      {expandedDocId === doc.id ? (
                        <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {DOC_TYPES.find((t) => t.value === doc.type)?.label || doc.type}
                      </Badge>
                      {doc.fileSizeBytes && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatBytes(doc.fileSizeBytes)}
                        </span>
                      )}
                      {doc.summary && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                          Analyse IA
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleDeleteDoc(doc.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {expandedDocId === doc.id && (
                  <div className="border-t pt-2 space-y-2">
                    {doc.summary ? (
                      <>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">
                            Resume IA
                          </label>
                          <p className="text-xs mt-0.5">{doc.summary}</p>
                        </div>
                        {doc.keyInsights && doc.keyInsights.length > 0 && (
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase">
                              Points cles pour la creation
                            </label>
                            <ul className="mt-1 space-y-0.5">
                              {doc.keyInsights.map((insight, i) => (
                                <li key={i} className="text-xs flex items-start gap-1.5">
                                  <span className="text-amber-500 shrink-0">*</span>
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Analyse en cours... Rechargez la page dans quelques secondes.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ads d'inspiration ───────────────────────────────────────

export function BrandInspirationsClient({
  brandId,
  initialInspirationAds,
}: {
  brandId: string;
  initialInspirationAds: InspirationAd[];
}) {
  const [inspirationAds, setInspirationAds] = useState(initialInspirationAds);
  const [isUploadingAd, setIsUploadingAd] = useState(false);
  const [showAdForm, setShowAdForm] = useState(false);
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const [analyzingAdId, setAnalyzingAdId] = useState<string | null>(null);

  const [adSource, setAdSource] = useState("brand");
  const [adCompetitor, setAdCompetitor] = useState("");
  const [adNotes, setAdNotes] = useState("");
  const adFileRef = useRef<HTMLInputElement>(null);

  async function handleAdUpload() {
    const file = adFileRef.current?.files?.[0];
    if (!file) return;

    setIsUploadingAd(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("brandId", brandId);
      formData.append("name", file.name);
      formData.append("source", adSource);
      if (adCompetitor) formData.append("competitorName", adCompetitor);
      if (adNotes) formData.append("notes", adNotes);

      const res = await fetch("/api/inspiration", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setInspirationAds((prev) => [
          {
            id: data.id,
            name: file.name,
            source: adSource,
            competitorName: adCompetitor || null,
            filePath: data.filePath,
            mimeType: file.type,
            analysis: null,
            tags: null,
            rating: null,
            notes: adNotes || null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setAdCompetitor("");
        setAdNotes("");
        setShowAdForm(false);
        if (adFileRef.current) adFileRef.current.value = "";
      }
    } finally {
      setIsUploadingAd(false);
    }
  }

  async function handleDeleteAd(id: string) {
    await fetch("/api/inspiration", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setInspirationAds((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleReanalyzeAd(ad: InspirationAd) {
    setAnalyzingAdId(ad.id);
    try {
      const res = await fetch("/api/inspiration/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ad.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setInspirationAds((prev) =>
          prev.map((a) =>
            a.id === ad.id
              ? { ...a, analysis: data.analysis, tags: data.tags }
              : a
          )
        );
      }
    } finally {
      setAnalyzingAdId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Ads d&apos;inspiration ({inspirationAds.length})
        </h2>
        <Button variant="outline" size="sm" onClick={() => setShowAdForm(!showAdForm)}>
          <Plus className="mr-1 h-3 w-3" />
          Ajouter
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Uploadez les meilleures publicites. L&apos;IA analyse automatiquement
        composition, couleurs, emotion et forces.
      </p>

      {showAdForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Source</label>
                <Select value={adSource} onValueChange={(v) => v && setAdSource(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {adSource === "competitor" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nom du concurrent</label>
                  <Input
                    value={adCompetitor}
                    onChange={(e) => setAdCompetitor(e.target.value)}
                    placeholder="Ex: Nespresso, Starbucks..."
                  />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Image de la pub</label>
              <Input
                ref={adFileRef}
                type="file"
                accept="image/*"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes (pourquoi cette ad est bonne ?)</label>
              <Textarea
                value={adNotes}
                onChange={(e) => setAdNotes(e.target.value)}
                placeholder="Ex: Excellent contraste, message clair, emotion forte..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdUpload} disabled={isUploadingAd}>
                {isUploadingAd ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Uploader
              </Button>
              <Button variant="ghost" onClick={() => setShowAdForm(false)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {inspirationAds.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {inspirationAds.map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <div
                className="relative aspect-square cursor-pointer"
                onClick={() =>
                  setExpandedAdId(expandedAdId === ad.id ? null : ad.id)
                }
              >
                <Image
                  src={getPublicImageUrl(ad.filePath)}
                  alt={ad.name || "Inspiration"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                {ad.analysis && (
                  <div className="absolute top-1.5 right-1.5">
                    <Badge className="text-[9px] bg-amber-500/90 hover:bg-amber-500">
                      <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                      Analysee
                    </Badge>
                  </div>
                )}
                {!ad.analysis && (
                  <div className="absolute top-1.5 right-1.5">
                    <Badge variant="secondary" className="text-[9px]">
                      <Loader2 className="mr-0.5 h-2.5 w-2.5 animate-spin" />
                      Analyse...
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={ad.source === "brand" ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {ad.source === "brand"
                      ? "Marque"
                      : ad.source === "competitor"
                        ? ad.competitorName || "Concurrent"
                        : "Inspiration"}
                  </Badge>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleReanalyzeAd(ad)}
                      disabled={analyzingAdId === ad.id}
                      title="Re-analyser"
                    >
                      {analyzingAdId === ad.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteAd(ad.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {ad.tags && ad.tags.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {ad.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {expandedAdId === ad.id && ad.analysis && (
                  <div className="border-t pt-1.5 mt-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">
                      Analyse IA
                    </label>
                    <p className="text-[11px] mt-0.5 leading-relaxed">
                      {ad.analysis}
                    </p>
                  </div>
                )}

                {ad.notes && !ad.analysis && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {ad.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Legacy combined export (backward compat) ────────────────

export function BrandSettingsClient({
  brandId,
  initialDocuments,
  initialInspirationAds,
}: {
  brandId: string;
  initialDocuments: BrandDocument[];
  initialInspirationAds: InspirationAd[];
}) {
  return (
    <div className="space-y-6">
      <BrandDocumentsClient brandId={brandId} initialDocuments={initialDocuments} />
      <BrandInspirationsClient brandId={brandId} initialInspirationAds={initialInspirationAds} />
    </div>
  );
}
