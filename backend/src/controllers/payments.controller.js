const {
  getEntryPaymentConfig,
  verifyEntryPayment,
} = require("../services/payments.service");

function getEntryPayment(req, res) {
  try {
    const { floor } = req.params;
    const data = getEntryPaymentConfig(floor);

    return res.status(200).json({
      ok: true,
      message: "Configuración de pago obtenida correctamente",
      data,
    });
  } catch (error) {
    console.error("ERROR ENTRY PAYMENT:", error);

    return res.status(500).json({
      ok: false,
      message: "Error obteniendo la configuración de pago",
      error: error.message,
    });
  }
}

async function verifyEntryPaymentController(req, res) {
  try {
    const result = await verifyEntryPayment(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("ERROR VERIFY ENTRY PAYMENT:", error);

    return res.status(500).json({
      ok: false,
      message: "Error verificando el pago de entrada",
      error: error.message,
    });
  }
}

module.exports = {
  getEntryPayment,
  verifyEntryPaymentController,
};