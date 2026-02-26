/**
 * Reusable Error Fallback Components
 * Provides contextual error UIs for different features
 */

import { Box, Button, Typography, Paper, Container } from '@mui/material';
import { ErrorOutline, Refresh, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { navigationService } from '../../utils/navigationService';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
  onReset?: () => void;
}

/**
 * Generic error fallback component
 */
export const ErrorFallback = ({
  title,
  message,
  showBackButton = true,
  onReset,
}: ErrorFallbackProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(-1);
  };

  const handleReload = () => {
    navigationService.reload();
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          py: 8,
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 600,
            width: '100%',
          }}
        >
          <ErrorOutline
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2,
            }}
          />
          <Typography variant="h4" component="h1" gutterBottom>
            {title || t('error.somethingWentWrong')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {message || t('error.pleaseRefresh')}
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {onReset && (
              <Button variant="outlined" onClick={onReset} startIcon={<Refresh />}>
                {t('common.retry')}
              </Button>
            )}
            {showBackButton && (
              <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                {t('common.back')}
              </Button>
            )}
            <Button variant="contained" onClick={handleReload} startIcon={<Refresh />}>
              {t('common.reload')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

/**
 * Restaurants feature error fallback
 */
export const RestaurantsErrorFallback = () => {
  const { t } = useTranslation();
  return (
    <ErrorFallback
      title={t('error.restaurantsLoadFailed')}
      message={t('error.restaurantsLoadFailedMessage')}
    />
  );
};

/**
 * Advertisement feature error fallback
 */
export const AdvertisementErrorFallback = () => {
  const { t } = useTranslation();
  return (
    <ErrorFallback
      title={t('error.advertisementLoadFailed')}
      message={t('error.advertisementLoadFailedMessage')}
    />
  );
};

/**
 * Dictionaries feature error fallback
 */
export const DictionariesErrorFallback = () => {
  const { t } = useTranslation();
  return (
    <ErrorFallback
      title={t('error.dictionariesLoadFailed')}
      message={t('error.dictionariesLoadFailedMessage')}
    />
  );
};

/**
 * Statistics feature error fallback
 */
export const StatisticsErrorFallback = () => {
  const { t } = useTranslation();
  return (
    <ErrorFallback
      title={t('error.statisticsLoadFailed')}
      message={t('error.statisticsLoadFailedMessage')}
    />
  );
};
