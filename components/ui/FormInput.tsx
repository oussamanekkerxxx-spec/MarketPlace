import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
        {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';
