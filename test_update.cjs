const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://karansabbarwal16:kara2006n@project.ogsjs08.mongodb.net/physiosync?appName=project').then(async () => {
  const AuditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    performed_by: { type: String, required: true },
    target_patient: { type: String },
    details: { type: String },
    deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null }
  });
  const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

  const res = await AuditLog.updateMany({ deleted: { $ne: true } }, { deleted: true, deleted_at: new Date() });
  console.log('Update result:', res);
  
  process.exit(0);
});
