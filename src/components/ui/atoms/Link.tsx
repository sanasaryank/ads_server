import React, { type ReactNode } from 'react';
import { Link as MuiLink } from '@mui/material';

/**
 * Props для универсальной ссылки
 */
interface LinkProps {
  /** URL ссылки */
  href: string;
  /** Содержимое ссылки */
  children: ReactNode;
  /** Внешняя ссылка (открывается в новой вкладке) */
  external?: boolean;
  /** Стиль подчеркивания */
  underline?: 'none' | 'hover' | 'always';
  /** Цвет ссылки */
  color?: string;
}

/**
 * Универсальная ссылка
 *
 * @example
 * ```tsx
 * <Link href="https://example.com" external>
 *   Внешняя ссылка
 * </Link>
 * ```
 */
const Link: React.FC<LinkProps> = React.memo(({
  href,
  children,
  external = false,
  underline = 'hover',
  color = 'primary',
}) => {
  const externalProps = external
    ? {
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : {};

  return (
    <MuiLink
      href={href}
      underline={underline}
      color={color}
      {...externalProps}
    >
      {children}
    </MuiLink>
  );
});

Link.displayName = 'Link';

export default Link;
