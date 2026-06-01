import { useEffect, useRef, useState } from 'react';

const CANVAS_SIZE = 280;
const OUTPUT_SIZE = 400;

export default function AvatarCropModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const fillScaleRef = useRef(1);
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });

  const [crop, setCrop] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Inline clamp — keeps image fully covering the 280×280 area at the given scale
  const clamp = (sc, ox, oy) => {
    const img = imgRef.current;
    if (!img) return { scale: sc, x: ox, y: oy };
    const half = CANVAS_SIZE / 2;
    const hw = (img.width * sc) / 2;
    const hh = (img.height * sc) / 2;
    const maxX = hw - half;
    const maxY = hh - half;
    return {
      scale: sc,
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  };

  // Load image, compute fill scale, set initial state
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const fs = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
      fillScaleRef.current = fs;
      setCrop({ scale: fs, x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw canvas whenever crop state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(
      img,
      crop.x - (img.width * crop.scale) / 2 + CANVAS_SIZE / 2,
      crop.y - (img.height * crop.scale) / 2 + CANVAS_SIZE / 2,
      img.width * crop.scale,
      img.height * crop.scale
    );
  }, [crop]);

  // Wheel zoom — non-passive so preventDefault works
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e) => {
      e.preventDefault();
      setCrop((prev) => {
        const fs = fillScaleRef.current;
        const img = imgRef.current;
        if (!img) return prev;
        const newScale = Math.max(fs, Math.min(fs * 3, prev.scale - e.deltaY * 0.001));
        return clamp(newScale, prev.x, prev.y);
      });
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Touch move — non-passive so preventDefault works (prevents page scroll)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e) => {
      if (!dragRef.current.active) return;
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - dragRef.current.lastX;
      const dy = t.clientY - dragRef.current.lastY;
      dragRef.current.lastX = t.clientX;
      dragRef.current.lastY = t.clientY;
      setCrop((prev) => clamp(prev.scale, prev.x + dx, prev.y + dy));
    };
    canvas.addEventListener('touchmove', handler, { passive: false });
    return () => canvas.removeEventListener('touchmove', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Document-level mouse move/up so drag continues outside the canvas
  useEffect(() => {
    const handleMove = (e) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      setCrop((prev) => clamp(prev.scale, prev.x + dx, prev.y + dy));
    };
    const handleUp = () => {
      dragRef.current.active = false;
      setIsDragging(false);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseDown = (e) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    setIsDragging(true);
  };

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    dragRef.current = { active: true, lastX: t.clientX, lastY: t.clientY };
  };

  const handleTouchEnd = () => {
    dragRef.current.active = false;
  };

  const handleSliderChange = (e) => {
    const multiplier = Number(e.target.value);
    const fs = fillScaleRef.current;
    const newScale = Math.max(fs, Math.min(fs * 3, fs * multiplier));
    setCrop((prev) => clamp(newScale, prev.x, prev.y));
  };

  const handleApply = () => {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement('canvas');
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext('2d');
    const r = OUTPUT_SIZE / CANVAS_SIZE;
    ctx.drawImage(
      img,
      crop.x * r - (img.width * crop.scale * r) / 2 + OUTPUT_SIZE / 2,
      crop.y * r - (img.height * crop.scale * r) / 2 + OUTPUT_SIZE / 2,
      img.width * crop.scale * r,
      img.height * crop.scale * r
    );
    out.toBlob((blob) => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.9);
  };

  const sliderValue = fillScaleRef.current > 0 ? crop.scale / fillScaleRef.current : 1;

  return (
    <div className="fixed inset-0 bg-black/70 z-[90] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4" style={{ width: 400 }}>

        <p className="font-semibold text-gray-800">Adjust Photo</p>

        {/* Circular canvas viewport */}
        <div className="flex justify-center">
          <div
            className="rounded-full overflow-hidden border-2 flex-shrink-0"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, borderColor: '#409645' }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={{ display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-10 flex-shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={sliderValue}
            onChange={handleSliderChange}
            className="flex-1 accent-[#409645]"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="btn-brand-outline px-4 py-2 rounded text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="btn-brand text-white px-4 py-2 rounded text-sm font-medium"
          >
            Apply
          </button>
        </div>

      </div>
    </div>
  );
}
