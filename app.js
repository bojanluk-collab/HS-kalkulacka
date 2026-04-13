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
 localStorage.setItem('showA',showA.checked);
 localStorage.setItem('showB',showB.checked);
 localStorage.setItem('year',yearSelect.value);
}

function loadSettings(){
 showA.checked = localStorage.getItem('showA') !== 'false';
 showB.checked = localStorage.getItem('showB') !== 'false';
 yearSelect.value = localStorage.getItem('year') || '2026';
}

document.addEventListener('change', e=>{
 if(['showA','showB','yearSelect'].includes(e.target.id)){
   saveSettings();
   calculate();
 }
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

 const hsList = document.getElementById('hsList');
 [...new Set(nominal.map(x=>x.HS))].forEach(h=>{
   const o=document.createElement('option'); o.value=h; hsList.appendChild(o);
 });
}

document.getElementById('hs').addEventListener('input', function(){
 const hs=normalizeHS(this.value);
 const filtered=nominal.filter(x=>x.HS===hs);

 const list=document.getElementById('countryList');
 list.innerHTML='';

 [...new Set(filtered.map(x=>x.Country))].forEach(c=>{
   const o=document.createElement('option'); o.value=c; list.appendChild(o);
 });
});

function calculate(){
 const hs=normalizeHS(hsInput.value);
 const country=countryInput.value.trim().toLowerCase();

 const data = country
   ? nominal.filter(x=>x.HS===hs && x.Country.toLowerCase()===country)
   : nominal.filter(x=>x.HS===hs);

 if(!data.length){result.innerHTML="Nenalezeno";return;}

 let html=`<b>HS:</b> ${hs}`;

 data.forEach(x=>{
   const prod=normalizeProd(x.ProdType);
   const bm=benchmark.filter(b=>b.HS===hs && normalizeProd(b.ProdType)===prod);

   const A=bm.find(b=>b.Source==='A');
   const B=bm.find(b=>b.Source==='B');

   const year=yearSelect.value;

   let val='';
   if(year==='2026') val=x.Nominal_2026;
   if(year==='2027') val=x.Nominal_2027;
   if(year==='2028') val=x.Nominal_2028;

   html+=`<div><b>${x.Country}</b>`;
   html+=row("Nominal",val);
   html+=`Typ: ${prod}<br>`;

   if(showA.checked && A) html+=row("Benchmark A",A.Benchmark);
   if(showB.checked && B) html+=row("Benchmark B",B.Benchmark);

   html+="</div>";
 });

 result.innerHTML=html;
}

loadData();
