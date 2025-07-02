const Contact = require("../models/contact");

const createContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  // 🛡️ Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (name.trim().length < 3) {
    return res.status(400).json({ message: "Name must be at least 3 characters" });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (subject.trim().length < 3) {
    return res.status(400).json({ message: "Subject must be at least 3 characters" });
  }

  if (message.trim().length < 10) {
    return res.status(400).json({ message: "Message must be at least 10 characters" });
  }

  try {
    const contact = await Contact.create({ name, email, subject, message });
    res.status(201).json(contact);
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ message: "Server error" });
  }
}

const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createContact,
    getContacts
};
