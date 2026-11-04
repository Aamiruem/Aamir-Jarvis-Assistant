> **You asked:**
>
> Phase 7: Unsupervised Learning
> Module 14: Clustering
> K-Means
> Hierarchical Clustering
> DBSCAN
> Gaussian Mixture Model

I’ll explain clustering as unsupervised learning: what each algorithm does, how it works, when to use it, code, advantages, limitations, and interview answers.

# Phase 7: Unsupervised Learning  
# Module 14: Clustering

Clustering is an **unsupervised machine learning technique** used to group similar data points together.

In clustering, we do **not have target/output labels**.

```text
Supervised Learning:
Input + Output label
Example: Customer data + Purchased/Not Purchased

Unsupervised Learning:
Only input data
Example: Customer data only
```

Clustering is used for:

```text
Customer segmentation
Market segmentation
Image segmentation
Anomaly detection
Document grouping
Recommendation systems
Fraud pattern detection
Student grouping
Product grouping
```

---

# 1. What is Clustering?

## Easy Definition

Clustering means dividing data into groups based on similarity.

Simple meaning:

```text
Similar data points stay in the same group.
Different data points stay in different groups.
```

Example:

Suppose we have customers:

| Customer | Income | Spending Score |
|---|---:|---:|
| A | High | High |
| B | High | High |
| C | Low | Low |
| D | Low | Low |

Clustering can create groups like:

```text
Cluster 1: High income, high spending customers
Cluster 2: Low income, low spending customers
```

## Interview Answer

Clustering is an unsupervised learning technique used to group similar data points together without using target labels.

---

# 2. K-Means Clustering

## Easy Definition

K-Means groups data into `K` clusters.

Here:

```text
K = number of clusters
```

Example:

```text
K = 3 means data will be divided into 3 groups.
```

---

## How K-Means Works

K-Means works in these steps:

```text
1. Choose number of clusters K.
2. Randomly select K centroids.
3. Assign each data point to nearest centroid.
4. Update centroids by taking mean of assigned points.
5. Repeat until centroids stop changing.
```

Centroid means **center point of a cluster**.

---

## Simple Example

Suppose customer data has 2 features:

```text
Income
Spending Score
```

If we choose:

```text
K = 3
```

Then K-Means may create:

```text
Cluster 0: Low income, low spending
Cluster 1: High income, high spending
Cluster 2: Medium income, medium spending
```

---

## K-Means Code

```python
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# Sample data
df = pd.DataFrame({
    "Income": [15000, 18000, 20000, 60000, 65000, 70000, 120000, 130000, 140000],
    "Spending_Score": [20, 25, 30, 60, 65, 70, 85, 90, 95]
})

# Feature scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df)

# K-Means model
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)

df["Cluster"] = kmeans.fit_predict(X_scaled)

print(df)
```

---

## Elbow Method

## Easy Definition

Elbow Method helps us choose the best value of `K`.

We try different K values and calculate WCSS.

```text
WCSS = Within Cluster Sum of Squares
```

Simple meaning:

```text
WCSS tells how compact clusters are.
Lower WCSS means better compactness.
```

## Code

```python
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

wcss = []

for k in range(1, 10):
    model = KMeans(n_clusters=k, random_state=42, n_init=10)
    model.fit(X_scaled)
    wcss.append(model.inertia_)

plt.plot(range(1, 10), wcss, marker="o")
plt.xlabel("Number of Clusters K")
plt.ylabel("WCSS")
plt.title("Elbow Method")
plt.show()
```

## How to Read Elbow Graph

```text
Find the point where WCSS stops decreasing quickly.
That point is called the elbow.
```

Example:

```text
If graph bends at K = 3,
then K = 3 is a good choice.
```

---

## Advantages of K-Means

```text
Simple and easy to understand
Fast for large datasets
Works well for round-shaped clusters
Good for customer segmentation
```

## Limitations of K-Means

```text
Need to choose K manually
Sensitive to outliers
Sensitive to feature scaling
Does not work well with irregular cluster shapes
Random initialization can affect result
```

## When to Use K-Means

Use K-Means when:

```text
You know approximate number of clusters
Data has round/spherical clusters
Dataset is large
You need fast clustering
```

## Interview Answer

K-Means is an unsupervised clustering algorithm that divides data into K clusters. It assigns each data point to the nearest centroid and updates centroids until clusters become stable.

---

# 3. Hierarchical Clustering

## Easy Definition

Hierarchical Clustering creates a tree-like structure of clusters.

Simple meaning:

```text
It starts with individual points and slowly merges them into bigger clusters.
```

The tree diagram is called a **dendrogram**.

---

## Types of Hierarchical Clustering

| Type | Meaning |
|---|---|
| Agglomerative | Bottom-up approach |
| Divisive | Top-down approach |

---

## A. Agglomerative Clustering

This is most commonly used.

Steps:

```text
1. Each data point starts as its own cluster.
2. Closest clusters are merged.
3. Again closest clusters are merged.
4. Continue until one big cluster is formed.
```

Simple meaning:

```text
Small groups → bigger groups → one big group
```

---

## B. Divisive Clustering

Opposite of agglomerative.

Steps:

```text
1. Start with one big cluster.
2. Split into smaller clusters.
3. Continue splitting.
```

Simple meaning:

```text
One big group → smaller groups
```

---

## Linkage Methods

Linkage means how distance between clusters is calculated.

| Linkage | Meaning |
|---|---|
| Single Linkage | Distance between nearest points |
| Complete Linkage | Distance between farthest points |
| Average Linkage | Average distance between points |
| Ward Linkage | Minimizes variance inside clusters |

Most commonly used:

```text
Ward linkage
```

---

## Dendrogram Code

```python
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from scipy.cluster.hierarchy import dendrogram, linkage

df = pd.DataFrame({
    "Income": [15000, 18000, 20000, 60000, 65000, 70000, 120000, 130000, 140000],
    "Spending_Score": [20, 25, 30, 60, 65, 70, 85, 90, 95]
})

scaler = StandardScaler()
X_scaled = scaler.fit_transform(df)

linked = linkage(X_scaled, method="ward")

plt.figure(figsize=(8, 5))
dendrogram(linked)
plt.title("Dendrogram")
plt.xlabel("Data Points")
plt.ylabel("Distance")
plt.show()
```

---

## Hierarchical Clustering Code

```python
from sklearn.cluster import AgglomerativeClustering

model = AgglomerativeClustering(n_clusters=3, linkage="ward")

df["Cluster"] = model.fit_predict(X_scaled)

print(df)
```

---

## Advantages of Hierarchical Clustering

```text
No need to choose K initially
Dendrogram gives visual understanding
Good for small datasets
Easy to interpret
```

## Limitations

```text
Slow for large datasets
Sensitive to noise and outliers
Once clusters are merged, they cannot be undone
```

## When to Use

Use Hierarchical Clustering when:

```text
Dataset is small or medium
You want visual cluster hierarchy
You want dendrogram
You are not sure about number of clusters
```

## Interview Answer

Hierarchical Clustering is an unsupervised algorithm that creates a hierarchy of clusters. In agglomerative clustering, each point starts as a separate cluster and similar clusters are merged step by step. The result can be visualized using a dendrogram.

---

# 4. DBSCAN

## Easy Definition

DBSCAN stands for:

```text
Density-Based Spatial Clustering of Applications with Noise
```

Simple meaning:

```text
DBSCAN forms clusters based on dense regions of data.
```

It can also detect outliers/noise.

---

## Important Terms

| Term | Meaning |
|---|---|
| `eps` | Radius around a point |
| `min_samples` | Minimum points needed to form dense region |
| Core Point | Has enough neighbors within eps |
| Border Point | Near core point but not enough neighbors |
| Noise Point | Does not belong to any cluster |

---

## DBSCAN Intuition

Suppose points are grouped closely.

```text
Dense area → cluster
Far isolated point → noise/outlier
```

DBSCAN does not need number of clusters in advance.

---

## How DBSCAN Works

```text
1. Pick a point.
2. Check points around it within eps radius.
3. If enough points exist, create a cluster.
4. Expand cluster by connecting nearby dense points.
5. Points not connected to any cluster become noise.
```

---

## DBSCAN Code

```python
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler

df = pd.DataFrame({
    "Income": [15000, 18000, 20000, 60000, 65000, 70000, 120000, 130000, 140000, 300000],
    "Spending_Score": [20, 25, 30, 60, 65, 70, 85, 90, 95, 10]
})

scaler = StandardScaler()
X_scaled = scaler.fit_transform(df)

model = DBSCAN(eps=0.8, min_samples=2)

df["Cluster"] = model.fit_predict(X_scaled)

print(df)
```

---

## DBSCAN Output Meaning

```text
Cluster = 0, 1, 2 means normal clusters
Cluster = -1 means noise/outlier
```

Example:

```text
Customer with very high income but very low spending may become -1.
```

---

## Advantages of DBSCAN

```text
No need to choose number of clusters
Can find irregular shaped clusters
Can detect outliers
Works well with dense clusters
```

## Limitations

```text
Choosing eps is difficult
Does not work well when clusters have different densities
Sensitive to feature scaling
Not ideal for very high-dimensional data
```

## When to Use

Use DBSCAN when:

```text
You do not know number of clusters
Data has noise/outliers
Clusters have irregular shapes
You want anomaly detection
```

## Interview Answer

DBSCAN is a density-based clustering algorithm. It groups points in dense regions and marks isolated points as noise. It does not require the number of clusters in advance.

---

# 5. Gaussian Mixture Model — GMM

## Easy Definition

Gaussian Mixture Model is a probabilistic clustering algorithm.

Simple meaning:

```text
GMM assumes data is made from multiple normal distributions.
```

Unlike K-Means, GMM gives probability of belonging to each cluster.

---

## Hard Clustering vs Soft Clustering

| Hard Clustering | Soft Clustering |
|---|---|
| One point belongs to only one cluster | One point can belong to clusters with probabilities |
| K-Means | GMM |
| Example: Cluster 1 only | Example: 70% Cluster 1, 30% Cluster 2 |

---

## Example

For one customer, GMM may say:

```text
Cluster 0 probability = 0.80
Cluster 1 probability = 0.15
Cluster 2 probability = 0.05
```

Final cluster:

```text
Cluster 0
```

Because it has highest probability.

---

## GMM Code

```python
import pandas as pd
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler

df = pd.DataFrame({
    "Income": [15000, 18000, 20000, 60000, 65000, 70000, 120000, 130000, 140000],
    "Spending_Score": [20, 25, 30, 60, 65, 70, 85, 90, 95]
})

scaler = StandardScaler()
X_scaled = scaler.fit_transform(df)

model = GaussianMixture(n_components=3, random_state=42)

df["Cluster"] = model.fit_predict(X_scaled)

probabilities = model.predict_proba(X_scaled)

print(df)
print(probabilities)
```

---

## GMM Important Parameters

| Parameter | Meaning |
|---|---|
| `n_components` | Number of Gaussian distributions/clusters |
| `covariance_type` | Shape of clusters |
| `random_state` | Reproducibility |

---

## Advantages of GMM

```text
Soft clustering
Can model elliptical clusters
Gives probability for each cluster
More flexible than K-Means
```

## Limitations

```text
Need to choose number of components
Can be sensitive to initialization
Assumes Gaussian distribution
Can overfit with too many components
```

## When to Use

Use GMM when:

```text
Clusters are overlapping
You want probability of cluster membership
Data looks like Gaussian distributions
Clusters are elliptical, not just round
```

## Interview Answer

Gaussian Mixture Model is a probabilistic clustering algorithm that assumes data is generated from multiple Gaussian distributions. It performs soft clustering by assigning probabilities to each cluster.

---

# 6. Clustering Evaluation Metrics

In unsupervised learning, we usually do not have true labels. So we use internal metrics.

---

## A. Inertia

Used mainly in K-Means.

```text
Inertia = Sum of squared distances from points to their cluster centroid
```

Lower inertia means compact clusters.

```python
print(kmeans.inertia_)
```

---

## B. Silhouette Score

Silhouette Score checks how well-separated clusters are.

Range:

```text
+1 → Very good clustering
 0 → Overlapping clusters
-1 → Wrong clustering
```

Code:

```python
from sklearn.metrics import silhouette_score

score = silhouette_score(X_scaled, df["Cluster"])

print("Silhouette Score:", score)
```

---

## C. Davies-Bouldin Score

Lower Davies-Bouldin score is better.

```python
from sklearn.metrics import davies_bouldin_score

score = davies_bouldin_score(X_scaled, df["Cluster"])

print("Davies-Bouldin Score:", score)
```

---

# 7. Full Clustering Code: Compare All Models

```python
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score

# Dataset
df = pd.DataFrame({
    "Income": [15000, 18000, 20000, 60000, 65000, 70000, 120000, 130000, 140000, 300000],
    "Spending_Score": [20, 25, 30, 60, 65, 70, 85, 90, 95, 10]
})

# Scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df)

# Models
models = {
    "KMeans": KMeans(n_clusters=3, random_state=42, n_init=10),
    "Hierarchical": AgglomerativeClustering(n_clusters=3),
    "DBSCAN": DBSCAN(eps=0.8, min_samples=2),
    "GMM": GaussianMixture(n_components=3, random_state=42)
}

for name, model in models.items():
    if name == "GMM":
        labels = model.fit_predict(X_scaled)
    else:
        labels = model.fit_predict(X_scaled)

    print("\nModel:", name)
    print("Labels:", labels)

    # Silhouette score needs at least 2 clusters
    # Ignore DBSCAN noise-only case
    if len(set(labels)) > 1 and len(set(labels)) < len(labels):
        try:
            print("Silhouette Score:", silhouette_score(X_scaled, labels))
        except:
            print("Silhouette Score not possible")
```

---

# 8. Customer Segmentation Project

## Project Name

```text
Customer Segmentation using Clustering
```

## Problem Statement

Group customers based on income and spending behavior.

## Dataset Columns

| Column | Meaning |
|---|---|
| CustomerID | Customer unique ID |
| Age | Customer age |
| Annual Income | Income of customer |
| Spending Score | Spending behavior score |

---

## Project Steps

```text
1. Import dataset
2. Perform EDA
3. Select useful features
4. Apply feature scaling
5. Use Elbow Method to choose K
6. Train K-Means model
7. Assign cluster labels
8. Analyze each cluster
9. Give business recommendations
```

---

## Project Code

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

# Sample customer data
df = pd.DataFrame({
    "CustomerID": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "Age": [22, 25, 23, 45, 48, 50, 35, 37, 60, 62],
    "Annual_Income": [15000, 18000, 20000, 60000, 65000, 70000, 90000, 95000, 120000, 130000],
    "Spending_Score": [20, 25, 30, 65, 70, 75, 40, 42, 85, 90]
})

# Select features
X = df[["Annual_Income", "Spending_Score"]]

# Scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Elbow method
wcss = []

for k in range(1, 8):
    model = KMeans(n_clusters=k, random_state=42, n_init=10)
    model.fit(X_scaled)
    wcss.append(model.inertia_)

plt.plot(range(1, 8), wcss, marker="o")
plt.xlabel("Number of Clusters")
plt.ylabel("WCSS")
plt.title("Elbow Method")
plt.show()

# Train final model
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
df["Cluster"] = kmeans.fit_predict(X_scaled)

print(df)

# Cluster analysis
print(df.groupby("Cluster")[["Annual_Income", "Spending_Score"]].mean())

# Visualization
sns.scatterplot(
    data=df,
    x="Annual_Income",
    y="Spending_Score",
    hue="Cluster"
)
plt.title("Customer Segments")
plt.show()

# Evaluation
score = silhouette_score(X_scaled, df["Cluster"])
print("Silhouette Score:", score)
```

---

# 9. How to Explain This Project in Interview

```text
I built a customer segmentation project using clustering.

The goal was to group customers based on annual income and spending score.

First, I performed EDA and selected useful numerical features. Then I applied feature scaling because clustering algorithms depend on distance.

I used the Elbow Method to find the best number of clusters and trained a K-Means model. After that, I assigned cluster labels to each customer and analyzed the average income and spending score of each cluster.

This helped identify customer groups like low-income low-spending customers, medium-income medium-spending customers, and high-income high-spending customers.
```

---

# 10. K-Means vs Hierarchical vs DBSCAN vs GMM

| Algorithm | Main Idea | Need Number of Clusters? | Handles Outliers? | Best For |
|---|---|---:|---:|---|
| K-Means | Centroid-based clustering | Yes | No | Fast customer segmentation |
| Hierarchical | Tree-based clustering | Not initially | No | Small datasets, dendrogram |
| DBSCAN | Density-based clustering | No | Yes | Irregular clusters, noise detection |
| GMM | Probability-based clustering | Yes | Limited | Overlapping clusters |

---

# 11. Scaling Requirement

Clustering usually needs feature scaling because most clustering algorithms use distance.

| Algorithm | Scaling Needed? |
|---|---|
| K-Means | Yes |
| Hierarchical | Yes |
| DBSCAN | Yes |
| GMM | Recommended |

Why?

```text
If one feature has large values, it can dominate distance calculation.
```

Example:

```text
Age: 20 to 60
Income: 15000 to 150000
```

Income will dominate unless scaling is applied.

---

# 12. Most Asked Interview Questions

## Q1. What is clustering?

Clustering is an unsupervised learning technique used to group similar data points together.

---

## Q2. What is K-Means?

K-Means is a centroid-based clustering algorithm that divides data into K clusters by assigning each point to the nearest centroid.

---

## Q3. How do you choose K in K-Means?

We can choose K using:

```text
Elbow Method
Silhouette Score
Domain knowledge
```

---

## Q4. What is centroid?

Centroid is the center point of a cluster. In K-Means, centroids are updated by taking the mean of points in each cluster.

---

## Q5. What is WCSS?

WCSS means Within Cluster Sum of Squares. It measures how compact clusters are.

---

## Q6. What is Hierarchical Clustering?

Hierarchical Clustering creates a tree-like structure of clusters. It can be visualized using a dendrogram.

---

## Q7. What is a dendrogram?

A dendrogram is a tree diagram that shows how clusters are merged step by step in hierarchical clustering.

---

## Q8. What is DBSCAN?

DBSCAN is a density-based clustering algorithm that groups dense regions and marks isolated points as noise.

---

## Q9. What are `eps` and `min_samples` in DBSCAN?

```text
eps = radius around a point
min_samples = minimum number of points needed to form a dense region
```

---

## Q10. What is noise in DBSCAN?

Noise points are outliers that do not belong to any cluster. DBSCAN labels them as `-1`.

---

## Q11. What is GMM?

GMM stands for Gaussian Mixture Model. It is a probabilistic clustering algorithm that assumes data comes from multiple Gaussian distributions.

---

## Q12. K-Means vs GMM?

| K-Means | GMM |
|---|---|
| Hard clustering | Soft clustering |
| Uses distance to centroid | Uses probability |
| Round clusters | Elliptical clusters |
| Faster | More flexible |

---

## Q13. K-Means vs DBSCAN?

| K-Means | DBSCAN |
|---|---|
| Need K | No need K |
| Finds spherical clusters | Finds irregular clusters |
| Sensitive to outliers | Detects outliers |
| Every point assigned to cluster | Noise points marked as -1 |

---

# 13. Final Summary

```text
Clustering is an unsupervised learning method used to group similar data points without target labels.

K-Means divides data into K clusters using centroids. It is fast and simple but needs the number of clusters in advance.

Hierarchical Clustering creates a tree-like structure of clusters and can be visualized using a dendrogram.

DBSCAN creates clusters based on dense regions and can detect outliers as noise. It does not require the number of clusters in advance.

Gaussian Mixture Model is a probabilistic clustering algorithm that performs soft clustering and gives probability of each point belonging to each cluster.

For clustering, feature scaling is very important because most algorithms depend on distance.

Common clustering evaluation methods are Elbow Method, Silhouette Score, Inertia, and Davies-Bouldin Score.
```

## Final Interview Summary

```text
Clustering is used when we do not have target labels and want to discover hidden groups in data.

I can use K-Means for fast centroid-based clustering, Hierarchical Clustering when I want a dendrogram, DBSCAN when data has noise or irregular clusters, and GMM when I need probability-based soft clustering.

In real projects, clustering is commonly used for customer segmentation, product grouping, anomaly detection, and market analysis.
```
