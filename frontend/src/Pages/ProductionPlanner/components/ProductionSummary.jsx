import { useState } from "react";

import {
  calculateBuildingMaterials,
  getTotalMaterials,
  getMaterialsByRecipe,
  getUpgradeChain,
} from "../../../services/production/buildingMaterialsCalculator";

function formatNumber(value, decimals = 3) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return Number(value.toFixed(decimals)).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
}

function formatCost(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function formatSkillTier(value) {
  value = formatNumber(value, 0);

  const SKILL_TIERS = {
    1: "Novice",
    2: "Worker",
    3: "Journeyman",
    4: "Master",
    5: "Specialist",
  };

  return SKILL_TIERS[value] || "Unknown";
}

export default function ProductionSummary({
  calculation,
  buildingsData,
  upgradesChainByBuilding,
  userInventory,
}) {
  const products = Object.values(calculation.products || {});

  const marketSurplus = Object.entries(calculation.surplus?.market || {});

  const productionSurplus = Object.entries(
    calculation.surplus?.production || {},
  );

  const purchases = Object.entries(calculation.purchases || {});

  const recipeEntries = Object.entries(calculation.recipes || {});

  const classes = Array.from(
    calculation.classes?.entries ? calculation.classes.entries() : [],
  );

  /**
   * @type {Array<{0: String, 1: {count: number, perRecipe: Map<string, { count: number }} }>>}
   */
  const buildings = Array.from(
    calculation.buildings?.entries ? calculation.buildings.entries() : [],
  );

  return (
    <section className="production-summary">
      <div className="summary-header">
        <div>
          <h2>Production Summary</h2>

          <p>Complete overview of the calculated production line.</p>
        </div>
      </div>

      <div className="summary-overview">
        <SummaryCard
          label="Produced"
          value={formatNumber(calculation.target?.produced)}
          detail={`${formatNumber(calculation.target?.amount)} requested`}
        />

        <SummaryCard
          label="Labour per unit"
          value={formatNumber(calculation.labour?.perProduct)}
          detail={`${formatNumber(calculation.labour?.total)} total`}
        />

        <SummaryCard
          label="Unit cost"
          value={
            calculation.cost?.unit == null
              ? "N/A"
              : formatCost(calculation.cost.unit)
          }
          detail={
            calculation.cost?.total == null
              ? "Price data unavailable"
              : `Total ${formatCost(calculation.cost.total)}`
          }
        />

        <SummaryCard
          label="Recipes"
          value={recipeEntries.length}
          detail="Production steps"
        />
      </div>

      <div className="summary-sections">
        <SummarySection title="Production">
          <SummaryRows
            rows={products
              .filter((item) => item.produced > 0)
              .map((item) => [item.product, formatNumber(item.produced)])}
            empty="No produced products."
          />
        </SummarySection>

        <SummarySection title="Production Surplus">
          <SummaryRows
            rows={productionSurplus.map(([product, amount]) => [
              product,
              formatNumber(amount),
            ])}
            empty="No production surplus."
          />
        </SummarySection>

        <SummarySection title="Market Purchases">
          <SummaryRows
            rows={purchases.map(([product, amount]) => [
              product,
              formatNumber(amount),
            ])}
            empty="No market purchases."
          />
        </SummarySection>

        <SummarySection title="Market Purchase Surplus">
          <SummaryRows
            rows={marketSurplus.map(([product, amount]) => [
              product,
              formatNumber(amount),
            ])}
            empty="No purchase surplus."
          />
        </SummarySection>

        <SummarySection title="Recipes">
          <SummaryRows
            rows={recipeEntries.map(([recipeName, data]) => [
              recipeName,
              formatNumber(data.runs, 1),
            ])}
            empty="No recipes used."
          />
        </SummarySection>

        <SummarySection title="Classes">
          <SummaryRows
            rows={classes.map(([className, data]) => [
              className,
              formatSkillTier(data.maxSkill),
            ])}
            empty="No classes used."
          />
        </SummarySection>

        <SummarySection title="Buildings">
          <SummaryBuildings
            buildings={buildings}
            empty="No buildings used."
            upgradesChain={upgradesChainByBuilding}
          />
        </SummarySection>

        <SummarySection title="Materials">
          <SummaryBuildingsConstruction
            buildings={buildings}
            empty="No materials used."
            buildingsData={buildingsData}
            upgradesChain={upgradesChainByBuilding}
            userInventory={userInventory}
            calculation={calculation}
          />
        </SummarySection>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, detail }) {
  return (
    <div className="summary-card">
      <span className="summary-card-label">{label}</span>

      <strong className="summary-card-value">{value}</strong>

      <small className="summary-card-detail">{detail}</small>
    </div>
  );
}

function SummarySection({ title, children }) {
  return (
    <div className="summary-section">
      <h3>{title}</h3>

      {children}
    </div>
  );
}

function SummaryRows({ rows, empty }) {
  if (!rows.length) {
    return <div className="summary-empty">{empty}</div>;
  }

  return (
    <div className="summary-rows">
      {rows.map(([label, value], index) => (
        <div className="summary-row" key={`${label}-${index}`}>
          <span>{label}</span>

          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function SummaryBuildings({ buildings, empty, upgradesChain }) {
  if (!buildings.length) {
    return <div className="summary-empty">{empty}</div>;
  }

  return (
    <div className="summary-rows">
      {buildings.map(([buildingName, data]) => {
        const perRecipe = data?.perRecipe;

        const recipeEntries = perRecipe?.entries
          ? Array.from(perRecipe.entries())
          : [];

        return (
          <div className="summary-building" key={buildingName}>
            <div className="summary-row summary-building-row">
              <span>
                {buildingName}{" "}
                {recipeEntries.length === 1 && ` (${recipeEntries[0][0]})`}
              </span>

              <strong>
                {formatNumber(
                  Array.from(data.perRecipe.values()).reduce(
                    (sum, val) =>
                      sum + (typeof val === "number" ? val : val?.count || 0),
                    0,
                  ),
                )}
              </strong>
            </div>

            {recipeEntries.length === 1 &&
              recipeEntries[0][1]?.upgrades?.size > 0 && (
                <div className="summary-sub-rows">
                  <div
                    className="summary-row summary-sub-row"
                    key={`${buildingName}-${recipeEntries[0][0]}-${0}-upgrades`}
                  >
                    - Upgrades:{" "}
                    {getUpgradeChain(
                      buildingName,
                      upgradesChain,
                      Array.from(recipeEntries[0][1].upgrades.values()),
                    ).join(", ")}
                  </div>
                </div>
              )}

            {recipeEntries.length > 1 && (
              <div className="summary-sub-rows">
                {recipeEntries.map(([recipeName, recipeData], index) => {
                  return (
                    <>
                      <div
                        className="summary-row summary-sub-row"
                        key={`${buildingName}-${recipeName}-${index}`}
                      >
                        <span>- {recipeName}</span>

                        <strong>
                          {formatNumber(
                            typeof recipeData === "number"
                              ? recipeData
                              : recipeData?.count,
                          )}
                        </strong>
                      </div>

                      {recipeData?.upgrades?.size > 0 && (
                        <div className="summary-sub-sub-rows">
                          <div
                            className="summary-row summary-sub-sub-row"
                            key={`${buildingName}-${recipeName}-${index}-upgrades`}
                          >
                            - Upgrades:{" "}
                            {getUpgradeChain(
                              buildingName,
                              upgradesChain,
                              Array.from(recipeData.upgrades.values()),
                            ).join(", ")}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SummaryBuildingsConstruction({
  buildings,
  empty,
  buildingsData,
  upgradesChain,
  userInventory,
  calculation,
}) {
  if (!buildings.length) {
    return <div className="summary-empty">{empty}</div>;
  }

  const [typeCopied, setTypeCopied] = useState(null);

  var materialsByBuilding = calculateBuildingMaterials(
    buildings,
    buildingsData,
    upgradesChain,
  );

  console.log("Materials by building:", materialsByBuilding);

  var totalMaterials = getTotalMaterials(materialsByBuilding);

  console.log("Total materials:", totalMaterials);

  var materialsByRecipe = getMaterialsByRecipe(materialsByBuilding);

  function getProductionLineInfo() {
    var result = ["> Production Line Info:"];

    const target = calculation.target;
    const manaPoints = Array.from(materialsByBuilding.values()).reduce(
      (sum, buildingMaterialList) =>
        sum + (buildingMaterialList.manaPoints || 0),
      0,
    );

    const recipes = Array.from(materialsByRecipe.keys());
    const buildingsByRecipe = Array.from(materialsByBuilding.entries()).map(
      ([building, buildingMaterialList]) => {
        return Array.from(buildingMaterialList.perRecipe.entries())
          .map(([recipe, recipeData]) => {
            let baseAmount = recipeData.buildingCount;
            let expansionAmount = recipeData.expansionCount || 0;
            let totalAmount = baseAmount + expansionAmount;

            let upgrades = Array.from(recipeData.upgrades.keys()).join(", ");

            return `- ${building} (${recipe}): ${baseAmount > 1 ? `Unique: ${baseAmount}, Expansions: ${expansionAmount}, Total: ${totalAmount}` : `${totalAmount}`}${upgrades ? `\n  - Upgrades: ${upgrades}` : ""}`;
          })
          .join("\n");
      },
    );
    const classes = Array.from(
      calculation.classes?.entries ? calculation.classes.entries() : [],
    );

    result.push(
      `Production: ${Number(target.produced).toLocaleString(undefined, { maximumFractionDigits: 3 })} ${target.product}`,
    );
    result.push(`Recipes: ${recipes.join(", ")}`);
    result.push(
      `Total Management Points: ${Number(manaPoints).toLocaleString(undefined, { maximumFractionDigits: 3 })}`,
    );
    result.push(
      `Skills needed: ${classes.map(([className, classData]) => `${className} (${formatSkillTier(classData.maxSkill)})`).join(", ")}`,
    );
    result.push(`\n> Buildings needed:\n${buildingsByRecipe.join("\n")}`);

    return result.join("\n");
  }

  async function handleCopyMaterials() {
    await navigator.clipboard.writeText(
      `${getProductionLineInfo()}\n\n> Total Materials:\n${Array.from(
        totalMaterials.entries(),
      )
        .map(([material, amount]) => `- ${material}: ${amount}`)
        .join("\n")}`,
    );
    setTypeCopied("materials");
    setTimeout(() => setTypeCopied(null), 3000);
  }

  async function handleCopyMaterialsByBuilding() {
    await navigator.clipboard.writeText(
      `${getProductionLineInfo()}\n\n> Materials by Building:\n${Array.from(
        materialsByBuilding.entries(),
      )
        .map(
          ([building, buildingMaterialList]) =>
            `${building}:\n${Array.from(
              buildingMaterialList.totalMaterials.entries(),
            )
              .map(([material, amount]) => `- ${material}: ${amount}`)
              .join("\n")}`,
        )
        .join("\n\n")}`,
    );
    setTypeCopied("materialsByBuilding");
    setTimeout(() => setTypeCopied(null), 3000);
  }

  async function handleCopyMaterialsByRecipe() {
    await navigator.clipboard.writeText(
      `${getProductionLineInfo()}\n\n> Materials by Recipe:\n${Array.from(
        materialsByRecipe.entries(),
      )
        .map(
          ([recipe, recipeData]) =>
            `${recipe} (${recipeData.buildingType}):\n${Array.from(
              recipeData.materials.entries(),
            )
              .map(([material, amount]) => `- ${material}: ${amount}`)
              .join("\n")}`,
        )
        .join("\n\n")}`,
    );
    setTypeCopied("materialsByRecipe");
    setTimeout(() => setTypeCopied(null), 3000);
  }

  return (
    <>
      <div className="construction-buttons">
        <span>Copy materials list:</span>
        <button className="construction-button" onClick={handleCopyMaterials}>
          {typeCopied === "materials" ? "Copied!" : "Total"}
        </button>
        <button
          className="construction-button"
          onClick={handleCopyMaterialsByBuilding}
        >
          {typeCopied === "materialsByBuilding" ? "Copied!" : "By Building"}
        </button>
        <button
          className="construction-button"
          onClick={handleCopyMaterialsByRecipe}
        >
          {typeCopied === "materialsByRecipe" ? "Copied!" : "By Recipe"}
        </button>
      </div>

      <div className="summary-rows">
        {Array.from(totalMaterials.entries()).map(([materialName, count]) => (
          <div key={materialName} className="summary-row">
            <span>{materialName}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
    </>
  );
}
