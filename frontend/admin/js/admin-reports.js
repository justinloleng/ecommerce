// Sales Reports JavaScript

async function exportSalesReport(format) {
  try {
    const period = document.getElementById("reportPeriod").value;
    const startDate = document.getElementById("reportStartDate").value;
    const endDate = document.getElementById("reportEndDate").value;

    // Show loading toast
    showToast(`Generating ${format.toUpperCase()} report...`, "info");

    const response = await fetch(
      `${API_BASE_URL}/admin/reports/sales/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: format,
          period: period,
          start_date: startDate,
          end_date: endDate,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate report");
    }

    // Download the file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_report_${period}_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast(
      `${format.toUpperCase()} report downloaded successfully`,
      "success"
    );
  } catch (error) {
    console.error("Error exporting report:", error);
    showToast("Failed to export report", "error");
  }
}

async function loadSalesReport() {
  try {
    const period = document.getElementById("reportPeriod").value;
    const startDate = document.getElementById("reportStartDate").value;
    const endDate = document.getElementById("reportEndDate").value;

    let url = `${API_BASE_URL}/admin/reports/sales?period=${period}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to load sales report");
    }

    const reportData = await response.json();
    displaySalesReport(reportData);
  } catch (error) {
    console.error("Error loading sales report:", error);
    showToast("Failed to load sales report", "error");
  }
}

function displaySalesReport(reportData) {
  // Display overall stats
  const statsHtml = `
    <div class="stat-card">
      <div class="stat-icon blue">
        <i class="fas fa-shopping-cart"></i>
      </div>
      <div class="stat-info">
        <h3>${reportData.overall_stats?.total_orders || 0}</h3>
        <p>Total Orders</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">
        <i class="fas fa-dollar-sign"></i>
      </div>
      <div class="stat-info">
        <h3>$${(reportData.overall_stats?.total_revenue || 0).toFixed(
          2
        )}</h3>
        <p>Total Revenue</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">
        <i class="fas fa-chart-line"></i>
      </div>
      <div class="stat-info">
        <h3>$${(reportData.overall_stats?.average_order_value || 0).toFixed(
          2
        )}</h3>
        <p>Avg Order Value</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">
        <i class="fas fa-users"></i>
      </div>
      <div class="stat-info">
        <h3>${reportData.overall_stats?.unique_customers || 0}</h3>
        <p>Unique Customers</p>
      </div>
    </div>
  `;
  document.getElementById("reportStats").innerHTML = statsHtml;

  // Display sales data
  const tbody = document.getElementById("salesTableBody");
  if (!reportData.sales_data || reportData.sales_data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6" class="empty-state">
        <i class="fas fa-chart-bar"></i>
        <p>No sales data found for the selected period</p>
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = reportData.sales_data
    .map(
      (item) => `
    <tr>
      <td>${item.period_label || item.period}</td>
      <td>${item.total_orders || 0}</td>
      <td><strong>$${(item.total_revenue || 0).toFixed(2)}</strong></td>
      <td>$${(item.average_order_value || 0).toFixed(2)}</td>
      <td>${item.unique_customers || 0}</td>
      <td>${item.completed_orders || 0}</td>
    </tr>
  `
    )
    .join("");

  // Display top products
  const topProductsBody = document.getElementById("topProductsTableBody");
  if (!reportData.top_products || reportData.top_products.length === 0) {
    topProductsBody.innerHTML = `
      <tr><td colspan="3" class="empty-state">
        <i class="fas fa-box"></i>
        <p>No product data available</p>
      </td></tr>
    `;
    return;
  }

  topProductsBody.innerHTML = reportData.top_products
    .map(
      (product) => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          ${
            product.image_url
              ? `<img src="${product.image_url}" alt="${product.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 5px;">`
              : ""
          }
          <span>${product.name}</span>
        </div>
      </td>
      <td>${product.total_quantity_sold || 0}</td>
      <td><strong>$${(product.total_revenue || 0).toFixed(2)}</strong></td>
    </tr>
  `
    )
    .join("");
}
