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
    <form>
      <label className="form-control w-full sm:w-56">
        <div className="label pb-2">
          <span className="label-text">Type</span>
        </div>
        <select
          name="type"
          defaultValue={typeFilter}
          className="select select-bordered"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="all">All types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <input type="hidden" name="sort" value={sortField} />
      <input type="hidden" name="dir" value={sortDirection} />
      <input type="hidden" name="page" value="1" />
    </form>
  );
}
