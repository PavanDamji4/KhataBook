const { db, admin } = require("../config/firebase");

const COLLECTION = "batches";

// Create new batch
const createBatch = async (req, res, next) => {
  try {
    const {
      name,
      mirchiType,
      purchaseDate,
      rawQty,
      rawRate,
      dryingCost,
      saltCost,
      oilCost,
      grindingCost,
      finalPowderQty,
    } = req.body;

    // Calculate costPerKg
    const totalCost =
      rawQty * rawRate +
      Number(dryingCost) +
      Number(saltCost) +
      Number(oilCost) +
      Number(grindingCost);

    const costPerKg = totalCost / finalPowderQty;

    const batchData = {
      name,
      mirchiType,
      purchaseDate: admin.firestore.Timestamp.fromDate(new Date(purchaseDate)),
      rawQty: Number(rawQty),
      rawRate: Number(rawRate),
      dryingCost: Number(dryingCost),
      saltCost: Number(saltCost),
      oilCost: Number(oilCost),
      grindingCost: Number(grindingCost),
      finalPowderQty: Number(finalPowderQty),
      costPerKg: parseFloat(costPerKg.toFixed(2)),
      stockRemaining: Number(finalPowderQty),
      createdAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await db.collection(COLLECTION).add(batchData);

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      id: docRef.id,
      data: batchData,
    });
  } catch (err) {
    next(err);
  }
};

// Get all batches
const getAllBatches = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    const batches = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, data: batches });
  } catch (err) {
    next(err);
  }
};

// Get single batch by ID
const getBatchById = async (req, res, next) => {
  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Batch not found" });
    }

    res
      .status(200)
      .json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    next(err);
  }
};

// Update batch
const updateBatch = async (req, res, next) => {
  try {
    const batchRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await batchRef.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Batch not found" });
    }

    await batchRef.update(req.body);

    res
      .status(200)
      .json({ success: true, message: "Batch updated successfully" });
  } catch (err) {
    next(err);
  }
};

// Delete batch
// Delete batch + all related sales and payments
const deleteBatch = async (req, res, next) => {
  try {
    const batchRef = db.collection(COLLECTION).doc(req.params.id);
    const doc = await batchRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    const batchId = req.params.id;

    // Delete all sales of this batch
    const salesSnap = await db.collection("sales").where("batchId", "==", batchId).get();
    const deletePromises = salesSnap.docs.map(d => d.ref.delete());
    await Promise.all(deletePromises);

    // Delete all payments of this batch
    const paymentsSnap = await db.collection("payments").where("batchId", "==", batchId).get();
    const deletePayments = paymentsSnap.docs.map(d => d.ref.delete());
    await Promise.all(deletePayments);

    // Delete the batch itself
    await batchRef.delete();

    res.status(200).json({
      success: true,
      message: "Batch and all related data deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
};
