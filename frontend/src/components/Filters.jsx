
import { Search, SlidersHorizontal } from "lucide-react";

export default function Filters({
  search,
  setSearch,
  priority,
  setPriority,
}) {
  return (
    <section className="filters">
      <div className="search-box">
        <Search size={18} />

        <input
          type="search"
          placeholder="Search tasks..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="priority-filter">
        <SlidersHorizontal size={17} />

        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          aria-label="Filter by priority"
        >
          <option value="All">All priorities</option>
          <option value="High">High priority</option>
          <option value="Medium">Medium priority</option>
          <option value="Low">Low priority</option>
        </select>
      </div>
    </section>
  );
}