let currentBatch = null;
let currentBatchId = null;
let allCustomers = [];
let allSales = [];
let currentSaleId = null;
let currentSaleRemaining = 0;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  currentBatchId = params.get("id");
  if (!currentBatchId) {
    window.location.href = "../index.html";
    return;
  }
  loadBatchPage();
  document.getElementById("saleDate").value = new Date()
    .toISOString()
    .split("T")[0];
});

async function loadBatchPage() {
  await loadBatchDetails();
  await loadAllData();
}

async function loadAllData() {
  await Promise.all([loadCustomers(), loadSales(), loadUdhaar()]);
  updateSummaryCards();
}

async function loadBatchDetails() {
  try {
    const res = await fetch(`${API_BASE_URL}/batches/${currentBatchId}`);
    const data = await res.json();
    if (!data.success) {
      window.location.href = "../index.html";
      return;
    }
    currentBatch = data.data;

    document.getElementById("navBatchName").textContent = currentBatch.name;
    document.getElementById("navBatchMeta").textContent =
      `${currentBatch.mirchiType?.toUpperCase()} — Rs.${currentBatch.costPerKg?.toFixed(2)}/kg`;
    document.title = `${currentBatch.name} — KhataBook`;

    const date = currentBatch.purchaseDate?._seconds
      ? new Date(currentBatch.purchaseDate._seconds * 1000).toLocaleDateString(
          "en-IN",
        )
      : "—";

    document.getElementById("batchInfoGrid").innerHTML = [
      [
        "Mirchi Type",
        `<span class="capitalize font-bold">${currentBatch.mirchiType}</span>`,
      ],
      ["Purchase Date", date],
      ["Raw Qty", `${currentBatch.rawQty} kg @ Rs.${currentBatch.rawRate}/kg`],
      ["Drying Cost", `Rs.${currentBatch.dryingCost}`],
      ["Salt Cost", `Rs.${currentBatch.saltCost}`],
      ["Oil Cost", `Rs.${currentBatch.oilCost}`],
      ["Grinding Cost", `Rs.${currentBatch.grindingCost}`],
      ["Final Powder", `${currentBatch.finalPowderQty} kg`],
      ["Stock Left", `${currentBatch.stockRemaining} kg`],
      [
        "Cost / kg",
        `<span class="text-primary font-black text-base">Rs.${currentBatch.costPerKg?.toFixed(2)}</span>`,
      ],
    ]
      .map(
        ([label, val]) => `
      <div class="bg-gray-50 border border-gray-100 p-3">
        <p class="text-xs text-muted mb-0.5">${label}</p>
        <p class="text-sm text-gray-900">${val}</p>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    showToast("Failed to load batch", "error");
  }
}

function updateSummaryCards() {
  const totalProfit = allSales.reduce((s, x) => s + (x.profitOnSale || 0), 0);
  document.getElementById("cardProfit").textContent =
    `Rs.${parseFloat(totalProfit.toFixed(2))}`;
  document.getElementById("cardCustomers").textContent = new Set(
    allSales.map((x) => x.customerId),
  ).size;
  document.getElementById("cardStock").textContent =
    `${parseFloat((currentBatch?.stockRemaining ?? 0).toFixed(3))} kg`;
  const udhaar = allSales
    .filter((x) => x.paymentStatus !== "paid")
    .reduce((s, x) => s + (x.totalAmount - x.amountPaid), 0);
  document.getElementById("cardUdhaar").textContent =
    `Rs.${parseFloat(udhaar.toFixed(2))}`;
}

function switchTab(tab) {
  document
    .querySelectorAll(".tab-content")
    .forEach((el) => el.classList.add("hidden"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById(`content-${tab}`).classList.remove("hidden");
  document.getElementById(`tab-${tab}`).classList.add("active");
  if (tab === "reports") loadReports();
}

function toggleBatchInfo() {
  const panel = document.getElementById("batchInfoPanel");
  const arrow = document.getElementById("batchInfoArrow");
  panel.classList.toggle("hidden");
  arrow.innerHTML = panel.classList.contains("hidden") ? "&#9660;" : "&#9650;";
}

function updateSalePreview() {
  const qty = parseFloat(document.getElementById("saleQty").value) || 0;
  const rate = parseFloat(document.getElementById("saleRate").value) || 0;
  if (qty > 0 && rate > 0 && currentBatch) {
    const total = qty * rate;
    const profit = (rate - currentBatch.costPerKg) * qty;
    document.getElementById("salePreview").classList.remove("hidden");
    document.getElementById("previewSaleTotal").textContent =
      `Rs.${total.toFixed(2)}`;
    const el = document.getElementById("previewSaleProfit");
    el.textContent = `Rs.${profit.toFixed(2)}`;
    el.className = `font-black ${profit >= 0 ? "text-green-700" : "text-red-600"}`;
  }
}

function toggleAmountPaid() {
  const status = document.getElementById("salePaymentStatus").value;
  const div = document.getElementById("amountPaidDiv");
  if (status === "partial") {
    div.classList.remove("hidden");
  } else {
    div.classList.add("hidden");
    document.getElementById("saleAmountPaid").value =
      status === "paid"
        ? parseFloat(document.getElementById("saleQty").value || 0) *
          parseFloat(document.getElementById("saleRate").value || 0)
        : 0;
  }
}

function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `fixed bottom-6 right-6 z-50 px-5 py-3 text-white text-sm font-semibold shadow-lg fade-in ${
    type === "success" ? "bg-green-700" : "bg-red-600"
  }`;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}
