const inputClass = "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm";

export function OverlayFields({
  defaults,
}: {
  defaults?: {
    vertical: string;
    status: string;
    slotASizeBand: string | null;
    slotBTypicalWorkflows: string | null;
    slotCToolLandscape: string | null;
    slotDBuyingStructure: string | null;
    slotERegulatoryContext: string | null;
    extraDisqualifiers: string | null;
    sourcePack: string | null;
  };
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label>
        <span className="block text-xs font-medium text-neutral-600 mb-1">Vertical</span>
        <input name="vertical" required defaultValue={defaults?.vertical ?? ""} placeholder="Hotel" className={inputClass} />
      </label>
      <label>
        <span className="block text-xs font-medium text-neutral-600 mb-1">Status (must be chosen explicitly)</span>
        <select name="status" required defaultValue={defaults?.status ?? ""} className={inputClass}>
          <option value="" disabled>
            — choose one —
          </option>
          <option value="FULL_PACK">Full pack</option>
          <option value="LIGHTWEIGHT">Lightweight</option>
          <option value="DRAFT">Draft</option>
        </select>
      </label>
      <label className="col-span-2">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Slot A — size band</span>
        <input name="slotASizeBand" defaultValue={defaults?.slotASizeBand ?? ""} className={inputClass} />
      </label>
      <label className="col-span-2">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Slot B — typical workflows</span>
        <textarea name="slotBTypicalWorkflows" defaultValue={defaults?.slotBTypicalWorkflows ?? ""} rows={2} className={inputClass} />
      </label>
      <label className="col-span-2">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Slot C — tool landscape</span>
        <textarea name="slotCToolLandscape" defaultValue={defaults?.slotCToolLandscape ?? ""} rows={2} className={inputClass} />
      </label>
      <label className="col-span-2">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Slot D — buying structure (never a fee)</span>
        <textarea name="slotDBuyingStructure" defaultValue={defaults?.slotDBuyingStructure ?? ""} rows={2} className={inputClass} />
      </label>
      <label className="col-span-2">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Slot E — regulatory context</span>
        <textarea name="slotERegulatoryContext" defaultValue={defaults?.slotERegulatoryContext ?? ""} rows={2} className={inputClass} />
      </label>
      <label className="col-span-2">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Extra disqualifiers</span>
        <input name="extraDisqualifiers" defaultValue={defaults?.extraDisqualifiers ?? ""} className={inputClass} />
      </label>
      <label className="col-span-2">
        <span className="block text-xs font-medium text-neutral-600 mb-1">Source pack (filename)</span>
        <input name="sourcePack" defaultValue={defaults?.sourcePack ?? ""} className={inputClass} />
      </label>
    </div>
  );
}
