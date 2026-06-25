'use client';

import { FileDown } from 'lucide-react';
import { Trip } from '@/lib/types';
import { money } from '@/lib/utils';
import { Button } from './ui/button';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function TripExport({ trip }: { trip: Trip }) {
  function exportPdf() {
    const html = `
      <!doctype html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(trip.title)}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            body {
              font-family: "Noto Sans Thai", "Leelawadee UI", "Tahoma", "Arial", sans-serif;
              color: #0f172a;
              line-height: 1.55;
            }
            h1 { font-size: 28px; margin: 0 0 8px; }
            h2 { font-size: 20px; margin: 28px 0 10px; }
            .meta { color: #475569; margin-bottom: 18px; }
            .summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
            .activity { border-left: 3px solid #4f46e5; padding-left: 12px; margin: 10px 0; }
            .time { font-weight: 700; color: #4f46e5; }
            .cost { color: #0f766e; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(trip.title)}</h1>
          <div class="meta">${escapeHtml(trip.destination)} | Budget ${escapeHtml(money(trip.totalBudget))}</div>
          <div class="summary">${escapeHtml(trip.summary || '')}</div>
          ${trip.days
            .map(
              (day) => `
                <h2>Day ${day.dayNumber}</h2>
                ${day.activities
                  .map(
                    (activity) => `
                      <div class="activity">
                        <div><span class="time">${escapeHtml(activity.time)}</span> ${escapeHtml(activity.title)} <span class="cost">- ${escapeHtml(money(activity.estimatedCost))}</span></div>
                        <div>${escapeHtml(activity.location)} | ${escapeHtml(activity.category)}</div>
                        <div>${escapeHtml(activity.description || '')}</div>
                      </div>
                    `
                  )
                  .join('')}
              `
            )
            .join('')}
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const popup = window.open('', '_blank', 'width=900,height=1100');
    if (!popup) return;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  return (
    <Button variant="outline" onClick={exportPdf}>
      <FileDown className="h-4 w-4" /> Export PDF
    </Button>
  );
}
