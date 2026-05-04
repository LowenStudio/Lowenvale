const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const revealItems = document.querySelectorAll("[data-reveal]");
const boardLists = document.querySelectorAll("[data-board-list]");
const boardCount = document.querySelector("[data-board-count]");
const boardPagination = document.querySelector("[data-board-pagination]");
const noticeModal = document.querySelector("[data-notice-modal]");
const noticeModalPanel = document.querySelector("[data-notice-modal-panel]");
const noticeModalDate = document.querySelector("[data-notice-modal-date]");
const noticeModalTitle = document.querySelector("[data-notice-modal-title]");
const noticeModalContents = document.querySelector("[data-notice-modal-contents]");
const noticeModalAttachments = document.querySelector("[data-notice-modal-attachments]");
const noticeModalCloseButtons = document.querySelectorAll("[data-notice-modal-close]");

if (menuButton && mobileMenu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.classList.toggle("hidden", isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      mobileMenu.classList.add("hidden");
    });
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if (boardLists.length) {
  const boardItems = Array.isArray(window.lowenvaleBoard) ? window.lowenvaleBoard : [];

  boardLists.forEach((list) => {
    const limit = Number(list.dataset.boardLimit);
    const pageSize = Number(list.dataset.boardPageSize);

    if (Number.isFinite(pageSize) && pageSize > 0) {
      renderPaginatedBoard(list, boardItems, pageSize, 1);
      return;
    }

    const visibleItems = Number.isFinite(limit) && limit > 0 ? boardItems.slice(0, limit) : boardItems;
    renderBoardItems(list, visibleItems, 0);
  });

  if (boardCount) {
    boardCount.textContent = `${boardItems.length} ${boardItems.length === 1 ? "notice" : "notices"}`;
  }

  document.addEventListener("click", (event) => {
    const noticeButton = event.target.closest("[data-notice-index]");

    if (!noticeButton) {
      return;
    }

    const noticeIndex = Number(noticeButton.dataset.noticeIndex);
    const notice = boardItems[noticeIndex];

    if (notice) {
      openNoticeModal(notice);
    }
  });
}

function renderBoardItems(list, items, startIndex) {
  if (!items.length) {
    list.innerHTML = `
      <div class="border border-line bg-white p-6">
        <p class="font-bold text-ink">No notices published yet.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items.map((item, index) => renderBoardItem(item, startIndex + index)).join("");
}

function renderPaginatedBoard(list, items, pageSize, currentPage) {
  const totalPages = Math.ceil(items.length / pageSize);
  const safePage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const startIndex = (safePage - 1) * pageSize;
  const visibleItems = items.slice(startIndex, startIndex + pageSize);

  renderBoardItems(list, visibleItems, startIndex);

  if (!boardPagination) {
    return;
  }

  if (totalPages <= 1) {
    boardPagination.innerHTML = "";
    return;
  }

  boardPagination.innerHTML = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const isActive = page === safePage;

    return `
      <button
        type="button"
        class="h-10 min-w-10 rounded-md border px-3 text-sm font-bold transition ${
          isActive
            ? "border-ink bg-ink text-white"
            : "border-line bg-white text-ink hover:border-harbor hover:text-harbor"
        }"
        data-board-page="${page}"
        aria-label="Go to notice page ${page}"
        ${isActive ? 'aria-current="page"' : ""}
      >
        ${page}
      </button>
    `;
  }).join("");

  boardPagination.querySelectorAll("[data-board-page]").forEach((button) => {
    button.addEventListener("click", () => {
      renderPaginatedBoard(list, items, pageSize, Number(button.dataset.boardPage));
    });
  });
}

if (noticeModal) {
  noticeModalCloseButtons.forEach((button) => {
    button.addEventListener("click", closeNoticeModal);
  });

  noticeModal.addEventListener("click", (event) => {
    if (!noticeModalPanel || noticeModalPanel.contains(event.target)) {
      return;
    }

    closeNoticeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !noticeModal.classList.contains("hidden")) {
      closeNoticeModal();
    }
  });
}

function renderBoardItem(item, index) {
  const date = escapeHtml(item.uploadedDate || item.date || "");
  const title = escapeHtml(item.title || "Untitled notice");
  const contents = escapeHtml(item.contents || item.summary || item.details || "");
  const attachments = normalizeAttachments(item.attachments);
  const attachmentLabel = attachments.length === 1 ? "1 attachment" : `${attachments.length} attachments`;

  return `
    <article class="border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-harbor hover:shadow-soft">
      <button
        type="button"
        class="block w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-harbor"
        data-notice-index="${index}"
      >
        <time class="text-sm font-bold text-harbor" datetime="${date}">Uploaded: ${date}</time>
        <h3 class="mt-5 text-xl font-extrabold tracking-tight text-ink">${title}</h3>
        <p class="mt-3 leading-7 text-slate-700">${contents}</p>
        ${attachments.length ? `<p class="mt-4 text-sm font-bold text-slate-500">${attachmentLabel}</p>` : ""}
      </button>
      ${attachments.length ? `<div class="border-t border-line px-6 py-4">${renderAttachments(attachments)}</div>` : ""}
    </article>
  `;
}

function openNoticeModal(item) {
  if (!noticeModal || !noticeModalDate || !noticeModalTitle || !noticeModalContents || !noticeModalAttachments) {
    return;
  }

  const date = item.uploadedDate || item.date || "";
  const title = item.title || "Untitled notice";
  const contents = item.contents || item.summary || item.details || "";
  const attachments = normalizeAttachments(item.attachments);

  noticeModalDate.textContent = `Uploaded: ${date}`;
  noticeModalDate.dateTime = date;
  noticeModalTitle.textContent = title;
  noticeModalContents.textContent = contents;
  noticeModalAttachments.innerHTML = attachments.length
    ? `
      <div class="mt-6 border-t border-line pt-5">
        <p class="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Attachments</p>
        <div class="mt-4">${renderAttachments(attachments)}</div>
      </div>
    `
    : "";
  noticeModal.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");

  const closeButton = noticeModal.querySelector("[data-notice-modal-close]");

  if (closeButton) {
    closeButton.focus();
  }
}

function closeNoticeModal() {
  if (!noticeModal) {
    return;
  }

  noticeModal.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function normalizeAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .map((attachment) => {
      if (typeof attachment === "string") {
        return {
          name: attachment.split("/").pop() || attachment,
          url: attachment,
        };
      }

      return {
        name: attachment.name || attachment.url || "Attachment",
        url: attachment.url || "",
      };
    })
    .filter((attachment) => attachment.url);
}

function renderAttachments(attachments) {
  return `
    <ul class="space-y-2">
      ${attachments
        .map((attachment) => {
          const name = escapeHtml(attachment.name);
          const url = escapeHtml(attachment.url);

          return `
            <li>
              <a
                href="${url}"
                class="inline-flex max-w-full items-center gap-2 break-all rounded-md border border-line px-3 py-2 text-sm font-bold text-ink transition hover:border-harbor hover:text-harbor"
                target="_blank"
                rel="noopener"
              >
                <span aria-hidden="true">File</span>
                <span>${name}</span>
              </a>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
