import React from 'react';
import { motion } from 'motion/react';
import { AlertOctagon, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';
import type { Verdict } from '../../../shared/types';

export const VERDICT_STYLES: Record<
  Verdict,
  {
    bg: string;
    border: string;
    text: string;
    iconBg: string;
    bannerBg: string;
    bannerSubtleBg: string;
    bannerAccent: string;
    bar: string;
    stampBg: string;
    Icon: React.FC<{ className?: string }>;
  }
> = {
  SCAM: {
    bg: 'bg-[#FDF1EE]',
    border: 'border-[#D9826A]',
    text: 'text-[#9F2B11]',
    iconBg: 'bg-[#C84620] text-white',
    bannerBg: 'bg-[#B42318] text-white',
    bannerSubtleBg: 'bg-white/15 text-white',
    bannerAccent: 'text-[#FEE4E2]',
    bar: 'bg-[#C84620]',
    stampBg: 'bg-[#C84620]/10 border-[#C84620]/30',
    Icon: AlertOctagon,
  },
  SUSPICIOUS: {
    bg: 'bg-[#FDF6E7]',
    border: 'border-[#DFB460]',
    text: 'text-[#92400E]',
    iconBg: 'bg-[#B45309] text-white',
    bannerBg: 'bg-[#B45309] text-white',
    bannerSubtleBg: 'bg-white/15 text-white',
    bannerAccent: 'text-[#FEF3C7]',
    bar: 'bg-[#D97706]',
    stampBg: 'bg-[#D97706]/10 border-[#D97706]/30',
    Icon: AlertTriangle,
  },
  UNCERTAIN: {
    bg: 'bg-[#F3EFE6]',
    border: 'border-[#BFB5A0]',
    text: 'text-[#3F3A32]',
    iconBg: 'bg-[#57534E] text-white',
    bannerBg: 'bg-[#44403C] text-white',
    bannerSubtleBg: 'bg-white/15 text-white',
    bannerAccent: 'text-[#E7E5E4]',
    bar: 'bg-[#57534E]',
    stampBg: 'bg-[#57534E]/10 border-[#57534E]/30',
    Icon: HelpCircle,
  },
  SAFE: {
    bg: 'bg-[#EEF7F2]',
    border: 'border-[#7EC4A4]',
    text: 'text-[#0E5A3E]',
    iconBg: 'bg-[#0F6B4A] text-white',
    bannerBg: 'bg-[#0F6B4A] text-white',
    bannerSubtleBg: 'bg-white/15 text-white',
    bannerAccent: 'text-[#D1FAE5]',
    bar: 'bg-[#0F6B4A]',
    stampBg: 'bg-[#0F6B4A]/10 border-[#0F6B4A]/30',
    Icon: ShieldCheck,
  },
};

export const VerdictLabel: React.FC<{ verdict: Verdict; label?: string }> = ({ verdict, label }) => {
  const style = VERDICT_STYLES[verdict];
  const Icon = style.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold text-sm ${style.text}`}>
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{label ?? verdict}</span>
    </span>
  );
};

/**
 * Tactile 10-segment heuristic risk gauge used on safety dossiers and quick previews.
 */
export const RiskMeterBar: React.FC<{
  score: number;
  verdict: Verdict;
  size?: 'default' | 'large';
}> = ({ score, verdict, size = 'default' }) => {
  const style = VERDICT_STYLES[verdict];
  const filledSegments = Math.max(1, Math.min(10, Math.round(score / 10)));
  const heightClass = size === 'large' ? 'h-3.5 sm:h-4 rounded-[4px]' : 'h-2.5 sm:h-3 rounded-[3px]';

  return (
    <div
      className="grid grid-cols-10 gap-1.5"
      role="meter"
      aria-label="Heuristic risk indicator"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
    >
      {Array.from({ length: 10 }).map((_, idx) => {
        const active = idx < filledSegments;
        return (
          <motion.span
            key={idx}
            initial={active ? { opacity: 0.25, scaleY: 0.7 } : false}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{
              duration: 0.16,
              delay: active ? idx * 0.018 : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`${heightClass} origin-bottom ${
              active ? style.bar : 'bg-[#132A23]/12'
            }`}
          />
        );
      })}
    </div>
  );
};
