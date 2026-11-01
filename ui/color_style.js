/* Color data stays separate from draw logic. `color` is the legacy solid fallback;
   optional `paint` holds editable, JSON-safe gradient stops. Never accept raw CSS. */
(function () {
    'use strict';
    const hex = (value, fallback = '#dfbf88') => {
        if (typeof value !== 'string') return fallback;
        if (/^#[\da-f]{6}$/i.test(value)) return value.toLowerCase();
        if (/^#[\da-f]{3}$/i.test(value)) return '#' + [...value.slice(1)].map(x => x + x).join('').toLowerCase();
        return fallback;
    };
    const clamp = (n, min, max, fallback = min) => Number.isFinite(Number(n)) ? Math.min(max, Math.max(min, Number(n))) : fallback;
    function normalize(value) {
        const color = hex(typeof value === 'string' ? value : value?.color);
        const paint = value?.paint;
        if (!paint || !['linear', 'radial'].includes(paint.type) || !Array.isArray(paint.stops)) return { color };
        const stops = paint.stops.slice(0, 8).filter(s => s && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(s.color)).map(s => ({ color: hex(s.color), position: clamp(s.position, 0, 100) })).sort((a, b) => a.position - b.position);
        if (stops.length < 2) return { color };
        return { color: stops[0].color, paint: { type: paint.type, angle: clamp(paint.angle, 0, 360, 135), stops } };
    }
    function background(value) {
        const n = normalize(value);
        if (!n.paint) return n.color;
        const stops = n.paint.stops.map(s => `${s.color} ${s.position}%`).join(', ');
        return n.paint.type === 'radial' ? `radial-gradient(circle, ${stops})` : `linear-gradient(${n.paint.angle}deg, ${stops})`;
    }
    function text(value) {
        const n = normalize(value);
        return n.paint ? `color:${n.color};background-image:${background(n)};background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;` : `color:${n.color};`;
    }
    function frame(value, fill = 'var(--art-inset, #121922)') {
        const n = normalize(value);
        return n.paint ? `--color-paint:${background(n)};border-color:transparent;background:linear-gradient(${fill},${fill}) padding-box,${background(n)} border-box;` : `border-color:${n.color};background-image:none;`;
    }
    function contrast(value) {
        const n = normalize(value), colors = n.paint?.stops.map(s => s.color) || [n.color];
        const luminance = colors.reduce((sum, c) => {
            const rgb = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
            return sum + rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
        }, 0) / colors.length;
        return luminance > .32 ? '#151b24' : '#ffffff';
    }
    const alpha = (value, opacity) => hex(typeof value === 'string' ? value : value?.color) + Math.round(clamp(opacity, 0, 1) * 255).toString(16).padStart(2, '0');
    window.ColorStyle = Object.freeze({ hex, normalize, background, text, frame, contrast, alpha });
})();
