
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


function animate() {
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

    let targetRadius = isSleeping ? 0: 180;

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

    if (displayRadius < 0) displayRadius = 0;

    let drawX = fluidHole.x + wobbleX;
    let drawY = fluidHole.y + wobbleY;

    ctx.globalCompositeOperation = 'destination-out';
    

    let mainGradient = ctx.createRadialGradient(drawX, drawY, 20, drawX, drawY, displayRadius);
    mainGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    mainGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(drawX, drawY, displayRadius, 0, Math.PI * 2);
    ctx.fill();

    if (displayRadius > 2) {
        ctx.globalCompositeOperation = 'source-over';
        
        let glowRadius = displayRadius + 10;
        let amberGradient = ctx.createRadialGradient(drawX, drawY, 10, drawX, drawY, glowRadius);

        amberGradient.addColorStop(0, `rgba(255, 179, 71, ${emberCenter})`);
        amberGradient.addColorStop(0.5, `rgba(255, 179, 71, ${emberMid})`);
        amberGradient.addColorStop(1, 'rgba(255, 179, 71, 0)');
        
        ctx.fillStyle = amberGradient;
        ctx.beginPath();
        ctx.arc(drawX, drawY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(animate);
}

animate();