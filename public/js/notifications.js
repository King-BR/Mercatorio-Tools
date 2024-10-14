document
  .getElementById("notification-type")
  .addEventListener("change", async function () {
    const type = this.value;
    const dataDiv = document.getElementById("notification-data");

    switch (type) {
      case "price": {
        // fetch products from api /api/products
        const productsResponse = await fetch("/api/products");
        var products = await productsResponse.json();

        var productOptions = products.map(
          (product) => `<option value="${product.id}">${product.name}</option>`
        );

        dataDiv.innerHTML = `
          <div class="w3-col">
            <label for="product" class="w3-row">Product</label>
            <select name="product" id="product" class="w3-select w3-round w3-row" required>
              <option value="" selected disabled>Select Product</option>
              ${productOptions.join("")}
            </select>
          </div>
          <div class="w3-col">
            <label for="comparison" class="w3-row">Comparison</label>
            <select name="comparison" id="comparison" class="w3-select w3-round w3-row" required>
              <option value="" selected disabled>Select Comparison</option>
              <option value="greater-equal">Greater or Equal</option>
              <option value="less-equal">Less or Equal</option>
            </select>
          </div>
          <div class="w3-col">
            <label for="price" class="w3-row">Price</label>
            <input type="number" name="price" id="price" step="0.01" min="0.01" class="w3-input w3-round w3-row" required />
          </div>
        `;
        break;
      }
      case "storage": {
        dataDiv.innerHTML = `
          <div class="w3-col">
            <label for="product" class="w3-row">Product</label>
            <select name="product" id="product" class="w3-select w3-round w3-row" required>
              <option value="" selected disabled>Select Product</option>
              ${productOptions.join("")}
            </select>
          </div>
          <div class="w3-col">
            <label for="comparison" class="w3-row">Comparison</label>
            <select name="comparison" id="comparison" class="w3-select w3-round w3-row" required>
              <option value="" selected disabled>Select Comparison</option>
              <option value="greater-equal">Greater or Equal</option>
              <option value="less-equal">Less or Equal</option>
            </select>
          </div>
          <div class="w3-col">
            <label for="amount" class="w3-row">Amount</label>
            <input type="number" name="amount" id="amount" step="1" min="0" class="w3-input w3-round w3-row" required />
          </div>
        `;
        break;
      }
      default: {
        break;
      }
    }
  });

function createNotification() {
  const type = document.getElementById("notification-type").value;
  const data = {};

  switch (type) {
    case "price": {
      data.product_id = document.getElementById("product").value;
      data.comparison = document.getElementById("comparison").value;
      data.price = document.getElementById("price").value;
      break;
    }
    default: {
      break;
    }
  }

  const userId = localStorage.getItem("userId");

  // POST /api/notifications/:id/add
  fetch(`/api/notifications/${userId}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, ...data }),
  })
    .then((response) => {
      if (response.ok) {
        alert("Notification created successfully");
      } else {
        alert("Error creating notification");
      }
    })
    .catch((error) => {
      console.error(error);
      alert("Error creating notification");
    });
}
