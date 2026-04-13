let nominal = [];
let benchmark = [];

function normalizeHS(hs) {
    return String(hs).replace(/\s+/g, '').trim();
}

function normalizeProd(p) {
    return String(p || "").trim();
}

async function loadData() {
    nominal = await fetch('./nominal.json').then(r => r.json());
    benchmark = await fetch('./benchmark.json').then(r => r.json());

    // HS našeptávač
    const hsSet = [...new Set(nominal.map(x => x.HS))];
    const hsList = document.getElementById('hsList');

    hsSet.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        hsList.appendChild(opt);
    });

    // Země našeptávač
    const countries = [...new Set(nominal.map(x => x.Country))];
    const countryList = document.getElementById('countryList');

    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        countryList.appendChild(opt);
    });
}

function calculate() {
    const hs = normalizeHS(document.getElementById('hs').value);
    const country = document.getElementById('country').value.toLowerCase();

    const candidates = nominal.filter(x =>
        x.HS === hs &&
        x.Country.toLowerCase() === country
    );

    if (candidates.length === 0) {
        document.getElementById('result').innerHTML = "Nenalezeno v Nominal";
        return;
    }

    let html = `
        <b>HS:</b> ${hs}<br>
        <b>Země:</b> ${document.getElementById('country').value}<br><br>
    `;

    candidates.forEach((x, i) => {
        const prod = normalizeProd(x.ProdType);

        const bm = benchmark.find(b =>
            b.HS === hs &&
            normalizeProd(b.ProdType) === prod
        );

        html += `
            <hr>
            <b>Varianta ${i + 1}</b><br>
            Nominal: ${x.Nominal}<br>
            Typ výroby: ${prod || "(neurčený)"}<br>
            Benchmark: ${bm ? bm.Benchmark : "nenalezen"}<br>
        `;
    });

    document.getElementById('result').innerHTML = html;
}

loadData();