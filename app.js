let nominal = [];
let benchmark = [];
let version = "";

function normalizeHS(hs){ return String(hs).replace(/\s+/g,'').trim(); }
function normalizeProd(p){ return String(p||"").trim(); }

function copyToClipboard(text){
    navigator.clipboard.writeText(text);
}

function valueRow(label, value){
    return `
        <div class="value">
            <span>${label}: ${value}</span>
            <span class="copy" onclick="copyToClipboard('${value}')">📋</span>
        </div>
    `;
}

async function loadData(){
    const nomRaw = await fetch('./nominal.json?v=4').then(r=>r.json());
    const benchRaw = await fetch('./benchmark.json?v=4').then(r=>r.json());

    nominal = nomRaw.data;
    benchmark = benchRaw.data;
    version = nomRaw.version;

    document.getElementById('version').innerText =
        "Verze dat: " + version;

    [...new Set(nominal.map(x=>x.HS))].forEach(h=>{
        let o=document.createElement('option'); o.value=h; hsList.appendChild(o);
    });

    [...new Set(nominal.map(x=>x.Country))].forEach(c=>{
        let o=document.createElement('option'); o.value=c; countryList.appendChild(o);
    });
}

function calculate(){
    const hs=normalizeHS(document.getElementById('hs').value);
    const countryInput=document.getElementById('country').value.trim();
    const country=countryInput.toLowerCase();

    let html = `<b>HS:</b> ${hs}`;

    if(!countryInput){
        const all=nominal.filter(x=>x.HS===hs);

        if(!all.length){
            result.innerHTML="Žádná data.";
            return;
        }

        all.forEach(x=>{
            const prod=normalizeProd(x.ProdType);

            const bm=benchmark.filter(b=>b.HS===hs && normalizeProd(b.ProdType)===prod);
            const bmA=bm.find(b=>b.Source==="A");
            const bmB=bm.find(b=>b.Source==="B");

            html += `
            <div class="section">
                <b>${x.Country}</b>
                ${valueRow("Nominal", x.Nominal)}
                <div>Typ výroby: ${prod}</div>
                ${valueRow("Benchmark A", bmA ? bmA.Benchmark : "-")}
                ${valueRow("Benchmark B", bmB ? bmB.Benchmark : "-")}
            </div>
            `;
        });

        result.innerHTML=html;
        return;
    }

    const candidates=nominal.filter(x=>x.HS===hs && x.Country.toLowerCase()===country);

    if(!candidates.length){
        result.innerHTML="Nenalezeno.";
        return;
    }

    html += `<div class="section"><b>${countryInput}</b>`;

    candidates.forEach(x=>{
        const prod=normalizeProd(x.ProdType);

        const bm=benchmark.filter(b=>b.HS===hs && normalizeProd(b.ProdType)===prod);
        const bmA=bm.find(b=>b.Source==="A");
        const bmB=bm.find(b=>b.Source==="B");

        html += `
            ${valueRow("Nominal", x.Nominal)}
            <div>Typ výroby: ${prod}</div>
            ${valueRow("Benchmark A", bmA ? bmA.Benchmark : "-")}
            ${valueRow("Benchmark B", bmB ? bmB.Benchmark : "-")}
        `;
    });

    html += "</div>";

    result.innerHTML=html;
}

loadData();