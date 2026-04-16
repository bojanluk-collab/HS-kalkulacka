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
  const [n, b, ac] = await Promise.all([
    fetch('nominal.json').then(r => r.json()),
    fetch('benchmark.json').then(r => r.json()),
    fetch('autocomplete.json').then(r => r.json())
  ]);
  nominal = n.data || [];
  benchmark = b.data || [];
  document.getElementById('version').innerText = "Verze dat: " + (n.v || "-");
  fillAutocomplete(ac);

  // Skryj loading, aktivuj tlačítko
  document.getElementById('loadingBar').style.display = 'none';
  document.getElementById('loadingHint').style.display = 'none';
  document.getElementById('searchBtn').disabled = false;
}

function fillAutocomplete(ac){
  const hsList = document.getElementById('hsList');
  hsList.innerHTML = "";
  (ac.hs || []).forEach(h => {
    const o = document.createElement('option'); o.value = h; hsList.appendChild(o);
  });
  const cList = document.getElementById('countryList');
  cList.innerHTML = "";
  (ac.countries || []).forEach(c => {
    const o = document.createElement('option'); o.value = c; cList.appendChild(o);
  });
}

function getBenchmark(hs, prodType, source, year){
  const yearSuffix = (year === "2028") ? "2" : "1";
  const pool = benchmark.filter(b => b.h === hs && b.s === source);

  // 1. Přesná shoda ProdType
  let match = pool.find(b => (b.p || "") === (prodType || ""));
  if(match) return match.b;

  // 2. Nominál má písmeno, benchmark má písmeno+číslo (F → F1 nebo F2)
  if(prodType){
    match = pool.find(b => b.p === prodType + yearSuffix);
    if(match) return match.b;
  }

  // 3. Nominál nemá ProdType, benchmark má jen číslo (1 nebo 2)
  if(!prodType){
    match = pool.find(b => b.p === yearSuffix);
    if(match) return match.b;
  }

  return null;
}

function calculate(){
  const hs = normalizeHS(document.getElementById('hs').value);
  const country = document.getElementById('country').value.toLowerCase();
  const year = document.getElementById('yearSelect').value;
  const showA = document.getElementById('showA').checked;
  const showB = document.getElementById('showB').checked;
  const alokace = parseFloat(document.getElementById('alokace').value) || 0.975;
  const cenaPovolenky = parseFloat(document.getElementById('cenaPovolenky').value) || 80;

  if(!hs){
    document.getElementById('result').innerHTML = '<p class="error">Zadejte prosím HS kód.</p>';
    return;
  }

  let data = nominal.filter(x => x.h === hs);
  const allForHS = data;
  if(country) data = data.filter(x => x.c.toLowerCase() === country);

  // Pokud hledáme konkrétní zemi ale HS tam není, přidáme _Other Countries
  let otherData = [];
  if(country && data.length === 0){
    otherData = allForHS.filter(x => x.c === '_Other Countries and Territorie');
  }

  if(data.length === 0 && otherData.length === 0){
    document.getElementById('result').innerHTML = '<p class="error">Žádné výsledky nenalezeny.</p>';
    return;
  }

  let html = `<div class="result-hs">HS: ${hs}</div>`;

  data.forEach(x => {
    let nomVal = "";
    if(year === "2026") nomVal = x.n6;
    else if(year === "2027") nomVal = x.n7;
    else if(year === "2028") nomVal = x.n8;

    const bmA = getBenchmark(hs, x.p, "A", year);
    const bmB = getBenchmark(hs, x.p, "B", year);

    // Výpočet: (Nominální – (Benchmark B × Alokace)) × Cena povolenky
    let vysledek = null;
    const nomNum = parseFloat(nomVal);
    const bmBNum = parseFloat(bmB);
    if(!isNaN(nomNum) && !isNaN(bmBNum)){
      vysledek = (nomNum - (bmBNum * alokace)) * cenaPovolenky;
    }

    html += `<div class="section">`;
    html += `<div class="section-header">${x.c}</div>`;
    html += `<div class="section-body">`;
    html += renderDescription(x.d);
    html += row("Nominální hodnota", nomVal, true);
    html += row("Typ výroby", x.p || "-");
    if(showA && bmA !== null) html += row("Benchmark A", bmA);
    if(showB && bmB !== null) html += row("Benchmark B", bmB);
    if(vysledek !== null){
      html += `<div class="result-row">
        <span class="result-row-label">Výsledná částka / t</span>
        <span class="result-row-val">${vysledek.toFixed(2)} EUR</span>
      </div>`;
    }
    html += `</div></div>`;
  });

  // Přidej kartu _Other Countries pokud hledáme zemi která HS nemá
  if(otherData.length > 0){
    const searchedCountry = document.getElementById('country').value.trim();
    // Prázdná karta hledané země
    html += `<div class="section">`;
    html += `<div class="section-header">${searchedCountry} <span style="font-size:11px;font-weight:400;opacity:0.7">— v datech nenalezeno</span></div>`;
    html += `<div class="section-body"><p style="font-size:13px;color:var(--mid);margin:4px 0">Pro tuto zemi nejsou dostupné specifické hodnoty. Použijte výpočet níže.</p></div>`;
    html += `</div>`;

    // Karta Other Countries
    otherData.forEach(x => {
      let nomVal = "";
      if(year === "2026") nomVal = x.n6;
      else if(year === "2027") nomVal = x.n7;
      else if(year === "2028") nomVal = x.n8;

      const bmA = getBenchmark(hs, x.p, "A", year);
      const bmB = getBenchmark(hs, x.p, "B", year);

      let vysledek = null;
      const nomNum = parseFloat(nomVal);
      const bmBNum = parseFloat(bmB);
      if(!isNaN(nomNum) && !isNaN(bmBNum)){
        vysledek = (nomNum - (bmBNum * alokace)) * cenaPovolenky;
      }

      html += `<div class="section">`;
      html += `<div class="section-header">Ostatní země a území</div>`;
      html += `<div class="section-body">`;
      html += renderDescription(x.d);
      html += row("Nominální hodnota", nomVal, true);
      html += row("Typ výroby", x.p || "-");
      if(showA && bmA !== null) html += row("Benchmark A", bmA);
      if(showB && bmB !== null) html += row("Benchmark B", bmB);
      if(vysledek !== null){
        html += `<div class="result-row">
          <span class="result-row-label">Výsledná částka / t</span>
          <span class="result-row-val">${vysledek.toFixed(2)} EUR</span>
        </div>`;
      }
      html += `</div></div>`;
    });
  }

  document.getElementById('result').innerHTML = html;
  attachMoreButtons();
}

document.addEventListener('change', e => {
  if(['showA','showB','yearSelect','alokace','cenaPovolenky'].includes(e.target.id)) calculate();
});

loadData();
