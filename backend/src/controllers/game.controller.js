const { getEconomyPreviewForFloor } = require("../services/economy.service");

function getEconomyPreview(req, res) {
  try {
    const { floor } = req.params;
    const preview = getEconomyPreviewForFloor(floor);

    return res.status(200).json({
      ok: true,
      message: "Economía obtenida correctamente",
      data: preview,
    });
  } catch (error) {
    console.error("ERROR ECONOMY PREVIEW:", error);

    return res.status(500).json({
      ok: false,
      message: "Error obteniendo la economía",
      error: error.message,
    });
  }
}

module.exports = {
  getEconomyPreview,
};