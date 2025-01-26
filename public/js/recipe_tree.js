var recipes = {};
var materialsList = {};
var previousRecipe = {};
var productRecipe = {};
var tree = {};

async function init() {
  try {
    await getRecipes();

    const select = document.getElementById("recipe-select");
    select.innerHTML = "";

    for (const recipeKey in recipes) {
      const option = document.createElement("option");
      option.value = recipeKey;
      option.textContent = recipes[recipeKey].name;
      select.appendChild(option);
    }

    loadRecipe();
  } catch (error) {
    console.error("Error on loading recipes:", error);
  }
}

async function getRecipes() {
  const response = await fetch("/api/recipes");
  recipes = await response.json();

  recipes = Object.fromEntries(
    Object.entries(recipes).filter(([key, value]) => !value.bots_only)
  );
}

function loadRecipe() {
  const select = document.getElementById("recipe-select");
  const input_mult = document.getElementById("production-multiplier");
  const recipeKey = select.value;
  const mult = input_mult.value;

  if (!recipeKey || !recipes[recipeKey]) {
    document.getElementById("tree-container").innerHTML =
      "<p>Select a recipe.</p>";
    return;
  }

  materialsList = {};
  previousRecipe = {};
  tree = {};

  const recipe = recipes[recipeKey];

  tree.name = recipeKey;
  tree.outputs = recipe.outputs
    ? recipe.outputs.map((output) => ({
        ...output,
        amount:
          output.amount * mult < 0.1
            ? Math.round(100 * output.amount * mult) / 100
            : Math.round(10 * output.amount * mult) / 10,
      }))
    : [{ product: "prestige", amount: recipe.prestige * 100 * mult }];
  tree.inputs = recipe.inputs
    ? recipe.inputs.map((input) => ({
        ...input,
        amount:
          input.amount * mult < 0.1
            ? Math.round(100 * input.amount * mult) / 100
            : Math.round(10 * input.amount * mult) / 10,
      }))
    : [];

  let treeHtml = `
        <ul class="tree">
            <li>
                <span class="recipe" onclick="toggleChildren(this)">${
                  recipe.name
                }</span>
                <ul>
                    <li>
                        <span>Outputs</span>
                        <ul>
                            ${
                              tree.outputs
                                ? tree.outputs
                                    .map(
                                      (output) =>
                                        `<li>${output.amount}x ${output.product}</li>`
                                    )
                                    .join("")
                                : recipe.prestige * 100 * mult + " prestige"
                            }
                        </ul>
                    </li>
                    <li>
                        <span>Inputs</span>
                        <ul>
                            ${tree.inputs
                              .map((input) =>
                                createInputNode(input, mult, tree, 0)
                              )
                              .join("")}
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>`;

  document.getElementById("tree-container").innerHTML = treeHtml;

  document.getElementById("input-list").innerHTML = "";
  document.getElementById("output-list").innerHTML = "";

  updateMaterialList();
}

function createInputNode(input, mult, parentRecipe, index) {
  index++;
  if (input.product == "labour") {
    return `<li>${input.amount}x ${input.product}</li>`;
  }

  const possibleRecipes = findRecipesByProduct(input.product);

  if (possibleRecipes.length === 0) {
    return `<li>${input.amount}x ${input.product}</li>`;
  }

  const selectId = `recipe-select-${input.product.replace(
    /\s+/g,
    "-"
  )}-${index}`;

  return `
    <li>
      ${input.amount}x ${input.product}
      <select id="${selectId}" onchange="loadSubRecipe('${
    input.product
  }', this.value, '${selectId}', '${parentRecipe.name}', ${mult}, ${index})">
        <option value="empty">Select Recipe</option>
        ${possibleRecipes
          .map(
            (recipeKey) =>
              `<option value="${recipeKey}">${recipes[recipeKey].name}</option>`
          )
          .join("")}
      </select>
      <div id="tree-container-${input.product.replace(
        /\s+/g,
        "-"
      )}-${index}-${selectId}"></div>
    </li>`;
}

function findRecipesByProduct(product) {
  return Object.keys(recipes).filter(
    (recipeKey) =>
      recipes[recipeKey].outputs &&
      recipes[recipeKey].outputs.length > 0 &&
      recipes[recipeKey].outputs.some((output) => output.product === product)
  );
}

function loadSubRecipe(
  product,
  recipeKey,
  selectId,
  parentRecipe,
  parentMult,
  index
) {
  if (
    !previousRecipe.hasOwnProperty(
      `tree-container-${product.replace(/\s+/g, "-")}-${index}-${selectId}`
    )
  ) {
    previousRecipe[
      `tree-container-${product.replace(/\s+/g, "-")}-${index}-${selectId}`
    ] = recipeKey;
  } else if (
    previousRecipe[
      `tree-container-${product.replace(/\s+/g, "-")}-${index}-${selectId}`
    ] !== recipeKey
  ) {
    tree.nexNode = tree.nexNode || [];

    tree.nexNode.find((node, i) => {
      if (
        node.name ===
        previousRecipe[
          `tree-container-${product.replace(/\s+/g, "-")}-${index}-${selectId}`
        ]
      ) {
        tree.nexNode.splice(i, 1);
      }
    });

    previousRecipe[
      `tree-container-${product.replace(/\s+/g, "-")}-${index}-${selectId}`
    ] = recipeKey;
  }

  if (!recipeKey || (!recipes[recipeKey] && recipeKey !== "empty")) {
    document.getElementById(
      `tree-container-${product.replace(/\s+/g, "-")}-${index}-${selectId}`
    ).innerHTML = "";
    return;
  }

  const recipe =
    recipeKey === "empty"
      ? { name: "null", inputs: [], outputs: [] }
      : recipes[recipeKey];

  var mult = 1;

  if (parentRecipe) {
    var parentRecipeInputs = recipes[parentRecipe].inputs;
    var parentRecipeInput = parentRecipeInputs.find(
      (input) => input.product === product
    );
    var parentRecipeInputAmount =
      parentRecipeInput.amount * parentMult < 0.1
        ? Math.round(100 * parentRecipeInput.amount * parentMult) / 100
        : Math.round(10 * parentRecipeInput.amount * parentMult) / 10;

    if (parentRecipeInput && recipe.outputs.length > 0) {
      mult =
        parentRecipeInputAmount /
        recipe.outputs.find((output) => output.product === product).amount;

      console.log(
        mult +
          " | " +
          parentRecipeInputAmount +
          " | " +
          recipe.outputs.find((output) => output.product === product).amount
      );

      mult = Math.round(10 * mult) / 10;

      while (
        parentRecipeInputAmount >
        recipe.outputs.find((output) => output.product === product).amount *
          mult
      ) {
        mult += 0.1;
      }

      mult = Math.round(10 * mult) / 10;
    }

    tree.nexNode = tree.nexNode || [];
    var tmpNode = {};
    tmpNode.name = recipeKey;
    tmpNode.outputs = recipe.outputs;
    tmpNode.inputs = recipe.inputs;

    if (tmpNode.outputs) {
      tmpNode.outputs.forEach((out, i) => {
        tmpNode.outputs[i].amount =
          out.amount * mult < 0.1
            ? Math.round(100 * out.amount * mult) / 100
            : Math.round(10 * out.amount * mult) / 10;
      });
    }

    if (tmpNode.inputs) {
      tmpNode.inputs.forEach((inp, i) => {
        tmpNode.inputs[i].amount =
          inp.amount * mult < 0.1
            ? Math.round(100 * inp.amount * mult) / 100
            : Math.round(10 * inp.amount * mult) / 10;
      });
    }
  }

  let subTreeHtml = `
    <ul class="tree">
      <li>
        <span class="recipe" onclick="toggleChildren(this)">${
          Math.round(mult * 10) / 10
        }x ${tmpNode.name}</span>
        <ul>
          <li>
            <span>Outputs</span>
            <ul>
              ${tmpNode.outputs
                .map((output) => `<li>${output.amount}x ${output.product}</li>`)
                .join("")}
            </ul>
          </li>
          <li>
            <span>Inputs</span>
            <ul>
              ${tmpNode.inputs
                .map((input) => createInputNode(input, mult, tmpNode, index))
                .join("")}
            </ul>
          </li>
        </ul>
      </li>
    </ul>`;

  if (recipeKey === "empty") subTreeHtml = "";

  document.getElementById(
    `tree-container-${product.replace(/\s+/g, "-")}-${index}-${selectId}`
  ).innerHTML = subTreeHtml;

  tree.nexNode.push(tmpNode);

  document.getElementById("input-list").innerHTML = "";
  document.getElementById("output-list").innerHTML = "";

  updateMaterialList();

  previousRecipe[
    `tree-container-${product.replace(/\s+/g, "-")}-${index}-${selectId}`
  ] = recipeKey;
}

function handleRecipeChange(index, tmpRecipe) {
  tmpRecipe.outputs.forEach((output) => {
    if (materialsList[output.product]) {
      materialsList[output.product] += output.amount;
    } else {
      materialsList[output.product] = output.amount;
    }
  });

  tmpRecipe.inputs.forEach((input) => {
    if (materialsList[input.product]) {
      materialsList[input.product] -= input.amount;
    } else {
      materialsList[input.product] = input.amount * -1;
    }
  });
}

function updateMaterialList() {
  var tmpRecipe = tree;
  var index = 0;

  materialsList = {};

  handleRecipeChange(index, tmpRecipe);

  index++;
  if (tmpRecipe.nexNode && tmpRecipe.nexNode.length > 0) {
    tmpRecipe.nexNode.forEach((node) => {
      handleRecipeChange(index, node);
    });
  }

  for (const key in materialsList) {
    materialsList[key] =
      materialsList[key] <= 0.1
        ? Math.round(100 * materialsList[key]) / 100
        : Math.round(10 * materialsList[key]) / 10;

    if (materialsList[key] > 0) {
      document.getElementById("output-list").innerHTML += `
        <li>${materialsList[key]}x ${key}</li>`;
    } else if (materialsList[key] < 0) {
      document.getElementById("input-list").innerHTML += `
        <li>${materialsList[key] * -1}x ${key}</li>`;
    }
  }
}

function toggleChildren(element) {
  const childrenList = element.nextElementSibling;
  if (childrenList) {
    childrenList.style.display =
      childrenList.style.display === "none" ? "block" : "none";
  }
}

window.onload = init;
