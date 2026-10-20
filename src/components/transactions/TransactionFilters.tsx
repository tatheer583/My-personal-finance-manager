import { useMemo } from 'react';
import { Calendar, Filter, Search, X } from 'lucide-react';
import { Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { resolveRange } from '@/lib/dates';
import type { Category, DateRange, DateRangePreset, TransactionFilter } from '@/types';

interface TransactionFiltersProps {
  filters: TransactionFilter;
  onChange: (next: TransactionFilter) => void;
  categories: Category[];
  resultCount: number;
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

export function TransactionFilters({
  filters,
  onChange,
  categories,
  resultCount,
}: TransactionFiltersProps) {
  const categoryOptions = useMemo(
    () =>
      categories.filter(
        (category) =>
          filters.type === 'all' || category.kind === filters.type,
      ),
    [categories, filters.type],
  );

  const update = (patch: Partial<TransactionFilter>) => {
    onChange({ ...filters, ...patch });
  };

  const setPreset = (preset: DateRangePreset) => {
    const range: DateRange = {
      preset,
      from: filters.range.from,
      to: filters.range.to,
    };
    const bounds = resolveRange(preset, { from: range.from, to: range.to });
    onChange({
      ...filters,
      range: { preset, from: bounds.from, to: bounds.to },
    });
  };

  const active =
    filters.type !== 'all' ||
    filters.categoryIds.length > 0 ||
    filters.search.trim() !== '' ||
    filters.range.preset !== 'all';

  const reset = () => {
    onChange({
      type: 'all',
      categoryIds: [],
      search: '',
      range: { preset: 'all', from: null, to: null },
      sort: 'date-desc',
    });
  };

  return (
    <div className="surface-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search notes or categories…"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            className="pl-9"
            aria-label="Search transactions"
          />
        </div>

        {/* Type */}
        <div className="relative">
          <Filter
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <Select
            value={filters.type}
            onChange={(event) =>
              update({ type: event.target.value as TransactionFilter['type'] })
            }
            className="pl-9"
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="income">Income only</option>
            <option value="expense">Expenses only</option>
          </Select>
        </div>

        {/* Category */}
        <Select
          value={filters.categoryIds[0] ?? ''}
          onChange={(event) =>
            update({ categoryIds: event.target.value ? [event.target.value] : [] })
          }
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        {/* Date range */}
        <div className="relative">
          <Calendar
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
          <Select
            value={filters.range.preset}
            onChange={(event) => setPreset(event.target.value as DateRangePreset)}
            className="pl-9"
            aria-label="Filter by date range"
          >
            {PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Custom range */}
      {filters.range.preset === 'custom' ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            From
            <Input
              type="date"
              value={filters.range.from ?? ''}
              max={filters.range.to ?? undefined}
              onChange={(event) =>
                update({
                  range: { ...filters.range, from: event.target.value || null },
                })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            To
            <Input
              type="date"
              value={filters.range.to ?? ''}
              min={filters.range.from ?? undefined}
              onChange={(event) =>
                update({
                  range: { ...filters.range, to: event.target.value || null },
                })
              }
            />
          </label>
        </div>
      ) : null}

      {/* Sort + summary */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="tabular">{resultCount}</span>
          <span>{resultCount === 1 ? 'result' : 'results'}</span>
          {active ? (
            <Button variant="ghost" size="sm" onClick={reset} icon={<X className="size-3.5" />}>
              Clear
            </Button>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          Sort
          <Select
            value={filters.sort}
            onChange={(event) =>
              update({ sort: event.target.value as TransactionFilter['sort'] })
            }
            className={cn('h-9 w-auto py-1.5 text-sm')}
            aria-label="Sort transactions"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Highest amount</option>
            <option value="amount-asc">Lowest amount</option>
          </Select>
        </label>
      </div>
    </div>
  );
}
