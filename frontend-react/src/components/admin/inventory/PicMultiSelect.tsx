"use client";

type PicOption = {
  value: string;
  label: string;
};

type PicMultiSelectProps = {
  options: PicOption[];
  selectedIds: string[];
  onChange: (nextIds: string[]) => void;
  disabled?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
};

export function PicMultiSelect({
  options,
  selectedIds,
  onChange,
  disabled = false,
  loadingLabel = "Memuat PIC...",
  emptyLabel = "Belum ada PIC tersedia.",
}: PicMultiSelectProps) {
  const toggleValue = (value: string) => {
    if (disabled) return;
    onChange(
      selectedIds.includes(value)
        ? selectedIds.filter((item) => item !== value)
        : [...selectedIds, value],
    );
  };

  const selectedLabels = options
    .filter((option) => selectedIds.includes(option.value))
    .map((option) => option.label);

  return (
    <div className="space-y-2">
      <div className="min-h-9 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-700">
        {selectedLabels.length ? selectedLabels.join(", ") : "Belum ada PIC dipilih"}
      </div>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-input bg-background p-2">
        {disabled ? (
          <p className="px-1 py-2 text-sm text-slate-500">{loadingLabel}</p>
        ) : options.length ? (
          options.map((option) => {
            const checked = selectedIds.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleValue(option.value)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span>{option.label}</span>
              </label>
            );
          })
        ) : (
          <p className="px-1 py-2 text-sm text-slate-500">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}
