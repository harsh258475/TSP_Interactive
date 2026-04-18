## TSP/VRP Solver - Web Application

A modern web-based TSP/VRP (Traveling Salesman Problem / Vehicle Routing Problem) solver with interactive visualization and iterative constraint generation.

### Project Layout

```
tsp_app/
├── app.py                  # FastAPI web application
├── main.py                 # Entry point - main GUI application (legacy)
├── config.py              # Configuration and constants
├── core/                  # Core logic (data loading, calculations)
│   ├── __init__.py
│   ├── data_loader.py    # Dataset loading and parsing
│   └── calculator.py     # TSP/VRP optimization logic (Gurobi)
├── ui/                    # User interface components (legacy - for GUI)
│   ├── __init__.py
│   ├── dialogs.py        # GUI dialogs (input, options, results)
│   └── visualizer.py     # Graph visualization (matplotlib + networkx)
├── static/                # Static files (CSS, JavaScript)
│   ├── style.css         # Application styling
│   └── script.js         # Frontend interactivity
├── templates/             # HTML templates
│   └── index.html        # Main web page
└── README.md             # This file
```

### Module Descriptions

#### **config.py**
- Centralized configuration and constants
- Dataset path configuration
- GUI window sizes
- Solver parameters (time limit, max iterations)
- Color schemes for visualization

#### **core/data_loader.py - DataLoader class**
- `load_dataset()` - Load distance matrix from phub25_dataset.txt
- `_extract_matrices()` - Parse all matrices from text file
- `_is_valid_matrix()` - Validate square numeric matrices

#### **core/calculator.py - TSPCalculator class**
- `create_model()` - Build initial Gurobi TSP model
- `optimize()` - Run Gurobi solver
- `extract_solution()` - Extract arcs, cycles, subtours
- `add_subtour_elimination_cut()` - Add SEC constraints
- `next_iteration()` - Increment solver iteration counter

#### **app.py - FastAPI Web Application**
- `/` - Main page with 4-step workflow
- `/api/load-nodes` - Load and prepare nodes (POST)
- `/api/set-option` - Set solving option (POST)
- `/api/solve-iteration` - Run one iteration (POST)
- `/api/add-subtours` - Add manual subtours for Option 1 (POST)
- `/api/add-auto-subtours` - Add auto subtours for Option 2 (POST)
- `/api/get-graph-data` - Get current solution graph data (GET)

#### **static/style.css - Application Styling**
- Modern responsive design
- Color scheme and layout
- Animations and transitions

#### **static/script.js - Frontend JavaScript**
- Single-page application workflow
- API communication with Flask backend
- Graph visualization with SVG
- Status messages and error handling

#### **templates/index.html - Main Web Page**
- 4-step interactive workflow
- Responsive layout
- Embedded SVG graphs

### Features

✅ **Single Page Application** - All features on one webpage  
✅ **4-Step Workflow**:
   1. Enter number of nodes (2 to n_full)
   2. Visualize network graph + distance matrix
   3. Select solving option (0, 1, or 2)
   4. Iterative solving with real-time results

✅ **Three Solving Options**:
   - **Option 0**: No subtour elimination (raw assignment output)
   - **Option 1**: Manual subtour input for targeted constraint generation
   - **Option 2**: Fully automated subtour elimination (guaranteed single tour)

✅ **Interactive Visualization**:
   - Network graph with node positions
   - Distance matrix display
   - Solution graph with cycle coloring
   - Real-time updates

✅ **Responsive Design** - Works on desktop and tablet

### Installation & Setup

**Step 1: Install Dependencies**

```bash
pip install fastapi uvicorn gurobipy networkx matplotlib
```

**Step 2: Ensure Dataset is Available**

The `phub25_dataset.txt` file must be in the same directory as `app.py`:
```
c:\Users\harsh\OneDrive - IIT Delhi\Documents\IITD\SEM2\SCA\Assignments\
├── tsp_app\
│   ├── app.py
│   ├── phub25_dataset.txt  ← Must be here or in parent directory
│   └── ...
```

If not, copy it from the parent directory.

### Usage

**Run the Web Application:**

```bash
cd tsp_app
uvicorn app:app --reload --host 127.0.0.1 --port 5000
```

**Output:**
```
INFO:     Started server process [pid]
INFO:     Uvicorn running on http://127.0.0.1:5000
```

**Access the Application:**
Open your web browser and go to:
```
http://localhost:5000
```

### Workflow Example

1. **Step 1**: Enter `7` nodes
2. **Step 2**: View network graph and distance matrix
3. **Step 3**: Select "Option 1: Manual Subtour Elimination"
4. **Step 4**: 
   - See first iteration results with subtours
   - Enter subtours like: `[[0,5,0],[1,3,1]]`
   - Click "Add Subtours & Solve"
   - Repeat until single tour found

### Key Design Principles

✅ **Separation of Concerns**: Logic, UI, and data are separate
✅ **Modularity**: Easy to add/modify features
✅ **Reusability**: Classes can be imported independently
✅ **Configuration**: All constants in one place
✅ **Scalability**: Web-based for remote access
✅ **Single Page**: No separate windows or pop-ups

### Dependencies

```
Flask          # Web framework
gurobipy       # Optimization solver
tkinter        # GUI framework (built-in, not used in web version)
matplotlib     # Graph visualization (legacy, not used in web version)
networkx       # Network graph operations (legacy, not used in web version)
```

### API Endpoints

**POST /api/load-nodes**
- Request: `{n_nodes: int}`
- Response: `{success: bool, nodes: [], distances: {}}`

**POST /api/set-option**
- Request: `{option: 0|1|2}`
- Response: `{success: bool, message: str}`

**POST /api/solve-iteration**
- Request: `{}`
- Response: `{success: bool, iteration: int, objective: float, arcs: [], subtours: [], is_solved: bool}`

**POST /api/add-subtours**
- Request: `{subtours: string}`
- Response: `{success: bool, message: str}`

**POST /api/add-auto-subtours**
- Request: `{}`
- Response: `{success: bool, message: str}`

**GET /api/get-graph-data**
- Response: `{success: bool, nodes: [], edges: []}`

### Troubleshooting

**Port Already in Use:**
```bash
python app.py  # Will use next available port
```

**Module Not Found Errors:**
```bash
pip install -r requirements.txt  # If requirements.txt exists
```

**Dataset Not Found:**
Ensure `phub25_dataset.txt` is in the correct directory:
```python
# In config.py, update DATASET_PATH if needed
DATASET_PATH = "/path/to/phub25_dataset.txt"
```

### Next Steps & Enhancements

- [ ] Add export results to CSV
- [ ] Add multiple dataset support
- [ ] Add performance metrics visualization
- [ ] Add constraint analysis tools
- [ ] Add VRP with time windows
- [ ] Add demand constraints for VRP


