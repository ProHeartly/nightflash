
const canvas = document.createElement('canvas');

canvas.id = 'nf-canvas';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


canvas.setAttribute('popover', 'manual')
document.body.appendChild(canvas);
canvas.showPopover();


const ctx = canvas.getContext('2d');
let w, h;

const clouds = [];
const spacing = 45;


function initCloud() {
    clouds.length = 0;
    for (let x = -spacing; x < w + spacing; x += spacing) {
        for (let y = -spacing; y < h + spacing; y += spacing) {
            clouds.push({
                x: x + (Math.random() * 10 - 5),
                y: y + (Math.random() * 10 - 5),
                maxRadius: 35 + Math.random() * 25,
                currentRadius: 28
            });
        }
    }
}

function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
}

window.addEventListener('resize', () => {
    resize();
    initCloud();
});
resize();
initCloud();

const fireflies = [];
const NUM_FIREFLIES = 40;

for (let i = 0; i < NUM_FIREFLIES; i++) {
    fireflies.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2 + 1
    });
}

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

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(2, 6, 9, 0.95)';

    clouds.forEach(cloud => {
        let cdx = cloud.x - drawX;
        let cdy = cloud.y - drawY;
        let distance = Math.sqrt(cdx * cdx + cdy * cdy);

        let target = distance < (safeRadius + 20) ? 0: cloud.maxRadius;

        let speed = target === 0 ? 0.6 : 0.05;

        if (distance < safeRadius * 0.5) speed = 0.9;

        cloud.currentRadius += (target - cloud.currentRadius) * speed;

        if (cloud.currentRadius > 0.5) {
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

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

    ctx.globalCompositeOperation = 'source-over';

    fireflies.forEach(f => {
        f.vx += (Math.random() - 0.5) * 0.3;
        f.vy += (Math.random() - 0.5) * 0.3;

        let speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
        if (speed > 2) {
            f.vx = (f.vx / speed) * 2;
            f.vy = (f.vy / speed) * 2;
        }

        let fdx = f.x - drawX;
        let fdy = f.y - drawY;
        let dist = Math.sqrt(fdx * fdx + fdy * fdy);

        if (dist < safeRadius + 80) {
            f.vx += (fdx / dist) * 1.5;
            f.vx += (fdy / dist) * 1.5;
        }

        f.x += f.vx;
        f.y += f.vy;

        if (f.x < 0) f.x = w;
        if (f.x > w) f.x = 0;
        if (f.y < 0) f.y = h;
        if (f.y > h) f.y = 0;

        ctx.fillStyle = `rgba(173, 225, 47, ${Math.random() * 0.5 + 0.5})`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
    });

    requestAnimationFrame(animate);
}

animate();