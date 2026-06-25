'use client';

import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex h-10 items-center gap-1 rounded-xl border bg-white/80 p-1 shadow-sm">
      {(['en', 'th'] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLanguage(item)}
          className={cn(
            'h-7 rounded-lg px-2 text-xs font-semibold uppercase transition',
            language === item ? 'bg-slate-950 text-white' : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
          )}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
