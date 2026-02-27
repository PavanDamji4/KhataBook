const express = require("express");
const router = express.Router();
const {
  addPayment,
  getPaymentsByBatch,
  getUdhaarByBatch,
} = require("../controllers/paymentController");

router.post("/", addPayment);
router.get("/batch/:batchId", getPaymentsByBatch);
router.get("/udhaar/:batchId", getUdhaarByBatch);

module.exports = router;
