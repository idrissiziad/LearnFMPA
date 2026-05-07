'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

export interface ModuleImageConfig {
  prefix: string;
  totalPages: number;
  padding: number;
}

export const MODULE_IMAGE_CONFIGS: Record<number, ModuleImageConfig> = {
  1: { prefix: 'pharmacologie', totalPages: 1051, padding: 4 },
  2: { prefix: 'cardiologie', totalPages: 1982, padding: 4 },
  3: { prefix: 'anapath1', totalPages: 545, padding: 3 },
  4: { prefix: 'Sémiologie2', totalPages: 1772, padding: 4 },
  5: { prefix: 'Radiologie', totalPages: 1644, padding: 4 },
  6: { prefix: 'Bioclinique', totalPages: 1001, padding: 4 },
  7: { prefix: 'HE', totalPages: 432, padding: 3 },
  8: { prefix: 'Anato2', totalPages: 421, padding: 3 },
  9: { prefix: 'physio1', totalPages: 852, padding: 3 },
  10: { prefix: 'Hema', totalPages: 1102, padding: 4 },
};

export function getImagePath(config: ModuleImageConfig, pageNum: number): string {
  return `/images/${config.prefix}-${pageNum.toString().padStart(config.padding, '0')}.avif`;
}

export function extractPageFromImagePath(imagePath: string): number | null {
  if (!imagePath) return null;
  const filename = imagePath.split('/').pop() || imagePath;
  const match = filename.match(/-(\d+)\.avif$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

interface ImageViewerProps {
  moduleId: number;
  initialPage?: number;
  onClose: () => void;
}

export default function ImageViewer({ moduleId, initialPage, onClose }: ImageViewerProps) {
  const config = MODULE_IMAGE_CONFIGS[moduleId];
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [pageInput, setPageInput] = useState(String(initialPage || 1));
  const [imageError, setImageError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentPage(initialPage || 1);
    setPageInput(String(initialPage || 1));
    setImageError(false);
  }, [initialPage]);

  const goToPage = useCallback((page: number) => {
    if (!config) return;
    const clamped = Math.max(1, Math.min(page, config.totalPages));
    setCurrentPage(clamped);
    setPageInput(String(clamped));
    setImageError(false);
  }, [config]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToPage(currentPage + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, onClose, goToPage]);

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
  };

  const handlePageInputSubmit = () => {
    const num = parseInt(pageInput, 10);
    if (!isNaN(num)) {
      goToPage(num);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
      (e.target as HTMLInputElement).blur();
    }
  };

  if (!config) return null;

  const imagePath = getImagePath(config, currentPage);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-lg flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10 shrink-0">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Page précédente"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 text-white">
            <input
              ref={inputRef}
              type="text"
              value={pageInput}
              onChange={(e) => handlePageInputChange(e.target.value)}
              onBlur={handlePageInputSubmit}
              onKeyDown={handlePageInputKeyDown}
              className="w-14 text-center bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors"
            />
            <span className="text-white/60 text-sm">/</span>
            <span className="text-white/80 text-sm">{config.totalPages}</span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= config.totalPages}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Page suivante"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="w-10" />
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/15 rounded-2xl transition-colors z-10 hidden sm:block"
          onClick={(e) => { e.stopPropagation(); goToPage(currentPage - 1); }}
          disabled={currentPage <= 1}
        >
          <svg className={`w-8 h-8 text-white ${currentPage <= 1 ? 'opacity-30' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {imageError ? (
          <div className="text-white/60 text-center p-8">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg mb-2">Page {currentPage} non disponible</p>
            <p className="text-sm opacity-60">Cette page n&apos;existe pas dans le cours</p>
          </div>
        ) : (
          <Image
            src={imagePath}
            alt={`Page ${currentPage}`}
            width={1200}
            height={1600}
            className="max-w-full max-h-[calc(100vh-8rem)] object-contain rounded-lg shadow-2xl select-none"
            priority={currentPage === initialPage}
            onError={() => setImageError(true)}
          />
        )}

        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/15 rounded-2xl transition-colors z-10 hidden sm:block"
          onClick={(e) => { e.stopPropagation(); goToPage(currentPage + 1); }}
          disabled={currentPage >= config.totalPages}
        >
          <svg className={`w-8 h-8 text-white ${currentPage >= config.totalPages ? 'opacity-30' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="sm:hidden flex items-center justify-center gap-6 px-4 py-3 bg-black/80 border-t border-white/10 shrink-0">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-white/80 text-sm font-medium">
          Page {currentPage} / {config.totalPages}
        </span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= config.totalPages}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}