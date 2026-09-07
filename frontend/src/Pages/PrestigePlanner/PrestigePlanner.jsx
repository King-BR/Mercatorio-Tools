import { useMemo, useState, useEffect, useRef } from "react";

import { getPrestigeBoard, getPrestigeSustenance } from "../../services/api";

import "./PrestigePlanner.css";

const FORMAT_VERSION = 1;

const CURRENT_BONUS_FORMATTING = {
  default: (level, bonus = 0) => `+${bonus}`,
  tenants: (level, bonus = 0) =>
    `${bonus} tenants (${Math.floor(bonus / 5)} boardinghouses)`,
  management: (level, bonus = 0) => `${bonus} management points`,
  transports: (level, bonus = 0) => `${bonus} transport capacity`,
  prestige_management: (level, bonus = 0) =>
    `${bonus} prestige management points`,
  cargo_slots: (level, bonus = 0) => `${bonus} bonus cargo slots`,
  apprentices: (level, bonus = 0) =>
    bonus != 0 ? `${bonus} apprentices` : "Locked",
  luxuries: (level, bonus = 0) =>
    bonus != 0 ? `${bonus} luxuries slots` : "Locked",
  scale_luxuries: (level, bonus = 0) =>
    `x${bonus + 1} multiplier (usage and prestige generation)`,
  contracts: (level, bonus = 0) =>
    level > 0 ? `${bonus} contracts limit` : "Locked",
};

/*
 * The Prestige Board JSON stores levels as array entries:
 *
 * category[0] = level 1
 * category[1] = level 2
 * category[2] = level 3
 *
 * Therefore we store the selected level internally as
 * a zero-based index.
 *
 * -1 means that no level is selected.
 */

function getInitialLevels(prestigeBoard) {
  const levels = {};

  for (const categoryKey of Object.keys(prestigeBoard)) {
    const category = prestigeBoard[categoryKey];

    const freeIndex = category.findIndex((level) => Number(level.cost) === 0);

    /*
     * If the category has a free level, select it.
     *
     * If it doesn't, start at -1, meaning no level
     * has been unlocked yet.
     */
    levels[categoryKey] = freeIndex >= 0 ? freeIndex : -1;
  }

  return levels;
}

/*
 * Calculates the cumulative cost of all unlocked levels.
 *
 * Example:
 *
 * Level 1 = 10
 * Level 2 = 20
 * Level 3 = 50
 *
 * Selecting level 3 costs:
 *
 * 10 + 20 + 50 = 80
 */
function getCategoryTotalCost(category, selectedIndex) {
  if (selectedIndex < 0) {
    return 0;
  }

  return category
    .slice(0, selectedIndex + 1)
    .reduce((total, level) => total + Number(level.cost || 0), 0);
}

/*
 * Calculates the cumulative bonus of all unlocked levels.
 *
 * Example:
 *
 * Level 1 = +2
 * Level 2 = +2
 * Level 3 = +2
 *
 * Selecting level 3 gives:
 *
 * 2 + 2 + 2 = +6
 */
function getCategoryTotalBonus(category, selectedIndex) {
  if (selectedIndex < 0) {
    return 0;
  }

  return category
    .slice(0, selectedIndex + 1)
    .reduce((total, level) => total + Number(level.bonus || 0), 0);
}

function getLevel(category, selectedIndex) {
  if (selectedIndex < 0) {
    return null;
  }

  return category[selectedIndex] ?? null;
}

function PrestigeBoard() {
  const [prestigeBoard, setPrestigeBoard] = useState(null);
  const [prestigeSustenance, setPrestigeSustenance] = useState(null);
  const [selectedLevels, setSelectedLevels] = useState({});
  const [importValue, setImportValue] = useState("");
  const [message, setMessage] = useState(null);
  const levelListRefs = useRef({});

  /*
   * Load Prestige Board data.
   */
  useEffect(() => {
    async function loadData() {
      try {
        const [board, sustenance] = await Promise.all([
          getPrestigeBoard(),
          getPrestigeSustenance(),
        ]);

        setPrestigeBoard(board);
        setPrestigeSustenance(sustenance);

        setSelectedLevels(getInitialLevels(board));
      } catch (error) {
        console.error("Failed to load Prestige Board:", error);

        setMessage({
          type: "error",
          text: "Failed to load Prestige Board.",
        });
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (!prestigeBoard) {
      return;
    }

    Object.keys(prestigeBoard).forEach((categoryKey) => {
      const selectedIndex = selectedLevels[categoryKey] ?? -1;

      if (selectedIndex < 0) {
        return;
      }

      const list = levelListRefs.current[categoryKey];

      if (!list) {
        return;
      }

      const row = list.children[selectedIndex];

      if (!row) {
        return;
      }

      const listRect = list.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();

      // Posição da linha dentro da área visível da lista
      const rowRelativeTop = rowRect.top - listRect.top;

      // Centraliza a linha selecionada
      const targetScrollTop =
        list.scrollTop +
        rowRelativeTop -
        list.clientHeight / 2 +
        rowRect.height / 2;

      const maxScrollTop = list.scrollHeight - list.clientHeight;

      list.scrollTo({
        top: Math.max(0, Math.min(targetScrollTop, maxScrollTop)),
        behavior: "smooth",
      });
    });
  }, [selectedLevels, prestigeBoard]);

  /*
   * Calculate category totals and overall total.
   */
  const totals = useMemo(() => {
    if (!prestigeBoard) {
      return {
        totalCost: 0,
        bonuses: {},
        categories: {},
      };
    }

    let totalCost = 0;

    const bonuses = {};
    const categories = {};

    Object.entries(prestigeBoard).forEach(([categoryKey, category]) => {
      const selectedIndex = selectedLevels[categoryKey] ?? -1;

      const categoryCost = getCategoryTotalCost(category, selectedIndex);

      const categoryBonus = getCategoryTotalBonus(category, selectedIndex);

      totalCost += categoryCost;

      bonuses[categoryKey] = categoryBonus;

      categories[categoryKey] = {
        total: categoryCost,
        bonus: categoryBonus,
      };
    });

    return {
      totalCost,
      bonuses,
      categories,
    };
  }, [prestigeBoard, selectedLevels]);

  /*
   * Increase a category by one level.
   */
  function increaseLevel(categoryKey) {
    const category = prestigeBoard[categoryKey];

    setSelectedLevels((previous) => {
      const currentIndex = previous[categoryKey] ?? -1;

      /*
       * Already at maximum level.
       */
      if (currentIndex >= category.length - 1) {
        return previous;
      }

      return {
        ...previous,
        [categoryKey]: currentIndex + 1,
      };
    });

    setMessage(null);
  }

  /*
   * Decrease a category by one level.
   */
  function decreaseLevel(categoryKey) {
    const category = prestigeBoard[categoryKey];

    setSelectedLevels((previous) => {
      const currentIndex = previous[categoryKey] ?? -1;

      /*
       * Nothing selected.
       */
      if (currentIndex < 0) {
        return previous;
      }

      /*
       * Find the free starting level.
       */
      const freeIndex = category.findIndex((level) => Number(level.cost) === 0);

      /*
       * If there is a free level, it is the minimum.
       *
       * If there isn't one, -1 is the minimum.
       */
      const minimumIndex = freeIndex >= 0 ? freeIndex : -1;

      /*
       * Never go below the free level.
       */
      if (currentIndex <= minimumIndex) {
        return previous;
      }

      return {
        ...previous,
        [categoryKey]: currentIndex - 1,
      };
    });

    setMessage(null);
  }

  /*
   * Reset everything to the initial state.
   */
  function resetLevels() {
    if (!prestigeBoard) {
      return;
    }

    setSelectedLevels(getInitialLevels(prestigeBoard));

    setMessage(null);
  }

  /*
   * Data used for import/export.
   *
   * We store the actual displayed level number
   * instead of the internal zero-based index.
   *
   * Example:
   *
   * {
   *   version: 1,
   *   levels: {
   *     tenants: 5,
   *     management: 3
   *   }
   * }
   */
  function createExportData() {
    const levels = {};

    for (const categoryKey of Object.keys(prestigeBoard)) {
      const selectedIndex = selectedLevels[categoryKey] ?? -1;

      /*
       * -1 becomes level 0.
       * Otherwise convert zero-based index
       * to the displayed level number.
       */
      levels[categoryKey] = selectedIndex >= 0 ? selectedIndex + 1 : 0;
    }

    return {
      version: FORMAT_VERSION,
      levels,
    };
  }

  /*
   * Export configuration and copy it to clipboard.
   */
  async function exportConfiguration() {
    const data = JSON.stringify(createExportData());

    /*
     * Encode the JSON so the sharing code is
     * compact and contains no unnecessary spaces.
     */
    const encoded = btoa(encodeURIComponent(data));

    try {
      await navigator.clipboard.writeText(encoded);

      setImportValue(encoded);

      setMessage({
        type: "success",
        text: "Configuration copied to clipboard.",
      });
    } catch {
      setImportValue(encoded);

      setMessage({
        type: "info",
        text: "Configuration generated. Copy the code from the field below.",
      });
    }
  }

  /*
   * Copy the current configuration.
   */
  async function copyConfiguration() {
    const data = JSON.stringify(createExportData());

    const encoded = btoa(encodeURIComponent(data));

    try {
      await navigator.clipboard.writeText(encoded);

      setImportValue(encoded);

      setMessage({
        type: "success",
        text: "Configuration copied to clipboard.",
      });
    } catch {
      setImportValue(encoded);

      setMessage({
        type: "info",
        text: "Copy the configuration from the field below.",
      });
    }
  }

  /*
   * Import a previously exported configuration.
   */
  function importConfiguration() {
    if (!importValue.trim()) {
      setMessage({
        type: "error",
        text: "Enter a configuration code.",
      });

      return;
    }

    try {
      const decoded = decodeURIComponent(atob(importValue.trim()));

      const data = JSON.parse(decoded);

      if (!data || typeof data !== "object") {
        throw new Error("Invalid configuration.");
      }

      if (data.version !== FORMAT_VERSION) {
        throw new Error("Unsupported configuration version.");
      }

      if (!data.levels || typeof data.levels !== "object") {
        throw new Error("Configuration has no levels.");
      }

      const importedLevels = {};

      for (const categoryKey of Object.keys(prestigeBoard)) {
        const category = prestigeBoard[categoryKey];

        /*
         * Find the free level.
         */
        const freeIndex = category.findIndex(
          (level) => Number(level.cost) === 0,
        );

        const minimumIndex = freeIndex >= 0 ? freeIndex : -1;

        const maximumIndex = category.length - 1;

        /*
         * Configuration stores displayed level numbers.
         */
        const importedLevel = Number(data.levels[categoryKey]);

        /*
         * Missing categories go back to
         * their default level.
         */
        if (!Number.isFinite(importedLevel)) {
          importedLevels[categoryKey] = minimumIndex;

          continue;
        }

        /*
         * Convert displayed level number
         * to zero-based index.
         *
         * Level 1 -> index 0
         * Level 2 -> index 1
         */
        const importedIndex = importedLevel - 1;

        /*
         * Clamp the imported level between
         * the minimum and maximum allowed levels.
         */
        importedLevels[categoryKey] = Math.min(
          Math.max(importedIndex, minimumIndex),
          maximumIndex,
        );
      }

      setSelectedLevels(importedLevels);

      setMessage({
        type: "success",
        text: "Configuration imported successfully.",
      });
    } catch (error) {
      console.error("Failed to import configuration:", error);

      setMessage({
        type: "error",
        text: "Invalid configuration code.",
      });
    }
  }

  /*
   * Loading state.
   */
  if (!prestigeBoard) {
    return (
      <div className="prestige-page">
        <div className="prestige-container">
          <div className="prestige-loading">Loading Prestige Board...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="prestige-page">
      <div className="prestige-container">
        {/* -------------------------------- */}
        {/* Header */}
        {/* -------------------------------- */}

        <header className="prestige-header">
          <div>
            <h1>Prestige Board Planner</h1>

            <p>
              Preview your Prestige Board allocation and calculate the total
              prestige needed.
            </p>
          </div>

          <button
            type="button"
            className="prestige-reset-button"
            onClick={resetLevels}
          >
            Reset Levels
          </button>
        </header>

        {/* -------------------------------- */}
        {/* Summary */}
        {/* -------------------------------- */}

        <section className="prestige-summary">
          <div className="prestige-summary-main">
            <span className="prestige-summary-label">Total Cost</span>

            <span className="prestige-summary-value">
              {totals.totalCost.toLocaleString()}
            </span>
          </div>

          <div className="prestige-summary-description">
            Total cost of all selected levels
          </div>
        </section>

        {/* -------------------------------- */}
        {/* Messages */}
        {/* -------------------------------- */}

        {message && (
          <div className={`prestige-message prestige-message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* -------------------------------- */}
        {/* Import / Export */}
        {/* -------------------------------- */}

        <section className="prestige-import-export">
          <div className="prestige-section-title">
            Share your prestige board
          </div>

          <p className="prestige-section-description">
            Export your selected levels and share the generated configuration
            code with another player.
          </p>

          <textarea
            className="prestige-share-input"
            value={importValue}
            onChange={(event) => setImportValue(event.target.value)}
            placeholder="Paste a configuration code here..."
            spellCheck={false}
          />

          <div className="prestige-share-buttons">
            <button
              type="button"
              className="prestige-button prestige-button-primary"
              onClick={exportConfiguration}
            >
              Export & Copy
            </button>

            <button
              type="button"
              className="prestige-button"
              onClick={copyConfiguration}
            >
              Copy Code
            </button>

            <button
              type="button"
              className="prestige-button"
              onClick={importConfiguration}
            >
              Import
            </button>
          </div>
        </section>

        {/* -------------------------------- */}
        {/* Prestige Board */}
        {/* -------------------------------- */}

        <section className="prestige-board">
          {Object.keys(prestigeBoard).map((categoryKey) => {
            const category = prestigeBoard[categoryKey];

            const selectedIndex = selectedLevels[categoryKey] ?? -1;

            const selectedLevelData = getLevel(category, selectedIndex);

            /*
             * Cumulative category totals.
             */
            const categoryTotal = totals.categories[categoryKey]?.total ?? 0;

            const categoryBonus = totals.categories[categoryKey]?.bonus ?? 0;

            /*
             * Maximum level.
             */
            const canIncrease = selectedIndex < category.length - 1;

            /*
             * Find the free level.
             */
            const freeIndex = category.findIndex(
              (level) => Number(level.cost) === 0,
            );

            const minimumIndex = freeIndex >= 0 ? freeIndex : -1;

            const canDecrease = selectedIndex > minimumIndex;

            const displayedLevel = selectedIndex >= 0 ? selectedIndex + 1 : 0;

            const currentBonusText = CURRENT_BONUS_FORMATTING[categoryKey](
              selectedIndex,
              categoryBonus,
            );

            return (
              <article className="prestige-category" key={categoryKey}>
                {/* -------------------------------- */}
                {/* Category Header */}
                {/* -------------------------------- */}

                <div className="prestige-category-header">
                  <div>
                    <h2>
                      {categoryKey
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </h2>
                  </div>

                  <div className="prestige-category-total">
                    <span>Total Cost</span>

                    <strong>{categoryTotal.toLocaleString()}</strong>
                  </div>
                </div>

                {/* -------------------------------- */}
                {/* Level Selector */}
                {/* -------------------------------- */}

                <div className="prestige-level-selector">
                  <button
                    type="button"
                    className="prestige-level-button"
                    onClick={() => decreaseLevel(categoryKey)}
                    disabled={!canDecrease}
                    aria-label={`Decrease ${categoryKey} level`}
                  >
                    −
                  </button>

                  <div className="prestige-current-level">
                    <span>Level</span>

                    <strong>{displayedLevel}</strong>
                  </div>

                  <button
                    type="button"
                    className="prestige-level-button"
                    onClick={() => increaseLevel(categoryKey)}
                    disabled={!canIncrease}
                    aria-label={`Increase ${categoryKey} level`}
                  >
                    +
                  </button>
                </div>

                {/* -------------------------------- */}
                {/* Current Effect */}
                {/* -------------------------------- */}

                <div className="prestige-current-effect">
                  <span className="prestige-label">Current Bonus</span>

                  <strong>{currentBonusText}</strong>
                </div>

                {/* -------------------------------- */}
                {/* Level List */}
                {/* -------------------------------- */}

                <div
                  className="prestige-level-list"
                  ref={(element) => {
                    levelListRefs.current[categoryKey] = element;
                  }}
                >
                  {category.map((level, index) => {
                    const unlocked = index <= selectedIndex;

                    const isCurrent = index === selectedIndex;

                    const levelBonus = Number(level.bonus || 0);
                    const levelCost = Number(level.cost || 0);

                    return (
                      <div
                        className={`prestige-level-row ${
                          unlocked ? "prestige-level-unlocked" : ""
                        } ${isCurrent ? "prestige-level-current" : ""}`}
                        key={index}
                      >
                        <div className="prestige-level-number">
                          <span>Level</span>

                          <strong>{index + 1}</strong>
                        </div>

                        <div className="prestige-level-info">
                          <span>Bonus: +{levelBonus}</span>
                        </div>

                        <div className="prestige-level-cost">
                          {levelCost === 0 ? (
                            <span className="prestige-free">Free</span>
                          ) : (
                            levelCost.toLocaleString()
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export default PrestigeBoard;
