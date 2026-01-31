import React, { type ReactNode } from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';

/**
 * Props для универсальной кнопки
 */
interface ButtonProps {
  /** Вариант отображения кнопки */
  variant?: 'contained' | 'outlined' | 'text';
  /** Цветовая схема кнопки */
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  /** Размер кнопки */
  size?: 'small' | 'medium' | 'large';
  /** Кнопка занимает всю ширину родителя */
  fullWidth?: boolean;
  /** Кнопка неактивна */
  disabled?: boolean;
  /** Состояние загрузки */
  loading?: boolean;
  /** Иконка в начале */
  startIcon?: ReactNode;
  /** Иконка в конце */
  endIcon?: ReactNode;
  /** Обработчик клика */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Тип кнопки */
  type?: 'button' | 'submit' | 'reset';
  /** Содержимое кнопки */
  children: ReactNode;
}

/**
 * Универсальная кнопка с поддержкой loading state
 *
 * @example
 * ```tsx
 * <Button
 *   variant="contained"
 *   color="primary"
 *   loading={isLoading}
 *   onClick={handleClick}
 * >
 *   Сохранить
 * </Button>
 * ```
 */
const Button: React.FC<ButtonProps> = React.memo(({
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  children,
}) => {
  return (
    <MuiButton
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      startIcon={loading ? undefined : startIcon}
      endIcon={loading ? undefined : endIcon}
      onClick={onClick}
      type={type}
    >
      {loading ? (
        <>
          <CircularProgress
            size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
            color="inherit"
            sx={{ mr: 1 }}
          />
          {children}
        </>
      ) : (
        children
      )}
    </MuiButton>
  );
});

Button.displayName = 'Button';

export default Button;
