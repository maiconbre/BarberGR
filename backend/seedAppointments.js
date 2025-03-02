const Appointment = require('./models/Appointment');
const sequelize = require('./models/database');

const seedAppointments = async () => {
  try {
    // Sincroniza os modelos com o banco de dados
    await sequelize.sync();

    // Remove todos os registros da tabela "Appointments"
    await Appointment.destroy({ where: {}, truncate: true });

    const specificDates = [];
    const today = new Date();
    for (let i = -7; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      specificDates.push(date.toISOString().split('T')[0]);
    }

    const services = [
      { name: 'Corte Tradicional', price: 45 },
      { name: 'Tesoura', price: 60 },
      { name: 'Navalha', price: 70 },
      { name: 'Reflexo', price: 80 },
      { name: 'Nevou', price: 90 }
    ];

    const clientNames = [
      'João', 'Pedro', 'Marcos', 'Matheus', 'Vini', 'Juninho', 'Mari', 'Felipe', 'Julia', 'Gabrielle'
    ];

    let idCounter = 1;
    const appointments = [];

    specificDates.forEach(date => {
      for (let i = 0; i < 50; i++) {
        const service = services[Math.floor(Math.random() * services.length)];
        const uniqueId = `${Date.now()}-${idCounter++}`;
        const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
        const time = `${Math.floor(Math.random() * 8) + 9}:00`;
        const status = Math.random() > 0.3 ? 'completed' : 'pending';

        appointments.push({
          id: uniqueId,
          clientName: clientName,
          serviceName: service.name,
          date: date,
          time: time,
          status: status,
          barberId: '01',
          barberName: 'Maicon',
          price: service.price
        });

        appointments.push({
          id: uniqueId,
          clientName: clientName,
          serviceName: service.name,
          date: date,
          time: time,
          status: status,
          barberId: '02',
          barberName: 'Brendon',
          price: service.price
        });
      }
    });

    // Insere os registros no banco de dados e valida os dados
    await Appointment.bulkCreate(appointments, { validate: true });
    console.log('Appointments seeded successfully!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding appointments:', error);
    await sequelize.close();
    process.exit(1);
  }
};

seedAppointments();
