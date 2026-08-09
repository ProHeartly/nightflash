document.addEventListener('DOMContentLoaded', () => {
    const globalToggle = document.getElementById('globalToggle');
    const sizeBtns = document.querySelectorAll('#sizePresets .preset-btn');
    const tempBtns = document.querySelectorAll('#tempPresets .preset-btn');

    chrome.storage.local.get(['nightFlashState', 'nfSize', 'nfTemp'], (result) => {
        globalToggle.checked = result.nightFlashState !== false;

        if (result.nfSize) updateActiveButton(sizeBtns, result.nfSize, 'size');
        if (result.nfTemp) updateActiveButton(tempBtns, result.nfTemp, 'temp');
    });

    globalToggle.addEventListener('change', (e) => {
        const isExActive = e.target.checked;
        chrome.storage.local.set({ nightFlashState: isExActive });

        chrome.tabs.query({ active:true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    command: "toggleGlobal",
                    state: isExActive
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log("Night Flash: Tab not active or restricted page.")
                    }
                });
            }
        });

        console.log("Night Flash Global State:", isExActive);
    });

    sizeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sizeVal = e.target.getAttribute('data-size');
            chrome.storage.local.set({ nfSize: sizeVal });
            updateActiveButton(sizeBtns, sizeVal, 'size');
        });
    });

    tempBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tempVal = e.target.getAttribute('data-temp');
            chrome.storage.local.set({ nfTemp: tempVal });
            updateActiveButton(tempBtns, tempVal, 'temp');
        });
    });

    function updateActiveButton(button, targetVal, type) {
        button.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute(`data-${type}`) == targetVal) {
                btn.classList.add('active');
            }
        });
    }
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.nfSize) {
                updateActiveButton(sizeBtns, parseInt(changes.nfSize.newValue), 'size');
            }

            if (changes.nfTemp) {
                updateActiveButton(tempBtns, changes.nfTemp.newValue, 'temp');
            }

            if (changes.nightFlashState) {
                globalToggle.checked = changes.nightFlashState.newValue;
            }
        }
    });
});