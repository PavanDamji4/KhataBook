const { db, admin } = require("../config/firebase");

const COLLECTION = "customers";

// Create customer
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    const customerData = {
      name,
      phone: Number(phone),
      address,
      createdAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await db.collection(COLLECTION).add(customerData);

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      id: docRef.id,
      data: customerData,
    });
  } catch (err) {
    next(err);
  }
};

// Get all customers
const getAllCustomers = async (req, res, next) => {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
};

// Get single customer
const getCustomerById = async (req, res, next) => {
  try {
    const doc = await db.collection(COLLECTION).doc(req.params.id).get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    res
      .status(200)
      .json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (err) {
    next(err);
  }
};

// Update customer
const updateCustomer = async (req, res, next) => {
  try {
    const ref = db.collection(COLLECTION).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    await ref.update(req.body);

    res
      .status(200)
      .json({ success: true, message: "Customer updated successfully" });
  } catch (err) {
    next(err);
  }
};

// Delete customer
const deleteCustomer = async (req, res, next) => {
  try {
    const ref = db.collection(COLLECTION).doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    await ref.delete();

    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
