const express = require('express');
const router = express.Router();
const { createContact, getContacts } = require('../controllers/contactController'); 

// Route to create a new contact
router.post('/create-contact', createContact);
router.get('/all-contact', getContacts);

// Export the router
module.exports = router;