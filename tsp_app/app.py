"""FastAPI web application for TSP/VRP solver"""

import os
import ast
import sys
from typing import Dict, Any, List
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.data_loader import DataLoader
from core.calculator import TSPCalculator
from config import DEFAULT_NODES

app = FastAPI()
app.mount(
    "/static",
    StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')),
    name='static'
)
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates'))

# Global state for solver
solver_state = {
    'n_full': None,
    'n': None,
    'option': None,
    'dist_matrix': None,
    'calculator': None,
    'iteration': 0,
    'solution': None,
    'all_cycles': [],
    'subtours': [],
    'arcs': [],
    'main_cycle': None,
    'objective': None
}


@app.get('/health')
async def health():
    """Lightweight healthcheck endpoint for hosting platforms."""
    return {'status': 'ok'}


@app.get('/', response_class=HTMLResponse)
async def index(request: Request):
    """Main page"""
    try:
        loader = DataLoader()
        dist, n_full = loader.load_dataset()
        solver_state['dist_matrix'] = dist
        solver_state['n_full'] = n_full
        print(f"Dataset loaded: {n_full} nodes available")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return templates.TemplateResponse(
        request,
        'index.html',
        {
            'request': request,
            'default_nodes': DEFAULT_NODES,
            'n_full': n_full
        }
    )


@app.post('/api/load-nodes')
async def load_nodes(request: Request):
    """Load and prepare nodes for visualization"""
    try:
        data = await request.json()
        n_nodes = int(data.get('n_nodes', DEFAULT_NODES))

        if n_nodes < 2 or n_nodes > solver_state['n_full']:
            raise HTTPException(status_code=400, detail=f'Nodes must be between 2 and {solver_state["n_full"]}')

        solver_state['n'] = n_nodes

        full_dist = solver_state['dist_matrix']
        dist_matrix = [row[:n_nodes] for row in full_dist[:n_nodes]]
        solver_state['dist_matrix'] = dist_matrix

        nodes = list(range(n_nodes))
        distances = {}

        for i in range(n_nodes):
            for j in range(n_nodes):
                if i != j:
                    distances[f"{i}-{j}"] = dist_matrix[i][j]

        return {
            'success': True,
            'nodes': nodes,
            'distances': distances,
            'n_nodes': n_nodes
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error loading nodes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/set-option')
async def set_option(request: Request):
    """Set solving option and create model"""
    try:
        data = await request.json()
        option = int(data.get('option', -1))

        if option not in [0, 1, 2]:
            raise HTTPException(status_code=400, detail='Invalid option')

        solver_state['option'] = option
        solver_state['calculator'] = TSPCalculator(solver_state['dist_matrix'], solver_state['n'])
        solver_state['calculator'].create_model()
        solver_state['iteration'] = 0

        return {
            'success': True,
            'message': f'Option {option} selected. Ready to solve.',
            'option': option
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error setting option: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/solve-iteration')
async def solve_iteration():
    """Solve one iteration and return results"""
    try:
        if solver_state['calculator'] is None:
            raise HTTPException(status_code=400, detail='Solver not initialized')

        calc = solver_state['calculator']
        objective = calc.optimize()
        arcs, all_cycles, subtours = calc.extract_solution()
        main_cycle = next((c for c in all_cycles if c and 0 in c[:-1]), None)

        solver_state['iteration'] += 1
        solver_state['objective'] = objective
        solver_state['arcs'] = arcs
        solver_state['all_cycles'] = all_cycles
        solver_state['subtours'] = subtours
        solver_state['main_cycle'] = main_cycle

        arcs_display = [f"{a} → {b}" for a, b in arcs]
        subtours_display = [f"Route {i+1}: {' → '.join(map(str, cyc[:-1]))}" for i, cyc in enumerate(subtours)]
        solution_path = ' → '.join(map(str, main_cycle[:-1])) if main_cycle else ''
        is_solved = len(subtours) == 0

        return {
            'success': True,
            'iteration': solver_state['iteration'],
            'objective': objective,
            'arcs': arcs_display,
            'all_cycles': all_cycles,
            'subtours': subtours_display,
            'solution_path': solution_path,
            'num_subtours': len(subtours),
            'is_solved': is_solved,
            'option': solver_state['option']
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error solving: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/add-subtours')
async def add_subtours(request: Request):
    """Add manual subtours (for Option 1)"""
    try:
        if solver_state['calculator'] is None:
            raise HTTPException(status_code=400, detail='Solver not initialized')

        data = await request.json()
        subtours_str = data.get('subtours', '')

        if not subtours_str.strip():
            raise HTTPException(status_code=400, detail='No subtours provided')

        try:
            subtours = ast.literal_eval(subtours_str)
            if not isinstance(subtours, list) or not all(isinstance(c, list) for c in subtours):
                raise ValueError('Invalid format')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f'Invalid subtour format: {e}')

        calc = solver_state['calculator']
        for idx, cycle in enumerate(subtours):
            calc.add_subtour_elimination_cut(cycle, name=f"manual_subtour_{solver_state['iteration']}_{idx}")

        return {
            'success': True,
            'message': f'Added {len(subtours)} manual subtour constraints'
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding subtours: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/add-auto-subtours')
async def add_auto_subtours():
    """Add automatic subtours (for Option 2)"""
    try:
        if solver_state['calculator'] is None:
            raise HTTPException(status_code=400, detail='Solver not initialized')

        calc = solver_state['calculator']
        subtours = solver_state['subtours']

        for k, cyc in enumerate(subtours):
            calc.add_subtour_elimination_cut(cyc[:-1], name=f"subtour_{solver_state['iteration']}_{k}")

        return {
            'success': True,
            'message': f'Added {len(subtours)} automatic subtour constraints'
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding auto subtours: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/api/get-graph-data')
async def get_graph_data():
    """Get graph data for current solution"""
    try:
        n = solver_state['n']
        all_cycles = solver_state['all_cycles']
        dist_matrix = solver_state['dist_matrix']

        if n is None or dist_matrix is None:
            raise HTTPException(status_code=400, detail='No graph data available')

        nodes_data = []
        for i in range(n):
            node_type = 'depot' if i == 0 else 'customer'
            nodes_data.append({
                'id': i,
                'type': node_type,
                'label': f'Node {i}'
            })

        depot = 0
        main_cycle = next((c for c in all_cycles if c and depot in c[:-1]), None)
        subtours = [c for c in all_cycles if c is not main_cycle]

        edges_data = []
        colors = ['#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#f7b731', '#9b59b6', '#e17055']

        for cycle_idx, cycle in enumerate(all_cycles):
            if not cycle or len(cycle) < 2:
                continue
            cycle_type = 'main' if cycle is main_cycle else 'subtour'
            color = '#ff6b6b' if cycle_type == 'main' else colors[cycle_idx % len(colors)]
            for i in range(len(cycle) - 1):
                u, v = cycle[i], cycle[i + 1]
                distance = dist_matrix[u][v]
                edges_data.append({
                    'source': u,
                    'target': v,
                    'weight': distance,
                    'color': color,
                    'cycle_id': cycle_idx,
                    'type': cycle_type
                })

        return {
            'success': True,
            'nodes': nodes_data,
            'edges': edges_data,
            'main_cycle': main_cycle or [],
            'subtours': subtours
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting graph data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    try:
        import uvicorn
    except ImportError:
        raise RuntimeError('uvicorn is required to run this app. Install it with: pip install fastapi uvicorn')

    print('Starting TSP/VRP Web Application...')
    print('Open browser: http://127.0.0.1:5000')
    uvicorn.run('app:app', host='127.0.0.1', port=5000, reload=True)
