/**
 * Error Boundary Component
 * Catches React errors and provides fallback UI
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box, Button, Typography, Paper, Container } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { navigationService } from '../../utils/navigationService';

interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: string[]; // Keys that when changed will reset the error boundary
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetCount: number; // Used to force remount of children
}

/**
 * Error Boundary to catch and handle React component errors
 */
class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error using centralized logger
    logger.error('Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    navigationService.reload();
  };

  render(): ReactNode {
    const { t } = this.props;
    
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              py: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                width: '100%',
                maxWidth: 600,
              }}
            >
              <ErrorOutline
                sx={{
                  fontSize: 64,
                  color: 'error.main',
                  mb: 2,
                }}
              />
              
              <Typography variant="h4" gutterBottom color="error">
                {t('error.somethingWentWrong')}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {t('error.pleaseRefresh')}
              </Typography>

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 3,
                    textAlign: 'left',
                    bgcolor: 'grey.50',
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      m: 0,
                    }}
                  >
                    {this.state.error.toString()}
                    {this.state.errorInfo && `\n\n${this.state.errorInfo.componentStack}`}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={this.handleReset}
                  startIcon={<Refresh />}
                >
                  {t('error.tryAgain')}
                </Button>
                
                <Button
                  variant="contained"
                  onClick={this.handleReload}
                  color="primary"
                >
                  {t('error.reloadPage')}
                </Button>
              </Box>

              {!import.meta.env.DEV && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 3 }}
                >
                  {t('error.contactSupport')}
                </Typography>
              )}
            </Paper>
          </Box>
        </Container>
      );
    }

    // Add key to force remount on reset
    return <React.Fragment key={this.state.resetCount}>{this.props.children}</React.Fragment>;
  }
}

/**
 * Hook for error boundaries in functional components
 * Wraps component with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children' | 't' | 'i18n' | 'tReady'>,
) => {
  return (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// Export wrapped component with translation HOC
export const ErrorBoundary = withTranslation()(ErrorBoundaryComponent);

export default ErrorBoundary;
