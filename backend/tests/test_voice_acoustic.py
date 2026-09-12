"""
Academic Verification Suite: Test Voice Acoustic Prosody & CHI Bounds.
Validates Customer Hesitation Index (CHI) formula bounds:
  CHI = 0.45 * (1 - min(SPR / 3.0, 1)) + 0.35 * (1 - min(sigma_F0 / 50.0, 1)) + 0.20 * |Delta WPM|
Guarantees 0.0 <= CHI <= 1.0 under all extreme signal conditions,
and verifies sub-second (<800ms) live in-call HUD battlecard whispering per Pillar 1.
"""

import pytest
import numpy as np
from app.ml.acoustic_engine import acoustic_engine, AcousticEngine
from app.services.live_call_copilot import live_call_copilot

def test_chi_mathematical_bounds():
    """
    Validates that CHI is strictly bounded in [0.0, 1.0] across all edge-case inputs:
    Infinite pause, zero pitch variance, excessive speaking rates, negative rates.
    """
    engine = AcousticEngine()

    test_cases = [
        # (spr, sigma_f0, wpm)
        (3.0, 50.0, 140.0),    # Ideal fluent speech -> CHI should be 0.0
        (0.0, 0.0, 0.0),       # Maximum hesitation/silence -> CHI should be 0.45 + 0.35 + 0.20 = 1.0
        (10.0, 100.0, 140.0),  # Oversaturated fluency -> CHI clamped to 0.0
        (0.0, 0.0, 350.0),     # Panic velocity -> CHI clamped to 1.0
        (1.5, 25.0, 140.0),    # Moderate hesitation
        (-5.0, -10.0, -20.0),  # Negative defensive clamping
    ]

    for spr, sigma, wpm in test_cases:
        chi = engine.calculate_chi(spr, sigma, wpm)
        assert 0.0 <= chi <= 1.0, f"CHI {chi} out of bounds for inputs ({spr}, {sigma}, {wpm})"

    # Verify theoretical extremes
    min_chi = engine.calculate_chi(spr=3.5, sigma_f0=60.0, wpm=140.0)
    assert min_chi == 0.0, f"Expected 0.0 for ideal fluent speech, got {min_chi}"

    max_chi = engine.calculate_chi(spr=0.0, sigma_f0=0.0, wpm=0.0)
    assert max_chi == 1.0, f"Expected 1.0 for completely paused hesitant speech, got {max_chi}"

def test_acoustic_signal_extraction_from_numpy():
    """Validates acoustic extraction and CHI computation directly from synthetic 16kHz audio buffer."""
    sr = 16000
    duration = 1.5  # 1.5 seconds
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)

    # Synthesize fundamental pitch at 150 Hz + harmonics with slight amplitude modulation
    signal = 0.5 * np.sin(2 * np.pi * 150 * t) + 0.25 * np.sin(2 * np.pi * 300 * t)
    # Insert 300ms pause in the middle
    signal[int(sr * 0.6) : int(sr * 0.9)] = 0.0

    features = acoustic_engine.extract_from_signal(signal, sample_rate=sr, transcript_text="Pricing proposal looks very competitive")

    assert "chi" in features
    assert 0.0 <= features["chi"] <= 1.0
    assert features["f0_mean"] > 0.0
    assert features["spr"] > 0.0
    assert features["wpm"] > 0.0
    assert features["latency_ms"] < 250.0  # Fast sub-second extraction

def test_live_call_copilot_sub_800ms_battlecard():
    """
    Validates sub-second (<800ms) live HUD battlecard generation.
    When a prospect mentions 'Competitor X pricing' with high CHI,
    the copilot immediately injects the '0% per-seat tax' battlecard.
    """
    transcript = "We like your software, but Competitor X pricing is 30% cheaper. Can you match their discount?"
    result = live_call_copilot.process_speech_chunk(
        transcript_chunk=transcript,
        audio_metrics={"chi": 0.65},  # High hesitation index
        rep_talk_time_sec=40.0,
        prospect_talk_time_sec=60.0
    )

    assert result["latency_within_sla"] is True
    assert result["latency_ms"] < 800.0
    assert result["has_battlecard"] is True
    assert result["battlecard"]["id"] == "card-comp-x-pricing"
    assert "0% per-seat tax" in result["battlecard"]["whisper_action"].lower()
    assert "40%" in result["battlecard"]["rebuttal_script"]

    # Validate talk-ratio telemetry
    assert result["talk_ratio"]["rep_pct"] == 40.0
    assert result["talk_ratio"]["prospect_pct"] == 60.0
    assert "waveform_bars" in result
    assert len(result["waveform_bars"]) == 16
