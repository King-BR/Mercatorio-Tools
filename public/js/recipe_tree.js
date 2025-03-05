var width = document.documentElement.clientWidth;
var height = document.documentElement.clientHeight * 0.8;
var recipes = {};
var recipeConfig = new Map();
var products = [];
var materialList = new Map();

async function getRecipes() {
  const response = await fetch("/api/recipes");
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

function populateConfig() {
  const configDiv = document.getElementById("recipe-config-div");
  configDiv.innerHTML = "";

  recipeConfig.clear();

  for (let product of products) {
    recipeConfig.set(product, "market");

    const div = document.createElement("div");

    div.classList.add("config-item");

    const label = document.createElement("label");
    label.textContent = product;

    const productRecipes = findAllRecipesByProduct(product);
    const select = document.createElement("select");

    select.id = `${product}-recipe-select`;

    const marketOption = document.createElement("option");

    marketOption.value = "market";
    marketOption.text = "market";
    marketOption.selected = true;

    select.appendChild(marketOption);

    for (let recipe of productRecipes) {
      const option = document.createElement("option");
      option.value = recipe.name;
      option.text = recipe.name;

      select.appendChild(option);
    }

    select.onchange = (event) => {
      recipeConfig.set(product, event.target.value);
      loadTree();
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

function buildTreeData(
  recipeName,
  visited = new Set(),
  amount = 0,
  product,
  mult = 1
) {
  const recipe = recipes[recipeName];

  if (visited.has(recipeName))
    return {
      name: `${recipe.name} (${
        amount > 0
          ? `${
              Math.round(
                ((amount * mult) /
                  recipe.outputs.find((o) => o.product == product).amount) *
                  10
              ) / 10
            }x`
          : "1x"
      })`,
    };
  visited.add(recipeName);
  if (!recipe) {
    return { name: recipeName };
  }

  recipe.outputs.forEach((output) => {
    if (!materialList.has(output.product)) materialList.set(output.product, 0);

    let finalAmount = Math.round(output.amount * mult * 100) / 100;

    materialList.set(
      output.product,
      materialList.get(output.product) + finalAmount
    );
  });

  const inputs = recipe.inputs.map((input) => {
    const r = recipeConfig.get(input.product);

    if (!materialList.has(input.product)) materialList.set(input.product, 0);

    if (r && input.product !== "labour") {
      let finalAmount = Math.round(input.amount * mult * 100) / 100;

      materialList.set(
        input.product,
        materialList.get(input.product) + finalAmount * -1
      );

      return {
        name: `${input.product} (${finalAmount})`,
        children: [
          buildTreeData(r, new Set(visited), input.amount, input.product, mult),
        ],
      };
    } else {
      let finalAmount2 = Math.round(input.amount * mult * 100) / 100;
      let finalAmount =
        Math.round(
          input.amount *
            mult *
            (Math.round(
              (amount /
                recipe.outputs.find((o) => o.product == product).amount) *
                10
            ) /
              10) *
            100
        ) / 100;

      if (amount > 0) {
        materialList.set(
          input.product,
          materialList.get(input.product) + finalAmount * -1
        );
      } else {
        materialList.set(
          input.product,
          materialList.get(input.product) + finalAmount2 * -1
        );
      }

      return {
        name: `${input.product} (${amount > 0 ? finalAmount : finalAmount2})`,
      };
    }
  });

  return {
    name: `${recipe.name} (${
      amount > 0
        ? `${
            Math.round(
              ((amount * mult) /
                recipe.outputs.find((o) => o.product == product).amount) *
                10
            ) / 10
          }x`
        : "1x"
    })`,
    children: inputs,
  };
}

function loadTree() {
  const recipeName = document.getElementById("recipe-select").value;
  const mult = document.getElementById("production-mult").value;
  renderTree(recipeName, mult);
}

function renderTree(rName, prodMultiplier = 1) {
  const svgContainer = d3.select("#recipe-container");

  let svg = svgContainer.select("svg");
  let container;

  if (svg.empty()) {
    svg = svgContainer
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);
    container = svg.append("g");
    svg.node().__zoom = d3.zoomIdentity;
  } else {
    container = svg.select("g");
    container.selectAll("*").remove();
  }

  materialList.clear();

  const data = {
    name: recipes[rName].outputs
      .map((o) => {
        let finalAmount = Math.round(o.amount * prodMultiplier * 100) / 100;

        return `${o.product} (${finalAmount})`;
      })
      .join(" + "),
    children: [
      buildTreeData(
        rName,
        new Set(),
        recipes[rName].outputs[0].amount,
        recipes[rName].outputs[0].product,
        prodMultiplier
      ),
    ],
  };

  const root = d3.hierarchy(data);
  const maxDepth = d3.max(root.descendants(), (d) => d.depth);
  const nodeCount = root.descendants().length;

  const treeLayout = d3
    .tree()
    .size([width * 2, height * 2])
    .separation((a, b) => (a.parent === b.parent ? 1500 : 1000));

  treeLayout(root);

  const linksGroup = container.append("g").attr("class", "links");
  linksGroup
    .selectAll("line")
    .data(root.links())
    .enter()
    .append("line")
    .attr("x1", (d) => d.source.x - width / 2)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x - width / 2)
    .attr("y2", (d) => d.target.y)
    .style(
      "stroke",
      document.body.classList.contains("light-mode") ? "black" : "white"
    );

  const nodesGroup = container.append("g").attr("class", "nodes");
  nodesGroup
    .selectAll("circle")
    .data(root.descendants())
    .enter()
    .append("circle")
    .attr("cx", (d) => d.x - width / 2)
    .attr("cy", (d) => d.y)
    .attr("r", 10)
    .style(
      "fill",
      document.body.classList.contains("light-mode") ? "steelblue" : "steelblue"
    );

  const textGroup = nodesGroup
    .selectAll("g")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${d.x - width / 2}, ${d.y - 25})`);

  textGroup
    .append("rect")
    .attr(
      "fill",
      document.body.classList.contains("light-mode") ? "black" : "lightgray"
    )
    .attr("rx", 5)
    .attr("ry", 5)
    .style("opacity", 0.7);

  const text = textGroup
    .append("text")
    .text((d) => d.data.name)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style(
      "fill",
      document.body.classList.contains("light-mode") ? "white" : "green"
    )
    .style("font-size", "15px");

  text.each(function () {
    const bbox = this.getBBox();
    d3.select(this.previousSibling)
      .attr("x", bbox.x - 5)
      .attr("y", bbox.y - 2)
      .attr("width", bbox.width + 10)
      .attr("height", bbox.height + 4);
  });

  svg.call(d3.zoom().transform, svg.node().__zoom);

  updateMaterialList(rName);
}

function updateMaterialList(rName) {
  const labourPerProductDiv = document.getElementById("labour-per-product");
  labourPerProductDiv.innerHTML = "";

  const recipe = recipes[rName];

  labourPerProductDiv.textContent = `Labour per ${recipe.outputs[0].product}: ${
    Math.abs(materialList.get("labour") / materialList.get(recipe.outputs[0].product))
  }`;

  const tableBody = document.getElementById("material-list-body");
  tableBody.innerHTML = "";

  materialList.forEach((amount, material) => {
    const row = document.createElement("tr");

    const materialCell = document.createElement("td");
    materialCell.textContent = material;

    const amountCell = document.createElement("td");
    amountCell.textContent = amount.toFixed(2);

    row.appendChild(materialCell);
    row.appendChild(amountCell);
    tableBody.appendChild(row);
  });
}

async function init() {
  await getRecipes();
  getProducts();

  populateConfig();

  const select = document.getElementById("recipe-select");
  for (let recipe in recipes) {
    const option = document.createElement("option");
    option.value = recipe;
    option.text = recipes[recipe].name;

    if (recipe === Object.keys(recipes)[0]) option.selected = true;

    select.appendChild(option);
  }

  loadTree();
}

window.onload = init;
