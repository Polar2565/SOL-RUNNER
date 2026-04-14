(function () {
  function safeInit(fn) {
    try {
      if (typeof fn === "function") {
        fn();
      }
    } catch (error) {
      console.error("Error inicializando módulo:", error);
    }
  }

  function bootstrapModules() {
    safeInit(window.solRunnerModalManager?.initModalManager);
    safeInit(window.solRunnerLoginScreen?.initLoginScreen);
    safeInit(window.solRunnerMenuScreen?.initMenuScreen);
    safeInit(window.solRunnerStoreScreen?.initStoreScreen);
    safeInit(window.solRunnerOracleScreen?.initOracleScreen);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapModules);
  } else {
    bootstrapModules();
  }
})();