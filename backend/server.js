const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // 1. Use pg instead of mysql2
const app = express();

app.use(cors());
app.use(express.json());
app.use("/images", express.static("products"));

// 2. Setup PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render provides this automatically
  ssl: {
    rejectUnauthorized: false, // Required for Render connection
  },
});

// Test connection
pool.connect((err) => {
  if (err) {
    console.error("PostgreSQL connection error", err);
  } else {
    console.log("PostgreSQL connected successfully");
  }
});

app.get("/products", (req, res) => {
  const query = "SELECT * FROM products";
  pool.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "error fetching", error: err });
    }
    // In Postgres, data is inside results.rows
    res.json(results.rows);
  });
});

app.post("/insert", (req, res) => {
  const { name, description, price, category, image } = req.body;
  // 3. Changed ? to $1, $2, etc.
  const query =
    "INSERT INTO products (name, description, price, category, image) VALUES ($1, $2, $3, $4, $5) RETURNING *";
  
  pool.query(
    query,
    [name, description, price, category, image],
    (err, results) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ message: "error inserting", error: err });
      }
      res.json(results.rows[0]);
    }
  );
});

app.delete("/delete/:id", (req, res) => {
  const { id } = req.params;

  // Changed ? to $1
  const query = "DELETE FROM products WHERE id = $1";

  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "error deleting", error: err });
    }
    res.json({ message: "product deleted successfully!", id: id });
  });
});

app.put("/update/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image } = req.body;
  
  // Changed ? to $1, $2, $3...
  const query =
    "UPDATE products SET name = $1, description = $2, price = $3, category = $4, image = $5 WHERE id = $6";
    
  pool.query(
    query,
    [name, description, price, category, image, id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "error updating", error: err });
      }
      res.json({ message: "product updated successfully", id: id });
    }
  );
});

// 4. Use process.env.PORT for Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});