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

export default function ProductionSummary({ calculation }) {
  const products = Object.values(calculation.products || {});

  const marketSurplus = Object.entries(calculation.surplus?.market || {});

  const productionSurplus = Object.entries(
    calculation.surplus?.production || {},
  );

  const purchases = Object.entries(calculation.purchases || {});

  const recipeEntries = Object.values(calculation.recipes || {});

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

        <SummarySection title="Production Surplus">
          <SummaryRows
            rows={productionSurplus.map(([product, amount]) => [
              product,
              formatNumber(amount),
            ])}
            empty="No production surplus."
          />
        </SummarySection>

        <SummarySection title="Recipes">
          <div className="summary-recipe-list">
            {recipeEntries.length === 0 ? (
              <div className="summary-empty">No recipes used.</div>
            ) : (
              recipeEntries.map((recipe) => (
                <div className="summary-recipe" key={recipe.name}>
                  <div>
                    <strong>{recipe.name}</strong>
                  </div>

                  <span>{formatNumber(recipe.runs, 1)} runs</span>
                </div>
              ))
            )}
          </div>
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
      {rows.map(([label, value]) => (
        <div className="summary-row" key={label}>
          <span>{label}</span>

          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
