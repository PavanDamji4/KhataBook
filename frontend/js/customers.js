async function loadCustomers() {
  try {
    const res = await fetch(`${API_BASE_URL}/customers`);
    const data = await res.json();
    allCustomers = data.data || [];
    renderCustomers(allCustomers);
    populateCustomerDropdown();
  } catch (err) {
    showToast("Failed to load customers", "error");
  }
}

function renderCustomers(customers) {
  const list = document.getElementById("customersList");
  const empty = document.getElementById("customersEmpty");

  if (customers.length === 0) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  list.innerHTML = customers
    .map((c) => {
      const custSales = allSales.filter((s) => s.customerId === c.id);
      const totalBought = custSales.reduce((s, x) => s + x.qtyKg, 0);
      const totalSpent = custSales.reduce((s, x) => s + x.totalAmount, 0);
      const pending = custSales
        .filter((s) => s.paymentStatus !== "paid")
        .reduce((s, x) => s + (x.totalAmount - x.amountPaid), 0);

      return `
      <div class="bg-white border border-gray-200 p-4 flex items-center justify-between hover:border-gray-300 transition-all">
        <div class="flex items-center gap-4">
          <div class="w-9 h-9 bg-red-100 border border-red-200 flex items-center justify-center font-black text-primary text-sm flex-shrink-0">
            ${c.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p class="font-bold text-gray-900 text-sm">${c.name}</p>
            <p class="text-xs text-muted">${c.phone} &nbsp;|&nbsp; ${c.address || "—"}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right hidden md:block">
            <p class="text-xs text-muted">Bought: <span class="text-gray-900 font-semibold">${totalBought} kg</span></p>
            <p class="text-xs text-muted">Spent: <span class="font-semibold text-accent">Rs.${totalSpent.toFixed(2)}</span></p>
            ${pending > 0 ? `<p class="text-xs text-danger font-bold">Pending: Rs.${pending.toFixed(2)}</p>` : ""}
          </div>
          <button onclick="openDeleteCustomerModal('${c.id}', '${c.name.replace(/'/g, "\\'")}')"
            class="text-gray-300 hover:text-red-500 font-bold text-xl leading-none transition-all">&times;</button>
        </div>
      </div>
    `;
    })
    .join("");
}

function filterCustomers() {
  const q = document.getElementById("customerSearch").value.toLowerCase();
  renderCustomers(
    allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.phone).includes(q) ||
        (c.address || "").toLowerCase().includes(q),
    ),
  );
}

function populateCustomerDropdown() {
  document.getElementById("saleCustomer").innerHTML =
    `<option value="">Select Customer</option>` +
    allCustomers
      .map(
        (c) =>
          `<option value="${c.id}" data-name="${c.name}">${c.name} — ${c.phone}</option>`,
      )
      .join("");
}

function openAddCustomerModal() {
  document.getElementById("addCustomerModal").classList.remove("hidden");
}
function closeAddCustomerModal() {
  document.getElementById("addCustomerModal").classList.add("hidden");
  ["custName", "custPhone", "custAddress"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
}

async function submitAddCustomer() {
  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  if (!name || !phone) {
    showToast("Name and phone are required", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: Number(phone), address }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("Customer added successfully", "success");
      closeAddCustomerModal();
      await loadCustomers();
      updateSummaryCards();
    } else {
      showToast(data.message || "Failed", "error");
    }
  } catch (err) {
    showToast("Server error", "error");
  }
}

// ─── DELETE CUSTOMER ─────────────────────────────────────
let customerToDelete = null;

function openDeleteCustomerModal(id, name) {
  customerToDelete = id;
  document
    .getElementById("confirmDeleteCustomerModal")
    .classList.remove("hidden");
}
function closeDeleteCustomerModal() {
  customerToDelete = null;
  document.getElementById("confirmDeleteCustomerModal").classList.add("hidden");
}
async function confirmDeleteCustomer() {
  if (!customerToDelete) return;
  try {
    const res = await fetch(`${API_BASE_URL}/customers/${customerToDelete}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      showToast("Customer deleted", "success");
      closeDeleteCustomerModal();
      await loadCustomers();
      updateSummaryCards();
    } else {
      showToast(data.message || "Delete failed", "error");
    }
  } catch (err) {
    showToast("Server error", "error");
  }
}
