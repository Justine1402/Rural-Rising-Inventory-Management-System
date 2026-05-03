import { useEffect, useRef, useState } from 'react';

export default function PinVerificationModal({ isOpen, onVerify, onClose }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleClear = () => {
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const pin = digits.join('');
  const isComplete = pin.length === 6;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 text-xl font-light transition-colors"
        >
          ✕
        </button>

        <div className="text-center">
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: '#1A381E' }}
          >
            Transaction Verification
          </h2>
          <p className="text-sm text-gray-500 mb-8">Enter your 6-Digit Code</p>

          <div className="flex gap-3 justify-center mb-8">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-14 h-16 border-2 border-gray-800 rounded-xl text-center text-2xl font-bold focus:border-[#409645] focus:outline-none transition-colors"
              />
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleClear}
              className="px-8 py-2.5 text-sm font-bold text-white rounded-lg"
              style={{ backgroundColor: '#409645' }}
            >
              CLEAR
            </button>
            <button
              onClick={() => isComplete && onVerify(pin)}
              disabled={!isComplete}
              className="px-8 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#409645' }}
            >
              VERIFY
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
