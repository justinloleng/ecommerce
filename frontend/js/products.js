// Configuration

let currentPage = 1;
let currentCategory = "all";
let currentSearch = "";
let currentMinPrice = "";
let currentMaxPrice = "";
let currentSort = "newest";
let productsPerPage = 12;
let totalProducts = 0;
let totalPages = 1;
let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

// DOM Elements
const productsList = document.getElementById("productsList");
const categoryList = document.getElementById("categoryList");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");
const sortSelect = document.getElementById("sortSelect");
const sortSelectMobile = document.getElementById("sortSelectMobile");
const applyFiltersButton = document.getElementById("applyFilters");
const clearFiltersButton = document.getElementById("clearFilters");
const totalProductsElement = document.getElementById("totalProducts");
const paginationElement = document.getElementById("pagination");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const pageNumbersElement = document.getElementById("pageNumbers");
const productDetailModal = document.getElementById("productDetailModal");
const productDetailContent = document.getElementById("productDetailContent");

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  checkAuthStatus();

  // Load categories
  loadCategories();

  // Load products
  loadProducts();

  // Setup event listeners
  setupEventListeners();

  // Navigation
  setupNavigation();
});

function setupNavigation() {
  // Cart link
  document.getElementById("cartLink").addEventListener("click", function (e) {
    e.preventDefault();
    showToast("Cart feature coming soon!", "info");
  });

  // Orders link
  document.getElementById("ordersLink").addEventListener("click", function (e) {
    e.preventDefault();
    showToast("Orders feature coming soon!", "info");
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", function (e) {
    e.preventDefault();
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  });
}

function setupEventListeners() {
  // Search
  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") performSearch();
  });

  // Category filter
  categoryList.addEventListener("click", function (e) {
    e.preventDefault();
    const categoryLink = e.target.closest("a");
    if (categoryLink) {
      // Update active category
      document.querySelectorAll(".category-list a").forEach((link) => {
        link.classList.remove("active");
      });
      categoryLink.classList.add("active");

      currentCategory = categoryLink.dataset.category;
      currentPage = 1;
      loadProducts();
    }
  });

  // Apply filters
  applyFiltersButton.addEventListener("click", function () {
    currentMinPrice = minPriceInput.value;
    currentMaxPrice = maxPriceInput.value;
    currentSort = sortSelect.value;
    currentPage = 1;
    loadProducts();
  });

  // Clear filters
  clearFiltersButton.addEventListener("click", function () {
    // Reset all filters
    document.querySelectorAll(".category-list a").forEach((link) => {
      link.classList.remove("active");
    });
    document
      .querySelector('.category-list a[data-category="all"]')
      .classList.add("active");

    searchInput.value = "";
    minPriceInput.value = "";
    maxPriceInput.value = "";
    sortSelect.value = "newest";
    sortSelectMobile.value = "newest";

    currentCategory = "all";
    currentSearch = "";
    currentMinPrice = "";
    currentMaxPrice = "";
    currentSort = "newest";
    currentPage = 1;

    loadProducts();
  });

  // Sort select
  sortSelect.addEventListener("change", function () {
    currentSort = this.value;
    sortSelectMobile.value = this.value;
    currentPage = 1;
    loadProducts();
  });

  // Mobile sort select
  sortSelectMobile.addEventListener("change", function () {
    currentSort = this.value;
    sortSelect.value = this.value;
    currentPage = 1;
    loadProducts();
  });

  // Pagination
  prevPageButton.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      loadProducts();
    }
  });

  nextPageButton.addEventListener("click", function () {
    if (currentPage < totalPages) {
      currentPage++;
      loadProducts();
    }
  });
}

function performSearch() {
  currentSearch = searchInput.value.trim();
  currentPage = 1;
  loadProducts();
}

async function loadCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/products/categories`);
    if (!response.ok) throw new Error("Failed to load categories");

    const categories = await response.json();

    // Add categories to the list
    categories.forEach((category) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" data-category="${category.id}">${category.name}</a>`;
      categoryList.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading categories:", error);
    showToast("Failed to load categories", "error");
  }
}

async function loadProducts() {
  try {
    showLoading();
    productsList.innerHTML =
      '<div class="loading-products"><div class="loading-spinner"></div></div>';

    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage,
      per_page: productsPerPage,
      sort_by: currentSort,
    });

    if (currentCategory !== "all") {
      params.append("category_id", currentCategory);
    }

    if (currentSearch) {
      params.append("search", currentSearch);
    }

    if (currentMinPrice) {
      params.append("min_price", currentMinPrice);
    }

    if (currentMaxPrice) {
      params.append("max_price", currentMaxPrice);
    }

    const response = await fetch(`${API_BASE_URL}/products?${params}`);

    if (!response.ok) throw new Error("Failed to load products");

    const data = await response.json();
    totalProducts = data.total;
    totalPages = data.total_pages;

    // Update product count display
    totalProductsElement.textContent = `${totalProducts} products found`;

    // Display products
    displayProducts(data.products);

    // Update pagination
    updatePagination();
  } catch (error) {
    console.error("Error loading products:", error);
    productsList.innerHTML = `
            <div class="no-products">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error loading products</h3>
                <p>${error.message}</p>
            </div>
        `;
    showToast("Failed to load products", "error");
  } finally {
    hideLoading();
  }
}

function displayProducts(products) {
  if (products.length === 0) {
    productsList.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
    paginationElement.style.display = "none";
    return;
  }

  productsList.innerHTML = "";

  products.forEach((product) => {
    const isInWishlist = wishlist.includes(product.id);
    const stockClass =
      product.stock_quantity > 10
        ? "in-stock"
        : product.stock_quantity > 0
        ? "low-stock"
        : "out-of-stock";
    const stockText =
      product.stock_quantity > 10
        ? "In Stock"
        : product.stock_quantity > 0
        ? "Low Stock"
        : "Out of Stock";

    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.innerHTML = `
            <div class="product-image">
                <img src="${
                  product.image_url ||
                  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
                }" 
                     alt="${product.name}" 
                     onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'">
            </div>
            <div class="product-info">
                <span class="product-category">${
                  product.category_name || "Uncategorized"
                }</span>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-stock ${stockClass}">
                    <i class="fas fa-${
                      stockClass === "in-stock"
                        ? "check-circle"
                        : stockClass === "low-stock"
                        ? "exclamation-circle"
                        : "times-circle"
                    }"></i>
                    ${stockText} (${product.stock_quantity})
                </div>
                <div class="product-actions">
                    <button class="btn-add-to-cart" onclick="addToCart(${
                      product.id
                    })" 
                            ${
                              product.stock_quantity === 0
                                ? 'disabled style="opacity:0.5; cursor:not-allowed;"'
                                : ""
                            }>
                        <i class="fas fa-shopping-cart"></i>
                        ${
                          product.stock_quantity === 0
                            ? "Out of Stock"
                            : "Add to Cart"
                        }
                    </button>
                    <button class="btn-wishlist ${
                      isInWishlist ? "active" : ""
                    }" 
                            onclick="toggleWishlist(${product.id})">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;

    // Add click event to view product details
    productCard.addEventListener("click", function (e) {
      if (!e.target.closest(".product-actions")) {
        viewProductDetails(product.id);
      }
    });

    productsList.appendChild(productCard);
  });

  paginationElement.style.display = totalPages > 1 ? "flex" : "none";
}

function updatePagination() {
  // Update buttons state
  prevPageButton.disabled = currentPage === 1;
  nextPageButton.disabled = currentPage === totalPages;

  // Update page numbers
  pageNumbersElement.innerHTML = "";

  // Show first page
  addPageNumber(1);

  // Calculate range of pages to show
  let startPage = Math.max(2, currentPage - 2);
  let endPage = Math.min(totalPages - 1, currentPage + 2);

  // Add ellipsis if needed
  if (startPage > 2) {
    pageNumbersElement.innerHTML += '<span class="page-number">...</span>';
  }

  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    addPageNumber(i);
  }

  // Add ellipsis if needed
  if (endPage < totalPages - 1) {
    pageNumbersElement.innerHTML += '<span class="page-number">...</span>';
  }

  // Show last page if not already shown
  if (totalPages > 1 && endPage < totalPages) {
    addPageNumber(totalPages);
  }

  function addPageNumber(pageNum) {
    const pageSpan = document.createElement("span");
    pageSpan.className = `page-number ${
      pageNum === currentPage ? "active" : ""
    }`;
    pageSpan.textContent = pageNum;
    pageSpan.onclick = function () {
      if (pageNum !== currentPage) {
        currentPage = pageNum;
        loadProducts();
        // Scroll to top of products
        productsList.scrollIntoView({ behavior: "smooth" });
      }
    };
    pageNumbersElement.appendChild(pageSpan);
  }
}

async function viewProductDetails(productId) {
  try {
    showLoading();

    const response = await fetch(`${API_BASE_URL}/products/${productId}`);

    if (!response.ok) throw new Error("Product not found");

    const product = await response.json();

    // Create product detail view
    const isInWishlist = wishlist.includes(product.id);
    const stockClass =
      product.stock_quantity > 10
        ? "in-stock"
        : product.stock_quantity > 0
        ? "low-stock"
        : "out-of-stock";
    const stockText =
      product.stock_quantity > 10
        ? "In Stock"
        : product.stock_quantity > 0
        ? "Low Stock"
        : "Out of Stock";

    productDetailContent.innerHTML = `
            <div style="display: flex; gap: 40px; padding: 20px;">
                <div style="flex: 1;">
                    <img src="${
                      product.image_url ||
                      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
                    }" 
                         alt="${product.name}" 
                         style="width: 100%; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"
                         onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'">
                </div>
                <div style="flex: 1;">
                    <span style="display: inline-block; padding: 6px 15px; background: #edf2f7; color: #4a5568; border-radius: 20px; font-size: 0.9rem; font-weight: 600; margin-bottom: 15px;">
                        ${product.category_name || "Uncategorized"}
                    </span>
                    <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 1.8rem;">${
                      product.name
                    }</h2>
                    <div style="font-size: 2rem; color: #667eea; font-weight: 700; margin-bottom: 20px;">
                        $${product.price.toFixed(2)}
                    </div>
                    <div style="margin-bottom: 25px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <span class="product-stock ${stockClass}" style="font-size: 1rem;">
                                <i class="fas fa-${
                                  stockClass === "in-stock"
                                    ? "check-circle"
                                    : stockClass === "low-stock"
                                    ? "exclamation-circle"
                                    : "times-circle"
                                }"></i>
                                ${stockText} (${
      product.stock_quantity
    } available)
                            </span>
                        </div>
                        <p style="color: #718096; line-height: 1.6; margin: 0;">
                            ${
                              product.description || "No description available."
                            }
                        </p>
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button onclick="addToCart(${
                          product.id
                        }); closeProductModal();" 
                                style="flex: 1; padding: 15px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;"
                                ${
                                  product.stock_quantity === 0
                                    ? 'disabled style="opacity:0.5; cursor:not-allowed;"'
                                    : ""
                                }>
                            <i class="fas fa-shopping-cart"></i>
                            ${
                              product.stock_quantity === 0
                                ? "Out of Stock"
                                : "Add to Cart"
                            }
                        </button>
                        <button onclick="toggleWishlist(${product.id})" 
                                style="width: 50px; background: ${
                                  isInWishlist ? "#fc8181" : "#edf2f7"
                                }; color: ${
      isInWishlist ? "white" : "#4a5568"
    }; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

    // Show modal
    productDetailModal.classList.add("active");
  } catch (error) {
    console.error("Error loading product details:", error);
    showToast("Failed to load product details", "error");
  } finally {
    hideLoading();
  }
}

function closeProductModal() {
  productDetailModal.classList.remove("active");
}

// Close modal when clicking outside
productDetailModal.addEventListener("click", function (e) {
  if (e.target === productDetailModal) {
    closeProductModal();
  }
});

function addToCart(productId) {
  // Get current cart from localStorage
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  // Check if product already in cart
  const existingItem = cart.find((item) => item.product_id === productId);

  if (existingItem) {
    // Increase quantity
    existingItem.quantity += 1;
  } else {
    // Add new item
    cart.push({
      product_id: productId,
      quantity: 1,
      added_at: new Date().toISOString(),
    });
  }

  // Save back to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));

  // Update cart count
  updateCartCount();

  showToast("Product added to cart!", "success");
}

function toggleWishlist(productId) {
  if (wishlist.includes(productId)) {
    // Remove from wishlist
    wishlist = wishlist.filter((id) => id !== productId);
    showToast("Removed from wishlist", "info");
  } else {
    // Add to wishlist
    wishlist.push(productId);
    showToast("Added to wishlist!", "success");
  }

  // Save to localStorage
  localStorage.setItem("wishlist", JSON.stringify(wishlist));

  // Reload products to update wishlist icons
  loadProducts();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartCountElement = document.querySelector(".cart-count");
  if (cartCountElement) {
    cartCountElement.textContent = totalItems;
    cartCountElement.style.display = totalItems > 0 ? "inline-block" : "none";
  }
}

// Make functions available globally
window.addToCart = addToCart;
window.toggleWishlist = toggleWishlist;
window.viewProductDetails = viewProductDetails;
window.closeProductModal = closeProductModal;
window.showToast = showToast;
window.logout = logout;
window.checkAuthStatus = checkAuthStatus;
