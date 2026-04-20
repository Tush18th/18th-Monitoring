import React from 'react';
import { 
  Table, 
  THead, 
  TBody, 
  TR, 
  TH, 
  TD 
} from './index';
import { InformationState } from '../Feedback/InformationState';
import { ChevronRight, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '../Button';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface OperationalTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  rowActions?: (item: T) => React.ReactNode;
  isDense?: boolean;
  className?: string;
}

export function OperationalTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRowClick,
  rowActions,
  isDense,
  className
}: OperationalTableProps<T>) {
  if (isLoading) {
    return <InformationState type="loading" />;
  }

  if (isEmpty || (!data.length && !isLoading)) {
    return <InformationState type="empty" title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table className={cn(className, isDense && 'ui-table--dense')}>
      <THead>
        <TR>
          {columns.map((col) => (
            <TH 
              key={col.key} 
              style={{ width: col.width, textAlign: col.align || 'left' }}
            >
              <div className="flex items-center gap-2">
                {col.header}
                {col.sortable && <ArrowUpDown size={12} className="text-text-muted" />}
              </div>
            </TH>
          ))}
          {rowActions && <TH style={{ width: '40px' }} />}
        </TR>
      </THead>
      <TBody>
        {data.map((item) => (
          <TR 
            key={item.id} 
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            className={onRowClick ? 'cursor-pointer' : ''}
          >
            {columns.map((col) => (
              <TD 
                key={col.key} 
                style={{ textAlign: col.align || 'left' }}
              >
                {col.render ? col.render((item as any)[col.key], item) : (item as any)[col.key]}
              </TD>
            ))}
            {rowActions && (
              <TD className="actions-cell">
                <div className="flex justify-end">
                  {rowActions(item)}
                </div>
              </TD>
            )}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
