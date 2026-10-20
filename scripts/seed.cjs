'use strict';
// This script is deliberately incapable of seeding the live project.
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const fs = require('node:fs');
const path = require('node:path');
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'demo-jyothsna-hms' });
const db = admin.firestore();
const now = admin.firestore.Timestamp.now();
const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
// Hospital staff logins for the local emulator. They are read from a git-ignored
// file (`.env*` is excluded from git, Vercel and the handover archive) so that no
// password is ever committed. Format: [{ "email", "password", "role", "name", "department" }].
const accountsFile = path.join(__dirname, '../.env.accounts.json');
async function ensureAccounts() {
  if (!fs.existsSync(accountsFile)) return;
  const accounts = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
  for (const account of accounts) {
    const email = account.email.trim().toLowerCase(), name = account.name || email, role = account.role;
    const profile = { email, password: account.password, displayName: name, emailVerified: true };
    const existing = await admin.auth().getUserByEmail(email).catch(error => { if (error.code === 'auth/user-not-found') return null; throw error; });
    const user = existing ? await admin.auth().updateUser(existing.uid, profile) : await admin.auth().createUser({ uid: 'staff-' + email.split('@')[0], ...profile });
    const ref = db.doc('staff/' + user.uid);
    const record = { uid: user.uid, email, role, name, isActive: true, hasLogin: true, department: account.department || 'Administration', specialisation: role === 'doctor' ? 'Obstetrics & Gynaecology' : '', opFee: role === 'doctor' ? 500 : 0, freeOP: false };
    if (!(await ref.get()).exists) record.createdAt = now;
    await ref.set(record, { merge: true });
  }
  console.log(`Hospital staff logins ready: ${accounts.map(account => account.email).join(', ')}`);
}
async function seed() {
  await ensureAccounts();
  if ((await db.doc('_local/seed').get()).exists) { console.log('Existing local data preserved.'); return; }
  const roles = ['admin', 'doctor', 'nurse', 'receptionist', 'billing_staff', 'pharmacist', 'lab_technician', 'owner'];
  const batch = db.batch();
  for (const role of roles) {
    const uid = 'local-' + role, email = role + '@jyothsna.test';
    try { await admin.auth().createUser({ uid, email, password: 'DemoHospital123!', displayName: role === 'doctor' ? 'Dr. Demo Jyothsna' : 'Demo ' + role, emailVerified: true }); }
    catch (error) { if (!['auth/uid-already-exists', 'auth/email-already-exists'].includes(error.code)) throw error; }
    batch.set(db.doc('staff/' + uid), { uid, email, role, name: role === 'doctor' ? 'Dr. Demo Jyothsna' : 'Demo ' + role, isActive: true, department: role === 'doctor' ? 'Obstetrics' : 'Administration', specialisation: role === 'doctor' ? 'Obstetrics & Gynaecology' : '', opFee: 500, freeOP: false, createdAt: now });
  }
  batch.set(db.doc('hospitalSettings/main'), { hospitalName: 'Jyothsna Maternity Hospital', name: 'Jyothsna Maternity Hospital', address: 'Local demonstration — configure your hospital address', phone: '', email: '', integrations: {}, createdAt: now });
  batch.set(db.doc('publicHospital/main'), { hospitalName: 'Jyothsna Maternity Hospital', name: 'Jyothsna Maternity Hospital' });
  ['Obstetrics', 'Gynaecology', 'Paediatrics', 'General', 'Emergency', 'NICU'].forEach(name => batch.set(db.collection('departments').doc(name.toLowerCase()), { name, headDoctor: '', description: '', createdAt: now }));
  for (let index = 1; index <= 3; index++) {
    const patientId = `SA-${new Date().getFullYear()}-${String(index).padStart(5, '0')}`;
    const name = ['Demo Ananya', 'Demo Kavya', 'Demo Meera'][index - 1];
    const phone = '900000000' + index;
    batch.set(db.doc('patients/demo-patient-' + index), { patientId, name, nameLower: name.toLowerCase(), phone, age: 26 + index, dob: `${1999-index}-05-12`, gender: 'Female', bloodGroup: 'O+', address: 'Demonstration record', department: 'Obstetrics', doctor: 'Dr. Demo Jyothsna', doctorName: 'Dr. Demo Jyothsna', doctorId: 'local-doctor', status: 'opd', isPregnant: index < 3, lmp: date, edd: '', highRisk: false, allergies: '', createdAt: now, registeredBy: 'admin@jyothsna.test' });
    batch.set(db.doc('patientIndex/' + phone), { patientId, name, nameLower: name.toLowerCase(), phone, docId: 'demo-patient-' + index });
  }
  batch.set(db.doc('patientCounter/counter'), { count: 3 });
  for (let index = 1; index <= 6; index++) batch.set(db.doc('beds/demo-bed-' + index), { bedNumber: 'G-' + index, ward: 'General', bedType: 'General', status: 'available', dailyRate: 1500, chargesPerDay: 1500, patientId: '', patientName: '', createdAt: now });
  const services = [{ name: 'Consultation', category: 'Consultation', price: 500 }, { name: 'Complete Blood Count', category: 'Lab', price: 350 }, { name: 'Obstetric Ultrasound', category: 'Imaging', price: 1200 }];
  services.forEach((service, index) => batch.set(db.doc('serviceCatalog/demo-' + index), { ...service, code: 'DEMO-' + index, isActive: true }));
  batch.set(db.doc('pharmacy/demo-paracetamol'), { name: 'Demo Paracetamol 500 mg', medicineName: 'Demo Paracetamol 500 mg', nameLower: 'demo paracetamol 500 mg', genericName: 'Paracetamol', category: 'Tablet', stock: 100, minStock: 10, unitPrice: 2, sellingPrice: 2, price: 2, mrp: 2, purchasePrice: 1, batchNo: 'DEMO-001', batchNumber: 'DEMO-001', expiryDate: '2028-12-31', gstRate: 0, createdAt: now });
  batch.set(db.doc('_local/seed'), { version: 1, createdAt: now });
  await batch.commit();
  console.log('Seeded local staff, patients, beds, service catalog and medicine inventory.');
}
seed().then(() => admin.app().delete()).catch(error => { console.error(error.message); process.exitCode = 1; });
