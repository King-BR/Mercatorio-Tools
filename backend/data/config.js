/*
 * Deploy transport POST "base_transport_url"
 * payload:
 * {
 *  autoset_inventory: true,
 *  location: { x: 0, y: 0 },
 *  name: "string",
 *  operation_target: "0",
 *  owner_id: "string",
 *  type: "string"
 * }
 *
 * Travel with transport POST "travel_url"
 * payload:
 * {
 *  end_town_id: ${townID}, // only included if there is a town on the destination tile
 *  location: { x: 2466, y: 878 }, // destination tile, limit around 130-140 steps, needs more testing/confirmation
 *  use_ferry: true, // only included if path used ferry, when used it needs to be a separate request with only the ferry tiles and no movement cost, path is [ferry boarding tile, ...ferry path, ferry unboarding tile]
 *  path: [
 *    { // starting tile
 *      x: 2467,
 *      y: 879
 *    },
 *    { // each step needs movement cost included (c), except the starting tile
 *      x: 2466,
 *      y: 878,
 *      c: 1.41421
 *    }
 *    // etc...
 *  ]
 * }
 */

const base_url = `${process.env.GAME_URL}/api`;
const base_transport_url = `${base_url}/transports`;
const base_building_url = `${base_url}/buildings`;

module.exports = {
  base_url: base_url,
  base_transport_url: base_transport_url,
  transport_url: `${base_transport_url}/{transportID}`,
  travel_url: `${base_transport_url}/{transportID}/travel`,
  player_url: `${base_url}/player`,

  base_building_url,
  building_url: `${base_building_url}/{buildingID}`,

  // transports, money and buildings list
  business_url: `${base_url}/businesses/{businessID}`,

  // recipes
  recipes_url: `${base_url}/config/recipes`,
};
