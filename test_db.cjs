const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://karansabbarwal16:kara2006n@project.ogsjs08.mongodb.net/physiosync?appName=project').then(async () => {
  const db = mongoose.connection.db;
  
  const total = await db.collection('auditlogs').countDocuments();
  console.log('Total auditlogs in db:', total);

  const deletedCount = await db.collection('auditlogs').countDocuments({ deleted: true });
  console.log('Total deleted:', deletedCount);

  const activeCount = await db.collection('auditlogs').countDocuments({ deleted: { $ne: true } });
  console.log('Total active:', activeCount);
  
  process.exit(0);
});
