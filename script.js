
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vRAdDwX9qitwUOes0kHJDH7s1Xi35zEnjtNxvaAP2nz4vtYW3w35GFkaYN9uWg/pub?output=csv';

let sheetData = [];

fetch(SHEET_URL)
    .then(response => response.text())
    .then(text => {
        const rows = text.trim().split("\n").map(r => r.split(","));
        const headers = rows.shift();
        sheetData = rows.map(row => {
            let obj = {};
            headers.forEach((h, i) => obj[h.trim()] = row[i]?.trim() || "");
            return obj;
        });
        populateDropdown();
    })
    .catch(err => {
        alert("Failed to load data: " + err);
    });

function populateDropdown() {
    const viewType = document.querySelector('input[name="viewType"]:checked').value;
    const dropdown = document.getElementById("dropdown");
    dropdown.innerHTML = '<option>Select Name</option>';

    const key = viewType === "region" ? "Place" : "Name of the customer";
    const options = [...new Set(sheetData.map(row => row[key]).filter(Boolean))];
    options.forEach(opt => {
        const option = document.createElement("option");
        option.textContent = opt;
        dropdown.appendChild(option);
    });
}

document.querySelectorAll('input[name="viewType"]').forEach(radio =>
    radio.addEventListener("change", populateDropdown)
);

function loadData() {
    const viewType = document.querySelector('input[name="viewType"]:checked').value;
    const selected = document.getElementById("dropdown").value;
    const key = viewType === "region" ? "Place" : "Name of the customer";

    const filtered = sheetData.filter(row => row[key] === selected);

    const totalSales = filtered.reduce((sum, row) => sum + parseFloat(row["Invoice Value"] || 0), 0);
    const totalOS = filtered.reduce((sum, row) => sum + parseFloat(row["Amount Pending"] || 0), 0);

    const os90 = filtered.filter(row => +row["DAYS OF INVOICE"] > 90).reduce((sum, r) => sum + parseFloat(r["Amount Pending"] || 0), 0);
    const os60to90 = filtered.filter(r => +r["DAYS OF INVOICE"] <= 90 && +r["DAYS OF INVOICE"] > 60).reduce((sum, r) => sum + parseFloat(r["Amount Pending"] || 0), 0);
    const os0to60 = filtered.filter(r => +r["DAYS OF INVOICE"] <= 60).reduce((sum, r) => sum + parseFloat(r["Amount Pending"] || 0), 0);

    const DSO = totalSales === 0 ? 0 : Math.round((totalOS / totalSales) * 365);

    document.getElementById("totalSales").textContent = totalSales.toFixed(2);
    document.getElementById("totalOutstanding").textContent = totalOS.toFixed(2);
    document.getElementById("os90").textContent = os90.toFixed(2);
    document.getElementById("os60to90").textContent = os60to90.toFixed(2);
    document.getElementById("os0to60").textContent = os0to60.toFixed(2);
    document.getElementById("dso").textContent = DSO;
}
