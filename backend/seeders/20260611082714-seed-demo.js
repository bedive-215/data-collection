'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface) {
    const filePath = path.resolve(__dirname, './seed.sql');

    console.log('Reading SQL from:', filePath);

    const sql = fs.readFileSync(filePath, 'utf8');

    const queries = sql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length);

    for (const query of queries) {
      console.log('Running:', query.substring(0, 50));
      await queryInterface.sequelize.query(query);
    }

    console.log('Seed SQL executed successfully');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
    console.log('Rollback done');
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('users', null, {});
      console.log('Seed rollback completed');
    } catch (error) {
      console.error('Error rollback:', error);
      throw error;
    }
  },
};