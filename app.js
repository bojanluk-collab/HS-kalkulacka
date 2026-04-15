let nominal = [];
let benchmark = [];

function toggleMenu() {
    const m = document.getElementById('menu');
    m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

function showToast() {
    const t = document.getElementById('toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast();
}

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

function normalizeHS(h) {
    return String(h).replace(/\s+/g, '').trim();
}

function normalizeProd(p) {
    return String(p || '').replace(/[()]/g, '').trim().toUpperCase();
}

function row(label, val) {
    if (!val) val = "-";
    const safeVal = String(val).replace(/'/g, "\\'");
    return `
        <div class="value column">
            <span><b>${label}:</b></span>
            <span class="text">${val}</span>
            ${val !== "-" ? `<span class="copy" onclick="copyToClipboard('${safeVal}')">📋</span>` : ''}
        </div>
    `;
}

async function loadData() {
    const n = await fetch('nominal.json?v=1.5').then(r => r.json());
    const b = await fetch('benchmark.json?v=1.5').then(r => r.json());

    nominal = n.data || [];
    benchmark = b.data || [];

    document.getElementById('version').innerText = "Verze dat: " + (n.version || "-");

    loadSettings();

    const hsList = document.getElementById('hsList');
    hsList.innerHTML = "";
    const hsSet = new Set();
    nominal.forEach(x => hsSet.add(x.HS));
    hsSet.forEach(h => {
        const o = document.createElement('option');
        o.value = h;
        hsList.appendChild(o);
    });

    const countryList = document.getElementById('countryList');
    countryList.innerHTML = "";
    const countrySet = new Set();
    nominal.forEach(x => countrySet.add(x.Country));
    countrySet.forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        countryList.appendChild(o);
    });
}

function calculate() {
    const hs = normalizeHS(document.getElementById('hs').value);
    const country = document.getElementById('country').value.trim().toLowerCase();

    let data = country
        ? nominal.filter(x => x.HS === hs && x.Country.toLowerCase() === country)
        : nominal.filter(x => x.HS === hs);

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

        html += '<div class="section">';
        html += '<b>' + x.Country + '</b>';

        html += row("Description", x.Description);
        html += row("Nominal", x.Nominal_2026);
        html += row("Typ výroby", prod);

        if (A) html += row("Benchmark A", A.Benchmark);
        if (B) html += row("Benchmark B", B.Benchmark);

        html += '</div>';
    });

    document.getElementById('result').innerHTML = html;
}

document.addEventListener('change', function (e) {
    if (['showA', 'showB', 'yearSelect'].includes(e.target.id)) {
        saveSettings();
        calculate();
    }
});

loadData();
