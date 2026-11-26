import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useApp } from '../contexts/AppContext';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useApp();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#DDD5C5] bg-[#FFFDF8] text-[#132A23] text-xs font-semibold hover:bg-[#EFE9DC] transition-colors whitespace-nowrap shrink-0 ${className}`}
      >
        <Download className="w-4 h-4 text-[#C84620]" />
        {t.common.installApp}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#DDD5C5] bg-[#FFFDF8] text-[#132A23] text-xs font-semibold hover:bg-[#EFE9DC] transition-colors whitespace-nowrap shrink-0 ${className}`}
        >
          <Download className="w-4 h-4 text-[#C84620]" />
          {t.common.installApp}
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#132A23]/60 backdrop-blur-[1px] p-4"
          >
            <div className="w-full max-w-sm ledger-elevated p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 id="ios-install-title" className="font-display text-lg font-semibold text-[#132A23]">
                  Install on iPhone or iPad
                </h2>
                <button
                  type="button"
                  aria-label="Close install instructions"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-2 text-[#526058] hover:text-[#132A23]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-sm text-[#35443D] space-y-2 list-decimal pl-5">
                <li>Tap the Share icon in Safari’s bottom toolbar.</li>
                <li>Scroll down and tap Add to Home Screen.</li>
                <li>Tap Add to use offline UPI safety rules anytime.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-lg bg-[#132A23] text-[#FFFDF8] text-sm font-semibold hover:bg-[#1E3B31] transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
