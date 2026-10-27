const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
let isMySQLConnected = false;

const localDataDir = path.join(__dirname, 'data');
const localDataFile = path.join(localDataDir, 'contacts.json');

// Ensure local fallback directory exists
if (!fs.existsSync(localDataDir)) {
  fs.mkdirSync(localDataDir, { recursive: true });
}
if (!fs.existsSync(localDataFile)) {
  fs.writeFileSync(localDataFile, JSON.stringify([], null, 2), 'utf8');
}

/**
 * Initialize MySQL Database and Table
 */
async function initDB() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'portfolio_db';

  try {
    // Step 1: Connect to server without DB to ensure database exists
    const rootConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      charset: 'UTF8_GENERAL_CI',
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await rootConn.end();

    // Step 2: Create connection pool with the database
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      charset: 'UTF8_GENERAL_CI',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Step 3: Create contacts table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `;
    await pool.query(createTableQuery);

    isMySQLConnected = true;
    console.log(`[Database] Successfully connected to MySQL database: "${database}"`);
    console.log(`[Database] Table "contacts" is ready.`);
  } catch (error) {
    isMySQLConnected = false;
    console.warn(`[Database Warning] Could not connect to MySQL (${error.message}).`);
    console.log(`[Database Note] Using local JSON fallback at: ${localDataFile}`);
    console.log(`[Database Tip] To connect to your MySQL Server, please verify DB_PASSWORD in .env`);
  }
}

/**
 * Save contact message
 */
async function saveContact({ name, email, message }) {
  if (isMySQLConnected && pool) {
    try {
      const query = `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`;
      const [result] = await pool.query(query, [name, email, message]);
      return {
        id: result.insertId,
        name,
        email,
        message,
        storage: 'mysql',
        created_at: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[Database Error] MySQL insert failed, falling back to local file:', err.message);
    }
  }

  // Fallback to local JSON storage
  try {
    const raw = fs.readFileSync(localDataFile, 'utf8');
    const contacts = JSON.parse(raw || '[]');
    const newContact = {
      id: contacts.length + 1,
      name,
      email,
      message,
      storage: 'fallback_json',
      created_at: new Date().toISOString(),
    };
    contacts.push(newContact);
    fs.writeFileSync(localDataFile, JSON.stringify(contacts, null, 2), 'utf8');
    return newContact;
  } catch (fileErr) {
    console.error('[Storage Error] Failed to write to fallback file:', fileErr.message);
    throw new Error('Failed to save message to storage');
  }
}

/**
 * Retrieve all contact messages
 */
async function getAllContacts() {
  if (isMySQLConnected && pool) {
    try {
      const [rows] = await pool.query(`SELECT * FROM contacts ORDER BY created_at DESC`);
      return rows;
    } catch (err) {
      console.error('[Database Error] MySQL fetch failed:', err.message);
    }
  }

  try {
    const raw = fs.readFileSync(localDataFile, 'utf8');
    return JSON.parse(raw || '[]');
  } catch {
    return [];
  }
}

module.exports = {
  initDB,
  saveContact,
  getAllContacts,
  isMySQLConnected: () => isMySQLConnected,
};
