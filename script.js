/* ============================================
   MEGASTAR ATV & BUGGY SAFARi - JAVASCRIPT
   Seçilen Satırlar En Üste Çıkacak
   ============================================ */

let currentTab = 'today';
let selectionActive = false;

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

// LONG PRESS DETECT - TELEFON VE PC
function initializeSelection() {
    document.querySelectorAll(".tourRow").forEach(row => {
        let pressTimer = null;
        let touchStartTime = 0;
        let isTouchDevice = false;

        // Touch başladığında
        row.addEventListener("touchstart", function(e) {
            isTouchDevice = true;
            touchStartTime = Date.now();
            e.preventDefault();
            
            pressTimer = setTimeout(() => {
                selectionActive = true;
                selectRow(row);
            }, 1000); // 1 saniye
        }, { passive: false });

        // Touch bittiğinde
        row.addEventListener("touchend", function(e) {
            e.preventDefault();
            clearTimeout(pressTimer);
        }, { passive: false });

        // Touch cancel
        row.addEventListener("touchcancel", function(e) {
            e.preventDefault();
            clearTimeout(pressTimer);
        }, { passive: false });

        // Context menu engelle
        row.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            return false;
        });

        // Mouse down (PC)
        row.addEventListener("mousedown", function(e) {
            if (!isTouchDevice) {
                touchStartTime = Date.now();
                pressTimer = setTimeout(() => {
                    selectionActive = true;
                    selectRow(row);
                }, 1000);
            }
        });

        // Mouse up (PC)
        row.addEventListener("mouseup", function(e) {
            if (!isTouchDevice) {
                clearTimeout(pressTimer);
            }
        });

        row.addEventListener("mouseleave", function(e) {
            if (!isTouchDevice) {
                clearTimeout(pressTimer);
            }
        });

        // Click handler - Seçim aktifken çalışır
        row.addEventListener("click", function(e) {
            if (selectionActive) {
                selectRow(row);
                selectionActive = false;
            }
        });
    });
}

// SATIRI SEÇ
function selectRow(row) {
    const tab = row.dataset.tab;
    
    if (row.dataset.selected === "0") {
        // Seç
        row.dataset.selected = "1";
        row.classList.add("selected");
        
        // Badge numarası
        const selectedCount = document.querySelectorAll(`.tourRow[data-tab="${tab}"].selected`).length;
        row.querySelector(".selectBadge").textContent = selectedCount;
        
    } else {
        // Seçimi kaldır
        row.dataset.selected = "0";
        row.classList.remove("selected");
        row.querySelector(".selectBadge").textContent = "";
        
        // Numaraları yeniden düzenle
        renumberRows(tab);
    }
    
    // Satırları sırala (seçilenleri üste al)
    reorderRows(tab);
    
    // Özeti güncelle
    updateSummary(tab);
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

// NUMARALANDIRMAYI YENİLE
function renumberRows(tab) {
    const tabContainer = document.getElementById(tab);
    let number = 1;
    
    tabContainer.querySelectorAll(`.tourRow[data-tab="${tab}"].selected`).forEach(row => {
        row.querySelector(".selectBadge").textContent = number;
        number++;
    });
}

// ÖZET GÜNCELLE
function updateSummary(tab) {
    const tabContainer = document.getElementById(tab);
    const summaryDiv = document.getElementById(`serviceSummary${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    const selectedRows = tabContainer.querySelectorAll(`.tourRow[data-tab="${tab}"].selected`);
    
    if (selectedRows.length === 0) {
        summaryDiv.querySelector(".summaryText").innerHTML = "<p style='color:#999;'>Seçim yapılmadı.</p>";
        return;
    }
    
    let totalPeople = 0;
    let totalQ = 0, totalB = 0, totalF = 0;
    let tableHtml = "<table style='width:100%;border-collapse:collapse;'>";
    
    tableHtml += `<tr style='background:#f0f0f0;'>
        <th style='padding:8px;text-align:left;border-bottom:2px solid #ddd;width:40px;'>#</th>
        <th style='padding:8px;text-align:left;border-bottom:2px solid #ddd;'>Ofis</th>
        <th style='padding:8px;text-align:left;border-bottom:2px solid #ddd;'>Otel</th>
        <th style='padding:8px;text-align:left;border-bottom:2px solid #ddd;'>Araç</th>
        <th style='padding:8px;text-align:left;border-bottom:2px solid #ddd;width:60px;'>Saat</th>
        <th style='padding:8px;text-align:left;border-bottom:2px solid #ddd;width:60px;'>Kişi</th>
    </tr>`;
    
    selectedRows.forEach(row => {
        const badge = row.querySelector(".selectBadge").textContent;
        const office = row.dataset.office;
        const hotel = row.dataset.hotel;
        const time = row.dataset.time;
        const people = parseInt(row.dataset.person);
        const q = parseInt(row.dataset.q);
        const b = parseInt(row.dataset.b);
        const f = parseInt(row.dataset.f);
        
        totalPeople += people;
        totalQ += q;
        totalB += b;
        totalF += f;
        
        tableHtml += `<tr style='border-bottom:1px solid #eee;'>
            <td style='padding:8px;font-weight:bold;color:#2196F3;text-align:center;'>${badge}</td>
            <td style='padding:8px;'>${office}</td>
            <td style='padding:8px;'><b>${hotel}</b></td>
            <td style='padding:8px;'>${row.dataset.vehicle}</td>
            <td style='padding:8px;color:#ff9800;font-weight:bold;text-align:center;'>${time}</td>
            <td style='padding:8px;color:#1565c0;font-weight:bold;text-align:center;'>👥 ${people}</td>
        </tr>`;
    });
    
    tableHtml += "</table>";
    
    // Garaj ve Toplam Kişi bilgileri
    let statsHtml = "<div style='margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;'>";
    
    if (totalQ > 0 || totalB > 0 || totalF > 0) {
        statsHtml += "<div style='flex:1;min-width:180px;padding:12px;background:#f6fff6;border-radius:6px;border-left:5px solid #4CAF50;'>";
        statsHtml += "<div style='color:#2e7d32;font-weight:bold;margin-bottom:8px;'>🔧 GARAJ İÇİN</div>";
        if (totalQ > 0) statsHtml += "<div style='color:#4CAF50;font-weight:bold;'>● " + totalQ + " ATV</div>";
        if (totalB > 0) statsHtml += "<div style='color:#2196F3;font-weight:bold;'>● " + totalB + " BUGGY</div>";
        if (totalF > 0) statsHtml += "<div style='color:#FF9800;font-weight:bold;'>● " + totalF + " FAMILY</div>";
        statsHtml += "</div>";
    }
    
    statsHtml += "<div style='flex:1;min-width:180px;padding:12px;background:#e3f2fd;border-radius:6px;border-left:5px solid #2196F3;'>";
    statsHtml += "<div style='color:#1565c0;font-weight:bold;margin-bottom:8px;'>👥 TOPLAM KİŞİ</div>";
    statsHtml += "<div style='font-size:2.2rem;font-weight:bold;color:#1565c0;'>" + totalPeople + "</div>";
    statsHtml += "</div>";
    
    statsHtml += "</div>";
    
    summaryDiv.querySelector(".summaryText").innerHTML = tableHtml + statsHtml;
}

// SEÇİMLERİ TEMIZLE
function clearSelectionToday() {
    if (confirm("Bugünün tüm seçimleri temizlemek istediğinizden emin misiniz?")) {
        document.getElementById("today").querySelectorAll(".tourRow").forEach(row => {
            row.dataset.selected = "0";
            row.classList.remove("selected");
            row.querySelector(".selectBadge").textContent = "";
        });
        reorderRows('today');
        updateSummary('today');
        selectionActive = false;
    }
}

function clearSelectionTomorrow() {
    if (confirm("Yarının tüm seçimleri temizlemek istediğinizden emin misiniz?")) {
        document.getElementById("tomorrow").querySelectorAll(".tourRow").forEach(row => {
            row.dataset.selected = "0";
            row.classList.remove("selected");
            row.querySelector(".selectBadge").textContent = "";
        });
        reorderRows('tomorrow');
        updateSummary('tomorrow');
        selectionActive = false;
    }
}

// SAYFA YÜKLENDİĞİNDE
document.addEventListener("DOMContentLoaded", function() {
    initializeSelection();
    
    // Tüm context menu'leri engelle
    document.addEventListener("contextmenu", function(e) {
        if (e.target.closest(".tourRow")) {
            e.preventDefault();
            return false;
        }
    });
});
