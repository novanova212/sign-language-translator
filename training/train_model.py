"""
train_model.py

Melatih model klasifikasi huruf BISINDO dari data landmark 2 tangan
(hasil collect_landmarks.py). Arsitektur ini mengikuti pola yang terbukti
dipakai di riset-riset BISINDO sebelumnya: Dense-Dropout dua lapis,
dilatih dari 128 fitur numerik (bukan gambar mentah), sehingga model
tetap ringan dan cepat dijalankan di browser.

Cara pakai:
    python train_model.py --data my_dataset.csv --output sign_model.h5
"""

import argparse

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

FEATURE_COLUMNS_PREFIX = ("right_hand_prob", "left_hand_prob", "right_", "left_")


def load_data(csv_path):
    df = pd.read_csv(csv_path)

    feature_cols = [c for c in df.columns if c.startswith(FEATURE_COLUMNS_PREFIX)]
    X = df[feature_cols].values.astype("float32")
    y_raw = df["label"].values

    encoder = LabelEncoder()
    y = encoder.fit_transform(y_raw)

    return X, y, encoder.classes_, feature_cols


def build_model(input_dim, num_classes):
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(input_dim,)),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main(data_path, output_path, epochs, batch_size):
    X, y, classes, feature_cols = load_data(data_path)
    print(f"Jumlah sample: {len(X)}, Jumlah kelas: {len(classes)}, Jumlah fitur: {X.shape[1]}")
    print(f"Urutan label (PENTING, dipakai juga di src/ml/classifier.ts): {list(classes)}")

    if len(X) < 30:
        print(
            "\nPERINGATAN: dataset kamu masih sangat kecil "
            f"({len(X)} sample). Model kemungkinan besar akan overfit / "
            "akurasinya gak reliable. Idealnya minimal 30-50 sample per huruf."
        )

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = build_model(input_dim=X.shape[1], num_classes=len(classes))
    model.summary()

    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=8, restore_best_weights=True
    )

    model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=[early_stop],
    )

    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\nAkurasi validasi akhir: {val_acc * 100:.1f}%")

    model.save(output_path)
    print(f"Model disimpan ke {output_path}")

    with open("labels.txt", "w") as f:
        f.write("\n".join(classes))
    print("Urutan label disimpan ke labels.txt (cocokkan dengan LABELS di classifier.ts)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path ke CSV hasil collect_landmarks.py")
    parser.add_argument("--output", default="sign_model.h5", help="Path output model")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch_size", type=int, default=16)
    args = parser.parse_args()

    main(args.data, args.output, args.epochs, args.batch_size)