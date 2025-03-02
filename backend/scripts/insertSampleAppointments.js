/**
 * Script para inserir agendamentos de exemplo diretamente no banco de dados
 * Este script é uma versão simplificada que cria um conjunto fixo de agendamentos
 * 
 * Para executar: node scripts/insertSampleAppointments.js
 */

const sequelize = require('../models/database');
const Appointment = require('../models/Appointment');

// Função para gerar um ID único
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Função principal
const insertSampleAppointments = async () => {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');

    // Data atual
    const currentDate = new Date();
    const today = currentDate.toISOString().split('T')[0];
    
    // Data de ontem e amanhã
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];
    
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

    // Agendamentos de exemplo
    const sampleAppointments = [
      {
        id: generateId(),
        clientName: 'João Silva',
        serviceName: 'Corte de Cabelo',
        date: yesterdayFormatted,
        time: '09:00',
        status: 'completed',
        barberId: '01',
        barberName: 'Maicon',
        price: 30
      },
      {
        id: generateId(),
        clientName: 'Maria Oliveira',
        serviceName: 'Corte e Barba',
        date: yesterdayFormatted,
        time: '10:30',
        status: 'completed',
        barberId: '02',
        barberName: 'Brendon',
        price: 45
      },
      {
        id: generateId(),
        clientName: 'Pedro Santos',
        serviceName: 'Degradê',
        date: today,
        time: '14:00',
        status: 'pending',
        barberId: '01',
        barberName: 'Maicon',
        price: 35
      },
      {
        id: generateId(),
        clientName: 'Ana Ferreira',
        serviceName: 'Hidratação',
        date: today,
        time: '16:30',
        status: 'pending',
        barberId: '02',
        barberName: 'Brendon',
        price: 40
      },
      {
        id: generateId(),
        clientName: 'Carlos Rodrigues',
        serviceName: 'Barba',
        date: tomorrowFormatted,
        time: '11:00',
        status: 'pending',
        barberId: '01',
        barberName: 'Maicon',
        price: 25
      },
      {
        id: generateId(),
        clientName: 'Juliana Costa',
        serviceName: 'Coloração',
        date: tomorrowFormatted,
        time: '15:30',
        status: 'pending',
        barberId: '02',
        barberName: 'Brendon',
        price: 70
      }
    ];

    console.log(`Inserindo ${sampleAppointments.length} agendamentos de exemplo...`);
    
    // Inserir os agendamentos no banco de dados
    const result = await Appointment.bulkCreate(sampleAppointments);
    
    console.log('Agendamentos inseridos com sucesso!');
    console.log(`Total de agendamentos inseridos: ${result.length}`);
    
    // Verificar o número total de agendamentos após a inserção
    const finalCount = await Appointment.count();
    console.log(`Total de agendamentos no banco de dados: ${finalCount}`);
    
    // Fechar a conexão com o banco de dados
    await sequelize.close();
    console.log('Conexão com o banco de dados fechada.');
    
  } catch (error) {
    console.error('Erro ao inserir agendamentos:', error);
    console.error('Detalhes do erro:', error.message);
    if (error.parent) {
      console.error('Erro SQL:', error.parent.message);
    }
    process.exit(1);
  }
};

// Executar a função principal
insertSampleAppointments();
