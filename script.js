
let rawData = [], headers = [], filteredData = [];

const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vRAdDwX9qitwUOes0kHJDH7s1Xi35zEnjtNxvaAP2nz4vtYW3w35GFkaYN9uWg/pub?output=csv";

function fetchCSV() {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            rawData = results.data;
            headers = Object.keys(rawData[0]);
            setupTable();
            populateDropdown();
        }
    });
}

function setupTable() {
    const headerRow = document.querySelector("#dataTable thead tr");
    headerRow.innerHTML = "";
    headers.forEach(h => {
        const th = document.createElement("th");
        th.classList = "border px-4 py-2 text-sm";
        th.textContent = h;
        headerRow.appendChild(th);
    });
}

function populateDropdown() {
    const selector = document.getElementById("selector");
    selector.innerHTML = "";
    const uniqueItems = new Set();

    const useRegion = document.getElementById("regionWise").checked;
    const column = useRegion ? "Place" : "Name of the customer";

    rawData.forEach(row => {
        if (row[column]) uniqueItems.add(row[column]);
    });

    [...uniqueItems].sort().forEach(item => {
        const opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        selector.appendChild(opt);
    });

    $('#selector').selectize({ sortField: 'text' });
}

function showData() {
    const selected = document.getElementById("selector").value;
    const useRegion = document.getElementById("regionWise").checked;
    const column = useRegion ? "Place" : "Name of the customer";

    filteredData = rawData.filter(row => row[column] === selected);
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    filteredData.forEach(row => {
        const tr = document.createElement("tr");
        headers.forEach(h => {
            const td = document.createElement("td");
            td.classList = "border px-4 py-2 text-sm";
            td.textContent = row[h];
            if (h === "Amount Pending") {
                const days = parseInt(row["DAYS OF INVOICE"]);
                const amount = parseFloat(row[h].replace(/[^0-9.-]+/g,"")) || 0;
                if (days > 90 && amount > 0) td.classList += " text-red-700 font-bold";
                else if (days > 60) td.classList += " text-blue-600 font-bold";
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    showSummary();
}

function clearFields() {
    document.getElementById("selector").selectize.clear();
    document.querySelector("#dataTable tbody").innerHTML = "";
    document.getElementById("summary").innerHTML = "";
}

function showSummary() {
    let totalInvoice = 0, totalPending = 0, os60_90 = 0, os90plus = 0;
    filteredData.forEach(row => {
        const inv = parseFloat(row["Invoice Value"].replace(/[^0-9.-]+/g,"")) || 0;
        const pend = parseFloat(row["Amount Pending"].replace(/[^0-9.-]+/g,"")) || 0;
        const days = parseInt(row["DAYS OF INVOICE"]) || 0;

        totalInvoice += inv;
        totalPending += pend;
        if (days > 90) os90plus += pend;
        else if (days > 60) os60_90 += pend;
    });

    const dso = totalInvoice ? ((totalPending / totalInvoice) * 365).toFixed(2) : "0";

    document.getElementById("summary").innerHTML = `
        <div><strong>Total Invoice Value:</strong> ₹${totalInvoice.toLocaleString()}</div>
        <div><strong>Total Outstanding:</strong> ₹${totalPending.toLocaleString()}</div>
        <div class="text-blue-700"><strong>60–90 Days OS:</strong> ₹${os60_90.toLocaleString()}</div>
        <div class="text-red-700"><strong>90+ Days OS:</strong> ₹${os90plus.toLocaleString()}</div>
        <div><strong>DSO:</strong> ${dso} days</div>
    `;
}

document.getElementById("regionWise").addEventListener("change", () => {
    document.getElementById("customerWise").checked = !document.getElementById("regionWise").checked;
    populateDropdown();
});

document.getElementById("customerWise").addEventListener("change", () => {
    document.getElementById("regionWise").checked = !document.getElementById("customerWise").checked;
    populateDropdown();
});

fetchCSV();
