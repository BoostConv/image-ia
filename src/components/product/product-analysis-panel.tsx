"use client";

import { useState } from "react";
import type {
  ProductAnalysis,
  FABBenefit,
  DURProblem,
  ProductObjection,
  SalesArgument,
  BeforeAfter,
} from "@/lib/db/schema";

interface ProductAnalysisPanelProps {
  analysis: ProductAnalysis;
  productName: string;
}

export function ProductAnalysisPanel({
  analysis,
  productName,
}: ProductAnalysisPanelProps) {
  const [activeSection, setActiveSection] = useState<string>("fab");

  const sections = [
    { id: "fab", label: "FAB Benefits", icon: "🎯" },
    { id: "usp", label: "USP Triptyque", icon: "💎" },
    { id: "dur", label: "DUR Matrix", icon: "📊" },
    { id: "value", label: "Value Equation", icon: "⚖️" },
    { id: "beforeafter", label: "Before/After", icon: "🔄" },
    { id: "objections", label: "Objections", icon: "❓" },
    { id: "sales", label: "Sales Arguments", icon: "💬" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Analyse Produit: {productName}
        </h2>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          <span>Confiance: {Math.round(analysis.analysisMetadata.confidence * 100)}%</span>
          {analysis.analysisMetadata.gaps.length > 0 && (
            <span className="text-amber-600">
              ({analysis.analysisMetadata.gaps.length} gaps)
            </span>
          )}
        </div>
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
                  ? "bg-blue-100 text-blue-700"
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
        {activeSection === "fab" && <FABSection benefits={analysis.fabBenefits} />}
        {activeSection === "usp" && <USPSection usp={analysis.uspTriptyque} />}
        {activeSection === "dur" && <DURSection problems={analysis.durProblems} />}
        {activeSection === "value" && <ValueSection equation={analysis.valueEquation} />}
        {activeSection === "beforeafter" && <BeforeAfterSection items={analysis.beforeAfter} />}
        {activeSection === "objections" && <ObjectionsSection objections={analysis.objections} />}
        {activeSection === "sales" && <SalesSection arguments={analysis.salesArguments} />}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function FABSection({ benefits }: { benefits: FABBenefit[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        Feature → Advantage → Benefit
      </h3>
      <div className="grid gap-4">
        {benefits.map((fab, index) => (
          <div
            key={index}
            className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase">Feature</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm text-gray-800">{fab.feature}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-500 uppercase">Advantage</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm text-gray-800">{fab.advantage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-green-600 uppercase">Benefit</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm font-medium text-gray-900">{fab.benefit}</span>
                </div>
              </div>
            </div>
            {fab.proofPoints.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-500 uppercase">Preuves:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {fab.proofPoints.map((proof, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-white rounded text-xs text-gray-600 border border-gray-200"
                    >
                      {proof}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function USPSection({ usp }: { usp: ProductAnalysis["uspTriptyque"] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        USP Triptyque
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎯</span>
            <span className="text-sm font-semibold text-purple-800 uppercase">USP</span>
          </div>
          <p className="text-sm text-gray-800">{usp.usp}</p>
          <p className="mt-2 text-xs text-purple-600">Unique Selling Proposition</p>
        </div>

        <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💖</span>
            <span className="text-sm font-semibold text-pink-800 uppercase">UMP</span>
          </div>
          <p className="text-sm text-gray-800">{usp.ump}</p>
          <p className="mt-2 text-xs text-pink-600">Unique Marketing Proposition</p>
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📖</span>
            <span className="text-sm font-semibold text-amber-800 uppercase">UMS</span>
          </div>
          <p className="text-sm text-gray-800">{usp.ums}</p>
          <p className="mt-2 text-xs text-amber-600">Unique Mechanism Story</p>
        </div>
      </div>
    </div>
  );
}

function DURSection({ problems }: { problems: DURProblem[] }) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-red-500";
    if (score >= 6) return "bg-orange-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        DUR Matrix (Douloureux, Urgent, Reconnu)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-600">Probleme</th>
              <th className="text-center py-2 px-3 font-medium text-gray-600">D</th>
              <th className="text-center py-2 px-3 font-medium text-gray-600">U</th>
              <th className="text-center py-2 px-3 font-medium text-gray-600">R</th>
              <th className="text-center py-2 px-3 font-medium text-gray-600">Score</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 px-3 text-gray-800">{problem.description}</td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${getScoreColor(problem.douloureux)}`}>
                    {problem.douloureux}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${getScoreColor(problem.urgent)}`}>
                    {problem.urgent}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${getScoreColor(problem.reconnu)}`}>
                    {problem.reconnu}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold ${getScoreColor(problem.totalScore)}`}>
                    {problem.totalScore.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValueSection({ equation }: { equation: ProductAnalysis["valueEquation"] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        Value Equation (Hormozi)
      </h3>
      <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-gray-200">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900">
            Score: {equation.score.toFixed(1)}/10
          </div>
          <div className="mt-1 text-sm text-gray-600">
            (Dream × Likelihood) / (Time × Effort)
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-green-200">
            <div className="text-xs font-medium text-green-600 uppercase">Dream Outcome</div>
            <div className="mt-1 text-sm text-gray-800">{equation.dreamOutcome}</div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="text-xs font-medium text-blue-600 uppercase">
              Likelihood ({equation.perceivedLikelihood}/10)
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${equation.perceivedLikelihood * 10}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-amber-200">
            <div className="text-xs font-medium text-amber-600 uppercase">Time Delay</div>
            <div className="mt-1 text-sm text-gray-800">{equation.timeDelay}</div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-red-200">
            <div className="text-xs font-medium text-red-600 uppercase">Effort & Sacrifice</div>
            <div className="mt-1 text-sm text-gray-800">{equation.effortSacrifice}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BeforeAfterSection({ items }: { items: BeforeAfter[] }) {
  const dimensionColors: Record<string, string> = {
    Physique: "bg-blue-100 text-blue-800 border-blue-200",
    Emotionnel: "bg-pink-100 text-pink-800 border-pink-200",
    Social: "bg-purple-100 text-purple-800 border-purple-200",
    Financier: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        Before / After Transformations
      </h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  dimensionColors[item.dimension] || "bg-gray-100 text-gray-800"
                }`}
              >
                {item.dimension}
              </span>
              <span className="text-xs text-gray-500">{item.timeframe}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 bg-red-50 rounded border border-red-200">
                <div className="text-xs font-medium text-red-600 uppercase mb-1">Avant</div>
                <div className="text-sm text-gray-800">{item.before}</div>
              </div>
              <div className="text-2xl text-gray-400">→</div>
              <div className="flex-1 p-3 bg-green-50 rounded border border-green-200">
                <div className="text-xs font-medium text-green-600 uppercase mb-1">Apres</div>
                <div className="text-sm text-gray-800">{item.after}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectionsSection({ objections }: { objections: ProductObjection[] }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const typeColors: Record<string, string> = {
    prix: "bg-green-100 text-green-800",
    confiance: "bg-blue-100 text-blue-800",
    urgence: "bg-amber-100 text-amber-800",
    besoin: "bg-purple-100 text-purple-800",
    autorite: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        Objections & Reponses
      </h3>
      <div className="space-y-2">
        {objections.map((obj, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                    typeColors[obj.type] || "bg-gray-100"
                  }`}
                >
                  {obj.type}
                </span>
                <span className="text-sm text-gray-800">{obj.objection}</span>
              </div>
              <span className="text-gray-400">
                {expandedIndex === index ? "−" : "+"}
              </span>
            </button>
            {expandedIndex === index && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-600 uppercase">Reponse:</span>
                  <p className="mt-1 text-sm text-gray-800">{obj.reponse}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-600 uppercase">Preuve:</span>
                  <p className="mt-1 text-sm text-gray-600 italic">{obj.preuve}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesSection({ arguments: args }: { arguments: SalesArgument[] }) {
  const sortedArgs = [...args].sort((a, b) => b.force - a.force);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">
        Sales Arguments (par force)
      </h3>
      <div className="space-y-3">
        {sortedArgs.map((arg, index) => (
          <div
            key={index}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{arg.argument}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                    Cible: {arg.cible}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {arg.contexte}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-600">{arg.force}</span>
                <span className="text-xs text-gray-500">/10</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductAnalysisPanel;
