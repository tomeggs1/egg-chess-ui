/**
 * Measures how much of its viewBox each icon's art actually fills, using a real
 * browser's getBBox() rather than guessing from the viewBox number.
 *
 * Feeds ICON_SCALE in src/icons/index.tsx. Re-run after adding icons:
 *   npm run icons:measure
 *
 * `optical` = sqrt(fillW * fillH) is the number that tracks perceived size —
 * a wide, short glyph can fill its width and still look small in a square box.
 * Needs Microsoft Edge; adjust EDGE below if yours lives elsewhere.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const gen = fs.readFileSync(path.join(__dirname, "..", "src/icons/paths.generated.ts"), "utf8");

// Pull role -> { viewBox, d[] } out of the generated file.
const icons = {};
const blockRe = /"([a-z0-9-]+)":\s*\{\s*viewBox:\s*"([^"]+)",\s*d:\s*\[([\s\S]*?)\],\s*\}/g;
let m;
while ((m = blockRe.exec(gen))) {
  const ds = [...m[3].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => JSON.parse('"' + x[1] + '"'));
  icons[m[1]] = { viewBox: m[2], d: ds };
}

const svgs = Object.entries(icons)
  .map(([role, a]) => {
    const paths = a.d.map((d) => `<path d="${d.replace(/"/g, "&quot;")}"/>`).join("");
    return `<svg id="i-${role}" viewBox="${a.viewBox}" width="100" height="100">${paths}</svg>`;
  })
  .join("");

const page = `<body style="margin:0">${svgs}<script>
window.addEventListener('load', function () {
  var out = [];
  document.querySelectorAll('svg[id^="i-"]').forEach(function (svg) {
    var role = svg.id.slice(2);
    var vb = svg.viewBox.baseVal;
    var b = { x: Infinity, y: Infinity, r: -Infinity, bo: -Infinity };
    svg.querySelectorAll('path').forEach(function (p) {
      var g = p.getBBox();
      b.x = Math.min(b.x, g.x); b.y = Math.min(b.y, g.y);
      b.r = Math.max(b.r, g.x + g.width); b.bo = Math.max(b.bo, g.y + g.height);
    });
    var w = (b.r - b.x) / vb.width, h = (b.bo - b.y) / vb.height;
    out.push(role + '|' + vb.width + '|' + w.toFixed(4) + '|' + h.toFixed(4) + '|' + Math.max(w, h).toFixed(4));
  });
  var pre = document.createElement('pre'); pre.id = 'R'; pre.textContent = out.join('\\n');
  document.body.appendChild(pre);
});
</script></body>`;

const tmp = path.join(__dirname, "_measure.html");
fs.writeFileSync(tmp, page);
const dom = execFileSync(EDGE,
  ["--headless=new", "--disable-gpu", "--virtual-time-budget=4000", "--dump-dom",
   "file:///" + tmp.split(path.sep).join("/")],
  { maxBuffer: 64 * 1024 * 1024, encoding: "utf8" });

const rep = dom.match(/id="R">([\s\S]*?)<\/pre>/);
if (!rep) { console.log("NO REPORT"); process.exit(1); }
const rows = rep[1].trim().split("\n").map((l) => l.split("|"));

// Target optical size, and the cap that stops a scaled glyph clipping its box.
const TARGET = 0.9;
const MAX_DIM = 0.98;

// Icons sit centred in a fixed square box and the eye tracks a row, so HEIGHT
// drives perceived size far more than width. A tall, narrow glyph already looks
// full-sized; scaling it to hit an area target just makes it taller than its
// neighbours. So nothing is scaled past the set's median height.
const heights = rows.map(([, , , h]) => +h).sort((a, b) => a - b);
const MEDIAN_H = heights[Math.floor(heights.length / 2)];

console.log(`median fillH across the set: ${MEDIAN_H.toFixed(4)} (the height ceiling)\n`);
console.log("role                     viewBox  fillW   fillH   optical  suggest");
const suggestions = [];
for (const [role, vb, w, h] of rows) {
  const optical = Math.sqrt(+w * +h);
  const cap = MAX_DIM / Math.max(+w, +h);
  const heightCap = MEDIAN_H / +h;
  const scale = Math.min(TARGET / optical, cap, heightCap);
  const shown = scale > 1.02 ? scale.toFixed(2) : "—";
  if (scale > 1.02) suggestions.push([role, scale.toFixed(2)]);
  console.log(
    role.padEnd(24) + String(vb).padEnd(9) + w + "  " + h + "  " + optical.toFixed(4) + "   " + shown,
  );
}

console.log("\nICON_SCALE suggestions for src/icons/index.tsx:");
if (!suggestions.length) console.log("  (none — every glyph is already close to target)");
for (const [role, s] of suggestions) {
  const key = /^[a-z][a-z0-9]*$/.test(role) ? role : `"${role}"`;
  console.log(`  ${key}: ${s},`);
}
console.log(
  "\nNote: `optical` = sqrt(fillW*fillH). A wide, short glyph fills its width but\n" +
    "still reads small in the square box fontSize gives it — the cap binds first,\n" +
    "so these correct rather than fully normalise.",
);
fs.unlinkSync(tmp);
