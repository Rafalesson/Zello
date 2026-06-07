// Endereço: apps/frontend/src/components/AutocompleteSearch.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

type Option = { id: string | number; [key: string]: unknown; };

type AutocompleteSearchProps<T extends Option> = {
  label: string;
  placeholder: string;
  initialValue?: T | null;
  displayValue: (option: T) => string;
  onSearch: (query: string) => Promise<T[]>;
  renderOption: (option: T) => React.ReactNode;
  onSelect: (option: T | null) => void;
};

export function AutocompleteSearch<T extends Option>({
  label,
  placeholder,
  initialValue = null,
  displayValue,
  onSearch,
  renderOption,
  onSelect,
}: AutocompleteSearchProps<T>) {

  const [query, setQuery] = useState(initialValue ? displayValue(initialValue) : '');
  const [results, setResults] = useState<T[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setQuery(initialValue ? displayValue(initialValue) : '');
  }, [initialValue, displayValue]);


  useEffect(() => {
    if (initialValue && query === displayValue(initialValue)) {
        setResults([]);
        return;
    }

    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const timerId = setTimeout(() => {
      setIsLoading(true);
      onSearch(query).then(searchResult => {
        setResults(searchResult);
        setIsLoading(false);
      });
    }, 300);

    return () => {
      clearTimeout(timerId);
      setIsLoading(false);
    };
  }, [query, initialValue, displayValue, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value === '') {
        onSelect(null);
    }
  };

  const handleSelect = (option: T) => {
    setQuery(displayValue(option));
    onSelect(option);
    setResults([]);
    setIsFocused(false);
  };
  
  const handleFocus = async () => {
    setIsFocused(true);
    if(query.trim() === '') {
      setIsLoading(true);
      const searchResult = await onSearch('');
      setResults(searchResult);
      setIsLoading(false);
    }
  }

  return (
    <div className="relative" onBlur={() => setTimeout(() => setIsFocused(false), 200)}>
      <label htmlFor={label} className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={20} />
        <input
          type="text"
          id={label}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="w-full rounded-md border border-gray-300 dark:border-slate-600 p-3 pl-10 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-300 dark:focus:ring-teal-600 focus:border-teal-500 dark:focus:border-teal-500 placeholder-gray-400 dark:placeholder-slate-500"
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {isFocused && (isLoading ? (
            <div className="absolute z-20 w-full mt-1 p-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg text-center text-gray-500 dark:text-slate-400">
                Carregando...
            </div>
        ) : results.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((option) => (
            <li key={option.id} onMouseDown={() => handleSelect(option)}>
              {renderOption(option)}
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}