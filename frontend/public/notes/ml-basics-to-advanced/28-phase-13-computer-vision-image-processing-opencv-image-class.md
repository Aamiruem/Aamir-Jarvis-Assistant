> **You asked:**
>
> Phase 13: Computer Vision
> Image Processing
> OpenCV
> Image Classification
> CNN Basics
> Object Detection
> YOLO Basics

# Phase 13: Computer Vision  
# Image Processing, OpenCV, Image Classification, CNN, Object Detection, YOLO

Computer Vision means teaching computers to **understand images and videos**.

Simple meaning:

```text id="127ift"
Computer Vision = Machine understands visual data
```

Examples:

```text id="9c7v4z"
Face detection
Image classification
Object detection
Self-driving cars
Medical image analysis
Number plate detection
OCR
Security camera analysis
```

OpenCV is one of the most used open-source computer vision libraries, and its repository describes it as an “Open Source Computer Vision Library.” citeturn589675view0

---

# 1. What is Computer Vision?

## Easy Definition

Computer Vision is a field of AI where computers process and understand images or videos.

Example:

```text id="i3iih5"
Input Image: Dog image
Computer Vision Model Output: Dog
```

Another example:

```text id="d4gqgf"
Input Image: Road image
Output:
Car detected
Person detected
Traffic light detected
```

## Interview Answer

Computer Vision is a branch of AI that helps computers understand and analyze visual data such as images and videos.

---

# 2. Image Processing

## Easy Definition

Image Processing means applying operations on images to improve or extract useful information.

Simple meaning:

```text id="naxwif"
Image Processing = Cleaning, changing, and analyzing images
```

Examples:

```text id="27johp"
Resize image
Convert image to grayscale
Remove noise
Detect edges
Blur image
Sharpen image
Threshold image
Find contours
```

---

## What is an Image in Computer?

An image is a matrix of pixel values.

Grayscale image:

```text id="7fjz1a"
2D matrix
```

Color image:

```text id="38z112"
3D matrix = Height × Width × Channels
```

Example:

```text id="mcitop"
Image shape = (224, 224, 3)
```

Meaning:

```text id="6lwzgw"
224 = height
224 = width
3 = color channels: Red, Green, Blue
```

---

# 3. Common Image Processing Operations

| Operation | Meaning | Use |
|---|---|---|
| Read Image | Load image | Start processing |
| Resize | Change image size | Model input size |
| Grayscale | Convert color to black-white | Simpler processing |
| Blur | Reduce noise | Smooth image |
| Thresholding | Convert to black/white | Object separation |
| Edge Detection | Find boundaries | Shape/object detection |
| Contours | Find object outlines | Object localization |
| Rotation | Rotate image | Augmentation |
| Cropping | Cut region | Focus on object |

---

# 4. OpenCV

## Easy Definition

OpenCV is a Python/C++ library used for computer vision and image processing.

Simple meaning:

```text id="za8b2r"
OpenCV helps us read, process, analyze, and display images/videos.
```

Install:

```bash id="nat5ol"
pip install opencv-python
```

---

## OpenCV Basic Code

```python id="81vh6o"
import cv2

# Read image
image = cv2.imread("image.jpg")

# Show image
cv2.imshow("Original Image", image)

# Wait until key press
cv2.waitKey(0)

# Close all windows
cv2.destroyAllWindows()
```

---

## Important Note

OpenCV reads images in **BGR format**, not RGB.

```text id="znfu7o"
OpenCV default color order = BGR
Matplotlib color order = RGB
```

So if you show OpenCV image using Matplotlib, convert BGR to RGB.

```python id="sbclep"
import cv2
import matplotlib.pyplot as plt

image = cv2.imread("image.jpg")

# Convert BGR to RGB
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

plt.imshow(image_rgb)
plt.axis("off")
plt.show()
```

---

# 5. OpenCV Image Processing Code

```python id="lp2ki3"
import cv2
import matplotlib.pyplot as plt

# Read image
image = cv2.imread("image.jpg")

# Convert BGR to RGB for display
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Resize image
resized = cv2.resize(image_rgb, (224, 224))

# Blur image
blurred = cv2.GaussianBlur(gray, (5, 5), 0)

# Edge detection
edges = cv2.Canny(gray, 100, 200)

# Show results
plt.figure(figsize=(10, 6))

plt.subplot(2, 2, 1)
plt.imshow(image_rgb)
plt.title("Original")
plt.axis("off")

plt.subplot(2, 2, 2)
plt.imshow(gray, cmap="gray")
plt.title("Grayscale")
plt.axis("off")

plt.subplot(2, 2, 3)
plt.imshow(blurred, cmap="gray")
plt.title("Blurred")
plt.axis("off")

plt.subplot(2, 2, 4)
plt.imshow(edges, cmap="gray")
plt.title("Edges")
plt.axis("off")

plt.show()
```

---

# 6. Thresholding

## Easy Definition

Thresholding converts an image into black and white based on a threshold value.

Example:

```text id="l3x6ay"
Pixel value > 127 → white
Pixel value <= 127 → black
```

## Code

```python id="h6znh6"
import cv2
import matplotlib.pyplot as plt

image = cv2.imread("image.jpg", 0)

# Simple threshold
_, threshold = cv2.threshold(image, 127, 255, cv2.THRESH_BINARY)

plt.imshow(threshold, cmap="gray")
plt.title("Threshold Image")
plt.axis("off")
plt.show()
```

## Use

```text id="vkdr4c"
Document scanning
Number plate detection
Object separation
Medical image processing
```

---

# 7. Contours

## Easy Definition

Contours are boundaries or outlines of objects in an image.

Simple meaning:

```text id="du7w3d"
Contour = Object boundary
```

## Code

```python id="eqbf2l"
import cv2

image = cv2.imread("image.jpg")
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Threshold
_, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

# Find contours
contours, hierarchy = cv2.findContours(
    thresh,
    cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE
)

# Draw contours
cv2.drawContours(image, contours, -1, (0, 255, 0), 2)

cv2.imshow("Contours", image)
cv2.waitKey(0)
cv2.destroyAllWindows()
```

## Use

```text id="fnlmej"
Shape detection
Object boundary detection
Counting objects
Document detection
```

---

# 8. Image Classification

## Easy Definition

Image Classification means assigning one label/class to an image.

Example:

```text id="52g8wo"
Input image → Cat
Input image → Dog
Input image → Car
```

TensorFlow’s official image-classification guide shows a neural network trained to classify clothing images and uses `tf.keras` as the high-level API for building and training models. citeturn589675view2

---

## Image Classification Examples

| Input Image | Output Class |
|---|---|
| Dog image | Dog |
| Cat image | Cat |
| X-ray image | Pneumonia / Normal |
| Product image | Shoe / Shirt / Watch |
| Plant leaf image | Healthy / Diseased |

---

## Basic Image Classification Pipeline

```text id="7mziqj"
1. Collect images
2. Label images
3. Resize images
4. Normalize pixel values
5. Split train/test data
6. Build CNN model
7. Train model
8. Evaluate model
9. Predict new image
```

---

# 9. Why Resize and Normalize Images?

## Resize

Deep learning models need fixed input size.

Example:

```text id="ux1ly8"
224 × 224 × 3
```

## Normalize

Pixel values are usually from:

```text id="jvh1lu"
0 to 255
```

We divide by 255 to convert them into:

```text id="o3z97l"
0 to 1
```

TensorFlow’s guide also normalizes image pixel values by dividing by `255.0` before feeding them into the neural network. citeturn589675view2

---

# 10. CNN Basics

## Easy Definition

CNN stands for **Convolutional Neural Network**.

CNN is a deep learning model specially designed for images.

Simple meaning:

```text id="4rzfp1"
CNN automatically learns image features like edges, shapes, and objects.
```

---

## Why CNN is Used for Images?

Normal ANN does not understand image structure very well.

CNN understands:

```text id="f2sgoa"
Edges
Corners
Textures
Shapes
Objects
```

---

## CNN Layers

| Layer | Meaning |
|---|---|
| Convolution Layer | Extracts features |
| Activation Layer | Adds non-linearity |
| Pooling Layer | Reduces size |
| Flatten Layer | Converts matrix to vector |
| Dense Layer | Makes final prediction |
| Output Layer | Gives class probability |

---

# 11. Convolution Layer

## Easy Definition

Convolution layer applies filters to extract features from images.

Simple meaning:

```text id="qwa9sl"
Filter moves over image and detects patterns.
```

Example filters can detect:

```text id="36izcv"
Vertical edges
Horizontal edges
Corners
Textures
```

---

## Example

Input image:

```text id="zi7i4x"
Cat image
```

Early CNN layers detect:

```text id="n6x0q0"
Edges
Lines
Curves
```

Middle layers detect:

```text id="61z8tv"
Eyes
Ears
Fur
```

Final layers detect:

```text id="i0k0o2"
Cat face
Cat body
```

---

# 12. Pooling Layer

## Easy Definition

Pooling reduces image size while keeping important information.

Most common:

```text id="od76cr"
Max Pooling
```

Example:

```text id="jsahvu"
[1, 3]
[2, 5]
```

Max value:

```text id="bs76tk"
5
```

So max pooling keeps strongest feature.

---

## Why Pooling is Used?

```text id="5jfxho"
Reduces computation
Reduces overfitting
Keeps important features
Makes model faster
```

---

# 13. Flatten Layer

## Easy Definition

Flatten converts 2D/3D feature maps into a 1D vector.

Example:

```text id="cx39tx"
Feature map:
[[1, 2],
 [3, 4]]

Flatten:
[1, 2, 3, 4]
```

Why?

```text id="a0cnul"
Dense layer needs 1D input.
```

---

# 14. CNN Code: Image Classification with Keras

This example uses Fashion MNIST.

```python id="llb4ne"
import tensorflow as tf
from tensorflow.keras import layers, models

# Load dataset
fashion_mnist = tf.keras.datasets.fashion_mnist

(train_images, train_labels), (test_images, test_labels) = fashion_mnist.load_data()

# Normalize pixel values: 0-255 to 0-1
train_images = train_images / 255.0
test_images = test_images / 255.0

# Add channel dimension: (28, 28) to (28, 28, 1)
train_images = train_images.reshape(-1, 28, 28, 1)
test_images = test_images.reshape(-1, 28, 28, 1)

# Build CNN model
model = models.Sequential([
    layers.Conv2D(32, (3, 3), activation="relu", input_shape=(28, 28, 1)),
    layers.MaxPooling2D((2, 2)),

    layers.Conv2D(64, (3, 3), activation="relu"),
    layers.MaxPooling2D((2, 2)),

    layers.Flatten(),
    layers.Dense(64, activation="relu"),
    layers.Dense(10, activation="softmax")
])

# Compile model
model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

# Train model
model.fit(
    train_images,
    train_labels,
    epochs=5,
    validation_data=(test_images, test_labels)
)

# Evaluate
test_loss, test_accuracy = model.evaluate(test_images, test_labels)

print("Test Accuracy:", test_accuracy)
```

---

## Code Explanation

| Code | Meaning |
|---|---|
| `Conv2D` | Extracts image features |
| `MaxPooling2D` | Reduces feature map size |
| `Flatten` | Converts features into vector |
| `Dense` | Fully connected layer |
| `softmax` | Multi-class probability |
| `sparse_categorical_crossentropy` | Loss for integer labels |

---

# 15. CNN Interview Answer

CNN is a deep learning architecture used for image data. It uses convolution layers to extract features, pooling layers to reduce size, flatten layer to convert features into vector, and dense layers for final classification.

---

# 16. Object Detection

## Easy Definition

Object Detection means finding **what object is present** and **where it is located** in an image.

Image Classification only tells:

```text id="h8y4gd"
This image has a dog.
```

Object Detection tells:

```text id="m4fqgy"
Dog detected at this location.
Person detected at this location.
Car detected at this location.
```

---

## Classification vs Detection

| Task | Output |
|---|---|
| Image Classification | Class label |
| Object Detection | Class label + bounding box |
| Image Segmentation | Class label + exact pixel mask |

---

## Bounding Box

A bounding box is a rectangle around an object.

It usually contains:

```text id="i1j9v9"
x_min
y_min
x_max
y_max
class label
confidence score
```

Example:

```text id="qhf9pt"
Person: 92% confidence
Box: x=50, y=80, width=100, height=200
```

---

## Object Detection Applications

```text id="8dgxrj"
Self-driving cars
Face mask detection
Number plate detection
CCTV surveillance
Traffic monitoring
Medical detection
Retail product detection
Industrial defect detection
```

---

# 17. YOLO Basics

## Easy Definition

YOLO stands for **You Only Look Once**.

Simple meaning:

```text id="eatf53"
YOLO detects objects in one forward pass through the image.
```

Ultralytics documentation explains that YOLO treats object detection as a single regression problem, predicting bounding boxes and class probabilities directly from full images in one evaluation; this makes YOLO models fast compared with earlier two-stage detectors. citeturn589675view1

---

## Why YOLO is Popular?

```text id="akztt4"
Fast detection
Real-time performance
Good accuracy
Easy to use
Works on images and videos
Can detect multiple objects
```

Ultralytics YOLO supports tasks like object detection, segmentation, pose estimation, tracking, and classification. citeturn589675view1

---

## YOLO Output

YOLO gives:

```text id="y20f2v"
Object class
Bounding box
Confidence score
```

Example:

```text id="2mnf1g"
person: 0.95
car: 0.87
dog: 0.78
```

---

# 18. YOLO Code Using Ultralytics

Install:

```bash id="p3ct2t"
pip install ultralytics
```

Basic object detection code:

```python id="tuzhv4"
from ultralytics import YOLO

# Load pre-trained YOLO model
model = YOLO("yolov8n.pt")

# Run prediction on image
results = model.predict(
    source="image.jpg",
    conf=0.25,
    save=True
)

print(results)
```

Ultralytics documentation shows that YOLO can run inference on images, videos, directories, URLs, and streams using `model.predict()`, and supports arguments such as `conf`, `iou`, `imgsz`, and `device`. citeturn589675view3

---

## YOLO Webcam Code

```python id="2temfo"
from ultralytics import YOLO

model = YOLO("yolov8n.pt")

# 0 means default webcam
results = model.predict(
    source=0,
    show=True,
    conf=0.25
)
```

---

## YOLO Video Detection Code

```python id="ye3hkk"
from ultralytics import YOLO

model = YOLO("yolov8n.pt")

results = model.predict(
    source="video.mp4",
    save=True,
    conf=0.25
)
```

---

# 19. YOLO Important Terms

| Term | Meaning |
|---|---|
| Bounding Box | Rectangle around object |
| Confidence Score | Model confidence |
| Class Label | Object category |
| IoU | Overlap between predicted and actual box |
| NMS | Removes duplicate boxes |
| mAP | Object detection evaluation metric |
| Anchor Box | Predefined box shape used in older YOLO versions |

---

# 20. IoU — Intersection over Union

## Easy Definition

IoU checks how much predicted box overlaps with actual box.

Formula:

```text id="gfw3c1"
IoU = Area of Overlap / Area of Union
```

Simple meaning:

```text id="n0nt7y"
Higher IoU = better bounding box
```

Example:

```text id="7k810q"
IoU = 0.90 → Very good box
IoU = 0.30 → Poor box
```

---

# 21. NMS — Non-Maximum Suppression

## Easy Definition

NMS removes duplicate bounding boxes.

Example:

If YOLO detects the same person 5 times with overlapping boxes:

```text id="8zzc0r"
NMS keeps the best box and removes others.
```

---

# 22. mAP — Mean Average Precision

## Easy Definition

mAP is a common object detection evaluation metric.

Simple meaning:

```text id="h4dsm8"
mAP measures how accurately model detects objects and boxes.
```

Higher mAP means better object detector.

---

# 23. Complete Mini Project: Image Classification

## Project Name

```text id="o5oshm"
Cat vs Dog Image Classification using CNN
```

## Folder Structure

```text id="1ig6ur"
dataset/
    train/
        cat/
        dog/
    test/
        cat/
        dog/
```

Keras has an official example for image classification from JPEG files on disk using `image_dataset_from_directory`, image standardization, and augmentation. citeturn589675view4

## Code

```python id="2eo2ct"
import tensorflow as tf
from tensorflow.keras import layers, models

# Load training data
train_data = tf.keras.utils.image_dataset_from_directory(
    "dataset/train",
    image_size=(224, 224),
    batch_size=32
)

# Load testing data
test_data = tf.keras.utils.image_dataset_from_directory(
    "dataset/test",
    image_size=(224, 224),
    batch_size=32
)

# Normalize images
normalization_layer = layers.Rescaling(1./255)

train_data = train_data.map(lambda x, y: (normalization_layer(x), y))
test_data = test_data.map(lambda x, y: (normalization_layer(x), y))

# Build CNN model
model = models.Sequential([
    layers.Conv2D(32, (3, 3), activation="relu", input_shape=(224, 224, 3)),
    layers.MaxPooling2D(2, 2),

    layers.Conv2D(64, (3, 3), activation="relu"),
    layers.MaxPooling2D(2, 2),

    layers.Conv2D(128, (3, 3), activation="relu"),
    layers.MaxPooling2D(2, 2),

    layers.Flatten(),
    layers.Dense(128, activation="relu"),
    layers.Dense(1, activation="sigmoid")
])

# Compile
model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

# Train
model.fit(
    train_data,
    validation_data=test_data,
    epochs=10
)

# Save model
model.save("cat_dog_cnn_model.h5")
```

---

# 24. Complete Mini Project: Object Detection Using YOLO

## Project Name

```text id="do8i9n"
Object Detection using YOLO
```

## Problem Statement

Detect objects like person, car, dog, bus, and bicycle from images or videos.

## Code

```python id="0da9kc"
from ultralytics import YOLO

# Load pre-trained YOLO model
model = YOLO("yolov8n.pt")

# Detect objects
results = model.predict(
    source="street.jpg",
    conf=0.25,
    save=True
)

# Print detected boxes
for result in results:
    boxes = result.boxes

    for box in boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        coordinates = box.xyxy[0]

        print("Class ID:", class_id)
        print("Confidence:", confidence)
        print("Box:", coordinates)
```

---

# 25. How to Explain Computer Vision Project in Interview

```text id="k9bpag"
I built a computer vision project for image classification/object detection.

For image classification, I collected labeled images and resized them to a fixed size. Then I normalized pixel values and trained a CNN model. The CNN used convolution layers to extract features, pooling layers to reduce feature size, and dense layers for final classification.

For object detection, I used YOLO because it is fast and suitable for real-time detection. YOLO predicts object class, bounding box, and confidence score in one forward pass.

I evaluated the classification model using accuracy and loss, and for object detection I used confidence score, IoU, and mAP.
```

---

# 26. Image Classification vs Object Detection vs Segmentation

| Task | Meaning | Output |
|---|---|---|
| Image Classification | Identifies main class | Dog |
| Object Detection | Finds object and location | Dog + bounding box |
| Segmentation | Finds exact object pixels | Dog mask |

---

# 27. Common Computer Vision Models

| Model | Use |
|---|---|
| CNN | Image classification |
| VGG | Image classification |
| ResNet | Image classification |
| MobileNet | Lightweight mobile vision |
| YOLO | Object detection |
| Faster R-CNN | Object detection |
| U-Net | Image segmentation |
| Vision Transformer | Advanced image tasks |

---

# 28. Most Asked Interview Questions

## Q1. What is Computer Vision?

Computer Vision is a branch of AI that helps computers understand images and videos.

---

## Q2. What is Image Processing?

Image Processing means applying operations on images to improve quality or extract useful information.

---

## Q3. What is OpenCV?

OpenCV is an open-source computer vision library used for image processing, video processing, and object detection tasks.

---

## Q4. What is CNN?

CNN stands for Convolutional Neural Network. It is a deep learning model used mainly for image data.

---

## Q5. Why CNN is better than ANN for images?

CNN preserves spatial structure and automatically extracts image features like edges, shapes, and textures. ANN treats image pixels as flat features and may lose spatial information.

---

## Q6. What is Convolution?

Convolution is the process of applying filters over an image to extract features.

---

## Q7. What is Pooling?

Pooling reduces feature map size and keeps important information. Max pooling keeps the maximum value from a region.

---

## Q8. What is Image Classification?

Image Classification predicts one class label for an image.

Example:

```text id="6hc0b8"
Input: Cat image
Output: Cat
```

---

## Q9. What is Object Detection?

Object Detection predicts object class and object location using bounding boxes.

---

## Q10. What is YOLO?

YOLO stands for You Only Look Once. It is a real-time object detection algorithm that predicts bounding boxes and class probabilities in one pass.

---

## Q11. What is Bounding Box?

Bounding box is a rectangle around an object in an image.

---

## Q12. What is IoU?

IoU stands for Intersection over Union. It measures overlap between predicted bounding box and actual bounding box.

---

## Q13. What is NMS?

NMS stands for Non-Maximum Suppression. It removes duplicate overlapping bounding boxes.

---

## Q14. What is mAP?

mAP stands for mean Average Precision. It is a common metric used to evaluate object detection models.

---

# 29. Final Summary Table

| Concept | Easy Meaning | Example |
|---|---|---|
| Computer Vision | Computer understands images/videos | Face detection |
| Image Processing | Modify/analyze image | Blur, edge detection |
| OpenCV | CV library | `cv2.imread()` |
| Image Classification | Predict image class | Cat/Dog |
| CNN | Neural network for images | Conv + Pool + Dense |
| Convolution | Extract image features | Edge detection |
| Pooling | Reduce feature size | MaxPooling |
| Object Detection | Class + location | Person box |
| Bounding Box | Rectangle around object | `x1, y1, x2, y2` |
| YOLO | Fast object detection | Real-time detection |
| IoU | Box overlap score | Higher is better |
| NMS | Removes duplicate boxes | Keeps best box |
| mAP | Detection metric | Higher is better |

---

# Final Interview Summary

```text id="dw582f"
Computer Vision is a field of AI that helps machines understand images and videos.

Image Processing is used to clean, transform, and analyze images. OpenCV is a popular library used for image processing tasks like resizing, grayscale conversion, thresholding, edge detection, and contour detection.

Image Classification predicts one label for an image, such as cat or dog.

CNN is the most common deep learning architecture for image data. It uses convolution layers to extract features, pooling layers to reduce size, and dense layers for final prediction.

Object Detection is different from classification because it predicts both object class and object location using bounding boxes.

YOLO stands for You Only Look Once. It is a fast object detection model that predicts bounding boxes, class labels, and confidence scores in one pass.

For interview projects, I can explain Cat vs Dog Classification using CNN or Object Detection using YOLO.
```
