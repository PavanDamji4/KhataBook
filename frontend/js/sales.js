async function loadSales() {
  try {
    const res = await fetch(`${API_BASE_URL}/sales/batch/${currentBatchId}`);
    const data = await res.json();
    allSales = data.data || [];
    renderSales(allSales);
  } catch (err) {
    showToast("Failed to load sales", "error");
  }
}

function renderSales(sales) {
  const list = document.getElementById("salesList");
  const empty = document.getElementById("salesEmpty");

  if (sales.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  const statusCl = {
    paid: "bg-green-100 text-green-800 border-green-200",
    unpaid: "bg-red-100 text-red-700 border-red-200",
    partial: "bg-amber-100 text-amber-700 border-amber-200",
  };

  list.innerHTML = sales
    .map((s) => {
      const date = s.saleDate?._seconds
        ? new Date(s.saleDate._seconds * 1000).toLocaleDateString("en-IN")
        : "—";
      const remaining = s.totalAmount - s.amountPaid;

      return `
      <div class="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-all">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-bold text-gray-900 text-sm">${s.customerName}</p>
            <p class="text-xs text-muted">${date}</p>
          </div>
          <span class="text-xs px-2 py-0.5 border font-semibold uppercase ${statusCl[s.paymentStatus] || ""}">
            ${s.paymentStatus}
          </span>
        </div>
        <div class="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div class="bg-gray-50 p-2">
            <p class="text-muted mb-0.5">Qty</p>
            <p class="font-bold text-gray-900">${s.qtyKg} kg</p>
          </div>
          <div class="bg-gray-50 p-2">
            <p class="text-muted mb-0.5">Rate</p>
            <p class="font-bold text-gray-900">Rs.${s.sellingRate}/kg</p>
          </div>
          <div class="bg-gray-50 p-2">
            <p class="text-muted mb-0.5">Total</p>
            <p class="font-bold text-accent">Rs.${s.totalAmount}</p>
          </div>
          <div class="bg-gray-50 p-2">
            <p class="text-muted mb-0.5">Profit</p>
            <p class="font-bold ${s.profitOnSale >= 0 ? "text-green-700" : "text-red-600"}">
              Rs.${s.profitOnSale?.toFixed(2)}
            </p>
          </div>
          <div class="bg-gray-50 p-2">
            <p class="text-muted mb-0.5">Paid</p>
            <p class="font-bold text-gray-900">Rs.${s.amountPaid}</p>
          </div>
          ${
            remaining > 0
              ? `
          <div class="bg-red-50 border border-red-100 p-2">
            <p class="text-muted mb-0.5">Due</p>
            <p class="font-bold text-danger">Rs.${remaining.toFixed(2)}</p>
          </div>`
              : `<div class="bg-green-50 border border-green-100 p-2 flex items-center justify-center">
            <p class="font-bold text-green-700 text-xs">Paid</p>
          </div>`
          }
        </div>
      </div>
    `;
    })
    .join("");
}

function openAddSaleModal() {
  if (allCustomers.length === 0) {
    showToast("Add a customer first", "error");
    switchTab("customers");
    return;
  }
  document.getElementById("addSaleModal").classList.remove("hidden");
}

function closeAddSaleModal() {
  document.getElementById("addSaleModal").classList.add("hidden");
  ["saleQty", "saleRate", "saleAmountPaid"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("salePreview").classList.add("hidden");
  document.getElementById("amountPaidDiv").classList.remove("hidden");
  document.getElementById("salePaymentStatus").value = "paid";
}

async function submitAddSale() {
  const customerId = document.getElementById("saleCustomer").value;
  const customerName =
    document.getElementById("saleCustomer").selectedOptions[0]?.dataset.name ||
    "";
  const qtyKg = parseFloat(document.getElementById("saleQty").value);
  const sellingRate = parseFloat(document.getElementById("saleRate").value);
  const paymentStatus = document.getElementById("salePaymentStatus").value;
  const saleDate = document.getElementById("saleDate").value;

  let amountPaid = 0;
  if (paymentStatus === "paid") amountPaid = qtyKg * sellingRate;
  if (paymentStatus === "partial")
    amountPaid =
      parseFloat(document.getElementById("saleAmountPaid").value) || 0;

  if (!customerId || !qtyKg || !sellingRate || !saleDate) {
    showToast("Please fill all required fields", "error");
    return;
  }
  if (qtyKg > currentBatch.stockRemaining) {
    showToast(
      `Not enough stock. Available: ${currentBatch.stockRemaining} kg`,
      "error",
    );
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId: currentBatchId,
        batchName: currentBatch.name,
        customerId,
        customerName,
        qtyKg,
        sellingRate,
        paymentStatus,
        amountPaid,
        saleDate,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("Sale recorded successfully", "success");
      closeAddSaleModal();
      currentBatch.stockRemaining -= qtyKg;
      await loadAllData();
    } else {
      showToast(data.message || "Failed to record sale", "error");
    }
  } catch (err) {
    showToast("Server error. Try again.", "error");
  }
}
