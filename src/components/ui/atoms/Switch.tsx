import React from 'react';
import { Switch as MuiSwitch, FormControlLabel } from '@mui/material';

/**
 * Props для универсального Switch
 */
interface SwitchProps {
  /** Имя поля */
  name?: string;
  /** Состояние переключателя */
  checked: boolean;
  /** Обработчик изменения */
  onChange: (checked: boolean) => void;
  /** Метка переключателя */
  label?: string;
  /** Переключатель неактивен */
  disabled?: boolean;
  /** Цветовая схема */
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

/**
 * Универсальный переключатель
 *
 * @example
 * ```tsx
 * <Switch
 *   checked={isEnabled}
 *   onChange={setIsEnabled}
 *   label="Включить уведомления"
 *   color="primary"
 * />
 * ```
 */
const Switch: React.FC<SwitchProps> = React.memo(({
  name,
  checked,
  onChange,
  label,
  disabled = false,
  color = 'primary',
}) => {
  const switchElement = (
    <MuiSwitch
      name={name}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      color={color}
    />
  );

  if (label) {
    return (
      <FormControlLabel
        control={switchElement}
        label={label}
        disabled={disabled}
      />
    );
  }

  return switchElement;
});

Switch.displayName = 'Switch';

export default Switch;
