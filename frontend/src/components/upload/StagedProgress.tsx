import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, FileText, Database, Sparkles, PieChart, LayoutDashboard } from 'lucide-react';

interface StagedProgressProps {
  onComplete: () => void;
}

const STAGES = [
  { id: 1, label: "Reading & validating file structure", icon: FileText },
  { id: 2, label: "Cleaning data types, nulls & duplicates", icon: Database },
  { id: 3, label: "Finding statistical churn drivers (chi-square & ANOVA)", icon: Sparkles },
  { id: 4, label: "Calculating segment risk & revenue loss", icon: PieChart },
  { id: 5, label: "Preparing interactive insights dashboard", icon: LayoutDashboard },
];

export const StagedProgress: React.FC<StagedProgressProps> = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= STAGES.length) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full bg-[#090a0b] border border-[#2e2e2e] rounded-[24px] p-8 shadow-[0_18px_20px_0_rgba(0,0,0,0.4)]">
        <h2 className="font-serif-display text-[32px] font-light text-[#ffffff] mb-2 text-center">
          Analyzing Dataset
        </h2>
        <p className="text-[14px] text-[#9f9fa0] font-sans-ui text-center mb-8">
          Running automated data cleaning, statistical significance tests, and segmentation algorithms...
        </p>

        {/* Stages List */}
        <div className="space-y-4">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const isFinished = currentStage > stage.id;
            const isCurrent = currentStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`flex items-center justify-between p-4 rounded-[12px] border transition-all duration-300 ${
                  isFinished
                    ? 'bg-[#00b3dd]/[0.06] border-[#00b3dd]/30 text-[#ffffff]'
                    : isCurrent
                    ? 'bg-[#847dff]/[0.1] border-[#847dff]/50 text-[#ffffff] scale-[1.01]'
                    : 'bg-[#0f1011] border-[#2e2e2e] text-[#6a6b6b]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      isFinished
                        ? 'bg-[#00b3dd]/20 text-[#00b3dd]'
                        : isCurrent
                        ? 'bg-[#847dff]/20 text-[#847dff]'
                        : 'bg-[#2e2e2e] text-[#6a6b6b]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[14px] font-medium font-sans-ui">
                    {stage.label}
                  </span>
                </div>

                <div>
                  {isFinished ? (
                    <CheckCircle2 className="w-5 h-5 text-[#00b3dd] animate-in zoom-in-50 duration-200" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-[#847dff] animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#3f4041]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
