const positions = [26, 42, 58, 74];

export function renderWires(container, pins) {
    const base = pins.map((pin, i) => {
        const x = positions[i];
        return `<path class="wire wire-${pin.id}" d="M ${x} 100 L ${x} 0" vector-effect="non-scaling-stroke"/>`;
    }).join('');

    const shine = pins.map((pin, i) => {
        const x = positions[i];
        const delay = (i * -0.6).toFixed(2);
        return `<path class="shine" style="animation-delay: ${delay}s" d="M ${x} 100 L ${x} 0" vector-effect="non-scaling-stroke"/>`;
    }).join('');

    container.innerHTML =
        `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">${base}${shine}</svg>`;
}