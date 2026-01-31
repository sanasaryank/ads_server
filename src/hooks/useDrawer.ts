import { useState, useCallback } from 'react';

/**
 * Return type for useDrawer hook
 */
export interface UseDrawerReturn {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Open the drawer */
  open: () => void;
  /** Close the drawer */
  close: () => void;
  /** Toggle the drawer */
  toggle: () => void;
}

/**
 * Hook for managing drawer state
 *
 * @returns Object with drawer state and control functions
 *
 * @example
 * ```tsx
 * const drawer = useDrawer();
 *
 * return (
 *   <div>
 *     <button onClick={drawer.open}>Open Drawer</button>
 *     <Drawer open={drawer.isOpen} onClose={drawer.close}>
 *       Drawer content
 *     </Drawer>
 *   </div>
 * );
 * ```
 */
function useDrawer(): UseDrawerReturn {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

export default useDrawer;
