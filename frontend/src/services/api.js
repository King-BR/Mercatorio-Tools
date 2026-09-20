import { getPlayerBuildingDetails } from "./cache/buildings";

export async function getRecipes() {
  const response = await fetch("/api/recipes");
  return response.json();
}

export async function getProducts() {
  const response = await fetch("/api/products");
  return response.json();
}

export async function getBuildings() {
  const response = await fetch("/api/buildings");
  return await response.json();
}

export async function getTools() {
  const response = await fetch("/api/tools");
  return await response.json();
}

export async function getToolsCategories() {
  const response = await fetch("/api/tools/categories");
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

export async function getTowns() {
  const response = await fetch("/api/towns/all");
  return await response.json();
}

export async function getTownById(townId) {
  const response = await fetch(`/api/towns/id/${townId}`);
  return await response.json();
}

export async function getTownByName(townName) {
  const response = await fetch(`/api/towns/name/${townName}`);
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

export async function getPlayer() {
  const response = await fetch("/api/players/me");
  return await response.json();
}

export async function getPlayerInventory() {
  const response = await fetch("/api/players/me/inventory");
  return await response.json();
}

export async function getPlayerBuildings({
  id = null,
  all = false,
  force = false,
} = {}) {
  return await getPlayerBuildingDetails({ id, all, force });
}
