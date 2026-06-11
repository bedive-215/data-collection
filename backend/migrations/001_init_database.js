import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function up(queryInterface, Sequelize) {
  const sqlPath = path.join(__dirname, 'init_database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await queryInterface.sequelize.query(sql);
}

export async function down(queryInterface, Sequelize) {
  
}