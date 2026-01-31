import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack, Card, CardContent, CardActions, Typography, Chip, Tabs, Tab, Skeleton, Dialog, DialogTitle, DialogContent, IconButton as MuiIconButton, Backdrop, CircularProgress } from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { SearchField, ConfirmDialog, FilterDrawer, Pagination, MultilingualNameField, SwitchField } from '../../components/ui/molecules';
import { Button, IconButton, Switch, Select } from '../../components/ui/atoms';
import { useDebounce, useConfirmDialog, useDrawer, useFilters, useMultilingualName, useDialogState, useCreativesData, useEditWithLoading, useCommonFilters } from '../../hooks';
import { useSnackbar } from 'notistack';
import { creativesApi } from '../../api';
import { isApiError } from '../../api/errors';
import { logger } from '../../utils/logger';
import type { Creative, CreativeFormData } from '../../types';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '../../components/ui/molecules';
import { PageHeader, FiltersContainer, FlexColumnCenter } from '../../components/ui/styled';

/**
 * Common iframe style for all creative previews
 */
const IFRAME_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  margin: 0,
  padding: 0,
  display: 'block',
  position: 'absolute',
  top: 0,
  left: 0,
};

/**
 * Maximum number of HTML cache entries to prevent memory leaks
 */
const MAX_HTML_CACHE_SIZE = 50;

/**
 * Fetches external HTML and fixes encoding issues
 */
const fetchAndFixHtml = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    // Try decoding as UTF-8
    let html = new TextDecoder('utf-8').decode(arrayBuffer);
    
    // Check if it contains mojibake patterns, try Windows-1252/Latin-1 instead
    if (/[ÃÂÕÖ]/.test(html) || html.includes('Â©') || html.includes('Â£')) {
      html = new TextDecoder('windows-1252').decode(arrayBuffer);
    }
    
    // Inject CSS to remove body margins/padding
    const styleTag = '<style>body{margin:0;padding:0;overflow:hidden;width:100%;height:100%;}html{height:100%;}</style>';
    
    // Wrap content in a div with 100% dimensions
    const wrapContent = (content: string) => `<div style="height: 100%; width: 100%;">${content}</div>`;
    
    // Add UTF-8 charset if missing
    if (!html.includes('charset')) {
      if (html.includes('<head>') && html.includes('<body>')) {
        html = html.replace(/<head>/i, `<head><meta charset="UTF-8">${styleTag}`);
        html = html.replace(/<body>([\s\S]*?)<\/body>/i, (_match, content) => {
          return `<body>${wrapContent(content)}</body>`;
        });
      } else if (html.includes('<html>')) {
        html = html.replace(/<html>/i, `<html><head><meta charset="UTF-8">${styleTag}</head>`);
        if (html.includes('<body>')) {
          html = html.replace(/<body>([\s\S]*?)<\/body>/i, (_match, content) => {
            return `<body>${wrapContent(content)}</body>`;
          });
        }
      } else {
        html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${styleTag}</head><body>${wrapContent(html)}</body></html>`;
      }
    } else {
      // Charset exists, just add style
      if (html.includes('</head>')) {
        html = html.replace(/<\/head>/i, `${styleTag}</head>`);
      } else if (html.includes('<head>')) {
        html = html.replace(/<head>/i, `<head>${styleTag}`);
      }
      
      if (html.includes('<body>')) {
        html = html.replace(/<body>([\s\S]*?)<\/body>/i, (_match, content) => {
          return `<body>${wrapContent(content)}</body>`;
        });
      }
    }
    
    return html;
  } catch (error) {
    return null;
  }
};

/**
 * Attempts to fix mojibake (garbled text) caused by incorrect encoding
 * Common issue: UTF-8 text interpreted as Latin-1
 */
const fixMojibake = (text: string): string => {
  try {
    // Check if text contains mojibake patterns (multiple combining characters, weird sequences)
    if (!/[\u0080-\u00FF]{2,}/.test(text)) {
      return text; // Doesn't look like mojibake
    }
    
    // Try to fix: encode as Latin-1 bytes, decode as UTF-8
    const latin1Bytes = new Uint8Array(
      [...text].map(char => char.charCodeAt(0) & 0xFF)
    );
    const fixed = new TextDecoder('utf-8').decode(latin1Bytes);
    
    // Verify the fix improved things (should have Armenian characters)
    if (/[\u0530-\u058F]/.test(fixed)) {
      return fixed;
    }
    
    return text; // Fix didn't help, return original
  } catch {
    return text;
  }
};

/**
 * Extracts HTML content from data URL for srcdoc
 * Returns null for non-HTML data URLs (will use src instead)
 */
const extractHtmlContent = (dataUrl: string): string | null => {
  if (!dataUrl.startsWith('data:text/html')) {
    return null; // Not an HTML data URL, use src attribute instead
  }

  try {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) return null;
    
    const htmlContent = dataUrl.substring(commaIndex + 1);
    
    // Decode URL-encoded content
    let html: string;
    try {
      html = decodeURIComponent(htmlContent);
    } catch {
      html = htmlContent;
    }
    
    // Fix mojibake in the HTML content
    html = fixMojibake(html);
    
    // Inject CSS to remove body margins/padding and ensure full coverage
    const styleTag = '<style>body{margin:0;padding:0;overflow:hidden;width:100%;height:100%;}html{height:100%;}</style>';
    
    // Wrap content in a div with 100% dimensions
    const wrapContent = (content: string) => `<div style="height: 100%; width: 100%;">${content}</div>`;
    
    // Ensure UTF-8 charset in HTML
    if (!html.includes('charset')) {
      if (html.includes('<head>') && html.includes('<body>')) {
        // Full HTML structure exists
        html = html.replace(/<head>/i, `<head><meta charset="UTF-8">${styleTag}`);
        html = html.replace(/<body>([\s\S]*?)<\/body>/i, (_match, content) => {
          return `<body>${wrapContent(content)}</body>`;
        });
      } else if (html.includes('<html>')) {
        html = html.replace(/<html>/i, `<html><head><meta charset="UTF-8">${styleTag}</head>`);
        if (html.includes('<body>')) {
          html = html.replace(/<body>([\s\S]*?)<\/body>/i, (_match, content) => {
            return `<body>${wrapContent(content)}</body>`;
          });
        } else {
          html = html.replace(/<\/html>/i, `<body>${wrapContent('')}</body></html>`);
        }
      } else {
        html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${styleTag}</head><body>${wrapContent(html)}</body></html>`;
      }
    } else {
      // Charset exists, just add style and wrap content
      if (html.includes('</head>')) {
        html = html.replace(/<\/head>/i, `${styleTag}</head>`);
      } else if (html.includes('<head>')) {
        html = html.replace(/<head>/i, `<head>${styleTag}`);
      }
      
      if (html.includes('<body>')) {
        html = html.replace(/<body>([\s\S]*?)<\/body>/i, (_match, content) => {
          return `<body>${wrapContent(content)}</body>`;
        });
      }
    }
    
    return html;
  } catch (error) {
    return null;
  }
};

const createCreativeSchema = (t: (key: string) => string) =>
  z.object({
    campaignId: z.string().min(1, t('creatives.validation.campaignRequired')),
    name: z.object({
      ARM: z.string().min(1, t('creatives.validation.nameRequired')),
      ENG: z.string().min(1, t('creatives.validation.nameRequired')),
      RUS: z.string().min(1, t('creatives.validation.nameRequired')),
    }),
    dataUrl: z.string().url(t('creatives.validation.dataUrlInvalid')),
    minHeight: z.number().min(0, t('creatives.validation.minHeightRequired')),
    maxHeight: z.number().min(0, t('creatives.validation.maxHeightRequired')),
    minWidth: z.number().min(0, t('creatives.validation.minWidthRequired')),
    maxWidth: z.number().min(0, t('creatives.validation.maxWidthRequired')),
    previewWidth: z.number().min(1, t('creatives.validation.previewWidthRequired')),
    previewHeight: z.number().min(1, t('creatives.validation.previewHeightRequired')),
    blocked: z.boolean(),
  });

type CreativeFormValues = z.infer<ReturnType<typeof createCreativeSchema>>;

export default memo(function CreativesListPage() {
  const { t } = useTranslation();
  const { getDisplayName } = useMultilingualName();
  const commonFilters = useCommonFilters({ getDisplayName });
  const { enqueueSnackbar } = useSnackbar();
  const confirmDialog = useConfirmDialog();
  const filterDrawer = useDrawer();
  const formDialog = useDialogState<{ id?: string; data?: Creative | null }>();
  const isMountedRef = useRef(true);
  
  // Edit with loading hook
  const { isLoading: isLoadingEdit, handleEdit } = useEditWithLoading<Creative>({
    entityName: 'creative',
    fetchById: async (id) => {
      const data = await creativesApi.getById(String(id));
      return data as any;
    },
    onSuccess: (data, creative) => {
      formDialog.openDialog({ id: String(creative.id), data });
    },
    getEntityId: (creative) => creative.id,
  });
  
  // Use extracted data fetching hook
  const {
    creatives,
    campaigns,
    advertisers,
    loading,
    refetch,
  } = useCreativesData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const { filters, updateFilter, resetFilters } = useFilters<{
    status: string;
    campaignId: string;
  }>({
    status: 'active',
    campaignId: '',
  });
  
  // Store fetched HTML content for external URLs
  const [htmlCache, setHtmlCache] = useState<Record<string, string>>({});
  const [htmlLoading, setHtmlLoading] = useState<Record<string, boolean>>({});
  const [htmlErrors, setHtmlErrors] = useState<Record<string, boolean>>({});
  const cacheAccessOrderRef = useRef<string[]>([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const [activeTab, setActiveTab] = useState(0);

  const schema = createCreativeSchema(t);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CreativeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      campaignId: '',
      name: { ARM: '', ENG: '', RUS: '' },
      dataUrl: '',
      minHeight: 0,
      maxHeight: 0,
      minWidth: 0,
      maxWidth: 0,
      previewWidth: 300,
      previewHeight: 200,
      blocked: false,
    },
  });
  
  // Watch only fields needed for preview
  const dataUrl = useWatch({ control, name: 'dataUrl' });
  const previewWidth = useWatch({ control, name: 'previewWidth' });
  const previewHeight = useWatch({ control, name: 'previewHeight' });

  const handleOpenDialog = useCallback(async (creative?: Creative) => {
    if (creative) {
      handleEdit(creative);
    } else {
      formDialog.openDialog();
      reset({
        campaignId: '',
        name: { ARM: '', ENG: '', RUS: '' },
        dataUrl: '',
        minHeight: 0,
        maxHeight: 0,
        minWidth: 0,
        maxWidth: 0,
        previewWidth: 300,
        previewHeight: 200,
        blocked: false,
      });
    }
    setActiveTab(0);
  }, [formDialog, reset, handleEdit]);

  const handleCloseDialog = useCallback(() => {
    formDialog.closeDialog();
    setActiveTab(0);
    reset();
  }, [formDialog, reset]);

  // Load form data when dialog opens in edit mode
  useEffect(() => {
    if (formDialog.open && formDialog.data?.data) {
      const fullCreative = formDialog.data.data;
      reset({
        campaignId: fullCreative.campaignId,
        name: fullCreative.name,
        dataUrl: fullCreative.dataUrl,
        minHeight: fullCreative.minHeight,
        maxHeight: fullCreative.maxHeight,
        minWidth: fullCreative.minWidth,
        maxWidth: fullCreative.maxWidth,
        previewWidth: fullCreative.previewWidth || 300,
        previewHeight: fullCreative.previewHeight || 200,
        blocked: fullCreative.blocked ?? false,
      });
    }
  }, [formDialog.open, formDialog.data, reset]);

  const handleFormSubmit = useCallback(async (data: CreativeFormValues) => {
    try {
      const formData: CreativeFormData = {
        campaignId: data.campaignId,
        name: data.name,
        dataUrl: data.dataUrl,
        minHeight: Number(data.minHeight),
        maxHeight: Number(data.maxHeight),
        minWidth: Number(data.minWidth),
        maxWidth: Number(data.maxWidth),
        previewWidth: Number(data.previewWidth),
        previewHeight: Number(data.previewHeight),
        blocked: data.blocked,
      };

      if (formDialog.data?.id) {
        const fullCreative = formDialog.data.data;
        formData.id = formDialog.data.id;
        formData.hash = fullCreative?.hash || '';
        await creativesApi.update(formDialog.data.id, formData);
        enqueueSnackbar(t('common.success.updated'), { variant: 'success' });
      } else {
        await creativesApi.create(formData);
        enqueueSnackbar(t('common.success.created'), { variant: 'success' });
      }

      handleCloseDialog();
      await refetch();
    } catch (error) {
      logger.error('Failed to save creative', error as Error, {
        entityType: 'creative',
        creativeId: formDialog.data?.id,
        operation: formDialog.data?.id ? 'update' : 'create'
      });
      
      if (isApiError(error)) {
        if (error.isObjectNotUnique()) {
          enqueueSnackbar(t('error.duplicate'), { variant: 'error' });
        } else if (error.isObjectNotFound()) {
          enqueueSnackbar(t('error.notFound'), { variant: 'error' });
        } else if (error.isObjectChanged()) {
          enqueueSnackbar(t('error.changed'), { variant: 'error' });
        } else {
          enqueueSnackbar(error.getUserMessage(), { variant: 'error' });
        }
      } else {
        enqueueSnackbar(t('common.error.saveFailed'), { variant: 'error' });
      }
    }
  }, [formDialog.data?.id, formDialog.data?.data, creativesApi, t, enqueueSnackbar, handleCloseDialog, refetch]);

  const handleBlock = useCallback(async (creative: Creative) => {
    const action = creative.blocked ? 'unblock' : 'block';
    confirmDialog.open({
      title: t(`creatives.confirm.${action}Title`),
      message: t(`creatives.confirm.${action}Message`, { name: getDisplayName(creative.name) }),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),      onConfirm: async () => {
        try {
          await creativesApi.block(creative.id, !creative.blocked);
          enqueueSnackbar(t(`common.success.${action}ed`), { variant: 'success' });
          await refetch();
        } catch (error) {
          enqueueSnackbar(t('common.error.saveFailed'), { variant: 'error' });
        }
      },
    });
  }, [confirmDialog, t, enqueueSnackbar]);

  const getCampaignName = useCallback((campaignId: string) => {
    const campaign = campaigns.find(c => String(c.id) === campaignId);
    return campaign ? getDisplayName(campaign.name) : '-';
  }, [campaigns, getDisplayName]);

  const getAdvertiserName = useCallback((campaignId: string) => {
    const campaign = campaigns.find(c => String(c.id) === campaignId);
    if (!campaign) return '-';
    const advertiser = advertisers.find(a => String(a.id) === campaign.advertiserId);
    return advertiser ? getDisplayName(advertiser.name) : '-';
  }, [campaigns, advertisers, getDisplayName]);

  const filteredCreatives = useMemo(() => creatives.filter((creative) => {
    // Common filters (status + search)
    const statusFilter = filters.status === 'all' ? 'all' : filters.status as 'active' | 'blocked';
    if (!commonFilters.applyCommonFilters(creative, { 
      status: statusFilter,
      search: debouncedSearch 
    })) {
      return false;
    }
    
    // Campaign filter
    if (filters.campaignId && creative.campaignId !== filters.campaignId) return false;
    
    return true;
  }), [creatives, debouncedSearch, filters, commonFilters]);
  
  // Pagination
  const totalPages = Math.ceil(filteredCreatives.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCreatives = filteredCreatives.slice(startIndex, endIndex);
  
  // Evict old cache entries when limit is exceeded (LRU strategy)
  const evictOldCacheEntries = useCallback((newUrl: string) => {
    const accessOrder = cacheAccessOrderRef.current;
    
    // Update access order (move to end if exists, add if new)
    const existingIndex = accessOrder.indexOf(newUrl);
    if (existingIndex !== -1) {
      accessOrder.splice(existingIndex, 1);
    }
    accessOrder.push(newUrl);
    
    // If cache is full, remove oldest entries
    if (accessOrder.length > MAX_HTML_CACHE_SIZE) {
      const toRemove = accessOrder.splice(0, accessOrder.length - MAX_HTML_CACHE_SIZE);
      
      setHtmlCache(prev => {
        const newCache = { ...prev };
        toRemove.forEach(url => delete newCache[url]);
        return newCache;
      });
      
      setHtmlErrors(prev => {
        const newErrors = { ...prev };
        toRemove.forEach(url => delete newErrors[url]);
        return newErrors;
      });
    }
  }, []);
  
  // Lazy load HTML for visible creatives
  useEffect(() => {
    const loadVisibleHtml = async () => {
      const promises = paginatedCreatives.map(async (creative) => {
        if (creative.dataUrl.startsWith('http') && !htmlCache[creative.dataUrl] && !htmlLoading[creative.dataUrl] && !htmlErrors[creative.dataUrl]) {
          if (!isMountedRef.current) return;
          setHtmlLoading(prev => ({ ...prev, [creative.dataUrl]: true }));
          try {
            const html = await fetchAndFixHtml(creative.dataUrl);
            if (!isMountedRef.current) return;
            if (html) {
              evictOldCacheEntries(creative.dataUrl);
              setHtmlCache(prev => ({ ...prev, [creative.dataUrl]: html }));
            } else {
              evictOldCacheEntries(creative.dataUrl);
              setHtmlErrors(prev => ({ ...prev, [creative.dataUrl]: true }));
            }
          } catch (error) {
            if (!isMountedRef.current) return;
            evictOldCacheEntries(creative.dataUrl);
            setHtmlErrors(prev => ({ ...prev, [creative.dataUrl]: true }));
          } finally {
            if (isMountedRef.current) {
              setHtmlLoading(prev => ({ ...prev, [creative.dataUrl]: false }));
            }
          }
        }
      });
      await Promise.all(promises);
    };
    
    loadVisibleHtml();
  }, [paginatedCreatives, htmlCache, htmlLoading, htmlErrors, evictOldCacheEntries]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.campaignId]);
  
  // Cleanup on unmount - clear caches to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      setHtmlCache({});
      setHtmlLoading({});
      setHtmlErrors({});
      cacheAccessOrderRef.current = [];
    };
  }, []);

  const campaignOptions = useMemo(() => campaigns.map(c => ({ value: String(c.id), label: getDisplayName(c.name) })), [campaigns, getDisplayName]);

  if (loading) {
    return <Box sx={{ p: 3 }}>{t('common.loading')}</Box>;
  }

  return (
    <Box>
      <Backdrop
        open={isLoadingEdit}
        sx={{ zIndex: (theme) => theme.zIndex.modal - 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <PageHeader>
        <Typography variant="h4">{t('creatives.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('creatives.addNew')}
        </Button>
      </PageHeader>

      {/* Search and Filters */}
      <FiltersContainer>
        <Box sx={{ flex: 1 }}>
          <SearchField
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('creatives.search')}
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={filterDrawer.open}
        >
          {t('common.filters')}
        </Button>
      </FiltersContainer>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 3,
        }}
      >
        {paginatedCreatives.map((creative) => (
          <Box key={creative.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  minHeight: 200,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  p: 0,
                  m: 0,
                }}
              >
                <Box
                  sx={{
                    width: creative.previewWidth || 300,
                    height: creative.previewHeight || 200,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    bgcolor: 'white',
                    overflow: 'hidden',
                    position: 'relative',
                    m: 0,
                    p: 0,
                  }}
                >
                {(() => {
                  // Priority 1: Use htmlContent if available (sanitized)
                  if ((creative as any).htmlContent) {
                    return (
                      <iframe
                        srcDoc={(creative as any).htmlContent}
                        style={IFRAME_STYLE}
                        title={getDisplayName(creative.name)}
                        sandbox="allow-scripts"
                      />
                    );
                  }
                  
                  // Priority 2: Check if loading HTML for external URL
                  if (creative.dataUrl.startsWith('http')) {
                    // Show error state if loading failed
                    if (htmlErrors[creative.dataUrl]) {
                      return (
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.100',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            No Image
                          </Typography>
                        </Box>
                      );
                    }
                    
                    if (htmlLoading[creative.dataUrl]) {
                      return (
                        <Skeleton
                          variant="rectangular"
                          width="100%"
                          height="100%"
                          animation="wave"
                          sx={{ position: 'absolute', top: 0, left: 0 }}
                        />
                      );
                    }
                    
                    const cachedHtml = htmlCache[creative.dataUrl];
                    if (cachedHtml) {
                      return (
                        <iframe
                          srcDoc={cachedHtml}
                          style={IFRAME_STYLE}
                          title={getDisplayName(creative.name)}
                          sandbox="allow-scripts"
                        />
                      );
                    }
                  }
                  
                  // Priority 3: Try extracting from data: URL
                  const htmlContent = extractHtmlContent(creative.dataUrl);
                  return htmlContent ? (
                    <iframe
                      srcDoc={htmlContent}
                      style={IFRAME_STYLE}
                      title={getDisplayName(creative.name)}
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <iframe
                      src={creative.dataUrl}
                      style={IFRAME_STYLE}
                      title={getDisplayName(creative.name)}
                      sandbox="allow-scripts"
                    />
                  );
                })()}
                </Box>
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom noWrap>
                  {getDisplayName(creative.name)}
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('creatives.fields.campaign')}:</strong> {getCampaignName(creative.campaignId)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('creatives.fields.advertiser')}:</strong> {getAdvertiserName(creative.campaignId)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{t('creatives.fields.resolution')}:</strong>{' '}
                    {creative.minWidth}x{creative.minHeight} - {creative.maxWidth}x{creative.maxHeight}
                  </Typography>
                </Stack>
                <Box sx={{ mt: 1 }}>
                  {creative.blocked && (
                    <Chip label={t('common.blocked')} color="error" size="small" />
                  )}
                </Box>
              </CardContent>
              <CardActions>
                <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'space-between' }}>
                  <IconButton
                    icon={<EditIcon />}
                    size="small"
                    onClick={() => handleOpenDialog(creative)}
                    aria-label={t('common.edit')}
                  />
                  <Switch
                    checked={!creative.blocked}
                    onChange={() => handleBlock(creative)}
                  />
                </Stack>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {filteredCreatives.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {t('creatives.empty')}
          </Typography>
        </Box>
      )}
      
      {filteredCreatives.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(newRowsPerPage) => {
              setRowsPerPage(newRowsPerPage);
              setPage(1);
            }}
            rowsPerPageOptions={[6, 12, 24, 48]}
            totalCount={filteredCreatives.length}
          />
        </Box>
      )}

      <Dialog 
        open={formDialog.open} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        disableRestoreFocus
        hideBackdrop
        container={() => document.getElementById('modal-root')}
        TransitionProps={{
          timeout: 0,
        }}
        sx={{
          '& .MuiDialog-container': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Box component="span" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
            {formDialog.data?.id ? t('creatives.editTitle') : t('creatives.addTitle')}
          </Box>
          <MuiIconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <CloseIcon />
          </MuiIconButton>
        </DialogTitle>
          
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 3, flexShrink: 0 }}
          >
            <Tab label={t('creatives.tabs.settings')} />
            <Tab label={t('creatives.tabs.preview')} />
          </Tabs>
          
          <DialogContent
          sx={{
            pt: 3,
            pb: 0,
            flexGrow: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box component="form" onSubmit={handleSubmit(handleFormSubmit, (errors) => {
            logger.warn('Form validation errors', { errors, entityType: 'creative' });
          })} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 2 }}>
            {activeTab === 0 && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <FormField
                  name="campaignId"
                  control={control}
                  type="autocomplete"
                  label={t('creatives.fields.campaign')}
                  options={campaignOptions}
                  required
                />
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {t('creatives.fields.name')} *
                  </Typography>
                  <MultilingualNameField
                    control={control}
                    name="name"
                    required
                  />
                </Box>
                <FormField
                  name="dataUrl"
                  control={control}
                  type="text"
                  label={t('creatives.fields.dataUrl')}
                  required
                  helperText={t('creatives.fields.dataUrlHelper')}
                />
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="minWidth"
                    control={control}
                    type="number"
                    label={t('creatives.fields.minWidth')}
                    required
                  />
                  <FormField
                    name="maxWidth"
                    control={control}
                    type="number"
                    label={t('creatives.fields.maxWidth')}
                    required
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="minHeight"
                    control={control}
                    type="number"
                    label={t('creatives.fields.minHeight')}
                    required
                  />
                  <FormField
                    name="maxHeight"
                    control={control}
                    type="number"
                    label={t('creatives.fields.maxHeight')}
                    required
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <FormField
                    name="previewWidth"
                    control={control}
                    type="number"
                    label={t('creatives.fields.previewWidth')}
                    required
                  />
                  <FormField
                    name="previewHeight"
                    control={control}
                    type="number"
                    label={t('creatives.fields.previewHeight')}
                    required
                  />
                </Stack>
                <SwitchField
                  control={control}
                  name="blocked"
                  label={t('creatives.fields.blocked')}
                />
              </Stack>
            )}
            
            {activeTab === 1 && (
              <FlexColumnCenter>
                <Typography variant="body2" color="text.secondary">
                  {t('creatives.preview.description')}
                </Typography>
                {dataUrl && (
                  <Box
                    sx={{
                      minHeight: 200,
                      width: '100%',
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      p: 0,
                      m: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: previewWidth || 300,
                        height: previewHeight || 200,
                        border: '1px solid',
                        borderColor: 'grey.300',
                        bgcolor: 'white',
                        overflow: 'hidden',
                        position: 'relative',
                        m: 0,
                        p: 0,
                      }}
                    >
                      {(() => {
                        // Use dataUrl for preview
                        if (dataUrl) {
                          // Check if we have cached HTML for external URL
                          const cachedHtml = htmlCache[dataUrl as string];
                          if (cachedHtml) {
                            return (
                              <iframe
                                srcDoc={cachedHtml}
                                style={IFRAME_STYLE}
                                title="Preview"
                                sandbox="allow-scripts"
                              />
                            );
                          }
                          
                          // Try extracting from data: URL
                          const htmlContent = extractHtmlContent(dataUrl);
                          return htmlContent ? (
                            <iframe
                              srcDoc={htmlContent}
                              style={IFRAME_STYLE}
                              title="Preview"
                              sandbox="allow-scripts"
                            />
                          ) : (
                            <iframe
                              src={dataUrl}
                              style={IFRAME_STYLE}
                              title="Preview"
                              sandbox="allow-scripts"
                            />
                          );
                        }
                        
                        return null;
                      })()}
                    </Box>
                  </Box>
                )}
                {!dataUrl && (
                  <Typography variant="body2" color="text.secondary">
                    {t('creatives.preview.empty')}
                  </Typography>
                )}
              </FlexColumnCenter>
            )}
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                px: 3,
                py: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                position: 'sticky',
                bottom: 0,
              }}
            >
              <Button onClick={handleCloseDialog} variant="outlined" disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={isSubmitting}
              >
                {t('common.save')}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <FilterDrawer
        open={filterDrawer.isOpen}
        onClose={filterDrawer.close}
        onApply={() => filterDrawer.close()}
        onReset={resetFilters}
        title={t('common.filters')}
      >
        <Select
          name="status"
          label={t('common.statusLabel')}
          value={filters.status}
          onChange={(value) => updateFilter('status', value as 'active' | 'blocked' | 'all')}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'active', label: t('common.active') },
            { value: 'blocked', label: t('common.blocked') },
          ]}
        />

        <Select
          name="campaignId"
          label={t('creatives.fields.campaign')}
          value={filters.campaignId}
          onChange={(value) => updateFilter('campaignId', value ? String(value) : '')}
          options={[
            { value: '', label: t('common.all') },
            ...campaignOptions,
          ]}
        />
      </FilterDrawer>

      <ConfirmDialog {...confirmDialog.dialogProps} />
    </Box>
  );
});
