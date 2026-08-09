
const canvas = document.createElement('canvas');

canvas.id = 'nf-canvas';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


canvas.setAttribute('popover', 'manual')
document.body.appendChild(canvas);
canvas.showPopover();


const ctx = canvas.getContext('2d');
let w, h;

function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
}

window.addEventListener('resize', resize);
resize();

let mouse = { x: w / 2, y: h / 2 };
let fluidHole = { x: w / 2, y: h / 2, vx: 0, vy: 0 };

const TENSION = 0.05;
const DAMPENING = 0.6;

let currentRadius = 180;
let isSleeping = false;
let sleepTimer;

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    isSleeping = false;
    clearTimeout(sleepTimer);

    sleepTimer = setTimeout( () => {
        isSleeping = true;
    }, 120000);
});

let isExActive = true;
let baseRadius = 180;
let torchColor = "255, 179, 71";

chrome.storage.local.get(['nightFlashState', 'nfSize', 'nfTemp'], (result) => {
    if (result.nightFlashState === false) {
        isExActive = false;
    }
    if (result.nfSize) baseRadius = result.nfSize;
    if (result.nfTemp) torchColor = result.nfTemp;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.nightFlashState){
            isExActive = changes.nightFlashState.newValue;

            if (!isExActive) {
                ctx.clearRect(0, 0, w, h);
            }
        }
        if (changes.nfSize) {
            baseRadius = changes.nfSize.newValue;
        }

        if (changes.nfTemp) {
            torchColor = changes.nfTemp.newValue;
        }
    }
});

window.addEventListener('keydown', (e) => {
    console.log(`Night Flash heard: ${e.code} | Ctrl: ${e.ctrlKey} | Shift: ${e.shiftKey} | Alt: ${e.altKey}`);
    
    // ctrl + shift + f -> global switch
    if (e.ctrlKey && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'f') {
        chrome.storage.local.get(['nightFlashState'], (result) => {
            let current = result.nightFlashState !== false;
            chrome.storage.local.set({ nightFlashState: !current });
        });
    }

    // ctrl + shift + 1/2/3 -> torch size
    if (e.ctrlKey && e.shiftKey && !e.altKey) {
        if (e.code === 'Digit1') chrome.storage.local.set({ nfSize: 100 });
        if (e.code === 'Digit2') chrome.storage.local.set({ nfSize: 180 });
        if (e.code === 'Digit3') chrome.storage.local.set({ nfSize: 300 });
    }

    // ctrl + shift + alt + 1/2/3 -> temperature
    if (e.ctrlKey && e.shiftKey && e.altKey) {
        if (e.code === 'Digit1') chrome.storage.local.set({ nfTemp: "100,200,255" });
        if (e.code === 'Digit2') chrome.storage.local.set({ nfTemp: "255,255,255" });
        if (e.code === 'Digit3') chrome.storage.local.set({ nfTemp: "255,179,71" });
    }
});

function animate() {
    if (!isExActive) {
        ctx.clearRect(0, 0, w, h);
        requestAnimationFrame(animate);
        return;
    }


    let dx = mouse.x - fluidHole.x;
    let dy = mouse.y - fluidHole.y;

    fluidHole.vx += dx * TENSION;
    fluidHole.vy += dy * TENSION;

    fluidHole.vx *= DAMPENING;
    fluidHole.vy *= DAMPENING;

    fluidHole.x += fluidHole.vx;
    fluidHole.y += fluidHole.vy;


    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(2, 6, 9, 0.95)';
    ctx.fillRect(0, 0, w, h);

    let targetRadius = isSleeping ? 0: baseRadius;

    currentRadius += (targetRadius - currentRadius) * 0.05;
    let displayRadius = currentRadius;
    let emberCenter = 0.15;
    let emberMid = 0.05;

    let wobbleX = 0;
    let wobbleY = 0;

    if (isSleeping && currentRadius < 100 && currentRadius > 2) {
        displayRadius += (Math.random() - 0.5) * 6;
        
        wobbleX = (Math.random() - 0.5) * 10;
        wobbleY = (Math.random() - 0.5) * 10;
        
        emberCenter = 0.35;
        emberMid = 0.15;
    }

    let safeRadius = Math.max(displayRadius, 20.1);

    let drawX = fluidHole.x + wobbleX;
    let drawY = fluidHole.y + wobbleY;

    ctx.globalCompositeOperation = 'destination-out';
    

    let mainGradient = ctx.createRadialGradient(drawX, drawY, 20, drawX, drawY, safeRadius);
    mainGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    mainGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(drawX, drawY, safeRadius, 0, Math.PI * 2);
    ctx.fill();

    if (safeRadius > 2) {
        ctx.globalCompositeOperation = 'source-over';
        
        let glowRadius = displayRadius + 10;
        let amberGradient = ctx.createRadialGradient(drawX, drawY, 10, drawX, drawY, glowRadius);

        amberGradient.addColorStop(0, `rgba(${torchColor}, ${emberCenter})`);
        amberGradient.addColorStop(0.5, `rgba(${torchColor}, ${emberMid})`);
        amberGradient.addColorStop(1, `rgba(${torchColor}, 0)`);
        
        ctx.fillStyle = amberGradient;
        ctx.beginPath();
        ctx.arc(drawX, drawY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(animate);
}

animate();