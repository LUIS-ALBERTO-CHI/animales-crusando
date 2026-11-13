/* Piezas SVG decorativas compartidas por los componentes de la interfaz. */

export const HIBISCUS = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g fill="#3f9a4f"><ellipse cx="22" cy="86" rx="26" ry="11" transform="rotate(-30 22 86)"/><ellipse cx="96" cy="94" rx="24" ry="10" transform="rotate(25 96 94)"/><ellipse cx="70" cy="110" rx="22" ry="9" transform="rotate(-10 70 110)"/></g>
  <g fill="#f25c5c">
    <ellipse cx="60" cy="34" rx="20" ry="26"/>
    <ellipse cx="88" cy="56" rx="20" ry="26" transform="rotate(72 88 56)"/>
    <ellipse cx="77" cy="88" rx="20" ry="26" transform="rotate(144 77 88)"/>
    <ellipse cx="43" cy="88" rx="20" ry="26" transform="rotate(216 43 88)"/>
    <ellipse cx="32" cy="56" rx="20" ry="26" transform="rotate(288 32 56)"/>
  </g>
  <circle cx="60" cy="64" r="14" fill="#d93f4a"/>
  <path d="M60 64 L76 40" stroke="#ffd45c" stroke-width="3" stroke-linecap="round"/>
  <circle cx="77" cy="38" r="4" fill="#ffd45c"/>
</svg>`;

export const DAISY = `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g fill="#fff">${Array.from({ length: 8 }, (_, i) => `<ellipse cx="30" cy="14" rx="6" ry="12" transform="rotate(${i * 45} 30 30)"/>`).join('')}</g>
  <circle cx="30" cy="30" r="7" fill="#ffd45c"/>
</svg>`;

export const SPRIG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M4 20 C9 15 13 10 20 4" stroke="#6aa84f" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <ellipse cx="9" cy="12" rx="2.6" ry="5" transform="rotate(-40 9 12)" fill="#6aa84f"/>
  <ellipse cx="14" cy="15" rx="2.6" ry="5" transform="rotate(50 14 15)" fill="#6aa84f"/>
  <ellipse cx="15" cy="7" rx="2.4" ry="4.6" transform="rotate(-40 15 7)" fill="#6aa84f"/>
</svg>`;

export const SHELL = `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3f8"/><stop offset=".5" stop-color="#ffd0e2"/><stop offset="1" stop-color="#e3c4ff"/></linearGradient>
    <radialGradient id="pe" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffe7b8"/></radialGradient>
  </defs>
  <path d="M12 70 C8 34 34 8 60 8 C86 8 112 34 108 70 Z" fill="url(#sh)"/>
  <g stroke="#f2a9c6" stroke-width="2.4" fill="none" stroke-linecap="round">
    <path d="M60 70 L60 12"/><path d="M60 70 L36 16"/><path d="M60 70 L84 16"/><path d="M60 70 L18 36"/><path d="M60 70 L102 36"/>
  </g>
  <path d="M8 70 Q60 60 112 70 Q110 90 60 92 Q10 90 8 70 Z" fill="#fff6ee"/>
  <circle cx="60" cy="72" r="13" fill="url(#pe)"/>
  <circle cx="55" cy="67" r="4" fill="#fff"/>
</svg>`;
