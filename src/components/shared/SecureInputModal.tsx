import { useState } from 'react';
import { Modal, Input, Button } from '../ui';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface SecureInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  label: string;
  placeholder?: string;
}

function SecureInputModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  label, 
  placeholder = 'Enter value...' 
}: SecureInputModalProps) {
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value);
      setValue('');
      setShowValue(false);
      onClose();
    }
  };

  const handleCancel = () => {
    setValue('');
    setShowValue(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={title} size="sm">
      <div style={{ padding: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          {label}
        </label>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Input
            type={showValue ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            fullWidth
            style={{ paddingRight: '2.5rem' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
          <button
            type="button"
            onClick={() => setShowValue(!showValue)}
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
            title={showValue ? 'Hide' : 'Show'}
          >
            {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!value.trim()}>
            <Lock size={16} />
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SecureInputModal;

