import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '../../../assets/icons';

// ── XMarkIcon ─────────────────────────────────────────────────────────────────

// ── Props ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Ancho máximo del panel. Por defecto 'md' (max-w-md ≈ 448 px). */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

// ── Modal ─────────────────────────────────────────────────────────────────────

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const [visible, setVisible] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const id = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 170);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!visible) return null;

  const content = (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] ${closing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centrado */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`${closing ? 'animate-modal-out' : 'animate-modal-in'} bg-white rounded-lg shadow-xl w-full ${sizeClass[size]} p-6`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
            >
              <XMarkIcon className="w-5 h-5 shrink-0" />
            </button>
          </div>

          {children}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
