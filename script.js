/* ============================================
   MEGASTAR ATV & BUGGY SAFARi - JAVASCRIPT
   ============================================ */

let selectionMode = false;
let holdTimer = null;
let orderToday = 1;
let orderTomorrow = 1;
let currentTab = 'today';

// TAB AÇMA FONKSİYONU
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

    // Özeti güncelle
    updateSummary(tab);
}

// TUR SATIRLARINI İNİTİALİZE ET
function initializeTourRows() {
    document.querySelectorAll(".tourRow").forEach(row => {
        let holdTimer = null;

        function start() {
            holdTimer = setTimeout(() => {
                selectionMode = true;
                toggle(row);
            }, 2000);
        }

        function cancel() {
            clearTimeout(holdTimer);
        }

        row.addEventListener("mousedown", start);
        row.addEventListener("touchstart", start, false);
        row.addEventListener("mouseup", cancel);
        row.addEventListener("mouseleave", cancel);
        row.addEventListener("touchend", cancel);

        row.addEventListener("click", () => {
            if (selectionMode) {
                toggle(row);
                selectionMode = false;
            }
        });
    });
}

// SEÇIM TOGGLE
function toggle(row) {
    const tab = currentTab;
    const order = tab === 'today' ? orderToday : orderTomorrow;

    if (row.dataset.selected == "0") {
        row.dataset.selected = "1";
        row.classList.add("selected");
        row.dataset.order = order;
        row.querySelector(".selectBadge").innerHTML = order;

        if (tab === 'today') {
            orderToday++;
        } else {
            orderTomorrow++;
        }

        reorderRows(tab);
    } else {
        row.dataset.selected = "0";
        row.classList.remove("selected");
        row.querySelector(".selectBadge").innerHTML = "";
        renumber(tab);
    }

    updateSummary(tab);
}

// SATIRLARI SIRALA
function reorderRows(tab) {
    const container = document.getElementById(tab);
    const allRows = container.querySelectorAll(".tourRow");
    const rows = Array.from(allRows);

    // Seçilenleri öne al
    const selected = rows.filter(r => r.dataset.selected == "1");
    const notSelected = rows.filter(r => r.dataset.selected == "0");

    // Seçilenleri order'a göre sırala
    selected.sort((a, b) => parseInt(a.dataset.order) - parseInt(b.dataset.order));

    // Tüm satırları yeniden sırala
    const allOrdered = [...selected, ...notSelected];

    const tables = container.querySelectorAll("table");
    
    allOrdered.forEach((row) => {
        tables.forEach(table => {
            if (table.contains(row)) {
                const tbody = table.querySelector("tbody");
                if (tbody) {
                    tbody.appendChild(row);
                } else {
                    table.appendChild(row);
                }
            }
        });
    });
}

// NUMARALANDIRMA
function renumber(tab) {
    const container = document.getElementById(tab);
    let order = 1;

    container.querySelectorAll(".tourRow.selected").forEach(r => {
        r.dataset.order = order;
        r.querySelector(".selectBadge").innerHTML = order;
        order++;
    });

    if (tab === 'today') {
        orderToday = order;
    } else {
        orderTomorrow = order;
    }

    reorderRows(tab);
}

// ÖZET GÜNCELLE
function updateSummary(tab) {
    const container = document.getElementById(tab);
    const summaryDiv = document.getElementById(`serviceSummary${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    const selectedRows = container.querySelectorAll(".tourRow.selected");

    if (selectedRows.length === 0) {
        summaryDiv.querySelector(".summaryText").innerHTML = "<p style='color:#999;'>Seçim yapılmadı.</p>";
        return;
    }

    let html = "<table style='width:100%;border-collapse:collapse;'>";
    html += "<tr style='background:#f5f5f5;'><th style='padding:8px;text-align:left;border-bottom:1px solid #ddd;'>#</th><th style='padding:8px;text-align:left;border-bottom:1px solid #ddd;'>Ofis</th><th style='padding:8px;text-align:left;border-bottom:1px solid #ddd;'>Otel</th><th style='padding:8px;text-align:left;border-bottom:1px solid #ddd;'>Saat</th><th style='padding:8px;text-align:left;border-bottom:1px solid #ddd;'>Kişi</th></tr>";

    let toplamKisi = 0;
    let q = 0, b = 0, f = 0;

    selectedRows.forEach((row, idx) => {
        const order = row.dataset.order;
        const office = row.dataset.office;
        const hotel = row.dataset.hotel;
        const time = row.dataset.time;
        const person = parseInt(row.dataset.person);
        const vehicle = row.dataset.vehicle;

        toplamKisi += person;

        // Araç istatistiklerini hesapla
        const v = vehicle.toLowerCase();
        const regex = /(\d+)(?:\+(\d+))?([qbf])/g;
        let match;
        while ((match = regex.exec(v)) !== null) {
            const type = match[3];
            const count = parseInt(match[1]);
            if (type === 'q') q += count;
            if (type === 'b') b += count;
            if (type === 'f') f += count;
        }

        html += `<tr style='border-bottom:1px solid #eee;'>
                    <td style='padding:8px;font-weight:bold;color:#2196F3;'>${order}</td>
                    <td style='padding:8px;'>${office}</td>
                    <td style='padding:8px;'><strong>${hotel}</strong></td>
                    <td style='padding:8px;color:#ff9800;font-weight:bold;'>${time}</td>
                    <td style='padding:8px;color:#1565c0;font-weight:bold;'>👥 ${person}</td>
                 </tr>`;
    });

    html += "</table>";
    html += "<div style='margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;'>";

    if (q > 0 || b > 0 || f > 0) {
        html += "<div style='flex:1;min-width:150px;padding:10px;background:#f6fff6;border-radius:6px;border-left:4px solid #4CAF50;'>";
        html += "<strong style='color:#2e7d32;'>🔧 Garaj:</strong><br>";
        if (q > 0) html += "<span style='color:#4CAF50;'>● " + q + " ATV</span><br>";
        if (b > 0) html += "<span style='color:#2196F3;'>● " + b + " Buggy</span><br>";
        if (f > 0) html += "<span style='color:#FF9800;'>● " + f + " Family</span>";
        html += "</div>";
    }

    html += `<div style='flex:1;min-width:150px;padding:10px;background:#f3f9ff;border-radius:6px;border-left:4px solid #2196F3;'>
                <strong style='color:#1565c0;'>👥 Toplam:</strong><br>
                <span style='font-size:1.8rem;font-weight:bold;color:#1565c0;'>${toplamKisi}</span>
             </div>`;

    html += "</div>";

    summaryDiv.querySelector(".summaryText").innerHTML = html;
}

// SEÇİMLERİ TEMIZLE - BUGÜN
function clearSelectionToday() {
    if (confirm("Bugünün tüm seçimleri temizlemek istediğinizden emin misiniz?")) {
        document.getElementById("today").querySelectorAll(".tourRow").forEach(row => {
            row.dataset.selected = "0";
            row.classList.remove("selected");
            row.querySelector(".selectBadge").innerHTML = "";
        });
        orderToday = 1;
        updateSummary('today');
    }
}

// SEÇİMLERİ TEMIZLE - YARIN
function clearSelectionTomorrow() {
    if (confirm("Yarının tüm seçimleri temizlemek istediğinizden emin misiniz?")) {
        document.getElementById("tomorrow").querySelectorAll(".tourRow").forEach(row => {
            row.dataset.selected = "0";
            row.classList.remove("selected");
            row.querySelector(".selectBadge").innerHTML = "";
        });
        orderTomorrow = 1;
        updateSummary('tomorrow');
    }
}

// SAYFA YÜKLENDİĞİNDE
document.addEventListener("DOMContentLoaded", function() {
    initializeTourRows();
    updateSummary('today');
    updateSummary('tomorrow');
});
