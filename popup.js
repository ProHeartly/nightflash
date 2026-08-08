document.addEventListener('DOMContentLoaded', () => {
    const globalToggle = document.getElementById('globalToggle');

    chrome.storage.local.get(['nightFlashState'], (result) => {
        globalToggle.checked = result.nightFlashState !== false;
    });

    globalToggle.addEventListener('change', (e) => {
        const isExActive = e.target.checked;
        chrome.storage.local.set({ nightFlashState: isExActive });

        chrome.tabs.query({ active:true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    command: "toggleGlobal",
                    state: isExActive
                });
            }
        });

        console.log("Night Flash Global State:", isExActive);
    });
});