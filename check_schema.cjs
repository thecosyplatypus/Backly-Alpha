const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Users/phoeb/AppData/Roaming/Backly/backly.db' } }
});
(async () => {
  const schema = await prisma.$queryRawUnsafe("SELECT sql FROM sqlite_master WHERE name='Achievement'");
  console.log('Achievement table schema:');
  console.log(JSON.stringify(schema, null, 2));
  await prisma['$disconnect']();
})();
