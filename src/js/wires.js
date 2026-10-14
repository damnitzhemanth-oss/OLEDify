const positions = [26,42,58,74];

let tooltip = null;

function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip =document.createElement('div');
    tooltip.className ='wire-tip';
    document.body.appendChild(tooltip);
    return tooltip;
}

export function renderWires(container, pins) {
    const gaps = pins.map((pin, i) =>
        `<path class="wire-gap" d="M ${positions[i]} 100 L ${positions[i]} 0" vector-effect="non-scaling-stroke"/>`).join('');

    const wires = pins.map((pin, i) =>
        `<path class="wire wire-${pin.id}" data-pin="${pin.id}" d="M ${positions[i]} 100 L ${positions[i]} 0" vector-effect="non-scaling-stroke"/>`).join('');

    const shines = pins.map((pin, i) =>
        `<path class="shine" style="animation-delay: ${(i * -0.6).toFixed(2)}s" d="M ${positions[i]} 100 L ${positions[i]} 0" vector-effect="non-scaling-stroke"/>`).join('');

    container.innerHTML =
        `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">${gaps}${wires}${shines}</svg>`;

    const tip = ensureTooltip();

    container.querySelectorAll('.wire').forEach(path => {
        const pin = pins.find(p => p.id === path.dataset.pin);
        if (!pin) return;

        path.addEventListener('pointerenter', () => {
            tip.innerHTML =
                `<strong>${pin.label} → ${pin.target}</strong><span>${pin.desc}</span>`;
            tip.classList.add('show');
        });

        path.addEventListener('pointerleave', () => {
            tip.classList.remove('show');
        });

        path.addEventListener('pointermove', (e) => {
            tip.style.left = (e.clientX + 16) + 'px';
            tip.style.top = (e.clientY + 16) + 'px';
        });
    });
}