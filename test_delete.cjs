const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/physiosync').then(async () => {
  const AuditLog = mongoose.connection.collection('auditlogs');
  const log = await AuditLog.findOne({ deleted: { $ne: true } });
  if (!log) return console.log('No log found');
  console.log('Found log:', log._id);
  const res = await fetch('http://localhost:5000/api/audit-logs/' + log._id, { method: 'DELETE', headers: { 'Authorization': 'Bearer test' } });
  console.log('Response:', await res.json());
  const updatedLog = await AuditLog.findOne({ _id: log._id });
  console.log('After delete deleted field:', updatedLog.deleted);
  process.exit();
});
