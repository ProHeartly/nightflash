
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
    ctx.fillStyle = 'rgba(10, 15, 20, 0.95)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'destination-out';

    let speed = Math.sqrt(fluidHole.vx * fluidHole.vx + fluidHole.vy * fluidHole.vy);

    let angle = Math.atan2(fluidHole.vy, fluidHole.vx);

    let stretch = 1 + Math.min(speed * 0.03, 1.5);
    let squish = 1 - Math.min(speed * 0.015, 0.05);

    ctx.save();
    ctx.translate(fluidHole.x, fluidHole.y);

    if (speed > 0.1) {
        ctx.rotate(angle);
    }

    ctx.scale(stretch, squish);

    let gradient = ctx.createRadialGradient(
        0, 0, 20,
        0, 0, 180
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    requestAnimationFrame(animate);
}

animate();