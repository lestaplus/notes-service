const Router = require("express");
const router = new Router();
const notesController = require("../controllers/notes.controller");

router.post("/notes", notesController.createNote);
router.get("/notes", notesController.getAllNotes);
router.get("/notes/:id", notesController.getNoteById);

module.exports = router;
