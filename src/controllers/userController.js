// const { User } = require('../models');
// const { sequelize } = require('../database');

// Contoh controller
// const getAll = async (req, res, next) => {
//   try {
//     const users = await User.findAll();
//     res.status(200).json({
//       success: true,
//       data: users,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const getById = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findByPk(id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User tidak ditemukan',
//       });
//     }
//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const create = async (req, res, next) => {
//   try {
//     const user = await User.create(req.body);
//     res.status(201).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const update = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const [updated] = await User.update(req.body, {
//       where: { id },
//     });
//     if (!updated) {
//       return res.status(404).json({
//         success: false,
//         message: 'User tidak ditemukan',
//       });
//     }
//     const user = await User.findByPk(id);
//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const deleteUser = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const deleted = await User.destroy({
//       where: { id },
//     });
//     if (!deleted) {
//       return res.status(404).json({
//         success: false,
//         message: 'User tidak ditemukan',
//       });
//     }
//     res.status(200).json({
//       success: true,
//       message: 'User berhasil dihapus',
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   getAll,
//   getById,
//   create,
//   update,
//   delete: deleteUser,
// };

module.exports = {};
