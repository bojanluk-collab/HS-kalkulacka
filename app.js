let nominal = [];
let benchmark = [];

function toggleMenu(){
  const m = document.getElementById('menu');
  m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

function normalizeHS(h){ return String(h).replace(/\s+/g,'').trim(); }

function row(label, val){
  if(!val) val = "-";
  return `<div class="value"><span><b>${label}:</b> ${val}</span></div>`;
}

function renderDescription(text){
  if(!text) return "";
  return `<div class="desc-wrapper"><div class="desc">${text}</div><span class="more" onclick="this.parentElement.querySelector('.desc').classList.toggle('open');this.style.display='none'">… více</span></div>`;
}

async function loadData(){
  const n = await fetch('nominal.json').then(r => r.json());
  const b = await fetch('benchmark.json').then(r => r.json());
  nominal = n.data || [];
  benchmark = b.data || [];

  document.getElementById('version').innerText = "Verze dat: " + (n.version || "-");

  fillAutocomplete();
}

function fillAutocomplete(){
  const hsList = document.getElementById('hsList');
  hsList.innerHTML = "";
  [...new Set(nominal.map(x => x.HS))].forEach(h => {
    const o = document.createElement('option'); o.value = h; hsList.appendChild(o);
  });

  const cList = document.getElementById('countryList');
  cList.innerHTML = "";
  [...new Set(nominal.map(x => x.Country))].forEach(c => {
    const o = document.createElement('option'); o.value = c; cList.appendChild(o);
  });
}

function getBenchmark(hs, prodType, source){
  const match = benchmark.find(b =>
    b.HS === hs &&
    b.Source === source &&
    (b.ProdType || "") === (prodType || "")
  );
  return match ? match.Benchmark : null;
}

function calculate(){
  const hs = normalizeHS(document.getElementById('hs').value);
  const country = document.getElementById('country').value.toLowerCase();
  const year = document.getElementById('yearSelect').value;
  const showA = document.getElementById('showA').checked;
  const showB = document.getElementById('showB').checked;

  if(!hs){
    document.getElementById('result').innerHTML = '<p class="error">Zadejte prosím HS kód.</p>';
    return;
  }

  let data = nominal.filter(x => x.HS === hs);
  if(country) data = data.filter(x => x.Country.toLowerCase() === country);

  if(data.length === 0){
    document.getElementById('result').innerHTML = '<p class="error">Žádné výsledky nenalezeny.</p>';
    return;
  }

  let html = `<b>HS:</b> ${hs}`;

  data.forEach(x => {
    let nomVal = "";
    if(year === "2026") nomVal = x.Nominal_2026;
    else if(year === "2027") nomVal = x.Nominal_2027;
    else if(year === "2028") nomVal = x.Nominal_2028;

    const bmA = getBenchmark(hs, x.ProdType, "A");
    const bmB = getBenchmark(hs, x.ProdType, "B");

    html += `<div class="section">`;
    html += `<b>${x.Country}</b>`;
    html += `<div><b>Popis:</b></div>` + renderDescription(x.Description);
    html += row("Nominální hodnota", nomVal);
    html += row("Typ výroby", x.ProdType || "-");

    if(showA && bmA !== null) html += row("Benchmark A", bmA);
    if(showB && bmB !== null) html += row("Benchmark B", bmB);

    html += `</div>`;
  });

  document.getElementById('result').innerHTML = html;
}

document.addEventListener('change', e => {
  if(['showA','showB','yearSelect'].includes(e.target.id)) calculate();
});

loadData();
