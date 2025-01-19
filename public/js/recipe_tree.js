var recipes = {};
var outputList = {};
var inputList = {};

async function getRecipes() {
  try {
    const response = await fetch("../api/recipes");
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

  const recipe = recipes[recipeKey];

  recipe.outputs.forEach((output) => {
    if (outputList[output.product]) {
      outputList[output.product] += Math.round(100 * output.amount * mult) / 100;
    } else {
      outputList[output.product] = Math.round(100 * output.amount * mult) / 100;
    }
  });

  recipe.inputs.forEach((input) => {
    if (inputList[input.product]) {
      inputList[input.product] += Math.round(100 * input.amount * mult) / 100;
    } else {
      inputList[input.product] = Math.round(100 * input.amount * mult) / 100;
    }
  });

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
                              recipe.outputs
                                ? recipe.outputs
                                    .map(
                                      (output) =>
                                        `<li>${
                                          Math.round(
                                            100 * output.amount * mult
                                          ) / 100
                                        }x ${output.product}</li>`
                                    )
                                    .join("")
                                : recipe.prestige * 100 * mult + " prestige"
                            }
                        </ul>
                    </li>
                    <li>
                        <span>Inputs</span>
                        <ul>
                            ${recipe.inputs
                              .map((input) =>
                                createInputNode(input, mult, recipeKey, 0)
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

  for (const product in inputList) {
    document.getElementById(
      "input-list"
    ).innerHTML += `<li>${inputList[product]}x ${product}</li>`;
  }

  for (const product in outputList) {
    document.getElementById(
      "output-list"
    ).innerHTML += `<li>${outputList[product]}x ${product}</li>`;
  }
}

function createInputNode(input, mult, parentRecipe, index) {
  index++;
  if (input.product == "labour") {
    return `<li>${Math.round(100 * input.amount * mult) / 100}x ${
      input.product
    }</li>`;
  }

  const possibleRecipes = findRecipesByProduct(input.product);

  if (possibleRecipes.length === 0) {
    return `<li>${Math.round(100 * input.amount * mult) / 100}x ${
      input.product
    }</li>`;
  }

  const selectId = `recipe-select-${input.product.replace(
    /\s+/g,
    "-"
  )}-${index}`;
  console.log(selectId);

  return `
    <li>
      ${Math.round(100 * input.amount * mult) / 100}x ${input.product}
      <select id="${selectId}" onchange="loadSubRecipe('${
    input.product
  }', this.value, '${selectId}', '${parentRecipe}', ${mult}, ${index})">
        <option value="">Select Recipe</option>
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
      )}-${index}"></div>
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
  if (!recipeKey || !recipes[recipeKey]) {
    document.getElementById(
      `tree-container-${product.replace(/\s+/g, "-")}-${index}`
    ).innerHTML = "";

    // if there is no recipe selected, include in the input list
    if (inputList[product]) {
      inputList[product] +=
        Math.round(
          100 *
            recipes[parentRecipe].inputs.find(
              (input) => input.product === product
            ).amount *
            parentMult
        ) / 100;
    }
    return;
  }

  const recipe = recipes[recipeKey];

  var mult = 1;

  if (parentRecipe) {
    const parentRecipeInputs = recipes[parentRecipe].inputs;
    const parentRecipeInput = parentRecipeInputs.find(
      (input) => input.product === product
    );

    if (parentRecipeInput) {
      mult =
        (parentRecipeInput.amount * parentMult) /
        recipe.outputs.find((output) => output.product === product).amount;

      mult = Math.round(10 * mult) / 10;

      while (
        parentRecipeInput.amount * parentMult >
        recipe.outputs.find((output) => output.product === product).amount *
          mult
      ) {
        mult += 0.1;
      }

      mult = Math.round(10 * mult) / 10;
    }
  }

  if (inputList[product]) {
    inputList[product] -=
      Math.round(
        100 *
          recipes[parentRecipe].inputs.find(
            (input) => input.product === product
          ).amount *
          parentMult
      ) / 100;
  }

  recipe.inputs.forEach((input) => {
    if (inputList[input.product]) {
      inputList[input.product] += Math.round(100 * input.amount * mult) / 100;
    } else {
      inputList[input.product] = Math.round(100 * input.amount * mult) / 100;
    }
  });

  let subTreeHtml = `
    <ul class="tree">
      <li>
        <span class="recipe" onclick="toggleChildren(this)">${mult}x ${
    recipe.name
  }</span>
        <ul>
          <li>
            <span>Outputs</span>
            <ul>
              ${recipe.outputs
                .map(
                  (output) =>
                    `<li>${Math.round(100 * output.amount * mult) / 100}x ${
                      output.product
                    }</li>`
                )
                .join("")}
            </ul>
          </li>
          <li>
            <span>Inputs</span>
            <ul>
              ${recipe.inputs
                .map((input) => createInputNode(input, mult, recipeKey, index))
                .join("")}
            </ul>
          </li>
        </ul>
      </li>
    </ul>`;

  document.getElementById(
    `tree-container-${product.replace(/\s+/g, "-")}-${index}`
  ).innerHTML = subTreeHtml;

  document.getElementById("input-list").innerHTML = "";
  document.getElementById("output-list").innerHTML = "";

  for (const product in inputList) {
    document.getElementById(
      "input-list"
    ).innerHTML += `<li>${inputList[product]}x ${product}</li>`;
  }

  for (const product in outputList) {
    document.getElementById(
      "output-list"
    ).innerHTML += `<li>${outputList[product]}x ${product}</li>`;
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
