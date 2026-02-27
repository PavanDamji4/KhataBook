const { db, admin } = require("../config/firebase");

const COLLECTION = "payments";

// Add payment
const addPayment = async (req, res, next) => {
  try {
    const { saleId, batchId, customerId, customerName, amountPaid, note } =
      req.body;

    // Get the sale
    const saleRef = db.collection("sales").doc(saleId);
    const saleDoc = await saleRef.get();

    if (!saleDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    const sale = saleDoc.data();
    const newAmountPaid = sale.amountPaid + Number(amountPaid);
    const totalAmount = sale.totalAmount;

    // Determine new payment status
    let newStatus = "partial";
    if (newAmountPaid >= totalAmount) {
      newStatus = "paid";
    }

    // Save payment record
    const paymentData = {
      saleId,
      batchId,
      customerId,
      customerName,
      amountPaid: Number(amountPaid),
      paymentDate: admin.firestore.Timestamp.now(),
      note: note || "",
    };

    await db.collection(COLLECTION).add(paymentData);

    // Update sale amountPaid and paymentStatus
    await saleRef.update({
      amountPaid: newAmountPaid,
      paymentStatus: newStatus,
    });

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      newStatus,
      totalPaid: newAmountPaid,
    });
  } catch (err) {
    next(err);
  }
};

// Get all payments for a batch (udhaar tracker)
const getPaymentsByBatch = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where("batchId", "==", req.params.batchId)
      .orderBy("paymentDate", "desc")
      .get();

    const payments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

// Get unpaid/partial sales for a batch (udhaar list)
const getUdhaarByBatch = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection("sales")
      .where("batchId", "==", req.params.batchId)
      .where("paymentStatus", "in", ["unpaid", "partial"])
      .get();

    const udhaar = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, data: udhaar });
  } catch (err) {
    next(err);
  }
};

module.exports = { addPayment, getPaymentsByBatch, getUdhaarByBatch };
