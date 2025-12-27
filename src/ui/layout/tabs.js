export function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    function activateTab(tabName) {
        tabButtons.forEach(btn =>
            btn.classList.toggle("active", btn.dataset.tab === tabName)
        );

        tabContents.forEach(section =>
            section.classList.toggle("active", section.id === `tab-${tabName}`)
        );
    }

    tabButtons.forEach(btn =>
        btn.addEventListener("click", () =>
            activateTab(btn.dataset.tab)
        )
    );

    activateTab("auth");
}
