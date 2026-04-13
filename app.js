let nominal = [];
let benchmark = [];

const DEBUG = true;

function log(...args) {
    if (DEBUG) console.log(...args);
}

function normalizeHS(hs) {
    return String(hs)
        .replace(/\s+/g, '')
        .replace(/\.0$/, '')
        .trim();
}

function normalizeProd(p) {
    return String(p || "")
        .replace(/[()]/g, '')
        .trim();
}

async function loadData() {
    nominal = await fetch('nominal.json').then(r => r.json());
    benchmark = await fetch('benchmark.json').then(r => r.json());

    // normalizace dat
    nominal = nominal.map(x => ({
        ...x,
        HS: normalizeHS(x.HS),
        ProdType: normalizeProd(x.ProdType)
    }));

    benchmark = benchmark.map(x => ({
        ...x,
        HS: normalizeHS(x.HS),
        ProdType: normalizeProd(x.ProdType)
    }));

    log("Loaded nominal:", nominal.length);
    log("Loaded benchmark:", benchmark.length);

    // HS našeptávač
    const hsSet = [...new Set(nominal.map(x => x.HS))];
    const hsList = document.getElementById('hsList');
    hsSet.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        hsList.appendChild(opt);
    });

    // země našeptávač
    const countries = [...new Set(nominal.map(x => x.Country))];
    const cList = document.getElementById('countryList');
    countries.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        cList.appendChild(opt);
    });
}

function calculate() {
    const rawHS = document.getElementById('hs').value;
    const countryInput = document.getElementById('country').value;

    const hs = normalizeHS(rawHS);
    const country = countryInput.trim().toLowerCase();

    log("---- CALC START ----");
    log("HS:", hs, "Country:", country);

    // 1️⃣ všechny kandidáty z Nominal
    const candidates = nominal.filter(x =>
        x.Country.toLowerCase() === country &&
        x.HS === hs
    );

    log("Nominal candidates:", candidates);

    if (candidates.length === 0) {
        document.getElementById('result').innerHTML = "Nenalezeno v Nominal";
        return;
    }

    // 2️⃣ validní (bez "_")
    const valid = candidates.filter(x =>
        x.Nominal !== "_" &&
        x.Nominal !== "" &&
        x.Nominal != null
    );

    const used = valid.length ? valid : candidates;

    log("Used candidates:", used);

    // 3️⃣ párování benchmarku pro každou variantu
    const results = used.map(x => {
        const prod = normalizeProd(x.ProdType);

        // exact match
        let bm = benchmark.find(b =>
            b.HS === hs &&
            b.ProdType === prod
        );

        // fallback bez typu výroby
        if (!bm) {
            bm = benchmark.find(b =>
                b.HS === hs &&
                (!b.ProdType || b.ProdType === "")
            );
        }

        return {
            Nominal: x.Nominal,
            ProdType: prod || "(neurčený)",
            Benchmark: bm ? bm.Benchmark : "nenalezen"
        };
    });

    log("Final results:", results);

    // 4️⃣ výpis
    let html = `
        <b>HS:</b> ${hs}<br>
        <b>Země:</b> ${countryInput}<br><br>
    `;

    results.forEach((r, i) => {
        html += `
            <hr>
            <b>Varianta ${i + 1}</b><br>
            Nominal: ${r.Nominal}<br>
            Typ výroby: ${r.ProdType}<br>
            Benchmark: ${r.Benchmark}<br>
        `;
    });

    document.getElementById('result').innerHTML = html;

    log("---- CALC END ----");
}

loadData();