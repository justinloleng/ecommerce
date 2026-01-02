// Products Management JavaScript
let currentProducts = [];

async function uploadProductImage(productId, file) {
  try {
    const formData = new FormData();
    formData.append("image_file", file);

    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}/upload-image`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload image");
    }

    return data.image_url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

async function loadProducts() {
  try {
    // Show loading state
    const tbody = document.getElementById("productsTableBody");
    tbody.innerHTML = `
      <tr><td colspan="7" class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading products...</p>
      </td></tr>
    `;

    const response = await fetch(`${API_BASE_URL}/products?per_page=100`);

    if (!response.ok) {
      throw new Error("Failed to load products");
    }

    const data = await response.json();
    currentProducts = data.products;
    displayProducts(currentProducts);
  } catch (error) {
    console.error("Error loading products:", error);
    document.getElementById("productsTableBody").innerHTML = `
      <tr><td colspan="7" class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load products</p>
      </td></tr>
    `;
  }
}

function displayProducts(products) {
  const tbody = document.getElementById("productsTableBody");

  if (!products || products.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No products found</p>
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = products
    .map(
      (product) => `
    <tr>
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td>${product.category_name || "N/A"}</td>
      <td>$${product.price.toFixed(2)}</td>
      <td>${product.stock_quantity}</td>
      <td>${
        product.is_active
          ? '<span class="badge badge-delivered">Active</span>'
          : '<span class="badge badge-cancelled">Inactive</span>'
      }</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="editProduct(${
          product.id
        })">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${
          product.id
        })">
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `
    )
    .join("");
}

function showProductModal(productId = null) {
  document.getElementById("productModalTitle").textContent = productId
    ? "Edit Product"
    : "Add Product";
  document.getElementById("productId").value = productId || "";

  if (productId) {
    const product = currentProducts.find((p) => p.id === productId);
    if (product) {
      document.getElementById("productName").value = product.name;
      document.getElementById("productDescription").value =
        product.description;
      document.getElementById("productCategory").value =
        product.category_id;
      document.getElementById("productPrice").value = product.price;
      document.getElementById("productStock").value =
        product.stock_quantity;
      document.getElementById("productImage").value =
        product.image_url || "";
    }
  } else {
    document.getElementById("productForm").reset();
  }

  // Clear the file input
  document.getElementById("productImageFile").value = "";

  loadCategoriesForDropdown();
  document.getElementById("productModal").classList.add("active");
}

async function loadCategoriesForDropdown() {
  try {
    const response = await fetch(`${API_BASE_URL}/products/categories`);
    const categories = await response.json();

    const select = document.getElementById("productCategory");
    select.innerHTML =
      '<option value="">Select category...</option>' +
      categories
        .map((cat) => `<option value="${cat.id}">${cat.name}</option>`)
        .join("");
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

function editProduct(productId) {
  showProductModal(productId);
}

document
  .getElementById("productForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const productId = document.getElementById("productId").value;

    // Validate file size if a file is selected (max 16MB)
    const imageFile =
      document.getElementById("productImageFile").files[0];
    if (imageFile) {
      const maxSize = 16 * 1024 * 1024; // 16MB in bytes
      if (imageFile.size > maxSize) {
        showToast("Image file size must be less than 16MB", "error");
        return;
      }
    }

    const productData = {
      name: document.getElementById("productName").value,
      description: document.getElementById("productDescription").value,
      category_id: parseInt(
        document.getElementById("productCategory").value
      ),
      price: parseFloat(document.getElementById("productPrice").value),
      stock_quantity: parseInt(
        document.getElementById("productStock").value
      ),
      image_url: document.getElementById("productImage").value,
    };

    try {
      const url = productId
        ? `${API_BASE_URL}/admin/products/${productId}`
        : `${API_BASE_URL}/admin/products`;

      const response = await fetch(url, {
        method: productId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      const savedProduct = await response.json();
      const savedProductId = savedProduct.product_id || productId;

      let uploadSucceeded = true;
      // Check if a file was selected for upload
      if (imageFile && savedProductId) {
        try {
          showToast("Uploading image...", "info");
          const imageUrl = await uploadProductImage(
            savedProductId,
            imageFile
          );
          showToast("Image uploaded successfully", "success");
        } catch (uploadError) {
          uploadSucceeded = false;
          console.error("Error uploading image:", uploadError);
          showToast(
            "Product saved but image upload failed: " +
              uploadError.message,
            "error"
          );
        }
      }

      // Only show product save success if image upload also succeeded (or no image was uploaded)
      if (uploadSucceeded) {
        showToast(
          productId
            ? "Product updated successfully"
            : "Product created successfully",
          "success"
        );
      }
      closeModal("productModal");
      loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("Failed to save product", "error");
    }
  });

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete product");
    }

    showToast("Product deleted successfully", "success");
    loadProducts();
  } catch (error) {
    console.error("Error deleting product:", error);
    showToast("Failed to delete product", "error");
  }
}
