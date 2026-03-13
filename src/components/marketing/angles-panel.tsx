"use client";

import { useState } from "react";
import type {
  AnglesPrioritization,
  MarketingAngleSpec,
  EPICType,
  MarketingHook,
  Narrative,
} from "@/lib/db/schema";

interface PersonaInfo {
  id: string;
  name: string;
}

interface AnglesPanelProps {
  anglesData: AnglesPrioritization;
  productName: string;
  personas?: PersonaInfo[];
  onDeleteAngle?: (angleId: string) => void;
}

export function AnglesPanel({ anglesData, productName, personas = [], onDeleteAngle }: AnglesPanelProps) {
  const [selectedAngle, setSelectedAngle] = useState<MarketingAngleSpec | null>(
    anglesData.angles[0] || null
  );
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");

  const epicColors: Record<EPICType, { bg: string; text: string; border: string }> = {
    emotional: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-300" },
    practical: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
    identity: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-300" },
    critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
  };

  const epicIcons: Record<EPICType, string> = {
    emotional: "💖",
    practical: "⚙️",
    identity: "🎭",
    critical: "⚡",
  };

  // Group angles by EPIC type
  const anglesByType = anglesData.angles.reduce(
    (acc, angle) => {
      if (!acc[angle.epicType]) acc[angle.epicType] = [];
      acc[angle.epicType].push(angle);
      return acc;
    },
    {} as Record<EPICType, MarketingAngleSpec[]>
  );

  const getPriority = (angleId: string) => {
    return anglesData.priorityMatrix.find((p) => p.angleId === angleId);
  };

  const getPersonaName = (personaId: string) => {
    return personas.find((p) => p.id === personaId)?.name || personaId;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Marketing Angles: {productName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {anglesData.angles.length} angles generes (Framework EPIC)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Grid EPIC
          </button>
          <button
            onClick={() => setViewMode("detail")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === "detail"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Detail
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(["emotional", "practical", "identity", "critical"] as EPICType[]).map((epicType) => (
              <div key={epicType} className="space-y-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${epicColors[epicType].bg}`}>
                  <span className="text-lg">{epicIcons[epicType]}</span>
                  <span className={`text-sm font-semibold uppercase ${epicColors[epicType].text}`}>
                    {epicType}
                  </span>
                </div>
                <div className="space-y-2">
                  {(anglesByType[epicType] || []).map((angle) => {
                    const priority = getPriority(angle.id);
                    return (
                      <div
                        key={angle.id}
                        className={`relative w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                          selectedAngle?.id === angle.id
                            ? `${epicColors[epicType].border} bg-white shadow-md`
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        {/* Delete button */}
                        {onDeleteAngle && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAngle(angle.id);
                            }}
                            className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
                            title="Supprimer cet angle"
                          >
                            <span className="text-xs leading-none">&times;</span>
                          </button>
                        )}
                        <button
                          className="w-full text-left"
                          onClick={() => {
                            setSelectedAngle(angle);
                            setViewMode("detail");
                          }}
                        >
                          <div className="flex items-start justify-between pr-5">
                            <span className="text-sm font-medium text-gray-900">{angle.name}</span>
                            {priority && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  priority.priority === "high"
                                    ? "bg-green-100 text-green-700"
                                    : priority.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {priority.suggestedBudgetPercent}%
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {angle.coreBenefit}
                          </p>
                          {/* Persona badges */}
                          {angle.targetPersonaIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {angle.targetPersonaIds.map((pid) => (
                                <span
                                  key={pid}
                                  className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-medium"
                                >
                                  {getPersonaName(pid)}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 flex gap-1">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                              {angle.terrain.temperature}
                            </span>
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                              {angle.hooks.length} hooks
                            </span>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                  {!anglesByType[epicType]?.length && (
                    <div className="p-3 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      Aucun angle
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Synergies */}
          {anglesData.synergies.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                Synergies
              </h3>
              <div className="grid gap-2">
                {anglesData.synergies.map((synergy, index) => {
                  const angle1 = anglesData.angles.find((a) => a.id === synergy.angleIds[0]);
                  const angle2 = anglesData.angles.find((a) => a.id === synergy.angleIds[1]);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-700">
                        {angle1?.name || synergy.angleIds[0]}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {synergy.synergyType}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {angle2?.name || synergy.angleIds[1]}
                      </span>
                      <span className="flex-1 text-xs text-gray-500 text-right">
                        {synergy.recommendation}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail View */}
      {viewMode === "detail" && selectedAngle && (
        <div className="p-6">
          <AngleDetail
            angle={selectedAngle}
            priority={getPriority(selectedAngle.id)}
            epicColors={epicColors}
            epicIcons={epicIcons}
            onBack={() => setViewMode("grid")}
            allAngles={anglesData.angles}
            onSelectAngle={setSelectedAngle}
            getPersonaName={getPersonaName}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// ANGLE DETAIL COMPONENT
// ============================================================

interface AngleDetailProps {
  angle: MarketingAngleSpec;
  priority: { priority: string; reason: string; suggestedBudgetPercent: number } | undefined;
  epicColors: Record<EPICType, { bg: string; text: string; border: string }>;
  epicIcons: Record<EPICType, string>;
  onBack: () => void;
  allAngles: MarketingAngleSpec[];
  onSelectAngle: (angle: MarketingAngleSpec) => void;
  getPersonaName: (id: string) => string;
}

function AngleDetail({
  angle,
  priority,
  epicColors,
  epicIcons,
  onBack,
  allAngles,
  onSelectAngle,
  getPersonaName,
}: AngleDetailProps) {
  const [activeTab, setActiveTab] = useState<"terrain" | "hooks" | "narratives" | "visual">(
    "terrain"
  );

  return (
    <div className="space-y-6">
      {/* Back + Angle Selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Retour au grid
        </button>
        <select
          value={angle.id}
          onChange={(e) => {
            const newAngle = allAngles.find((a) => a.id === e.target.value);
            if (newAngle) onSelectAngle(newAngle);
          }}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
        >
          {allAngles.map((a) => (
            <option key={a.id} value={a.id}>
              [{a.epicType}] {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* Header */}
      <div className={`p-6 rounded-lg ${epicColors[angle.epicType].bg} ${epicColors[angle.epicType].border} border`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{epicIcons[angle.epicType]}</span>
              <span className={`text-sm font-semibold uppercase ${epicColors[angle.epicType].text}`}>
                {angle.epicType}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-gray-900">{angle.name}</h3>
            <p className="mt-2 text-gray-700">{angle.coreBenefit}</p>
            {angle.targetPersonaIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-500 self-center mr-1">Personas:</span>
                {angle.targetPersonaIds.map((pid) => (
                  <span
                    key={pid}
                    className="px-2 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-medium"
                  >
                    {getPersonaName(pid)}
                  </span>
                ))}
              </div>
            )}
          </div>
          {priority && (
            <div className="text-right">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  priority.priority === "high"
                    ? "bg-green-100 text-green-700"
                    : priority.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {priority.priority.toUpperCase()}
              </span>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {priority.suggestedBudgetPercent}%
              </div>
              <div className="text-xs text-gray-500">budget suggere</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["terrain", "hooks", "narratives", "visual"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "terrain" && "🎯 Terrain"}
            {tab === "hooks" && `🪝 Hooks (${angle.hooks.length})`}
            {tab === "narratives" && `📖 Narratives (${angle.narratives.length})`}
            {tab === "visual" && "🎨 Visual"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "terrain" && <TerrainTab terrain={angle.terrain} />}
        {activeTab === "hooks" && <HooksTab hooks={angle.hooks} />}
        {activeTab === "narratives" && <NarrativesTab narratives={angle.narratives} />}
        {activeTab === "visual" && (
          <VisualTab visual={angle.visualDirection} performance={angle.estimatedPerformance} />
        )}
      </div>
    </div>
  );
}

function TerrainTab({ terrain }: { terrain: MarketingAngleSpec["terrain"] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Awareness</div>
        <div className="text-lg font-semibold text-gray-900">{terrain.awareness}</div>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Sophistication</div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`w-6 h-6 rounded ${
                level <= terrain.sophistication ? "bg-blue-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Temperature</div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            terrain.temperature === "hot"
              ? "bg-red-100 text-red-700"
              : terrain.temperature === "warm"
                ? "bg-orange-100 text-orange-700"
                : "bg-blue-100 text-blue-700"
          }`}
        >
          {terrain.temperature}
        </span>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Emotion Dominante</div>
        <div className="text-lg font-semibold text-gray-900">{terrain.dominantEmotion}</div>
      </div>
      <div className="col-span-2 p-4 bg-gray-50 rounded-lg">
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Barrieres</div>
        <div className="flex flex-wrap gap-2">
          {terrain.barriers.map((barrier, i) => (
            <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
              {barrier}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HooksTab({ hooks }: { hooks: MarketingHook[] }) {
  return (
    <div className="space-y-3">
      {hooks.map((hook, index) => (
        <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                  hook.type === "question"
                    ? "bg-purple-100 text-purple-700"
                    : hook.type === "statement"
                      ? "bg-blue-100 text-blue-700"
                      : hook.type === "story"
                        ? "bg-pink-100 text-pink-700"
                        : hook.type === "statistic"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                }`}
              >
                {hook.type}
              </span>
              <p className="mt-2 text-gray-900 font-medium">&ldquo;{hook.text}&rdquo;</p>
              <p className="mt-1 text-sm text-gray-500">Emotion: {hook.targetEmotion}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{hook.strength}</div>
              <div className="text-xs text-gray-500">/10</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NarrativesTab({ narratives }: { narratives: Narrative[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {narratives.map((narr, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {narr.structure}
              </span>
              <span className="text-sm text-gray-700">{narr.opening.slice(0, 50)}...</span>
            </div>
            <span className="text-gray-400">{expandedIndex === index ? "−" : "+"}</span>
          </button>
          {expandedIndex === index && (
            <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-3">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Opening</span>
                <p className="mt-1 text-sm text-gray-800">{narr.opening}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Conflict</span>
                <p className="mt-1 text-sm text-gray-800">{narr.conflict}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Resolution</span>
                <p className="mt-1 text-sm text-gray-800">{narr.resolution}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">CTA</span>
                <p className="mt-1 text-sm font-medium text-blue-600">{narr.cta}</p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-500 uppercase">Script Complet</span>
                <p className="mt-1 text-sm text-gray-700 italic">{narr.fullScript}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VisualTab({
  visual,
  performance,
}: {
  visual: MarketingAngleSpec["visualDirection"];
  performance: MarketingAngleSpec["estimatedPerformance"];
}) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 uppercase">Direction Visuelle</h4>
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Mood</span>
            <p className="text-sm text-gray-900">{visual.mood}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Color Tone</span>
            <p className="text-sm text-gray-900">{visual.colorTone}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Imagery Style</span>
            <p className="text-sm text-gray-900">{visual.imageryStyle}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-xs font-medium text-gray-500">Model Direction</span>
            <p className="text-sm text-gray-900">{visual.modelDirection}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 uppercase">Performance Estimee</h4>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Engagement</span>
              <span className="font-medium">{performance.engagementScore}/10</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${performance.engagementScore * 10}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Conversion</span>
              <span className="font-medium">{performance.conversionPotential}/10</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${performance.conversionPotential * 10}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Risque Fatigue</span>
              <span className="font-medium">{performance.fatigueRisk}/10</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${performance.fatigueRisk * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnglesPanel;
