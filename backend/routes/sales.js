const express = require("express");
const router = express.Router();
const {
  createSale,
  getAllSales,
  getSalesByBatch,
  getSalesByCustomer,
  updateSale,
} = require("../controllers/saleController");

router.post("/", createSale);
router.get("/", getAllSales);
router.get("/batch/:batchId", getSalesByBatch);
router.get("/customer/:customerId", getSalesByCustomer);
router.put("/:id", updateSale);

module.exports = router;
