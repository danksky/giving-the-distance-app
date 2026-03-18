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
          className="select select-bordered select-sm w-full"
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
