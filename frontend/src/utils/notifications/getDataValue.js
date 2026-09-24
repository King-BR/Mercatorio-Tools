import { getMarketData, getPlayerInventory } from "../../services/api";

export default function getDataValue(nodeData) {
  if (!nodeData) {
    return 0;
  }

  // console.log("Node data:", nodeData);

  switch (nodeData?.type) {
    case "value":
      return nodeData?.data?.value;
    case "field":
    /*
      console.log("Field node data:", nodeData);

      if (
        nodeData?.data?.field?.fieldType === "number" &&
        nodeData?.data?.field?.reference?.entityType === "town" &&
        nodeData?.data?.field?.path.includes("market")
      ) {
        var finalValue = 0;

        getMarketData().then((towns) => {
          const town = towns.find(
            (t) => t.name === nodeData?.data?.field?.reference?.townName,
          );

          console.log("Town data:", town);

          const productName = nodeData?.data?.field?.reference?.productName;

          console.log("Product name:", productName);

          const productMarket = town?.markets?.[productName];

          console.log("Product market:", productMarket);

          const value =
            productMarket?.[
              nodeData?.data?.field?.path?.[
                nodeData?.data?.field?.path?.length - 1
              ]
            ];

          console.log("Product market value:", value);

          finalValue = Number.parseFloat(value);

          return finalValue;
        });
        return finalValue;
      }
      */
    default:
      return nodeData?.data?.value ?? nodeData?.data?.fieldText ?? 0;
  }
}
