# Lecture 06: Deep Learning and CNNs

## Neural network basics
A neural network consists of connected layers of neurons. Each neuron applies a mathematical transformation to inputs and passes the result forward.

```python
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(28, 28)),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
```

## Activation functions
Common activation functions:
- ReLU
- Sigmoid
- Tanh
- Softmax

## Backpropagation
Backpropagation updates model weights by calculating the gradient of the loss function with respect to each parameter.

## CNN for images
Convolutional Neural Networks are excellent for image data.

```python
from tensorflow.keras import layers, models

cnn = models.Sequential([
    layers.Conv2D(32, (3,3), activation='relu', input_shape=(28,28,1)),
    layers.MaxPooling2D((2,2)),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dense(10, activation='softmax')
])
```

## Why CNNs work well
They capture spatial patterns like edges, shapes, and textures, which makes them powerful for computer vision tasks.

## Summary
Deep learning is useful when the data has complex patterns and traditional features are not enough. CNNs are the standard architecture for image tasks.

## Interview note
A standard answer is: “CNNs use convolution layers to scan local regions and detect local features, making them effective for image and vision problems.”
