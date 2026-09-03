"""
collect_landmarks.py

Alat pengumpul dataset BISINDO lewat webcam sendiri.
Pendekatan ini mengikuti metode yang terbukti dipakai di riset-riset BISINDO
sebelumnya: melacak DUA tangan sekaligus (karena banyak huruf BISINDO pakai
dua tangan, beda dari ASL yang cuma satu tangan), lalu simpan landmark-nya
sebagai fitur numerik ke CSV.

Cara pakai:
    python collect_landmarks.py --output my_dataset.csv

Kontrol saat webcam nyala:
    - Tekan huruf A-Z untuk pilih label yang mau direkam
    - Tekan SPASI untuk capture frame saat ini
    - Tekan Y untuk simpan, tekan tombol lain untuk batal simpan
    - Tekan Q untuk keluar

Format fitur per baris (128 angka + label):
    RIGHT_HAND_PROB, LEFT_HAND_PROB,
    RIGHT_x0..z20 (63 angka),
    LEFT_x0..z20 (63 angka)
Kalau salah satu tangan tidak kedeteksi, bagian itu diisi 0.
"""

import argparse
import csv
import os
import time

import cv2
import mediapipe as mp

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

LABELS_ALLOWED = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def build_header():
    header = ["timestamp", "label", "right_hand_prob", "left_hand_prob"]
    for side in ("right", "left"):
        for i in range(21):
            header += [f"{side}_x{i}", f"{side}_y{i}", f"{side}_z{i}"]
    return header


def landmarks_to_flat(hand_landmarks):
    flat = []
    for point in hand_landmarks.landmark:
        flat.extend([point.x, point.y, point.z])
    return flat


def extract_features(results):
    """Ubah hasil deteksi MediaPipe jadi 128 fitur: 2 probabilitas + 63*2 koordinat."""
    right_prob, left_prob = 0.0, 0.0
    right_coords = [0.0] * 63
    left_coords = [0.0] * 63

    if results.multi_hand_landmarks and results.multi_handedness:
        for hand_landmarks, handedness in zip(
            results.multi_hand_landmarks, results.multi_handedness
        ):
            label = handedness.classification[0].label  # "Right" atau "Left"
            score = handedness.classification[0].score
            coords = landmarks_to_flat(hand_landmarks)

            if label == "Right":
                right_prob = score
                right_coords = coords
            elif label == "Left":
                left_prob = score
                left_coords = coords

    return [right_prob, left_prob] + right_coords + left_coords


def initiate_csv(filename):
    if not os.path.isfile(filename):
        with open(filename, "w", newline="") as f:
            csv.writer(f).writerow(build_header())
        print(f"File baru dibuat: {filename}")
    else:
        print(f"Menambah data ke file yang sudah ada: {filename}")


def append_row(filename, row):
    with open(filename, "a", newline="") as f:
        csv.writer(f).writerow(row)


def main(output_csv, camera_index):
    initiate_csv(output_csv)

    capture = cv2.VideoCapture(camera_index)
    if not capture.isOpened():
        print(f"Tidak bisa buka kamera index {camera_index}. Coba ganti --camera 0/1/2.")
        return

    current_label = None
    saved_count = 0

    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as hands:
        print("Tekan A-Z untuk pilih label, SPASI untuk capture, Q untuk keluar.")

        while True:
            ok, frame = capture.read()
            if not ok:
                break
            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)

            display = frame.copy()
            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(
                        display, hand_landmarks, mp_hands.HAND_CONNECTIONS
                    )

            status = f"Label aktif: {current_label or '-'} | Tersimpan: {saved_count}"
            cv2.putText(
                display, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2
            )
            cv2.imshow("Kumpulkan Data BISINDO", display)

            key = cv2.waitKey(1) & 0xFF

            pressed_char = chr(key).upper() if key != 255 else ""

            if key == ord("q"):
                break
            elif pressed_char in LABELS_ALLOWED:
                current_label = pressed_char
                print(f"Label dipilih: {current_label}")
            elif key == ord(" "):
                if current_label is None:
                    print("Pilih label huruf dulu sebelum capture.")
                    continue
                if not results.multi_hand_landmarks:
                    print("Tidak ada tangan terdeteksi, coba lagi.")
                    continue

                features = extract_features(results)
                print(f"Simpan sebagai label '{current_label}'? (Y = simpan, lainnya = batal)")
                confirm = cv2.waitKey(0) & 0xFF
                if confirm in (ord("y"), ord("Y")):
                    row = [time.time(), current_label] + features
                    append_row(output_csv, row)
                    saved_count += 1
                    print("Tersimpan.")
                else:
                    print("Dibatalkan.")

    capture.release()
    cv2.destroyAllWindows()
    print(f"\nSelesai. Total {saved_count} sample tersimpan di {output_csv}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="my_dataset.csv", help="Path file CSV output")
    parser.add_argument("--camera", type=int, default=0, help="Index kamera (0, 1, 2, ...)")
    args = parser.parse_args()

    main(args.output, args.camera)