var previousProduct = null;
var rootProduct = null;
var rootMult = 1;
var recipes = {};
var products = [];
var links = [];
var nodes = new Map();
var previousProductConfig = null;
var currentProductConfig = null;
const productsAmounts = new Map();
const productsUsed = new Map();
const productsPrices = new Map();
const productsUnitCost = new Map();
const recipeConfig = new Map();
const recipesByProduct = new Map();
const currentMarketPrices = new Map();

const state = new Map();
const tiers = ["Novice", "Worker", "Journeyman", "Master", "Specialist"];

const width = window.innerWidth;
const height = window.innerHeight - 56;

const svg = d3.select("#svgCanvas");
const g = svg.append("g");
const zoom = d3
  .zoom()
  .on("zoom", ({ transform }) => g.attr("transform", transform));
svg.call(zoom);

async function getRecipes() {
  const response = await fetch("api/recipes");
  recipes = await response.json();

  recipes = Object.fromEntries(
    Object.entries(recipes).filter(([key, value]) => !value.bots_only)
  );

  for (let recipe in recipes) {
    if (!recipes[recipe].inputs) {
      recipes[recipe].inputs = [];
    }

    if (!recipes[recipe].outputs) {
      recipes[recipe].outputs = [];

      if (recipes[recipe].health) {
        recipes[recipe].outputs.push({
          product: "health",
          amount: recipes[recipe].health,
        });
      }

      if (recipes[recipe].prestige) {
        recipes[recipe].outputs.push({
          product: "prestige",
          amount: recipes[recipe].prestige * 100,
        });
      }
    }
  }
}

function getProducts() {
  for (let recipe in recipes) {
    for (let output of recipes[recipe].outputs) {
      if (!products.includes(output.product)) {
        products.push(output.product);
      }
    }
  }

  products.sort();

  return products;
}

async function getMarketPrices() {
  const response = await fetch(
    "https://api.mercatorio-tools.tech/tmp/marketdata"
  );
  const data = await response.json();

  var tmpMarketPrices = new Map();
  var amountMarkets = new Map();

  currentMarketPrices.clear();

  data.forEach((town) => {
    products.forEach((product) => {
      if (!town.markets[product]) return;

      var marketdata = town.markets[product];
      marketdata.moving_average =
        Math.ceil((Number.parseFloat(marketdata.moving_average) || 0) * 100) /
        100;
      marketdata.average_price =
        Math.ceil((Number.parseFloat(marketdata.average_price) || 0) * 100) /
        100;

      if (marketdata.moving_average > 0 || marketdata.average_price > 0) {
        tmpMarketPrices.set(
          product,
          (tmpMarketPrices.get(product) || 0) +
            (marketdata?.moving_average || marketdata?.average_price)
        );

        amountMarkets.set(product, (amountMarkets.get(product) || 0) + 1);
      }
    });
  });

  tmpMarketPrices.forEach((price, product) => {
    currentMarketPrices.set(
      product,
      Math.ceil((price / amountMarkets.get(product)) * 100) / 100
    );
    productsPrices.set(
      product,
      Math.ceil((price / amountMarkets.get(product)) * 100) / 100
    );
  });
}

function findAllRecipesByProduct(product) {
  return Object.values(recipes).filter((recipe) => {
    return recipe.outputs.some((output) => output.product === product);
  });
}

function findRecipeByProduct(product) {
  return Object.values(recipes).find((recipe) => {
    return recipe.outputs.some((output) => output.product === product);
  });
}

function upperCase(str) {
  return str
    .split(" ")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function populateConfig() {
  const configDiv = document.getElementById("recipe-config-div");
  const configSelect = document.getElementById("recipe-config-select");

  recipeConfig.clear();
  recipesByProduct.clear();

  for (const product of products) {
    const productRecipes = findAllRecipesByProduct(product);
    recipeConfig.set(product, productRecipes[0]?.name || null);
    recipesByProduct.set(product, productRecipes);

    const option = document.createElement("option");
    option.value = product;
    option.textContent = upperCase(product);
    configSelect.appendChild(option);

    configDiv.innerHTML += `<div id="${product}-config-div" class="recipe-config-item" style="display: none;">
      <h1>${upperCase(product)}</h1>
        <label for="${product}-price">Market Price</label>
        <input id="${product}-price" class="w3-round input-product-price" type="number" min=0 step="0.01" value="${
      productsPrices.get(product) || 0
    }" onchange="updateProductPrice(this)"/>
      ${productRecipes
        .map(
          (recipe) => `
          <h2>${upperCase(
            recipe.name
          )} <input type="radio" name="${product}-recipe-btn" class="w3-round check-config" id="${product}-${
            recipe.name
          }-enabled" ${
            recipeConfig.get(product) === recipe.name ? "checked" : ""
          } onchange="updateRecipeConfig(this)" /></h2>
            <div class="recipe-config-item-desc">
              Building: ${upperCase(recipe.site)}
              ${
                recipe.upgrades
                  ? "<br> Upgrades: " +
                    recipe.upgrades.map((u) => upperCase(u)).join(", ")
                  : ""
              }
              <br>
              Level: ${recipe.class ? upperCase(recipe.class) : "Any"} ${
            tiers[recipe.tier - 1]
          }
            </div>
            <div class="recipe-config-item-products">
              ${recipe.inputs ? "<h3>Inputs</h3>" : ""}
              ${recipe.outputs ? "<h3>Outputs</h3>" : ""}
                ${
                  recipe.inputs
                    ? "<div>" +
                      recipe.inputs
                        .map(
                          (input) =>
                            `<div>${upperCase(input.product)}: ${
                              input.amount
                            }</div>`
                        )
                        .join("") +
                      "</div>"
                    : ""
                }
                ${
                  recipe.outputs
                    ? "<div>" +
                      recipe.outputs
                        .map(
                          (output) =>
                            `<div>${upperCase(output.product)}: ${
                              output.amount
                            }</div>`
                        )
                        .join("") +
                      "</div>"
                    : ""
                }
            </div>
      `
        )
        .join("")}
    </div>`;
  }
}

function updateConfig() {
  previousProductConfig = currentProductConfig;
  currentProductConfig = document.getElementById("recipe-config-select").value;

  document.getElementById("default-message-config").style.display = "none";

  if (previousProductConfig != "" && previousProductConfig)
    document.getElementById(
      `${previousProductConfig}-config-div`
    ).style.display = "none";

  document.getElementById(`${currentProductConfig}-config-div`).style.display =
    "block";
}

function updateRecipeConfig(checkbox) {
  const [product, recipeName] = checkbox.id.split("-").slice(0, 2);

  if (checkbox.checked) {
    recipeConfig.set(product, recipeName);
  }

  updateConfig();
  updateRecipeTree();
}

function updateProductPrice(input) {
  const product = input.id.split("-")[0];
  const price =
    Math.ceil(Number.parseFloat(input.value.replace(",", ".")) * 100) / 100;

  if (!products.includes(product)) return;

  if (isNaN(price) || price < 0) input.value = 0;

  productsPrices.set(product, price);

  updateSummary();
}

function openConfig() {
  document.getElementById("recipe-config-popup").style.display = "flex";
}

function closeConfig() {
  document.getElementById("recipe-config-popup").style.display = "none";
}

function buildGraph(rootName) {
  var visited = new Set();

  links = [];
  nodes = new Map();

  function ensureNode(name) {
    if (!nodes.has(name)) {
      let r = recipes[recipeConfig.get(name)];

      const baseLabel = `{amountProduct}x ${upperCase(name)}`;

      const extraLabel =
        state.get(name) === "buy"
          ? ""
          : `\n{amountRecipe}x ${upperCase(r.name)}\n${upperCase(r.site)}\n${
              tiers[r.tier - 1]
            }${r.class ? ` ${upperCase(r.class)}` : ""}`;

      const label = baseLabel + extraLabel;

      nodes.set(name, {
        id: name,
        label,
        data: r,
      });
    }

    return nodes.get(name);
  }

  function expand(productName, amountRequired = 0, parent = null, depth = 0) {
    ensureNode(productName);

    if (productName === "labour" && rootProduct !== "labour") return;
    if (visited.has(productName)) return;
    visited.add(productName);

    const recipeName = recipeConfig.get(productName);
    if (!recipeName) {
      console.log(`No recipe for ${productName}`);
      return;
    }

    const r = recipes[recipeName];
    if (
      !r ||
      !r.outputs ||
      r.outputs.filter((i) => i.product === productName).length === 0
    ) {
      console.log(`Recipe ${recipeName} doesnt output ${productName}`);
      return;
    }

    if (state.get(productName) === "buy") return; // stop expansion if set to buy

    const output = r.outputs.find((o) => o.product === productName);

    // get multiplier to produce required amount
    var mult =
      Number.parseFloat(amountRequired) / Number.parseFloat(output.amount);

    if (!parent && depth === 0) mult = rootMult;
    if (mult < 0.1) mult = 0.1;

    mult = Math.ceil(Number.parseFloat(mult) * 10) / 10;

    for (const inp of r.inputs) {
      links.push({
        source: inp.product,
        target: productName,
        inputAmountTarget: inp.amount * mult,
        multTarget: mult,
        inputAmountSource: 0,
        multSource: 0,
      });

      expand(inp.product, inp.amount * mult, productName, depth + 1);
    }
  }

  function mergeBidirectionalLinks() {
    const merged = [];
    const seen = new Set();

    links.forEach((link) => {
      const keyAB = `${link.source}-${link.target}`;
      const keyBA = `${link.target}-${link.source}`;

      if (seen.has(keyAB) || seen.has(keyBA)) return;

      const reverse = links.find(
        (l) => l.source === link.target && l.target === link.source
      );

      if (reverse) {
        merged.push({
          source: link.source,
          target: link.target,
          inputAmountTarget: link.inputAmountTarget,
          multTarget: link.multTarget,
          inputAmountSource: reverse.inputAmountTarget,
          multSource: reverse.multTarget,
        });
        seen.add(keyAB);
        seen.add(keyBA);
      } else {
        merged.push(link);
        seen.add(keyAB);
      }
    });

    return merged;
  }

  expand(rootName);
  nodes = Array.from(nodes.values());
  links = mergeBidirectionalLinks();
}

function render(root) {
  g.selectAll("*").remove();
  productsAmounts.clear();

  buildGraph(root);

  links.forEach((l) => {
    productsAmounts.set(
      l.source,
      Math.ceil(
        ((productsAmounts.get(l.source) || 0) +
          Number.parseFloat(l.inputAmountTarget)) *
          100
      ) / 100
    );
    productsAmounts.set(
      l.target,
      Math.ceil(
        ((productsAmounts.get(l.target) || 0) +
          Number.parseFloat(l.inputAmountSource)) *
          100
      ) / 100
    );
  });

  // Define arrow heads
  svg
    .append("defs")
    .append("marker")
    .attr("id", "arrow-end")
    .attr("viewBox", "-0 -5 10 10")
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", 20)
    .attr("markerHeight", 20)
    .attr("xoverflow", "visible")
    .append("svg:path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("fill", "#999999")
    .style("stroke", "none");

  svg
    .append("defs")
    .append("marker")
    .attr("id", "arrow-start")
    .attr("viewBox", "-0 -5 10 10")
    .attr("refX", 10)
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", 20)
    .attr("markerHeight", 20)
    .attr("orient", "auto-start-reverse")
    .attr("xoverflow", "visible")
    .append("svg:path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("fill", "#999999")
    .style("stroke", "none");

  // Force simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(300)
        .strength(0.2)
    )
    .force("charge", d3.forceManyBody().strength(-600))
    .force("collision", d3.forceCollide().radius(60))
    .force(
      "center",
      d3.forceCenter(window.innerWidth / 2 - window.innerWidth / 5, height / 2)
    );

  // Links
  const link = g
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "edge")
    .attr("stroke", (d) => "#999999")
    .attr("stroke-width", (d) => "2px")
    .attr("marker-end", (d) => "url(#arrow-end)")
    .attr("marker-start", (d) =>
      d.inputAmountSource > 0 ? "url(#arrow-start)" : null
    );

  // Link labels
  const linkLabels = g
    .append("g")
    .attr("class", "link-labels")
    .selectAll("g.link-label")
    .data(links)
    .enter()
    .append("g")
    .attr("class", "link-label")
    .style("pointer-events", "none");

  // Create background
  linkLabels
    .append("rect")
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", "#000000FF")
    .attr("stroke", "none");

  // Link label text
  linkLabels
    .append("text")
    .attr("font-size", 12)
    .attr("fill", "#FFFFFFFF")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .each(function (d) {
      let text = `${d.source.id}: ${
        Math.ceil(d.inputAmountTarget * 100) / 100
      }`;

      if (d.inputAmountSource)
        text += `\n${d.target.id}: ${
          Math.ceil(d.inputAmountSource * 100) / 100
        }`;

      const lines = text.split("\n");
      const textSel = d3.select(this);
      lines.forEach((line, i) => {
        textSel
          .append("tspan")
          .attr("x", 0)
          .attr(
            "dy",
            i === 0
              ? lines.length > 1 && lines.length <= 3
                ? -15
                : lines.length > 3
                ? -25
                : 5
              : 20
          )
          .attr("fill", i === 0 ? "#FFFFFF" : "#F6FF00")
          .text(line);
      });
    });

  // Resize background to contain link label text
  linkLabels.each(function () {
    const gThis = d3.select(this);
    const textNode = gThis.select("text").node();
    if (!textNode) return;
    const bbox = textNode.getBBox();
    const padX = 6;
    const padY = 4;
    gThis
      .select("rect")
      .attr("x", bbox.x - padX)
      .attr("y", bbox.y - padY)
      .attr("width", bbox.width + padX * 2)
      .attr("height", bbox.height + padY * 2);
  });

  // Create node groups
  const node = g
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node-group")
    .on("click", (_, d) => {
      if (d.root) return;
      if (d.id === "labour") return;

      const current = state.get(d.id) || "buy";
      state.set(d.id, current === "produce" ? "buy" : "produce");

      render(root);
      updateSummary();
    });

  // Product nodes
  node
    .append("circle")
    .attr("r", (d) => {
      const radius = 24 + (d.label.length > 20 ? 10 : 0);
      d.radius = radius;
      return radius;
    })
    .attr("class", "node")
    .attr("fill", (d) => {
      const mode = state.get(d.id) || "buy";

      if (d.id === rootProduct) {
        d.root = true;
        return "#FFD900FF";
      }
      return mode === "buy" ? "#00D40BFF" : "#D40000FF";
    })
    .each(function (d) {
      var totalAmountProduct =
        Math.ceil((productsAmounts.get(d.id) || 0) * 100) / 100;

      totalAmountProduct = Number.parseFloat(
        Math.ceil(totalAmountProduct * (d.root ? rootMult : 1) * 100) / 100
      );

      var amountUsed = totalAmountProduct;
      var mult = 0;

      if (state.get(d.id) === "buy") {
        totalAmountProduct = Math.ceil(totalAmountProduct);
      } else if (state.get(d.id) === "produce") {
        mult =
          Math.ceil(
            ((totalAmountProduct * (d.root ? rootMult : 1)) /
              recipes[recipeConfig.get(d.id)].outputs.find(
                (o) => o.product === d.id
              ).amount) *
              10
          ) / 10;

        if (mult < 0.1) mult = 0.1;
        if (d.root) mult = rootMult;

        mult = Number.parseFloat(mult);

        if (
          totalAmountProduct >
          Math.ceil(
            recipes[recipeConfig.get(d.id)].outputs.find(
              (o) => o.product === d.id
            ).amount *
              mult *
              100
          ) /
            100
        )
          mult = Math.ceil((mult + (d.root ? 0 : 0.1)) * 10) / 10;

        totalAmountProduct =
          Math.ceil(
            recipes[recipeConfig.get(d.id)].outputs.find(
              (o) => o.product === d.id
            ).amount *
              mult *
              100
          ) / 100;
      }

      productsAmounts.set(d.id, totalAmountProduct);
      productsUsed.set(d.id, amountUsed);
    });

  // Text labels
  const text = node
    .append("text")
    .attr("text-anchor", "middle")
    .each(function (d) {
      var totalAmountProduct =
        Math.ceil((productsAmounts.get(d.id) || 0) * 100) / 100;

      totalAmountProduct = Number.parseFloat(
        Math.ceil(totalAmountProduct * (d.root ? rootMult : 1) * 100) / 100
      );

      var mult = 0;

      if (state.get(d.id) === "buy") {
        totalAmountProduct = Math.ceil(totalAmountProduct);
      } else if (state.get(d.id) === "produce") {
        mult =
          Math.ceil(
            ((totalAmountProduct * (d.root ? rootMult : 1)) /
              recipes[recipeConfig.get(d.id)].outputs.find(
                (o) => o.product === d.id
              ).amount) *
              10
          ) / 10;

        if (mult < 0.1) mult = 0.1;
        if (d.root) mult = rootMult;

        mult = Number.parseFloat(mult);

        if (
          totalAmountProduct >
          Math.ceil(
            recipes[recipeConfig.get(d.id)].outputs.find(
              (o) => o.product === d.id
            ).amount *
              mult *
              100
          ) /
            100
        )
          mult = Math.ceil((mult + (d.root ? 0 : 0.1)) * 10) / 10;

        totalAmountProduct =
          Math.ceil(
            recipes[recipeConfig.get(d.id)].outputs.find(
              (o) => o.product === d.id
            ).amount *
              mult *
              100
          ) / 100;
      }

      d.label = d.label.replace("{amountProduct}", totalAmountProduct);
      if (mult > 0) d.label = d.label.replace("{amountRecipe}", mult);

      const lines = d.label.split("\n");
      const textSel = d3.select(this);
      lines.forEach((line, i) => {
        textSel
          .append("tspan")
          .attr("x", 0)
          .attr(
            "dy",
            i === 0
              ? lines.length > 1 && lines.length <= 3
                ? -15
                : lines.length > 3
                ? -25
                : 5
              : 20
          )
          .text(line);
      });
    });

  // Update node radius
  text.each(function () {
    const textNode = this;
    const bbox = textNode.getBBox();
    const r = Math.max(bbox.width / 2, bbox.height / 2) + 20;
    d3.select(textNode.parentNode)
      .select("circle")
      .attr("r", r)
      .each(function (d) {
        d.radius = r;
      });
  });

  // Update link, nodes and labels positions
  simulation.on("tick", () => {
    link
      .attr("x1", (d) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return d.source.x;

        const offsetSource = d.source.radius || 24;
        const normX = dx / dist;
        return d.source.x + normX * offsetSource;
      })
      .attr("y1", (d) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return d.source.y;

        const offsetSource = d.source.radius || 24;
        const normY = dy / dist;
        return d.source.y + normY * offsetSource;
      })
      .attr("x2", (d) => {
        const dx = d.source.x - d.target.x;
        const dy = d.source.y - d.target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return d.target.x;

        const offsetTarget = d.target.radius || 24;
        const normX = dx / dist;
        return d.target.x + normX * offsetTarget;
      })
      .attr("y2", (d) => {
        const dx = d.source.x - d.target.x;
        const dy = d.source.y - d.target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return d.target.y;

        const offsetTarget = d.target.radius || 24;
        const normY = dy / dist;
        return d.target.y + normY * offsetTarget;
      });

    linkLabels.attr("transform", (d) => {
      const mx = (d.source.x + d.target.x) / 2;
      const my = (d.source.y + d.target.y) / 2;
      return `translate(${mx},${my})`;
    });

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  // Drag view
  node.call(
    d3
      .drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      })
  );
}

// Update the summary
function updateSummary() {
  const div = document.getElementById("summary");

  productsUnitCost.clear();

  const productsBought = new Map();
  const productsProduced = new Map();

  productsAmounts.forEach((amount, product) => {
    if (state.get(product) === "buy") {
      productsBought.set(product, amount);
    } else if (state.get(product) === "produce") {
      productsProduced.set(product, amount);
    }
  });

  productsBought.forEach((amount, product) => {
    productsUnitCost.set(product, productsPrices.get(product) || 0);
  });

  productsProduced.forEach((amount, product) => {
    var tmpCost = 0;

    tmpCost = getCost(product);

    productsUnitCost.set(product, Math.ceil((tmpCost / amount) * 100) / 100);
  });

  div.innerHTML = `<h3><strong>Summary for ${rootProduct}:</strong></h3>
  <p>Labour per ${rootProduct}: ${
    Math.ceil(
      ((productsUsed.get("labour") || 0) / productsAmounts.get(rootProduct)) *
        100
    ) / 100 || 0
  }</p>
  <p>Unit cost: ${productsUnitCost.get(rootProduct) || 0}</p>
  <p>Market price: ${productsPrices.get(rootProduct) || 0}</p>
  <h3>Surplus</h3>
  ${Array.from(productsAmounts.keys())
    .map((p) => {
      let amount = productsAmounts.get(p) - productsUsed.get(p);
      if (amount > 0) return `<p>${p}: ${Math.ceil(amount * 100) / 100}</p>`;
    })
    .join("")}
  <h3>Total products needed</h3>
  ${Array.from(productsUsed.keys())
    .map((p) => {
      let amount = productsUsed.get(p) || -1;
      if (amount > -1) return `<p>${p}: ${Math.ceil(amount * 100) / 100}</p>`;
    })
    .join("")}
  <h3>Price breakdown</h3>
  ${Array.from(productsUnitCost.keys())
    .map((p) => {
      let cost = productsUnitCost.get(p);
      if (cost > 0) return `<p>${p}: ${cost}</p>`;
    })
    .join("")}
  `;

  function getCost(product) {
    var tmpCost = 0;

    links.forEach((link) => {
      if (link.target.id === product) {
        if (state.get(link.source.id) === "buy") {
          tmpCost +=
            (productsUnitCost.get(link.source.id) || 0) *
            (link.inputAmountTarget || 0);
        } else {
          tmpCost += getCost(link.source.id);
        }
      }
    });

    return Math.ceil(tmpCost * 100) / 100;
  }
}

async function updateRecipeTree() {
  if (!products.includes(document.getElementById("recipe-select").value))
    return;
  rootProduct = document.getElementById("recipe-select").value.trim();

  rootMult =
    Math.ceil(
      Number.parseFloat(
        document
          .getElementById("multiplier-input")
          .value.trim()
          .replace(",", ".")
      ) * 10
    ) / 10;

  if (!recipes || Object.keys(recipes).length === 0) await getRecipes();

  // Initialize state for products
  if (!previousProduct || previousProduct !== rootProduct) {
    state.clear();
    Object.values(products).forEach((product) => {
      state.set(product, "buy");
      if (product === rootProduct) state.set(product, "produce");
    });
  }

  productsAmounts.clear();
  productsUsed.clear();
  previousProduct = rootProduct;

  productsAmounts.set(
    rootProduct,
    (productsAmounts.get(rootProduct) || 0) +
      Math.ceil(
        recipes[recipeConfig.get(rootProduct)].outputs.find(
          (o) => o.product === rootProduct
        ).amount *
          rootMult *
          100
      ) /
        100
  );

  render(rootProduct);
  updateSummary();
}

async function init() {
  await getRecipes();
  getProducts();
  await getMarketPrices();

  populateConfig();

  document.getElementById("multiplier-input").value = 1;
  const select = document.getElementById("recipe-select");
  for (const product of products) {
    const option = document.createElement("option");
    option.value = product;
    option.text = upperCase(product);
    select.appendChild(option);
  }
}

window.onload = init;
