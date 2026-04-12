import { useEffect, useMemo, useRef, useState } from "react";

interface TagMultiselectDropdownProps {
  /** All tags that can be selected (sorted for display is caller’s responsibility) */
  options: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  buttonLabel?: string;
  emptyHint?: string;
  align?: "left" | "right";
  /** Show removable chips for each selected option below the button (default true). */
  showSelectedChips?: boolean;
  /** Label for the footer “clear all” control inside the open panel. */
  clearAllLabel?: string;
}

export default function TagMultiselectDropdown({
  options,
  selected,
  onChange,
  buttonLabel = "Filter by tags",
  emptyHint = "No tags match.",
  align = "left",
  showSelectedChips = true,
  clearAllLabel = "Clear all",
}: TagMultiselectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedSorted = useMemo(
    () => [...selected].sort((a, b) => a.localeCompare(b)),
    [selected]
  );

  useEffect(() => {
    if (!open) return;
    const closeIfOutside = (e: Event) => {
      const root = rootRef.current;
      const t = e.target;
      if (!root || !(t instanceof Node)) return;
      if (!root.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeIfOutside, true);
    document.addEventListener("mousedown", closeIfOutside, true);
    document.addEventListener("touchstart", closeIfOutside, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", closeIfOutside, true);
      document.removeEventListener("mousedown", closeIfOutside, true);
      document.removeEventListener("touchstart", closeIfOutside, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? options.filter((t) => t.toLowerCase().includes(q))
    : options;

  const toggle = (tag: string) => {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange(next);
  };

  const clearAll = () => {
    onChange(new Set());
    setFilter("");
  };

  const removeTag = (tag: string) => {
    const next = new Set(selected);
    next.delete(tag);
    onChange(next);
  };

  return (
    <div ref={rootRef} className="relative shrink-0 min-w-0 max-w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
          selected.size > 0
            ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-100"
            : "bg-white/10 border-white/20 text-white/90 hover:bg-white/15"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {buttonLabel}
        {selected.size > 0 && !showSelectedChips ? (
          <span className="tabular-nums rounded-md bg-white/15 px-1.5 py-0.5 text-xs">
            {selected.size}
          </span>
        ) : null}
        <span className="text-white/50 text-xs" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {showSelectedChips && selectedSorted.length > 0 && (
        <ul
          className="flex flex-wrap gap-1.5 list-none m-0 mt-2 p-0"
          aria-label="Selected tags"
        >
          {selectedSorted.map((tag) => (
            <li key={tag}>
              <span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 text-xs max-w-full">
                <span className="truncate">{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="p-0.5 rounded hover:bg-white/10 text-white/85 leading-none border-0 bg-transparent cursor-pointer font-inherit shrink-0"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          className={`absolute top-full z-50 mt-2 w-[min(100vw-3rem,22rem)] rounded-xl border border-white/20 bg-slate-950/95 backdrop-blur-md shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="p-2 border-b border-white/10">
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search tags…"
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/25"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="text-white/50 text-sm px-2 py-3 m-0">{emptyHint}</p>
            ) : (
              <ul className="list-none m-0 p-0 space-y-0.5" role="listbox" aria-multiselectable>
                {filtered.map((tag) => {
                  const on = selected.has(tag);
                  return (
                    <li key={tag} role="option" aria-selected={on}>
                      <label className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer text-sm text-white/90">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(tag)}
                          className="rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-400/50"
                        />
                        <span className="truncate">{tag}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {selected.size > 0 && (
            <div className="p-2 border-t border-white/10">
              <button
                type="button"
                onClick={clearAll}
                className="w-full py-2 text-xs text-white/60 hover:text-white/90 rounded-lg hover:bg-white/5"
              >
                {clearAllLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
