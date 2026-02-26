import React from 'react';
import { TextField as MuiTextField, type InputProps as MuiInputProps } from '@mui/material';

/**
 * Props для универсального текстового поля
 */
interface TextFieldProps {
  /** Имя поля */
  name: string;
  /** Метка поля */
  label: string;
  /** Тип поля */
  type?: 'text' | 'password' | 'email' | 'number' | 'url' | 'date';
  /** Placeholder */
  placeholder?: string;
  /** Значение поля */
  value?: string | number;
  /** Обработчик изменения */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Обработчик потери фокуса */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
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
  /** Многострочное поле */
  multiline?: boolean;
  /** Количество строк для многострочного поля */
  rows?: number;
  /** Дополнительные props для Input */
  InputProps?: Partial<MuiInputProps>;
}

/**
 * Универсальное текстовое поле
 *
 * @example
 * ```tsx
 * <TextField
 *   name="email"
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={handleChange}
 *   error={!!errors.email}
 *   helperText={errors.email}
 *   required
 *   fullWidth
 * />
 * ```
 */
const TextField: React.FC<TextFieldProps> = React.memo(({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error = false,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  multiline = false,
  rows,
  InputProps,
}) => {
  return (
    <MuiTextField
      name={name}
      label={label}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      InputProps={InputProps}
      variant="outlined"
    />
  );
});

TextField.displayName = 'TextField';

export default TextField;
