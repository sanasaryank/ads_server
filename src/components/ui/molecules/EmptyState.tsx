import React, { type ReactNode } from 'react';
import {
  Box,
  Typography,
  Stack,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

/**
 * Props для компонента пустого состояния
 */
export interface EmptyStateProps {
  /** Иконка */
  icon?: ReactNode;
  /** Заголовок */
  title: string;
  /** Описание */
  description?: string;
  /** Действие (обычно кнопка) */
  action?: ReactNode;
}

/**
 * Компонент пустого состояния
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<PersonAddIcon sx={{ fontSize: 60 }} />}
 *   title="Нет пользователей"
 *   description="Начните с добавления первого пользователя в систему"
 *   action={
 *     <Button
 *       variant="contained"
 *       startIcon={<AddIcon />}
 *       onClick={handleAddUser}
 *     >
 *       Добавить пользователя
 *     </Button>
 *   }
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Stack spacing={2} alignItems="center">
        {/* Иконка */}
        <Box
          sx={{
            color: 'text.disabled',
            mb: 1,
          }}
        >
          {icon || <InboxIcon sx={{ fontSize: 80 }} />}
        </Box>

        {/* Заголовок */}
        <Typography variant="h5" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>

        {/* Описание */}
        {description && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 500 }}
          >
            {description}
          </Typography>
        )}

        {/* Действие */}
        {action && (
          <Box sx={{ mt: 2 }}>
            {action}
          </Box>
        )}
      </Stack>
    </Box>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
