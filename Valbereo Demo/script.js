
const wechselEtageButton = document.getElementById("wechselEtage");
const etage1 = document.getElementById("etage1");
const etage2 = document.getElementById("etage2");
const reservierenButton = document.getElementById("reservierenButton");
const reservierungsDatum = document.getElementById("reservierungsDatum");
const kontaktFeld = document.getElementById("kontakt");

let aktuelleEtage = 1;
let reservierungen = { 1: {}, 2: {} }; // Reservierungen pro Etage speichern
let ausgewählteTische = new Set();

wechselEtageButton.addEventListener("click", () => {
    if (aktuelleEtage === 2) {
        etage2.style.display = "block";
        etage1.style.display = "none";
        wechselEtageButton.textContent = "Wechsle zu Etage 2";
        aktuelleEtage = 1;
    } else {
        etage1.style.display = "block";
        etage2.style.display = "none";
        wechselEtageButton.textContent = "Wechsle zu Etage 1";
        aktuelleEtage = 2;
    }

    ladeReservierungen();
});

// Min. Datum auf heute setzen
const heute = new Date().toISOString().split("T")[0];
reservierungsDatum.setAttribute("min", heute);
reservierungsDatum.value = heute;

document.querySelectorAll(".tischgruppe, .tischgruppe-lang, .tischgruppe-bank").forEach((tisch, index) => {
    // Eindeutiger Index für alle Elemente
    tisch.dataset.index = index;
    tisch.addEventListener("click", () => wähleTisch(tisch));
});

// Tisch auswählen
function wähleTisch(tisch) {
    if (tisch.classList.contains("reserviert")) return;

    if (tisch.classList.contains("ausgewählt")) {
        tisch.classList.remove("ausgewählt");
        ausgewählteTische.delete(tisch.dataset.index);
    } else {
        tisch.classList.add("ausgewählt");
        ausgewählteTische.add(tisch.dataset.index);
    }

    reservierenButton.disabled = ausgewählteTische.size === 0;
}

// Reservierung durchführen
function reservieren() {
  if (ausgewählteTische.size === 0) {
    alert("Bitte wähle mindestens einen Tisch aus.");
    return;
  }
  
  const kontakt = kontaktFeld.value.trim();
  if (!istGueltigerKontakt(kontakt)) {
    alert("Bitte gib eine gültige E-Mail oder Telefonnummer ein.");
    return;
  }
  
  const datum = reservierungsDatum.value;
  
  ausgewählteTische.forEach(index => {
    // Reservierung im LocalStorage speichern
    speichereReservierung(aktuelleEtage, index, datum, kontakt);
    // Den Tisch in der Ansicht als reserviert markieren
    const tisch = document.querySelector(`[data-index='${index}']`);
    tisch.classList.add("reserviert");
    tisch.classList.remove("ausgewählt");
  });
  
  ausgewählteTische.clear();
  kontaktFeld.value = "";
  reservierenButton.disabled = true;
  
  alert(`Reservierung für ${datum} in Etage ${aktuelleEtage} erfolgreich!\nKontakt: ${kontakt}`);
  ladeReservierungenAdmin(); // Optional: Admin-Panel aktualisieren
}
// Prüft, ob die Eingabe eine gültige E-Mail oder Telefonnummer ist
function istGueltigerKontakt(kontakt) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefonRegex = /^[0-9+()\s-]{6,}$/;
    return emailRegex.test(kontakt) || telefonRegex.test(kontakt);
}
// Funktion zum Entfernen abgelaufener Reservierungen
function cleanupExpiredReservations() {
    const today = new Date().toISOString().split("T")[0];
    let reservierungsSpeicher = JSON.parse(localStorage.getItem("reservierungen")) || {};

    for (let datum in reservierungsSpeicher) {
        if (datum < today) {
            delete reservierungsSpeicher[datum];
        }
    }
    localStorage.setItem("reservierungen", JSON.stringify(reservierungsSpeicher));
}

// Lädt Reservierungen für die aktuelle Etage
function ladeReservierungen() {
  const datum = reservierungsDatum.value;
  // Reservierungen direkt aus dem LocalStorage auslesen
  const gespeicherteReservierungen = JSON.parse(localStorage.getItem("reservierungen")) || {};
  
  // Reservierungen für das aktuelle Datum und die aktuelle Etage extrahieren
  const reservierungenAktuell =
    gespeicherteReservierungen[datum] && gespeicherteReservierungen[datum][aktuelleEtage]
      ? gespeicherteReservierungen[datum][aktuelleEtage]
      : {};

  // Alle Tischgruppen durchgehen und den Reservierungsstatus setzen
  document.querySelectorAll(".tischgruppe, .tischgruppe-lang, .tischgruppe-bank").forEach((tisch, index) => {
    tisch.classList.remove("reserviert", "ausgewählt");
    if (reservierungenAktuell.hasOwnProperty(index.toString())) {
      tisch.classList.add("reserviert");
    }
  });

  ausgewählteTische.clear();
  reservierenButton.disabled = true;
}

// Aktualisiere Reservierungen, wenn sich das Datum ändert
reservierungsDatum.addEventListener("change", ladeReservierungen);

reservierenButton.addEventListener("click", reservieren);
// Reservierungsdaten in localStorage speichern
const reservierungsSpeicher = JSON.parse(localStorage.getItem("reservierungen")) || {};

// Funktion zum Speichern einer Reservierung
function speichereReservierung(etage, tischIndex, datum, kontakt) {
    // Aktuelle Reservierungen aus dem LocalStorage lesen oder leeres Objekt erstellen
    const reservierungsSpeicher = JSON.parse(localStorage.getItem("reservierungen")) || {};

    if (!reservierungsSpeicher[datum]) {
        reservierungsSpeicher[datum] = {};
    }
    if (!reservierungsSpeicher[datum][etage]) {
        reservierungsSpeicher[datum][etage] = {};
    }
    // Reservierung abspeichern (verwende den Tischindex als Schlüssel)
    reservierungsSpeicher[datum][etage][tischIndex] = kontakt;
    localStorage.setItem("reservierungen", JSON.stringify(reservierungsSpeicher));
}

function ladeReservierungenAdmin() {
    const adminPanel = document.getElementById("adminReservierungen");
    adminPanel.innerHTML = "<h2>Alle Reservierungen</h2>";
    
    const gespeicherteReservierungen = JSON.parse(localStorage.getItem("reservierungen")) || {};

    for (let datum in gespeicherteReservierungen) {
        for (let etage in gespeicherteReservierungen[datum]) {
            for (let tisch in gespeicherteReservierungen[datum][etage]) {
                let kontakt = gespeicherteReservierungen[datum][etage][tisch];
                adminPanel.innerHTML += `<p>${datum} – Etage ${etage} – Tisch ${tisch}: ${kontakt}</p>`;
            }
        }
    }
}

// Erweiterte Reservierungsfunktion
function reservieren() {
    const kontakt = kontaktFeld.value.trim();
    if (!istGueltigerKontakt(kontakt)) {
        alert("Bitte gib eine gültige E-Mail oder Telefonnummer ein.");
        return;
    }
    const datum = reservierungsDatum.value;
    ausgewählteTische.forEach(index => {
        // Reservierung in der "Datenbank" speichern
        speichereReservierung(aktuelleEtage, index, datum, kontakt);
        // Kundenansicht: Tisch als reserviert markieren (z.B. rot) – keine E-Mail anzeigen!
        const tisch = document.querySelector(`[data-index='${index}']`);
        tisch.classList.add("reserviert");
        tisch.classList.remove("ausgewählt");
    });
    ausgewählteTische.clear();
    kontaktFeld.value = "";
    reservierenButton.disabled = true;
    alert(`Reservierung für ${datum} in Etage ${aktuelleEtage} erfolgreich!\nKontakt: ${kontakt}`);
    ladeReservierungenAdmin();
}

// Admin-Panel per Button ein-/ausblenden
const toggleAdminButton = document.getElementById("toggleAdmin");
toggleAdminButton.addEventListener("click", () => {
    const adminPanel = document.getElementById("adminReservierungen");
    if (adminPanel.style.display === "none" || adminPanel.style.display === "") {
        adminPanel.style.display = "block";
        ladeReservierungenAdmin();
    } else {
        adminPanel.style.display = "none";
    }
});

// === window.onload-Handler ===
window.onload = function () {
    cleanupExpiredReservations();  // Entfernt abgelaufene Reservierungen vor dem Laden der Ansicht
    ladeReservierungenAdmin();     // Aktualisiert das Admin-Panel
    ladeReservierungen();          // Aktualisiert die Kundenansicht
};