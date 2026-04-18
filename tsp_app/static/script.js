/* JavaScript for TSP/VRP Web Application */

let currentStep = 1;
let nodeCount = null;
let selectedOption = null;
let distanceMatrix = null;
let nodes = null;
let nodePositions = null;

// Step navigation
function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    
    // Reset manual subtour section on navigation
    if (step !== 4) {
        document.getElementById('manualSubtourSection').style.display = 'none';
    }
}

// Show status message
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message show ${type}`;
    console.log(`[${type.toUpperCase()}] ${message}`);
    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 5000);
}

// Step 1: Load nodes
async function loadNodes() {
    const n = parseInt(document.getElementById('nodeCount').value);
    
    if (isNaN(n) || n < 2) {
        showStatus('Please enter a valid number of nodes', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/load-nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ n_nodes: n })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showStatus(data.error, 'error');
            return;
        }
        
        nodeCount = n;
        nodes = data.nodes;
        distanceMatrix = data.distances;
        nodePositions = generateNodePositions(n);
        
        // Display distance matrix
        displayDistanceMatrix(n);
        
        // Draw initial graph
        drawInitialGraph(n);
        
        // Go to step 2
        goToStep(2);
        showStatus(`Loaded ${n} nodes successfully`, 'success');
        
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Display distance matrix
function displayDistanceMatrix(n) {
    const matrixDiv = document.getElementById('distanceMatrix');
    let html = '<table class="distance-table">';
    html += '<thead><tr><th></th>';
    for (let j = 0; j < n; j++) {
        html += `<th>${j}</th>`;
    }
    html += '</tr></thead><tbody>';
    
    for (let i = 0; i < n; i++) {
        html += `<tr><th>${i}</th>`;
        for (let j = 0; j < n; j++) {
            const dist = distanceMatrix[`${i}-${j}`] || 0;
            html += `<td>${dist.toFixed(1)}</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    
    matrixDiv.innerHTML = html;
}

function generateNodePositions(n) {
    const svg = document.getElementById('graphSvg');
    const width = svg.clientWidth || 600;
    const height = svg.clientHeight || 400;
    const positions = {};
    for (let i = 0; i < n; i++) {
        positions[i] = {
            x: Math.random() * (width - 100) + 50,
            y: Math.random() * (height - 100) + 50
        };
    }
    return positions;
}

// Draw initial graph (nodes only)
function drawInitialGraph(n) {
    const svg = document.getElementById('graphSvg');
    svg.innerHTML = '';
    
    const width = svg.clientWidth || 600;
    const height = svg.clientHeight || 400;
    
    const positions = nodePositions || generateNodePositions(n);
    nodePositions = positions;
    
    // Draw edges
    const edges = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', positions[i].x);
                line.setAttribute('y1', positions[i].y);
                line.setAttribute('x2', positions[j].x);
                line.setAttribute('y2', positions[j].y);
                line.setAttribute('stroke', '#ccc');
                line.setAttribute('stroke-width', '1');
                line.setAttribute('marker-end', 'url(#arrowhead)');
                edges.appendChild(line);
            }
        }
    }
    
    // Add arrowhead marker
    const defs = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', '#ccc');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    
    // Draw nodes
    const nodes_g = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    for (let i = 0; i < n; i++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', positions[i].x);
        circle.setAttribute('cy', positions[i].y);
        circle.setAttribute('r', i === 0 ? 20 : 15);
        circle.setAttribute('fill', i === 0 ? '#ff6b6b' : '#4ecdc4');
        circle.setAttribute('stroke', '#333');
        circle.setAttribute('stroke-width', '2');
        nodes_g.appendChild(circle);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', positions[i].x);
        text.setAttribute('y', positions[i].y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-size', '14');
        text.textContent = i;
        nodes_g.appendChild(text);
    }
}

// Step 3: Select option
function selectOption(option) {
    selectedOption = option;
    document.querySelectorAll('input[name="option"]').forEach((input) => {
        input.checked = Number(input.value) === option;
    });
    document.querySelectorAll('.option').forEach((el, idx) => {
        if (idx === option) {
            el.style.borderColor = '#0066cc';
            el.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.3)';
        } else {
            el.style.borderColor = '#dee2e6';
            el.style.boxShadow = 'none';
        }
    });
}

// Step 4: Start solving
async function startSolving() {
    if (selectedOption === null) {
        showStatus('Please select an option', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/set-option', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ option: selectedOption })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showStatus(data.error, 'error');
            return;
        }
        
        showStatus(`Option ${selectedOption} selected. Starting solver...`, 'success');
        goToStep(4);
        
        // Start first iteration
        await solveIteration();
        
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Solve iteration
async function solveIteration() {
    try {
        const response = await fetch('/api/solve-iteration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showStatus(data.error, 'error');
            return;
        }
        
        // Update display
        document.getElementById('iterationNum').textContent = `Iteration: ${data.iteration}`;
        document.getElementById('objectiveVal').textContent = `Objective: ${data.objective.toFixed(2)}`;
        document.getElementById('subtoursNum').textContent = `Subtours: ${data.num_subtours}`;
        
        document.getElementById('arcsDisplay').textContent = data.arcs.join('\n');
        document.getElementById('subtoursDisplay').textContent = data.subtours.join('\n');
        document.getElementById('solutionPathDisplay').textContent = data.solution_path || 'No final solution path yet.';
        
        // Draw solution graph
        await drawSolutionGraph(data.all_cycles);
        
        // Handle based on option and solution state
        if (data.is_solved) {
            // Solved
            showStatus('Single tour found! Problem solved!', 'success');
            document.getElementById('continueBtn').style.display = 'none';
            document.getElementById('solvedBtn').style.display = 'inline-block';
            document.getElementById('manualSubtourSection').style.display = 'none';
        } else if (selectedOption === 0) {
            // Option 0: Stop after first iteration
            showStatus('Option 0: Raw subtours displayed. Stopping.', 'info');
            document.getElementById('continueBtn').style.display = 'none';
            document.getElementById('solvedBtn').style.display = 'inline-block';
        } else if (selectedOption === 1 && data.num_subtours > 0) {
            // Option 1: Show manual subtour input
            document.getElementById('manualSubtourSection').style.display = 'block';
            document.getElementById('continueBtn').style.display = 'none';
            showStatus('Enter subtours for next iteration (Option 1)', 'info');
        } else if (selectedOption === 2 && data.num_subtours > 0) {
            // Option 2: Auto add subtours and continue
            document.getElementById('manualSubtourSection').style.display = 'none';
            document.getElementById('continueBtn').style.display = 'inline-block';
            showStatus('Subtours found. Click Continue to add constraints.', 'info');
        } else {
            // General continue
            document.getElementById('continueBtn').style.display = 'inline-block';
        }
        
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Add manual subtours (Option 1)
async function addManualSubtours() {
    const subtourStr = document.getElementById('subtourInput').value.trim();
    
    if (!subtourStr) {
        showStatus('Please enter subtours', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/add-subtours', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subtours: subtourStr })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            showStatus(data.error, 'error');
            return;
        }
        
        showStatus(data.message, 'success');
        document.getElementById('subtourInput').value = '';
        document.getElementById('manualSubtourSection').style.display = 'none';
        
        // Solve next iteration
        await solveIteration();
        
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Next iteration (Option 2)
async function nextIteration() {
    if (selectedOption === 2) {
        // Add auto subtours first
        try {
            const response = await fetch('/api/add-auto-subtours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (!data.success) {
                showStatus(data.error, 'error');
                return;
            }
            
            showStatus(data.message, 'success');
        } catch (error) {
            showStatus(`Error: ${error.message}`, 'error');
            return;
        }
    }
    
    // Solve next iteration
    await solveIteration();
}

// Draw solution graph
async function drawSolutionGraph(allCycles) {
    try {
        const response = await fetch('/api/get-graph-data');
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error getting graph data:', data.error);
            return;
        }
        
        const svg = document.getElementById('solutionGraph');
        svg.innerHTML = '';
        
        const width = svg.clientWidth || 500;
        const height = svg.clientHeight || 400;
        
        const positions = nodePositions || generateNodePositions(nodeCount);
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'];
        
        nodePositions = positions;
        
        // Add arrowhead markers
        const defs = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
        const markerTypes = new Set(data.edges.map(edge => edge.type || 'subtour'));
        for (const type of markerTypes) {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', `arrowhead-${type}`);
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3, 0 6');
            polygon.setAttribute('fill', type === 'main' ? '#ff6b6b' : '#96ceb4');
            marker.appendChild(polygon);
            defs.appendChild(marker);
        }

        // Draw edges
        const edges = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
        for (const edge of data.edges) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', positions[edge.source].x);
            line.setAttribute('y1', positions[edge.source].y);
            line.setAttribute('x2', positions[edge.target].x);
            line.setAttribute('y2', positions[edge.target].y);
            line.setAttribute('stroke', edge.color);
            line.setAttribute('stroke-width', edge.type === 'main' ? '4' : '2');
            line.setAttribute('opacity', edge.type === 'main' ? '1' : '0.6');
            if (edge.type !== 'main') {
                line.setAttribute('stroke-dasharray', '6,4');
            }
            line.setAttribute('marker-end', `url(#arrowhead-${edge.type})`);
            edges.appendChild(line);
        }
        
        // Draw nodes
        const nodes_g = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
        for (const node of data.nodes) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', positions[node.id].x);
            circle.setAttribute('cy', positions[node.id].y);
            circle.setAttribute('r', node.type === 'depot' ? 20 : 15);
            circle.setAttribute('fill', node.type === 'depot' ? '#ff6b6b' : '#4ecdc4');
            circle.setAttribute('stroke', '#333');
            circle.setAttribute('stroke-width', '2');
            nodes_g.appendChild(circle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', positions[node.id].x);
            text.setAttribute('y', positions[node.id].y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('font-size', '14');
            text.textContent = node.id;
            nodes_g.appendChild(text);
        }
        
    } catch (error) {
        console.error('Error drawing solution graph:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('TSP Solver Application Ready');
});
