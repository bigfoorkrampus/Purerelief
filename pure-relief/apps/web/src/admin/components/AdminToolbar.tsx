import { useRef, type ChangeEvent } from 'react';
import { Search, Download, Upload, Trash2 } from 'lucide-react';

type AdminToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusOptions?: { value: string; label: string }[];
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  selectedCount?: number;
  onBulkDelete?: () => void;
  onBulkPublish?: () => void;
  onExportCsv?: () => void;
  onImportCsv?: (file: File) => void;
  primaryAction?: { label: string; onClick: () => void };
};

export function AdminToolbar({
  searchValue,
  onSearchChange,
  statusOptions,
  statusValue,
  onStatusChange,
  selectedCount = 0,
  onBulkDelete,
  onBulkPublish,
  onExportCsv,
  onImportCsv,
  primaryAction,
}: AdminToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onImportCsv) onImportCsv(file);
    e.target.value = '';
  }

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            className="input-field py-2.5 pl-10"
          />
        </div>

        {statusOptions && (
          <select value={statusValue ?? ''} onChange={(e) => onStatusChange?.(e.target.value)} className="input-field w-auto py-2.5">
            <option value="">All statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
            {selectedCount} selected
            {onBulkPublish && (
              <button onClick={onBulkPublish} className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700">
                Publish
              </button>
            )}
            {onBulkDelete && (
              <button onClick={onBulkDelete} className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onImportCsv && (
          <>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary px-4 py-2.5 text-sm">
              <Upload className="h-4 w-4" /> Import CSV
            </button>
          </>
        )}
        {onExportCsv && (
          <button onClick={onExportCsv} className="btn-secondary px-4 py-2.5 text-sm">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
        {primaryAction && (
          <button onClick={primaryAction.onClick} className="btn-primary px-4 py-2.5 text-sm">
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
