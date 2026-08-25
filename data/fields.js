const stringOperators = [
  "==",
  "!=",
  "contains",
  "not contains",
  "starts with",
  "ends with",
];

const numberOperators = [
  "<",
  "<=",
  "==",
  ">=",
  ">",
  "!=",
  "in range",
  "not in range",
  "changed",
  "increased",
  "decreased",
  "increased by",
  "decreased by",
  "increased %",
  "decreased %",
];

const arrayOperators = ["contains", "not contains", "starts with", "ends with"];

// merge all operators into a single array without duplicates
const operators = [
  ...new Set([...stringOperators, ...numberOperators, ...arrayOperators]),
];

module.exports = {
  operators: {
    string: stringOperators,
    number: numberOperators,
    array: arrayOperators,
    all: operators,
  },
  fields: {
    town_X: {
      market: {
        product_X: {
          name: {
            type: "string",
            operators: stringOperators,
          },
          open_price: {
            type: "number",
            operators: numberOperators,
          },
          last_price: {
            type: "number",
            operators: numberOperators,
          },
          average_price: {
            type: "number",
            operators: numberOperators,
          },
          moving_average_price: {
            type: "number",
            operators: numberOperators,
          },
          highest_bid: {
            type: "number",
            operators: numberOperators,
          },
          lowest_ask: {
            type: "number",
            operators: numberOperators,
          },
          high_price: {
            type: "number",
            operators: numberOperators,
          },
          low_price: {
            type: "number",
            operators: numberOperators,
          },
          volume: {
            type: "number",
            operators: numberOperators,
          },
          volume_12: {
            type: "number",
            operators: numberOperators,
          },
          bid_volume_10: {
            type: "number",
            operators: numberOperators,
          },
          ask_volume_10: {
            type: "number",
            operators: numberOperators,
          },
        },
      },
    },
    inventory: {
      product_X: {
        name: {
          type: "string",
          operators: stringOperators,
        },
        stock: {
          type: "number",
          operators: numberOperators,
        },
        reserved: {
          type: "number",
          operators: numberOperators,
        },
        available: {
          type: "number",
          operators: numberOperators,
        },
        unit_cost: {
          type: "number",
          operators: numberOperators,
        },
        produced: {
          type: "number",
          operators: numberOperators,
        },
        bought: {
          type: "number",
          operators: numberOperators,
        },
        buy_price: {
          type: "number",
          operators: numberOperators,
        },
        sold: {
          type: "number",
          operators: numberOperators,
        },
        sell_price: {
          type: "number",
          operators: numberOperators,
        },
        exported: {
          type: "number",
          operators: numberOperators,
        },
        export_price: {
          type: "number",
          operators: numberOperators,
        },
        imported: {
          type: "number",
          operators: numberOperators,
        },
        import_price: {
          type: "number",
          operators: numberOperators,
        },
        expired: {
          type: "number",
          operators: numberOperators,
        },
        expired_value: {
          type: "number",
          operators: numberOperators,
        },
      },
    },
    building_X: {
      name: {
        type: "string",
        operators: stringOperators,
      },
      buildingType: {
        type: "string",
        operators: stringOperators,
      },
      upgrades: {
        type: "string[]",
        operators: arrayOperators,
      },
      productionTarget: {
        type: "number",
        operators: numberOperators,
      },
      actualProduction: {
        type: "number",
        operators: numberOperators,
      },
      recipe: {
        name: {
          type: "string",
          operators: stringOperators,
        },
        inputs: {
          type: "string[]",
          operators: arrayOperators,
        },
        outputs: {
          type: "string[]",
          operators: arrayOperators,
        },
      },
    },
  },
};
