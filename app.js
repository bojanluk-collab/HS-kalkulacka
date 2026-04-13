let nominal = [];
let benchmark = [];
let version = "";

function normalizeHS(hs){ return String(hs).replace(/\s+/g,'').trim(); }
function normalizeProd(p){ return String(p||"").trim(); }

function copyToClipboard(text){
    navigator.clipboard.writeText(text);
}

async function loadData(){
    const nomRaw = await fetch('./nominal.json?v=3').then(r=>r.json());
    const benchRaw = await fetch('./benchmark.json?v=3').then(r=>r.json());

    nominal = nomRaw.data;
    benchmark = benchRaw.data;
    version = nomRaw.version;

    document.getElementById('version').innerHTML="Verze dat: "+version;

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

    let html=`<b>HS:</b> ${hs}<br><br>`;

    if(!countryInput){
        const all=nominal.filter(x=>x.HS===hs);
        if(!all.length){
            result.innerHTML="Pro tento HS kód neexistují žádná data.";
            return;
        }

        html+=`<b>Nalezeno zemí:</b> ${all.length}<br><br>`;

        all.forEach(x=>{
            const prod=normalizeProd(x.ProdType);
            const bmMatches=benchmark.filter(b=>b.HS===hs && normalizeProd(b.ProdType)===prod);

            const bmA=bmMatches.find(b=>b.Source==="A");
            const bmB=bmMatches.find(b=>b.Source==="B");

            html+=`<hr><b>${x.Country}</b><br>
            Nominal: ${x.Nominal} <button onclick="copyToClipboard('${x.Nominal}')">📋</button><br>
            Typ výroby: ${prod||"(neurčený)"}<br><br>
            Benchmark A: ${bmA?bmA.Benchmark:"není definován"} ${bmA?`<button onclick="copyToClipboard('${bmA.Benchmark}')">📋</button>`:""}<br>
            Benchmark B: ${bmB?bmB.Benchmark:"není definován"} ${bmB?`<button onclick="copyToClipboard('${bmB.Benchmark}')">📋</button>`:""}<br>`;
        });

        result.innerHTML=html;
        return;
    }

    const candidates=nominal.filter(x=>x.HS===hs && x.Country.toLowerCase()===country);

    if(!candidates.length){
        result.innerHTML="Pro tuto kombinaci není definována nominální hodnota.";
        return;
    }

    html+=`<b>Země:</b> ${countryInput}<br><br>`;

    candidates.forEach(x=>{
        const prod=normalizeProd(x.ProdType);
        const bmMatches=benchmark.filter(b=>b.HS===hs && normalizeProd(b.ProdType)===prod);

        const bmA=bmMatches.find(b=>b.Source==="A");
        const bmB=bmMatches.find(b=>b.Source==="B");

        html+=`<hr>
        Nominal: ${x.Nominal} <button onclick="copyToClipboard('${x.Nominal}')">📋</button><br>
        Typ výroby: ${prod||"(neurčený)"}<br><br>
        Benchmark A: ${bmA?bmA.Benchmark:"není definován"} ${bmA?`<button onclick="copyToClipboard('${bmA.Benchmark}')">📋</button>`:""}<br>
        Benchmark B: ${bmB?bmB.Benchmark:"není definován"} ${bmB?`<button onclick="copyToClipboard('${bmB.Benchmark}')">📋</button>`:""}<br>`;
    });

    result.innerHTML=html;
}

loadData();
