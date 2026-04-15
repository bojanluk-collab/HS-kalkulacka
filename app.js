let nominal = [];
let benchmark = [];

function toggleMenu(){
const m=document.getElementById('menu');
m.style.display=m.style.display==='block'?'none':'block';
}

function showToast(){
const t=document.getElementById('toast');
t.classList.add('show');
setTimeout(()=>t.classList.remove('show'),1000);
}

function copyToClipboard(text){
navigator.clipboard.writeText(text);
showToast();
}

function normalizeHS(h){ return String(h).replace(/\s+/g,'').trim(); }
function normalizeProd(p){ return String(p||'').replace(/[()]/g,'').trim().toUpperCase(); }

function row(label,val){
if(!val) val="-";
return `<div class="value"><span><b>${label}:</b> ${val}</span><span class="copy" onclick="copyToClipboard('${val}')">📋</span></div>`;
}

function renderDescription(text){
if(!text) return "";
return `<div class="desc-wrapper"><div class="desc" onclick="this.classList.toggle('open')">${text}</div><span class="more">… více</span></div>`;
}

async function loadData(){
const n=await fetch('nominal.json').then(r=>r.json());
const b=await fetch('benchmark.json').then(r=>r.json());
nominal=n.data||[];
benchmark=b.data||[];

document.getElementById('version').innerText="Verze dat: "+(n.version||"-");

fillAutocomplete();
}

function fillAutocomplete(){
const hsList=document.getElementById('hsList');
hsList.innerHTML="";
[...new Set(nominal.map(x=>x.HS))].forEach(h=>{
const o=document.createElement('option'); o.value=h; hsList.appendChild(o);
});

const cList=document.getElementById('countryList');
cList.innerHTML="";
[...new Set(nominal.map(x=>x.Country))].forEach(c=>{
const o=document.createElement('option'); o.value=c; cList.appendChild(o);
});
}

function calculate(){
const hs=normalizeHS(document.getElementById('hs').value);
const country=document.getElementById('country').value.toLowerCase();
const year=document.getElementById('yearSelect').value;

let data=country?nominal.filter(x=>x.HS===hs&&x.Country.toLowerCase()===country):nominal.filter(x=>x.HS===hs);

let html="<b>HS:</b> "+hs;

data.forEach(x=>{
let val=x.Nominal_2026;
if(year==="2027") val=x.Nominal_2027;
if(year==="2028") val=x.Nominal_2028;

html+=`<div class="section"><b>${x.Country}</b>`;
html+=`<div><b>Description:</b></div>`+renderDescription(x.Description);
html+=row("Nominal",val);
html+=`</div>`;
});

document.getElementById('result').innerHTML=html;
}

document.addEventListener('change',e=>{
if(['showA','showB','yearSelect'].includes(e.target.id)) calculate();
});

loadData();
