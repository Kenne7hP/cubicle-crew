// Procedural Scranton-inspired set dressing. Seat identities and monitoring stay in Office.
import { R, makeCanvas } from './util.js';
import { drawText, textWidth } from './pixelfont.js';

const C = { cream: '#eee6ce', wall: '#dbd7b7', trim: '#52634c', carpet: '#8c9873',
  grain: '#84916e', wood: '#af8052', edge: '#735a3b', paper: '#f9f1da', ink: '#304b38' };
function text(g, s, x, y, color = C.ink) { drawText(g, s, x, y, color); }
function sign(g, x, y, w) {
  R(g, C.trim, x, y, w, 26); R(g, C.paper, x + 2, y + 2, w - 4, 22);
  text(g, 'DUNDER MIFFLIN', x + (w - textWidth('DUNDER MIFFLIN')) / 2, y + 5);
  text(g, 'PAPER COMPANY', x + (w - textWidth('PAPER COMPANY')) / 2, y + 15, '#7d684c');
}
function blinds(g, x, y, w, h) {
  R(g, C.trim, x, y, w, h); R(g, '#a9b7a2', x + 2, y + 2, w - 4, h - 4);
  for (let yy = y + 4; yy < y + h - 2; yy += 4) {
    R(g, '#d3d5b8', x + 2, yy, w - 4, 2); R(g, '#7a8a72', x + 2, yy + 2, w - 4, 1);
  }
  R(g, '#f1ead3', x + w - 7, y + 3, 1, h - 6);
}
function object(room, w, h, x, base, paint) {
  const img = makeCanvas(w, h); paint(img.getContext('2d'));
  room.objects.push({ img, x, y: base - h, key: base, sh: null });
}
function boxes(g, x, y) {
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
    const xx = x + col * 15, yy = y + row * 12;
    R(g, '#b7a67f', xx, yy, 14, 11); R(g, C.paper, xx + 1, yy + 1, 12, 8);
    R(g, '#49664f', xx + 2, yy + 4, 10, 3); R(g, '#5d5949', xx + 5, yy + 1, 4, 1);
  }
}

export function dressOffice(room, dunder) {
  const L = room.layout, mini = !!L.mini;
  if (!mini && !dunder) return room;
  const g = room.bg.getContext('2d'), { W, H } = room;
  g.clearRect(0, 0, W, H);
  R(g, C.cream, 0, 0, W, 60);
  R(g, C.wall, 0, 37, W, 21); R(g, C.trim, 0, 57, W, 3);
  R(g, C.carpet, 0, 60, W, H - 60);
  for (let y = 62; y < H; y += 4) for (let x = (y % 8); x < W; x += 7) R(g, C.grain, x, y, 2, 1);
  room.windows = []; room.posters = []; room.board = null; room.neon = null;
  room.arcade = room.aquarium = room.massage = room.season = room.shredder = room.fountain = null;
  room.clearProps = null;
  room.clock = { x: W - 12, y: 45, r: 6 }; room.digital = { x: W - 23, y: 51, w: 21, h: 7 };
  room.ceil = mini ? [30, W - 30] : [30, 140, W - 36];
  if (mini) {
    room.objects = [];
    room.lampGlow = null;
    blinds(g, 8, 12, 48, 34); blinds(g, W - 56, 12, 48, 26);
    if (dunder) sign(g, 66, 9, 112);
    else { R(g, C.trim, 66, 9, 112, 26); text(g, 'MINI OFFICE', 88, 19, C.paper); }
    text(g, 'SCRANTON BRANCH', 87, 44, '#697253');
    if (!dunder) R(g, C.wall, 66, 39, 112, 15);
    // A small paper cabinet in the unused central slot between the lead desks.
    object(room, 34, 30, 104, 103, c => {
      R(c, C.edge, 0, 5, 34, 25); R(c, C.wood, 1, 7, 32, 21);
      R(c, C.paper, 3, 0, 28, 7); R(c, '#78907a', 6, 2, 21, 2);
      R(c, C.edge, 2, 17, 30, 1); R(c, '#e4d2a1', 14, 10, 7, 2);
    });
    // No moving door in the compact view.
    room.door = { x: -40, y: 18, w: 24, h: 42, cx: -28, floorY: 66 };
    return room;
  }

  const lx = L.lounge.x;
  // Reception has oak flooring; sales and Michael's office share muted green carpet.
  R(g, '#c4a675', lx, 60, W - lx, H - 60);
  for (let y = 65; y < H; y += 7) R(g, '#b29568', lx, y, W - lx, 1);
  R(g, C.trim, lx - 2, 60, 2, H - 60);
  const manager = L.pods[0];
  blinds(g, 38, 9, 48, 31);
  text(g, 'MANAGER', 40, 46);
  // Glass side partition, with an open doorway at the aisle.
  R(g, '#6e8067', manager.x + 73, 42, 2, 59);
  R(g, '#c7d2b6', manager.x + 70, 61, 2, 38);
  R(g, C.trim, manager.x - 6, manager.y + 53, 58, 2);
  const d = room.door;
  R(g, C.edge, d.x, d.y, d.w, d.h); R(g, '#c9af7f', d.x + 2, d.y + 2, d.w - 4, d.h - 4);
  blinds(g, d.x + 4, d.y + 5, d.w - 8, 24); R(g, C.paper, d.x + 19, d.y + 30, 2, 2);
  room.board = { x: 96, y: 10, w: 62, h: 30 };
  R(g, C.edge, 94, 8, 66, 34); R(g, C.paper, 96, 10, 62, 30);
  text(g, 'CONFERENCE', 100, 47);
  blinds(g, 170, 9, Math.max(32, lx - 178), 32);
  text(g, 'SALES', 177, 47);
  sign(g, lx + 4, 6, W - lx - 8);
  // Replace the central printer island with a compact conference table, and store paper at reception.
  room.objects = room.objects.filter(o => !(o.x >= manager.x + 72 && o.x < manager.x + 144 && o.key < manager.y + 55)
    && !['bookshelf', 'table', 'floor_lamp', 'arcade', 'aquarium', 'massage', 'pet_fountain', 'pet_bowl'].includes(o.name)
    && !o.name?.startsWith('toy_'));
  object(room, 56, 31, manager.x + 78, manager.y + 48, c => {
    R(c, C.trim, 6, 0, 13, 9); R(c, C.trim, 35, 0, 13, 9);
    R(c, C.edge, 4, 12, 48, 17); R(c, '#bd9360', 2, 9, 52, 12);
    R(c, '#d4b381', 4, 9, 48, 2); R(c, C.paper, 15, 12, 9, 6);
    R(c, '#66745c', 33, 12, 8, 5); R(c, C.trim, 8, 24, 12, 7); R(c, C.trim, 36, 24, 12, 7);
  });
  object(room, 32, 29, lx + 5, 68, c => boxes(c, 1, 2));
  // Pam's L-shaped reception desk in front of the waiting bench.
  const sf = L.lounge.sofa;
  object(room, 78, 25, sf.x - 9, sf.base + 24, c => {
    R(c, C.edge, 0, 0, 78, 9); R(c, '#d0a673', 1, 1, 76, 5);
    R(c, C.wood, 2, 9, 74, 14); R(c, C.edge, 2, 23, 74, 2);
    R(c, '#c19b68', 6, 11, 66, 10); R(c, C.edge, 0, 0, 8, 25);
    R(c, C.paper, 48, 1, 13, 4); R(c, C.ink, 18, 0, 9, 4);
    text(c, 'RECEPTION', 18, 14, '#4e4935');
  });
  room.lampGlow = null;
  return room;
}
