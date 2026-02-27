async function loadReports() {
  if (!currentBatch || allSales.length === 0) {
    document.getElementById("reportsContent").innerHTML = `
      <div class="text-center py-16 text-muted text-sm">No sales data yet. Add some sales first.</div>`;
    return;
  }

  const totalRevenue = allSales.reduce((s, x) => s + x.totalAmount, 0);
  const totalProfit = allSales.reduce((s, x) => s + x.profitOnSale, 0);
  const totalQty = allSales.reduce((s, x) => s + x.qtyKg, 0);
  const totalCost = totalQty * currentBatch.costPerKg;
  const totalPaid = allSales.reduce((s, x) => s + x.amountPaid, 0);
  const totalPending = allSales
    .filter((x) => x.paymentStatus !== "paid")
    .reduce((s, x) => s + (x.totalAmount - x.amountPaid), 0);

  const customerMap = {};
  allSales.forEach((s) => {
    if (!customerMap[s.customerId]) {
      customerMap[s.customerId] = {
        name: s.customerName,
        qty: 0,
        amount: 0,
        profit: 0,
        pending: 0,
      };
    }
    customerMap[s.customerId].qty += s.qtyKg;
    customerMap[s.customerId].amount += s.totalAmount;
    customerMap[s.customerId].profit += s.profitOnSale;
    if (s.paymentStatus !== "paid")
      customerMap[s.customerId].pending += s.totalAmount - s.amountPaid;
  });

  const rows = Object.values(customerMap)
    .sort((a, b) => b.amount - a.amount)
    .map(
      (c) => `
      <tr class="border-b border-gray-100">
        <td class="py-3 text-sm font-semibold text-gray-900">${c.name}</td>
        <td class="py-3 text-center text-sm text-gray-600">${c.qty} kg</td>
        <td class="py-3 text-center text-sm font-semibold text-accent">Rs.${c.amount.toFixed(2)}</td>
        <td class="py-3 text-center text-sm font-bold ${c.profit >= 0 ? "text-green-700" : "text-red-600"}">
          Rs.${c.profit.toFixed(2)}
        </td>
        <td class="py-3 text-center text-sm font-bold ${c.pending > 0 ? "text-danger" : "text-green-700"}">
          ${c.pending > 0 ? `Rs.${c.pending.toFixed(2)}` : "Paid"}
        </td>
      </tr>
    `,
    )
    .join("");

  document.getElementById("reportsContent").innerHTML = `
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      ${[
        [
          "Total Revenue",
          `Rs.${totalRevenue.toFixed(2)}`,
          "border-l-accent",
          "text-accent",
        ],
        [
          "Total Cost",
          `Rs.${totalCost.toFixed(2)}`,
          "border-l-gray-400",
          "text-gray-700",
        ],
        [
          "Net Profit",
          `Rs.${totalProfit.toFixed(2)}`,
          "border-l-primary",
          totalProfit >= 0 ? "text-green-700" : "text-red-600",
        ],
        ["Total Sold", `${totalQty} kg`, "border-l-gray-400", "text-gray-900"],
        [
          "Amount Collected",
          `Rs.${totalPaid.toFixed(2)}`,
          "border-l-success",
          "text-green-700",
        ],
        [
          "Still Pending",
          `Rs.${totalPending.toFixed(2)}`,
          "border-l-danger",
          "text-danger",
        ],
      ]
        .map(
          ([label, val, border, textCl]) => `
        <div class="bg-white border border-gray-200 border-l-4 ${border} p-4">
          <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">${label}</p>
          <p class="text-xl font-black ${textCl}">${val}</p>
        </div>
      `,
        )
        .join("")}
    </div>

    <div class="bg-white border border-gray-200 p-5 mb-6">
      <p class="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Batch Cost Analysis</p>
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div class="bg-gray-50 p-3">
          <p class="text-muted text-xs mb-1">Your Cost/kg</p>
          <p class="font-black text-primary">Rs.${currentBatch.costPerKg?.toFixed(2)}</p>
        </div>
        <div class="bg-gray-50 p-3">
          <p class="text-muted text-xs mb-1">Avg Selling Rate</p>
          <p class="font-black text-accent">Rs.${totalQty > 0 ? (totalRevenue / totalQty).toFixed(2) : 0}</p>
        </div>
        <div class="bg-gray-50 p-3">
          <p class="text-muted text-xs mb-1">Avg Profit/kg</p>
          <p class="font-black ${totalProfit >= 0 ? "text-green-700" : "text-red-600"}">
            Rs.${totalQty > 0 ? (totalProfit / totalQty).toFixed(2) : 0}
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white border border-gray-200 p-5">
      <p class="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Customer Breakdown</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-xs text-muted uppercase tracking-wider">
              <th class="pb-3 text-left font-semibold">Customer</th>
              <th class="pb-3 text-center font-semibold">Qty</th>
              <th class="pb-3 text-center font-semibold">Amount</th>
              <th class="pb-3 text-center font-semibold">Profit</th>
              <th class="pb-3 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ─── PDF DOWNLOAD ────────────────────────────────────────
function downloadReport() {
  if (!currentBatch) {
    showToast("No batch data loaded", "error");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const primaryR = 214,
    primaryG = 48,
    primaryB = 49;
  const pageW = 210;
  let y = 0;

  // Header bar
  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("KhataBook", 14, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Batch Report", 14, 16);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, pageW - 14, 16, {
    align: "right",
  });

  y = 30;

  // Batch name
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(currentBatch.name, 14, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Type: ${currentBatch.mirchiType?.toUpperCase()}   |   Cost/kg: Rs.${currentBatch.costPerKg?.toFixed(2)}   |   Stock Left: ${currentBatch.stockRemaining} kg`,
    14,
    y,
  );
  y += 10;

  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  // Financial Summary
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Financial Summary", 14, y);
  y += 6;

  const totalRevenue = allSales.reduce((s, x) => s + x.totalAmount, 0);
  const totalProfit = allSales.reduce((s, x) => s + x.profitOnSale, 0);
  const totalQty = allSales.reduce((s, x) => s + x.qtyKg, 0);
  const totalPending = allSales
    .filter((x) => x.paymentStatus !== "paid")
    .reduce((s, x) => s + (x.totalAmount - x.amountPaid), 0);

  const summaryData = [
    ["Total Revenue", `Rs.${totalRevenue.toFixed(2)}`],
    ["Total Cost", `Rs.${(totalQty * currentBatch.costPerKg).toFixed(2)}`],
    ["Net Profit", `Rs.${totalProfit.toFixed(2)}`],
    ["Total Sold", `${totalQty} kg`],
    ["Total Pending", `Rs.${totalPending.toFixed(2)}`],
  ];

  summaryData.forEach(([label, val], i) => {
    const col = i % 2 === 0 ? 14 : 110;
    if (i % 2 === 0 && i > 0) y += 8;
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(col, y - 4, 90, 10, "F");
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(label, col + 3, y + 1);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(val, col + 3, y + 6);
  });
  y += 16;

  doc.line(14, y, pageW - 14, y);
  y += 8;

  // Sales Table Header
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Sales Details", 14, y);
  y += 6;

  // Table header row
  doc.setFillColor(primaryR, primaryG, primaryB);
  doc.rect(14, y, pageW - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text("Customer", 17, y + 5.5);
  doc.text("Date", 60, y + 5.5);
  doc.text("Qty (kg)", 90, y + 5.5);
  doc.text("Rate", 112, y + 5.5);
  doc.text("Total", 134, y + 5.5);
  doc.text("Profit", 156, y + 5.5);
  doc.text("Status", 178, y + 5.5);
  y += 10;

  allSales.forEach((s, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const date = s.saleDate?._seconds
      ? new Date(s.saleDate._seconds * 1000).toLocaleDateString("en-IN")
      : "—";

    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(14, y - 3, pageW - 28, 8, "F");
    }

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(s.customerName.substring(0, 18), 17, y + 2);
    doc.text(date, 60, y + 2);
    doc.text(String(s.qtyKg), 90, y + 2);
    doc.text(`Rs.${s.sellingRate}`, 112, y + 2);
    doc.text(`Rs.${s.totalAmount}`, 134, y + 2);

    const profitColor = s.profitOnSale >= 0 ? [0, 120, 80] : [180, 30, 30];
    doc.setTextColor(...profitColor);
    doc.text(`Rs.${s.profitOnSale?.toFixed(2)}`, 156, y + 2);

    const stColor =
      s.paymentStatus === "paid"
        ? [0, 120, 80]
        : s.paymentStatus === "partial"
          ? [180, 120, 0]
          : [180, 30, 30];
    doc.setTextColor(...stColor);
    doc.setFont("helvetica", "bold");
    doc.text(s.paymentStatus.toUpperCase(), 178, y + 2);

    doc.setTextColor(30, 30, 30);
    y += 8;
  });

  // Footer
  doc.setDrawColor(230, 230, 230);
  doc.line(14, 285, pageW - 14, 285);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text("KhataBook — Private Business Report", 14, 290);
  doc.text(`Page 1`, pageW - 14, 290, { align: "right" });

  doc.save(`${currentBatch.name.replace(/\s+/g, "_")}_Report.pdf`);
  showToast("PDF downloaded successfully", "success");
}
