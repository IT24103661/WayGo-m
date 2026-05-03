const DriverSalary = require('../models/DriverSalary');
const FleetNotification = require('../models/FleetNotification');
const User = require('../models/User');

const PAYROLL_ROLES = ['Driver', 'TourManager', 'FleetManager'];

const isPastDate = (date) => {
  const input = new Date(date);
  const startOfInput = new Date(input.getFullYear(), input.getMonth(), input.getDate());
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return startOfInput < startOfToday;
};

exports.getSalaryCandidates = async (req, res) => {
  try {
    const role = String(req.query.role || '').trim();
    if (!PAYROLL_ROLES.includes(role)) {
      return res.status(400).json({ message: 'role must be Driver, TourManager, or FleetManager.' });
    }

    const users = await User.find({ role }).select('name email phone role managedByFleetManager').sort({ name: 1 });
    return res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching salary candidates.' });
  }
};

exports.createSalaryApprovals = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!rows.length) {
      return res.status(400).json({ message: 'rows is required and must be a non-empty array.' });
    }

    const results = [];

    for (const row of rows) {
      const employeeId = String(row.employeeId || row.driverId || '').trim();
      const month = String(row.month || '').trim();
      const requestedRole = String(row.role || '').trim();
      const baseSalary = Number(row.baseSalary || 0);
      const performanceValue = Number(row.performanceValue || 0);
      const performanceRate = Number(row.performanceRate || 0);
      const performancePayInput = Number(row.performancePay);
      const performancePay = Number.isFinite(performancePayInput)
        ? performancePayInput
        : (performanceValue * performanceRate);
      const bonus = Number(row.bonus || 0);
      const deductions = Number(row.deductions || 0);
      const notes = String(row.notes || '').trim();
      const paymentStatus = String(row.paymentStatus || 'Pending');
      const paymentDateRaw = row.paymentDate;

      if (!employeeId || !month) {
        return res.status(400).json({ message: 'Each row requires employeeId and month.' });
      }

      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return res.status(400).json({ message: 'month must follow YYYY-MM format.' });
      }

      if (!['Pending', 'Paid'].includes(paymentStatus)) {
        return res.status(400).json({ message: 'paymentStatus must be Pending or Paid.' });
      }

      if ([
        baseSalary,
        performanceValue,
        performanceRate,
        performancePay,
        bonus,
        deductions
      ].some((n) => Number.isNaN(n) || n < 0)) {
        return res.status(400).json({
          message: 'baseSalary, performanceValue, performanceRate, performancePay, bonus, and deductions must be non-negative numbers.'
        });
      }

      let parsedPaymentDate = null;
      if (paymentDateRaw) {
        parsedPaymentDate = new Date(paymentDateRaw);
        if (Number.isNaN(parsedPaymentDate.getTime())) {
          return res.status(400).json({ message: 'paymentDate must be a valid date.' });
        }
        if (isPastDate(parsedPaymentDate)) {
          return res.status(400).json({ message: 'paymentDate cannot be in the past.' });
        }
      }

      const employee = await User.findById(employeeId).select('_id role managedByFleetManager');
      if (!employee || !PAYROLL_ROLES.includes(employee.role)) {
        return res.status(400).json({ message: 'employeeId must reference Driver, TourManager, or FleetManager.' });
      }

      if (requestedRole && requestedRole !== employee.role) {
        return res.status(400).json({ message: 'role does not match the selected employee.' });
      }

      const netSalary = baseSalary + performancePay + bonus - deductions;
      if (netSalary < 0) {
        return res.status(400).json({ message: 'Net salary cannot be negative.' });
      }

      const existing = await DriverSalary.findOne({
        month,
        $or: [
          { employee: employee._id },
          { driver: employee._id }
        ]
      });
      const fleetManager = employee.managedByFleetManager || req.user.userId;
      const employeeRole = employee.role;
      const driverRef = employee.role === 'Driver' ? employee._id : null;

      if (existing) {
        existing.fleetManager = fleetManager;
        existing.employee = employee._id;
        existing.employeeRole = employeeRole;
        existing.driver = driverRef;
        existing.baseSalary = baseSalary;
        existing.performanceValue = performanceValue;
        existing.performanceRate = performanceRate;
        existing.performancePay = performancePay;
        existing.bonus = bonus;
        existing.deductions = deductions;
        existing.netSalary = netSalary;
        existing.notes = notes;
        existing.paymentStatus = paymentStatus;
        existing.paymentDate = parsedPaymentDate || existing.paymentDate;
        if (paymentStatus === 'Paid') {
          existing.paymentDate = existing.paymentDate || parsedPaymentDate || new Date();
          existing.paidAt = existing.paidAt || new Date();
        } else if (paymentStatus === 'Pending') {
          existing.paidAt = null;
        }
        await existing.save();
        results.push(existing);
      } else {
        const created = await DriverSalary.create({
          fleetManager,
          driver: driverRef,
          employee: employee._id,
          employeeRole,
          month,
          baseSalary,
          performanceValue,
          performanceRate,
          performancePay,
          bonus,
          deductions,
          netSalary,
          paymentStatus,
          paymentDate: parsedPaymentDate || (paymentStatus === 'Paid' ? new Date() : null),
          paidAt: paymentStatus === 'Paid' ? (parsedPaymentDate || new Date()) : null,
          notes
        });
        results.push(created);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Salary rows saved successfully.',
      count: results.length,
      data: results
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error saving salary rows.' });
  }
};

exports.updateSalaryApproval = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const { baseSalary, performanceValue, performanceRate, performancePay, bonus, deductions, notes, paymentDate } = req.body;

    const salary = await DriverSalary.findById(salaryId);
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found.' });
    }

    if (!salary.employee && salary.driver) {
      salary.employee = salary.driver;
      salary.employeeRole = 'Driver';
    }

    if (baseSalary !== undefined) salary.baseSalary = Number(baseSalary);
    if (performanceValue !== undefined) salary.performanceValue = Number(performanceValue);
    if (performanceRate !== undefined) salary.performanceRate = Number(performanceRate);
    if (performancePay !== undefined) salary.performancePay = Number(performancePay);
    if (bonus !== undefined) salary.bonus = Number(bonus);
    if (deductions !== undefined) salary.deductions = Number(deductions);
    if (notes !== undefined) salary.notes = String(notes || '').trim();

    if ([
      salary.baseSalary,
      salary.performanceValue,
      salary.performanceRate,
      salary.performancePay,
      salary.bonus,
      salary.deductions
    ].some((n) => Number.isNaN(Number(n)) || Number(n) < 0)) {
      return res.status(400).json({
        message: 'baseSalary, performanceValue, performanceRate, performancePay, bonus, and deductions must be non-negative numbers.'
      });
    }

    salary.netSalary = Number(salary.baseSalary) + Number(salary.performancePay) + Number(salary.bonus) - Number(salary.deductions);
    if (salary.netSalary < 0) {
      return res.status(400).json({ message: 'Net salary cannot be negative.' });
    }

    if (paymentDate !== undefined) {
      if (!paymentDate) {
        salary.paymentDate = null;
      } else {
        const parsed = new Date(paymentDate);
        if (Number.isNaN(parsed.getTime())) {
          return res.status(400).json({ message: 'paymentDate must be a valid date.' });
        }
        if (isPastDate(parsed)) {
          return res.status(400).json({ message: 'paymentDate cannot be in the past.' });
        }
        salary.paymentDate = parsed;
      }
    }

    await salary.save();

    const updated = await DriverSalary.findById(salaryId)
      .populate('employee', 'name email phone role')
      .populate('driver', 'name email phone')
      .populate('fleetManager', 'name email');

    return res.json({
      success: true,
      message: 'Salary row updated successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating salary row.' });
  }
};

exports.getSalaryApprovals = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && ['Pending', 'Paid'].includes(status)) {
      query.paymentStatus = status;
    }

    const salaries = await DriverSalary.find(query)
      .populate('employee', 'name email phone role')
      .populate('driver', 'name email phone')
      .populate('fleetManager', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: salaries.length,
      data: salaries
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching salary approvals.' });
  }
};

exports.updateSalaryApprovalStatus = async (req, res) => {
  try {
    const { salaryId } = req.params;
    const { paymentStatus, paymentDate } = req.body;

    if (!['Pending', 'Paid'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'paymentStatus must be Pending or Paid.' });
    }

    let parsedPaymentDate = null;
    if (paymentDate) {
      parsedPaymentDate = new Date(paymentDate);
      if (Number.isNaN(parsedPaymentDate.getTime())) {
        return res.status(400).json({ message: 'paymentDate must be a valid date.' });
      }
      if (isPastDate(parsedPaymentDate)) {
        return res.status(400).json({ message: 'paymentDate cannot be in the past.' });
      }
    }

    const salary = await DriverSalary.findById(salaryId)
      .populate('employee', 'name role')
      .populate('driver', 'name');
    if (!salary) {
      return res.status(404).json({ message: 'Salary record not found.' });
    }

    if (!salary.employee && salary.driver) {
      salary.employee = salary.driver._id;
      salary.employeeRole = 'Driver';
    }

    salary.paymentStatus = paymentStatus;
    salary.paymentDate = parsedPaymentDate || salary.paymentDate;
    salary.paidAt = paymentStatus === 'Paid' ? (parsedPaymentDate || new Date()) : null;
    await salary.save();

    if (paymentStatus === 'Paid' && salary.fleetManager) {
      const employeeName = salary.employee?.name || salary.driver?.name || 'Employee';
      await FleetNotification.create({
        fleetManager: salary.fleetManager,
        message: `Salary approved by admin: ${employeeName} (${salary.month}) is marked as Paid.`,
        type: 'SALARY_PAID'
      });
    }

    const updated = await DriverSalary.findById(salaryId)
      .populate('employee', 'name email phone role')
      .populate('driver', 'name email phone')
      .populate('fleetManager', 'name email');

    return res.json({
      success: true,
      message: 'Salary status updated successfully.',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error updating salary status.' });
  }
};
