const { app, PORT } = require("./app");

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});