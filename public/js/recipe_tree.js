var recipes = {};
var outputList = {};
var inputList = {};
var previousRecipe = {};
var tree = {};

async function getRecipes() {
  try {
    const response = await fetch("/api/recipes");
    recipes = await response.json();

    recipes = Object.fromEntries(
      Object.entries(recipes).filter(([key, value]) => !value.bots_only)
    );

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

  outputList = {};
  inputList = {};
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

  if (!recipeKey || !recipes[recipeKey]) {
    document.getElementById(
      `tree-container-${product.replace(/\s+/g, "-")}-${index}-${selectId}`
    ).innerHTML = "";
    return;
  }

  const recipe = recipes[recipeKey];

  var mult = 1;

  if (parentRecipe) {
    const parentRecipeInputs = recipes[parentRecipe].inputs;
    const parentRecipeInput = parentRecipeInputs.find(
      (input) => input.product === product
    );

    parentRecipeInput.amount = parentRecipeInput.amount * parentMult;

    if (parentRecipeInput) {
      mult =
        parentRecipeInput.amount /
        recipe.outputs.find((output) => output.product === product).amount;

      mult = Math.round(10 * mult) / 10;

      while (
        parentRecipeInput.amount >
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
      recipe.outputs.forEach((out, i) => {
        tmpNode.outputs[i].amount =
          out.amount * mult < 0.1
            ? Math.round(100 * out.amount * mult) / 100
            : Math.round(10 * out.amount * mult) / 10;
      });
    }

    if (tmpNode.inputs) {
      recipe.inputs.forEach((inp, i) => {
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
    if (index === 0) {
      if (outputList[output.product]) {
        outputList[output.product] += output.amount;
      } else {
        outputList[output.product] = output.amount;
      }
    } else {
      if (inputList[output.product]) {
        inputList[output.product] -= output.amount;
      } else {
        outputList[output.product] = output.amount;
      }

      if (inputList[output.product] <= 0) {
        if (!outputList[output.product]) outputList[output.product] = 0;
        outputList[output.product] += inputList[output.product] * -1;
        delete inputList[output.product];
        if (outputList[output.product] <= 0) delete outputList[output.product];
      }
    }
  });

  tmpRecipe.inputs.forEach((input) => {
    if (index === 0) {
      if (inputList[input.product]) {
        inputList[input.product] += input.amount;
      } else {
        inputList[input.product] = input.amount;
      }
    } else {
      if (inputList[input.product]) {
        inputList[input.product] += input.amount;
      } else {
        inputList[input.product] = input.amount;
      }
    }
  });
}

function updateMaterialList() {
  var tmpRecipe = tree;
  var index = 0;

  outputList = {};
  inputList = {};

  handleRecipeChange(index, tmpRecipe);

  index++;
  if (tmpRecipe.nexNode && tmpRecipe.nexNode.length > 0) {
    tmpRecipe.nexNode.forEach((node) => {
      handleRecipeChange(index, node);
    });
  }

  for (const product in inputList) {
    inputList[product] = inputList[product];

    document.getElementById("input-list").innerHTML += `<li>${
      inputList[product] < 0.1
        ? Math.round(100 * inputList[product]) / 100
        : Math.round(10 * inputList[product]) / 10
    }x ${product}</li>`;
  }

  for (const product in outputList) {
    outputList[product] = outputList[product];

    document.getElementById("output-list").innerHTML += `<li>${
      outputList[product] < 0.1
        ? Math.round(100 * outputList[product]) / 100
        : Math.round(10 * outputList[product]) / 10
    }x ${product}</li>`;
  }
}

function toggleChildren(element) {
  const childrenList = element.nextElementSibling;
  if (childrenList) {
    childrenList.style.display =
      childrenList.style.display === "none" ? "block" : "none";
  }
}

window.onload = getRecipes;
