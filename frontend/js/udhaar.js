async function loadUdhaar() {
  try {
    const res = await fetch(
      `${API_BASE_URL}/payments/udhaar/${currentBatchId}`,
    );
    const data = await res.json();
    renderUdhaar(data.data || []);
  } catch (err) {
    showToast("Failed to load udhaar", "error");
  }
}

function renderUdhaar(list) {
  const el = document.getElementById("udhaarList");
  const empty = document.getElementById("udhaarEmpty");
  const total = document.getElementById("totalUdhaarAmount");

  if (list.length === 0) {
    el.innerHTML = "";
    empty.classList.remove("hidden");
    total.textContent = "Rs.0";
    return;
  }
  empty.classList.add("hidden");

  const grand = list.reduce((s, x) => s + (x.totalAmount - x.amountPaid), 0);
  total.textContent = `Rs.${grand.toFixed(2)}`;

  el.innerHTML = list
    .map((s) => {
      const remaining = s.totalAmount - s.amountPaid;
      const date = s.saleDate?._seconds
        ? new Date(s.saleDate._seconds * 1000).toLocaleDateString("en-IN")
        : "—";

      return `
      <div class="bg-white border border-gray-200 p-4 border-l-4 border-l-danger">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-bold text-gray-900 text-sm">${s.customerName}</p>
            <p class="text-xs text-muted">Sale: ${date} &nbsp;|&nbsp; ${s.qtyKg} kg @ Rs.${s.sellingRate}/kg</p>
          </div>
          <div class="text-right">
            <p class="text-danger font-black">Rs.${remaining.toFixed(2)}</p>
            <p class="text-xs text-muted">remaining</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-xs mb-3 bg-gray-50 p-2">
          <span class="text-muted">Total: <span class="text-gray-900 font-semibold">Rs.${s.totalAmount}</span></span>
          <span class="text-muted">Paid: <span class="text-green-700 font-semibold">Rs.${s.amountPaid}</span></span>
          <span class="px-2 py-0.5 border font-semibold uppercase text-xs
            ${
              s.paymentStatus === "partial"
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-red-100 text-red-700 border-red-200"
            }">
            ${s.paymentStatus}
          </span>
        </div>
        <button onclick="openPaymentModal('${s.id}', '${s.customerName.replace(/'/g, "\\'")}', ${remaining})"
          class="w-full border border-green-300 hover:bg-green-50 text-green-700 py-2 text-xs font-bold uppercase tracking-wide transition-all">
          + Record Payment
        </button>
      </div>
    `;
    })
    .join("");
}

function openPaymentModal(saleId, customerName, remaining) {
  currentSaleId = saleId;
  currentSaleRemaining = remaining;
  document.getElementById("paymentCustomerName").textContent = customerName;
  document.getElementById("paymentRemaining").textContent =
    `Rs.${remaining.toFixed(2)}`;
  document.getElementById("paymentAmount").value = "";
  document.getElementById("paymentNote").value = "";
  document.getElementById("addPaymentModal").classList.remove("hidden");
}

function closePaymentModal() {
  document.getElementById("addPaymentModal").classList.add("hidden");
  currentSaleId = null;
}

async function submitPayment() {
  const amount = parseFloat(document.getElementById("paymentAmount").value);
  const note = document.getElementById("paymentNote").value.trim();

  if (!amount || amount <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }
  if (amount > currentSaleRemaining) {
    showToast(
      `Amount cannot exceed Rs.${currentSaleRemaining.toFixed(2)}`,
      "error",
    );
    return;
  }

  const sale = allSales.find((s) => s.id === currentSaleId);

  try {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saleId: currentSaleId,
        batchId: currentBatchId,
        customerId: sale?.customerId || "",
        customerName: sale?.customerName || "",
        amountPaid: amount,
        note,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("Payment recorded successfully", "success");
      closePaymentModal();
      await loadAllData();
    } else {
      showToast(data.message || "Failed", "error");
    }
  } catch (err) {
    showToast("Server error", "error");
  }
}
