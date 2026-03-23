// prisma/seed.js — Seeds demo data for development
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization / user
  const hashedPassword = await bcrypt.hash('Demo@1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@company.com' },
    update: {},
    create: {
      name: 'Demo Admin',
      email: 'demo@company.com',
      password: hashedPassword,
      organization: 'Demo Corp',
      role: 'ADMIN',
      settings: {
        create: { workingDays: 26, currency: 'USD' },
      },
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // Create sample employees
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        userId: user.id,
        name: 'Alice Johnson',
        age: 28,
        salary: 5000,
        role: 'Software Engineer',
        department: 'Engineering',
        joiningDate: new Date('2022-03-15'),
        email: 'alice@company.com',
        phone: '+1-555-0101',
      },
    }),
    prisma.employee.create({
      data: {
        userId: user.id,
        name: 'Bob Smith',
        age: 34,
        salary: 7500,
        role: 'Product Manager',
        department: 'Product',
        joiningDate: new Date('2021-07-01'),
        email: 'bob@company.com',
        phone: '+1-555-0102',
      },
    }),
    prisma.employee.create({
      data: {
        userId: user.id,
        name: 'Carol White',
        age: 25,
        salary: 4000,
        role: 'Designer',
        department: 'Design',
        joiningDate: new Date('2023-01-10'),
        email: 'carol@company.com',
      },
    }),
  ]);

  console.log(`✅ ${employees.length} employees created`);

  // Seed attendance for current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LEAVE'];

  for (const emp of employees) {
    for (let day = 1; day <= today.getDate() - 1; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: emp.id, date } },
        update: {},
        create: {
          employeeId: emp.id,
          userId: user.id,
          date,
          status: statuses[Math.floor(Math.random() * statuses.length)],
        },
      });
    }
  }

  console.log('✅ Attendance records seeded');
  console.log('\n🎉 Seed complete!');
  console.log('   Email: demo@company.com');
  console.log('   Password: Demo@1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
