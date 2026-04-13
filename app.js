let nominal = [];
let benchmark = [];

function normalizeHS(hs) {
    return String(hs).replace(/\s+/g,'').trim();
}

function normalizeProd(p){
    return String(p||"").trim();
}

async function loadData(){
    nominal = await fetch('./nominal.json').then(r=>r.json());
    benchmark = await fetch('./benchmark.json').then(r=>r.json());

    const hsSet=[...new Set(nominal.map(x=>x.HS))];
    hsSet.forEach(h=>{
        let o=document.createElement('option');
        o.value=h;
        hsList.appendChild(o);
    });

    const countries=[...new Set(nominal.map(x=>x.Country))];
    countries.forEach(c=>{
        let o=document.createElement('option');
        o.value=c;
        countryList.appendChild(o);
    });
}

function calculate(){
    const hs=normalizeHS(hsInput.value);
    const country=countryInput.value.toLowerCase();

    const candidates=nominal.filter(x=>
        x.HS===hs && x.Country.toLowerCase()===country
    );

    if(!candidates.length){
        result.innerHTML="Nenalezeno v Nominal";
        return;
    }

    let html="";
    candidates.forEach((x,i)=>{
        const prod=normalizeProd(x.ProdType);

        let bm=benchmark.find(b=>b.HS===hs && normalizeProd(b.ProdType)===prod);

        html+=`<hr>
        Varianta ${i+1}<br>
        Nominal: ${x.Nominal}<br>
        Typ výroby: ${prod||"(neurčený)"}<br>
        Benchmark: ${bm?bm.Benchmark:"nenalezen"}<br>`;
    });

    result.innerHTML=html;
}

loadData();
