import React from 'react';
import Modal from './ui/modal';
import { useTheme } from './theme-provider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Monitor, Moon, Sun } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-3">Theme</h3>
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
            <div className="space-y-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <div key={value} className="flex items-center gap-x-3 p-2 rounded-lg">
                  <RadioGroupItem value={value} id={value} />
                  <Label 
                    htmlFor={value} 
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Autograph v1.0.0</p>
            <p className="mt-1">Belgian eID PDF Signing Application</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;