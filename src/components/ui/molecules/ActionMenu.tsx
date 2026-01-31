import React, { useState, useCallback, type ReactNode } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import IconButton from '../atoms/IconButton';

/**
 * Элемент меню действий
 */
export interface MenuItemConfig {
  /** Текст элемента */
  label: string;
  /** Иконка элемента */
  icon?: ReactNode;
  /** Обработчик клика */
  onClick: () => void;
  /** Элемент неактивен */
  disabled?: boolean;
  /** Цвет элемента */
  color?: 'default' | 'error' | 'warning';
}

/**
 * Props для меню действий
 */
export interface ActionMenuProps {
  /** Элементы меню */
  items: MenuItemConfig[];
  /** Кастомная иконка для кнопки открытия меню */
  icon?: ReactNode;
}

/**
 * Меню действий
 *
 * @example
 * ```tsx
 * <ActionMenu
 *   items={[
 *     {
 *       label: 'Редактировать',
 *       icon: <EditIcon />,
 *       onClick: handleEdit,
 *     },
 *     {
 *       label: 'Удалить',
 *       icon: <DeleteIcon />,
 *       onClick: handleDelete,
 *       color: 'error',
 *     },
 *     {
 *       label: 'Архивировать',
 *       icon: <ArchiveIcon />,
 *       onClick: handleArchive,
 *       disabled: true,
 *     },
 *   ]}
 * />
 * ```
 */
const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  icon,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  /**
   * Обработчик открытия меню
   */
  const handleOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    },
    []
  );

  /**
   * Обработчик закрытия меню
   */
  const handleClose = useCallback(
    (event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation();
      }
      setAnchorEl(null);
    },
    []
  );

  /**
   * Обработчик клика по элементу меню
   */
  const handleItemClick = useCallback(
    (item: MenuItemConfig) => (event: React.MouseEvent) => {
      event.stopPropagation();
      handleClose();
      item.onClick();
    },
    [handleClose]
  );

  /**
   * Получение цвета текста для элемента
   */
  const getColor = (color?: 'default' | 'error' | 'warning') => {
    switch (color) {
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      default:
        return 'text.primary';
    }
  };

  return (
    <>
      <IconButton
        icon={icon || <MoreVertIcon />}
        onClick={handleOpen}
        size="small"
      />

      <Menu
        id="action-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {items.map((item, index) => (
          <MenuItem
            key={index}
            onClick={handleItemClick(item)}
            disabled={item.disabled}
          >
            {item.icon && (
              <ListItemIcon
                sx={{
                  color: getColor(item.color),
                }}
              >
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText
              sx={{
                color: getColor(item.color),
              }}
            >
              {item.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ActionMenu;
