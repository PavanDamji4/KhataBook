// ─── AUTH ────────────────────────────────────────────────
function handleLogout() {
  sessionStorage.removeItem("kb_auth");
  sessionStorage.removeItem("kb_user");
  window.location.href = "login.html";
}

// ─── INIT ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  setupCostPreview();
  setDefaultDate();
});

function setDefaultDate() {
  document.getElementById("purchaseDate").value = new Date()
    .toISOString()
    .split("T")[0];
}

// ─── DASHBOARD TAB SWITCHER ──────────────────────────────
function switchDashTab(tab) {
  document.querySelectorAll(".dtab-btn").forEach((el) => {
    el.classList.remove("active", "text-primary", "border-primary");
    el.classList.add("text-muted", "border-transparent");
  });
  document.getElementById("dcontent-batches").classList.add("hidden");
  document.getElementById("dcontent-overview").classList.add("hidden");

  document.getElementById(`dcontent-${tab}`).classList.remove("hidden");
  const activeBtn = document.getElementById(`dtab-${tab}`);
  activeBtn.classList.add("active", "text-primary", "border-primary");
  activeBtn.classList.remove("text-muted", "border-transparent");
}

// ─── LOAD DASHBOARD ──────────────────────────────────────
async function loadDashboard() {
  try {
    const [bRes, sRes] = await Promise.all([
      fetch(`${API_BASE_URL}/batches`),
      fetch(`${API_BASE_URL}/sales`),
    ]);
    const batches = (await bRes.json()).data || [];
    const sales = (await sRes.json()).data || [];

    renderSummaryCards(batches, sales);
    renderBatchCards(batches);
    checkLowStock(batches);
  } catch (err) {
    showToast("Failed to load dashboard", "error");
  }
}

// ─── SUMMARY CARDS ───────────────────────────────────────
function renderSummaryCards(batches, sales) {
  const totalProfit = sales.reduce((s, x) => s + (x.profitOnSale || 0), 0);
  const totalRevenue = sales.reduce((s, x) => s + (x.totalAmount || 0), 0);
  const totalQty = sales.reduce((s, x) => s + (x.qtyKg || 0), 0);

  document.getElementById("totalProfit").textContent =
    `Rs.${parseFloat(totalProfit.toFixed(2))}`;
  document.getElementById("totalRevenue").textContent =
    `Rs.${parseFloat(totalRevenue.toFixed(2))}`;
  document.getElementById("totalSoldKg").textContent =
    `${parseFloat(totalQty.toFixed(3))} kg`;
  document.getElementById("totalBatches").textContent = batches.length;

  const totalUdhaar = sales
    .filter((x) => x.paymentStatus !== "paid")
    .reduce((s, x) => s + (x.totalAmount - x.amountPaid), 0);
  document.getElementById("totalUdhaar").textContent =
    `Rs.${parseFloat(totalUdhaar.toFixed(2))}`;

  const now = new Date();
  const monthName = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const monthProfit = sales
    .filter((x) => {
      const d = x.saleDate?._seconds
        ? new Date(x.saleDate._seconds * 1000)
        : new Date(x.saleDate);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s, x) => s + (x.profitOnSale || 0), 0);

  document.getElementById("monthProfit").textContent =
    `Rs.${parseFloat(monthProfit.toFixed(2))}`;
  document.getElementById("monthLabel").textContent = monthName;
}

// ─── BATCH CARDS ─────────────────────────────────────────
function renderBatchCards(batches) {
  const grid = document.getElementById("batchesGrid");
  const empty = document.getElementById("emptyState");

  document.getElementById("batchCount").textContent =
    `${batches.length} batch${batches.length !== 1 ? "es" : ""}`;

  if (batches.length === 0) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  const typeTag = {
    bedgi: "bg-red-100 text-red-700 border-red-200",
    jawari: "bg-orange-100 text-orange-700 border-orange-200",
    guntur: "bg-amber-100 text-amber-700 border-amber-200",
  };

  grid.innerHTML = batches
    .map((b) => {
      const pct =
        b.finalPowderQty > 0 ? (b.stockRemaining / b.finalPowderQty) * 100 : 0;
      const barCl =
        pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-400" : "bg-red-500";
      const date = b.purchaseDate?._seconds
        ? new Date(b.purchaseDate._seconds * 1000).toLocaleDateString("en-IN")
        : "—";
      const tag =
        typeTag[b.mirchiType] || "bg-gray-100 text-gray-600 border-gray-200";
      const stock = parseFloat((b.stockRemaining || 0).toFixed(3));

      return `
      <div class="batch-card bg-white border border-gray-200 p-5 hover:border-primary"
        onclick="openBatch('${b.id}')">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1 min-w-0">
            <h3 class="font-black text-base text-gray-900 truncate">${b.name}</h3>
            <p class="text-xs text-muted mt-0.5">${date}</p>
          </div>
          <div class="flex items-center gap-2 ml-2 flex-shrink-0">
            <span class="text-xs px-2 py-0.5 border font-semibold uppercase tracking-wide ${tag}">
              ${b.mirchiType}
            </span>
            <button onclick="event.stopPropagation(); openDeleteModal('${b.id}', '${b.name.replace(/'/g, "\\'")}')"
              class="text-gray-300 hover:text-red-500 transition-all text-lg leading-none font-bold">
              &times;
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-gray-50 p-3">
            <p class="text-xs text-muted mb-0.5">Cost / kg</p>
            <p class="font-black text-primary">Rs.${b.costPerKg?.toFixed(2) || 0}</p>
          </div>
          <div class="bg-gray-50 p-3">
            <p class="text-xs text-muted mb-0.5">Stock Left</p>
            <p class="font-black text-gray-900">${stock} kg</p>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-xs text-muted mb-1">
            <span>Stock</span>
            <span>${stock} / ${b.finalPowderQty || 0} kg</span>
          </div>
          <div class="w-full bg-gray-100 h-1.5">
            <div class="${barCl} h-1.5 progress-bar" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

// ─── LOW STOCK ───────────────────────────────────────────
function checkLowStock(batches) {
  const low = batches.filter((b) => {
    const p =
      b.finalPowderQty > 0 ? (b.stockRemaining / b.finalPowderQty) * 100 : 0;
    return p <= 20 && b.stockRemaining > 0;
  });
  if (low.length > 0) {
    document.getElementById("lowStockAlert").classList.remove("hidden");
    document.getElementById("lowStockList").innerHTML = low
      .map(
        (b) =>
          `${b.name}: ${parseFloat(b.stockRemaining.toFixed(3))} kg remaining`,
      )
      .join(" &nbsp;|&nbsp; ");
  }
}

// ─── COST PREVIEW ────────────────────────────────────────
function setupCostPreview() {
  [
    "rawQty",
    "rawRate",
    "dryingCost",
    "saltCost",
    "oilCost",
    "grindingCost",
    "finalPowderQty",
  ].forEach((id) =>
    document.getElementById(id)?.addEventListener("input", updateCostPreview),
  );
}

function updateCostPreview() {
  const v = (id) => parseFloat(document.getElementById(id).value) || 0;
  const total =
    v("rawQty") * v("rawRate") +
    v("dryingCost") +
    v("saltCost") +
    v("oilCost") +
    v("grindingCost");
  const cpkg = v("finalPowderQty") > 0 ? total / v("finalPowderQty") : 0;
  if (total > 0) {
    document.getElementById("costPreview").classList.remove("hidden");
    document.getElementById("previewTotalCost").textContent =
      `Rs.${total.toFixed(2)}`;
    document.getElementById("previewCostPerKg").textContent =
      `Rs.${cpkg.toFixed(2)}`;
  }
}

// ─── MODALS ──────────────────────────────────────────────
function openCreateBatchModal() {
  document.getElementById("createBatchModal").classList.remove("hidden");
}
function closeCreateBatchModal() {
  document.getElementById("createBatchModal").classList.add("hidden");
  document.getElementById("createBatchForm").reset();
  document.getElementById("costPreview").classList.add("hidden");
  setDefaultDate();
}

// ─── DELETE BATCH ────────────────────────────────────────
let batchToDelete = null;

function openDeleteModal(id, name) {
  batchToDelete = id;
  document.getElementById("confirmDeleteModal").classList.remove("hidden");
}
function closeDeleteModal() {
  batchToDelete = null;
  document.getElementById("confirmDeleteModal").classList.add("hidden");
}
async function confirmDeleteBatch() {
  if (!batchToDelete) return;
  try {
    const res = await fetch(`${API_BASE_URL}/batches/${batchToDelete}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      showToast("Batch and all data deleted", "success");
      closeDeleteModal();
      loadDashboard();
    } else {
      showToast(data.message || "Delete failed", "error");
    }
  } catch (err) {
    showToast("Server error", "error");
  }
}

// ─── CREATE BATCH ────────────────────────────────────────
document
  .getElementById("createBatchForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button[type=submit]");
    btn.textContent = "Creating...";
    btn.disabled = true;

    const payload = {
      name: document.getElementById("batchName").value.trim(),
      mirchiType: document.getElementById("mirchiType").value,
      purchaseDate: document.getElementById("purchaseDate").value,
      rawQty: parseFloat(document.getElementById("rawQty").value),
      rawRate: parseFloat(document.getElementById("rawRate").value),
      dryingCost: parseFloat(document.getElementById("dryingCost").value),
      saltCost: parseFloat(document.getElementById("saltCost").value),
      oilCost: parseFloat(document.getElementById("oilCost").value),
      grindingCost: parseFloat(document.getElementById("grindingCost").value),
      finalPowderQty: parseFloat(
        document.getElementById("finalPowderQty").value,
      ),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Batch created successfully", "success");
        closeCreateBatchModal();
        loadDashboard();
      } else {
        showToast(data.message || "Failed to create batch", "error");
      }
    } catch (err) {
      showToast("Server error. Try again.", "error");
    } finally {
      btn.textContent = "Create Batch";
      btn.disabled = false;
    }
  });

// ─── NAVIGATE ────────────────────────────────────────────
function openBatch(id) {
  window.location.href = `pages/batch-detail.html?id=${id}`;
}

// ─── TOAST ───────────────────────────────────────────────
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `fixed bottom-6 right-6 z-50 px-5 py-3 text-white text-sm font-semibold shadow-lg fade-in ${
    type === "success" ? "bg-green-700" : "bg-red-600"
  }`;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}
