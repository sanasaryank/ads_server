import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

const languages = [
  { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export const LoginPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { login, isLoading, error } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login({ username, password });
      navigate('/');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    handleLanguageMenuClose();
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left side - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 4,
          py: 8,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Logo */}
          <Box sx={{ mb: 4, textAlign: 'left' }}>
            <img
              src="/logo.svg"
              alt="TRIO"
              style={{ height: 32, marginBottom: 16 }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              mb: 1,
            }}
          >
            {t('auth.login')}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 4,
            }}
          >
            {t('auth.signIn')}
          </Typography>

          {/* Error Alert */}
          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || localError}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label={t('auth.email')}
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('auth.password')}
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 1 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
              }}
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('auth.signIn')}
            </Button>

            {/* Demo Credentials */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography
                variant="caption"
                display="block"
                sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}
              >
                Demo credentials:
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                Username: admin
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                Password: admin123
              </Typography>
            </Box>
          </Box>

          {/* Language Selector */}
          <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleLanguageMenuOpen}
              size="small"
              sx={{
                display: 'flex',
                gap: 1,
                px: 1,
                color: 'text.secondary',
              }}
            >
              <Box component="span" sx={{ fontSize: '1.25rem' }}>
                {currentLanguage.flag}
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {currentLanguage.name}
              </Typography>
              <LanguageIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleLanguageMenuClose}
              transformOrigin={{ horizontal: 'left', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            >
              {languages.map((language) => (
                <MenuItem
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  selected={language.code === i18n.language}
                >
                  <Box component="span" sx={{ mr: 2, fontSize: '1.25rem' }}>
                    {language.flag}
                  </Box>
                  <ListItemText>{language.name}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
      </Box>

      {/* Right side - Brand Section */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          px: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: '50%',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
          }}
        />

        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 500 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Triosoft Company
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            Innovate, Integrate, Inspire
          </Typography>
          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              lineHeight: 1.7,
              fontSize: { xs: '0.9rem', md: '1rem' },
            }}
          >
            Our main goal is to give our customers all the tools for managing a
            business with our platform. Our software resources is dedicated to
            ensuring security of our customers data.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
