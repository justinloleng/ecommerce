// Categories Management JavaScript
let currentCategories = [];

async function loadCategories() {
  try {
    // Show loading state
    const tbody = document.getElementById("categoriesTableBody");
    tbody.innerHTML = `
      <tr><td colspan="5" class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading categories...</p>
      </td></tr>
    `;

    const response = await fetch(`${API_BASE_URL}/products/categories`);

    if (!response.ok) {
      throw new Error("Failed to load categories");
    }

    currentCategories = await response.json();

    // Get product counts for each category
    const productsResponse = await fetch(
      `${API_BASE_URL}/products?per_page=1000`
    );
    const productsData = await productsResponse.json();

    currentCategories.forEach((cat) => {
      cat.product_count = productsData.products.filter(
        (p) => p.category_id === cat.id
      ).length;
    });

    displayCategories(currentCategories);
  } catch (error) {
    console.error("Error loading categories:", error);
    document.getElementById("categoriesTableBody").innerHTML = `
      <tr><td colspan="5" class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Failed to load categories</p>
      </td></tr>
    `;
  }
}

function displayCategories(categories) {
  const tbody = document.getElementById("categoriesTableBody");

  if (!categories || categories.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No categories found</p>
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = categories
    .map(
      (category) => `
    <tr>
      <td>${category.id}</td>
      <td><strong>${category.name}</strong></td>
      <td>${category.description || "N/A"}</td>
      <td>${category.product_count || 0} products</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="editCategory(${
          category.id
        })">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteCategory(${
          category.id
        })" 
                ${
                  category.product_count > 0
                    ? 'disabled title="Cannot delete category with products"'
                    : ""
                }>
          <i class="fas fa-trash"></i> Delete
        </button>
      </td>
    </tr>
  `
    )
    .join("");
}

function showCategoryModal(categoryId = null) {
  document.getElementById("categoryModalTitle").textContent = categoryId
    ? "Edit Category"
    : "Add Category";
  document.getElementById("categoryId").value = categoryId || "";

  if (categoryId) {
    const category = currentCategories.find((c) => c.id === categoryId);
    if (category) {
      document.getElementById("categoryName").value = category.name;
      document.getElementById("categoryDescription").value =
        category.description || "";
    }
  } else {
    document.getElementById("categoryForm").reset();
  }

  document.getElementById("categoryModal").classList.add("active");
}

function editCategory(categoryId) {
  showCategoryModal(categoryId);
}

document
  .getElementById("categoryForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const categoryId = document.getElementById("categoryId").value;
    const categoryData = {
      name: document.getElementById("categoryName").value,
      description: document.getElementById("categoryDescription").value,
    };

    try {
      const url = categoryId
        ? `${API_BASE_URL}/admin/categories/${categoryId}`
        : `${API_BASE_URL}/admin/categories`;

      const response = await fetch(url, {
        method: categoryId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        throw new Error("Failed to save category");
      }

      showToast(
        categoryId
          ? "Category updated successfully"
          : "Category created successfully",
        "success"
      );
      closeModal("categoryModal");
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      showToast("Failed to save category", "error");
    }
  });

async function deleteCategory(categoryId) {
  if (!confirm("Are you sure you want to delete this category?")) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/categories/${categoryId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete category");
    }

    showToast("Category deleted successfully", "success");
    loadCategories();
  } catch (error) {
    console.error("Error deleting category:", error);
    showToast(error.message || "Failed to delete category", "error");
  }
}
