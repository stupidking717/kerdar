import React, { memo, useCallback, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { DialogSize } from '../../types';

/**
 * Base dialog props
 */
export interface BaseDialogProps {
  /** Whether dialog is open */
  open: boolean;

  /** Called when dialog should close */
  onClose: () => void;

  /** Dialog title */
  title: string;

  /** Dialog description (optional) */
  description?: string;

  /** Dialog size */
  size?: DialogSize;

  /** Whether dialog can be closed */
  closable?: boolean;

  /** Show close button */
  showCloseButton?: boolean;

  /** Dialog content */
  children: React.ReactNode;

  /** Footer content */
  footer?: React.ReactNode;

  /** CSS class for content */
  className?: string;

  /** CSS class for overlay */
  overlayClassName?: string;

  /** Close on overlay click */
  closeOnOverlayClick?: boolean;

  /** Close on escape key */
  closeOnEscape?: boolean;

  /** Icon for the title */
  icon?: React.ReactNode;
}

/**
 * Get dialog width based on size
 */
function getDialogWidth(size: DialogSize): string {
  const widths: Record<DialogSize, string> = {
    [DialogSize.Small]: 'max-w-sm',
    [DialogSize.Medium]: 'max-w-md',
    [DialogSize.Large]: 'max-w-lg',
    [DialogSize.ExtraLarge]: 'max-w-xl',
    [DialogSize.Full]: 'max-w-4xl',
  };
  return widths[size] || widths[DialogSize.Medium];
}

/**
 * Animation variants for dialog
 */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const contentVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * BaseDialog component - foundation for all dialogs in the system
 */
export const BaseDialog = memo<BaseDialogProps>(({
  open,
  onClose,
  title,
  description,
  size = DialogSize.Medium,
  closable = true,
  showCloseButton = true,
  children,
  footer,
  className,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  icon,
}) => {
  // Get body container for portal (ensures fixed positioning works correctly)
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.body);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !closable) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose, closeOnEscape, closable]);

  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlayClick && closable) {
      onClose();
    }
  }, [closeOnOverlayClick, closable, onClose]);

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && closable && onClose()}>
      <AnimatePresence>
        {open && container && (
          <Dialog.Portal forceMount container={container}>
            {/* Overlay */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className={cn(
                  'fixed inset-0 z-50',
                  'bg-black/50 backdrop-blur-sm',
                  overlayClassName
                )}
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={handleOverlayClick}
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild forceMount>
              <motion.div
                className={cn(
                  'fixed z-50',
                  'left-1/2 top-1/2',
                  'w-full p-4',
                  getDialogWidth(size),
                  '-translate-x-1/2 -translate-y-1/2'
                )}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div
                  className={cn(
                    'bg-white dark:bg-slate-900',
                    'rounded-xl shadow-2xl',
                    'border border-gray-200 dark:border-slate-700',
                    'overflow-hidden',
                    className
                  )}
                >
                  {/* Header */}
                  <div
                    className={cn(
                      'flex items-center justify-between gap-4',
                      'px-6 py-4',
                      'border-b border-gray-200 dark:border-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {icon && (
                        <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                          {icon}
                        </div>
                      )}
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {title}
                        </Dialog.Title>
                        {description && (
                          <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                    </div>

                    {showCloseButton && closable && (
                      <Dialog.Close asChild>
                        <button
                          className={cn(
                            'p-2 rounded-lg',
                            'text-gray-400 hover:text-gray-600',
                            'dark:text-gray-500 dark:hover:text-gray-300',
                            'hover:bg-gray-100 dark:hover:bg-slate-800',
                            'transition-colors'
                          )}
                          onClick={onClose}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </Dialog.Close>
                    )}
                  </div>

                  {/* Body */}
                  <div
                    className={cn(
                      'px-6 py-4',
                      'max-h-[60vh] overflow-y-auto'
                    )}
                  >
                    {children}
                  </div>

                  {/* Footer */}
                  {footer && (
                    <div
                      className={cn(
                        'flex items-center justify-end gap-3',
                        'px-6 py-4',
                        'border-t border-gray-200 dark:border-slate-700',
                        'bg-gray-50 dark:bg-slate-800/50'
                      )}
                    >
                      {footer}
                    </div>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
});

BaseDialog.displayName = 'BaseDialog';

/**
 * Dialog header component
 */
export interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogHeader = memo<DialogHeaderProps>(({ children, className }) => (
  <div
    className={cn(
      'flex items-center gap-3',
      'px-6 py-4',
      'border-b border-gray-200 dark:border-slate-700',
      className
    )}
  >
    {children}
  </div>
));

DialogHeader.displayName = 'DialogHeader';

/**
 * Dialog body component
 */
export interface DialogBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogBody = memo<DialogBodyProps>(({ children, className }) => (
  <div className={cn('px-6 py-4', className)}>{children}</div>
));

DialogBody.displayName = 'DialogBody';

/**
 * Dialog footer component
 */
export interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogFooter = memo<DialogFooterProps>(({ children, className }) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3',
      'px-6 py-4',
      'border-t border-gray-200 dark:border-slate-700',
      'bg-gray-50 dark:bg-slate-800/50',
      className
    )}
  >
    {children}
  </div>
));

DialogFooter.displayName = 'DialogFooter';

export default BaseDialog;
