const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Testing MySQL Connection...');
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`Port: ${process.env.DB_PORT || 3306}`);
  console.log(`User: ${process.env.DB_USER || 'root'}`);
  console.log(`Database: ${process.env.DB_NAME || 'portfolio_db'}`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'UTF8_GENERAL_CI',
    });

    console.log(' Successfully connected to MySQL server!');

    // Check or create database
    const dbName = process.env.DB_NAME || 'portfolio_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(` Database "${dbName}" is verified/created.`);

    await connection.query(`USE \`${dbName}\`;`);

    // Create contacts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    console.log(' Table "contacts" is verified/created.');

    const [rows] = await connection.query('SELECT COUNT(*) as count FROM contacts;');
    console.log(` Current total messages in database: ${rows[0].count}`);

    await connection.end();
    console.log('\n ALL CHECKS PASSED: MySQL database & table are fully operational!');
  } catch (error) {
    console.error(' MySQL Connection Failed:');
    console.error(`Error Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    console.log('\n TIP: Check your DB_PASSWORD in the .env file and make sure MySQL Server is running.');
  }
}

testConnection();
