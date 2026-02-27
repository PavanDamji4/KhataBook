const { db, admin } = require("../config/firebase");

const COLLECTION = "sales";

// Create sale
const createSale = async (req, res, next) => {
  try {
    const {
      batchId,
      batchName,
      customerId,
      customerName,
      qtyKg,
      sellingRate,
      paymentStatus,
      amountPaid,
      saleDate,
    } = req.body;

    // Get batch to fetch costPerKg and check stock
    const batchDoc = await db.collection("batches").doc(batchId).get();
    if (!batchDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Batch not found" });
    }

    const batch = batchDoc.data();

    if (batch.stockRemaining < qtyKg) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock. Available: ${batch.stockRemaining} kg`,
      });
    }

    const totalAmount = Number(sellingRate) * Number(qtyKg);
    const profitOnSale =
      (Number(sellingRate) - batch.costPerKg) * Number(qtyKg);

    const saleData = {
      batchId,
      batchName,
      customerId,
      customerName,
      qtyKg: Number(qtyKg),
      sellingRate: Number(sellingRate),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      profitOnSale: parseFloat(profitOnSale.toFixed(2)),
      paymentStatus,
      amountPaid: Number(amountPaid),
      saleDate: admin.firestore.Timestamp.fromDate(new Date(saleDate)),
    };

    // Save sale
    const saleRef = await db.collection(COLLECTION).add(saleData);

    // Reduce stock in batch
    await db
      .collection("batches")
      .doc(batchId)
      .update({
        stockRemaining: parseFloat(
          (batch.stockRemaining - Number(qtyKg)).toFixed(3),
        ),
      });
    
    res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      id: saleRef.id,
      data: saleData,
    });
  } catch (err) {
    next(err);
  }
};

// Get all sales
const getAllSales = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("saleDate", "desc")
      .get();

    const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
};

// Get sales by batch
const getSalesByBatch = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where("batchId", "==", req.params.batchId)
      .orderBy("saleDate", "desc")
      .get();

    const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
};

// Get sales by customer
const getSalesByCustomer = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .where("customerId", "==", req.params.customerId)
      .orderBy("saleDate", "desc")
      .get();

    const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({ success: true, data: sales });
  } catch (err) {
    next(err);
  }
};

// Update sale payment status
const updateSale = async (req, res, next) => {
  try {
    const ref = db.collection(COLLECTION).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    await ref.update(req.body);

    res
      .status(200)
      .json({ success: true, message: "Sale updated successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSale,
  getAllSales,
  getSalesByBatch,
  getSalesByCustomer,
  updateSale,
};
