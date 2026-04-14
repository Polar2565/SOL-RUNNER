(function () {
  const modals = {
    store: document.getElementById("storeModal"),
    oracle: document.getElementById("oracleModal"),
  };

  let activeModal = null;

  function emitModalChanged() {
    window.dispatchEvent(
      new CustomEvent("solrunner:modal-changed", {
        detail: {
          activeModal,
          hasActiveModal: !!activeModal,
        },
      })
    );
  }

  function open(name) {
    const modal = modals[name];
    if (!modal) return;

    Object.values(modals).forEach((item) => {
      item?.classList.remove("active");
      item?.setAttribute("aria-hidden", "true");
    });

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    activeModal = name;
    emitModalChanged();
  }

  function close(name) {
    const modal = modals[name];
    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    if (activeModal === name) {
      activeModal = null;
    }

    emitModalChanged();
  }

  function closeAll() {
    Object.values(modals).forEach((modal) => {
      modal?.classList.remove("active");
      modal?.setAttribute("aria-hidden", "true");
    });

    activeModal = null;
    emitModalChanged();
  }

  function getActiveModal() {
    return activeModal;
  }

  function hasActiveModal() {
    return !!activeModal;
  }

  function bindBackdropClose() {
    document.querySelectorAll("[data-close-modal]").forEach((el) => {
      el.addEventListener("click", () => {
        const modalName = el.getAttribute("data-close-modal");
        if (modalName) {
          close(modalName);
        }
      });
    });
  }

  function bindCloseButtons() {
    const closeStoreBtn = document.getElementById("closeStoreModalBtn");
    const closeOracleBtn = document.getElementById("closeOracleModalBtn");

    closeStoreBtn?.addEventListener("click", () => close("store"));
    closeOracleBtn?.addEventListener("click", () => close("oracle"));
  }

  function initModalManager() {
    bindBackdropClose();
    bindCloseButtons();
  }

  window.solRunnerModalManager = {
    initModalManager,
    open,
    close,
    closeAll,
    getActiveModal,
    hasActiveModal,
  };
})();