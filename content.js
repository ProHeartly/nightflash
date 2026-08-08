
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


window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
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

    ctx.globalCompositeOperation = 'destination-out';
    

    let mainGradient = ctx.createRadialGradient(fluidHole.x, fluidHole.y, 20, fluidHole.x, fluidHole.y, 180);
    mainGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    mainGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(fluidHole.x, fluidHole.y, 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    
    let amberGradient = ctx.createRadialGradient(fluidHole.x, fluidHole.y, 10, fluidHole.x, fluidHole.y, 190);

    amberGradient.addColorStop(0, 'rgba(255, 179, 71, 0.15)');
    amberGradient.addColorStop(0.5, 'rgba(255, 179, 71, 0.05)');
    amberGradient.addColorStop(1, 'rgba(255, 179, 71, 0)');
    
    ctx.fillStyle = amberGradient;
    ctx.beginPath();
    ctx.arc(fluidHole.x, fluidHole.y, 190, 0, Math.PI * 2);
    ctx.fill();
    
    requestAnimationFrame(animate);
}

animate();