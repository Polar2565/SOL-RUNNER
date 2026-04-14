function getWalletInfo(req, res) {
  return res.status(200).json({
    ok: true,
    message: "Wallet controller disponible",
    note: "La integración de Phantom se maneja desde el frontend",
  });
}

module.exports = {
  getWalletInfo,
};