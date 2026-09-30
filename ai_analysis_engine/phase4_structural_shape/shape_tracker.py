r"""
Phase 4 - Structural Shape-Tracking  (simulated LiDAR cross-section comparison)
AI Analysis Engine, Underground Mine Rescue Rover

Recreates the "tunnel cross-section, before vs after" idea from the architecture
document (T1 vs T2). It generates a baseline outline (T1), generates a later
outline (T2) with one region pushed inward - roof sag, wall narrowing, floor
heave - compares the two along matching angular positions, and flags + highlights
any section where the inward movement exceeds a safety threshold.

No dataset - both scans are generated here.

Run it:
    python -m phase4_structural_shape.shape_tracker

Keys (window focused):
    SPACE / r   new later scan (T2) - fresh random comparison
    s           force a clear roof sag (guaranteed flag, for the demo)
    [ / ]       decrease / increase the deformation depth
    w           toggle the deviation "whiskers"
    q           quit

Headless checks (no window):
    python -m phase4_structural_shape.shape_tracker --headless 8
    python -m phase4_structural_shape.shape_tracker --snapshot assets\p4.png

Tuning: phase4_structural_shape/config.py
"""

from __future__ import annotations

import argparse

import numpy as np

from . import config as C


# --------------------------------------------------------------------------
# Geometry helpers
# --------------------------------------------------------------------------
def _ang_diff(a: np.ndarray, b: float) -> np.ndarray:
    """Smallest signed angle a - b, wrapped to (-pi, pi]."""
    return np.angle(np.exp(1j * (a - b)))


def _circular_smooth(x: np.ndarray, window: int) -> np.ndarray:
    if window <= 1:
        return x
    k = int(window)
    pad = np.concatenate([x[-k:], x, x[:k]])
    kern = np.ones(k) / k
    sm = np.convolve(pad, kern, mode="same")
    return sm[k:-k]


def _densify(poly: np.ndarray, n: int) -> np.ndarray:
    """Resample a polygon's perimeter to ~n evenly spaced points."""
    seg = np.diff(poly, axis=0, append=poly[:1])
    seglen = np.hypot(seg[:, 0], seg[:, 1])
    cum = np.concatenate([[0], np.cumsum(seglen)])
    total = cum[-1]
    s = np.linspace(0, total, n, endpoint=False)
    x = np.interp(s, cum, np.append(poly[:, 0], poly[0, 0]))
    y = np.interp(s, cum, np.append(poly[:, 1], poly[0, 1]))
    return np.column_stack([x, y])


def _contiguous_runs(mask: np.ndarray) -> list[np.ndarray]:
    """Index runs where mask is True, merging a run that wraps 0 <-> end."""
    n = mask.size
    if not mask.any():
        return []
    idx = np.where(mask)[0]
    splits = np.where(np.diff(idx) > 1)[0] + 1
    runs = [r for r in np.split(idx, splits) if r.size]
    if len(runs) > 1 and runs[0][0] == 0 and runs[-1][-1] == n - 1:
        runs[0] = np.concatenate([runs[-1], runs[0]])
        runs.pop()
    return runs


# --------------------------------------------------------------------------
# Model
# --------------------------------------------------------------------------
class TunnelComparison:
    def __init__(self, seed: int | None = None):
        self.rng = np.random.default_rng(seed)
        self.theta = np.linspace(0.0, 2 * np.pi, C.N_POINTS, endpoint=False)
        self.r1_nominal = self._baseline_shape()
        self.depth_scale = C.DEPTH_SCALE
        self.show_whiskers = C.SHOW_WHISKERS
        self.regenerate()

    # -- the T1 tunnel outline: a horseshoe drift cross-section --
    #    vertical walls, arched roof, flat floor -> expressed as r(theta)
    #    about the section centroid so T1/T2 compare at matching angles.
    def _baseline_shape(self) -> np.ndarray:
        w = C.BASE_RADIUS                       # half-width of the drift
        y_floor = -0.95 * w
        y_spring = 0.38 * w                     # where walls meet the arch
        y_crown = (1.0 + C.ROOF_RISE) * w * 1.15
        t = np.linspace(0.0, np.pi, 240)
        arch = np.column_stack([w * np.cos(t), y_spring + (y_crown - y_spring) * np.sin(t)])
        poly = np.vstack([
            [[-w, y_spring]],
            [[-w, y_floor]],
            [[w, y_floor]],
            [[w, y_spring]],
            arch,                              # (w, y_spring) over the top to (-w, y_spring)
        ])
        per = _densify(poly, 3000)
        per -= per.mean(axis=0)                # centre on the centroid
        ang = np.mod(np.arctan2(per[:, 1], per[:, 0]), 2 * np.pi)
        rad = np.hypot(per[:, 0], per[:, 1])
        o = np.argsort(ang)
        ang, rad = ang[o], rad[o]
        ang_p = np.concatenate([ang[-4:] - 2 * np.pi, ang, ang[:4] + 2 * np.pi])
        rad_p = np.concatenate([rad[-4:], rad, rad[:4]])
        return np.interp(self.theta, ang_p, rad_p)

    # -- build a fresh later scan --
    def regenerate(self, force_sag: bool = False) -> None:
        th = self.theta
        sag = np.zeros_like(th)
        self.deform = None

        make_sag = force_sag or (self.rng.random() > C.SAFE_SCAN_PROBABILITY)
        if make_sag:
            names = list(C.DEFORM_REGIONS)
            weights = np.array([C.DEFORM_REGIONS[n][1] for n in names], float)
            if force_sag:
                name = "roof (crown)"
            else:
                name = names[self.rng.choice(len(names), p=weights / weights.sum())]
            centre_deg = C.DEFORM_REGIONS[name][0]
            centre = np.deg2rad(centre_deg)
            width = self.rng.uniform(*C.DEFORM_WIDTH_RANGE)
            lo, hi = C.DEFORM_DEPTH_RANGE
            depth = (hi if force_sag else self.rng.uniform(lo, hi)) * self.depth_scale
            sag = depth * np.exp(-0.5 * (_ang_diff(th, centre) / width) ** 2)
            self.deform = dict(region=name, centre_deg=centre_deg, width=width, depth=depth)

        r2_nominal = self.r1_nominal - sag

        # noisy "range returns" for both scans
        self.r1 = self.r1_nominal + self.rng.normal(0, C.SCAN_NOISE_M, th.size)
        self.r2 = r2_nominal + self.rng.normal(0, C.SCAN_NOISE_M, th.size)

        # compare along matching angular positions; +ve = moved inward (narrowing)
        self.deviation = _circular_smooth(self.r1 - self.r2, C.SMOOTH_WINDOW)
        self.flagged = self.deviation > C.DEV_THRESHOLD_M

        self._summarise()
        self._to_cartesian()

    def _summarise(self) -> None:
        self.is_flagged = bool(self.flagged.any())
        i = int(np.argmax(self.deviation))
        self.max_dev = float(self.deviation[i])
        self.max_angle_deg = float(np.rad2deg(self.theta[i]))
        # nearest named region to the worst point
        best, bd = "roof (crown)", 999
        for name, (cdeg, _w) in C.DEFORM_REGIONS.items():
            d = abs(np.rad2deg(_ang_diff(np.array([self.theta[i]]), np.deg2rad(cdeg)))[0])
            if d < bd:
                best, bd = name, d
        self.worst_region = best
        runs = _contiguous_runs(self.flagged)
        if runs:
            run = max(runs, key=len)
            self.arc_deg = run.size * 360.0 / C.N_POINTS
            self.arc_m = float(np.mean(self.r1_nominal[run % C.N_POINTS])
                               * np.deg2rad(self.arc_deg))
        else:
            self.arc_deg = 0.0
            self.arc_m = 0.0

    def _to_cartesian(self) -> None:
        th = self.theta
        self.x1, self.y1 = self.r1 * np.cos(th), self.r1 * np.sin(th)
        self.x2, self.y2 = self.r2 * np.cos(th), self.r2 * np.sin(th)

    def scale_depth(self, factor: float) -> None:
        self.depth_scale = float(np.clip(self.depth_scale * factor, 0.2, 4.0))

    def status_line(self) -> str:
        if not self.is_flagged:
            return C.OK_TEXT
        return (f"{C.ALERT_TEXT}   max {self.max_dev * 100:.0f} cm at "
                f"{self.worst_region}, over ~{self.arc_deg:.0f} deg "
                f"({self.arc_m:.1f} m of the perimeter)")


# --------------------------------------------------------------------------
# Headless
# --------------------------------------------------------------------------
def run_headless(n: int) -> int:
    m = TunnelComparison(seed=1)
    print(f"threshold = {C.DEV_THRESHOLD_M*100:.0f} cm inward movement\n")
    print(f"{'#':>2}  {'result':<6}  {'max_dev':>8}  {'region':<16}  {'arc':>7}  injected")
    flags = 0
    for i in range(1, n + 1):
        m.regenerate()
        flags += m.is_flagged
        inj = "-" if m.deform is None else (
            f"{m.deform['region']} {m.deform['depth']*100:.0f}cm")
        print(f"{i:>2}  {'FLAG' if m.is_flagged else 'ok':<6}  "
              f"{m.max_dev*100:6.1f}cm  {m.worst_region:<16}  {m.arc_deg:5.0f}d  {inj}")
    print(f"\n{flags}/{n} scans flagged. forcing a roof sag:")
    m.regenerate(force_sag=True)
    print("  ->", m.status_line())
    return 0 if m.is_flagged else 1


# --------------------------------------------------------------------------
# Rendering (shared by the live window and --snapshot)
# --------------------------------------------------------------------------
def _draw(model: TunnelComparison, ax_main, ax_dev) -> None:
    from matplotlib.patches import Polygon

    th = model.theta
    ax_main.clear()
    ax_dev.clear()

    # ---- overlaid outlines ----
    close = lambda a: np.concatenate([a, a[:1]])
    ax_main.plot(close(model.x1), close(model.y1), color="#5cff9d", lw=2.0,
                 label="T1  early scan (baseline)")
    ax_main.plot(close(model.x2), close(model.y2), color="#ffbf47", lw=2.0,
                 label="T2  later scan")

    runs = _contiguous_runs(model.flagged)
    for run in runs:
        r = run % C.N_POINTS
        ax_main.plot(model.x2[r], model.y2[r], color="#ff3b3b", lw=5.0, solid_capstyle="round")
        poly = np.vstack([
            np.column_stack([model.x1[r], model.y1[r]]),
            np.column_stack([model.x2[r][::-1], model.y2[r][::-1]]),
        ])
        ax_main.add_patch(Polygon(poly, closed=True, color="#ff3b3b", alpha=0.30))

    if model.show_whiskers and model.is_flagged:
        for run in runs:
            r = run % C.N_POINTS
            for j in r[::3]:
                ax_main.plot([model.x1[j], model.x2[j]], [model.y1[j], model.y2[j]],
                             color="#ff6b6b", lw=0.8, alpha=0.7)

    if model.is_flagged:
        ang = np.deg2rad(model.max_angle_deg)
        rr = model.r1_nominal[int(np.argmax(model.deviation))]
        ax_main.annotate(model.worst_region.upper(),
                         xy=(rr * np.cos(ang), rr * np.sin(ang)),
                         xytext=(0.58 * rr * np.cos(ang), 0.58 * rr * np.sin(ang)),
                         color="#ff8a8a", fontsize=10, ha="center", va="center",
                         arrowprops=dict(color="#ff6b6b", arrowstyle="->", lw=1.5))

    ax_main.plot(0, 0, "+", color="#888888", ms=8)
    lim = C.BASE_RADIUS * 1.6
    ax_main.set_xlim(-lim, lim)
    ax_main.set_ylim(-lim, lim)
    ax_main.set_aspect("equal")
    ax_main.grid(alpha=0.15)
    ax_main.set_title("Tunnel cross-section  -  T1 vs T2", fontsize=12)
    ax_main.legend(loc="lower right", fontsize=8, framealpha=0.3)

    # ---- deviation vs position ----
    deg = np.rad2deg(th)
    ax_dev.plot(deg, model.deviation * 100, color="#8ab4ff", lw=1.6)
    ax_dev.axhline(C.DEV_THRESHOLD_M * 100, color="#ff3b3b", ls="--", lw=1.4)
    ax_dev.fill_between(deg, C.DEV_THRESHOLD_M * 100, model.deviation * 100,
                       where=model.flagged, color="#ff3b3b", alpha=0.35, step="mid")
    ax_dev.set_xlim(0, 360)
    ax_dev.set_xticks([0, 90, 180, 270, 360])
    ax_dev.set_xlabel("position around tunnel  (deg:  0 right, 90 roof, 180 left, 270 floor)",
                      fontsize=8)
    ax_dev.set_ylabel("inward movement (cm)", fontsize=9)
    ax_dev.grid(alpha=0.15)
    ax_dev.set_title("point-by-point deviation", fontsize=11)


def _draw_readout(ax, model: TunnelComparison) -> None:
    ax.clear()
    ax.axis("off")
    flagged = model.is_flagged
    inj = "none (noise only)" if model.deform is None else (
        f"{model.deform['region']}  {model.deform['depth']*100:.0f} cm")
    rows = [
        ("result", "FLAG - REVIEW SUPPORT" if flagged else "within tolerance"),
        ("max inward move", f"{model.max_dev*100:.1f} cm   (limit {C.DEV_THRESHOLD_M*100:.0f} cm)"),
        ("worst location", model.worst_region if flagged else "-"),
        ("affected arc", f"{model.arc_deg:.0f} deg  /  {model.arc_m:.1f} m" if flagged else "-"),
        ("injected deform", inj),
    ]
    y = 0.92
    ax.text(0.0, y, "COMPARISON SUMMARY", fontsize=11, weight="bold",
            transform=ax.transAxes, color="#dddddd")
    y -= 0.17
    for label, val in rows:
        ax.text(0.0, y, f"{label:>16} :", fontsize=10, family="monospace",
                transform=ax.transAxes, color="#9aa0a6", ha="left")
        ax.text(0.42, y, val, fontsize=10, family="monospace", transform=ax.transAxes,
                color=("#ff6b6b" if (flagged and label == "result") else "#e8e8e8"))
        y -= 0.16


# --------------------------------------------------------------------------
# Live window
# --------------------------------------------------------------------------
def run_gui() -> int:
    import matplotlib

    try:
        matplotlib.use("TkAgg")
    except Exception:
        pass
    import matplotlib.pyplot as plt
    from matplotlib.gridspec import GridSpec
    from matplotlib.widgets import Button

    plt.style.use("dark_background")
    model = TunnelComparison(seed=None)

    fig = plt.figure(figsize=(13, 7.6))
    try:
        fig.canvas.manager.set_window_title(C.WINDOW_TITLE)
    except Exception:
        pass
    gs = GridSpec(2, 2, figure=fig, height_ratios=[1, 0.62], width_ratios=[1.15, 1],
                  hspace=0.5, wspace=0.2, left=0.06, right=0.97, top=0.88, bottom=0.14)
    ax_main = fig.add_subplot(gs[:, 0])
    ax_dev = fig.add_subplot(gs[0, 1])
    ax_read = fig.add_subplot(gs[1, 1])

    status = fig.text(0.5, 0.945, "", ha="center", fontsize=15, weight="bold")
    fig.text(0.5, 0.02, C.SIM_CAPTION, ha="center", fontsize=8, color="#9aa0a6")
    hint = fig.text(0.06, 0.945, "", ha="left", fontsize=9, color="#9aa0a6")

    bax1 = fig.add_axes([0.60, 0.03, 0.17, 0.06])
    bax2 = fig.add_axes([0.79, 0.03, 0.17, 0.06])
    btn_new = Button(bax1, "NEW LATER SCAN (SPACE)", color="#26324a", hovercolor="#33507f")
    btn_sag = Button(bax2, "FORCE ROOF SAG (s)", color="#8a1c1c", hovercolor="#b22222")

    def refresh():
        _draw(model, ax_main, ax_dev)
        _draw_readout(ax_read, model)
        s = model.status_line()
        status.set_text(("⚠  " if model.is_flagged else "") + s)
        status.set_color("#ff5555" if model.is_flagged else "#8affc1")
        hint.set_text(f"deform depth x{model.depth_scale:.1f}   ([ - ] +)   "
                      f"whiskers {'on' if model.show_whiskers else 'off'} (w)")
        fig.canvas.draw_idle()

    def regen(_=None):
        model.regenerate()
        refresh()

    def force(_=None):
        model.regenerate(force_sag=True)
        refresh()

    btn_new.on_clicked(regen)
    btn_sag.on_clicked(force)

    def on_key(evt):
        if evt.key in (" ", "r"):
            regen()
        elif evt.key == "s":
            force()
        elif evt.key == "]":
            model.scale_depth(1.3); regen()
        elif evt.key == "[":
            model.scale_depth(1 / 1.3); regen()
        elif evt.key == "w":
            model.show_whiskers = not model.show_whiskers; refresh()
        elif evt.key == "q":
            plt.close(fig)

    fig.canvas.mpl_connect("key_press_event", on_key)
    fig._buttons = (btn_new, btn_sag)
    refresh()
    plt.show()
    return 0


def run_snapshot(path: str) -> int:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.gridspec import GridSpec

    plt.style.use("dark_background")
    model = TunnelComparison(seed=7)
    model.regenerate(force_sag=True)

    fig = plt.figure(figsize=(13, 7.6))
    gs = GridSpec(2, 2, figure=fig, height_ratios=[1, 0.62], width_ratios=[1.15, 1],
                  hspace=0.5, wspace=0.2, left=0.06, right=0.97, top=0.88, bottom=0.14)
    ax_main = fig.add_subplot(gs[:, 0])
    ax_dev = fig.add_subplot(gs[0, 1])
    ax_read = fig.add_subplot(gs[1, 1])
    _draw(model, ax_main, ax_dev)
    _draw_readout(ax_read, model)
    fig.text(0.5, 0.945, "⚠  " + model.status_line(), ha="center",
             fontsize=15, weight="bold", color="#ff5555")
    fig.text(0.5, 0.02, C.SIM_CAPTION, ha="center", fontsize=8, color="#9aa0a6")
    fig.savefig(path, dpi=110, facecolor=fig.get_facecolor())
    print(f"snapshot written: {path}  ({model.status_line()})")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Phase 4 - structural shape-tracking (simulated LiDAR)")
    ap.add_argument("--headless", type=int, metavar="N", default=None,
                    help="regenerate N comparisons without a window and print a table")
    ap.add_argument("--snapshot", metavar="PATH", default=None,
                    help="render one flagged comparison to an image and exit")
    args = ap.parse_args(argv)
    if args.headless is not None:
        return run_headless(args.headless)
    if args.snapshot is not None:
        return run_snapshot(args.snapshot)
    return run_gui()


if __name__ == "__main__":
    raise SystemExit(main())
