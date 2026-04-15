let nominal=[];let benchmark=[];
function toggleMenu(){const m=document.getElementById('menu');m.style.display=m.style.display==='block'?'none':'block';}
function showToast(){const t=document.getElementById('toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1000);}
function copyToClipboard(text){navigator.clipboard.writeText(text);showToast();}
function normalizeHS(h){return String(h).replace(/\s+/g,'').trim();}
function normalizeProd(p){return String(p||'').replace(/[()]/g,'').trim().toUpperCase();}
function renderDescription(text){if(!text)return '';const safe=text.replace(/"/g,'&quot;');return `<div class="desc-wrapper"><div class="desc" title="${safe}" onclick="this.classList.toggle('open')">${text}</div><span class="more">… více</span></div>`;}
function row(label,val){if(!val)val='-';const safeVal=String(val).replace(/'/g,"\\'");return '<div class="value"><span>'+label+': '+val+'</span>'+(val!=='-'?'<span class="copy" onclick="copyToClipboard(\''+safeVal+'\')">📋</span>':'')+'</div>';}
async function loadData(){const n=await fetch('nominal.json?v=1.2').then(r=>r.json());const b=await fetch('benchmark.json?v=1.2').then(r=>r.json());nominal=n.data||[];benchmark=b.data||[];document.getElementById('version').innerText="Verze dat: "+(n.version||"-");}
function calculate(){const hs=normalizeHS(document.getElementById('hs').value);const country=document.getElementById('country').value.trim().toLowerCase();
let data=country?nominal.filter(x=>x.HS===hs&&x.Country.toLowerCase()===country):nominal.filter(x=>x.HS===hs);
if(!data.length){document.getElementById('result').innerHTML="Nenalezeno";return;}
let html="<b>HS:</b> "+hs;
data.forEach(x=>{
const prod=normalizeProd(x.ProdType);
const bm=benchmark.filter(b=>b.HS===hs&&normalizeProd(b.ProdType)===prod);
const A=bm.find(b=>b.Source==='A');const B=bm.find(b=>b.Source==='B');
html+='<div class="section"><b>'+x.Country+'</b>';
html+=renderDescription(x.Description);
html+=row("Nominal",x.Nominal_2026);
html+='<div>Typ výroby: '+(prod||"-")+'</div>';
if(A)html+=row("Benchmark A",A.Benchmark);
if(B)html+=row("Benchmark B",B.Benchmark);
html+='</div>';
});
document.getElementById('result').innerHTML=html;}
loadData();
