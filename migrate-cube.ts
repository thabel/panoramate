import { db } from './src/lib/db';
async function migrate() {
  try {
    const test = await db.query('SELECT 1');
    console.log('Database connection successful');
  } catch (err: any) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  const columnsToAdd = [
    { name: 'folder', type: 'VARCHAR(255)' },
    { name: 'previewUrl', type: 'TEXT' },
    { name: 'tileBaseUrl', type: 'TEXT' },
    { name: 'levels', type: 'JSON' }
  ];

  for (const col of columnsToAdd) {
    try {
      console.log(`Adding ${col.name} column...`);
      await db.execute(`ALTER TABLE tour_images ADD COLUMN ${col.name} ${col.type}`);
      console.log(`${col.name} column added successfully`);
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`${col.name} column already exists`);
      } else {
        console.error(`Error adding ${col.name} column:`, e.message);
      }
    }
  }
  
  try {
    console.log('Making filename optional...');
    await db.execute('ALTER TABLE tour_images MODIFY COLUMN filename VARCHAR(255) NULL');
    console.log('filename column modified successfully');
  } catch (e: any) {
    console.error('Error modifying filename column:', e.message);
  }

  console.log('Migration complete');
  process.exit(0);
}
migrate();
