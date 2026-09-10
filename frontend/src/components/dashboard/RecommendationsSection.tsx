import React from 'react';
import type { Recommendation } from '../../types/analysis';
import { Lightbulb, ArrowUpRight, Zap } from 'lucide-react';

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ recommendations }) => {
  return (
    <section id="recommendations" className="w-full mb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-[#2e2e2e]">
        <div>
          <div className="flex items-center gap-2 text-[#847dff] font-mono-data text-[12px] uppercase tracking-wider mb-1">
            <Lightbulb className="w-4 h-4" />
            <span>Strategic Playbook</span>
          </div>
          <h2 className="font-serif-display text-[32px] sm:text-[38px] font-light text-[#ffffff] leading-tight">
            Automated Executive Recommendations
          </h2>
        </div>
        <p className="text-[14px] text-[#9f9fa0] font-sans-ui max-w-[420px] mt-2 sm:mt-0">
          Actionable business interventions generated directly from empirical data patterns.
        </p>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="bg-[#2e2e2e] border border-[#3f4041] hover:border-[#847dff] rounded-[16px] p-6 flex flex-col justify-between shadow-[0_18px_20px_0_rgba(0,0,0,0.2)] hover:scale-[1.01] transition-all duration-200"
          >
            <div>
              {/* Badge Row */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#847dff]/15 text-[#847dff] font-mono-data text-[11px] uppercase border border-[#847dff]/30">
                  <Zap className="w-3 h-3" />
                  {rec.impact_level} Business Impact
                </span>
                <div className="w-8 h-8 rounded-full bg-[#0f1011] flex items-center justify-center text-[#9f9fa0]">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-[18px] font-medium text-[#ffffff] mb-3 leading-snug">
                {rec.title}
              </h3>

              {/* Description */}
              <p className="text-[14px] text-[#9f9fa0] font-sans-ui leading-relaxed mb-6">
                {rec.description}
              </p>
            </div>

            {/* Empirical Finding Footer */}
            <div className="pt-4 border-t border-[#3f4041] bg-[#090a0b]/50 -mx-6 -mb-6 p-4 rounded-b-[16px]">
              <span className="text-[11px] font-mono-data text-[#6a6b6b] uppercase block mb-1">
                Linked Statistical Finding:
              </span>
              <p className="text-[12px] text-[#fafafa] font-sans-ui italic">
                "{rec.related_finding}"
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
