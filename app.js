let nominal = [];
let benchmark = [];

function normalizeHS(hs) {
    return String(hs).replace(/\s+/g, '').trim();
}

function normalizeProd(p) {
    return String(p || "").trim();
}

async function loadData() {
    nominal = await fetch('./nominal.json?v=2').then(r => r.json());
    benchmark = await fetch('./benchmark.json?v=2').then(r => r.json());

    const hsSet = [...new Set(nominal.map(x => x.HS))];
    const hsList = document.getElementById('hsList');

    hsSet.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        hsList.appendChild(opt);
    });

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
    const countryInput = document.getElementById('country').value;
    const country = countryInput.toLowerCase();

    const candidates = nominal.filter(x =>
        x.HS === hs &&
        x.Country.toLowerCase() === country
    );

    if (!candidates.length) {
        document.getElementById('result').innerHTML = "Nenalezeno v Nominal";
        return;
    }

    let html = `<b>HS:</b> ${hs}<br><b>Země:</b> ${countryInput}<br><br>`;

    candidates.forEach((x, i) => {
        const prod = normalizeProd(x.ProdType);

        const bmMatches = benchmark.filter(b =>
            b.HS === hs &&
            normalizeProd(b.ProdType) === prod
        );

        const bmA = bmMatches.find(b => b.Source === "A");
        const bmB = bmMatches.find(b => b.Source === "B");

        html += `
        <hr>
        <b>Varianta ${i+1}</b><br>
        Nominal: ${x.Nominal}<br>
        Typ výroby: ${prod || "(neurčený)"}<br><br>
        <b>Benchmark A:</b> ${bmA ? bmA.Benchmark : "nenalezen"}<br>
        <b>Benchmark B:</b> ${bmB ? bmB.Benchmark : "nenalezen"}<br>
        `;
    });

    document.getElementById('result').innerHTML = html;
}

loadData();
