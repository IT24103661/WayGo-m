const SupportRequest = require('../models/SupportRequest');
const Vehicle = require('../models/Vehicle');

const ISSUE_TYPES = {
  SYSTEM_SUPPORT: 'SystemSupport',
  URGENT_DISPATCH: 'UrgentDispatch',
  APP_FEEDBACK: 'AppFeedback'
};

const VEHICLE_PLATE_REGEX = /^[A-Z]{2,3}-\d{4}$/;

exports.createSupportRequest = async (req, res) => {
  try {
    const {
      issueType,
      subject,
      description,
      vehicle,
      currentLocationText,
      currentLocation,
      emergencyType,
      message
    } = req.body;

    if (!Object.values(ISSUE_TYPES).includes(issueType)) {
      return res.status(400).json({
        message: 'Invalid issue type. Use SystemSupport, UrgentDispatch, or AppFeedback.'
      });
    }

    let resolvedVehicleId = vehicle;
    if (issueType === ISSUE_TYPES.URGENT_DISPATCH) {
      const normalizedPlate = String(vehicle || '').trim().toUpperCase();
      if (!VEHICLE_PLATE_REGEX.test(normalizedPlate)) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle number must follow format ABC-1234.'
        });
      }

      const matchedVehicle = await Vehicle.findOne({
        plateNumber: normalizedPlate,
        assignedDriver: req.user.userId
      }).select('_id');

      if (!matchedVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found for this driver with the given vehicle number.'
        });
      }

      resolvedVehicleId = matchedVehicle._id;
    }

    const payload = {
      issueType,
      driver: req.user.userId,
      subject,
      description,
      vehicle: resolvedVehicleId,
      currentLocationText,
      currentLocation,
      emergencyType,
      message
    };

    const request = await SupportRequest.create(payload);

    return res.status(201).json({
      success: true,
      message: 'Support request submitted successfully.',
      data: request
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error creating support request.',
      error: error.message
    });
  }
};

exports.getMySupportRequests = async (req, res) => {
  try {
    const requests = await SupportRequest.find({ driver: req.user.userId })
      .populate('vehicle', 'plateNumber make model category')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error fetching support requests.',
      error: error.message
    });
  }
};

exports.updateMySupportRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await SupportRequest.findOne({ _id: requestId, driver: req.user.userId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found.'
      });
    }

    const {
      subject,
      description,
      vehicle,
      currentLocationText,
      currentLocation,
      emergencyType,
      message
    } = req.body;

    if (request.issueType === ISSUE_TYPES.SYSTEM_SUPPORT) {
      if (subject !== undefined) request.subject = subject;
      if (description !== undefined) request.description = description;
    }

    if (request.issueType === ISSUE_TYPES.URGENT_DISPATCH) {
      if (vehicle !== undefined) {
        const normalizedPlate = String(vehicle || '').trim().toUpperCase();
        if (!VEHICLE_PLATE_REGEX.test(normalizedPlate)) {
          return res.status(400).json({
            success: false,
            message: 'Vehicle number must follow format ABC-1234.'
          });
        }

        const matchedVehicle = await Vehicle.findOne({
          plateNumber: normalizedPlate,
          assignedDriver: req.user.userId
        }).select('_id');

        if (!matchedVehicle) {
          return res.status(404).json({
            success: false,
            message: 'Vehicle not found for this driver with the given vehicle number.'
          });
        }

        request.vehicle = matchedVehicle._id;
      }
      if (emergencyType !== undefined) request.emergencyType = emergencyType;
      if (currentLocationText !== undefined) request.currentLocationText = currentLocationText;
      if (currentLocation !== undefined) request.currentLocation = currentLocation;
    }

    if (request.issueType === ISSUE_TYPES.APP_FEEDBACK) {
      if (message !== undefined) request.message = message;
    }

    await request.save();

    return res.json({
      success: true,
      message: 'Support request updated successfully.',
      data: request
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error updating support request.',
      error: error.message
    });
  }
};

exports.deleteMySupportRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await SupportRequest.findOne({ _id: requestId, driver: req.user.userId });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Support request not found.'
      });
    }

    await request.deleteOne();

    return res.json({
      success: true,
      message: 'Support request deleted successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error deleting support request.',
      error: error.message
    });
  }
};
