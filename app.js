let nominal = [];
let benchmark = [];

// ===== MENU =====
function toggleMenu() {
const m = document.getElementById('menu');
m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

// ===== TOAST =====
function showToast() {
const t = document.getElementById('toast');
t.classList.add('show');
setTimeout(function () {
t.classList.remove('show');
}, 1000);
}

function copyToClipboard(text) {
navigator.clipboard.writeText(text);
showToast();
}

// ===== SETTINGS =====
function saveSettings() {
localStorage.setItem('showA', document.getElementById('showA').checked);
localStorage.setItem('showB', document.getElementById('showB').checked);
localStorage.setItem('year', document.getElementById('yearSelect').value);
}

function loadSettings() {
document.getElementById('showA').checked = localStorage.getItem('showA') !== 'false';
document.getElementById('showB').checked = localStorage.getItem('showB') !== 'false';
document.getElementById('yearSelect').value = localStorage.getItem('year') || "2026";
}

// ===== HELPERS =====
function normalizeHS(h) {
return String(h).replace(/\s+/g, '').trim();
}

function normalizeProd(p) {
return String(p || '').trim();
}

// bezpečné HTML
function row(label, val) {
if (!val) val = "-";

```
const safeVal = String(val).replace(/'/g, "\\'");

return '<div class="value">' +
    '<span>' + label + ': ' + val + '</span>' +
    (val !== "-" ? '<span class="copy" onclick="copyToClipboard(\'' + safeVal + '\')">📋</span>' : '') +
    '</div>';
```

}

// ===== DATA LOAD =====
async function loadData() {
try {
const n = await fetch('nominal.json').then(r => r.json());
const b = await fetch('benchmark.json').then(r => r.json());

```
    nominal = n.data || [];
    benchmark = b.data || [];

    document.getElementById('version').innerText = "Verze dat: " + (n.version || "-");

    loadSettings();

    // ===== HS našeptávač =====
    const hsList = document.getElementById('hsList');
    hsList.innerHTML = "";

    const hsSet = new Set();
    nominal.forEach(x => hsSet.add(x.HS));

    hsSet.forEach(h => {
        const o = document.createElement('option');
        o.value = h;
        hsList.appendChild(o);
    });

    // ===== ZEMĚ našeptávač =====
    const countryList = document.getElementById('countryList');
    countryList.innerHTML = "";

    const countrySet = new Set();
    nominal.forEach(x => countrySet.add(x.Country));

    countrySet.forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        countryList.appendChild(o);
    });

} catch (e) {
    console.error(e);
    document.getElementById('result').innerHTML = "Chyba načtení dat";
}
```

}

// ===== HLAVNÍ LOGIKA =====
function calculate() {

```
const hs = normalizeHS(document.getElementById('hs').value);
const country = document.getElementById('country').value.trim().toLowerCase();

const showA = document.getElementById('showA').checked;
const showB = document.getElementById('showB').checked;
const year = document.getElementById('yearSelect').value;

let data;

if (country) {
    data = nominal.filter(x => x.HS === hs && x.Country.toLowerCase() === country);
} else {
    data = nominal.filter(x => x.HS === hs);
}

if (!data.length) {
    document.getElementById('result').innerHTML = "Nenalezeno";
    return;
}

let html = "<b>HS:</b> " + hs;

data.forEach(x => {

    const prod = normalizeProd(x.ProdType);

    const bm = benchmark.filter(b =>
        b.HS === hs &&
        normalizeProd(b.ProdType) === prod
    );

    const A = bm.find(b => b.Source === 'A');
    const B = bm.find(b => b.Source === 'B');

    // ===== výběr roku =====
    let nominalValue = "";

    if (year === "2026") nominalValue = x.Nominal_2026;
    if (year === "2027") nominalValue = x.Nominal_2027;
    if (year === "2028") nominalValue = x.Nominal_2028;

    html += '<div class="section">';
    html += '<b>' + x.Country + '</b>';
    html += row("Nominal", nominalValue);
    html += '<div>Typ výroby: ' + (prod || "-") + '</div>';

    if (showA && A) {
        html += row("Benchmark A", A.Benchmark);
    }

    if (showB && B) {
        html += row("Benchmark B", B.Benchmark);
    }

    if (!showA && !showB) {
        html += '<div style="color:#888;font-size:13px;">Žádný benchmark není vybrán</div>';
    }

    html += '</div>';
});

document.getElementById('result').innerHTML = html;
```

}

// ===== LISTENERS =====
document.addEventListener('change', function (e) {
if (e.target.id === 'showA' || e.target.id === 'showB' || e.target.id === 'yearSelect') {
saveSettings();
calculate();
}
});

// ===== INIT =====
loadData();
