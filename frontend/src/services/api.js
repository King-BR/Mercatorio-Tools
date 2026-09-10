export async function getRecipes() {
  const response = await fetch("/api/recipes");
  return response.json();
}

export async function getProducts() {
  const response = await fetch("/api/products");
  return response.json();
}

export async function getTools() {
  const response = await fetch("/api/tools");
  return await response.json();
}

export async function getPrestigeBoard() {
  const response = await fetch("/api/prestige/board");
  return await response.json();
}

export async function getPrestigeSustenance() {
  const response = await fetch("/api/prestige/sustenance");
  return await response.json();
}

export async function getMarketData(town = "all") {
  if (town == "all") {
    const response = await fetch("/api/markets/all");
    return await response.json();
  }

  const response = await fetch(`/api/markets/town/${town}`);
  return await response.json();
}
