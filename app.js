// Global variables
let rawData = [];
let filteredData = [];
let headers = [];
let charts = [];
let currentChartId = 0;
let confirmCallback = null;
let isDarkTheme = false;

// File upload and drag-drop functionality
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');

// Event listeners
fileInput.addEventListener('change', handleFileUpload);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
        parseCSV(file);
    } else if (fileExtension === 'xls' || fileExtension === 'xlsx') {
        parseExcel(file);
    } else {
        alert('Unsupported file format. Please upload CSV or Excel files.');
    }
}

function parseCSV(file) {
    Papa.parse(file, {
        header: true,
        complete: function(results) {
            rawData = results.data.filter(row => Object.values(row).some(val => val !== ''));
            headers = results.meta.fields;
            initializeDashboard();
        },
        error: function(error) {
            console.error('Error parsing CSV:', error);
            alert('Error parsing CSV file. Please check the file format.');
        }
    });
}

function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
            rawData = jsonData;
            headers = Object.keys(jsonData[0]);
            initializeDashboard();
        } else {
            alert('No data found in the Excel file.');
        }
    };
    reader.readAsArrayBuffer(file);
}

// Page refresh warning
window.addEventListener('beforeunload', function (e) {
    if (rawData.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved work. Are you sure you want to leave?';
    }
});

// Utility functions
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('theme-dark', isDarkTheme);
    const button = document.querySelector('button[onclick="toggleTheme()"]');
    button.textContent = isDarkTheme ? '☀️ Theme' : '🌙 Theme';
    showNotification('success', `Switched to ${isDarkTheme ? 'dark' : 'light'} theme`);
}

function showHelp() {
    document.getElementById('helpModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showConfirmModal(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'block';
    confirmCallback = callback;
}

function confirmAction() {
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
    closeModal('confirmModal');
}

function cancelAction() {
    confirmCallback = null;
    closeModal('confirmModal');
}

function saveProject() {
    if (rawData.length === 0) {
        showNotification('warning', 'No data to save!');
        return;
    }
    
    const projectData = {
        rawData,
        filteredData,
        headers,
        charts: charts.map(c => ({
            id: c.id,
            xCol: c.xCol,
            yCol: c.yCol,
            type: c.type,
            title: c.title
        }))
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    saveAs(blob, `dashboard-project-${new Date().toISOString().split('T')[0]}.json`);
    showNotification('success', 'Project saved successfully!');
}

function loadProject() {
    const input = document.getElementById('loadProjectInput');
    input.click();
    input.onchange = async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const projectData = JSON.parse(text);

            rawData = projectData.rawData;
            filteredData = projectData.filteredData;
            headers = projectData.headers;

            initializeDashboard();
            
            // Restore charts if they exist
            if (projectData.charts) {
                setTimeout(() => {
                    projectData.charts.forEach(chartData => {
                        addChart(chartData.id, chartData.xCol, chartData.yCol, chartData.type);
                    });
                }, 500);
            }
            
            showNotification('success', 'Project loaded successfully!');
        } catch (error) {
            showNotification('error', 'Error loading project file!');
        }
    };
}

function clearAllCharts() {
    showConfirmModal('Are you sure you want to clear all charts?', () => {
        document.getElementById('chartsContainer').innerHTML = '';
        charts.forEach(chartObj => chartObj.chart.destroy());
        charts = [];
        currentChartId = 0;
        showNotification('warning', 'All charts cleared!');
    });
}

function showChartTemplates() {
    document.getElementById('templateModal').style.display = 'block';
}

function applyTemplate(templateType) {
    if (headers.length === 0) {
        showNotification('error', 'Please upload data first!');
        return;
    }
    
    clearAllCharts();
    
    setTimeout(() => {
        if (templateType === 'sales') {
            const productCol = headers.find(h => h.toLowerCase().includes('product')) || headers[0];
            const salesCol = headers.find(h => h.toLowerCase().includes('sales') || h.toLowerCase().includes('revenue')) || headers[1];
            const regionCol = headers.find(h => h.toLowerCase().includes('region')) || headers[0];
            const quantityCol = headers.find(h => h.toLowerCase().includes('quantity')) || headers[1];
            
            addChart(null, productCol, salesCol, 'bar');
            addChart(null, regionCol, quantityCol, 'pie');
        } else if (templateType === 'financial') {
            const dateCol = headers.find(h => h.toLowerCase().includes('date')) || headers[0];
            const salesCol = headers.find(h => h.toLowerCase().includes('sales') || h.toLowerCase().includes('amount')) || headers[1];
            
            addChart(null, dateCol, salesCol, 'line');
        } else if (templateType === 'marketing') {
            const productCol = headers.find(h => h.toLowerCase().includes('product')) || headers[0];
            const salesCol = headers.find(h => h.toLowerCase().includes('sales')) || headers[1];
            
            addChart(null, productCol, salesCol, 'doughnut');
        } else if (templateType === 'inventory') {
            const regionCol = headers.find(h => h.toLowerCase().includes('region')) || headers[0];
            const quantityCol = headers.find(h => h.toLowerCase().includes('quantity')) || headers[1];
            
            addChart(null, regionCol, quantityCol, 'scatter');
        }
        
        closeModal('templateModal');
        showNotification('success', `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} template applied!`);
    }, 100);
}

function initializeDashboard() {
    filteredData = [...rawData];
    displayDataPreview();
    generateStatistics();
    setupFilters();
    setupChartConfiguration();
    showSections();
    showNotification('success', 'Data loaded successfully!');
}

function displayDataPreview() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    
    // Clear existing content
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Create header row
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b';
        headerRow.appendChild(th);
    });
    tableHeader.appendChild(headerRow);
    
    // Create data rows (show first 100 rows)
    const displayData = filteredData.slice(0, 100);
    displayData.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50';
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
    
    document.getElementById('dataPreview').classList.remove('hidden');
}

function generateStatistics() {
    const statisticsContainer = document.getElementById('statisticsContainer');
    statisticsContainer.innerHTML = '';
    
    const numericColumns = headers.filter(header => {
        return filteredData.some(row => !isNaN(parseFloat(row[header])) && isFinite(row[header]));
    });
    
    numericColumns.forEach(column => {
        const values = filteredData.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
        
        if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const count = values.length;
            
            const statCard = document.createElement('div');
            statCard.className = 'bg-white p-4 rounded-lg shadow border';
            statCard.innerHTML = `
                <h4 class="font-semibold text-gray-800 mb-2">${column}</h4>
                <div class="space-y-1 text-sm">
                    <div>Count: <span class="font-medium">${count}</span></div>
                    <div>Sum: <span class="font-medium">${sum.toFixed(2)}</span></div>
                    <div>Average: <span class="font-medium">${avg.toFixed(2)}</span></div>
                    <div>Min: <span class="font-medium">${min}</span></div>
                    <div>Max: <span class="font-medium">${max}</span></div>
                </div>
            `;
            statisticsContainer.appendChild(statCard);
        }
    });
    
    document.getElementById('analysisSection').classList.remove('hidden');
}

function setupFilters() {
    const filterColumn = document.getElementById('filterColumn');
    filterColumn.innerHTML = '<option value="">Select column</option>';
    
    headers.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        filterColumn.appendChild(option);
    });
    
    document.getElementById('filtersSection').classList.remove('hidden');
}

function setupChartConfiguration() {
    const xAxis = document.getElementById('xAxis');
    const yAxis = document.getElementById('yAxis');
    
    xAxis.innerHTML = '<option value="">Select column</option>';
    yAxis.innerHTML = '<option value="">Select column</option>';
    
    headers.forEach(header => {
        const xOption = document.createElement('option');
        xOption.value = header;
        xOption.textContent = header;
        xAxis.appendChild(xOption);
        
        const yOption = document.createElement('option');
        yOption.value = header;
        yOption.textContent = header;
        yAxis.appendChild(yOption);
    });
    
    document.getElementById('chartConfigSection').classList.remove('hidden');
}

function showSections() {
    document.getElementById('dashboardSection').classList.remove('hidden');
}

function applyFilter() {
    const filterColumn = document.getElementById('filterColumn').value;
    const filterValue = document.getElementById('filterValue').value;
    
    if (!filterColumn || !filterValue) {
        alert('Please select a column and enter a value to filter.');
        return;
    }
    
    filteredData = rawData.filter(row => {
        const cellValue = row[filterColumn];
        return cellValue && cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
    });
    
    displayDataPreview();
    generateStatistics();
    updateAllCharts();
}

function clearFilters() {
    filteredData = [...rawData];
    document.getElementById('filterColumn').value = '';
    document.getElementById('filterValue').value = '';
    
    displayDataPreview();
    generateStatistics();
    updateAllCharts();
}

function updateChart() {
    const xAxis = document.getElementById('xAxis').value;
    const yAxis = document.getElementById('yAxis').value;
    const chartType = document.getElementById('chartType').value;
    
    if (!xAxis || !yAxis) {
        return;
    }
    
    // Update existing chart or create new one
    const existingChart = charts.find(chart => chart.id === 'main-chart');
    if (existingChart) {
        updateChartData(existingChart, xAxis, yAxis, chartType);
    } else {
        addChart('main-chart', xAxis, yAxis, chartType);
    }
}

function addChart(id = null, xCol = null, yCol = null, type = null) {
    const chartId = id || `chart-${currentChartId++}`;
    const xAxis = xCol || document.getElementById('xAxis').value;
    const yAxis = yCol || document.getElementById('yAxis').value;
    const chartType = type || document.getElementById('chartType').value;
    const chartTitle = (document.getElementById('chartTitle') ? document.getElementById('chartTitle').value : '') || `${yAxis} by ${xAxis}`;
    
    if (!xAxis || !yAxis) {
        showNotification('error', 'Please select both X and Y axis columns.');
        return;
    }
    
    const chartsContainer = document.getElementById('chartsContainer');
    const chartDiv = document.createElement('div');
    chartDiv.className = 'bg-white p-4 rounded-lg shadow border draggable';
    chartDiv.draggable = true;
    chartDiv.id = `container-${chartId}`;
    
    chartDiv.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-800">${chartTitle}</h3>
            <div class="flex space-x-2">
                <button onclick="fullscreenChart('${chartId}')" class="text-blue-500 hover:text-blue-700" title="Fullscreen">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                    </svg>
                </button>
                <button onclick="duplicateChart('${chartId}')" class="text-green-500 hover:text-green-700" title="Duplicate">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                </button>
                <button onclick="removeChart('${chartId}')" class="text-red-500 hover:text-red-700" title="Remove">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="${chartId}"></canvas>
        </div>
    `;
    
    chartsContainer.appendChild(chartDiv);
    
    // Add drag and drop functionality
    chartDiv.addEventListener('dragstart', handleChartDragStart);
    chartDiv.addEventListener('dragover', handleChartDragOver);
    chartDiv.addEventListener('drop', handleChartDrop);
    
    // Create chart
    createChart(chartId, xAxis, yAxis, chartType, chartTitle);
}

function createChart(chartId, xCol, yCol, chartType, title) {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    // Prepare data
    const chartData = prepareChartData(xCol, yCol, chartType);
    
    const config = {
        type: chartType,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                legend: {
                    display: chartType === 'pie' || chartType === 'doughnut'
                }
            },
            scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
                x: {
                    title: {
                        display: true,
                        text: xCol
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yCol
                    }
                }
            }
        }
    };
    
    const chart = new Chart(ctx, config);
    charts.push({
        id: chartId,
        chart: chart,
        xCol: xCol,
        yCol: yCol,
        type: chartType,
        title: title
    });
}

function prepareChartData(xCol, yCol, chartType) {
    const dataMap = new Map();
    
    filteredData.forEach(row => {
        const xValue = row[xCol];
        const yValue = parseFloat(row[yCol]);
        
        if (!isNaN(yValue)) {
            if (dataMap.has(xValue)) {
                dataMap.set(xValue, dataMap.get(xValue) + yValue);
            } else {
                dataMap.set(xValue, yValue);
            }
        }
    });
    
    const labels = Array.from(dataMap.keys()).slice(0, 20); // Limit to 20 items
    const data = labels.map(label => dataMap.get(label));
    
    const colors = generateColors(labels.length);
    
    return {
        labels: labels,
        datasets: [{
            label: yCol,
            data: data,
            backgroundColor: chartType === 'pie' || chartType === 'doughnut' ? colors : colors[0],
            borderColor: chartType === 'pie' || chartType === 'doughnut' ? colors : colors[0],
            borderWidth: 1
        }]
    };
}

function generateColors(count) {
    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#6B7280', '#DC2626', '#059669', '#D97706'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

function updateChartData(chartObj, xCol, yCol, chartType) {
    const newData = prepareChartData(xCol, yCol, chartType);
    chartObj.chart.data = newData;
    chartObj.chart.update();
}

function updateAllCharts() {
    charts.forEach(chartObj => {
        updateChartData(chartObj, chartObj.xCol, chartObj.yCol, chartObj.type);
    });
}

function removeChart(chartId) {
    showConfirmModal('Are you sure you want to remove this chart?', () => {
        const chartIndex = charts.findIndex(chart => chart.id === chartId);
        if (chartIndex !== -1) {
            charts[chartIndex].chart.destroy();
            charts.splice(chartIndex, 1);
        }
        
        const chartContainer = document.getElementById(`container-${chartId}`);
        if (chartContainer) {
            chartContainer.remove();
        }
        
        showNotification('success', 'Chart removed successfully!');
    });
}

function duplicateChart(chartId) {
    const chartObj = charts.find(chart => chart.id === chartId);
    if (chartObj) {
        addChart(null, chartObj.xCol, chartObj.yCol, chartObj.type);
        showNotification('success', 'Chart duplicated successfully!');
    }
}

function fullscreenChart(chartId) {
    const chartContainer = document.getElementById(`container-${chartId}`);
    if (chartContainer) {
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.className = 'fullscreen-chart';
        fullscreenDiv.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold">Fullscreen Chart</h2>
                <button onclick="exitFullscreen()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                    Exit Fullscreen
                </button>
            </div>
            <div style="height: calc(100vh - 100px);">
                <canvas id="fullscreen-${chartId}"></canvas>
            </div>
        `;
        
        document.body.appendChild(fullscreenDiv);
        
        // Create fullscreen chart
        const chartObj = charts.find(chart => chart.id === chartId);
        if (chartObj) {
            const ctx = document.getElementById(`fullscreen-${chartId}`).getContext('2d');
            const chartData = prepareChartData(chartObj.xCol, chartObj.yCol, chartObj.type);
            
            const config = {
                type: chartObj.type,
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: chartObj.title
                        }
                    }
                }
            };
            
            new Chart(ctx, config);
        }
    }
}

function exitFullscreen() {
    const fullscreenDiv = document.querySelector('.fullscreen-chart');
    if (fullscreenDiv) {
        document.body.removeChild(fullscreenDiv);
    }
}

// Drag and drop functionality for charts
function handleChartDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
    e.target.classList.add('dragging');
}

function handleChartDragOver(e) {
    e.preventDefault();
}

function handleChartDrop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedElement = document.getElementById(draggedId);
    const dropTarget = e.target.closest('.draggable');
    
    if (draggedElement && dropTarget && draggedElement !== dropTarget) {
        const container = dropTarget.parentNode;
        const allCharts = Array.from(container.children);
        const draggedIndex = allCharts.indexOf(draggedElement);
        const dropIndex = allCharts.indexOf(dropTarget);
        
        if (draggedIndex < dropIndex) {
            container.insertBefore(draggedElement, dropTarget.nextSibling);
        } else {
            container.insertBefore(draggedElement, dropTarget);
        }
    }
    
    draggedElement.classList.remove('dragging');
}

// Export functionality
function exportDashboard(format) {
    const dashboardElement = document.getElementById('dashboardSection');
    
    switch (format) {
        case 'pdf':
            exportToPDF();
            break;
        case 'png':
            exportToPNG(dashboardElement);
            break;
        case 'excel':
            exportToExcel();
            break;
        default:
            alert('Unsupported export format');
    }
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    pdf.setFontSize(20);
    pdf.text('Dashboard Report', 20, 20);
    
    // Add statistics
    pdf.setFontSize(12);
    let yPosition = 40;
    
    const numericColumns = headers.filter(header => {
        return filteredData.some(row => !isNaN(parseFloat(row[header])) && isFinite(row[header]));
    });
    
    numericColumns.forEach(column => {
        const values = filteredData.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
        if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            pdf.text(`${column}:`, 20, yPosition);
            pdf.text(`  Count: ${values.length}`, 30, yPosition + 10);
            pdf.text(`  Sum: ${sum.toFixed(2)}`, 30, yPosition + 20);
            pdf.text(`  Average: ${avg.toFixed(2)}`, 30, yPosition + 30);
            pdf.text(`  Min: ${min}`, 30, yPosition + 40);
            pdf.text(`  Max: ${max}`, 30, yPosition + 50);
            
            yPosition += 70;
            
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
        }
    });
    
    pdf.save('dashboard-report.pdf');
}

function exportToPNG(element) {
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        canvas.toBlob(function(blob) {
            saveAs(blob, 'dashboard.png');
        });
    });
}

function exportToExcel() {
    const wb = XLSX.utils.book_new();
    
    // Add raw data sheet
    const ws1 = XLSX.utils.json_to_sheet(filteredData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Data');
    
    // Add statistics sheet
    const numericColumns = headers.filter(header => {
        return filteredData.some(row => !isNaN(parseFloat(row[header])) && isFinite(row[header]));
    });
    
    const statistics = numericColumns.map(column => {
        const values = filteredData.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
        if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            return {
                Column: column,
                Count: values.length,
                Sum: sum.toFixed(2),
                Average: avg.toFixed(2),
                Min: min,
                Max: max
            };
        }
        return null;
    }).filter(stat => stat !== null);
    
    const ws2 = XLSX.utils.json_to_sheet(statistics);
    XLSX.utils.book_append_sheet(wb, ws2, 'Statistics');
    
    XLSX.writeFile(wb, 'dashboard-export.xlsx');
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard tool initialized');
    showNotification('success', 'Dashboard tool is ready!');
    
    // Click outside modal to close
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveProject();
        } else if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            loadProject();
        } else if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportDashboard('png');
        } else if (e.key === 'Escape') {
            // Close any open modals
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            // Exit fullscreen
            exitFullscreen();
        }
    });
});
