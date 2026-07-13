import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

/**
 * Drop-in replacement for native <select>.
 * Calls onChange({ target: { value } }) — compatible with all existing handlers.
 *
 * options: [{ value, label, disabled? }]
 *   Include { value: '', label: 'Placeholder text' } as first item for a placeholder option.
 * compact: true → smaller padding (px-3 py-1.5 text-xs) for inline/table use.
 */
export default function CustomSelect({ value, onChange, options, disabled, compact, borderColor }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Close on outside click (both trigger and panel excluded)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close when the page scrolls (handles overflow-y containers)
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open]);

  const handleOpen = () => {
    if (disabled) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 2, left: rect.left, width: rect.width });
    setOpen((p) => !p);
  };

  const handleSelect = (val) => {
    onChange({ target: { value: String(val) } });
    setOpen(false);
  };

  const selected = options.find((o) => String(o.value) === String(value));
  const isPlaceholder = !selected || selected.value === '';

  const sizeCls = compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        style={borderColor ? { borderColor } : undefined}
        className={`w-full border border-gray-300 rounded-lg ${sizeCls} text-left flex items-center justify-between bg-white focus:outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={isPlaceholder ? 'text-gray-400' : 'text-gray-800'}>
          {selected?.label ?? ''}
        </span>
        <span className="text-gray-400 text-[10px] ml-2 flex-shrink-0">▾</span>
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
          }}
          className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden"
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            const isEmpty = opt.value === '';
            return (
              <button
                key={String(opt.value)}
                type="button"
                disabled={opt.disabled}
                onClick={() => !opt.disabled && handleSelect(opt.value)}
                className={[
                  'w-full text-left px-4 py-2.5 text-sm transition',
                  opt.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : isSelected
                    ? 'text-[#409645] font-medium bg-green-50'
                    : isEmpty
                    ? 'text-gray-400 hover:bg-gray-50'
                    : 'text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                {opt.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}
