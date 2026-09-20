import { useState, useEffect } from "react";
import { getPlayerBuildings } from "../../../services/api";

export default function BuildingSelector({ selectedBuilding, onChange }) {
  const [buildings, setBuildings] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayerBuildings({ all: true }).then((data) => {
      setBuildings((current) => {
        current.clear();

        data.forEach((building) => current.set(building.id, building));
        return new Map(current);
      });
      setLoading(false);
    });
  }, []);

  return loading ? (
    <div>Loading buildings...</div>
  ) : (
    <div className="town-selector">
      <label htmlFor="production-building">Building</label>

      <select
        id="production-building"
        value={selectedBuilding || ""}
        onChange={(event) =>
          onChange(
            event.target.value || null,
            buildings.get(event.target.value)?.name || null,
            buildings.get(event.target.value)?.type || null,
          )
        }
      >
        <option value="" disabled>
          Select a building
        </option>

        {Array.from(buildings.values()).map((building) => (
          <option key={building.id} value={building.id}>
            {building.name}
          </option>
        ))}
      </select>
    </div>
  );
}
