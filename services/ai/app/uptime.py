import time

_started = time.monotonic()


def uptime_seconds() -> int:
    return round(time.monotonic() - _started)
