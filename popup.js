// --Popup screen script

document.addEventListener('DOMContentLoaded', () => {
    const globalToggle = document.getElementById('globalToggle');
    const sizeBtns = document.querySelectorAll('#sizePresets .preset-btn');
    const tempBtns = document.querySelectorAll('#tempPresets .preset-btn');
    const fireflySlider = document.getElementById('fireflySlider');
    const fireflyCountValue = document.getElementById('fireflyCountValue');

    chrome.storage.local.get(['nightFlashState', 'nfSize', 'nfTemp', 'nfFireflies'], (result) => {
        globalToggle.checked = result.nightFlashState !== false;

        if (result.nfSize) updateActiveButton(sizeBtns, result.nfSize, 'size');
        if (result.nfTemp) updateActiveButton(tempBtns, result.nfTemp, 'temp');

        let count = result.nfFireflies !== undefined ? result.nfFireflies : 40;
        fireflySlider.value = count;
        fireflyCountValue.textContent = count;
    });

    fireflySlider.addEventListener('input', (e) => {
        let count = parseInt(e.target.value);
        fireflyCountValue.textContent = count;
        chrome.storage.local.set({ nfFireflies: count });
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