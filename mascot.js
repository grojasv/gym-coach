/* El Titán: the Gym Coach mascot, a cartoon luchador drawn as inline SVG.
 * Browser: <script src="mascot.js"></script> then Titan.svg('work').
 * Node:    const Titan = require('./mascot.js').
 * No external assets and no text. The app animates <g class="titan-mouth"> while he speaks. */
(function (root) {
  'use strict';

  const C = {
    ink: '#1a1a2e',
    gold: '#ffc72c',
    goldHi: '#ffe08a',
    red: '#e63946',
    navy: '#1b2340',
    navyHi: '#34406e',
    skin: '#d99a6c',
    skinDark: '#b8794f',
    white: '#ffffff',
    mouth: '#5a1420',
    tongue: '#f07a8a',
    water: '#8fd8ff',
  };
  const SW = 3; // outline width

  const POSES = ['idle', 'work', 'rest', 'cheer', 'champ'];
  const face = (pose) => (pose === 'champ' ? 'cheer' : pose); // champ: the cheer face, with the belt held overhead

  // ---------- small helpers ----------
  const pts = (p) => p.map(([x, y]) => `${x},${y}`).join(' ');
  const mirror = (p) => p.map(([x, y]) => [200 - x, y]);

  function star(cx, cy, r, fill = C.gold) {
    const out = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      out.push([+(cx + rr * Math.cos(a)).toFixed(1), +(cy + rr * Math.sin(a)).toFixed(1)]);
    }
    return `<polygon points="${pts(out)}" fill="${fill}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`;
  }

  // A chunky limb: an ink layer and a skin layer, so bulges merge into the arm cleanly.
  function limb(path, { bulge } = {}) {
    const line = (w, col) =>
      `<polyline points="${pts(path)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const b = (grow, col) =>
      bulge ? `<ellipse cx="${bulge[0]}" cy="${bulge[1]}" rx="${bulge[2] + grow}" ry="${bulge[3] + grow}" fill="${col}"/>` : '';
    return line(26 + SW * 2, C.ink) + b(SW, C.ink) + line(26, C.skin) + b(0, C.skin);
  }

  function fist(x, y, r = 12.5) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.skin}" stroke="${C.ink}" stroke-width="${SW}"/>` +
      `<path d="M ${x - r * 0.55} ${y - r * 0.15} Q ${x} ${y - r * 0.5} ${x + r * 0.55} ${y - r * 0.15}" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
  }

  // ---------- head (local coords, centred on 0,0) ----------
  // Left eye flame trim; the right one is the same shape mirrored.
  const FLAME = 'M -3 -1 Q -12 11 -27 3 L -38 -9 L -30 -10 L -35 -22 L -24 -16 L -21 -27 L -14 -16 Q -5 -15 -3 -1 Z';

  function eyes(kind) {
    const one = (side) => {
      const s = side; // -1 left, +1 right
      const ex = 15 * s, ey = -4;
      const trim = `<path d="${FLAME}" transform="scale(${s === -1 ? 1 : -1},1)" fill="${C.red}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
      const hole = (fill) => `<ellipse cx="${ex}" cy="${ey}" rx="8.5" ry="7.5" fill="${fill}" stroke="${C.ink}" stroke-width="2.5"/>`;
      const closed = `<path d="M ${ex - 6} ${ey + 2} Q ${ex} ${ey - 6} ${ex + 6} ${ey + 2}" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`;
      const pupil = (dx = 1.5 * -s, r = 3.8) =>
        `<circle cx="${ex + dx}" cy="${ey + 0.5}" r="${r}" fill="${C.ink}"/><circle cx="${ex + dx + 1.3}" cy="${ey - 1}" r="1.2" fill="${C.white}"/>`;
      switch (kind) {
        case 'work': // determined: angled brow cuts the top of the eye
          return trim + hole(C.white) + pupil(1.5 * -s, 3.4) +
            `<path d="M ${ex - 11 * s} ${ey - 11} L ${ex + 9 * s} ${ey - 4} L ${ex + 9 * s} ${ey - 14} Z" fill="${C.red}"/>` +
            `<line x1="${ex - 11 * s}" y1="${ey - 11}" x2="${ex + 9 * s}" y2="${ey - 3}" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
        case 'rest': // wink: left eye closed, right open
          return trim + (s === -1 ? hole(C.skin) + closed : hole(C.white) + pupil());
        case 'cheer': // both closed in a big happy ^ ^
          return trim + hole(C.skin) + closed;
        default: // idle: open, confident
          return trim + `<g class="titan-eye">` + hole(C.white) + pupil() +
            `<path d="M ${ex - 8} ${ey - 4} Q ${ex} ${ey - 9} ${ex + 8} ${ey - 4}" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/></g>`;
      }
    };
    return one(-1) + one(1);
  }

  function mouth(kind) {
    let m;
    switch (kind) {
      case 'work': // open, shouting
        m = `<ellipse cx="0" cy="25" rx="8" ry="8.5" fill="${C.mouth}" stroke="${C.ink}" stroke-width="2.2"/>` +
          `<path d="M -6 19.5 Q 0 17.5 6 19.5 L 5.5 22 Q 0 21 -5.5 22 Z" fill="${C.white}"/>` +
          `<ellipse cx="0" cy="29.5" rx="4.5" ry="2.6" fill="${C.tongue}"/>`;
        break;
      case 'rest': // soft smile
        m = `<path d="M -8 22 Q 0 29 8 22" fill="none" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round"/>`;
        break;
      case 'cheer': // huge smile
        m = `<path d="M -12 18.5 L 12 18.5 Q 12 34 0 34 Q -12 34 -12 18.5 Z" fill="${C.mouth}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>` +
          `<path d="M -10.8 19.5 L 10.8 19.5 L 10.3 23 L -10.3 23 Z" fill="${C.white}"/>` +
          `<ellipse cx="0" cy="30" rx="6" ry="3" fill="${C.tongue}"/>`;
        break;
      default: // confident grin
        m = `<path d="M -11 19.5 Q 0 22 11 19.5 Q 9 32 0 32 Q -9 32 -11 19.5 Z" fill="${C.white}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/>` +
          `<path d="M -10 23 Q 0 25.5 10 23" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`;
    }
    return `<g class="titan-mouth">${m}</g>`;
  }

  function headGroup(kind) {
    const laceCord = (d) =>
      `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${4 + SW * 2 - 1}" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>`;
    return (
      // laces tied at the back, tails flying out behind the head
      laceCord('M 28 -26 Q 44 -34 50 -22') +
      laceCord('M 30 -22 Q 46 -16 47 -4') +
      `<circle cx="33" cy="-25" r="4.5" fill="${C.red}" stroke="${C.ink}" stroke-width="2.5"/>` +
      // mask base
      `<ellipse cx="0" cy="0" rx="38" ry="42" fill="${C.gold}" stroke="${C.ink}" stroke-width="${SW}"/>` +
      `<ellipse cx="-17" cy="-26" rx="9" ry="5" fill="${C.goldHi}" transform="rotate(-30 -17 -26)"/>` +
      // red crest down the centre of the forehead
      `<path d="M -8 -40.5 Q 0 -43.5 8 -40.5 L 4.5 -14 L 0 -7 L -4.5 -14 Z" fill="${C.red}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>` +
      // lace seam visible along the cheek
      `<path d="M 33 -12 L 37 -8 M 34 -4 L 38 0 M 34 4 L 37.5 8" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>` +
      eyes(kind) +
      // nose under the mask
      `<path d="M -5 9 Q 0 13 5 9" fill="none" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>` +
      // mouth opening: red trim, skin inside
      `<ellipse cx="0" cy="24.5" rx="18.5" ry="14" fill="${C.red}" stroke="${C.ink}" stroke-width="2.5"/>` +
      `<ellipse cx="0" cy="24.5" rx="14" ry="10.5" fill="${C.skin}" stroke="${C.ink}" stroke-width="2"/>` +
      mouth(kind)
    );
  }

  // ---------- body ----------
  function torso() {
    return (
      // neck
      `<path d="M 84 84 L 84 104 L 116 104 L 116 84 Z" fill="${C.skinDark}" stroke="${C.ink}" stroke-width="${SW}"/>` +
      // delts
      `<circle cx="47" cy="122" r="19" fill="${C.skin}" stroke="${C.ink}" stroke-width="${SW}"/>` +
      `<circle cx="153" cy="122" r="19" fill="${C.skin}" stroke="${C.ink}" stroke-width="${SW}"/>` +
      // chest and torso (V-taper)
      `<path d="M 58 104 Q 100 92 142 104 Q 162 112 160 134 Q 154 162 140 188 L 60 188 Q 46 162 40 134 Q 38 112 58 104 Z" fill="${C.skin}" stroke="${C.ink}" stroke-width="${SW}" stroke-linejoin="round"/>` +
      `<path d="M 100 110 L 100 124 M 84 118 Q 92 124 100 122 Q 108 124 116 118" fill="none" stroke="${C.skinDark}" stroke-width="2.5" stroke-linecap="round"/>` +
      // navy singlet with a scoop neck
      `<path d="M 70 107 L 82 104 Q 100 146 118 104 L 130 107 Q 146 140 140 188 L 60 188 Q 54 140 70 107 Z" fill="${C.navy}" stroke="${C.ink}" stroke-width="${SW}" stroke-linejoin="round"/>` +
      `<path d="M 66 124 Q 59 154 64 186 M 134 124 Q 141 154 136 186" fill="none" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M 72 146 Q 86 156 98 150 M 128 146 Q 114 156 102 150 M 100 154 L 100 178 M 86 166 L 96 166 M 104 166 L 114 166" fill="none" stroke="${C.navyHi}" stroke-width="2.5" stroke-linecap="round"/>` +
      // trunks below the belt (cropped)
      `<path d="M 60 196 L 140 196 L 144 224 L 56 224 Z" fill="${C.navy}" stroke="${C.ink}" stroke-width="${SW}"/>` +
      // championship belt
      `<rect x="54" y="181" width="92" height="20" rx="5" fill="${C.gold}" stroke="${C.ink}" stroke-width="${SW}"/>` +
      `<circle cx="66" cy="191" r="3" fill="${C.red}" stroke="${C.ink}" stroke-width="1.5"/>` +
      `<circle cx="134" cy="191" r="3" fill="${C.red}" stroke="${C.ink}" stroke-width="1.5"/>` +
      `<ellipse cx="100" cy="191" rx="21" ry="15" fill="${C.goldHi}" stroke="${C.ink}" stroke-width="${SW}"/>` +
      `<ellipse cx="100" cy="191" rx="15" ry="10" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.8"/>` +
      star(100, 191, 8, C.red)
    );
  }

  function arms(pose) {
    switch (pose) {
      case 'work': { // double-biceps flex
        const L = [[47, 122], [15, 116], [26, 74]];
        const bL = [31, 108, 13, 10];
        return limb(L, { bulge: bL }) + limb(mirror(L), { bulge: [200 - bL[0], bL[1], bL[2], bL[3]] }) +
          fist(26, 70) + fist(174, 70) +
          // sweat drop
          `<path d="M 150 26 Q 144 36 150 40 Q 156 36 150 26 Z" fill="${C.water}" stroke="${C.ink}" stroke-width="2"/>`;
      }
      case 'rest': { // towel on the shoulder, water bottle, thumbs up
        const L = [[47, 122], [30, 160], [40, 192]];
        const R = [[153, 122], [182, 150], [172, 116]];
        const bottle =
          `<rect x="32" y="160" width="16" height="44" rx="5" fill="${C.water}" stroke="${C.ink}" stroke-width="${SW}"/>` +
          `<rect x="35" y="152" width="10" height="9" rx="2" fill="${C.red}" stroke="${C.ink}" stroke-width="2.5"/>`;
        const thumb =
          `<rect x="163" y="84" width="11" height="26" rx="5.5" fill="${C.skin}" stroke="${C.ink}" stroke-width="${SW}"/>` +
          `<rect x="158" y="102" width="28" height="24" rx="8" fill="${C.skin}" stroke="${C.ink}" stroke-width="${SW}"/>` +
          `<path d="M 175 109 L 186 109 M 175 116 L 186 116" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
        const towel =
          `<path d="M 27 124 Q 36 98 62 99 L 84 104 L 86 162 L 64 164 L 62 122 Q 46 118 38 136 Z" fill="${C.white}" stroke="${C.ink}" stroke-width="${SW}" stroke-linejoin="round"/>` +
          `<path d="M 64 146 L 85 145 M 64 153 L 85.5 152" stroke="${C.red}" stroke-width="3.5" stroke-linecap="round"/>` +
          `<path d="M 62 122 Q 72 116 84 118" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`;
        return limb(L) + bottle + fist(40, 186) + limb(R) + thumb + towel;
      }
      case 'cheer': { // both fists up, star sparks
        const L = [[47, 122], [20, 90], [32, 46]];
        return limb(L) + limb(mirror(L)) + fist(32, 40) + fist(168, 40) +
          star(12, 18, 8) + star(188, 18, 8) + star(70, 8, 5) + star(130, 8, 5) + star(8, 70, 5) + star(192, 70, 5);
      }
      case 'champ': { // the championship belt held high over the head (the svg gets a taller viewBox)
        const L = [[47, 122], [18, 84], [26, 34]];
        const strap = (w, col) => `<path d="M 26 26 Q 100 -24 174 26" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
        return limb(L) + limb(mirror(L)) + strap(18 + SW * 2, C.ink) + strap(18, C.gold) +
          `<circle cx="58" cy="9" r="3" fill="${C.red}" stroke="${C.ink}" stroke-width="1.5"/>` +
          `<circle cx="142" cy="9" r="3" fill="${C.red}" stroke="${C.ink}" stroke-width="1.5"/>` +
          `<ellipse cx="100" cy="-5" rx="27" ry="18" fill="${C.goldHi}" stroke="${C.ink}" stroke-width="${SW}"/>` +
          `<ellipse cx="100" cy="-5" rx="20" ry="12.5" fill="${C.gold}" stroke="${C.ink}" stroke-width="1.8"/>` +
          star(100, -5, 10, C.red) + fist(26, 28) + fist(174, 28) +
          star(8, -12, 7) + star(192, -12, 7) + star(52, -20, 4.5) + star(148, -20, 4.5) + star(6, 72, 5) + star(194, 72, 5);
      }
      default: { // idle: hands on hips
        const L = [[47, 122], [20, 156], [62, 180]];
        return limb(L) + limb(mirror(L)) + fist(62, 180) + fist(138, 180);
      }
    }
  }

  const sizeAttrs = (size, ratio) =>
    size ? ` width="${size}" height="${Math.round(size * ratio)}"` : '';

  const api = {
    poses: POSES.slice(),

    /** Full-body SVG string. pose: idle | work | rest | cheer | champ. size: width in px (height keeps 200:220; champ is 200:250). */
    svg(pose = 'idle', { size } = {}) {
      if (!POSES.includes(pose)) pose = 'idle';
      const tall = pose === 'champ';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${tall ? '0 -30 200 250' : '0 0 200 220'}"${sizeAttrs(size, tall ? 1.25 : 1.1)} class="titan titan-${pose}" role="img" aria-label="El Titán">` +
        `<g class="titan-body">${torso()}${arms(pose)}<g class="titan-face" transform="translate(100 56)">${headGroup(face(pose))}</g></g></svg>`;
    },

    /** Just the masked head on a square viewBox (for the app icon). */
    head(pose = 'idle', { size } = {}) {
      if (!POSES.includes(pose)) pose = 'idle';
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-54 -50 108 108"${sizeAttrs(size, 1)} class="titan-head" role="img" aria-label="El Titán">` +
        `<g class="titan-body">${headGroup(pose)}</g></svg>`;
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Titan = api;
})(this);
