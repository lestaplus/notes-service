const Router = require('express');
const router = new Router();
const notesController = require('../controllers/notes.controller');

router.post('/notes', notesController.createNote);

module.exports = router;