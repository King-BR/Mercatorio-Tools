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

export default function ProductionSummary({ calculation }) {
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
   * [
   *   [
   *     "Building Name",
   *     {
   *       count: number,
   *       perRecipe: Map<string, { count: number }>
   *     }
   *   ]
   * ]
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
          <SummaryBuildings buildings={buildings} empty="No buildings used." />
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

function SummaryBuildings({ buildings, empty }) {
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

              <strong>{formatNumber(data?.total)}</strong>
            </div>

            {recipeEntries.length > 1 && (
              <div className="summary-sub-rows">
                {recipeEntries.map(([recipeName, recipeData], index) => (
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
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
