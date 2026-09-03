"""
convert_to_tfjs.py

Mengonversi model Keras (.h5) hasil train_model.py menjadi format
TensorFlow.js, supaya bisa di-load di browser lewat src/ml/classifier.ts.

Butuh package tambahan:
    pip install tensorflowjs

Cara pakai:
    python convert_to_tfjs.py --model sign_model.h5 --output ../models/sign_model
"""

import argparse

import tensorflow as tf
import tensorflowjs as tfjs


def convert(model_path, output_dir):
    model = tf.keras.models.load_model(model_path)
    tfjs.converters.save_keras_model(model, output_dir)
    print(f"Model TF.js disimpan di: {output_dir}")
    print("Pastikan folder ini ada di public/models/sign_model/ project Vue kamu")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="Path model .h5 hasil training")
    parser.add_argument("--output", default="../models/sign_model")
    args = parser.parse_args()

    convert(args.model, args.output)