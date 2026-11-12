"""La data e l'ora della compilazione del sito, ora italiana, per la striscia in basso (utente, 2026-11-12)."""
from datetime import datetime, timezone


def on_config(config, **kwargs):
    adesso = datetime.now(timezone.utc)
    try:
        from zoneinfo import ZoneInfo
        adesso = adesso.astimezone(ZoneInfo("Europe/Rome"))
        zona = ""
    except Exception:  # senza la base dei fusi orari: l'ora UTC, detta
        zona = " UTC"
    config.extra["aggiornato"] = adesso.strftime("%d/%m/%Y %H:%M") + zona
    return config
