"use client";

type ActivitiesTypeFilterProps = {
  typeFilter: string;
  typeOptions: string[];
  sortField: string;
  sortDirection: string;
};

export default function ActivitiesTypeFilter({
  typeFilter,
  typeOptions,
  sortField,
  sortDirection,
}: ActivitiesTypeFilterProps) {
  return (
    <form className="flex items-center gap-3">
      <label className="text-sm font-medium">Type</label>
      <div className="w-full sm:w-56">
        <select
          name="type"
          defaultValue={typeFilter}
          className="h-9 w-full rounded-md border border-base-300 bg-base-100 px-3 text-sm shadow-sm outline-none transition-colors focus:border-base-content/30 focus:ring-2 focus:ring-base-300/60"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="all">All types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name="sort" value={sortField} />
      <input type="hidden" name="dir" value={sortDirection} />
      <input type="hidden" name="page" value="1" />
    </form>
  );
}
