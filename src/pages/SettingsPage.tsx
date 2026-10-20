import { useMemo, useRef, useState } from 'react';
import {
  Database,
  Download,
  FileJson,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge, Card, CardHeader, ColorDot, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { Field, Input, Select } from '@/components/ui/Field';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { useFinance } from '@/context/financeContext';
import { useToast } from '@/context/toastContext';
import { useTheme } from '@/context/themeContext';
import { buildBackup, parseBackup } from '@/lib/backup';
import { downloadFile, transactionsToCsv } from '@/lib/csv';
import { CHART_COLORS, SCHEMA_VERSION, SUPPORTED_CURRENCIES } from '@/constants';
import { formatCurrency } from '@/lib/format';
import type { CategoryInput } from '@/context/financeContext';
import type { Category, TransactionType } from '@/types';

export function SettingsPage() {
  const {
    transactions,
    categories,
    budgets,
    settings,
    updateSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    replaceState,
    resetAll,
  } = useFinance();
  const { toast } = useToast();
  const { preference, setPreference } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<Category | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<CategoryInput>({ name: '', kind: 'expense', color: CHART_COLORS[0] });
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.kind === 'income'),
    [categories],
  );
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.kind === 'expense'),
    [categories],
  );

  /* ------------------------------------------------------------------ */
  /* Data                                                                */
  /* ------------------------------------------------------------------ */

  const handleExportBackup = () => {
    const backup = buildBackup({
      schemaVersion: SCHEMA_VERSION,
      transactions,
      categories,
      budgets,
      settings,
    });
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadFile(
      `finance-backup_${stamp}.json`,
      JSON.stringify(backup, null, 2),
      'application/json',
    );
    toast('Backup downloaded.');
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) {
      toast('There are no transactions to export yet.', 'info');
      return;
    }
    const csv = transactionsToCsv(transactions, { categories, currency: settings.currency });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`transactions_${stamp}.csv`, csv, 'text/csv;charset=utf-8');
    toast(`Exported ${transactions.length} transactions.`);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const result = parseBackup(text);
      if (!result.ok) {
        toast(result.error, 'error');
        return;
      }
      replaceState(result.state);
      for (const warning of result.warnings) {
        toast(warning, 'info');
      }
      toast('Backup restored successfully.');
    } catch {
      toast('That file could not be read.', 'error');
    }
  };

  /* ------------------------------------------------------------------ */
  /* Categories                                                          */
  /* ------------------------------------------------------------------ */

  const openAdd = (kind: TransactionType) => {
    setEditing(null);
    setDraft({ name: '', kind, color: CHART_COLORS[categories.length % CHART_COLORS.length] });
    setEditorOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setDraft({ name: category.name, kind: category.kind, color: category.color });
    setEditorOpen(true);
  };

  const saveCategory = () => {
    if (!draft.name.trim()) {
      toast('Give the category a name.', 'error');
      return;
    }
    const duplicate = categories.some(
      (c) =>
        c.id !== editing?.id &&
        c.kind === draft.kind &&
        c.name.trim().toLowerCase() === draft.name.trim().toLowerCase(),
    );
    if (duplicate) {
      toast('A category with that name already exists.', 'error');
      return;
    }

    if (editing) {
      updateCategory(editing.id, draft);
      toast('Category updated.');
    } else {
      addCategory(draft);
      toast('Category added.');
    }
    setEditing(null);
    setEditorOpen(false);
  };

  const confirmDeleteCategory = () => {
    if (!confirmDelete) return;
    deleteCategory(confirmDelete.id);
    toast(`"${confirmDelete.name}" removed. Existing transactions were kept.`, 'info');
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5 pb-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Customise how the app looks and manage your data.
        </p>
      </header>

      {/* Appearance & region */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Appearance" description="Choose how the app is displayed." />
          <Field label="Theme">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={preference}
                onChange={(event) =>
                  setPreference(event.target.value as 'light' | 'dark' | 'system')
                }
              >
                <option value="system">Match my system</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            )}
          </Field>
        </Card>

        <Card>
          <CardHeader title="Region" description="How amounts and dates are displayed." />
          <div className="space-y-4">
            <Field label="Currency">
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={settings.currency}
                  onChange={(event) => updateSettings({ currency: event.target.value })}
                >
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} — {currency.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Number & date format">
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={settings.locale}
                  onChange={(event) => updateSettings({ locale: event.target.value })}
                >
                  <option value="en-PK">English (Pakistan)</option>
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="en-IN">English (India)</option>
                  <option value="en-AE">English (UAE)</option>
                  <option value="de-DE">Deutsch (Deutschland)</option>
                  <option value="fr-FR">Français (France)</option>
                  <option value="ur-PK">اردو (پاکستان)</option>
                </Select>
              )}
            </Field>
          </div>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader
          title="Categories"
          description="Income sources and spending categories used across the app."
          action={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openAdd('expense')}
                icon={<Plus className="size-3.5" />}
              >
                Expense
              </Button>
              <Button size="sm" onClick={() => openAdd('income')} icon={<Plus className="size-3.5" />}>
                Income
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CategoryGroup
            title="Income sources"
            categories={incomeCategories}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
          />
          <CategoryGroup
            title="Expense categories"
            categories={expenseCategories}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
          />
        </div>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader
          title="Your data"
          description="Everything is stored locally on this device. Export regularly to keep a safe copy."
          action={<Database className="size-4 text-subtle" aria-hidden="true" />}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="secondary"
            onClick={handleExportBackup}
            icon={<FileJson className="size-4" />}
            className="justify-start"
          >
            Download backup (JSON)
          </Button>

          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            icon={<Upload className="size-4" />}
            className="justify-start"
          >
            Restore from backup
          </Button>

          <Button
            variant="secondary"
            onClick={handleExportCsv}
            icon={<Download className="size-4" />}
            className="justify-start"
          >
            Export transactions (CSV)
          </Button>

          <Button
            variant="ghost"
            onClick={() => setConfirmReset(true)}
            icon={<RotateCcw className="size-4" />}
            className="justify-start text-negative hover:bg-negative-soft"
          >
            Reset all data
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleImport(file);
            event.target.value = '';
          }}
        />

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <Stat label="Transactions" value={String(transactions.length)} />
          <Stat label="Categories" value={String(categories.length)} />
          <Stat
            label="Net balance"
            value={formatCurrency(
              transactions.reduce(
                (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
                0,
              ),
              settings.currency,
              settings.locale,
            )}
          />
        </div>
      </Card>

      {/* About */}
      <Card>
        <CardHeader title="About" />
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Row label="Application" value="Personal Finance Manager" />
          <Row label="Version" value="2.0.0" />
          <Row label="Storage" value="Local to this device (IndexedDB)" />
          <Row label="Privacy" value="No account, no tracking, no server" />
        </dl>
      </Card>

      {/* Category editor */}
      <Modal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit category' : 'New category'}
        description={
          editing
            ? 'Rename the category or change its colour.'
            : 'Categories are used to group your income and expenses.'
        }
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setEditorOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveCategory}>{editing ? 'Save changes' : 'Add category'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                value={draft.name}
                maxLength={40}
                placeholder="e.g. Books, Hostel, Freelance"
                onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
              />
            )}
          </Field>

          <Field label="Type">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={draft.kind}
                onChange={(event) =>
                  setDraft((d) => ({ ...d, kind: event.target.value as TransactionType }))
                }
              >
                <option value="expense">Expense category</option>
                <option value="income">Income source</option>
              </Select>
            )}
          </Field>

          <Field label="Colour">
            {(fieldProps) => (
              <div className="flex flex-wrap gap-2" {...fieldProps}>
                {CHART_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, color }))}
                    className={cn(
                      'size-8 rounded-lg border-2 transition-transform',
                      draft.color === color
                        ? 'scale-110 border-fg'
                        : 'border-transparent hover:scale-105',
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Use colour ${color}`}
                    aria-pressed={draft.color === color}
                  />
                ))}
              </div>
            )}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this category?"
        description={`"${confirmDelete?.name ?? ''}" will be removed. Existing transactions are kept but will show as uncategorised.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDeleteCategory}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset all data?"
        description="Every transaction, category and budget will be permanently deleted from this device. Export a backup first if you want to keep it."
        confirmLabel="Delete everything"
        destructive
        onConfirm={() => {
          resetAll();
          setConfirmReset(false);
          toast('All data has been reset.', 'info');
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------- */

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">{title}</p>
      {categories.length === 0 ? (
        <EmptyState title="Nothing here yet" className="py-6" />
      ) : (
        <ul className="space-y-1">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-surface-2/50"
            >
              <ColorDot color={category.color} />
              <span className="min-w-0 flex-1 truncate text-sm text-fg">{category.name}</span>
              {category.builtin ? <Badge>Built-in</Badge> : null}
              <button
                type="button"
                onClick={() => onEdit(category)}
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label={`Edit ${category.name}`}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(category)}
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-negative-soft hover:text-negative"
                aria-label={`Delete ${category.name}`}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/50 px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 font-semibold text-fg tabular">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-fg">{value}</dd>
    </div>
  );
}
