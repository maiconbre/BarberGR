const express = require('express');
const authController = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/validate-token', authController.validateToken);

// Protected routes
router.post('/register', protect, admin, authController.register);

// Rota para listar todos os usuários (apenas para depuração)
router.get('/users', async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'name', 'createdAt', 'updatedAt']
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários'
    });
  }
});

module.exports = router;
