/* Kontofinder: Kontotyp-Reiter, Schufa-Filter, Merkmale und Sortierung. Ohne JS bleibt die vollständige Liste sichtbar. */
(function () {
  var box = document.getElementById("kontofinder");
  if (!box) return;
  var form = box.querySelector(".kf-form"),
      liste = box.querySelector(".kf-liste"),
      anzahl = box.querySelector(".kf-anzahl"),
      leer = box.querySelector(".kf-leer"),
      konten = Array.prototype.slice.call(liste.children),
      haken = ["kostenlos", "de", "es", "giro", "pk"];
  form.hidden = false;
  var weitere = form.querySelector(".kf-weitere");
  if (weitere && window.matchMedia("(min-width: 761px)").matches) weitere.open = true;

  function wert(name) { return form.querySelector('input[name="' + name + '"]:checked').value; }

  function anwenden() {
    var typ = wert("typ"), aktiv = haken.filter(function (n) { return form.elements[n].checked; }),
        sort = form.elements.sort.value, sichtbar = 0;
    // Schufa-Chips: Anzahl je Kontotyp, leere Gruppen ausblenden
    box.querySelectorAll("[data-schufa-chip]").forEach(function (chip) {
      var g = chip.dataset.schufaChip, n = konten.filter(function (k) {
        return (typ === "alle" || k.dataset.typ === typ) && k.dataset.schufa === g;
      }).length;
      chip.querySelector("small").textContent = n;
      chip.hidden = n === 0;
      if (n === 0 && chip.querySelector("input").checked) form.querySelector('input[name="schufa"][value="alle"]').checked = true;
    });
    var schufa = wert("schufa");
    konten.sort(function (a, b) {
      if (sort === "name") return a.dataset.name.localeCompare(b.dataset.name, "de");
      if (sort === "empfohlen" && a.dataset.partner !== b.dataset.partner) return b.dataset.partner - a.dataset.partner;
      return (parseFloat(a.dataset.preis) - parseFloat(b.dataset.preis)) || a.dataset.name.localeCompare(b.dataset.name, "de");
    });
    konten.forEach(function (k) {
      var ok = (typ === "alle" || k.dataset.typ === typ) &&
               (schufa === "alle" || k.dataset.schufa === schufa) &&
               aktiv.every(function (n) { return k.dataset[n] === "1"; });
      k.hidden = !ok;
      if (ok) sichtbar++;
      liste.appendChild(k);
    });
    anzahl.textContent = sichtbar === 1 ? "1 Konto" : sichtbar + " Konten";
    leer.hidden = sichtbar > 0;
  }

  // Sortier-Auswahl (eigene Liste statt Browser-Menü)
  var dd = form.querySelector(".kf-dd"), knopf = dd.querySelector(".kf-dd-knopf"), dl = dd.querySelector(".kf-dd-liste"),
      opts = Array.prototype.slice.call(dl.querySelectorAll("[role=option]")), wertFeld = dd.querySelector("input[name=sort]"),
      anzeige = dd.querySelector("#kf-dd-wert"), aktivIdx = 0;
  function markiere(i) {
    aktivIdx = (i + opts.length) % opts.length;
    opts.forEach(function (o, n) { o.classList.toggle("ist-aktiv", n === aktivIdx); });
    dl.setAttribute("aria-activedescendant", opts[aktivIdx].id);
  }
  function oeffnen() {
    dl.hidden = false; knopf.setAttribute("aria-expanded", "true");
    markiere(opts.findIndex(function (o) { return o.getAttribute("aria-selected") === "true"; }));
    dl.focus();
  }
  function schliessen(fokus) {
    dl.hidden = true; knopf.setAttribute("aria-expanded", "false");
    if (fokus) knopf.focus();
  }
  function waehle(i, fokus) {
    opts.forEach(function (o, n) { o.setAttribute("aria-selected", n === i ? "true" : "false"); });
    wertFeld.value = opts[i].dataset.value; anzeige.textContent = opts[i].textContent;
    schliessen(fokus); anwenden();
  }
  knopf.addEventListener("click", function () { dl.hidden ? oeffnen() : schliessen(false); });
  knopf.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); oeffnen(); }
  });
  opts.forEach(function (o, i) {
    o.addEventListener("click", function () { waehle(i, false); });
    o.addEventListener("mousemove", function () { markiere(i); });
  });
  dl.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowDown") { ev.preventDefault(); markiere(aktivIdx + 1); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); markiere(aktivIdx - 1); }
    else if (ev.key === "Home") { ev.preventDefault(); markiere(0); }
    else if (ev.key === "End") { ev.preventDefault(); markiere(opts.length - 1); }
    else if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); waehle(aktivIdx, true); }
    else if (ev.key === "Escape" || ev.key === "Tab") { schliessen(ev.key === "Escape"); }
  });
  document.addEventListener("click", function (ev) { if (!dd.contains(ev.target)) schliessen(false); });

  form.addEventListener("change", anwenden);
  form.addEventListener("reset", function () { setTimeout(function () { waehle(0, false); }, 0); });
  form.addEventListener("submit", function (ev) { ev.preventDefault(); });
  anwenden();
})();
