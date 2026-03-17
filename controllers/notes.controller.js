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

  async getAllNotes(req, res) {
    try {
      const result = await pool.query(
        "SELECT id, title FROM notes ORDER BY id ASC",
      );
      const notes = result.rows;

      if (req.accepts("html")) {
        const html = /* html */ `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <title>Notes</title>
          </head>
          <body>
            <h1>All notes</h1>
            <table border="1">
              <tr>
                <th>Id</th>
                <th>Title</th>
                <th>Action</th>
              </tr>
              ${notes
                .map(
                  (note) => /* html */ `
                  <tr>
                    <td>${note.id}</td>
                    <td>${note.title}</td>
                    <td><a href="/notes/${note.id}">View</a></td>
                  </tr>
                `,
                )
                .join("")}
            </table>
          </body>
          </html>
        `;
        return res.send(html);
      } else {
        return res.json(notes);
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  async getNoteById(req, res) {
    const id = req.params.id;
    try {
      const result = await pool.query(
        "SELECT id, title, created_at, content FROM notes WHERE id = $1",
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).send("Note not found");
      }

      const note = result.rows[0];

      if (req.accepts("html")) {
        const html = /* html */ `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <title>Note ${note.id}</title>
          </head>
          <body>
            <h1>${note.title}</h1>
            <p><strong>Id:</strong> ${note.id}</p>
            <p><strong>Created at:</strong> ${note.created_at}</p>
            <hr />
            <p>${note.content}</p>
            <br />
            <a href="/notes">Back to list</a>
          </body>
          </html>
        `;
        return res.send(html);
      } else {
        return res.json(note);
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }
}

module.exports = new NotesController();
