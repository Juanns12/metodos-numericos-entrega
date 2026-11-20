"""Modelo compartido para listas de puntos (x, y)."""
from pydantic import BaseModel


class Punto(BaseModel):
    x: float
    y: float
