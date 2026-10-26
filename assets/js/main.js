// BonitätsRatgeber: nur das Nötigste.
// Häufige Fragen: Ein Sprunglink auf eine Frage öffnet sie.
(function () {
  function open() {
    var id = location.hash.slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === "DETAILS") el.open = true;
  }
  window.addEventListener("hashchange", open);
  open();
})();

// Selbsttests: Quiz (jede Frage einzeln auswerten) und Check (Schritt für Schritt bis zum Ergebnis).
// Barrierefreiheit: Nach jeder Antwort springt der Fokus auf die Erklärung bzw. die nächste Frage,
// das Gesamtergebnis sagt ein dauerhaft vorhandener Live-Bereich an.
(function () {
  var nr = 0;
  function sperren(q) { q.querySelectorAll("button").forEach(function (b) { b.disabled = true; }); }
  function fokus(el) { if (!el) return; el.setAttribute("tabindex", "-1"); el.focus(); }
  function vorbereiten(box) {
    // Antwortknöpfe als Gruppe mit der Frage als Namen: der Screenreader liest „Frage …, Ja, Taste“
    box.querySelectorAll(".q").forEach(function (q) {
      var f = q.querySelector(".q-frage"), w = q.querySelector(".q-wahl");
      if (!f || !w) return;
      f.id = f.id || "q-frage-" + (++nr);
      w.setAttribute("role", "group");
      w.setAttribute("aria-labelledby", f.id);
    });
    // Ergebnis: Live-Bereich bleibt im DOM, nur der sichtbare Kasten wird ein-/ausgeblendet
    var erg = box.querySelector(".quiz-ergebnis");
    if (erg) erg.removeAttribute("aria-live");
    var live = box.querySelector(".quiz-live");
    if (!live) {
      live = document.createElement("p");
      live.className = "quiz-live vh"; live.setAttribute("role", "status");
      box.appendChild(live);
    }
    live.textContent = "";
    return live;
  }

  function quiz(box) {
    var live = vorbereiten(box);
    var qs = box.querySelectorAll(".q"), erg = box.querySelector(".quiz-ergebnis"), punkte = 0, fertig = 0;
    qs.forEach(function (q) {
      q.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          var ok = b.dataset.a === q.dataset.richtig;
          sperren(q);
          b.setAttribute("aria-pressed", "true");
          q.classList.add(ok ? "q-ok" : "q-nein");
          b.classList.add(ok ? "ist-richtig" : "ist-falsch");
          b.insertAdjacentHTML("afterbegin", ok ? '<span aria-hidden="true">✓ </span>' : '<span aria-hidden="true">✗ </span>');
          b.insertAdjacentHTML("beforeend", ok ? '<span class="vh"> (Ihre Antwort, richtig)</span>' : '<span class="vh"> (Ihre Antwort, falsch)</span>');
          if (!ok) {
            var r = q.querySelector('[data-a="' + q.dataset.richtig + '"]');
            r.classList.add("ist-loesung");
            r.insertAdjacentHTML("afterbegin", '<span aria-hidden="true">✓ </span>');
            r.insertAdjacentHTML("beforeend", '<span class="vh"> (richtige Antwort)</span>');
          }
          var e = q.querySelector(".q-erkl");
          e.innerHTML = '<strong class="q-urteil">' + (ok ? "✓ Richtig! " : "✗ Leider falsch. ") + "</strong>" + e.innerHTML;
          e.hidden = false;
          fokus(e);
          if (ok) punkte++;
          if (++fertig === qs.length) {
            var text = punkte + " von " + qs.length + " richtig. " +
              (punkte === qs.length ? "Sie kennen sich gut aus." : "Die Antworten stehen jeweils im Text oben.");
            erg.textContent = text;
            erg.hidden = false;
            setTimeout(function () { live.textContent = "Ergebnis: " + text; }, 600);
          }
        });
      });
    });
  }

  function check(box) {
    vorbereiten(box);
    var qs = box.querySelectorAll(".q"), erg = box.querySelector(".quiz-ergebnis");
    qs.forEach(function (q, i) {
      q.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          sperren(q);
          b.setAttribute("aria-pressed", "true");
          b.classList.add("ist-gewaehlt");
          if (b.dataset.a === q.dataset.stop) {
            var e = q.querySelector(".q-erkl");
            e.hidden = false;
            e.classList.add("q-stopp");
            fokus(e);
          } else if (qs[i + 1]) {
            qs[i + 1].hidden = false;
            qs[i + 1].querySelector("button").focus();
          } else {
            erg.hidden = false;
            fokus(erg);
          }
        });
      });
    });
  }

  document.querySelectorAll(".quiz").forEach(function (box) {
    var html = box.innerHTML;
    (box.dataset.typ === "check" ? check : quiz)(box);
    var neu = document.createElement("button");
    neu.type = "button"; neu.className = "quiz-neu"; neu.textContent = "Noch einmal";
    neu.addEventListener("click", function () {
      box.innerHTML = html;
      (box.dataset.typ === "check" ? check : quiz)(box);
      box.appendChild(neu);
      box.querySelector("button").focus();
    });
    box.appendChild(neu);
  });
})();

// Inhaltsverzeichnis rechts: markiert den Abschnitt, in dem man gerade liest.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll(".lese .toc a[href^='#']"));
  if (!links.length) return;
  var ziele = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  var tick = false;
  function markieren() {
    tick = false;
    var grenze = window.innerHeight * 0.3, aktiv = -1;
    ziele.forEach(function (z, i) { if (z && z.getBoundingClientRect().top <= grenze) aktiv = i; });
    links.forEach(function (a, i) {
      if (i === aktiv) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(markieren); } }, { passive: true });
  markieren();
})();

// Mobiles Menü: Knopf öffnet und schließt, Escape und Klick daneben schließen.
(function () {
  var knopf = document.querySelector(".menue-knopf"), menue = document.getElementById("mobilmenue");
  if (!knopf || !menue) return;
  function setzen(offen) {
    knopf.setAttribute("aria-expanded", String(offen));
    knopf.querySelector(".menue-text").textContent = offen ? "Schließen" : "Menü";
    menue.hidden = !offen;
  }
  knopf.addEventListener("click", function () { setzen(menue.hidden); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menue.hidden) { setzen(false); knopf.focus(); } });
  document.addEventListener("click", function (e) { if (!menue.hidden && !menue.contains(e.target) && !knopf.contains(e.target)) setzen(false); });
})();
