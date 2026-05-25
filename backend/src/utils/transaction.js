export async function withTransaction(sequelize, externalTransaction, callback) {
   const isOwn = !externalTransaction;
   const transaction = externalTransaction || await sequelize.transaction();

   try {
      const result = await callback(transaction);
      if (isOwn) await transaction.commit();
      return result;
   } catch (err) {
      if (isOwn && transaction.finished === null) await transaction.rollback();
      throw err;
   }
}