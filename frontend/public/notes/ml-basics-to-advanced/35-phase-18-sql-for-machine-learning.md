> **You asked:**
>
> Phase 18: SQL for Machine Learning
> SELECT
> WHERE
> GROUP BY
> HAVING
> JOIN
> Window Functions
> CTE
> Views
> Stored Procedures
> Data Cleaning Queries

# Phase 18: SQL for Machine Learning  
## SELECT, WHERE, GROUP BY, HAVING, JOIN, Window Functions, CTE, Views, Stored Procedures, Data Cleaning Queries

SQL is very important in Machine Learning because real-world data mostly comes from databases.

Simple meaning:

```text
SQL for ML = Extract data + clean data + create features + prepare dataset for model training
```

In real ML projects, before Python/ML model, we use SQL to:

```text
1. Get required columns
2. Filter useful records
3. Join multiple tables
4. Clean missing/duplicate data
5. Create new features
6. Aggregate customer behavior
7. Prepare final training dataset
```

---

# 1. SQL for ML Workflow

```text
Raw Database Tables
        ↓
SQL Query
        ↓
Cleaned Dataset
        ↓
Feature Engineering
        ↓
ML Model Training
```

Example:

```text
Customer table + Order table + Payment table
        ↓
SQL JOIN + GROUP BY + Window Function
        ↓
Final ML dataset
        ↓
Customer churn prediction model
```

---

# 2. Sample Tables for Practice

We will use these tables:

```text
customers
orders
payments
```

---

## Create `customers` Table

```sql
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    customer_name VARCHAR(100),
    gender VARCHAR(20),
    city VARCHAR(50),
    age INT,
    signup_date DATE,
    churn INT
);
```

---

## Insert Data

```sql
INSERT INTO customers 
(customer_id, customer_name, gender, city, age, signup_date, churn)
VALUES
(1, 'Aamir', 'Male', 'Delhi', 24, '2024-01-10', 0),
(2, 'Rahul', 'Male', 'Mumbai', 28, '2024-02-15', 1),
(3, 'Priya', 'Female', 'Delhi', 26, '2024-03-20', 0),
(4, 'Neha', 'Female', 'Pune', 30, '2024-04-05', 1),
(5, 'Arjun', 'Male', 'Bangalore', 35, '2024-05-12', 0),
(6, 'Sara', 'Female', NULL, 27, '2024-06-18', 0),
(7, 'Ravi', 'Male', 'Delhi', NULL, '2024-07-22', 1);
```

---

## Create `orders` Table

```sql
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    product_category VARCHAR(50),
    quantity INT,
    order_amount DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);
```

---

## Insert Data

```sql
INSERT INTO orders 
(order_id, customer_id, order_date, product_category, quantity, order_amount)
VALUES
(101, 1, '2024-02-01', 'Electronics', 1, 5000),
(102, 1, '2024-03-05', 'Fashion', 2, 2000),
(103, 2, '2024-03-10', 'Grocery', 5, 1500),
(104, 3, '2024-04-12', 'Electronics', 1, 8000),
(105, 3, '2024-05-15', 'Fashion', 3, 3000),
(106, 4, '2024-06-20', 'Grocery', 4, 1200),
(107, 5, '2024-07-25', 'Electronics', 2, 10000),
(108, 5, '2024-08-10', 'Fashion', 1, 1500),
(109, 6, '2024-09-18', 'Grocery', 6, 1800);
```

---

## Create `payments` Table

```sql
CREATE TABLE payments (
    payment_id INT PRIMARY KEY,
    order_id INT,
    payment_mode VARCHAR(50),
    payment_status VARCHAR(50),
    payment_date DATE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
```

---

## Insert Data

```sql
INSERT INTO payments 
(payment_id, order_id, payment_mode, payment_status, payment_date)
VALUES
(1001, 101, 'UPI', 'Success', '2024-02-01'),
(1002, 102, 'Card', 'Success', '2024-03-05'),
(1003, 103, 'Cash', 'Failed', '2024-03-10'),
(1004, 104, 'UPI', 'Success', '2024-04-12'),
(1005, 105, 'Card', 'Success', '2024-05-15'),
(1006, 106, 'Cash', 'Success', '2024-06-20'),
(1007, 107, 'UPI', 'Success', '2024-07-25'),
(1008, 108, 'Card', 'Failed', '2024-08-10'),
(1009, 109, 'UPI', 'Success', '2024-09-18');
```

---

# 3. SELECT

## Easy Definition

`SELECT` is used to choose columns from a table.

Simple meaning:

```text
SELECT = Which columns do you want?
```

---

## Basic Query

```sql
SELECT * 
FROM customers;
```

Meaning:

```text
Show all columns from customers table.
```

---

## Select Specific Columns

```sql
SELECT customer_id, customer_name, city
FROM customers;
```

---

## SQL for ML Use

In ML, we use `SELECT` to choose useful features.

Example:

```sql
SELECT age, city, gender, churn
FROM customers;
```

Here:

```text
Features = age, city, gender
Target = churn
```

---

## Interview Answer

`SELECT` is used to retrieve data from one or more columns. In ML projects, it is used to extract required features and target variables.

---

# 4. WHERE

## Easy Definition

`WHERE` is used to filter rows.

Simple meaning:

```text
WHERE = Which rows do you want?
```

---

## Example

```sql
SELECT *
FROM customers
WHERE city = 'Delhi';
```

Meaning:

```text
Show customers from Delhi.
```

---

## Filter by Age

```sql
SELECT *
FROM customers
WHERE age > 25;
```

---

## Multiple Conditions

```sql
SELECT *
FROM customers
WHERE city = 'Delhi'
AND age > 25;
```

---

## OR Condition

```sql
SELECT *
FROM customers
WHERE city = 'Delhi'
OR city = 'Mumbai';
```

---

## SQL for ML Use

Remove bad or unwanted data before model training.

Example:

```sql
SELECT *
FROM customers
WHERE age IS NOT NULL;
```

Example:

```sql
SELECT *
FROM orders
WHERE order_amount > 0;
```

---

## Interview Answer

`WHERE` filters rows based on conditions. In ML, it helps remove invalid records, filter date ranges, and prepare clean training data.

---

# 5. GROUP BY

## Easy Definition

`GROUP BY` is used to group rows and calculate summary values.

Simple meaning:

```text
GROUP BY = Make groups and apply aggregate functions
```

---

## Common Aggregate Functions

| Function | Meaning |
|---|---|
| `COUNT()` | Count rows |
| `SUM()` | Total value |
| `AVG()` | Average value |
| `MIN()` | Minimum value |
| `MAX()` | Maximum value |

---

## Example: Count Customers by City

```sql
SELECT city, COUNT(*) AS total_customers
FROM customers
GROUP BY city;
```

---

## Example: Total Sales by Customer

```sql
SELECT customer_id, SUM(order_amount) AS total_spent
FROM orders
GROUP BY customer_id;
```

---

## Example: Average Order Amount by Product Category

```sql
SELECT product_category, AVG(order_amount) AS avg_order_amount
FROM orders
GROUP BY product_category;
```

---

## SQL for ML Use

`GROUP BY` is very useful for **feature engineering**.

Example: create customer-level features.

```sql
SELECT 
    customer_id,
    COUNT(order_id) AS total_orders,
    SUM(order_amount) AS total_spent,
    AVG(order_amount) AS avg_order_value,
    MAX(order_date) AS last_order_date
FROM orders
GROUP BY customer_id;
```

These become ML features:

```text
total_orders
total_spent
avg_order_value
last_order_date
```

---

## Interview Answer

`GROUP BY` groups rows based on one or more columns and applies aggregate functions. In ML, it is used to create customer-level or product-level features.

---

# 6. HAVING

## Easy Definition

`HAVING` is used to filter grouped data.

Simple meaning:

```text
WHERE filters rows before grouping.
HAVING filters groups after grouping.
```

---

## Example

Find customers whose total spending is more than 5000.

```sql
SELECT 
    customer_id,
    SUM(order_amount) AS total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(order_amount) > 5000;
```

---

## WHERE vs HAVING

| WHERE | HAVING |
|---|---|
| Filters rows | Filters groups |
| Used before `GROUP BY` | Used after `GROUP BY` |
| Cannot use aggregate functions directly | Can use aggregate functions |
| Example: `age > 25` | Example: `SUM(amount) > 5000` |

---

## SQL for ML Use

Find high-value customers.

```sql
SELECT 
    customer_id,
    COUNT(order_id) AS total_orders,
    SUM(order_amount) AS total_spent
FROM orders
GROUP BY customer_id
HAVING COUNT(order_id) >= 2;
```

---

## Interview Answer

`HAVING` filters grouped results after aggregation. It is used when we need conditions on aggregate values like count, sum, or average.

---

# 7. JOIN

## Easy Definition

`JOIN` is used to combine data from multiple tables.

Simple meaning:

```text
JOIN = Connect tables using common column
```

Example:

```text
customers.customer_id = orders.customer_id
```

---

## Types of JOIN

| JOIN Type | Meaning |
|---|---|
| INNER JOIN | Matching records only |
| LEFT JOIN | All records from left table + matching right table |
| RIGHT JOIN | All records from right table + matching left table |
| FULL JOIN | All records from both tables |
| CROSS JOIN | All combinations |

---

## INNER JOIN

Show only customers who have orders.

```sql
SELECT 
    c.customer_id,
    c.customer_name,
    c.city,
    o.order_id,
    o.order_amount
FROM customers c
INNER JOIN orders o
ON c.customer_id = o.customer_id;
```

---

## LEFT JOIN

Show all customers, even if they have no orders.

```sql
SELECT 
    c.customer_id,
    c.customer_name,
    o.order_id,
    o.order_amount
FROM customers c
LEFT JOIN orders o
ON c.customer_id = o.customer_id;
```

---

## JOIN Three Tables

```sql
SELECT 
    c.customer_id,
    c.customer_name,
    c.city,
    o.order_id,
    o.order_amount,
    p.payment_mode,
    p.payment_status
FROM customers c
JOIN orders o
ON c.customer_id = o.customer_id
JOIN payments p
ON o.order_id = p.order_id;
```

---

## SQL for ML Use

In real ML projects, data is not in one table.

Example:

```text
Customer details → customers table
Order details → orders table
Payment details → payments table
```

We use JOIN to create final ML dataset.

```sql
SELECT 
    c.customer_id,
    c.age,
    c.gender,
    c.city,
    COUNT(o.order_id) AS total_orders,
    SUM(o.order_amount) AS total_spent,
    AVG(o.order_amount) AS avg_order_value,
    c.churn
FROM customers c
LEFT JOIN orders o
ON c.customer_id = o.customer_id
GROUP BY 
    c.customer_id,
    c.age,
    c.gender,
    c.city,
    c.churn;
```

---

## Interview Answer

`JOIN` combines data from multiple tables using a common key. In ML, joins are used to combine customer, transaction, product, and payment data into one training dataset.

---

# 8. Window Functions

## Easy Definition

Window functions calculate values across rows without reducing the number of rows.

Simple meaning:

```text
GROUP BY reduces rows.
Window function keeps all rows.
```

---

## Common Window Functions

| Function | Use |
|---|---|
| `ROW_NUMBER()` | Unique row number |
| `RANK()` | Ranking with gaps |
| `DENSE_RANK()` | Ranking without gaps |
| `LAG()` | Previous row value |
| `LEAD()` | Next row value |
| `SUM() OVER()` | Running total |
| `AVG() OVER()` | Moving average |

---

## ROW_NUMBER

Find latest order per customer.

```sql
SELECT *
FROM (
    SELECT 
        o.*,
        ROW_NUMBER() OVER (
            PARTITION BY customer_id 
            ORDER BY order_date DESC
        ) AS rn
    FROM orders o
) x
WHERE rn = 1;
```

Meaning:

```text
For each customer, give rank 1 to latest order.
```

---

## RANK

Rank customers by order amount.

```sql
SELECT 
    customer_id,
    order_id,
    order_amount,
    RANK() OVER (
        ORDER BY order_amount DESC
    ) AS amount_rank
FROM orders;
```

---

## DENSE_RANK

```sql
SELECT 
    customer_id,
    order_id,
    order_amount,
    DENSE_RANK() OVER (
        ORDER BY order_amount DESC
    ) AS dense_rank_amount
FROM orders;
```

Difference:

```text
RANK: 1, 2, 2, 4
DENSE_RANK: 1, 2, 2, 3
```

---

## LAG

Compare current order with previous order.

```sql
SELECT 
    customer_id,
    order_date,
    order_amount,
    LAG(order_amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
    ) AS previous_order_amount
FROM orders;
```

---

## LEAD

Get next order amount.

```sql
SELECT 
    customer_id,
    order_date,
    order_amount,
    LEAD(order_amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
    ) AS next_order_amount
FROM orders;
```

---

## Running Total

```sql
SELECT 
    customer_id,
    order_date,
    order_amount,
    SUM(order_amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
    ) AS running_total
FROM orders;
```

---

## Moving Average

```sql
SELECT 
    customer_id,
    order_date,
    order_amount,
    AVG(order_amount) OVER (
        PARTITION BY customer_id
        ORDER BY order_date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3_orders
FROM orders;
```

---

## SQL for ML Use

Window functions are useful for time-based feature engineering.

Example features:

```text
previous_order_amount
days_since_last_order
running_total_spent
moving_average_order_amount
customer_rank
```

Example:

```sql
SELECT 
    customer_id,
    order_date,
    order_amount,
    order_amount - LAG(order_amount) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) AS order_amount_difference
FROM orders;
```

---

## Interview Answer

Window functions perform calculations across related rows while keeping row-level detail. In ML, they are useful for creating time-based features like previous purchase, running total, moving average, and customer ranking.

---

# 9. CTE — Common Table Expression

## Easy Definition

CTE is a temporary named result used inside a query.

Simple meaning:

```text
CTE = Temporary table inside query
```

Syntax:

```sql
WITH cte_name AS (
    SELECT ...
)
SELECT *
FROM cte_name;
```

---

## Example

```sql
WITH customer_spending AS (
    SELECT 
        customer_id,
        SUM(order_amount) AS total_spent
    FROM orders
    GROUP BY customer_id
)
SELECT *
FROM customer_spending
WHERE total_spent > 5000;
```

---

## Multiple CTEs

```sql
WITH customer_orders AS (
    SELECT 
        customer_id,
        COUNT(order_id) AS total_orders,
        SUM(order_amount) AS total_spent
    FROM orders
    GROUP BY customer_id
),
high_value_customers AS (
    SELECT *
    FROM customer_orders
    WHERE total_spent > 5000
)
SELECT *
FROM high_value_customers;
```

---

## SQL for ML Use

CTE makes feature engineering queries clean and readable.

Example: create final churn dataset.

```sql
WITH order_features AS (
    SELECT 
        customer_id,
        COUNT(order_id) AS total_orders,
        SUM(order_amount) AS total_spent,
        AVG(order_amount) AS avg_order_value,
        MAX(order_date) AS last_order_date
    FROM orders
    GROUP BY customer_id
),
payment_features AS (
    SELECT 
        o.customer_id,
        COUNT(CASE WHEN p.payment_status = 'Failed' THEN 1 END) AS failed_payments
    FROM orders o
    JOIN payments p
    ON o.order_id = p.order_id
    GROUP BY o.customer_id
)
SELECT 
    c.customer_id,
    c.age,
    c.gender,
    c.city,
    COALESCE(ofe.total_orders, 0) AS total_orders,
    COALESCE(ofe.total_spent, 0) AS total_spent,
    COALESCE(ofe.avg_order_value, 0) AS avg_order_value,
    COALESCE(pf.failed_payments, 0) AS failed_payments,
    c.churn
FROM customers c
LEFT JOIN order_features ofe
ON c.customer_id = ofe.customer_id
LEFT JOIN payment_features pf
ON c.customer_id = pf.customer_id;
```

---

## Interview Answer

CTE stands for Common Table Expression. It is used to write temporary named queries, making complex SQL queries more readable and manageable.

---

# 10. Views

## Easy Definition

A View is a saved SQL query.

Simple meaning:

```text
View = Virtual table created from SQL query
```

---

## Create View

```sql
CREATE VIEW customer_ml_features AS
SELECT 
    c.customer_id,
    c.age,
    c.gender,
    c.city,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(o.order_amount), 0) AS total_spent,
    COALESCE(AVG(o.order_amount), 0) AS avg_order_value,
    c.churn
FROM customers c
LEFT JOIN orders o
ON c.customer_id = o.customer_id
GROUP BY 
    c.customer_id,
    c.age,
    c.gender,
    c.city,
    c.churn;
```

---

## Use View

```sql
SELECT *
FROM customer_ml_features;
```

---

## Filter View

```sql
SELECT *
FROM customer_ml_features
WHERE total_spent > 5000;
```

---

## Drop View

```sql
DROP VIEW customer_ml_features;
```

---

## SQL for ML Use

Views are used to save reusable feature datasets.

Example:

```text
customer_ml_features view can be used directly in Python.
```

Python idea:

```python
df = pd.read_sql("SELECT * FROM customer_ml_features", connection)
```

---

## Interview Answer

A View is a virtual table based on a saved SQL query. In ML projects, views are useful for creating reusable feature datasets.

---

# 11. Stored Procedures

## Easy Definition

Stored Procedure is a saved SQL program that can be executed again and again.

Simple meaning:

```text
Stored Procedure = Reusable SQL function inside database
```

Used for:

```text
Repeated data cleaning
Feature table creation
Monthly reports
Batch ML data preparation
```

---

## MySQL Stored Procedure Example

```sql
DELIMITER //

CREATE PROCEDURE get_customer_features()
BEGIN
    SELECT 
        c.customer_id,
        c.age,
        c.gender,
        c.city,
        COUNT(o.order_id) AS total_orders,
        COALESCE(SUM(o.order_amount), 0) AS total_spent,
        COALESCE(AVG(o.order_amount), 0) AS avg_order_value,
        c.churn
    FROM customers c
    LEFT JOIN orders o
    ON c.customer_id = o.customer_id
    GROUP BY 
        c.customer_id,
        c.age,
        c.gender,
        c.city,
        c.churn;
END //

DELIMITER ;
```

Call procedure:

```sql
CALL get_customer_features();
```

---

## PostgreSQL Function Example

```sql
CREATE OR REPLACE FUNCTION get_customer_features()
RETURNS TABLE (
    customer_id INT,
    age INT,
    gender VARCHAR,
    city VARCHAR,
    total_orders BIGINT,
    total_spent NUMERIC,
    avg_order_value NUMERIC,
    churn INT
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.customer_id,
        c.age,
        c.gender,
        c.city,
        COUNT(o.order_id) AS total_orders,
        COALESCE(SUM(o.order_amount), 0) AS total_spent,
        COALESCE(AVG(o.order_amount), 0) AS avg_order_value,
        c.churn
    FROM customers c
    LEFT JOIN orders o
    ON c.customer_id = o.customer_id
    GROUP BY 
        c.customer_id,
        c.age,
        c.gender,
        c.city,
        c.churn;
END;
$$ LANGUAGE plpgsql;
```

Call function:

```sql
SELECT *
FROM get_customer_features();
```

---

## SQL for ML Use

Stored procedures help automate ML data preparation.

Example:

```text
Every day at 12 AM:
Run stored procedure → create fresh ML dataset → model predicts churn
```

---

## Interview Answer

Stored Procedure is a saved SQL program that can be executed repeatedly. In ML, stored procedures are useful for automating feature extraction and data preparation.

---

# 12. Data Cleaning Queries

Data cleaning is one of the most important parts of ML.

Simple meaning:

```text
Bad data gives bad model.
Clean data gives better model.
```

---

## A. Find Missing Values

```sql
SELECT *
FROM customers
WHERE city IS NULL;
```

```sql
SELECT *
FROM customers
WHERE age IS NULL;
```

---

## B. Count Missing Values

```sql
SELECT 
    COUNT(*) AS total_rows,
    COUNT(age) AS non_null_age,
    COUNT(*) - COUNT(age) AS missing_age
FROM customers;
```

---

## C. Replace Missing Values

### Replace missing city

```sql
UPDATE customers
SET city = 'Unknown'
WHERE city IS NULL;
```

### Replace missing age with average age

MySQL:

```sql
UPDATE customers
SET age = (
    SELECT avg_age
    FROM (
        SELECT ROUND(AVG(age)) AS avg_age
        FROM customers
        WHERE age IS NOT NULL
    ) x
)
WHERE age IS NULL;
```

PostgreSQL:

```sql
UPDATE customers
SET age = (
    SELECT ROUND(AVG(age))
    FROM customers
    WHERE age IS NOT NULL
)
WHERE age IS NULL;
```

---

## D. Find Duplicate Records

If duplicate means same customer name and city:

```sql
SELECT 
    customer_name,
    city,
    COUNT(*) AS duplicate_count
FROM customers
GROUP BY customer_name, city
HAVING COUNT(*) > 1;
```

---

## E. Remove Duplicates Using ROW_NUMBER

```sql
WITH duplicate_cte AS (
    SELECT 
        customer_id,
        customer_name,
        city,
        ROW_NUMBER() OVER (
            PARTITION BY customer_name, city 
            ORDER BY customer_id
        ) AS rn
    FROM customers
)
SELECT *
FROM duplicate_cte
WHERE rn > 1;
```

To delete duplicates depends on database, but concept:

```sql
WITH duplicate_cte AS (
    SELECT 
        customer_id,
        ROW_NUMBER() OVER (
            PARTITION BY customer_name, city 
            ORDER BY customer_id
        ) AS rn
    FROM customers
)
DELETE FROM customers
WHERE customer_id IN (
    SELECT customer_id
    FROM duplicate_cte
    WHERE rn > 1
);
```

---

## F. Standardize Text Data

Convert city to lowercase:

```sql
SELECT LOWER(city) AS clean_city
FROM customers;
```

Update city text:

```sql
UPDATE customers
SET city = LOWER(TRIM(city));
```

---

## G. Remove Extra Spaces

```sql
UPDATE customers
SET customer_name = TRIM(customer_name);
```

---

## H. Convert Categorical Values

Example: convert gender into numeric values.

```sql
SELECT 
    customer_id,
    CASE 
        WHEN gender = 'Male' THEN 1
        WHEN gender = 'Female' THEN 0
        ELSE NULL
    END AS gender_encoded
FROM customers;
```

---

## I. Create Age Groups

```sql
SELECT 
    customer_id,
    age,
    CASE 
        WHEN age < 25 THEN 'Young'
        WHEN age BETWEEN 25 AND 35 THEN 'Adult'
        ELSE 'Senior'
    END AS age_group
FROM customers;
```

---

## J. Handle Outliers

Find very high order amount:

```sql
SELECT *
FROM orders
WHERE order_amount > 10000;
```

Cap order amount:

```sql
UPDATE orders
SET order_amount = 10000
WHERE order_amount > 10000;
```

---

## K. Date Feature Engineering

```sql
SELECT 
    customer_id,
    signup_date,
    EXTRACT(YEAR FROM signup_date) AS signup_year,
    EXTRACT(MONTH FROM signup_date) AS signup_month
FROM customers;
```

MySQL version:

```sql
SELECT 
    customer_id,
    signup_date,
    YEAR(signup_date) AS signup_year,
    MONTH(signup_date) AS signup_month
FROM customers;
```

---

## L. Days Since Signup

PostgreSQL:

```sql
SELECT 
    customer_id,
    signup_date,
    CURRENT_DATE - signup_date AS days_since_signup
FROM customers;
```

MySQL:

```sql
SELECT 
    customer_id,
    signup_date,
    DATEDIFF(CURDATE(), signup_date) AS days_since_signup
FROM customers;
```

---

# 13. Final ML Feature Table Query

This is the most important part.

Goal:

```text
Create final dataset for Customer Churn Prediction
```

Final columns:

```text
age
gender
city
days_since_signup
total_orders
total_spent
avg_order_value
failed_payments
churn
```

---

## PostgreSQL Version

```sql
WITH order_features AS (
    SELECT 
        customer_id,
        COUNT(order_id) AS total_orders,
        SUM(order_amount) AS total_spent,
        AVG(order_amount) AS avg_order_value,
        MAX(order_date) AS last_order_date
    FROM orders
    GROUP BY customer_id
),
payment_features AS (
    SELECT 
        o.customer_id,
        COUNT(CASE WHEN p.payment_status = 'Failed' THEN 1 END) AS failed_payments
    FROM orders o
    JOIN payments p
    ON o.order_id = p.order_id
    GROUP BY o.customer_id
)
SELECT 
    c.customer_id,
    COALESCE(c.age, 0) AS age,

    CASE 
        WHEN c.gender = 'Male' THEN 1
        WHEN c.gender = 'Female' THEN 0
        ELSE -1
    END AS gender_encoded,

    COALESCE(c.city, 'Unknown') AS city,

    CURRENT_DATE - c.signup_date AS days_since_signup,

    COALESCE(ofe.total_orders, 0) AS total_orders,
    COALESCE(ofe.total_spent, 0) AS total_spent,
    COALESCE(ofe.avg_order_value, 0) AS avg_order_value,

    COALESCE(pf.failed_payments, 0) AS failed_payments,

    c.churn
FROM customers c
LEFT JOIN order_features ofe
ON c.customer_id = ofe.customer_id
LEFT JOIN payment_features pf
ON c.customer_id = pf.customer_id;
```

---

## MySQL Version

```sql
WITH order_features AS (
    SELECT 
        customer_id,
        COUNT(order_id) AS total_orders,
        SUM(order_amount) AS total_spent,
        AVG(order_amount) AS avg_order_value,
        MAX(order_date) AS last_order_date
    FROM orders
    GROUP BY customer_id
),
payment_features AS (
    SELECT 
        o.customer_id,
        COUNT(CASE WHEN p.payment_status = 'Failed' THEN 1 END) AS failed_payments
    FROM orders o
    JOIN payments p
    ON o.order_id = p.order_id
    GROUP BY o.customer_id
)
SELECT 
    c.customer_id,
    COALESCE(c.age, 0) AS age,

    CASE 
        WHEN c.gender = 'Male' THEN 1
        WHEN c.gender = 'Female' THEN 0
        ELSE -1
    END AS gender_encoded,

    COALESCE(c.city, 'Unknown') AS city,

    DATEDIFF(CURDATE(), c.signup_date) AS days_since_signup,

    COALESCE(ofe.total_orders, 0) AS total_orders,
    COALESCE(ofe.total_spent, 0) AS total_spent,
    COALESCE(ofe.avg_order_value, 0) AS avg_order_value,

    COALESCE(pf.failed_payments, 0) AS failed_payments,

    c.churn
FROM customers c
LEFT JOIN order_features ofe
ON c.customer_id = ofe.customer_id
LEFT JOIN payment_features pf
ON c.customer_id = pf.customer_id;
```

---

# 14. SQL Execution Order

Very important for interviews.

SQL is written like this:

```sql
SELECT
FROM
WHERE
GROUP BY
HAVING
ORDER BY
LIMIT;
```

But SQL executes like this:

```text
1. FROM
2. JOIN
3. WHERE
4. GROUP BY
5. HAVING
6. SELECT
7. ORDER BY
8. LIMIT
```

---

# 15. SQL for ML Interview Questions

## Q1. Why SQL is important for ML?

SQL is important because most real-world data is stored in databases. We use SQL to extract, clean, join, aggregate, and prepare data before training ML models.

---

## Q2. What is feature engineering in SQL?

Feature engineering in SQL means creating useful input variables using SQL queries.

Example:

```sql
SELECT 
    customer_id,
    COUNT(order_id) AS total_orders,
    SUM(order_amount) AS total_spent
FROM orders
GROUP BY customer_id;
```

---

## Q3. WHERE vs HAVING?

```text
WHERE filters rows before grouping.
HAVING filters groups after aggregation.
```

---

## Q4. GROUP BY use in ML?

`GROUP BY` is used to create aggregated features like total orders, total spend, average order value, and number of failed payments.

---

## Q5. JOIN use in ML?

`JOIN` combines multiple tables like customer details, orders, payments, and product data into one ML training dataset.

---

## Q6. Window function use in ML?

Window functions create time-based features like previous order amount, running total, moving average, and customer ranking.

---

## Q7. CTE vs View?

| CTE | View |
|---|---|
| Temporary inside query | Saved SQL query |
| Exists only during query | Can be reused |
| Good for complex query readability | Good for reusable feature table |

---

## Q8. Stored Procedure use in ML?

Stored procedures automate repeated SQL tasks like data cleaning, feature generation, and final training dataset creation.

---

# 16. Final Summary Table

| SQL Concept | Easy Meaning | ML Use |
|---|---|---|
| SELECT | Choose columns | Select features and target |
| WHERE | Filter rows | Remove invalid data |
| GROUP BY | Group data | Create aggregate features |
| HAVING | Filter grouped data | Select high-value customers |
| JOIN | Combine tables | Build final ML dataset |
| Window Functions | Row-wise analytics | Lag, rank, moving average |
| CTE | Temporary query block | Clean complex ML queries |
| View | Saved query | Reusable feature table |
| Stored Procedure | Saved SQL program | Automate data prep |
| Data Cleaning | Fix dirty data | Improve model quality |

---

# Final Interview Summary

```text
SQL is very important in Machine Learning because real-world data is usually stored in databases.

I use SELECT to choose useful features, WHERE to filter invalid records, GROUP BY to create aggregate features, HAVING to filter grouped data, and JOIN to combine multiple tables.

Window functions are useful for time-based features like previous order amount, running total, rank, and moving average.

CTEs make complex ML queries readable, while Views help create reusable feature datasets.

Stored procedures can automate repeated data preparation tasks.

For data cleaning, I use SQL queries to handle missing values, remove duplicates, standardize text, encode categories, handle outliers, and create date-based features.

In an ML project, SQL is mainly used to prepare the final clean training dataset before applying Python and machine learning algorithms.
```
