"""Find beat-aligned loop points for the game music.

    pip install librosa
    python tools/loop-points.py demo/music/frenchmen-street.mp3 65

Prints the best loop-in / loop-out beat pair for a loop at least MIN_SECONDS
long. Both points sit on the same position in the bar, a multiple of 16 beats
(4 bars) apart, and are scored by how much the music around the two points
sounds alike (mel-spectrum correlation one bar after, half a bar before).
The loop-out is then nudged to the onset envelope so the beat grids line up
to within a few milliseconds. Copy the numbers into TRACKS in demo/audio.js.
"""
import sys

import librosa
import numpy as np


def main(path, min_len, tail_guard=2.5):
    y, sr = librosa.load(path, sr=22050)
    dur = len(y) / sr
    _, frames = librosa.beat.beat_track(y=y, sr=sr)
    bt = librosa.frames_to_time(frames, sr=sr)
    beat = float(np.median(np.diff(bt)))
    mel = librosa.power_to_db(librosa.feature.melspectrogram(y=y, sr=sr, n_mels=64, hop_length=512))
    fr = lambda s: librosa.time_to_frames(s, sr=sr, hop_length=512)

    def alike(i, j, a, b):
        x = mel[:, fr(bt[i] + a * beat):fr(bt[i] + b * beat)]
        z = mel[:, fr(bt[j] + a * beat):fr(bt[j] + b * beat)]
        n = min(x.shape[1], z.shape[1])
        return np.corrcoef(x[:, :n].ravel(), z[:, :n].ravel())[0, 1]

    best = None
    for i in range(len(bt)):
        if bt[i] < 2 * beat or bt[i] > 30:
            continue
        for j in range(i + 16, len(bt), 16):
            if bt[j] - bt[i] < min_len or bt[j] > dur - tail_guard:
                continue
            score = alike(i, j, 0, 4) + alike(i, j, -2, 0)
            if best is None or score > best[0]:
                best = (score, bt[i], bt[j], j - i)
    _, loop_in, loop_out, beats = best

    # Fine alignment on the onset envelope, +/- 90 ms.
    hop = 64
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    f = lambda s: int(round(s * sr / hop))
    a = env[f(loop_in) - f(2):f(loop_in) + f(2)]
    lags = range(-f(0.09), f(0.09) + 1)
    corr = [np.corrcoef(a, env[f(loop_out) + l - f(2):f(loop_out) + l + f(2)])[0, 1] for l in lags]
    loop_out += list(lags)[int(np.argmax(corr))] * hop / sr
    print(f"{path}: loopIn {loop_in:.3f}  loopOut {loop_out:.3f}  beat {beat:.3f}  "
          f"({60 / beat:.1f} BPM, {beats} beats, score {best[0]:.2f})")


if __name__ == "__main__":
    main(sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 60)
