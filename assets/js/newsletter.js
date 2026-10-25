/* Newsletter-Anmeldung: sendet das Formular im Hintergrund an /nl/anmelden.php (Double-Opt-In).
   Ohne JavaScript funktioniert das Formular normal und landet auf einer Statusseite. Kein Tracking, keine Cookies. */
(function () {
  "use strict";
  document.querySelectorAll("form[data-nl]").forEach(function (form) {
    var status = form.querySelector(".nl-status"),
        email = form.elements.email, check = form.elements.einwilligung,
        knopf = form.querySelector(".nl-knopf");

    function melde(text, fehler) {
      status.textContent = text;
      status.classList.toggle("nl-fehler", !!fehler);
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      email.removeAttribute("aria-invalid"); check.removeAttribute("aria-invalid");
      if (!email.value.trim() || !email.checkValidity()) {
        email.setAttribute("aria-invalid", "true"); melde("Bitte geben Sie eine gültige E-Mail-Adresse ein.", true); email.focus(); return;
      }
      if (!check.checked) {
        check.setAttribute("aria-invalid", "true"); melde("Bitte setzen Sie das Häkchen, damit wir Ihnen schreiben dürfen.", true); check.focus(); return;
      }
      if (location.protocol === "file:") { melde("Vorschau: Die Anmeldung funktioniert erst auf dem Server.", true); return; }
      knopf.disabled = true; melde("Einen Moment …", false);
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" }, credentials: "same-origin" })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (d) {
          if (d.ok) {
            form.classList.add("nl-fertig");
            melde(d.message || "Fast geschafft: Bitte bestätigen Sie den Link in unserer E-Mail.", false);
            status.setAttribute("tabindex", "-1"); status.focus();
          } else {
            knopf.disabled = false;
            melde(d.message || "Das hat nicht geklappt. Bitte versuchen Sie es später noch einmal.", true);
          }
        })
        .catch(function () { knopf.disabled = false; melde("Keine Verbindung. Bitte versuchen Sie es später noch einmal.", true); });
    });
  });
})();
