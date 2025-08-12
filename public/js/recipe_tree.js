var previousProduct = null;
var rootProduct = null;
var recipes = {};
var products = [];
var recipeConfig = new Map();
const state = new Map();
const tiers = ["Novice", "Worker", "Journeyman", "Master"];

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

function populateConfig() {
  const configDiv = document.getElementById("recipe-config-div");
  configDiv.innerHTML = "";

  recipeConfig.clear();

  for (let product of products) {
    const div = document.createElement("div");

    div.classList.add("config-item");

    const label = document.createElement("label");
    label.textContent = product;

    const productRecipes = findAllRecipesByProduct(product);
    const select = document.createElement("select");

    recipeConfig.set(product, productRecipes[0].name);

    select.id = `${product}-recipe-select`;

    for (let recipe of productRecipes) {
      const option = document.createElement("option");
      option.value = recipe.name;
      option.text = recipe.name;

      select.appendChild(option);
    }

    select.onchange = (event) => {
      recipeConfig.set(product, event.target.value);
      updateRecipeTree();
    };

    div.appendChild(label);
    div.appendChild(select);

    configDiv.appendChild(div);
  }
}

function openConfig() {
  document.getElementById("recipe-config-popup").style.display = "flex";
}

function closeConfig() {
  document.getElementById("recipe-config-popup").style.display = "none";
}

function buildGraph(rootName) {
  const nodes = new Map();
  const links = [];
  var visited = new Set();

  function ensureNode(name, amount = 0) {
    if (!nodes.has(name)) {
      let r = recipes[recipeConfig.get(name)];

      const baseLabel = `${amount ? amount + "x " : ""}${
        name[0].toUpperCase() + name.slice(1)
      }`;
      const extraLabel =
        state.get(name) === "buy"
          ? ""
          : `\n${r.building
              .split(" ")
              .map((word) => word[0].toUpperCase() + word.slice(1))
              .join(" ")}\n${tiers[r.tier - 1]}${
              r.class ? `\n${r.class[0].toUpperCase() + r.class.slice(1)}` : ""
            }`;

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
    ensureNode(productName, amountRequired);
    //if (parent) links.push({ source: productName, target: parent });

    if (productName === "labour") return;
    if (visited.has(productName)) return;
    visited.add(productName);

    const recipeName = recipeConfig.get(productName);
    if (!recipeName) {
      console.log(`Sem receita configurada para ${productName}`);
      return;
    }

    const r = recipes[recipeName];
    if (!r || !r.inputs) {
      console.log(`Receita ${recipeName} não tem inputs para ${productName}`);
      return;
    }

    if (state.get(productName) === "buy") return; // stop expansion if set to buy

    // get the mult for the amount required
    let mult =
      amountRequired / r.outputs.find((o) => o.product === productName).amount;

    mult = Math.round(mult * 10) / 10;

    for (const inp of r.inputs) {
      links.push({
        source: inp.product,
        target: productName,
        inputAmount: inp.amount,
      });

      expand(inp.product, inp.amount * mult, productName, depth + 1);
    }
  }

  expand(rootName);
  return { nodes: Array.from(nodes.values()), links };
}

function render(root) {
  g.selectAll("*").remove();
  const { nodes, links } = buildGraph(root);

  // Define arrow head
  svg
    .append("defs")
    .append("marker")
    .attr("id", "arrowhead")
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

  // Force simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(200)
        .strength(0.05)
    )
    .force("charge", d3.forceManyBody().strength(-600))
    .force("center", d3.forceCenter(window.innerWidth / 2 - 160, height / 2));

  // Links
  const link = g
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "edge")
    .attr("marker-end", "url(#arrowhead)");

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
    .attr("fill", "#F6FF00")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text((d) => `${d.inputAmount}`);

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
      updateSummary(root);
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
    });

  // Text labels
  const text = node
    .append("text")
    .attr("text-anchor", "middle")
    .each(function (d) {
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

// TODO: summary calculation
function updateSummary(root) {
  const required = new Map(); // product -> totalAmount
  const costBreakdown = { material: 0, labour: 0, unknown: 0 };

  // compute material cost for required map
  let materialCost = 0;
  const requiredList = [];

  costBreakdown.material = materialCost;

  // render summary
  const div = document.getElementById("summary");
  div.innerHTML = `<p><small>Green nodes are products being bought from the market, red nodes are being produced — click on it to toggle</small></p>
  

  `;
}

async function updateRecipeTree() {
  rootProduct = document.getElementById("recipe-select").value.trim();
  if (!recipes || Object.keys(recipes).length === 0) await getRecipes();

  // Initialize state for products
  if (!previousProduct || previousProduct !== rootProduct) {
    Object.values(products).forEach((product) => {
      state.set(product, "buy");
      if (product === rootProduct) state.set(product, "produce");
    });
  }

  previousProduct = rootProduct;

  render(rootProduct);
  updateSummary(rootProduct);
}

async function init() {
  await getRecipes();
  getProducts();

  populateConfig();

  const select = document.getElementById("recipe-select");
  for (const product of products) {
    const option = document.createElement("option");
    option.value = product; // aqui é nome do produto
    option.text = product;
    select.appendChild(option);
  }
}

window.onload = init;
