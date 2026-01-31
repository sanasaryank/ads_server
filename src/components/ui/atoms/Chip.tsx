import React, { type ReactElement } from 'react';
import { Chip as MuiChip } from '@mui/material';

/**
 * Props для универсального Chip
 */
interface ChipProps {
  /** Текст чипа */
  label: string;
  /** Цветовая схема */
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  /** Вариант отображения */
  variant?: 'filled' | 'outlined';
  /** Размер чипа */
  size?: 'small' | 'medium';
  /** Обработчик удаления */
  onDelete?: () => void;
  /** Иконка */
  icon?: ReactElement;
}

/**
 * Универсальный Chip
 *
 * @example
 * ```tsx
 * <Chip
 *   label="Active"
 *   color="success"
 *   variant="filled"
 *   size="small"
 * />
 * ```
 */
const Chip: React.FC<ChipProps> = React.memo(({
  label,
  color = 'default',
  variant = 'filled',
  size = 'medium',
  onDelete,
  icon,
}) => {
  return (
    <MuiChip
      label={label}
      color={color}
      variant={variant}
      size={size}
      onDelete={onDelete}
      icon={icon}
    />
  );
});

Chip.displayName = 'Chip';

export default Chip;
