/**
 * Reusable Styled Container Components
 * 
 * This file contains common layout containers to avoid repetitive inline styles.
 * Use these components instead of inline sx props for consistent styling.
 */

import { styled, Box, DialogTitle } from '@mui/material';

/**
 * Flex container with column direction and gap
 * Replaces: sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
 */
export const FlexColumn = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

/**
 * Flex container with row direction (default) and gap
 * Replaces: sx={{ display: 'flex', gap: 2 }}
 */
export const FlexRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}));

/**
 * Flex container with items centered vertically and gap
 * Replaces: sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
 */
export const FlexRowCenter = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

/**
 * Flex container with items centered vertically and small gap (0.5)
 * Replaces: sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
 */
export const FlexRowCenterTight = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

/**
 * Flex container with space-between justification and centered items
 * Replaces: sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
 */
export const FlexSpaceBetween = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

/**
 * Page header with title and action buttons
 * Replaces: sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
 */
export const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

/**
 * Dialog title with flex layout for close button
 * Replaces: <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 */
export const FlexDialogTitle = styled(DialogTitle)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

/**
 * Search and filters container
 * Replaces: sx={{ mb: 3, display: 'flex', gap: 2 }}
 */
export const FiltersContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  display: 'flex',
  gap: theme.spacing(2),
}));

/**
 * Flex container with wrap and small gap for chips/tags
 * Replaces: sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}
 */
export const ChipsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
}));

/**
 * Centered flex container for loading/empty states
 * Replaces: sx={{ display: 'flex', justifyContent: 'center', py: 8 }}
 */
export const CenteredContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
}));

/**
 * Flex column with centered items and gap
 * Replaces: sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
 */
export const FlexColumnCenter = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

/**
 * Flex container with end-aligned items
 * Replaces: sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}
 */
export const FlexRowEnd = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

/**
 * Flex container centered horizontally
 * Replaces: sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}
 */
export const FlexRowCenterJustified = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'center',
}));
