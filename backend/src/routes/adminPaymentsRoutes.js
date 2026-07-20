import express from "express";

import {
getPendingPayments,
approvePayment,
rejectPayment
}
from "../controllers/adminPaymentsController.js";


import {
requireAuth,
requireAdmin
}
from "../middleware/auth.js";


const router = express.Router();



router.get(
"/pending",
requireAuth,
requireAdmin,
getPendingPayments
);



router.post(
"/:paymentId/approve",
requireAuth,
requireAdmin,
approvePayment
);



router.post(
"/:paymentId/reject",
requireAuth,
requireAdmin,
rejectPayment
);



export default router;
