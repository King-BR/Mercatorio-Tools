import { useState, useEffect } from "react";
import { getTowns } from "../../services/api";

import "./TownSelector.css";

export default function TownSelector({ selectedTown, onChange }) {
  const [towns, setTowns] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTowns().then((data) => {
      setTowns(data);
      setLoading(false);
    });
  }, []);

  return loading ? (
    <div>Loading towns...</div>
  ) : (
    <div className="town-selector">
      <label htmlFor="production-town">Town</label>

      <select
        id="production-town"
        value={selectedTown || ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="" disabled>
          Select a town
        </option>

        {Array.from(towns.values()).map((town) => (
          <option key={town.name} value={town.name}>
            {town.name}
          </option>
        ))}
      </select>
    </div>
  );
}
