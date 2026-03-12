"use client";

import { useState } from "react";
import type { RichPersona, DesireLevel, SituationalTrigger, EPICType } from "@/lib/db/schema";

interface RichPersonaPanelProps {
  persona: RichPersona;
  onEdit?: () => void;
}

export function RichPersonaPanel({ persona, onEdit }: RichPersonaPanelProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const sections = [
    { id: "overview", label: "Overview", icon: "👤" },
    { id: "desires", label: "5 Desires", icon: "💎" },
    { id: "psychology", label: "Psychology", icon: "🧠" },
    { id: "language", label: "Language", icon: "💬" },
    { id: "triggers", label: "Triggers", icon: "⚡" },
    { id: "digital", label: "Digital", icon: "📱" },
    { id: "journey", label: "Journey", icon: "🗺️" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Avatar Placeholder */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
            {persona.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{persona.name}</h2>
            <p className="text-sm text-gray-600 italic">&ldquo;{persona.tagline}&rdquo;</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {persona.demographics.ageRange}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                {persona.demographics.profession}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                {persona.demographics.income}
              </span>
            </div>
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-2 border-b border-gray-100 overflow-x-auto">
        <div className="flex gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeSection === "overview" && <OverviewSection persona={persona} />}
        {activeSection === "desires" && <DesiresSection desires={persona.psychographics.desires} />}
        {activeSection === "psychology" && <PsychologySection persona={persona} />}
        {activeSection === "language" && <LanguageSection profile={persona.languageProfile} />}
        {activeSection === "triggers" && <TriggersSection triggers={persona.situationalTriggers} />}
        {activeSection === "digital" && <DigitalSection behavior={persona.digitalBehavior} />}
        {activeSection === "journey" && <JourneySection journey={persona.customerJourney} />}
      </div>

      {/* Angle Affinities */}
      {persona.angleAffinities?.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
            Angle Affinities
          </h3>
          <div className="flex flex-wrap gap-2">
            {persona.angleAffinities.map((affinity, index) => (
              <div
                key={index}
                className="px-3 py-2 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{affinity.angleId}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {affinity.affinityScore}/10
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{affinity.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Confiance: {Math.round(persona.metadata.confidence * 100)}%</span>
          <span>Genere: {new Date(persona.metadata.generatedAt).toLocaleDateString()}</span>
        </div>
        {persona.metadata.gaps.length > 0 && (
          <div className="mt-1 text-amber-600">
            {persona.metadata.gaps.length} gap(s): {persona.metadata.gaps.map(g => g.field).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function OverviewSection({ persona }: { persona: RichPersona }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Demographics */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
          Demographics
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(persona.demographics).map(([key, value]) => (
            <div key={key} className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-500 uppercase">{key}</span>
              <p className="mt-1 text-sm text-gray-900">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
          Quick Profile
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-purple-50 rounded-lg">
            <span className="text-xs font-medium text-purple-600 uppercase">Decision Style</span>
            <p className="mt-1 text-sm font-medium text-gray-900 capitalize">
              {persona.buyingPsychology.decisionStyle}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <span className="text-xs font-medium text-blue-600 uppercase">Risk Tolerance</span>
            <p className="mt-1 text-sm font-medium text-gray-900 capitalize">
              {persona.buyingPsychology.riskTolerance}
            </p>
          </div>
          <div className="p-3 bg-pink-50 rounded-lg">
            <span className="text-xs font-medium text-pink-600 uppercase">Social Proof</span>
            <p className="mt-1 text-sm font-medium text-gray-900 capitalize">
              {persona.languageProfile.socialProofType}
            </p>
          </div>
        </div>
      </div>

      {/* Values & Aspirations */}
      <div className="col-span-full space-y-4">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
          Values & Aspirations
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-medium text-green-600 uppercase">Values</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {persona.psychographics.values.map((value, i) => (
                <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">
                  {value}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium text-blue-600 uppercase">Aspirations</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {persona.psychographics.aspirations.map((asp, i) => (
                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                  {asp}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesiresSection({ desires }: { desires: DesireLevel[] }) {
  const levelLabels: Record<number, { title: string; color: string; description: string }> = {
    1: { title: "Surface", color: "bg-gray-100 border-gray-300", description: "Ce qu'ils DISENT vouloir" },
    2: { title: "Fonctionnel", color: "bg-blue-100 border-blue-300", description: "Ce qu'ils VEULENT VRAIMENT" },
    3: { title: "Emotionnel", color: "bg-pink-100 border-pink-300", description: "Comment ils veulent SE SENTIR" },
    4: { title: "Identitaire", color: "bg-purple-100 border-purple-300", description: "QUI ils veulent DEVENIR" },
    5: { title: "Existentiel", color: "bg-amber-100 border-amber-300", description: "Le SENS PROFOND recherche" },
  };

  const sortedDesires = [...desires].sort((a, b) => a.level - b.level);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        Pyramide des Desirs (5 Niveaux)
      </h3>
      <div className="relative">
        {/* Pyramid visualization */}
        <div className="space-y-2">
          {sortedDesires.map((desire) => {
            const levelInfo = levelLabels[desire.level];
            const width = 100 - (desire.level - 1) * 15; // Pyramid effect
            return (
              <div
                key={desire.level}
                className="flex justify-center"
                style={{ paddingLeft: `${(desire.level - 1) * 7.5}%`, paddingRight: `${(desire.level - 1) * 7.5}%` }}
              >
                <div
                  className={`w-full p-4 rounded-lg border-2 ${levelInfo.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-gray-600">
                      Niveau {desire.level}: {levelInfo.title}
                    </span>
                    <span className="text-xs text-gray-500">{levelInfo.description}</span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">&ldquo;{desire.description}&rdquo;</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PsychologySection({ persona }: { persona: RichPersona }) {
  const { buyingPsychology, psychographics } = persona;

  return (
    <div className="space-y-6">
      {/* Buying Psychology */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
          Psychologie d&apos;Achat
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-xs font-medium text-gray-500 uppercase">Defense Primaire</span>
            <p className="mt-2 text-sm text-gray-900">{buyingPsychology.primaryDefense}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-xs font-medium text-gray-500 uppercase">Style Decision</span>
            <p className="mt-2 text-sm text-gray-900 capitalize">{buyingPsychology.decisionStyle}</p>
          </div>
        </div>
      </div>

      {/* Resistance Patterns */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Patterns de Resistance</h4>
        <div className="flex flex-wrap gap-2">
          {buyingPsychology.resistancePatterns.map((pattern, i) => (
            <span key={i} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
              {pattern}
            </span>
          ))}
        </div>
      </div>

      {/* Trust Builders */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Ce qui Construit la Confiance</h4>
        <div className="flex flex-wrap gap-2">
          {buyingPsychology.trustBuilders.map((builder, i) => (
            <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
              {builder}
            </span>
          ))}
        </div>
      </div>

      {/* Fears & Frustrations */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Peurs</h4>
          <ul className="space-y-2">
            {psychographics.fears.map((fear, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500">•</span>
                {fear}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Frustrations</h4>
          <ul className="space-y-2">
            {psychographics.frustrations.map((frust, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-500">•</span>
                {frust}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Beliefs */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Croyances</h4>
        <div className="space-y-2">
          {psychographics.beliefs.map((belief, i) => (
            <div key={i} className="p-3 bg-purple-50 rounded-lg text-sm text-gray-800 italic">
              &ldquo;{belief}&rdquo;
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LanguageSection({ profile }: { profile: RichPersona["languageProfile"] }) {
  return (
    <div className="space-y-6">
      {/* Vocabulary Level */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Niveau Vocabulaire:</span>
        <div className="flex gap-2">
          {(["simple", "intermediaire", "sophistique"] as const).map((level) => (
            <span
              key={level}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.vocabularyLevel === level
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {level}
            </span>
          ))}
        </div>
      </div>

      {/* Preferred Tone */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Tons Preferes</h4>
        <div className="flex flex-wrap gap-2">
          {profile.preferredTone.map((tone, i) => (
            <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
              {tone}
            </span>
          ))}
        </div>
      </div>

      {/* Trigger Words vs Avoid Words */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-green-700">Mots Declencheurs</h4>
          <div className="flex flex-wrap gap-2">
            {profile.triggerWords.map((word, i) => (
              <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                {word}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-red-700">Mots a Eviter</h4>
          <div className="flex flex-wrap gap-2">
            {profile.avoidWords.map((word, i) => (
              <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm line-through">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Metaphors */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Metaphores Resonantes</h4>
        <div className="flex flex-wrap gap-2">
          {profile.metaphorsResonant.map((metaphor, i) => (
            <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm italic">
              &ldquo;{metaphor}&rdquo;
            </span>
          ))}
        </div>
      </div>

      {/* Social Proof Type */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <span className="text-xs font-medium text-gray-500 uppercase">Type de Preuve Sociale Prefere</span>
        <p className="mt-2 text-lg font-semibold text-gray-900 capitalize">{profile.socialProofType}</p>
      </div>
    </div>
  );
}

function TriggersSection({ triggers }: { triggers: SituationalTrigger[] }) {
  const epicColors: Record<EPICType, string> = {
    emotional: "bg-pink-100 text-pink-700",
    practical: "bg-blue-100 text-blue-700",
    identity: "bg-purple-100 text-purple-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        Triggers Situationnels
      </h3>
      <div className="space-y-3">
        {triggers.map((trigger, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{trigger.situation}</h4>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">Trigger:</span> {trigger.trigger}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                    Emotion: {trigger.emotion}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${epicColors[trigger.bestAngleType]}`}>
                    Best: {trigger.bestAngleType}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{trigger.urgency}</div>
                <div className="text-xs text-gray-500">urgence</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DigitalSection({ behavior }: { behavior: RichPersona["digitalBehavior"] }) {
  return (
    <div className="space-y-6">
      {/* Platforms */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Plateformes</h4>
        <div className="flex flex-wrap gap-2">
          {behavior.platforms.map((platform, i) => (
            <span key={i} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
              {platform}
            </span>
          ))}
        </div>
      </div>

      {/* Content Preferences */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Preferences Contenu</h4>
        <div className="flex flex-wrap gap-2">
          {behavior.contentPreferences.map((pref, i) => (
            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
              {pref}
            </span>
          ))}
        </div>
      </div>

      {/* Activity Times */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Heures de Pointe</h4>
        <div className="flex flex-wrap gap-2">
          {behavior.peakActivityTimes.map((time, i) => (
            <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
              {time}
            </span>
          ))}
        </div>
      </div>

      {/* Device & Attention */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-500 uppercase">Device Prefere</span>
          <p className="mt-2 text-lg font-semibold text-gray-900 capitalize">{behavior.devicePreference}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <span className="text-xs font-medium text-gray-500 uppercase">Attention Span</span>
          <p className="mt-2 text-lg font-semibold text-gray-900 capitalize">{behavior.attentionSpan}</p>
        </div>
      </div>
    </div>
  );
}

function JourneySection({ journey }: { journey: RichPersona["customerJourney"] }) {
  return (
    <div className="space-y-6">
      {/* Journey Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Awareness */}
        <div className="relative pl-10 pb-8">
          <div className="absolute left-2 w-5 h-5 rounded-full bg-blue-500 border-4 border-white" />
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700 uppercase">Decouverte</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {journey.awarenessChannels.map((channel, i) => (
                <span key={i} className="px-2 py-1 bg-white text-gray-700 rounded text-sm">
                  {channel}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Research */}
        <div className="relative pl-10 pb-8">
          <div className="absolute left-2 w-5 h-5 rounded-full bg-purple-500 border-4 border-white" />
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm font-medium text-purple-700 uppercase">Recherche</h4>
            <p className="mt-2 text-sm text-gray-700">{journey.researchBehavior}</p>
          </div>
        </div>

        {/* Decision */}
        <div className="relative pl-10 pb-8">
          <div className="absolute left-2 w-5 h-5 rounded-full bg-green-500 border-4 border-white" />
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-700 uppercase">Decision</h4>
            <div className="mt-2 space-y-1">
              {journey.decisionFactors.map((factor, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  {factor}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Post-Purchase */}
        <div className="relative pl-10">
          <div className="absolute left-2 w-5 h-5 rounded-full bg-amber-500 border-4 border-white" />
          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="text-sm font-medium text-amber-700 uppercase">Post-Achat</h4>
            <p className="mt-2 text-sm text-gray-700">{journey.postPurchaseBehavior}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RichPersonaPanel;
