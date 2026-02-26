import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

const sectionTitles: Record<string, string> = {
  'staff-actions': 'Действия сотрудников',
  'usage': 'Использование',
  'error-log': 'Журнал ошибок',
};

export const StatisticsPage = () => {
  const { section } = useParams<{ section: string }>();
  const title = section ? sectionTitles[section] || 'Статистика' : 'Статистика';

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Статистика: {title}
      </Typography>

      <Paper sx={{ p: 3, mt: 2, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            gap: 2,
          }}
        >
          <InfoIcon sx={{ fontSize: 80, color: 'primary.main', opacity: 0.5 }} />
          <Typography variant="h5" color="text.secondary">
            В разработке
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Функционал статистики будет добавлен в следующих версиях
          </Typography>
          <Alert severity="info" sx={{ mt: 2, maxWidth: 600 }}>
            Этот раздел является заготовкой (stub) согласно техническому заданию. На данном
            этапе MVP здесь не реализована функциональность и не выполняются запросы к API.
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
};
