let nominal = [];
let benchmark = [];

function normalizeHS(h){ return String(h).replace(/\s+/g,'').trim(); }

function row(label, val, accent){
  if(!val) val = "-";
  return `<div class="row"><span class="row-label">${label}</span><span class="row-val${accent?' accent':''}">${val}</span></div>`;
}

function renderDescription(text){
  if(!text) return "";
  return `<div class="desc-block"><div class="desc-block-label">Popis</div><div class="desc">${text}</div></div>`;
}

function attachMoreButtons(){
  document.querySelectorAll('.desc-block').forEach(wrapper => {
    const desc = wrapper.querySelector('.desc');
    if(desc.scrollHeight > desc.clientHeight){
      const btn = document.createElement('span');
      btn.className = 'more';
      btn.textContent = '… více';
      btn.onclick = () => { desc.classList.add('open'); btn.style.display='none'; };
      wrapper.appendChild(btn);
    }
  });
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

  let html = `<div class="result-hs">HS: ${hs}</div>`;

  data.forEach(x => {
    let nomVal = "";
    if(year === "2026") nomVal = x.Nominal_2026;
    else if(year === "2027") nomVal = x.Nominal_2027;
    else if(year === "2028") nomVal = x.Nominal_2028;

    const bmA = getBenchmark(hs, x.ProdType, "A");
    const bmB = getBenchmark(hs, x.ProdType, "B");

    html += `<div class="section">`;
    html += `<div class="section-header">${x.Country}</div>`;
    html += `<div class="section-body">`;
    html += renderDescription(x.Description);
    html += row("Nominální hodnota", nomVal, true);
    html += row("Typ výroby", x.ProdType || "-");
    if(showA && bmA !== null) html += row("Benchmark A", bmA);
    if(showB && bmB !== null) html += row("Benchmark B", bmB);
    html += `</div></div>`;
  });

  document.getElementById('result').innerHTML = html;
  attachMoreButtons();
}

document.addEventListener('change', e => {
  if(['showA','showB','yearSelect'].includes(e.target.id)) calculate();
});

loadData();
