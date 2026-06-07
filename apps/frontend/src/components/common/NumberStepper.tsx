'use client';

import { Minus, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NumberStepperProps {
  id?: string;
  value: number | '';
  onChange: (value: number | '') => void;
  min?: number;
  max?: number;
  label?: string;
  required?: boolean;
  prefix?: string;
  allowDecimals?: boolean;
  stepAmount?: number;
}

export function NumberStepper({
  id,
  value,
  onChange,
  min = 1,
  max = 365,
  label,
  required,
  prefix,
  allowDecimals = false,
  stepAmount = 1,
}: NumberStepperProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    if (!isFocused) {
      if (value === '') {
        setInputValue('');
      } else {
        if (allowDecimals) {
          setInputValue(value.toFixed(2).replace('.', ','));
        } else {
          setInputValue(value.toString());
        }
      }
    }
  }, [value, isFocused, allowDecimals]);

  const handleDecrement = () => {
    const next = Math.max(min, numericValue - stepAmount);
    onChange(allowDecimals ? parseFloat(next.toFixed(2)) : next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, numericValue + stepAmount);
    onChange(allowDecimals ? parseFloat(next.toFixed(2)) : next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    
    if (raw === '') {
      onChange('');
      return;
    }
    
    const normalized = raw.replace(',', '.');
    const parsed = allowDecimals ? parseFloat(normalized) : parseInt(normalized, 10);
    
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value !== '') {
      setInputValue(allowDecimals ? value.toString().replace('.', ',') : value.toString());
    }
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={numericValue <= min}
          className="flex items-center justify-center h-[46px] w-12 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Diminuir"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="relative flex-grow h-[46px]">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
              {prefix}
            </span>
          )}
          <input
            type="text"
            inputMode={allowDecimals ? "decimal" : "numeric"}
            pattern={allowDecimals ? "[0-9.,]*" : "[0-9]*"}
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            required={required}
            className={`h-full w-full border-y border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${prefix ? 'pl-8 pr-3 text-left' : 'text-center'}`}
          />
        </div>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={numericValue >= max}
          className="flex items-center justify-center h-[46px] w-12 rounded-r-xl border border-l-0 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Aumentar"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
