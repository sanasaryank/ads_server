/**
 * Error Boundary Component - Resettable Boundary Pattern
 * 
 * A reusable error boundary that catches React errors and provides fallback UI.
 * Supports automatic reset on prop changes (e.g., navigation) via resetKeys.
 * 
 * @example Basic usage
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 * 
 * @example With reset on route changes
 * ```tsx
 * const location = useLocation();
 * <ErrorBoundary resetKeys={[location.pathname]}>
 *   <Routes />
 * </ErrorBoundary>
 * ```
 * 
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 * 
 * @example With error handler
 * ```tsx
 * <ErrorBoundary onError={(error, errorInfo) => sendToAnalytics(error)}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box, Button, Typography, Paper, Container } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import { navigationService } from '../../utils/navigationService';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps extends WithTranslation {
  /** Child components to wrap with error boundary */
  children: ReactNode;
  
  /** 
   * Custom fallback UI to display when error occurs.
   * If not provided, default error UI will be shown.
   */
  fallback?: ReactNode;
  
  /** 
   * Callback invoked when an error is caught.
   * Useful for logging to external services (Sentry, analytics, etc.)
   * @param error - The error that was thrown
   * @param errorInfo - React error info with component stack
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /** 
   * Array of keys that trigger boundary reset when changed.
   * When any value in this array changes, the error boundary automatically
   * clears its error state and remounts children.
   * 
   * Common use cases:
   * - Route changes: `resetKeys={[location.pathname]}`
   * - User changes: `resetKeys={[user?.id]}`
   * - Data dependencies: `resetKeys={[projectId, userId]}`
   * 
   * Implementation: Uses componentDidUpdate to detect changes and increments
   * resetCount to trigger remount via Fragment key.
   */
  resetKeys?: string[];
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  
  /** The caught error object */
  error: Error | null;
  
  /** React error info with component stack trace */
  errorInfo: ErrorInfo | null;
  
  /** 
   * Counter incremented on each reset to force remount of children.
   * Used as Fragment key to trigger React reconciliation.
   */
  resetCount: number;
}

/**
 * Error Boundary component implementing the Resettable Boundary Pattern.
 * 
 * Features:
 * - Catches errors in child component tree
 * - Provides default and custom fallback UI
 * - Automatic reset on prop changes (via resetKeys)
 * - Manual reset via user action
 * - Error logging integration
 * - Development mode debugging support
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
    // Update state so the next render will show the fallback UI
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

    // Call custom error handler if provided (e.g., send to Sentry)
    this.props.onError?.(error, errorInfo);

    // Update state with additional error info
    this.setState({
      errorInfo,
    });
  }

  /**
   * Implements the Resettable Boundary Pattern.
   * Automatically resets error state when resetKeys change.
   * 
   * This allows the boundary to recover from errors when the context changes,
   * such as navigating to a different route or changing user/data context.
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Only proceed if resetKeys are provided
    if (!this.props.resetKeys || !prevProps.resetKeys) {
      return;
    }

    // Check if any resetKey has changed
    const keysChanged = this.props.resetKeys.some(
      (key, index) => key !== prevProps.resetKeys?.[index]
    );
    
    // Reset error state and increment resetCount to force remount
    if (keysChanged && this.state.hasError) {
      logger.info('Error boundary reset triggered by resetKeys change', {
        oldKeys: prevProps.resetKeys,
        newKeys: this.props.resetKeys,
      });
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        resetCount: this.state.resetCount + 1,
      });
    }
  }

  /**
   * Manually reset error boundary state.
   * Triggered by user clicking "Try Again" button.
   */
  handleReset = (): void => {
    logger.info('Error boundary manual reset triggered');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      resetCount: this.state.resetCount + 1,
    });
  };

  /**
   * Reload the entire page.
   * Triggered by user clicking "Reload Page" button.
   */
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

    // Render children wrapped in Fragment with resetCount as key
    // The key changes on reset, forcing React to unmount and remount children
    return <React.Fragment key={this.state.resetCount}>{this.props.children}</React.Fragment>;
  }
}

/**
 * Higher-Order Component (HOC) to wrap any component with error boundary.
 * 
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   onError: (error) => sendToSentry(error),
 * });
 * ```
 * 
 * @param Component - The component to wrap with error boundary
 * @param errorBoundaryProps - Props to pass to ErrorBoundary (excluding children)
 * @returns Wrapped component with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children' | 't' | 'i18n' | 'tReady'>,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  // Preserve display name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

/**
 * ErrorBoundary component wrapped with translation HOC.
 * This is the main export that should be used in most cases.
 * 
 * @example Basic usage
 * ```tsx
 * import { ErrorBoundary } from './components/common/ErrorBoundary';
 * 
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 * 
 * @example With automatic reset on navigation
 * ```tsx
 * import { ErrorBoundary } from './components/common/ErrorBoundary';
 * import { useLocation } from 'react-router-dom';
 * 
 * function AppWithBoundary() {
 *   const location = useLocation();
 *   return (
 *     <ErrorBoundary resetKeys={[location.pathname]}>
 *       <Routes />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
export const ErrorBoundary = withTranslation()(ErrorBoundaryComponent);

export default ErrorBoundary;
