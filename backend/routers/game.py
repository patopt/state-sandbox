import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from db.database import get_db
from db.models import State, GameState, MilitaryUnit, GameCity, ResearchedTech, DiplomacyRelation
from routers.auth import get_current_user_from_token
from db.models import User
from model.game_config import UNIT_TYPES, TECHNOLOGIES, BUILDING_TYPES, AI_COUNTRIES
from model.map_gen import generate_map

router = APIRouter(prefix="/api/game", tags=["game"])

CITY_GRID_SIZE = 20


def _get_or_create_game_state(state_id: int, state_name: str, db: Session) -> GameState:
    """Get or create a GameState for a given state_id."""
    gs = db.query(GameState).filter(GameState.state_id == state_id).first()
    if gs:
        return gs

    seed = random.randint(1, 999999)
    map_data = generate_map(seed, state_name, str(state_id))

    gs = GameState(
        state_id=state_id,
        map_seed=seed,
        map_data=map_data,
        gold=5000,
        production=100,
        game_turn=0,
    )
    db.add(gs)
    db.flush()

    # Create capital city on the player's capital tile
    capital = map_data.get("player_capital", {"col": 5, "row": 5})
    grid = [[None for _ in range(CITY_GRID_SIZE)] for _ in range(CITY_GRID_SIZE)]
    grid[CITY_GRID_SIZE // 2][CITY_GRID_SIZE // 2] = {"type": "residential_mid", "built_at": 0}
    grid[CITY_GRID_SIZE // 2 - 1][CITY_GRID_SIZE // 2] = {"type": "commercial", "built_at": 0}
    grid[CITY_GRID_SIZE // 2][CITY_GRID_SIZE // 2 + 1] = {"type": "road", "built_at": 0}
    grid[CITY_GRID_SIZE // 2 + 1][CITY_GRID_SIZE // 2] = {"type": "power_plant_coal", "built_at": 0}

    capital_city = GameCity(
        game_state_id=gs.id,
        name=state_name,
        tile_col=capital["col"],
        tile_row=capital["row"],
        population=500000,
        is_capital=True,
        city_grid=grid,
        budget=1000000,
        happiness=55,
    )
    db.add(capital_city)

    # Create starting military units near capital
    for unit_type in ["warrior", "archer"]:
        unit_cfg = UNIT_TYPES[unit_type]
        unit = MilitaryUnit(
            game_state_id=gs.id,
            unit_type=unit_type,
            name=f"{unit_cfg['name']} I",
            tile_col=capital["col"] + random.randint(-1, 1),
            tile_row=capital["row"] + random.randint(-1, 1),
            health=100,
            moves_remaining=unit_cfg["moves"],
            experience=0,
            status="active",
        )
        db.add(unit)

    # Seed starting technologies
    for tech_id in ["agriculture", "writing", "bronze_working"]:
        tech = ResearchedTech(
            game_state_id=gs.id,
            tech_id=tech_id,
            progress=100,
            researched=True,
        )
        db.add(tech)

    # Create diplomacy relations with AI countries
    for ai_data in map_data.get("ai_countries", []):
        rel = DiplomacyRelation(
            game_state_id=gs.id,
            ai_country_id=ai_data["id"],
            ai_country_name=ai_data["name"],
            relation_score=ai_data.get("relations", {}).get("player", 50),
            status="neutral",
            trade_active=False,
        )
        db.add(rel)

    db.commit()
    db.refresh(gs)
    return gs


def _compute_city_stats(city: GameCity) -> dict:
    """Compute city stats from the grid."""
    grid = city.city_grid or []
    total_population = city.population
    happiness = city.happiness
    income = 0
    power_supply = 0
    power_demand = 0
    water_supply = 0
    water_demand = 0
    buildings_count = {}

    for row in grid:
        for cell in row:
            if not cell:
                continue
            btype = cell.get("type")
            if not btype or btype not in BUILDING_TYPES:
                continue
            cfg = BUILDING_TYPES[btype]
            buildings_count[btype] = buildings_count.get(btype, 0) + 1
            income += cfg.get("income", 0)
            happiness += cfg.get("happiness", 0)
            power_supply += cfg.get("power_supply", 0)
            power_demand += cfg.get("power_demand", 0)
            water_supply += cfg.get("water_supply", 0)
            water_demand += cfg.get("water_demand", 0)
            total_population += cfg.get("population_capacity", 0)

    return {
        "population": total_population,
        "happiness": min(100, max(0, happiness)),
        "income": income,
        "power_supply": power_supply,
        "power_demand": power_demand,
        "power_ok": power_supply >= power_demand,
        "water_supply": water_supply,
        "water_demand": water_demand,
        "water_ok": water_supply >= water_demand,
        "buildings": buildings_count,
    }


# ─────────────────────────────────────────────────────────── #
#  SCHEMAS                                                     #
# ─────────────────────────────────────────────────────────── #

class MoveUnitRequest(BaseModel):
    unit_id: int
    to_col: int
    to_row: int


class TrainUnitRequest(BaseModel):
    unit_type: str
    city_id: int


class BuildRequest(BaseModel):
    city_id: int
    row: int
    col: int
    building_type: str


class DemolishRequest(BaseModel):
    city_id: int
    row: int
    col: int


class ResearchRequest(BaseModel):
    tech_id: str


class DiplomacyRequest(BaseModel):
    ai_country_id: str
    action: str


class AttackRequest(BaseModel):
    unit_id: int
    target_col: int
    target_row: int


class EndTurnRequest(BaseModel):
    pass


# ─────────────────────────────────────────────────────────── #
#  ENDPOINTS                                                   #
# ─────────────────────────────────────────────────────────── #

@router.get("/{state_id}")
async def get_game_state(
    state_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)

    units = [
        {
            "id": u.id,
            "unit_type": u.unit_type,
            "name": u.name,
            "tile_col": u.tile_col,
            "tile_row": u.tile_row,
            "health": u.health,
            "moves_remaining": u.moves_remaining,
            "experience": u.experience,
            "status": u.status,
            **UNIT_TYPES.get(u.unit_type, {}),
        }
        for u in gs.military_units
    ]

    cities = []
    for c in gs.cities:
        stats = _compute_city_stats(c)
        cities.append({
            "id": c.id,
            "name": c.name,
            "tile_col": c.tile_col,
            "tile_row": c.tile_row,
            "population": stats["population"],
            "is_capital": c.is_capital,
            "happiness": stats["happiness"],
            "income": stats["income"],
            "budget": c.budget,
            "city_grid": c.city_grid,
            "power_ok": stats["power_ok"],
            "water_ok": stats["water_ok"],
        })

    researched = {t.tech_id: {"progress": t.progress, "researched": t.researched} for t in gs.researched_techs}
    diplomacy = [
        {
            "id": d.id,
            "ai_country_id": d.ai_country_id,
            "ai_country_name": d.ai_country_name,
            "relation_score": d.relation_score,
            "status": d.status,
            "trade_active": d.trade_active,
        }
        for d in gs.diplomacy
    ]

    return {
        "game_state_id": gs.id,
        "state_id": state_id,
        "state_name": state.name,
        "gold": gs.gold,
        "production": gs.production,
        "game_turn": gs.game_turn,
        "map_data": gs.map_data,
        "military_units": units,
        "cities": cities,
        "researched_techs": researched,
        "diplomacy": diplomacy,
        "config": {
            "unit_types": UNIT_TYPES,
            "technologies": TECHNOLOGIES,
            "building_types": BUILDING_TYPES,
        },
    }


@router.post("/{state_id}/unit/train")
async def train_unit(
    state_id: int,
    request: TrainUnitRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)

    if request.unit_type not in UNIT_TYPES:
        raise HTTPException(status_code=400, detail="Unknown unit type")

    unit_cfg = UNIT_TYPES[request.unit_type]
    cost = unit_cfg["cost"]

    if gs.gold < cost:
        raise HTTPException(status_code=400, detail=f"Not enough gold. Need {cost}, have {gs.gold}.")

    required_tech = unit_cfg.get("requires_tech")
    if required_tech:
        tech_record = next((t for t in gs.researched_techs if t.tech_id == required_tech and t.researched), None)
        if not tech_record:
            raise HTTPException(status_code=400, detail=f"Requires technology: {TECHNOLOGIES.get(required_tech, {}).get('name', required_tech)}")

    city = db.query(GameCity).filter(GameCity.id == request.city_id, GameCity.game_state_id == gs.id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")

    required_building = unit_cfg.get("requires_building")
    if required_building:
        has_building = False
        for row_cells in (city.city_grid or []):
            for cell in row_cells:
                if cell and cell.get("type") == required_building:
                    has_building = True
                    break
        if not has_building:
            bname = BUILDING_TYPES.get(required_building, {}).get("name", required_building)
            raise HTTPException(status_code=400, detail=f"Requires building: {bname}")

    gs.gold -= cost
    unit_number = len(gs.military_units) + 1
    unit = MilitaryUnit(
        game_state_id=gs.id,
        unit_type=request.unit_type,
        name=f"{unit_cfg['name']} {unit_number}",
        tile_col=city.tile_col,
        tile_row=city.tile_row,
        health=100,
        moves_remaining=unit_cfg["moves"],
        experience=0,
        status="active",
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)

    return {
        "unit": {
            "id": unit.id,
            "unit_type": unit.unit_type,
            "name": unit.name,
            "tile_col": unit.tile_col,
            "tile_row": unit.tile_row,
            "health": unit.health,
            "moves_remaining": unit.moves_remaining,
            **unit_cfg,
        },
        "gold": gs.gold,
    }


@router.post("/{state_id}/unit/move")
async def move_unit(
    state_id: int,
    request: MoveUnitRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)
    unit = db.query(MilitaryUnit).filter(MilitaryUnit.id == request.unit_id, MilitaryUnit.game_state_id == gs.id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    if unit.moves_remaining <= 0:
        raise HTTPException(status_code=400, detail="Unit has no moves remaining this turn")

    map_tiles = gs.map_data.get("tiles", [])
    map_rows = len(map_tiles)
    map_cols = len(map_tiles[0]) if map_rows > 0 else 0

    if not (0 <= request.to_row < map_rows and 0 <= request.to_col < map_cols):
        raise HTTPException(status_code=400, detail="Target position out of map bounds")

    target_tile = map_tiles[request.to_row][request.to_col]
    terrain = target_tile.get("terrain", "plains")
    unit_cfg = UNIT_TYPES.get(unit.unit_type, {})
    category = unit_cfg.get("category", "land")

    from model.game_config import TERRAIN_TYPES
    terrain_cfg = TERRAIN_TYPES.get(terrain, {})
    if category == "land" and not terrain_cfg.get("passable_land", True):
        raise HTTPException(status_code=400, detail=f"Land units cannot enter {terrain} terrain")
    if category == "naval" and not terrain_cfg.get("passable_naval", False):
        raise HTTPException(status_code=400, detail=f"Naval units can only move in water")

    unit.tile_col = request.to_col
    unit.tile_row = request.to_row
    unit.moves_remaining = max(0, unit.moves_remaining - 1)
    db.commit()

    return {"unit_id": unit.id, "tile_col": unit.tile_col, "tile_row": unit.tile_row, "moves_remaining": unit.moves_remaining}


@router.post("/{state_id}/unit/attack")
async def attack_unit(
    state_id: int,
    request: AttackRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)
    unit = db.query(MilitaryUnit).filter(MilitaryUnit.id == request.unit_id, MilitaryUnit.game_state_id == gs.id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    if unit.moves_remaining <= 0:
        raise HTTPException(status_code=400, detail="Unit cannot attack — no moves remaining")

    attacker_cfg = UNIT_TYPES.get(unit.unit_type, {})
    attack_power = attacker_cfg.get("attack", 5)

    rng = random.Random()
    damage_dealt = int(attack_power * rng.uniform(0.7, 1.3))
    damage_taken = int(attacker_cfg.get("defense", 3) * rng.uniform(0.3, 0.7))

    unit.health = max(0, unit.health - damage_taken)
    unit.moves_remaining = 0
    unit.experience = min(100, unit.experience + 5)

    if unit.health <= 0:
        unit.status = "destroyed"

    db.commit()

    return {
        "attacker_id": unit.id,
        "attacker_health": unit.health,
        "attacker_status": unit.status,
        "damage_dealt": damage_dealt,
        "damage_taken": damage_taken,
        "message": f"Your {unit.name} attacked at ({request.target_col}, {request.target_row}), dealing {damage_dealt} damage and taking {damage_taken}.",
    }


@router.delete("/{state_id}/unit/{unit_id}")
async def disband_unit(
    state_id: int,
    unit_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)
    unit = db.query(MilitaryUnit).filter(MilitaryUnit.id == unit_id, MilitaryUnit.game_state_id == gs.id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    db.delete(unit)
    db.commit()
    return {"success": True}


@router.post("/{state_id}/city/build")
async def build_in_city(
    state_id: int,
    request: BuildRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)
    city = db.query(GameCity).filter(GameCity.id == request.city_id, GameCity.game_state_id == gs.id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")

    if request.building_type not in BUILDING_TYPES:
        raise HTTPException(status_code=400, detail="Unknown building type")

    btype_cfg = BUILDING_TYPES[request.building_type]
    cost = btype_cfg["cost"]

    required_tech = btype_cfg.get("requires_tech")
    if required_tech:
        tech_record = next((t for t in gs.researched_techs if t.tech_id == required_tech and t.researched), None)
        if not tech_record:
            raise HTTPException(status_code=400, detail=f"Requires technology: {TECHNOLOGIES.get(required_tech, {}).get('name', required_tech)}")

    if gs.gold < cost:
        raise HTTPException(status_code=400, detail=f"Not enough gold. Need {cost}, have {gs.gold}.")

    if not (0 <= request.row < CITY_GRID_SIZE and 0 <= request.col < CITY_GRID_SIZE):
        raise HTTPException(status_code=400, detail="Invalid grid position")

    grid = [list(row) for row in (city.city_grid or [[None] * CITY_GRID_SIZE for _ in range(CITY_GRID_SIZE)])]

    if len(grid) < CITY_GRID_SIZE:
        while len(grid) < CITY_GRID_SIZE:
            grid.append([None] * CITY_GRID_SIZE)

    for r in range(len(grid)):
        if len(grid[r]) < CITY_GRID_SIZE:
            grid[r] = list(grid[r]) + [None] * (CITY_GRID_SIZE - len(grid[r]))

    if grid[request.row][request.col] is not None:
        raise HTTPException(status_code=400, detail="Cell is already occupied")

    gs.gold -= cost
    grid[request.row][request.col] = {"type": request.building_type, "built_at": gs.game_turn}
    city.city_grid = grid

    stats = _compute_city_stats(city)
    city.population = stats["population"]
    city.happiness = stats["happiness"]

    db.commit()

    return {
        "success": True,
        "gold": gs.gold,
        "city_stats": stats,
        "cell": {"row": request.row, "col": request.col, "type": request.building_type},
    }


@router.post("/{state_id}/city/demolish")
async def demolish_in_city(
    state_id: int,
    request: DemolishRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)
    city = db.query(GameCity).filter(GameCity.id == request.city_id, GameCity.game_state_id == gs.id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")

    grid = [list(row) for row in (city.city_grid or [])]
    if not (0 <= request.row < len(grid) and 0 <= request.col < len(grid[0])):
        raise HTTPException(status_code=400, detail="Invalid grid position")

    removed = grid[request.row][request.col]
    grid[request.row][request.col] = None
    city.city_grid = grid

    if removed:
        btype_cfg = BUILDING_TYPES.get(removed.get("type", ""), {})
        gs.gold += btype_cfg.get("cost", 0) // 4

    stats = _compute_city_stats(city)
    city.population = stats["population"]
    city.happiness = stats["happiness"]
    db.commit()

    return {"success": True, "gold": gs.gold, "city_stats": stats}


@router.post("/{state_id}/research")
async def research_tech(
    state_id: int,
    request: ResearchRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)

    if request.tech_id not in TECHNOLOGIES:
        raise HTTPException(status_code=400, detail="Unknown technology")

    tech_cfg = TECHNOLOGIES[request.tech_id]
    cost = tech_cfg["cost"]

    already = next((t for t in gs.researched_techs if t.tech_id == request.tech_id), None)
    if already and already.researched:
        raise HTTPException(status_code=400, detail="Technology already researched")

    for req_id in tech_cfg.get("requires", []):
        prereq = next((t for t in gs.researched_techs if t.tech_id == req_id and t.researched), None)
        if not prereq:
            raise HTTPException(status_code=400, detail=f"Requires: {TECHNOLOGIES[req_id]['name']}")

    if gs.gold < cost:
        raise HTTPException(status_code=400, detail=f"Not enough gold. Need {cost}, have {gs.gold}.")

    gs.gold -= cost
    if already:
        already.researched = True
        already.progress = 100
    else:
        new_tech = ResearchedTech(
            game_state_id=gs.id,
            tech_id=request.tech_id,
            progress=100,
            researched=True,
        )
        db.add(new_tech)

    db.commit()
    return {
        "success": True,
        "tech_id": request.tech_id,
        "tech_name": tech_cfg["name"],
        "gold": gs.gold,
        "unlocks_units": tech_cfg.get("unlocks_units", []),
        "unlocks_buildings": tech_cfg.get("unlocks_buildings", []),
    }


@router.post("/{state_id}/diplomacy")
async def diplomacy_action(
    state_id: int,
    request: DiplomacyRequest,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)
    rel = db.query(DiplomacyRelation).filter(
        DiplomacyRelation.game_state_id == gs.id,
        DiplomacyRelation.ai_country_id == request.ai_country_id,
    ).first()
    if not rel:
        raise HTTPException(status_code=404, detail="Country not found")

    message = ""
    if request.action == "gift":
        cost = 200
        if gs.gold < cost:
            raise HTTPException(status_code=400, detail="Not enough gold for gift")
        gs.gold -= cost
        rel.relation_score = min(100, rel.relation_score + 15)
        message = f"Gift of gold sent to {rel.ai_country_name}. Relations improved."
    elif request.action == "trade":
        if rel.trade_active:
            rel.trade_active = False
            message = f"Trade agreement with {rel.ai_country_name} cancelled."
        else:
            if rel.relation_score < 40:
                raise HTTPException(status_code=400, detail="Relations too low for trade agreement")
            rel.trade_active = True
            message = f"Trade agreement established with {rel.ai_country_name}!"
    elif request.action == "denounce":
        rel.relation_score = max(0, rel.relation_score - 20)
        rel.status = "hostile" if rel.relation_score < 30 else "cold"
        rel.trade_active = False
        message = f"You denounced {rel.ai_country_name}. Relations deteriorated."
    elif request.action == "alliance":
        if rel.relation_score < 70:
            raise HTTPException(status_code=400, detail="Relations too low for alliance")
        rel.status = "allied"
        message = f"Alliance formed with {rel.ai_country_name}!"
    else:
        raise HTTPException(status_code=400, detail="Unknown diplomacy action")

    if rel.relation_score >= 70:
        rel.status = "friendly" if rel.status not in ("allied",) else rel.status
    elif rel.relation_score >= 40:
        rel.status = "neutral" if rel.status not in ("allied",) else rel.status
    elif rel.relation_score >= 20:
        rel.status = "cold" if rel.status not in ("hostile",) else rel.status
    else:
        rel.status = "hostile"

    db.commit()
    return {
        "success": True,
        "ai_country_id": rel.ai_country_id,
        "ai_country_name": rel.ai_country_name,
        "relation_score": rel.relation_score,
        "status": rel.status,
        "trade_active": rel.trade_active,
        "message": message,
        "gold": gs.gold,
    }


@router.post("/{state_id}/end-turn")
async def end_turn(
    state_id: int,
    current_user: User = Depends(get_current_user_from_token),
    db: Session = Depends(get_db),
):
    state = db.query(State).filter(State.id == state_id, State.user_id == current_user.id).first()
    if not state:
        raise HTTPException(status_code=404, detail="State not found")

    gs = _get_or_create_game_state(state_id, state.name, db)
    gs.game_turn += 1

    city_income = 0
    for city in gs.cities:
        stats = _compute_city_stats(city)
        city_income += stats["income"]
        city.population = max(1000, int(city.population * (1 + (stats["happiness"] - 50) / 2000)))
        city.budget += stats["income"]

    trade_income = sum(50 for d in gs.diplomacy if d.trade_active)
    gs.gold += city_income + gs.production + trade_income

    for unit in gs.military_units:
        unit_cfg = UNIT_TYPES.get(unit.unit_type, {})
        unit.moves_remaining = unit_cfg.get("moves", 1)
        if unit.health < 100:
            unit.health = min(100, unit.health + 10)

    for rel in gs.diplomacy:
        drift = random.randint(-2, 2)
        rel.relation_score = max(0, min(100, rel.relation_score + drift))

    db.commit()

    return {
        "game_turn": gs.game_turn,
        "gold": gs.gold,
        "income_this_turn": city_income + gs.production + trade_income,
        "city_income": city_income,
        "trade_income": trade_income,
        "production_income": gs.production,
    }
