const pool = require("../db");

class NotesController {
  async createNote(req, res) {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    try {
      const result = await pool.query(
        "INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *",
        [title, content],
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }
}

module.exports = new NotesController();