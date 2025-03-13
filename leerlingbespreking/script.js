// Default cluster mapping
const DEFAULT_CLUSTER_MAPPING = {
    "A3H1": ["A3HA", "A3HB", "A3HC"],
    "A3H2": ["A3HA", "A3HB", "A3HC"]
};

// Load cluster mapping from local storage or use default
let CLUSTER_MAPPING = JSON.parse(localStorage.getItem('cluster_mapping')) || DEFAULT_CLUSTER_MAPPING;

// Function to format date in Dutch notation (DD/MM/YYYY)
function formatDutchDate(date) {
    return date.toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Save cluster mapping to local storage
function saveClusterMapping() {
    localStorage.setItem('cluster_mapping', JSON.stringify(CLUSTER_MAPPING));
}

// Store Excel data when file is selected
let excelData = null;
document.getElementById('file-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            excelData = XLSX.utils.sheet_to_json(worksheet);
        };
        reader.readAsBinaryString(file);
    }
});

// Set default dates to today
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date-input').value = today;
    document.getElementById('end-date-input').value = today;
});

// Generate schedule button
document.getElementById('generate-btn').addEventListener('click', function() {
    if (!excelData) {
        alert('Selecteer eerst een Excel-bestand.');
        return;
    }

    const rooms = document.getElementById('rooms-input').value.split(',').map(r => r.trim());
    const startDate = new Date(document.getElementById('start-date-input').value);
    const endDate = new Date(document.getElementById('end-date-input').value);
    const startTime = document.getElementById('start-time-input').value;
    const endTime = document.getElementById('end-time-input').value;
    const slotDuration = parseInt(document.getElementById('slot-duration-input').value);
    const maxOverlap = parseInt(document.getElementById('max-overlap-input').value);
    const debugMode = document.getElementById('debug-checkbox').checked;

    // Calculate the number of days between start and end date
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 14) {
        alert('De geselecteerde datumrange is te groot (meer dan 14 dagen). Pas de datums aan.');
        return;
    }

    let debugLog = [];

    const classes = processExcelData(excelData, debugMode, debugLog);
    if (!classes) {
        document.getElementById('output-area').innerText = 'Fout bij verwerken van Excel-bestand.';
        return;
    }

    const timeslots = generateTimeSlots(startDate, endDate, startTime, endTime, slotDuration, debugMode, debugLog);
    if (timeslots.length === 0) {
        document.getElementById('output-area').innerText = 'Geen tijdslots gegenereerd. Controleer de datum- en tijdinstellingen.';
        return;
    }

    const { scheduledTimeslots, unscheduled } = scheduleClasses(classes, timeslots, rooms, maxOverlap, debugMode, debugLog);
    const scheduleTable = generateScheduleTable(scheduledTimeslots, rooms);
    const conflicts = checkForConflicts(scheduledTimeslots, classes, maxOverlap, debugMode, debugLog);

    let output = '';
    if (debugMode) {
        output += `<pre>DEBUG INFO:\n${debugLog.join('\n')}</pre>`;
    }
    output += scheduleTable;
    if (unscheduled.length > 0) {
        output += `<p><strong>Niet ingeplande klassen:</strong> ${unscheduled.join(', ')}</p>`;
    }
    if (conflicts.length > 0) {
        output += `<p><strong>Waarschuwing: Conflicten gevonden!</strong></p><ul>`;
        conflicts.forEach(conflict => {
            output += `<li>${conflict}</li>`;
        });
        output += `</ul>`;
    }
    document.getElementById('output-area').innerHTML = output;
});

// Process Excel data
function processExcelData(data, debugMode, debugLog) {
    if (!data || data.length === 0) return null;

    const requiredColumns = ["Gegeven door medewerkers", "Gevolgd door groepen"];
    const columns = Object.keys(data[0]);
    for (const col of requiredColumns) {
        if (!columns.includes(col)) return null;
    }

    if (debugMode) {
        debugLog.push(`Excel-bestand succesvol ingelezen. Aantal rijen: ${data.length}`);
    }

    const classes = {};
    data.forEach(row => {
        const teacher = String(row["Gegeven door medewerkers"]).trim();
        const group = String(row["Gevolgd door groepen"]).trim();
        const base_code = group.length === 6 ? group.slice(0, 4) : group;
        if (CLUSTER_MAPPING[base_code]) {
            CLUSTER_MAPPING[base_code].forEach(code => {
                if (!classes[code]) classes[code] = [];
                if (!classes[code].includes(teacher)) classes[code].push(teacher);
            });
        } else {
            if (!classes[base_code]) classes[base_code] = [];
            if (!classes[base_code].includes(teacher)) classes[base_code].push(teacher);
        }
    });

    return classes;
}

// Generate time slots
function generateTimeSlots(startDate, endDate, startTime, endTime, slotDuration, debugMode, debugLog) {
    const timeslots = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]), 0, 0);
        let currentDt = new Date(dayStart);
        while (currentDt < dayEnd) {
            const slotStart = new Date(currentDt);
            const slotEnd = new Date(currentDt.getTime() + slotDuration * 60000);
            if (slotEnd > dayEnd) break;
            timeslots.push({ day: new Date(currentDate), start: slotStart, end: slotEnd, assignments: {} });
            currentDt = slotEnd;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    if (debugMode) {
        debugLog.push(`Tijdslots gegenereerd: ${timeslots.length}`);
    }
    return timeslots;
}

// Schedule classes
function scheduleClasses(classes, timeslots, rooms, maxOverlap, debugMode, debugLog) {
    const teacherUsage = timeslots.map(() => ({}));
    timeslots.forEach(slot => {
        slot.assignments = {};
        rooms.forEach(room => slot.assignments[room] = null);
    });

    const classList = Object.entries(classes).map(([code, teachers]) => ({ code, teachers }));
    classList.sort((a, b) => b.teachers.length - a.teachers.length);

    const unscheduled = [];
    classList.forEach(({ code, teachers }) => {
        let scheduled = false;
        for (let i = 0; i < timeslots.length; i++) {
            const slot = timeslots[i];
            let availableRoom = null;
            for (const room of rooms) {
                if (slot.assignments[room] === null) {
                    availableRoom = room;
                    break;
                }
            }
            if (!availableRoom) continue;

            let conflict = false;
            for (const teacher of teachers) {
                if ((teacherUsage[i][teacher] || 0) >= maxOverlap + 1) {
                    conflict = true;
                    break;
                }
            }
            if (conflict) continue;

            slot.assignments[availableRoom] = code;
            teachers.forEach(teacher => {
                teacherUsage[i][teacher] = (teacherUsage[i][teacher] || 0) + 1;
            });
            scheduled = true;
            if (debugMode) {
                debugLog.push(`Klas ${code} ingepland in tijdslot ${i} in lokaal ${availableRoom}`);
            }
            break;
        }
        if (!scheduled) {
            unscheduled.push(code);
            if (debugMode) {
                debugLog.push(`Kon klas ${code} niet inplannen`);
            }
        }
    });

    return { scheduledTimeslots: timeslots, unscheduled };
}

// Generate schedule table with Dutch date and time formats
function generateScheduleTable(timeslots, rooms) {
    const scheduleByDay = {};
    timeslots.forEach(slot => {
        const dayKey = slot.day.getTime(); // Use timestamp for sorting
        if (!scheduleByDay[dayKey]) {
            scheduleByDay[dayKey] = { day: slot.day, slots: [] };
        }
        scheduleByDay[dayKey].slots.push(slot);
    });

    let html = '';
    Object.keys(scheduleByDay).sort((a, b) => a - b).forEach(dayKey => {
        const dayData = scheduleByDay[dayKey];
        const dayStr = formatDutchDate(dayData.day); // e.g., "13/03/2025"
        html += `<h3>Dag: ${dayStr}</h3>`;
        html += '<table><tr><th>Tijdslot</th>';
        rooms.forEach(room => html += `<th>${room}</th>`);
        html += '</tr>';

        dayData.slots.sort((a, b) => a.start - b.start).forEach(slot => {
            const timeStr = `${slot.start.toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}-${slot.end.toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}`; // e.g., "08:30-09:00"
            html += `<tr><td>${timeStr}</td>`;
            rooms.forEach(room => {
                const assignment = slot.assignments[room] || '';
                html += `<td>${assignment}</td>`;
            });
            html += '</tr>';
        });
        html += '</table>';
    });
    return html;
}

// Check for conflicts
function checkForConflicts(timeslots, classes, maxOverlap, debugMode, debugLog) {
    let conflicts = [];
    timeslots.forEach((slot, index) => {
        let teacherCounts = {};
        Object.values(slot.assignments).forEach(classCode => {
            if (classCode && classes[classCode]) {
                classes[classCode].forEach(teacher => {
                    teacherCounts[teacher] = (teacherCounts[teacher] || 0) + 1;
                });
            }
        });
        for (const [teacher, count] of Object.entries(teacherCounts)) {
            if (count > maxOverlap + 1) {
                conflicts.push(`Conflict in tijdslot ${index}: Docent ${teacher} is ${count} keer ingepland (max ${maxOverlap + 1})`);
                if (debugMode) {
                    debugLog.push(`Conflict gevonden: Docent ${teacher} in tijdslot ${index}`);
                }
            }
        }
    });
    return conflicts;
}

// Cluster modal handling
const modal = document.getElementById('cluster-modal');
const clusterBtn = document.getElementById('cluster-btn');
const closeBtn = document.querySelector('.modal .close');
const updateClusterBtn = document.getElementById('update-cluster-btn');

clusterBtn.addEventListener('click', () => modal.style.display = 'block');
closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (event) => {
    if (event.target == modal) modal.style.display = 'none';
});

updateClusterBtn.addEventListener('click', () => {
    const clusterBase = document.getElementById('cluster-base-input').value.trim();
    const clusterCodes = document.getElementById('cluster-codes-input').value.trim();
    if (!clusterBase || !clusterCodes) {
        alert('Vul alle velden in!');
        return;
    }
    const newCodes = clusterCodes.split(',').map(code => code.trim()).filter(code => code);
    if (newCodes.length === 0) {
        alert('Geen geldige codes gevonden.');
        return;
    }
    CLUSTER_MAPPING[clusterBase] = newCodes;
    saveClusterMapping();
    alert(`Cluster mapping voor '${clusterBase}' is bijgewerkt naar: ${newCodes.join(', ')}`);
    modal.style.display = 'none';
});