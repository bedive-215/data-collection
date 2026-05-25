export const mapTransaction = (tx) => ({
   id: tx.id,
   amount: tx.amount,
   type: tx.type,
   description: tx.description,
   created_at: tx.created_at,
});