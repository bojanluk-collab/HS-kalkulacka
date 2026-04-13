let nominal=[], benchmark=[];

function toggleMenu(){
 const m=document.getElementById('menu');
 m.style.display=m.style.display==='block'?'none':'block';
}

function showToast(){
 const t=document.getElementById('toast');
 t.classList.add('show');
 setTimeout(()=>t.classList.remove('show'),1000);
}

function copyToClipboard(t){
 navigator.clipboard.writeText(t);
 showToast();
}

function saveSettings(){
 localStorage.setItem('showA',document.getElementById('showA').checked);
 localStorage.setItem('showB',document.getElementById('showB').checked);
}

function loadSettings(){
 document.getElementById('showA').checked = localStorage.getItem('showA') !== 'false';
 document.getElementById('showB').checked = localStorage.getItem('showB') !== 'false';
}

document.addEventListener('change', e=>{
 if(e.target.id==='showA'||e.target.id==='showB') saveSettings();
});

function normalizeHS(h){return String(h).replace(/\s+/g,'').trim();}
function normalizeProd(p){return String(p||'').trim();}

function row(label,val){
 return `<div class="value">${label}: ${val}<span class="copy" onclick="copyToClipboard('${val}')">📋</span></div>`;
}

async function loadData(){
 const n=await fetch('nominal.json').then(r=>r.json());
 const b=await fetch('benchmark.json').then(r=>r.json());

 nominal=n.data;
 benchmark=b.data;

 document.getElementById('version').innerText="Verze dat: "+n.version;

 loadSettings();

 // našeptávač HS
 const hsList = document.getElementById('hsList');
 [...new Set(nominal.map(x => x.HS))].forEach(h => {
     const o = document.createElement('option');
     o.value = h;
     hsList.appendChild(o);
 });

 // našeptávač zemí
 const countryList = document.getElementById('countryList');
 [...new Set(nominal.map(x => x.Country))].forEach(c => {
     const o = document.createElement('option');
     o.value = c;
     countryList.appendChild(o);
 });
}

function calculate(){
 const hs=normalizeHS(document.getElementById('hs').value);
 const country=document.getElementById('country').value.trim().toLowerCase();
 const showA=document.getElementById('showA').checked;
 const showB=document.getElementById('showB').checked;

 const data = country ? nominal.filter(x=>x.HS===hs && x.Country.toLowerCase()===country)
                      : nominal.filter(x=>x.HS===hs);

 if(!data.length){result.innerHTML="Nenalezeno";return;}

 let html=`<b>HS:</b> ${hs}`;

 data.forEach(x=>{
  const prod=normalizeProd(x.ProdType);
  const bm=benchmark.filter(b=>b.HS===hs && normalizeProd(b.ProdType)===prod);
  const A=bm.find(b=>b.Source==='A');
  const B=bm.find(b=>b.Source==='B');

  html+=`<div class="section"><b>${x.Country}</b>`;
  html+=row("Nominal",x.Nominal);
  html+=`Typ: ${prod}<br>`;

  if(showA && A) html+=row("Benchmark A",A.Benchmark);
  if(showB && B) html+=row("Benchmark B",B.Benchmark);

  html+="</div>";
 });

 result.innerHTML=html;
}

loadData();
