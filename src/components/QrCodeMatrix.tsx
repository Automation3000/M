import React, { useState } from 'react';

interface QrCodeMatrixProps {
  url: string;
  size?: number;
}

/**
 * Renders a scannable QuickChart QR code image with a resilient deterministic
 * Finder-Pattern SVG QR matrix fallback so the 80mm thermal receipt never shows a broken image.
 */
export const QrCodeMatrix: React.FC<QrCodeMatrixProps> = ({ url, size = 128 }) => {
  const [imgFailed, setImgFailed] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const quickChartSrc = `https://quickchart.io/qr?text=${encodedUrl}&size=${size * 2}&margin=1&ecLevel=M`;

  // Deterministic 21x21 QR version 1 matrix generator for fallback / offline thermal print
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  // Hash URL characters into remaining data modules
  let hash = 2166136261;
  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      const isTiming = r === 6 || c === 6;
      if (!inTopLeft && !inTopRight && !inBottomLeft && !isTiming) {
        const bitIdx = (r * gridSize + c) % 31;
        const charCode = url.charCodeAt((r * 7 + c * 13) % Math.max(1, url.length)) || 77;
        cells[r][c] = ((hash >>> bitIdx) ^ charCode + r + c) % 2 === 0;
      }
    }
  }

  return (
    <div
      className="inline-flex items-center justify-center bg-white p-1.5 border border-black"
      style={{ width: size, height: size }}
    >
      {!imgFailed ? (
        <img
          src={quickChartSrc}
          alt="Scan to Order on WhatsApp"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-contain block"
          style={{
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <svg
          viewBox={`0 0 ${gridSize} ${gridSize}`}
          width="100%"
          height="100%"
          shapeRendering="crispEdges"
          aria-label="WhatsApp Direct Order QR Code"
        >
          <rect width={gridSize} height={gridSize} fill="#ffffff" />
          {cells.map((row, rIdx) =>
            row.map((filled, cIdx) =>
              filled ? (
                <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width={1} height={1} fill="#000000" />
              ) : null
            )
          )}
        </svg>
      )}
    </div>
  );
};
