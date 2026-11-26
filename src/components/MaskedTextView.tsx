import React from 'react';

const MASK_TOKEN_REGEX = /(\[[A-Z0-9_]+_MASKED\])/g;

interface MaskedTextViewProps {
  text: string;
  compact?: boolean;
  className?: string;
}

/**
 * Renders masked message text with visual redaction highlights on tokens such as
 * [PHONE_MASKED], [UPI_ID_MASKED], [OTP_MASKED], and [ACCOUNT_MASKED].
 */
export const MaskedTextView: React.FC<MaskedTextViewProps> = ({
  text,
  compact = false,
  className = '',
}) => {
  const segments = text.split(MASK_TOKEN_REGEX);

  return (
    <div
      className={`rounded-lg bg-[#EFE9DC]/80 border border-[#DDD5C5] ${
        compact ? 'p-2.5 text-xs' : 'p-3.5 text-xs sm:text-sm'
      } font-mono text-[#132A23] whitespace-pre-wrap break-words leading-relaxed ${className}`}
    >
      {segments.map((segment, index) => {
        if (/^\[[A-Z0-9_]+_MASKED\]$/.test(segment)) {
          return (
            <mark
              key={`${segment}-${index}`}
              className="mx-0.5 px-1.5 py-0.5 rounded bg-[#132A23] text-[#F7F3EA] font-semibold not-italic tracking-tight"
            >
              {segment}
            </mark>
          );
        }
        return <React.Fragment key={index}>{segment}</React.Fragment>;
      })}
    </div>
  );
};
