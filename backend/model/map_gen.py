import random
import math
from typing import List, Dict, Any, Tuple


MAP_COLS = 38
MAP_ROWS = 24

TERRITORY_SIZE = 15
AI_TERRITORY_SIZE = 10


def _noise(x: float, y: float, seed: int) -> float:
    """Simple pseudo-noise function for terrain generation."""
    n = int(x * 1000 + y * 100 + seed)
    n = (n >> 13) ^ n
    n = (n * (n * n * 60493 + 19990303) + 1376312589) & 0x7FFFFFFF
    return n / 0x7FFFFFFF


def _smooth_noise(x: float, y: float, seed: int) -> float:
    """Smoothed noise by averaging neighbors."""
    corners = (
        _noise(x - 1, y - 1, seed) + _noise(x + 1, y - 1, seed) +
        _noise(x - 1, y + 1, seed) + _noise(x + 1, y + 1, seed)
    ) / 16.0
    sides = (
        _noise(x - 1, y, seed) + _noise(x + 1, y, seed) +
        _noise(x, y - 1, seed) + _noise(x, y + 1, seed)
    ) / 8.0
    center = _noise(x, y, seed) / 4.0
    return corners + sides + center


def _interpolated_noise(x: float, y: float, seed: int) -> float:
    """Interpolated noise for smoother terrain."""
    ix, iy = int(x), int(y)
    fx, fy = x - ix, y - iy
    v1 = _smooth_noise(ix, iy, seed)
    v2 = _smooth_noise(ix + 1, iy, seed)
    v3 = _smooth_noise(ix, iy + 1, seed)
    v4 = _smooth_noise(ix + 1, iy + 1, seed)
    i1 = v1 + fx * (v2 - v1)
    i2 = v3 + fx * (v4 - v3)
    return i1 + fy * (i2 - i1)


def _get_elevation(col: int, row: int, seed: int) -> float:
    """Get terrain elevation at a given hex position."""
    x, y = col / MAP_COLS, row / MAP_ROWS
    e = 0.0
    e += 1.0 * _interpolated_noise(x * 2, y * 2, seed)
    e += 0.5 * _interpolated_noise(x * 4, y * 4, seed + 1)
    e += 0.25 * _interpolated_noise(x * 8, y * 8, seed + 2)
    e /= 1.75
    # Bias toward land in the center, water at edges
    dx = abs(col - MAP_COLS / 2) / (MAP_COLS / 2)
    dy = abs(row - MAP_ROWS / 2) / (MAP_ROWS / 2)
    edge_bias = max(dx, dy) * 0.4
    e -= edge_bias
    return e


def _get_moisture(col: int, row: int, seed: int) -> float:
    """Get moisture level at a given hex position."""
    x, y = col / MAP_COLS, row / MAP_ROWS
    m = _interpolated_noise(x * 3 + 0.5, y * 3 + 0.5, seed + 100)
    return m


def _elevation_to_terrain(elevation: float, moisture: float) -> str:
    """Convert elevation and moisture to a terrain type."""
    if elevation < 0.10:
        return "ocean"
    elif elevation < 0.18:
        return "coast"
    elif elevation > 0.75:
        return "mountain"
    elif elevation > 0.60:
        return "hills"
    elif elevation < 0.20 and moisture < 0.3:
        return "coast"
    elif moisture < 0.25:
        if elevation > 0.35:
            return "hills"
        return "desert"
    elif moisture < 0.45:
        return "plains"
    elif moisture < 0.65:
        return "grassland"
    elif elevation > 0.55:
        return "hills"
    elif moisture > 0.80:
        return "jungle"
    else:
        return "forest"


def _hex_distance(q1: int, r1: int, q2: int, r2: int) -> int:
    """Calculate hex grid distance using axial coordinates (offset grid)."""
    # Convert offset to axial
    ax = q1 - (r1 - (r1 & 1)) // 2
    ar = r1
    bx = q2 - (r2 - (r2 & 1)) // 2
    br = r2
    return max(abs(ax - bx), abs(ar - br), abs((ax + ar) - (bx + br)))


def _flood_fill_territory(
    start_col: int,
    start_row: int,
    tiles: List[List[Dict]],
    owner: str,
    size: int,
    rng: random.Random,
) -> List[Tuple[int, int]]:
    """Flood-fill territory from a starting position."""
    claimed = []
    queue = [(start_col, start_row)]
    visited = set()
    visited.add((start_col, start_row))

    while queue and len(claimed) < size:
        rng.shuffle(queue)
        col, row = queue.pop(0)

        tile = tiles[row][col]
        if tile["terrain"] in ("ocean", "mountain"):
            continue
        if tile["owner"] is not None:
            continue

        tile["owner"] = owner
        claimed.append((col, row))

        neighbors = _get_neighbors(col, row)
        for nc, nr in neighbors:
            if 0 <= nc < MAP_COLS and 0 <= nr < MAP_ROWS:
                if (nc, nr) not in visited:
                    visited.add((nc, nr))
                    queue.append((nc, nr))

    return claimed


def _get_neighbors(col: int, row: int) -> List[Tuple[int, int]]:
    """Get hex neighbors for offset grid."""
    if row % 2 == 0:
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1), (-1, 1), (-1, -1)]
    else:
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1)]
    return [(col + dc, row + dr) for dc, dr in directions]


def _find_land_start(tiles: List[List[Dict]], preferred_col: int, preferred_row: int) -> Tuple[int, int]:
    """Find the nearest land tile to a preferred starting position."""
    best = None
    best_dist = float("inf")
    for r in range(MAP_ROWS):
        for c in range(MAP_COLS):
            if tiles[r][c]["terrain"] not in ("ocean", "mountain", "coast") and tiles[r][c]["owner"] is None:
                dist = math.sqrt((c - preferred_col) ** 2 + (r - preferred_row) ** 2)
                if dist < best_dist:
                    best_dist = dist
                    best = (c, r)
    return best


def generate_map(seed: int, state_name: str, state_id: str) -> Dict[str, Any]:
    """
    Generate a world map with terrain, player territory, and AI countries.
    Returns a dict with tiles (2D array), countries, and metadata.
    """
    rng = random.Random(seed)

    # Generate terrain
    tiles: List[List[Dict]] = []
    for row in range(MAP_ROWS):
        row_tiles = []
        for col in range(MAP_COLS):
            elevation = _get_elevation(col, row, seed)
            moisture = _get_moisture(col, row, seed)
            terrain = _elevation_to_terrain(elevation, moisture)
            row_tiles.append({
                "terrain": terrain,
                "owner": None,
                "city": None,
                "units": [],
                "elevation": round(elevation, 3),
            })
        tiles.append(row_tiles)

    # Place player territory in a semi-central area
    player_start_col = rng.randint(MAP_COLS // 4, 3 * MAP_COLS // 4)
    player_start_row = rng.randint(MAP_ROWS // 4, 3 * MAP_ROWS // 4)
    start = _find_land_start(tiles, player_start_col, player_start_row)
    if start:
        player_tiles = _flood_fill_territory(start[0], start[1], tiles, state_id, TERRITORY_SIZE, rng)
        capital_tile = player_tiles[0] if player_tiles else (start[0], start[1])
    else:
        capital_tile = (player_start_col, player_start_row)
        player_tiles = []

    # Place capital city
    tiles[capital_tile[1]][capital_tile[0]]["city"] = {
        "name": state_name,
        "is_capital": True,
        "population": 500000,
    }

    # Place AI countries
    from model.game_config import AI_COUNTRIES
    ai_countries = []
    for i, ai_data in enumerate(AI_COUNTRIES[:6]):
        angle = (i / 6) * 2 * math.pi + rng.uniform(-0.3, 0.3)
        radius = min(MAP_COLS, MAP_ROWS) * 0.35
        ai_col = int(MAP_COLS / 2 + radius * math.cos(angle))
        ai_row = int(MAP_ROWS / 2 + radius * math.sin(angle))
        ai_col = max(2, min(MAP_COLS - 3, ai_col))
        ai_row = max(2, min(MAP_ROWS - 3, ai_row))

        ai_start = _find_land_start(tiles, ai_col, ai_row)
        if not ai_start:
            continue

        ai_id = f"ai_{i}"
        ai_tiles = _flood_fill_territory(ai_start[0], ai_start[1], tiles, ai_id, AI_TERRITORY_SIZE, rng)
        if ai_tiles:
            ai_capital = ai_tiles[0]
            tiles[ai_capital[1]][ai_capital[0]]["city"] = {
                "name": ai_data["name"],
                "is_capital": True,
                "population": rng.randint(100000, 800000),
            }
            ai_countries.append({
                "id": ai_id,
                "name": ai_data["name"],
                "flag_color": ai_data["flag_color"],
                "personality": ai_data["personality"],
                "capital": {"col": ai_capital[0], "row": ai_capital[1]},
                "relations": {"player": rng.randint(20, 80)},
            })

    return {
        "tiles": tiles,
        "cols": MAP_COLS,
        "rows": MAP_ROWS,
        "player_capital": {"col": capital_tile[0], "row": capital_tile[1]},
        "ai_countries": ai_countries,
        "seed": seed,
    }
