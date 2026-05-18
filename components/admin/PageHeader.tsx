import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Standard admin page header.
 * - Mobile: title at top, action below (stacked, easier thumb reach)
 * - Desktop: title + action inline, action right-aligned
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-5 lg:mb-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {action && <div className="lg:shrink-0">{action}</div>}
      </div>
    </div>
  );
}
