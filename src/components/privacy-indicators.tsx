'use client';

import { Shield, Lock, Eye } from 'lucide-react';

export function PrivacyIndicators() {
  const indicators = [
    { icon: Eye, label: 'Sender hidden', active: true },
    { icon: Eye, label: 'Recipient hidden', active: true },
    { icon: Lock, label: 'Amount encrypted', active: true },
    { icon: Shield, label: 'On-chain settlement', active: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mt-6">
      {indicators.map((indicator) => {
        const Icon = indicator.icon;
        return (
          <div
            key={indicator.label}
            className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border"
          >
            <Icon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground/80 font-medium">
              {indicator.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
