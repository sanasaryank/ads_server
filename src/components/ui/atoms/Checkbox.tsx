import React from 'react';
import { Checkbox as MuiCheckbox, FormControlLabel } from '@mui/material';

/**
 * Props для универсального Checkbox
 */
interface CheckboxProps {
  /** Состояние чекбокса */
  checked: boolean;
  /** Обработчик изменения */
  onChange: (checked: boolean) => void;
  /** Метка чекбокса */
  label?: string;
  /** Чекбокс неактивен */
  disabled?: boolean;
  /** Промежуточное состояние */
  indeterminate?: boolean;
}

/**
 * Универсальный Checkbox
 *
 * @example
 * ```tsx
 * <Checkbox
 *   checked={isAgreed}
 *   onChange={setIsAgreed}
 *   label="Я согласен с условиями"
 * />
 * ```
 */
const Checkbox: React.FC<CheckboxProps> = React.memo(({
  checked,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
}) => {
  const checkboxElement = (
    <MuiCheckbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      indeterminate={indeterminate}
    />
  );

  if (label) {
    return (
      <FormControlLabel
        control={checkboxElement}
        label={label}
        disabled={disabled}
      />
    );
  }

  return checkboxElement;
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
