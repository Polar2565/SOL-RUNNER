(function () {
  const CONTAINER_ID = "toastContainer";

  function ensureContainer() {
    let container = document.getElementById(CONTAINER_ID);

    if (!container) {
      container = document.createElement("div");
      container.id = CONTAINER_ID;
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    return container;
  }

  function show(message, type = "info", duration = 3200) {
    const container = ensureContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;

    toast.innerHTML = `
      <div class="toast__content">
        <div class="toast__title">${getTitle(type)}</div>
        <div class="toast__message">${message}</div>
      </div>
      <button class="toast__close" type="button" aria-label="Cerrar">×</button>
    `;

    const closeBtn = toast.querySelector(".toast__close");
    const removeToast = () => {
      toast.classList.add("toast--hide");
      setTimeout(() => toast.remove(), 220);
    };

    closeBtn.addEventListener("click", removeToast);

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("toast--show");
    });

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  }

  function getTitle(type) {
    switch (type) {
      case "success":
        return "Éxito";
      case "error":
        return "Error";
      case "warning":
        return "Aviso";
      default:
        return "Información";
    }
  }

  window.solRunnerNotify = {
    success(message, duration) {
      show(message, "success", duration);
    },
    error(message, duration) {
      show(message, "error", duration);
    },
    warning(message, duration) {
      show(message, "warning", duration);
    },
    info(message, duration) {
      show(message, "info", duration);
    },
  };
})();