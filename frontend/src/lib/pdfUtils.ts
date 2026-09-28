/**
 * PDF Export Utility
 * Provides watermark CSS and HTML for print/PDF exports across all pages.
 */

export function getPdfWatermarkCss(): string {
  return `
    .pdf-watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      opacity: 0.06;
      z-index: 0;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 450px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .watermark-img {
      max-width: 220px;
      max-height: 220px;
      object-fit: contain;
      filter: grayscale(100%);
      margin-bottom: 12px;
    }
    .watermark-svg {
      width: 180px;
      height: 180px;
      margin-bottom: 12px;
    }
    .watermark-name {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #000;
      white-space: nowrap;
    }
    @media print {
      .pdf-watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-15deg);
        opacity: 0.06 !important;
        display: flex !important;
        z-index: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
}

export function getPdfWatermarkHtml(shopName: string, logoUrl?: string): string {
  const safeName = shopName || "Chai Craft";
  if (logoUrl) {
    return `
      <div class="pdf-watermark">
        <img src="${logoUrl}" alt="${safeName}" class="watermark-img" onerror="this.style.display='none'" />
        <div class="watermark-name">${safeName}</div>
      </div>
    `;
  }
  return `
    <div class="pdf-watermark">
      <svg class="watermark-svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
        <line x1="6" y1="2" x2="6" y2="4"></line>
        <line x1="10" y1="2" x2="10" y2="4"></line>
        <line x1="14" y1="2" x2="14" y2="4"></line>
      </svg>
      <div class="watermark-name">${safeName}</div>
    </div>
  `;
}

export function getPdfHeaderHtml(shopName: string, shopAddress?: string, reportTitle?: string, logoUrl?: string): string {
  const safeName = shopName || "Chai Craft";
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover; border: 1px solid #e2e8f0;" onerror="this.style.display='none'" />`
    : `<div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #d97706, #ea580c); display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: bold; box-shadow: 0 2px 6px rgba(217,119,6,0.3);">☕</div>`;

  return `
    <div class="header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        ${logoHtml}
        <div>
          <h1 class="shop-title" style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">${safeName}</h1>
          <div class="shop-meta" style="font-size: 11px; color: #64748b; margin-top: 2px;">${shopAddress || "Artisan Tea & Cafe Enterprise"}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="report-badge" style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px; display: inline-block;">${reportTitle || "REPORT"}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Generated: ${new Date().toLocaleString()}</div>
      </div>
    </div>
  `;
}
