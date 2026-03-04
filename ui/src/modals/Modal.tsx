import { Dialog } from '@base-ui/react/dialog';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../components/Button';
import './Modal.css';

interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export function Modal({ open, onOpenChange, title, children, maxWidth = '500px' }: ModalProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="modal-backdrop" />
                <Dialog.Popup className="premium-card modal-popup" style={{ maxWidth }}>
                    <div className="flex-between mb-4">
                        <Dialog.Title style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                            {title}
                        </Dialog.Title>
                        <Dialog.Close className="btn-icon">
                            <X size={20} />
                        </Dialog.Close>
                    </div>
                    {children}
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirm",
    onConfirm,
    variant = 'primary',
    isLoading = false
}: ConfirmDialogProps) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="modal-backdrop" />
                <Dialog.Popup className="premium-card modal-popup" style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div className="flex flex-col items-center">
                        {variant === 'danger' && (
                            <AlertTriangle size={40} className="text-red-500 mb-4" />
                        )}

                        <Dialog.Title className="text-xl font-semibold mb-2">
                            {title}
                        </Dialog.Title>

                        <Dialog.Description className="text-text-secondary text-sm mb-6 leading-relaxed">
                            {description}
                        </Dialog.Description>

                        <div className="flex gap-3 w-full">
                            <Button
                                variant="secondary"
                                fullWidth
                                disabled={isLoading}
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant={variant}
                                fullWidth
                                onClick={async () => {
                                    await onConfirm();
                                    onOpenChange(false);
                                }}
                                loading={isLoading}
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
