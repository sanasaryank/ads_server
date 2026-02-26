import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Chip from '../atoms/Chip';

/**
 * Props для chip отображения статуса
 */
export interface StatusChipProps {
  /** Статус */
  status: 'active' | 'blocked' | 'pending' | string;
  /** Кастомный текст (по умолчанию берется из маппинга) */
  label?: string;
}

/**
 * Маппинг статусов на цвета
 */
const statusColorMap: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  active: 'success',
  blocked: 'error',
  pending: 'warning',
  inactive: 'default',
  draft: 'info',
  published: 'success',
  archived: 'default',
};

/**
 * Chip для отображения статуса
 *
 * @example
 * ```tsx
 * <StatusChip status="active" />
 * <StatusChip status="blocked" />
 * <StatusChip status="custom" label="Кастомный статус" />
 * ```
 */
const StatusChip: React.FC<StatusChipProps> = React.memo(({
  status,
  label,
}) => {
  const { t } = useTranslation();

  /**
   * Получение цвета статуса
   */
  const color = useMemo(() => {
    return statusColorMap[status.toLowerCase()] || 'default';
  }, [status]);

  /**
   * Получение метки статуса
   */
  const statusLabel = useMemo(() => {
    const statusKey = status.toLowerCase();
    const translationKey = `status.${statusKey}`;
    return t(translationKey, status);
  }, [status, t]);

  /**
   * Финальный текст для отображения
   */
  const displayLabel = useMemo(
    () => label || statusLabel,
    [label, statusLabel]
  );

  return (
    <Chip
      label={displayLabel}
      color={color}
      size="small"
      variant="filled"
    />
  );
});

StatusChip.displayName = 'StatusChip';

export default StatusChip;
