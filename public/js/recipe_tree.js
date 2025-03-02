var width = document.documentElement.clientWidth;
var height = document.documentElement.clientHeight * 0.8;
var recipes = {};

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
      if (recipes[recipe].prestige) {
        recipes[recipe].outputs = [
          {
            product: "prestige",
            amount: recipes[recipe].prestige,
          },
        ];
      } else {
        recipes[recipe].outputs = [];
      }
    }
  }
}

function findRecipeByProduct(product) {
  return Object.values(recipes).find((recipe) => {
    return recipe.outputs.some((output) => output.product === product);
  });
}

function buildTreeData(recipeName, visited = new Set()) {
  if (visited.has(recipeName)) return { name: recipeName }; // Evita dependência circular
  visited.add(recipeName);

  const recipe = recipes[recipeName];
  if (!recipe) return { name: recipeName }; // Se não for uma receita válida, apenas retorna o nome

  const inputs = recipe.inputs.map((input) => {
    const r = findRecipeByProduct(input.product);
    if (r) {
      return {
        name: `${input.product} (${input.amount})`,
        children: [buildTreeData(r.name, new Set(visited))],
      }; // Se for uma receita, chama recursivamente
    } else {
      return { name: `${input.product} (${input.amount})` }; // Caso contrário, apenas mostra o produto simples
    }
  });

  return {
    name: recipe.name,
    children: inputs,
  };
}

function updateSize() {
  width = document.documentElement.clientWidth;
  height = document.documentElement.clientHeight * 0.8;
  d3.select("svg").attr("width", width).attr("height", height);
}

async function init() {
  await getRecipes();

  const rName = recipes[Object.keys(recipes)[0]].name;
  const data = {
    name: `${recipes[rName].outputs[0].product} (${recipes[rName].outputs[0].amount})`,
    children: [buildTreeData(rName)],
  };

  const svg = d3
    .select("#recipe-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 4})`);

  const treeLayout = d3.tree().size([width - 200, height - 200]);
  const root = d3.hierarchy(data);
  treeLayout(root);

  const linksGroup = svg.append("g").attr("class", "links");
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

  const nodesGroup = svg.append("g").attr("class", "nodes");
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

  nodesGroup
    .selectAll("text")
    .data(root.descendants())
    .enter()
    .append("text")
    .attr("x", (d) => d.x - width / 2)
    .attr("y", (d) => d.y - 15)
    .attr("text-anchor", "middle")
    .style(
      "fill",
      document.body.classList.contains("light-mode") ? "green" : "green"
    )
    .text((d) => d.data.name);
}

window.addEventListener("resize", updateSize);
window.onload = init;
