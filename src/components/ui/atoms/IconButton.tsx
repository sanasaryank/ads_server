import React, { type ReactNode } from 'react';
import { IconButton as MuiIconButton, Tooltip } from '@mui/material';

/**
 * Props для универсальной кнопки с иконкой
 */
interface IconButtonProps {
  /** Иконка */
  icon: ReactNode;
  /** Обработчик клика */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Цветовая схема */
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default';
  /** Размер кнопки */
  size?: 'small' | 'medium' | 'large';
  /** Кнопка неактивна */
  disabled?: boolean;
  /** Текст всплывающей подсказки */
  tooltip?: string;
}

/**
 * Универсальная кнопка с иконкой
 *
 * @example
 * ```tsx
 * <IconButton
 *   icon={<DeleteIcon />}
 *   onClick={handleDelete}
 *   color="error"
 *   tooltip="Удалить"
 * />
 * ```
 */
const IconButton: React.FC<IconButtonProps> = React.memo(({
  icon,
  onClick,
  color = 'default',
  size = 'medium',
  disabled = false,
  tooltip,
}) => {
  const button = (
    <MuiIconButton
      onClick={onClick}
      color={color}
      size={size}
      disabled={disabled}
    >
      {icon}
    </MuiIconButton>
  );

  if (tooltip && !disabled) {
    return (
      <Tooltip title={tooltip} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
});

IconButton.displayName = 'IconButton';

export default IconButton;
