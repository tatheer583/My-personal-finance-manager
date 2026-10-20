import { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import { Field, Input, SegmentedControl, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useFinance } from '@/context/financeContext';
import type { Transaction, TransactionType } from '@/types';
import { MAX_AMOUNT } from '@/constants';
import { todayISO } from '@/lib/format';
import type { TransactionInput } from '@/context/financeContext';

interface TransactionFormProps {
  /** Transaction being edited. Omit to create a new one. */
  initial?: Transaction;
  defaultType?: TransactionType;
  onSubmit: (input: TransactionInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

interface FormErrors {
  amount?: string;
  categoryId?: string;
  date?: string;
}

export function TransactionForm({
  initial,
  defaultType = 'expense',
  onSubmit,
  onCancel,
  submitLabel = 'Save transaction',
}: TransactionFormProps) {
  const { categories, settings } = useFinance();

  const [type, setType] = useState<TransactionType>(initial?.type ?? defaultType);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [note, setNote] = useState(initial?.note ?? '');
  const [errors, setErrors] = useState<FormErrors>({});

  const availableCategories = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  /**
   * The category actually shown in the select.
   *
   * Derived rather than synchronised with an effect: when the type flips, a
   * category from the other list is simply not applicable, so we fall back to
   * the first valid one.
   */
  const selectedCategoryId = availableCategories.some(
    (category) => category.id === categoryId,
  )
    ? categoryId
    : (availableCategories[0]?.id ?? '');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};

    const value = Number(amount);
    if (!amount.trim()) {
      nextErrors.amount = 'Enter an amount.';
    } else if (!Number.isFinite(value)) {
      nextErrors.amount = 'That is not a valid number.';
    } else if (value <= 0) {
      nextErrors.amount = 'Amount must be greater than zero.';
    } else if (value > MAX_AMOUNT) {
      nextErrors.amount = 'That amount is too large.';
    }

    if (!selectedCategoryId) {
      nextErrors.categoryId = 'Choose a category.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      nextErrors.date = 'Choose a valid date.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      type,
      amount: value,
      categoryId: selectedCategoryId,
      date,
      note: note.trim(),
    });
  };

  const currency = settings.currency;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <SegmentedControl
        value={type}
        onChange={(next) => setType(next)}
        options={[
          {
            value: 'expense',
            label: 'Expense',
            icon: <ArrowDownCircle className="size-4" aria-hidden="true" />,
          },
          {
            value: 'income',
            label: 'Income',
            icon: <ArrowUpCircle className="size-4" aria-hidden="true" />,
          },
        ]}
      />

      <Field
        label="Amount"
        required
        error={errors.amount}
        hint={`Amount in ${currency}`}
      >
        {(fieldProps) => (
          <div className="relative">
            <Wallet
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            />
            <Input
              {...fieldProps}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max={MAX_AMOUNT}
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="pl-9 font-mono text-lg"
            />
          </div>
        )}
      </Field>

      <Field
        label={type === 'income' ? 'Source' : 'Category'}
        required
        error={errors.categoryId}
      >
        {(fieldProps) => (
          <Select
            {...fieldProps}
            value={selectedCategoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {availableCategories.length === 0 ? (
              <option value="">No {type} categories yet</option>
            ) : (
              availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </Select>
        )}
      </Field>

      <Field label="Date" required error={errors.date}>
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="date"
            value={date}
            max={todayISO()}
            onChange={(event) => setDate(event.target.value)}
          />
        )}
      </Field>

      <Field label="Note" hint="Optional — a short description of this entry.">
        {(fieldProps) => (
          <Textarea
            {...fieldProps}
            value={note}
            maxLength={280}
            placeholder="e.g. Monthly allowance, University fees…"
            onChange={(event) => setNote(event.target.value)}
          />
        )}
      </Field>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} className="sm:w-auto">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" className="sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
