/* ============================================
   MEGASTAR ATV & BUGGY SAFARi - JAVASCRIPT
   Checkbox Seçimi - Basit ve Hızlı
   ============================================ */

let currentTab = 'today';

// TAB AÇMA
function openTab(event, tab) {
    let tabs = document.getElementsByClassName("tabContent");
    let btns = document.getElementsByClassName("tabBtn");

    for (let i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none";
    }

    for (let i = 0; i < btns.length; i++) {
        btns[i].classList.remove("w3-blue");
    }

    document.getElementById(tab).style.display = "block";
    event.target.classList.add("w3-blue");
    currentTab = tab;
}

// CHECKBOX SEÇIM BAŞLATMA
function initializeCheckboxes() {
    document.querySelectorAll(".tourCheckbox").forEach(checkbox => {
        checkbox.addEventListener("change", function(e) {
            const row = this.closest(".tourRow");
            const tab = row.dataset.tab;

            if (this.checked) {
                row.dataset.selected = "1";
                row.classList.add("selected");
            } else {
                row.dataset.selected = "0";
                row.classList.remove("selected");
            }

            // Satırları sırala (seçilenleri üste al)
            reorderRows(tab);

            // Özeti güncelle
            updateSummary();
        });
    });
}

// SATIRLARI SIRALA - SEÇİLENLER ÜSTE
function reorderRows(tab) {
    const tabContainer = document.getElementById(tab);
    const allRows = Array.from(tabContainer.querySelectorAll(".tourRow"));

    // Seçilenleri ve seçilmeyenleri ayır
    const selected = allRows.filter(r => r.dataset.selected === "1");
    const notSelected = allRows.filter(r => r.dataset.selected === "0");

    // Seçilenleri üste koy
    const ordered = [...selected, ...notSelected];

    // Tüm tabloları bul ve satırları taşı
    const tables = tabContainer.querySelectorAll("table");

    ordered.forEach(row => {
        tables.forEach(table => {
            if (table.contains(row)) {
                table.appendChild(row);
            }
        });
    });
}

// ÖZET GÜNCELLE - SADECE KİŞİ SAYISI
function updateSummary() {
    let totalPeople = 0;

    // Tüm tablardan seçilenleri bul
    document.querySelectorAll(".tourRow[data-selected='1']").forEach(row => {
        const people = parseInt(row.dataset.person) || 0;
        totalPeople += people;
    });

    // Sabit bölümü güncelle
    document.getElementById("totalPeopleText").textContent = 
        "👥 Toplam: " + totalPeople + " Kişi";
}

// TÜM SEÇİMLERİ TEMIZLE
function clearAllSelection() {
    if (confirm("Tüm seçimleri temizlemek istediğinizden emin misiniz?")) {
        document.querySelectorAll(".tourCheckbox").forEach(checkbox => {
            checkbox.checked = false;
            const row = checkbox.closest(".tourRow");
            row.dataset.selected = "0";
            row.classList.remove("selected");
        });

        // Her tab için satırları sırala
        reorderRows('today');
        reorderRows('tomorrow');

        // Özeti güncelle
        updateSummary();
    }
}

// SAYFA YÜKLENDİĞİNDE
document.addEventListener("DOMContentLoaded", function() {
    initializeCheckboxes();
    updateSummary();
});
