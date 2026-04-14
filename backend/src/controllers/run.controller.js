const {
  startRun,
  completeRun,
  abandonRun,
} = require("../services/run.service");

async function startRunController(req, res) {
  try {
    const result = await startRun(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("ERROR RUN START:", error);

    return res.status(500).json({
      ok: false,
      message: "Error iniciando la run",
      error: error.message,
    });
  }
}

function completeRunController(req, res) {
  try {
    const result = completeRun(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("ERROR RUN COMPLETE:", error);

    return res.status(500).json({
      ok: false,
      message: "Error registrando la run",
      error: error.message,
    });
  }
}

function abandonRunController(req, res) {
  try {
    const result = abandonRun(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("ERROR RUN ABANDON:", error);

    return res.status(500).json({
      ok: false,
      message: "Error abandonando la run",
      error: error.message,
    });
  }
}

module.exports = {
  startRunController,
  completeRunController,
  abandonRunController,
};