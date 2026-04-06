from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config import CREDITS_DEFAULT
from db.database import Base


class TimestampMixin:
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    credits = Column(Integer, nullable=False, default=CREDITS_DEFAULT)
    states = relationship("State", back_populates="user")


class State(TimestampMixin, Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    flag_svg = Column(String, nullable=False)
    description = Column(String, nullable=False)
    turn_in_progress = Column(Boolean, nullable=False, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="states")
    snapshots = relationship("StateSnapshot", back_populates="state")
    game_state = relationship("GameState", back_populates="state", uselist=False)


class StateSnapshot(TimestampMixin, Base):
    __tablename__ = "state_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=False)

    markdown_state = Column(String, nullable=False)
    markdown_future_events = Column(String, nullable=False)
    markdown_future_events_policy = Column(String, nullable=False)
    markdown_delta = Column(String, nullable=True)
    markdown_delta_report = Column(String, nullable=True)

    state = relationship("State", back_populates="snapshots")


class GameState(TimestampMixin, Base):
    """Extended game state — world map, resources, turn counter."""
    __tablename__ = "game_states"

    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey("states.id"), unique=True, nullable=False)
    map_seed = Column(Integer, nullable=False, default=0)
    map_data = Column(JSON, nullable=False, default=dict)
    game_turn = Column(Integer, nullable=False, default=0)
    gold = Column(Integer, nullable=False, default=5000)
    production = Column(Integer, nullable=False, default=100)

    state = relationship("State", back_populates="game_state")
    military_units = relationship("MilitaryUnit", back_populates="game_state", cascade="all, delete-orphan")
    cities = relationship("GameCity", back_populates="game_state", cascade="all, delete-orphan")
    researched_techs = relationship("ResearchedTech", back_populates="game_state", cascade="all, delete-orphan")
    diplomacy = relationship("DiplomacyRelation", back_populates="game_state", cascade="all, delete-orphan")


class MilitaryUnit(TimestampMixin, Base):
    """A military unit on the world map."""
    __tablename__ = "military_units"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"), nullable=False)
    unit_type = Column(String, nullable=False)
    name = Column(String, nullable=True)
    tile_col = Column(Integer, nullable=False, default=0)
    tile_row = Column(Integer, nullable=False, default=0)
    health = Column(Integer, nullable=False, default=100)
    moves_remaining = Column(Integer, nullable=False, default=1)
    experience = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="active")

    game_state = relationship("GameState", back_populates="military_units")


class GameCity(TimestampMixin, Base):
    """A city managed by the player (city builder)."""
    __tablename__ = "game_cities"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"), nullable=False)
    name = Column(String, nullable=False)
    tile_col = Column(Integer, nullable=False)
    tile_row = Column(Integer, nullable=False)
    population = Column(Integer, nullable=False, default=10000)
    is_capital = Column(Boolean, nullable=False, default=False)
    city_grid = Column(JSON, nullable=False, default=list)
    budget = Column(Integer, nullable=False, default=500000)
    happiness = Column(Integer, nullable=False, default=50)

    game_state = relationship("GameState", back_populates="cities")


class ResearchedTech(TimestampMixin, Base):
    """Technology researched by a game state."""
    __tablename__ = "researched_techs"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"), nullable=False)
    tech_id = Column(String, nullable=False)
    progress = Column(Integer, nullable=False, default=0)
    researched = Column(Boolean, nullable=False, default=False)

    game_state = relationship("GameState", back_populates="researched_techs")


class DiplomacyRelation(TimestampMixin, Base):
    """Diplomatic relations between player and AI countries."""
    __tablename__ = "diplomacy_relations"

    id = Column(Integer, primary_key=True, index=True)
    game_state_id = Column(Integer, ForeignKey("game_states.id"), nullable=False)
    ai_country_id = Column(String, nullable=False)
    ai_country_name = Column(String, nullable=False)
    relation_score = Column(Integer, nullable=False, default=50)
    status = Column(String, nullable=False, default="neutral")
    trade_active = Column(Boolean, nullable=False, default=False)

    game_state = relationship("GameState", back_populates="diplomacy")
