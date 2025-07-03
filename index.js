const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const contactRoutes = require("./routes/contactRoutes");
const authMiddleware = require("./middlewares/authMiddleware");

dotenv.config();
const app = express();

connectDB();

// app.use(cors());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://bloga-frontend.onrender.com"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth",  authRoutes);
app.use("/api/posts", authMiddleware, postRoutes);

app.use("/api/contact", contactRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
