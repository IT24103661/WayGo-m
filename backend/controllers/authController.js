const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const VEHICLE_PLATE_REGEX = /^[A-Z]{2,3}-\d{4}$/;
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Van', 'Bus', 'Minivan', 'Luxury'];
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME_MS = 3 * 60 * 1000;
const transientLoginAttempts = new Map();

function getTransientLockState(identifier, now) {
    const state = transientLoginAttempts.get(identifier);
    if (!state) return null;
    if (state.lockUntil && state.lockUntil <= now) {
        transientLoginAttempts.delete(identifier);
        return null;
    }
    return state;
}

function registerTransientFailure(identifier, now) {
    const current = getTransientLockState(identifier, now) || { attempts: 0, lockUntil: null };
    const nextAttempts = Number(current.attempts || 0) + 1;

    if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = now + LOCK_TIME_MS;
        transientLoginAttempts.set(identifier, { attempts: 0, lockUntil });
        return {
            locked: true,
            lockUntil,
            retryAfterSeconds: Math.ceil(LOCK_TIME_MS / 1000)
        };
    }

    transientLoginAttempts.set(identifier, { attempts: nextAttempts, lockUntil: null });
    return {
        locked: false,
        attemptsLeft: MAX_LOGIN_ATTEMPTS - nextAttempts
    };
}

function clearTransientFailures(identifier) {
    transientLoginAttempts.delete(identifier);
}

/* ─ helper: build a signed JWT ─ */
const signToken = (user) =>
    jwt.sign(
        { userId: user._id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

/* ─ helper: strip password from user object ─ */
const sanitize = (user) => {
    const obj = user.toObject();
    delete obj.password;
    return obj;
};

// ─────────────────────────────────────
// 1. REGISTER
// ─────────────────────────────────────
exports.registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            phone,
            vehicleDetails
        } = req.body;

        // --- Server-side validation ---
        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'Name, email, password and phone are all required.' });
        }

        const normalizedPhone = String(phone).trim();
        if (!/^\d{10}$/.test(normalizedPhone)) {
            return res.status(400).json({ message: 'Phone number must contain exactly 10 digits (numbers only).' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address.' });
        }

        if (role === 'Driver') {
            const plateNumber = String(vehicleDetails?.plateNumber || '').trim().toUpperCase();
            const make = String(vehicleDetails?.make || '').trim();
            const model = String(vehicleDetails?.model || '').trim();
            const vehicleType = String(vehicleDetails?.type || '').trim();
            const year = Number(vehicleDetails?.year);

            if (!plateNumber || !make || !model || !vehicleType || Number.isNaN(year)) {
                return res.status(400).json({
                    message: 'Driver registration requires plate number, make, model, year, and vehicle type.'
                });
            }

            if (!VEHICLE_PLATE_REGEX.test(plateNumber)) {
                return res.status(400).json({ message: 'Plate number must follow format ABC-1234.' });
            }

            if (!VEHICLE_TYPES.includes(vehicleType)) {
                return res.status(400).json({ message: 'Invalid vehicle type selected.' });
            }
        }

        // --- Check for duplicate email ---
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // --- Hash password ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- Create & save user ---
        const user = await User.create({
            name:     name.trim(),
            email:    email.toLowerCase().trim(),
            password: hashedPassword,
            phone:    normalizedPhone,
            role:     role || 'Tourist',
        });

        if (user.role === 'Driver') {
            const plateNumber = String(vehicleDetails.plateNumber || '').trim().toUpperCase();
            const make = String(vehicleDetails.make || '').trim();
            const model = String(vehicleDetails.model || '').trim();
            const vehicleType = String(vehicleDetails.type || '').trim();
            const year = Number(vehicleDetails.year);

            try {
                await Vehicle.create({
                    plateNumber,
                    make,
                    model,
                    year,
                    type: vehicleType,
                    category: vehicleDetails?.category || 'Economy',
                    capacity: Number(vehicleDetails?.capacity || 4),
                    color: vehicleDetails?.color || '',
                    assignedDriver: user._id,
                    managedBy: user._id,
                    status: 'Available'
                });

                user.vehicleDetails = {
                    type: vehicleType,
                    plateNumber,
                    model
                };
                await user.save();
            } catch (vehicleError) {
                await User.findByIdAndDelete(user._id);

                if (vehicleError?.code === 11000) {
                    return res.status(400).json({ message: 'Vehicle plate number already exists.' });
                }

                return res.status(500).json({ message: 'Driver account created failed while saving vehicle details.' });
            }
        }

        // --- Return token so front-end can auto-login ---
        const token = signToken(user);

        return res.status(201).json({
            message: 'Account created successfully!',
            token,
            role:  user.role,
            user:  sanitize(user),
        });

    } catch (error) {
        // Mongoose validation error (schema rules)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        // Duplicate key (unique index race condition)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Server error during registration. Please try again.' });
    }
};

// ─────────────────────────────────────
// 2. LOGIN
// ─────────────────────────────────────
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const now = Date.now();
        const transientState = getTransientLockState(normalizedEmail, now);

        if (transientState?.lockUntil && transientState.lockUntil > now) {
            const remainingMs = transientState.lockUntil - now;
            return res.status(423).json({
                message: 'Too many failed attempts. Login is locked for 3 minutes.',
                lockUntil: new Date(transientState.lockUntil).toISOString(),
                retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000))
            });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            const failedState = registerTransientFailure(normalizedEmail, now);
            if (failedState.locked) {
                return res.status(423).json({
                    message: 'Too many failed attempts. Your account is locked for 3 minutes.',
                    lockUntil: new Date(failedState.lockUntil).toISOString(),
                    retryAfterSeconds: failedState.retryAfterSeconds
                });
            }

            return res.status(400).json({
                message: `Invalid email or password. ${failedState.attemptsLeft} attempt(s) remaining before a 3-minute lock.`
            });
        }

        if (user.lockUntil && user.lockUntil.getTime() > now) {
            const remainingMs = user.lockUntil.getTime() - now;
            const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
            return res.status(423).json({
                message: `Account is temporarily locked. Try again in about ${remainingMinutes} minute(s).`,
                lockUntil: user.lockUntil.toISOString(),
                retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000))
            });
        }

        if (user.lockUntil && user.lockUntil.getTime() <= now) {
            user.lockUntil = null;
            user.loginAttempts = 0;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.loginAttempts = Number(user.loginAttempts || 0) + 1;

            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(now + LOCK_TIME_MS);
                user.loginAttempts = 0;
                await user.save();
                const retryAfterSeconds = Math.ceil(LOCK_TIME_MS / 1000);
                return res.status(423).json({
                    message: 'Too many failed attempts. Your account is locked for 3 minutes.',
                    lockUntil: user.lockUntil.toISOString(),
                    retryAfterSeconds
                });
            }

            const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
            await user.save();

            return res.status(400).json({
                message: `Invalid email or password. ${attemptsLeft} attempt(s) remaining before a 3-minute lock.`
            });
        }

        clearTransientFailures(normalizedEmail);

        if (user.loginAttempts || user.lockUntil) {
            user.loginAttempts = 0;
            user.lockUntil = null;
            await user.save();
        }

        const token = signToken(user);

        return res.json({
            message: 'Login successful!',
            token,
            role: user.role,
            user: sanitize(user),
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login. Please try again.' });
    }
};

// ─────────────────────────────────────
// 3. GET PROFILE  (protected)
// ─────────────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const requesterId = req.user?.userId;
        const requesterEmail = String(req.user?.email || '').toLowerCase().trim();
        let user = null;

        if (requesterId && mongoose.Types.ObjectId.isValid(requesterId)) {
            user = await User.findById(requesterId).select('-password');
        } else if (requesterEmail) {
            user = await User.findOne({ email: requesterEmail }).select('-password');
        } else {
            return res.status(401).json({ message: 'Invalid authentication token payload.' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.json({ user });
    } catch (error) {
        if (error?.name === 'CastError') {
            return res.status(401).json({ message: 'Invalid authentication token payload.' });
        }
        console.error('GetProfile error:', error);
        return res.status(500).json({ message: 'Server error fetching profile.' });
    }
};

// ─────────────────────────────────────
// 4. UPDATE PROFILE (protected)
// ─────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, email, company, depot, region } = req.body;
        
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // If email is provided and it's different from the current email
        if (email && email.trim() !== user.email) {
            const existingUser = await User.findOne({ email: email.trim() });
            if (existingUser) {
                return res.status(400).json({ message: 'Email is already in use.' });
            }
            user.email = email.trim();
        }

        if (name !== undefined) user.name = String(name).trim();
        if (phone !== undefined) {
            const normalizedPhone = String(phone).trim();
            if (!/^\d{10}$/.test(normalizedPhone)) {
                return res.status(400).json({ message: 'Phone number must contain exactly 10 digits (numbers only).' });
            }
            user.phone = normalizedPhone;
        }
        if (company !== undefined) user.company = String(company).trim();
        if (depot !== undefined) user.depot = String(depot).trim();
        if (region !== undefined) user.region = String(region).trim();

        await user.save();
        
        const updatedUser = sanitize(user);
        
        return res.json({
            success: true,
            message: 'Profile updated successfully!',
            user: updatedUser
        });
    } catch (error) {
        console.error('UpdateProfile error:', error);
        return res.status(500).json({ message: 'Server error updating profile.' });
    }
};

// ─────────────────────────────────────
// 5. CHANGE PASSWORD (protected)
// ─────────────────────────────────────
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required.' });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isCurrentMatch = await bcrypt.compare(String(currentPassword), user.password);
        if (!isCurrentMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        const isSameAsCurrent = await bcrypt.compare(String(newPassword), user.password);
        if (isSameAsCurrent) {
            return res.status(400).json({ message: 'New password must be different from the current password.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(String(newPassword), salt);
        await user.save();

        return res.json({
            success: true,
            message: 'Password updated successfully.'
        });
    } catch (error) {
        console.error('ChangePassword error:', error);
        return res.status(500).json({ message: 'Server error updating password.' });
    }
};

// ─────────────────────────────────────
// 6. DELETE PROFILE (protected)
// ─────────────────────────────────────
exports.deleteProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        return res.json({
            success: true,
            message: 'Account deleted successfully!'
        });
    } catch (error) {
        console.error('DeleteProfile error:', error);
        return res.status(500).json({ message: 'Server error deleting profile.' });
    }
};
