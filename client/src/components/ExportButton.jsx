import { useState, useCallback } from 'react';

/**
 * ExportButton — Download board as PNG or PDF
 *
 * Uses canvas.toDataURL() for PNG export.
 * For PDF, we embed the PNG in a simple PDF document using a minimal
 * client-side PDF generator (no external dependency).
 */

const styles = {
  wrapper: {
    position: 'relative',
  },
  btn: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '6px',
    background: 'rgba(10, 15, 30, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '4px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    zIndex: 200,
    minWidth: '140px',
    animation: 'fadeIn 0.15s ease-out',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background 0.15s ease',
    textAlign: 'left',
  },
};

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function ExportButton({ canvasRef, boardTitle }) {
  const [showMenu, setShowMenu] = useState(false);

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${boardTitle || 'whiteboard'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setShowMenu(false);
  }, [canvasRef, boardTitle]);

  const exportPDF = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const dpr = window.devicePixelRatio || 1;
    const imgW = canvas.width / dpr;
    const imgH = canvas.height / dpr;

    // Minimal PDF generation (no library needed)
    // PDF coordinates are in points (1pt = 1/72 inch)
    const pdfW = imgW;
    const pdfH = imgH;

    // Convert base64 JPEG data to binary
    const raw = atob(imgData.split(',')[1]);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

    // Build a minimal PDF
    const imgLen = bytes.length;
    const objects = [];
    let xrefPositions = [];

    // Build PDF as string parts
    const header = '%PDF-1.4\n';
    
    // Object 1: Catalog
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    // Object 2: Pages
    const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
    // Object 3: Page
    const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfW} ${pdfH}] /Contents 4 0 R /Resources << /XObject << /Img 5 0 R >> >> >>\nendobj\n`;
    // Object 4: Content stream (draw image full page)
    const content = `q ${pdfW} 0 0 ${pdfH} 0 0 cm /Img Do Q`;
    const obj4 = `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`;
    // Object 5: Image XObject - we'll write this as binary

    const textPart = header + obj1 + obj2 + obj3 + obj4;
    const obj5Header = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgLen} >>\nstream\n`;
    const obj5Footer = '\nendstream\nendobj\n';

    // Calculate xref positions
    let pos = header.length;
    xrefPositions.push(pos); pos += obj1.length;
    xrefPositions.push(pos); pos += obj2.length;
    xrefPositions.push(pos); pos += obj3.length;
    xrefPositions.push(pos); pos += obj4.length;
    xrefPositions.push(pos);

    const xrefStart = textPart.length + obj5Header.length + imgLen + obj5Footer.length;
    let xref = `xref\n0 6\n0000000000 65535 f \n`;
    xrefPositions.forEach((p) => {
      xref += `${p.toString().padStart(10, '0')} 00000 n \n`;
    });
    xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    // Combine into a Blob
    const encoder = new TextEncoder();
    const parts = [
      encoder.encode(textPart + obj5Header),
      bytes,
      encoder.encode(obj5Footer + xref),
    ];
    const blob = new Blob(parts, { type: 'application/pdf' });

    const link = document.createElement('a');
    link.download = `${boardTitle || 'whiteboard'}.pdf`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    setShowMenu(false);
  }, [canvasRef, boardTitle]);

  return (
    <div style={styles.wrapper}>
      <button
        style={styles.btn}
        onClick={() => setShowMenu(!showMenu)}
        title="Export board"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        }}
      >
        <DownloadIcon />
      </button>

      {showMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 199 }}
            onClick={() => setShowMenu(false)}
          />
          <div style={styles.dropdown}>
            <button
              style={styles.option}
              onClick={exportPNG}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              🖼️ Export as PNG
            </button>
            <button
              style={styles.option}
              onClick={exportPDF}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              📄 Export as PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
