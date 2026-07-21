<?php
require 'header.php';

date_default_timezone_set('Europe/Istanbul');

$cutoffTime = "17:30";

$now = time();
$cutoff = strtotime(date("Y-m-d") . " " . $cutoffTime);

if($now >= $cutoff){
    $baseDate = date("Y-m-d", strtotime("+1 day"));
} else {
    $baseDate = date("Y-m-d");
}

$todayDate = $baseDate;
$tomorrowDate = date("Y-m-d", strtotime($baseDate . " +1 day"));

function getTourType($time){
    $t = strtotime($time);

    if($t >= strtotime("07:30") && $t <= strtotime("10:50")){
        return 'sabah';
    }

    if($t >= strtotime("12:30") && $t <= strtotime("15:30")){
        return 'oglen';
    }

    if($t >= strtotime("15:36") && $t <= strtotime("17:30")){
        return 'ozel';
    }

    return false;
}

function isTourActive($time){
    $tourType = getTourType($time);

    if(!$tourType){
        return false;
    }

    $now = strtotime(date("H:i"));

    if($tourType == 'sabah'){
        return $now <= strtotime("10:50");
    }

    if($tourType == 'oglen'){
        return $now <= strtotime("15:30");
    }

    if($tourType == 'ozel'){
        return $now <= strtotime("16:30");
    }

    return false;
}

function getTours($pdo, $date){
    $stmt = $pdo->prepare("
    SELECT 
        t.tour_time,
        t.hotel_name,
        t.room_number,
        t.vehicle_info,
        t.rest_amount,
        t.notes,
        t.rest_currency,
        o.name as office_name
    FROM tickets t
    JOIN offices o ON o.id = t.office_id
    WHERE t.tour_date = :tarih
    ORDER BY t.tour_time ASC
    ");

    $stmt->execute([
        'tarih' => $date
    ]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function splitTours($rows, $isToday){
    $sabah = [];
    $oglen = [];
    $ozel = [];

    foreach($rows as $r){
        if($isToday && !isTourActive($r['tour_time'])){
            continue;
        }

        $type = getTourType($r['tour_time']);

        if($type == 'sabah'){
            $sabah[] = $r;
        }
        elseif($type == 'oglen'){
            $oglen[] = $r;
        }
        elseif($type == 'ozel'){
            $ozel[] = $r;
        }
    }

    return [$sabah, $oglen, $ozel];
}

function calculateVehicleStats($vehicleInfo){
    $q = 0;
    $b = 0;
    $f = 0;
    $p = 0;
    $toplamKisi = 0;

    $v = strtolower(trim($vehicleInfo));
    preg_match_all('/(\d+)(?:\+(\d+))?([qbf])/', $v, $matches, PREG_SET_ORDER);

    foreach($matches as $m){
        $a = (int)$m[1];
        $extra = isset($m[2]) ? (int)$m[2] : 0;
        $type = $m[3];

        if($type == 'q'){
            $q += $a;
        }
        if($type == 'b'){
            $b += $a;
        }
        if($type == 'f'){
            $f += $a;
        }

        $toplamKisi += ($a + $extra);
        $p += ($a + $extra);
    }

    return [
        'q' => $q,
        'b' => $b,
        'f' => $f,
        'p' => $p,
        'toplamKisi' => $toplamKisi
    ];
}

$todayRows = getTours($pdo, $todayDate);
$tomorrowRows = getTours($pdo, $tomorrowDate);

$isAfterCutoff = ($now >= $cutoff);

list($sabahToday, $oglenToday, $ozelToday) = splitTours($todayRows, !$isAfterCutoff);
list($sabahTomorrow, $oglenTomorrow, $ozelTomorrow) = splitTours($tomorrowRows, false);

function tableBlock($title, $data, $tabId){
    if($title == 'Özel' && empty($data)){
        return;
    }

    echo "<div class='w3-card w3-margin-bottom tourBlock' data-tab='{$tabId}'>";
    echo "<div class='w3-blue w3-padding tourBlockHeader'><h3 style='margin:0'>$title</h3></div>";

    if(!$data){
        echo "<div class='w3-padding'>Kayıt yok</div></div>";
        return;
    }

    echo "<table class='w3-table w3-bordered w3-striped serviceTable'>";
    echo "<tr class='w3-light-grey'>";
    echo "<th style='width:80px;text-align:center'>#</th>";
    echo "<th>Ofis</th>";
    echo "<th>Otel / Oda</th>";
    echo "<th>Araç</th>";
    echo "<th style='width:80px'>Saat</th>";
    echo "<th>Notlar</th>";
    echo "<th style='width:100px'>Durum</th>";
    echo "</tr>";

    $stats = [
        'q' => 0,
        'b' => 0,
        'f' => 0,
        'p' => 0
    ];

    foreach($data as $idx => $t){
        $vehicleStats = calculateVehicleStats($t['vehicle_info']);
        $toplamKisi = $vehicleStats['toplamKisi'];

        $stats['q'] += $vehicleStats['q'];
        $stats['b'] += $vehicleStats['b'];
        $stats['f'] += $vehicleStats['f'];
        $stats['p'] += $vehicleStats['p'];

        echo "<tr class='tourRow' 
                data-tab='{$tabId}'
                data-vehicle='".htmlspecialchars($t['vehicle_info'])."'
                data-person='{$toplamKisi}'
                data-order='0'
                data-selected='0'
                data-index='{$idx}'
                data-office='".htmlspecialchars($t['office_name'])."'
                data-hotel='".htmlspecialchars($t['hotel_name'])."'
                data-room='".htmlspecialchars($t['room_number'])."'
                data-time='{$t['tour_time']}'
                data-q='{$vehicleStats['q']}'
                data-b='{$vehicleStats['b']}'
                data-f='{$vehicleStats['f']}'>";

        echo "<td class='selectBadge' style='text-align:center;font-weight:bold;color:#2196F3;font-size:18px;'></td>";
        echo "<td class='office'>".htmlspecialchars($t['office_name'])."</td>";
        echo "<td class='hotel'><b>".htmlspecialchars($t['hotel_name'])."</b><br><small>Oda: ".htmlspecialchars($t['room_number'])."</small></td>";
        echo "<td class='vehicle'><b>".htmlspecialchars($t['vehicle_info'])."</b><br><span style='color:#1565c0;font-weight:bold;'>👥 {$toplamKisi}</span></td>";
        echo "<td class='time' style='text-align:center;color:#ff9800;font-weight:bold;'>".$t['tour_time']."</td>";
        echo "<td class='notes'>".htmlspecialchars($t['notes'] ?? 'FATİH REİS')."</td>";
        echo "<td class='status'>";
        echo ($t['rest_amount'] > 0)
            ? "<span style='color:green;font-weight:bold;'>✓ REST: {$t['rest_amount']} {$t['rest_currency']}</span>"
            : "<span style='color:red;font-weight:bold;'>✗ PAID</span>";
        echo "</td>";
        echo "</tr>";
    }

    echo "</table>";

    echo "<div class='w3-row-padding w3-margin-top w3-margin-bottom'>";

    echo "<div class='w3-half'>";
    echo "<div class='w3-card w3-padding garajCard'>";
    echo "<div class='garajTitle'>🔧 Garaj İçin</div>";
    echo "<div class='garajContent'>";
    if($stats['q'] > 0) echo "<div><span class='vehicleIcon atv'>●</span> <b>$stats[q] ATV</b></div>";
    if($stats['b'] > 0) echo "<div><span class='vehicleIcon buggy'>●</span> <b>$stats[b] Buggy</b></div>";
    if($stats['f'] > 0) echo "<div><span class='vehicleIcon family'>●</span> <b>$stats[f] Family</b></div>";
    echo "</div></div>";
    echo "</div>";

    echo "<div class='w3-half'>";
    echo "<div class='w3-card w3-padding kisiBilgisi'>";
    echo "<div class='kisiBilgisiTitle'>👥 Toplam Kişi</div>";
    echo "<div class='kisiBilgisiNumber'>$stats[p]</div>";
    echo "</div>";
    echo "</div>";

    echo "</div>";
    echo "</div>";
}
?>

<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MEGASTAR ATV & BUGGY SAFARi - Servis Yönetimi</title>
    <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
    <link rel="stylesheet" href="style.css">
</head>
<body class="w3-light-grey">

<div class="w3-panel w3-purple w3-border w3-round-xxlarge headerPanel">
    <h1 class="w3-text-white w3-sofia">
        🚐 MEGASTAR ATV & BUGGY SAFARi
    </h1>
</div>

<div class="w3-container mainContainer">

    <div class="w3-bar w3-black w3-margin-bottom tabBar">
        <button class="w3-bar-item w3-button tabBtn w3-blue" onclick="openTab(event,'today')">
            📅 Bugün
        </button>
        <button class="w3-bar-item w3-button tabBtn" onclick="openTab(event,'tomorrow')">
            📅 Yarın
        </button>
    </div>

    <!-- BUGÜN SEKMESİ -->
    <div id="today" class="tabContent">
        <h2 class="w3-text-green dateTitle">
            <?php echo date("📆 d.m.Y dddd", strtotime($todayDate)); ?>
        </h2>

        <div id="serviceSummaryToday" class="serviceSummary w3-card w3-white w3-padding summaryBox">
            <div class="summaryHeader">
                <h3 style="margin:0;">🚐 Seçilen Servisler</h3>
                <button onclick="clearSelectionToday()" class="w3-button w3-red w3-small clearBtn">Temizle</button>
            </div>
            <div class="summaryText">
                <p style="color:#999;">Seçim yapılmadı.</p>
            </div>
        </div>

        <?php tableBlock('Sabah (07:30-10:50)', $sabahToday, 'today'); ?>
        <?php tableBlock('Öğlen (12:30-15:30)', $oglenToday, 'today'); ?>
        <?php tableBlock('Özel (15:36-17:30)', $ozelToday, 'today'); ?>
    </div>

    <!-- YARIN SEKMESİ -->
    <div id="tomorrow" class="tabContent" style="display:none">
        <h2 class="w3-text-orange dateTitle">
            <?php echo date("📆 d.m.Y dddd", strtotime($tomorrowDate)); ?>
        </h2>

        <div id="serviceSummaryTomorrow" class="serviceSummary w3-card w3-white w3-padding summaryBox">
            <div class="summaryHeader">
                <h3 style="margin:0;">🚐 Seçilen Servisler</h3>
                <button onclick="clearSelectionTomorrow()" class="w3-button w3-red w3-small clearBtn">Temizle</button>
            </div>
            <div class="summaryText">
                <p style="color:#999;">Seçim yapılmadı.</p>
            </div>
        </div>

        <?php tableBlock('Sabah (07:30-10:50)', $sabahTomorrow, 'tomorrow'); ?>
        <?php tableBlock('Öğlen (12:30-15:30)', $oglenTomorrow, 'tomorrow'); ?>
        <?php tableBlock('Özel (15:36-17:30)', $ozelTomorrow, 'tomorrow'); ?>
    </div>

</div>

<script src="script.js"></script>

</body>
</html>
