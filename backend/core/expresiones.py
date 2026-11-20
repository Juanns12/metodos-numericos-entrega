"""Conversión segura de expresiones de texto (sintaxis tipo math.js) a funciones de Python."""
import math
import re

import sympy as sp
from sympy.parsing.sympy_parser import (
    convert_xor,
    parse_expr,
    standard_transformations,
)

x_sym, y_sym = sp.symbols("x y")

_PERMITIDOS = re.compile(r"^[0-9a-zA-Z_+\-*/^().,\s]*$")

_LOCALES = {
    "x": x_sym,
    "y": y_sym,
    "e": sp.E,
    "E": sp.E,
    "pi": sp.pi,
    "PI": sp.pi,
    "exp": sp.exp,
    "log": sp.log,       # logaritmo natural (igual que en math.js)
    "ln": sp.log,
    "log10": lambda v: sp.log(v, 10),
    "sqrt": sp.sqrt,
    "abs": sp.Abs,
    "sin": sp.sin, "cos": sp.cos, "tan": sp.tan,
    "asin": sp.asin, "acos": sp.acos, "atan": sp.atan,
    "sinh": sp.sinh, "cosh": sp.cosh, "tanh": sp.tanh,
}

_TRANSFORMACIONES = standard_transformations + (convert_xor,)


class ErrorExpresion(ValueError):
    pass


def parsear(texto: str, variables=("x",)) -> sp.Expr:
    """Convierte el texto en una expresión simbólica de SymPy validando caracteres y variables."""
    if not texto or not texto.strip():
        raise ErrorExpresion("Debe proporcionar una expresión matemática válida.")
    texto = texto.strip()
    if not _PERMITIDOS.match(texto) or "__" in texto:
        raise ErrorExpresion(f"La expresión '{texto}' contiene caracteres no permitidos.")
    try:
        expr = parse_expr(texto, local_dict=dict(_LOCALES), transformations=_TRANSFORMACIONES)
    except Exception as exc:  # noqa: BLE001
        raise ErrorExpresion(f"Sintaxis no válida en '{texto}': {exc}") from exc
    if not isinstance(expr, sp.Expr):
        raise ErrorExpresion(f"La expresión '{texto}' no es una expresión matemática.")
    permitidas = {sp.Symbol(v) for v in variables}
    extra = expr.free_symbols - permitidas
    if extra:
        nombres = ", ".join(sorted(str(s) for s in extra))
        raise ErrorExpresion(f"Variables no reconocidas en '{texto}': {nombres}.")
    return expr


def _envolver(fn_lambdify):
    def evaluar(*args):
        try:
            valor = fn_lambdify(*args)
            if isinstance(valor, complex):
                return math.nan
            return float(valor)
        except (ValueError, ZeroDivisionError, OverflowError, TypeError):
            return math.nan
    return evaluar


def funcion_1d(texto: str):
    expr = parsear(texto, ("x",))
    return _envolver(sp.lambdify(x_sym, expr, modules="math"))


def funcion_2d(texto: str):
    expr = parsear(texto, ("x", "y"))
    return _envolver(sp.lambdify((x_sym, y_sym), expr, modules="math"))


def derivada_simbolica(texto: str) -> str:
    """Devuelve f'(x) como texto (sintaxis con ^ para potencias)."""
    expr = parsear(texto, ("x",))
    return str(sp.diff(expr, x_sym)).replace("**", "^")
