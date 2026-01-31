import React from 'react';
import {
  Backdrop,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';

/**
 * Props для overlay с индикатором загрузки
 */
export interface LoadingOverlayProps {
  /** Состояние загрузки */
  loading: boolean;
  /** Сообщение о загрузке */
  message?: string;
}

/**
 * Overlay с индикатором загрузки
 *
 * @example
 * ```tsx
 * <LoadingOverlay
 *   loading={isSubmitting}
 *   message="Сохранение данных..."
 * />
 * ```
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = React.memo(({
  loading,
  message,
}) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
      open={loading}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress color="inherit" />
        {message && (
          <Typography variant="body1" color="inherit">
            {message}
          </Typography>
        )}
      </Box>
    </Backdrop>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';

export default LoadingOverlay;
