import React from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * Опция для Select
 */
export interface SelectOption {
  /** Значение опции */
  value: string | number;
  /** Отображаемый текст */
  label: string;
  /** Опция неактивна */
  disabled?: boolean;
}

/**
 * Props для универсального Select
 */
interface SelectProps {
  /** Имя поля */
  name: string;
  /** Метка поля */
  label: string;
  /** Выбранное значение */
  value: string | number | string[] | number[];
  /** Обработчик изменения */
  onChange: (value: string | number | string[] | number[]) => void;
  /** Список опций */
  options: SelectOption[];
  /** Есть ошибка */
  error?: boolean;
  /** Текст подсказки/ошибки */
  helperText?: string;
  /** Обязательное поле */
  required?: boolean;
  /** Поле неактивно */
  disabled?: boolean;
  /** Поле занимает всю ширину */
  fullWidth?: boolean;
  /** Placeholder */
  placeholder?: string;
  /** Множественный выбор */
  multiple?: boolean;
}

/**
 * Универсальный Select
 *
 * @example
 * ```tsx
 * <Select
 *   name="status"
 *   label="Статус"
 *   value={status}
 *   onChange={setStatus}
 *   options={[
 *     { value: 'active', label: 'Активен' },
 *     { value: 'inactive', label: 'Неактивен' },
 *   ]}
 *   required
 *   fullWidth
 * />
 * ```
 */
const Select: React.FC<SelectProps> = React.memo(({
  name,
  label,
  value,
  onChange,
  options,
  error = false,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  placeholder,
  multiple = false,
}) => {
  const labelId = `${name}-label`;

  // Ensure value is always the correct type based on multiple prop
  const normalizedValue = multiple 
    ? (Array.isArray(value) ? value : [])
    : (value ?? '');

  // Check if there are selected values (for clear button)
  const hasSelectedValues = multiple && Array.isArray(normalizedValue) && normalizedValue.length > 0;

  // Handle clear all for multiselect
  const handleClearAll = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange([]);
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      error={error}
      required={required}
      disabled={disabled}
      variant="outlined"
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      <MuiSelect
        labelId={labelId}
        name={name}
        value={normalizedValue}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty={!!placeholder}
        multiple={multiple}
        endAdornment={
          hasSelectedValues && !disabled ? (
            <InputAdornment position="end" sx={{ marginRight: 3 }}>
              <IconButton
                size="small"
                onClick={handleClearAll}
                onMouseDown={(e) => e.stopPropagation()}
                edge="end"
                sx={{ padding: 0.5 }}
                aria-label="Clear all"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined
        }
      >
        {placeholder && !multiple && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
});

Select.displayName = 'Select';

export default Select;
