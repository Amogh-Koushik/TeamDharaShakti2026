"""
Phase 3 - Gas Trend Forecasting  (simulated multi-gas sensor)
AI Analysis Engine, Underground Mine Rescue Rover

Simulates a live CO / methane / oxygen readout drifting near a safe baseline.
On a manual trigger (SPACE or the on-screen button) a hazard starts developing:
CO and methane climb, oxygen falls. For each gas the script computes a smoothed
value and a rate-of-change, and PROJECTS FORWARD to estimate how long until the
safety threshold is crossed - not just whether it already has been.

No dataset - this script generates the stream itself.

Run it:
    python -m phase3_gas_forecast.gas_forecaster

Keys (window focused):
    SPACE / d   trigger the gas event
    r           reset to a calm baseline
    [ / ]       make the developing hazard slower / faster
    q           quit

Headless self-test (no window):
    python -m phase3_gas_forecast.gas_forecaster --headless 45

Tuning: phase3_gas_forecast/config.py
"""

from __future__ import annotations

import argparse
import time
from collections import deque

import numpy as np

from . import config as C


# --------------------------------------------------------------------------
# Core model - no display code in here, so it can be tested headless
# --------------------------------------------------------------------------
class GasChannel:
    def __init__(self, key: str, spec: dict):
        self.key = key
        self.label = spec["label"]
        self.unit = spec["unit"]
        self.color = spec["color"]
        self.baseline = float(spec["baseline"])
        self.noise = float(spec["noise"])
        self.threshold = float(spec["threshold"])
        self.direction = spec["direction"]          # "above" | "below"
        self.y_range = spec["y_range"]
        self.hazard_rate = float(spec["hazard_rate"])
        self.min_slope = C.MIN_SLOPE_FOR_ETA[key]

        self.drift = 0.0
        self.value = self.baseline
        self._t = deque()
        self._v = deque()

    # -- simulation --
    def step(self, t: float, dt: float, armed: bool, mult: float, rng: np.random.Generator):
        if armed:
            self.drift += self.hazard_rate * mult * dt
        self.value = self.baseline + self.drift + rng.normal(0.0, self.noise)
        self._t.append(t)
        self._v.append(self.value)
        cutoff = t - C.HISTORY_SECONDS - 2
        while self._t and self._t[0] < cutoff:
            self._t.popleft()
            self._v.popleft()

    def reset(self):
        self.drift = 0.0
        self.value = self.baseline
        self._t.clear()
        self._v.clear()

    # -- history views --
    @property
    def history(self) -> tuple[np.ndarray, np.ndarray]:
        return np.fromiter(self._t, float), np.fromiter(self._v, float)

    def _window(self, seconds: float):
        if not self._t:
            return np.array([]), np.array([])
        t = np.fromiter(self._t, float)
        v = np.fromiter(self._v, float)
        m = t >= (t[-1] - seconds)
        return t[m], v[m]

    def moving_avg(self) -> float:
        _, v = self._window(C.MOVING_AVG_SECONDS)
        return float(v.mean()) if v.size else self.value

    def slope_per_s(self) -> float:
        """Least-squares rate of change over the recent window (unit/second)."""
        t, v = self._window(C.SLOPE_FIT_SECONDS)
        # need a real span of history before trusting a slope, else baseline
        # noise produces a spurious trend and a phantom ETA
        if t.size < 15 or (t[-1] - t[0]) < min(3.5, C.SLOPE_FIT_SECONDS * 0.6):
            return 0.0
        a, _ = np.polyfit(t - t[0], v, 1)
        return float(a)

    # -- forecasting --
    def approaching(self) -> bool:
        s = self.slope_per_s()
        if self.direction == "above":
            return s > self.min_slope and self.moving_avg() < self.threshold
        return s < -self.min_slope and self.moving_avg() > self.threshold

    def crossed(self) -> bool:
        ma = self.moving_avg()
        return ma >= self.threshold if self.direction == "above" else ma <= self.threshold

    def eta_seconds(self) -> float | None:
        if self.crossed() or not self.approaching():
            return None
        eta = (self.threshold - self.moving_avg()) / self.slope_per_s()
        return eta if eta > 0 else None

    def status(self) -> str:
        if self.crossed():
            return "THRESHOLD CROSSED"
        if self.approaching():
            return "RISING" if self.direction == "above" else "FALLING"
        return "SAFE"


class GasSim:
    def __init__(self, seed: int = 0):
        self.rng = np.random.default_rng(seed)
        self.channels: dict[str, GasChannel] = {
            k: GasChannel(k, s) for k, s in C.GASES.items()
        }
        self.t = 0.0
        self.armed = False
        self.mult = C.HAZARD_MULTIPLIER
        self.armed_at: float | None = None

    def tick(self, dt: float = C.TICK_SECONDS):
        self.t += dt
        for ch in self.channels.values():
            ch.step(self.t, dt, self.armed, self.mult, self.rng)

    def trigger(self):
        if not self.armed:
            self.armed = True
            self.armed_at = self.t

    def reset(self):
        self.armed = False
        self.armed_at = None
        self.mult = C.HAZARD_MULTIPLIER
        self.t = 0.0
        for ch in self.channels.values():
            ch.reset()

    def scale(self, factor: float):
        self.mult = float(np.clip(self.mult * factor, 0.1, 8.0))

    def overall_status(self) -> str:
        if any(ch.crossed() for ch in self.channels.values()):
            return "THRESHOLD CROSSED"
        if any(ch.approaching() for ch in self.channels.values()):
            return "HAZARD DEVELOPING"
        return "MONITORING - ALL SAFE"


def _fmt_eta(sec: float | None) -> str:
    if sec is None:
        return "--:--"
    if sec > 599:
        return ">10:00"
    return f"{int(sec) // 60:02d}:{int(sec) % 60:02d}"


# --------------------------------------------------------------------------
# Headless self-test
# --------------------------------------------------------------------------
def run_headless(seconds: float) -> int:
    sim = GasSim(seed=1)
    trigger_at = 3.0
    next_report = 1.0
    print(f"headless run: baseline for {trigger_at:.0f}s, then trigger, total {seconds:.0f}s")
    print(f"{'t':>5} | " + " | ".join(
        f"{k}: val  slope   eta   status" for k in sim.channels))
    while sim.t < seconds:
        sim.tick()
        if not sim.armed and sim.t >= trigger_at:
            sim.trigger()
            print(f"--- gas event triggered at t={sim.t:.1f}s ---")
        if sim.t >= next_report:
            next_report += 1.0
            parts = []
            for ch in sim.channels.values():
                parts.append(f"{ch.key}:{ch.moving_avg():6.2f} {ch.slope_per_s():+.3f} "
                             f"{_fmt_eta(ch.eta_seconds()):>6} {ch.status():<16}")
            print(f"{sim.t:5.1f} | " + " | ".join(parts))
    print(f"\nfinal overall status: {sim.overall_status()}")
    return 0


# --------------------------------------------------------------------------
# Live chart
# --------------------------------------------------------------------------
def _build_dashboard(sim: "GasSim", plt):
    """Build the figure and return (fig, gridspec, update_fn). update_fn advances
    the sim one tick and redraws; it is shared by the live view and --snapshot."""
    from matplotlib.gridspec import GridSpec

    plt.style.use("dark_background")

    fig = plt.figure(figsize=(13, 7.5))
    try:
        fig.canvas.manager.set_window_title(C.WINDOW_TITLE)
    except Exception:
        pass
    gs = GridSpec(4, 3, figure=fig, height_ratios=[1, 1, 1, 0.28],
                  width_ratios=[3, 3, 1.15], hspace=0.45, wspace=0.25,
                  left=0.07, right=0.975, top=0.9, bottom=0.09)

    keys = list(sim.channels)
    axes, lines, proj_lines, dots, readouts = {}, {}, {}, {}, {}

    for i, k in enumerate(keys):
        ch = sim.channels[k]
        ax = fig.add_subplot(gs[i, 0:2])
        axes[k] = ax
        ax.set_ylim(*ch.y_range)
        ax.set_xlim(0, C.HISTORY_SECONDS)
        ax.set_ylabel(f"{ch.key}\n{ch.unit}", rotation=0, ha="right", va="center",
                      labelpad=22, fontsize=11)
        ax.grid(alpha=0.15)
        ax.axhline(ch.threshold, color="#ff3b3b", ls="--", lw=1.6)
        y0, y1 = ch.y_range
        if ch.direction == "above":
            ax.axhspan(ch.threshold, y1, color="#ff3b3b", alpha=0.08)
        else:
            ax.axhspan(y0, ch.threshold, color="#ff3b3b", alpha=0.08)
        ax.text(0.4, ch.threshold, f" threshold {ch.threshold:g} {ch.unit}",
                color="#ff8080", fontsize=8, va="bottom")
        (lines[k],) = ax.plot([], [], color=ch.color, lw=2)
        (proj_lines[k],) = ax.plot([], [], color=ch.color, lw=1.4, ls=":", alpha=0.9)
        (dots[k],) = ax.plot([], [], "o", color=ch.color, ms=7)
        if i == len(keys) - 1:
            ax.set_xlabel("seconds")

        rax = fig.add_subplot(gs[i, 2])
        rax.axis("off")
        readouts[k] = rax.text(0.5, 0.5, "", ha="center", va="center",
                               fontsize=13, family="monospace",
                               transform=rax.transAxes)

    title = fig.text(0.5, 0.955, "", ha="center", fontsize=16, weight="bold")
    fig.text(0.5, 0.018, C.SIM_CAPTION, ha="center", fontsize=8, color="#9aa0a6")
    hint = fig.text(0.075, 0.955, "", ha="left", fontsize=9, color="#9aa0a6")

    def update(_frame):
        sim.tick()
        t = sim.t
        x0 = max(0.0, t - C.HISTORY_SECONDS)

        for k in keys:
            ch = sim.channels[k]
            ax = axes[k]
            th, tv = ch.history
            lines[k].set_data(th, tv)
            ax.set_xlim(x0, max(C.HISTORY_SECONDS, t))

            ma = ch.moving_avg()
            dots[k].set_data([t], [ma])

            eta = ch.eta_seconds()
            if eta is not None:
                proj_lines[k].set_data([t, t + eta], [ma, ch.threshold])
            else:
                proj_lines[k].set_data([], [])

            crossed = ch.crossed()
            st = ch.status()
            col = "#ff5555" if crossed else ("#ffcc55" if eta is not None else "#8affc1")
            arrow = "" if st in ("SAFE", "THRESHOLD CROSSED") else (
                "  ^" if ch.direction == "above" else "  v")
            readouts[k].set_text(
                f"{ch.key:>3}  {ma:6.2f} {ch.unit}\n"
                f"{st}{arrow}\n"
                f"rate {ch.slope_per_s():+.3f}/s\n"
                f"T- {_fmt_eta(eta)}"
            )
            readouts[k].set_color(col)

        ov = sim.overall_status()
        title.set_text(ov)
        title.set_color("#ff5555" if "CROSSED" in ov else
                        ("#ffcc55" if "DEVELOPING" in ov else "#8affc1"))
        hint.set_text(f"hazard speed x{sim.mult:.1f}   ( [ slower  /  ] faster )   "
                      f"{'ARMED' if sim.armed else 'calm baseline'}")
        return ()

    return fig, gs, update


def run_gui() -> int:
    import matplotlib

    try:
        matplotlib.use("TkAgg")
    except Exception:
        pass
    import matplotlib.pyplot as plt
    from matplotlib.animation import FuncAnimation
    from matplotlib.widgets import Button

    sim = GasSim(seed=int(time.time()) % 10_000)
    fig, gs, update = _build_dashboard(sim, plt)

    bax1 = fig.add_subplot(gs[3, 0])
    bax2 = fig.add_subplot(gs[3, 1])
    btn_trig = Button(bax1, "TRIGGER GAS EVENT  (SPACE)", color="#8a1c1c", hovercolor="#b22222")
    btn_reset = Button(bax2, "RESET  (r)", color="#333333", hovercolor="#555555")
    btn_trig.on_clicked(lambda _evt: sim.trigger())
    btn_reset.on_clicked(lambda _evt: sim.reset())

    def on_key(evt):
        if evt.key in (" ", "d"):
            sim.trigger()
        elif evt.key == "r":
            sim.reset()
        elif evt.key == "]":
            sim.scale(1.3)
        elif evt.key == "[":
            sim.scale(1 / 1.3)
        elif evt.key == "q":
            plt.close(fig)

    fig.canvas.mpl_connect("key_press_event", on_key)

    ani = FuncAnimation(fig, update, interval=C.REDRAW_MS, blit=False, cache_frame_data=False)
    fig._ani = ani  # keep a reference alive
    fig._buttons = (btn_trig, btn_reset)
    plt.show()
    return 0


def run_snapshot(path: str, at: float, trigger_at: float) -> int:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    sim = GasSim(seed=1)
    fig, _gs, update = _build_dashboard(sim, plt)
    n = max(1, int(at / C.TICK_SECONDS))
    trig_tick = int(trigger_at / C.TICK_SECONDS)
    for i in range(n):
        if i == trig_tick:
            sim.trigger()
        update(i)
    fig.savefig(path, dpi=110, facecolor=fig.get_facecolor())
    print(f"snapshot written: {path}  (t={sim.t:.0f}s, triggered at {trigger_at:.0f}s, "
          f"status: {sim.overall_status()})")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Phase 3 - gas trend forecasting (simulated)")
    ap.add_argument("--headless", type=float, metavar="SECONDS", default=None,
                    help="run without a window for N simulated seconds and print a table")
    ap.add_argument("--snapshot", metavar="PATH", default=None,
                    help="render one dashboard frame to an image file and exit")
    ap.add_argument("--at", type=float, default=34.0, help="snapshot: sim time to render")
    ap.add_argument("--trigger-at", type=float, default=4.0,
                    help="snapshot: sim time the gas event fires")
    args = ap.parse_args(argv)
    if args.headless is not None:
        return run_headless(args.headless)
    if args.snapshot is not None:
        return run_snapshot(args.snapshot, args.at, args.trigger_at)
    return run_gui()


if __name__ == "__main__":
    raise SystemExit(main())
