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
