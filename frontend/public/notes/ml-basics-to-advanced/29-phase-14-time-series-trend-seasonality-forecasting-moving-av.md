> **You asked:**
>
> Phase 14: Time Series
> Trend
> Seasonality
> Forecasting
> Moving Average
> ARIMA
> SARIMA
> Prophet
> LSTM Basics

# Phase 14: Time Series  
# Trend, Seasonality, Forecasting, Moving Average, ARIMA, SARIMA, Prophet, LSTM Basics

Time Series means data collected **over time**.

Examples:

```text
Daily sales
Monthly revenue
Stock price
Weather temperature
Website traffic
Electricity demand
Crop production by year
```

Simple meaning:

```text
Time Series = Date/Time + Value
```

Example:

| Date | Sales |
|---|---:|
| 2026-01-01 | 100 |
| 2026-01-02 | 120 |
| 2026-01-03 | 130 |
| 2026-01-04 | 125 |

---

# 1. What is Time Series?

## Easy Definition

Time Series is a sequence of data points arranged in time order.

Example:

```text
Jan Sales = 100
Feb Sales = 120
Mar Sales = 150
Apr Sales = 170
```

Here, sales are changing with time.

## Interview Answer

Time Series is data collected at regular or irregular time intervals. It is used to analyze past patterns and forecast future values.

---

# 2. Important Components of Time Series

Time series usually has these parts:

```text
Trend
Seasonality
Noise
Cyclic pattern
```

---

# 3. Trend

## Easy Definition

Trend means the **long-term direction** of data.

Simple meaning:

```text
Data is increasing, decreasing, or stable over time.
```

Example:

| Month | Sales |
|---|---:|
| Jan | 100 |
| Feb | 120 |
| Mar | 140 |
| Apr | 160 |

Here sales are increasing.

So trend is:

```text
Upward trend
```

---

## Types of Trend

| Trend Type | Meaning |
|---|---|
| Upward Trend | Values increase over time |
| Downward Trend | Values decrease over time |
| Flat Trend | Values remain almost stable |

---

## Example

```text
Company revenue increasing every year → Upward trend
Website traffic decreasing every month → Downward trend
Temperature almost same every day → Flat trend
```

---

# 4. Seasonality

## Easy Definition

Seasonality means a pattern that repeats after a fixed time period.

Simple meaning:

```text
Same pattern repeats daily, weekly, monthly, or yearly.
```

Example:

```text
Ice cream sales increase every summer.
Umbrella sales increase every rainy season.
Shopping sales increase every festival season.
```

---

## Types of Seasonality

| Type | Example |
|---|---|
| Daily seasonality | Website traffic high during daytime |
| Weekly seasonality | Restaurant sales high on weekends |
| Monthly seasonality | Salary credit at month-end |
| Yearly seasonality | Diwali sales every year |

---

## Trend + Seasonality Example

```text
Trend: Sales are increasing every year.
Seasonality: Sales jump every December.
```

genui{"charts_widget_v2":{"content":{"chartType":"line","meta":{"title":"Sales with trend and seasonality","description":"Sample monthly sales show an upward trend with repeated seasonal peaks.","footer":"Example data for learning time series concepts."},"xKey":"month","xAxisLabel":"Month","series":[{"dataKey":"sales","label":"Sales","axisLabel":"Sales","valueFormat":"integer"},{"dataKey":"movingAverage","label":"3-month moving average","axisLabel":"Sales","valueFormat":"integer"}],"data":[{"month":"Jan","sales":100,"movingAverage":100},{"month":"Feb","sales":115,"movingAverage":108},{"month":"Mar","sales":130,"movingAverage":115},{"month":"Apr","sales":125,"movingAverage":123},{"month":"May","sales":150,"movingAverage":135},{"month":"Jun","sales":170,"movingAverage":148},{"month":"Jul","sales":165,"movingAverage":162},{"month":"Aug","sales":190,"movingAverage":175},{"month":"Sep","sales":210,"movingAverage":188},{"month":"Oct","sales":205,"movingAverage":202},{"month":"Nov","sales":230,"movingAverage":215},{"month":"Dec","sales":280,"movingAverage":238}]},"language":"recharts-json"}}

---

# 5. Forecasting

## Easy Definition

Forecasting means predicting future values using past time series data.

Simple meaning:

```text
Past pattern → Future prediction
```

Example:

```text
Past 12 months sales → Predict next month sales
```

---

## Forecasting Examples

| Data | Forecast |
|---|---|
| Previous sales | Future sales |
| Past temperature | Tomorrow temperature |
| Website traffic | Next week traffic |
| Stock price | Future price |
| Electricity demand | Tomorrow demand |

---

## Interview Answer

Forecasting is the process of predicting future values based on historical time series patterns like trend, seasonality, and previous values.

---

# 6. Moving Average

## Easy Definition

Moving Average smooths time series data by taking the average of recent values.

Simple meaning:

```text
Moving Average removes small ups and downs and shows the main trend.
```

Pandas supports rolling-window calculations through `DataFrame.rolling()`, which is commonly used to compute moving averages over a fixed window. citeturn793920search6

---

## Example

Sales:

```text
100, 120, 140
```

3-day moving average:

```text
(100 + 120 + 140) / 3 = 120
```

---

## Moving Average Types

| Type | Meaning |
|---|---|
| Simple Moving Average | Average of fixed recent values |
| Weighted Moving Average | Recent values get more weight |
| Exponential Moving Average | Recent values get exponentially higher importance |

---

## Moving Average Code

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame({
    "Date": pd.date_range(start="2026-01-01", periods=10, freq="D"),
    "Sales": [100, 120, 130, 125, 150, 170, 165, 190, 210, 205]
})

# 3-day moving average
df["Moving_Average"] = df["Sales"].rolling(window=3).mean()

print(df)

plt.plot(df["Date"], df["Sales"], label="Actual Sales")
plt.plot(df["Date"], df["Moving_Average"], label="3-Day Moving Average")
plt.xlabel("Date")
plt.ylabel("Sales")
plt.title("Moving Average")
plt.legend()
plt.show()
```

---

## Interview Answer

Moving Average is a smoothing technique that calculates the average of recent observations. It helps identify trends by reducing short-term fluctuations.

---

# 7. ARIMA

## Easy Definition

ARIMA is a statistical time series forecasting model.

Full form:

```text
ARIMA = AutoRegressive Integrated Moving Average
```

Simple meaning:

```text
ARIMA predicts future values using past values, differencing, and past errors.
```

Statsmodels provides an `ARIMA` model interface for ARIMA-type models, including models with exogenous regressors and seasonal components. citeturn793920search14

---

## ARIMA Components

ARIMA has 3 parts:

```text
ARIMA(p, d, q)
```

| Term | Full Form | Easy Meaning |
|---|---|---|
| p | AutoRegressive order | How many past values to use |
| d | Integrated order | How many times differencing is done |
| q | Moving Average order | How many past errors to use |

---

## A. AR — AutoRegressive

Uses previous values.

Example:

```text
Today sales depends on yesterday sales.
```

Formula idea:

```text
Sales_today = previous sales + error
```

---

## B. I — Integrated

Means differencing to make data stationary.

Example:

Original data:

```text
100, 120, 150, 180
```

First difference:

```text
20, 30, 30
```

Differencing helps remove trend.

---

## C. MA — Moving Average

Uses previous forecast errors.

Simple meaning:

```text
Model learns from past mistakes.
```

---

## Stationary Data

ARIMA works best when data is stationary.

Stationary means:

```text
Mean is stable
Variance is stable
Pattern does not change too much over time
```

If data has trend, we use differencing.

---

## ARIMA Code

```python
import pandas as pd
import matplotlib.pyplot as plt
from statsmodels.tsa.arima.model import ARIMA

# Sample time series
df = pd.DataFrame({
    "Date": pd.date_range(start="2026-01-01", periods=20, freq="D"),
    "Sales": [100, 105, 110, 120, 130, 128, 135, 140, 145, 150,
              155, 160, 158, 165, 170, 175, 180, 185, 190, 195]
})

df.set_index("Date", inplace=True)

# ARIMA model
model = ARIMA(df["Sales"], order=(1, 1, 1))
model_fit = model.fit()

# Forecast next 5 days
forecast = model_fit.forecast(steps=5)

print(forecast)

# Plot
plt.plot(df.index, df["Sales"], label="Actual")
plt.plot(forecast.index, forecast, label="Forecast")
plt.legend()
plt.show()
```

---

## When to Use ARIMA?

Use ARIMA when:

```text
Data is univariate
Data has trend
No strong seasonality
You want statistical forecasting
Dataset is not very large
```

## Interview Answer

ARIMA is a time series forecasting model that uses past values, differencing, and past errors. It is represented as ARIMA(p, d, q), where p is autoregressive order, d is differencing order, and q is moving average order.

---

# 8. SARIMA

## Easy Definition

SARIMA is an extension of ARIMA that handles seasonality.

Full form:

```text
SARIMA = Seasonal ARIMA
```

Simple meaning:

```text
ARIMA + Seasonality
```

Statsmodels provides `SARIMAX`, a seasonal ARIMA-style model that supports seasonal order and optional exogenous variables. citeturn793920search0

---

## SARIMA Formula

```text
SARIMA(p, d, q)(P, D, Q, s)
```

Where:

| Term | Meaning |
|---|---|
| p, d, q | Non-seasonal ARIMA terms |
| P, D, Q | Seasonal ARIMA terms |
| s | Seasonal period |

---

## Seasonal Period Examples

| Data Frequency | Seasonality | s |
|---|---|---:|
| Monthly data | Yearly seasonality | 12 |
| Quarterly data | Yearly seasonality | 4 |
| Daily data | Weekly seasonality | 7 |
| Hourly data | Daily seasonality | 24 |

---

## SARIMA Code

```python
import pandas as pd
import matplotlib.pyplot as plt
from statsmodels.tsa.statespace.sarimax import SARIMAX

# Monthly sales data
df = pd.DataFrame({
    "Date": pd.date_range(start="2024-01-01", periods=24, freq="M"),
    "Sales": [100, 110, 120, 130, 160, 180, 170, 165, 150, 140, 130, 200,
              120, 130, 140, 150, 180, 200, 190, 185, 170, 160, 150, 230]
})

df.set_index("Date", inplace=True)

# SARIMA model
model = SARIMAX(
    df["Sales"],
    order=(1, 1, 1),
    seasonal_order=(1, 1, 1, 12)
)

model_fit = model.fit()

# Forecast next 6 months
forecast = model_fit.forecast(steps=6)

print(forecast)

plt.plot(df.index, df["Sales"], label="Actual")
plt.plot(forecast.index, forecast, label="Forecast")
plt.legend()
plt.show()
```

---

## When to Use SARIMA?

Use SARIMA when:

```text
Data has seasonality
Monthly or daily repeating pattern exists
You want interpretable statistical model
Dataset is not very large
```

## Interview Answer

SARIMA is a seasonal version of ARIMA. It handles both trend and seasonal patterns using non-seasonal parameters `(p,d,q)` and seasonal parameters `(P,D,Q,s)`.

---

# 9. Prophet

## Easy Definition

Prophet is a forecasting tool developed for time series forecasting.

Simple meaning:

```text
Prophet is useful when data has trend, seasonality, holidays, and missing values.
```

Prophet’s official quick start describes it as a forecasting procedure available in Python and R, designed to produce automated forecasts that can also be tuned manually. citeturn793920search2

---

## Prophet Needs Two Columns

Prophet expects:

| Column | Meaning |
|---|---|
| `ds` | Date column |
| `y` | Value to forecast |

Example:

| ds | y |
|---|---:|
| 2026-01-01 | 100 |
| 2026-01-02 | 120 |

---

## Install Prophet

```bash
pip install prophet
```

---

## Prophet Code

```python
import pandas as pd
from prophet import Prophet

# Sample data
df = pd.DataFrame({
    "ds": pd.date_range(start="2026-01-01", periods=30, freq="D"),
    "y": [100, 105, 110, 115, 120, 118, 125, 130, 135, 140,
          145, 150, 148, 155, 160, 165, 170, 175, 180, 185,
          190, 188, 195, 200, 205, 210, 215, 220, 225, 230]
})

# Create model
model = Prophet()

# Train model
model.fit(df)

# Create future dates
future = model.make_future_dataframe(periods=7)

# Forecast
forecast = model.predict(future)

print(forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail())

# Plot forecast
model.plot(forecast)
```

---

## Prophet Output

| Column | Meaning |
|---|---|
| `yhat` | Forecast value |
| `yhat_lower` | Lower prediction range |
| `yhat_upper` | Upper prediction range |

---

## When to Use Prophet?

Use Prophet when:

```text
Business forecasting
Data has trend and seasonality
Data has missing values
Data has holidays/events
You want quick forecasting
```

## Interview Answer

Prophet is a time series forecasting tool that works well with trend, seasonality, holidays, and missing values. It requires two columns: `ds` for date and `y` for target value.

---

# 10. LSTM Basics for Time Series

## Easy Definition

LSTM is a deep learning model used for sequence data.

Full form:

```text
LSTM = Long Short-Term Memory
```

Simple meaning:

```text
LSTM remembers previous information and uses it to predict future values.
```

Keras provides an `LSTM` recurrent layer for sequence modeling; TensorFlow’s API notes that the layer can use optimized GPU kernels when supported conditions are met. citeturn793920search5

---

## Why LSTM for Time Series?

Time series depends on previous values.

Example:

```text
Tomorrow sales may depend on last 7 days sales.
```

LSTM can learn these sequence patterns.

---

## LSTM Input Shape

LSTM expects 3D input:

```text
(samples, time_steps, features)
```

Example:

```text
100 samples
7 previous days
1 feature: sales
```

Shape:

```text
(100, 7, 1)
```

---

## LSTM Code for Forecasting

```python
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

# Sample data
sales = np.array([
    100, 105, 110, 115, 120, 125, 130, 128, 135, 140,
    145, 150, 155, 160, 165, 170, 175, 180, 185, 190,
    195, 200, 205, 210, 215, 220, 225, 230
]).reshape(-1, 1)

# Scale data
scaler = MinMaxScaler()
sales_scaled = scaler.fit_transform(sales)

# Create sequences
def create_sequences(data, time_steps=5):
    X = []
    y = []

    for i in range(len(data) - time_steps):
        X.append(data[i:i + time_steps])
        y.append(data[i + time_steps])

    return np.array(X), np.array(y)

time_steps = 5
X, y = create_sequences(sales_scaled, time_steps)

# X shape: samples, time_steps, features
print(X.shape)

# Build LSTM model
model = Sequential([
    LSTM(50, activation="relu", input_shape=(time_steps, 1)),
    Dense(1)
])

# Compile
model.compile(
    optimizer="adam",
    loss="mse"
)

# Train
model.fit(
    X,
    y,
    epochs=100,
    batch_size=4,
    verbose=1
)

# Predict next value using last 5 values
last_sequence = sales_scaled[-time_steps:]
last_sequence = last_sequence.reshape(1, time_steps, 1)

predicted_scaled = model.predict(last_sequence)

# Convert back to original scale
predicted_sales = scaler.inverse_transform(predicted_scaled)

print("Next Forecast:", predicted_sales[0][0])
```

---

## When to Use LSTM?

Use LSTM when:

```text
Large time series dataset
Complex non-linear pattern
Long-term dependency exists
Sequence pattern is important
Deep learning approach is needed
```

## Limitations of LSTM

```text
Needs more data
Needs scaling
Takes more training time
Less interpretable than ARIMA/SARIMA
Needs hyperparameter tuning
```

## Interview Answer

LSTM is a recurrent neural network model used for sequence data. It can remember previous information and is useful for time series forecasting when the data has complex patterns and long-term dependencies.

---

# 11. ARIMA vs SARIMA vs Prophet vs LSTM

| Model | Best For | Handles Seasonality? | Data Needed | Interpretability |
|---|---|---:|---|---|
| Moving Average | Smoothing trend | No | Small | High |
| ARIMA | Non-seasonal forecasting | No | Small/medium | High |
| SARIMA | Seasonal forecasting | Yes | Small/medium | High |
| Prophet | Business forecasting | Yes | Medium | Medium |
| LSTM | Complex sequence forecasting | Yes, if learned | Large | Low |

---

# 12. Which Model Should You Use?

| Situation | Best Choice |
|---|---|
| Need smoothing | Moving Average |
| Data has trend only | ARIMA |
| Data has trend + seasonality | SARIMA |
| Business data with holidays | Prophet |
| Large complex data | LSTM |
| Need explainable model | ARIMA/SARIMA |
| Need quick practical forecast | Prophet |
| Need deep learning approach | LSTM |

---

# 13. Complete Time Series Workflow

```text
1. Load time series data
2. Convert date column to datetime
3. Sort by date
4. Set date column as index
5. Plot the data
6. Check trend and seasonality
7. Handle missing values
8. Apply smoothing if needed
9. Split train/test based on time
10. Train forecasting model
11. Forecast future values
12. Evaluate using MAE, RMSE, MAPE
```

---

# 14. Time Series Train-Test Split

Important point:

```text
Do not randomly split time series data.
```

Wrong:

```python
train_test_split(X, y, shuffle=True)
```

Correct:

```text
Past data → Train
Future data → Test
```

Example:

```text
Train: Jan to Oct
Test: Nov to Dec
```

Why?

```text
In real life, future data is not available during training.
```

---

# 15. Forecasting Evaluation Metrics

| Metric | Meaning |
|---|---|
| MAE | Average absolute error |
| RMSE | Error with large-error penalty |
| MAPE | Percentage error |
| MASE | Scaled forecasting error |

Example:

```python
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

actual = [100, 120, 130]
predicted = [110, 115, 135]

mae = mean_absolute_error(actual, predicted)
rmse = np.sqrt(mean_squared_error(actual, predicted))

print("MAE:", mae)
print("RMSE:", rmse)
```

---

# 16. Most Asked Interview Questions

## Q1. What is Time Series?

Time Series is data collected over time, such as daily sales, monthly revenue, or stock prices.

---

## Q2. What is Trend?

Trend is the long-term upward, downward, or stable movement in time series data.

---

## Q3. What is Seasonality?

Seasonality is a repeating pattern that occurs at fixed intervals like daily, weekly, monthly, or yearly.

---

## Q4. What is Forecasting?

Forecasting means predicting future values using past time series data.

---

## Q5. What is Moving Average?

Moving Average is a smoothing technique that averages recent observations to reduce noise and show trend.

---

## Q6. What is ARIMA?

ARIMA is a forecasting model that uses past values, differencing, and past errors. It is written as ARIMA(p, d, q).

---

## Q7. What do p, d, q mean in ARIMA?

```text
p = number of past values
d = number of differencing steps
q = number of past errors
```

---

## Q8. What is SARIMA?

SARIMA is a seasonal version of ARIMA. It handles seasonality using seasonal parameters `(P,D,Q,s)`.

---

## Q9. ARIMA vs SARIMA?

| ARIMA | SARIMA |
|---|---|
| Handles trend | Handles trend + seasonality |
| No seasonal component | Has seasonal component |
| ARIMA(p,d,q) | SARIMA(p,d,q)(P,D,Q,s) |

---

## Q10. What is Prophet?

Prophet is a forecasting tool useful for business time series with trend, seasonality, holidays, and missing values.

---

## Q11. What is LSTM?

LSTM is a deep learning model for sequence data. It can remember previous values and is useful for complex time series forecasting.

---

## Q12. Why should time series not be randomly split?

Because time series has time order. We should train on past data and test on future data to avoid data leakage.

---

# 17. Final Summary Table

| Concept | Easy Meaning | Example |
|---|---|---|
| Time Series | Data over time | Daily sales |
| Trend | Long-term direction | Sales increasing |
| Seasonality | Repeating pattern | December sales peak |
| Forecasting | Predict future value | Next month sales |
| Moving Average | Smooths data | 7-day average |
| ARIMA | Trend-based statistical model | Sales forecast |
| SARIMA | Seasonal ARIMA | Monthly seasonal sales |
| Prophet | Business forecasting tool | Holiday-aware forecast |
| LSTM | Deep learning sequence model | Complex demand forecast |

---

# Final Interview Summary

```text
Time Series is data collected over time. It is used to analyze past patterns and forecast future values.

Trend shows the long-term direction of data, while seasonality shows repeating patterns at fixed intervals.

Forecasting means predicting future values using historical data.

Moving Average is used to smooth data and understand trends.

ARIMA is used for non-seasonal time series forecasting and has parameters p, d, and q.

SARIMA is an extension of ARIMA that handles seasonality using seasonal parameters P, D, Q, and s.

Prophet is useful for business forecasting because it can handle trend, seasonality, holidays, and missing values.

LSTM is a deep learning model for sequence data and is useful when the time series has complex non-linear patterns.

For interviews, I can say: I use ARIMA for trend-based forecasting, SARIMA for seasonal data, Prophet for business forecasting, and LSTM for large complex sequence data.
```
