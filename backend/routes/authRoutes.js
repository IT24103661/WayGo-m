const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, updateProfile, changePassword, deleteProfile } = require('../controllers/authController');
const {
	getSalaryApprovals,
	updateSalaryApprovalStatus,
	getSalaryCandidates,
	createSalaryApprovals,
	updateSalaryApproval
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login',    loginUser);

// Protected routes (valid JWT required)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/password', protect, changePassword);
router.put('/password', protect, changePassword);
router.delete('/profile', protect, deleteProfile);

// Admin salary approval routes
router.get('/admin/salaries/candidates', protect, authorizeRoles('SystemAdmin', 'Admin'), getSalaryCandidates);
router.get('/admin/salaries', protect, authorizeRoles('SystemAdmin', 'Admin'), getSalaryApprovals);
router.post('/admin/salaries', protect, authorizeRoles('SystemAdmin', 'Admin'), createSalaryApprovals);
router.put('/admin/salaries/:salaryId', protect, authorizeRoles('SystemAdmin', 'Admin'), updateSalaryApproval);
router.patch('/admin/salaries/:salaryId/status', protect, authorizeRoles('SystemAdmin', 'Admin'), updateSalaryApprovalStatus);

module.exports = router;
