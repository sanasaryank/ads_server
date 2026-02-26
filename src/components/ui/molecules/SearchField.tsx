import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import TextField from '../atoms/TextField';

/**
 * Props для поля поиска с debounce
 */
export interface SearchFieldProps {
  /** Значение поиска */
  value: string;
  /** Обработчик изменения значения (с debounce) */
  onChange: (value: string) => void;
  /** Placeholder */
  placeholder?: string;
  /** Время задержки debounce в миллисекундах */
  debounceMs?: number;
  /** Поле занимает всю ширину */
  fullWidth?: boolean;
}

/**
 * Поле поиска с debounce
 *
 * @example
 * ```tsx
 * <SearchField
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Поиск пользователей..."
 *   debounceMs={500}
 *   fullWidth
 * />
 * ```
 */
const SearchField: React.FC<SearchFieldProps> = React.memo(({
  value,
  onChange,
  placeholder = 'Поиск...',
  debounceMs = 300,
  fullWidth = true,
}) => {
  // Локальное состояние для мгновенного отображения ввода
  const [localValue, setLocalValue] = useState(value);

  /**
   * Синхронизация локального значения с внешним
   */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Debounced обработчик изменения
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [localValue, debounceMs, onChange, value]);

  /**
   * Обработчик изменения поля
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
    },
    []
  );

  /**
   * Мемоизированные InputProps с иконкой поиска
   */
  const inputProps = useMemo(
    () => ({
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon color="action" />
        </InputAdornment>
      ),
    }),
    []
  );

  return (
    <TextField
      name="search"
      label=""
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      fullWidth={fullWidth}
      InputProps={inputProps}
    />
  );
});

SearchField.displayName = 'SearchField';

export default SearchField;
