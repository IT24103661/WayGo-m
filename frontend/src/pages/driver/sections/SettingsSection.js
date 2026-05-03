import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { MdEdit, MdPersonOutline } from 'react-icons/md';

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Van', 'Bus', 'Minivan', 'Luxury'];
const VEHICLE_CATEGORIES = ['Economy', 'Luxury', 'Van', 'SUV'];

const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
};

export default function SettingsSection() {
    const [user, setUser] = useState(null);
    const [vehicle, setVehicle] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [vehicleEditMode, setVehicleEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [vehicleLoading, setVehicleLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        rate: '2000',
    });
    const [vehicleFormData, setVehicleFormData] = useState({
        plateNumber: '',
        make: '',
        brand: '',
        model: '',
        type: '',
        category: '',
        year: '',
        color: '',
        capacity: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [vehicleErrors, setVehicleErrors] = useState({});

    const parseResponse = async (res) => {
        const text = await res.text();
        if (!text) return {};

        try {
            return JSON.parse(text);
        } catch (parseError) {
            throw new Error('Server returned non-JSON response. Check backend API URL and server status.');
        }
    };

    const handleUnauthorized = (json) => {
        const message = json?.message || 'Session expired. Please log in again.';
        localStorage.removeItem('waygo_token');
        localStorage.removeItem('waygo_role');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        throw new Error(message);
    };

    const fetchProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem('waygo_token');
            const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const json = await parseResponse(res);
            if (res.status === 401) handleUnauthorized(json);
            if (res.ok && json.user) {
                setUser(json.user);
                setFormData({
                    name: json.user.name || '',
                    email: json.user.email || '',
                    phone: json.user.phone || '',
                    rate: json.user.rate || '2000',
                });
            }
        } catch (e) {
            console.error('Failed to fetch profile', e);
        }
    }, []);

    const fetchVehicleProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem('waygo_token');
            const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/driver/profile/vehicle`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const json = await parseResponse(res);
            if (res.status === 401) handleUnauthorized(json);

            if (res.status === 404) {
                setVehicle(null);
                setVehicleFormData({
                    plateNumber: '',
                    make: '',
                    brand: '',
                    model: '',
                    type: '',
                    category: '',
                    year: '',
                    color: '',
                    capacity: ''
                });
                return;
            }

            if (res.ok && json.data) {
                setVehicle(json.data);
                setVehicleFormData({
                    plateNumber: json.data.plateNumber || '',
                    make: json.data.make || '',
                    brand: json.data.brand || '',
                    model: json.data.model || '',
                    type: json.data.type || '',
                    category: json.data.category || '',
                    year: json.data.year || '',
                    color: json.data.color || '',
                    capacity: json.data.capacity || ''
                });
            }
        } catch (e) {
            console.error('Failed to fetch vehicle profile', e);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
        fetchVehicleProfile();
    }, [fetchProfile, fetchVehicleProfile]);

    const handleSave = async () => {
        const errors = {};
        const trimmedName = formData.name.trim();
        const trimmedEmail = formData.email.trim();
        const trimmedPhone = formData.phone.trim();

        if (!trimmedName) {
            errors.name = 'Name is required.';
        } else if (trimmedName.length < 3) {
            errors.name = 'Name should be at least 3 characters.';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail) {
            errors.email = 'Email is required.';
        } else if (!emailRegex.test(trimmedEmail)) {
            errors.email = 'Enter a valid email address.';
        }

        if (!trimmedPhone) {
            errors.phone = 'Phone number is required.';
        } else if (!/^\d{10}$/.test(trimmedPhone)) {
            errors.phone = 'Phone number must contain exactly 10 digits (numbers only).';
        }

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('waygo_token');
            const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email
                })
            });
            const json = await parseResponse(res);
            if (res.status === 401) handleUnauthorized(json);
            if (!res.ok) throw new Error(json.message || 'Failed to update profile');

            const updatedUser = { ...user, ...json.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setEditMode(false);
            setFormErrors({});
            window.dispatchEvent(new Event('userUpdated'));
            alert('Profile updated successfully!');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVehicleSave = async () => {
        const errors = {};
        const plate = vehicleFormData.plateNumber.trim().toUpperCase();

        if (!/^[A-Z]{2,3}-\d{4}$/.test(plate)) {
            errors.plateNumber = 'Plate number must follow format ABC-1234.';
        }

        if (!vehicleFormData.make.trim()) {
            errors.make = 'Vehicle make is required.';
        }

        if (!vehicleFormData.model.trim()) {
            errors.model = 'Vehicle model is required.';
        }

        if (vehicleFormData.brand && vehicleFormData.brand.trim().length > 40) {
            errors.brand = 'Brand should be 40 characters or fewer.';
        }

        if (!vehicleFormData.type || !VEHICLE_TYPES.includes(vehicleFormData.type)) {
            errors.type = 'Vehicle type is required.';
        }

        if (!vehicleFormData.category || !VEHICLE_CATEGORIES.includes(vehicleFormData.category)) {
            errors.category = 'Vehicle category is required.';
        }

        const yearNumber = Number(vehicleFormData.year);
        const currentYear = new Date().getFullYear() + 1;
        if (Number.isNaN(yearNumber) || yearNumber < 1980 || yearNumber > currentYear) {
            errors.year = `Year must be between 1980 and ${currentYear}.`;
        }

        const capacityNumber = Number(vehicleFormData.capacity);
        if (Number.isNaN(capacityNumber) || capacityNumber < 1 || capacityNumber > 60) {
            errors.capacity = 'Capacity must be between 1 and 60.';
        }

        setVehicleErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        setVehicleLoading(true);
        try {
            const token = localStorage.getItem('waygo_token');
            const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/driver/profile/vehicle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plateNumber: plate,
                    make: vehicleFormData.make,
                    brand: vehicleFormData.brand,
                    model: vehicleFormData.model,
                    type: vehicleFormData.type,
                    category: vehicleFormData.category,
                    year: yearNumber,
                    color: vehicleFormData.color,
                    capacity: capacityNumber
                })
            });
            const json = await parseResponse(res);
            if (res.status === 401) handleUnauthorized(json);
            if (!res.ok) throw new Error(json.message || 'Failed to update vehicle profile');

            setVehicle(json.data);
            setVehicleFormData({
                plateNumber: json.data.plateNumber || '',
                make: json.data.make || '',
                brand: json.data.brand || '',
                model: json.data.model || '',
                type: json.data.type || '',
                category: json.data.category || '',
                year: json.data.year || '',
                color: json.data.color || '',
                capacity: json.data.capacity || ''
            });
            setVehicleEditMode(false);
            setVehicleErrors({});
            alert('Vehicle details updated successfully!');
        } catch (error) {
            alert(error.message);
        } finally {
            setVehicleLoading(false);
        }
    };

    const maintenanceInfo = useMemo(() => {
        if (!vehicle) return null;

        const current = Number(vehicle?.mileage?.current || 0);
        const lastService = Number(vehicle?.mileage?.lastService || 0);
        const interval = Number(vehicle?.mileage?.serviceInterval || 5000);
        const usedSinceService = Math.max(0, current - lastService);
        const remaining = Math.max(0, interval - usedSinceService);

        return {
            current,
            lastService,
            interval,
            remaining,
            isDue: remaining === 0,
            lastServiceDate: vehicle?.lastServiceDate,
            insuranceExpiry: vehicle?.insuranceExpiry || vehicle?.compliance?.insuranceExpiry
        };
    }, [vehicle]);

    return (
        <div className='space-y-8'>
            <div className='flex flex-col gap-2'>
                <p className='text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase'>Preferences</p>
                <h2 className='text-2xl font-bold text-cyan-950'>My Profile</h2>
                <p className='text-cyan-700/80'>Manage your profile and payment details.</p>
            </div>

            <div className='bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-[0_20px_45px_-35px_rgba(8,145,178,0.2)] border border-cyan-200'>
                <div className='flex justify-between items-center mb-8'>
                    <h3 className='text-lg font-bold text-cyan-950 flex items-center gap-2'>
                        <MdPersonOutline className='text-cyan-500 text-2xl' />
                        Personal Information
                    </h3>
                    <button
                        onClick={editMode ? handleSave : () => setEditMode(true)}
                        disabled={loading}
                        className='px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:-translate-y-0.5'
                    >
                        {editMode ? (loading ? 'Saving...' : 'Save Changes') : (
                            <>
                                <MdEdit />
                                Edit Profile
                            </>
                        )}
                    </button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {['Name', 'Email', 'Phone'].map(field => {
                        const key = field.toLowerCase();
                        return (
                            <div key={key} className='space-y-2'>
                                <label className='text-sm font-semibold text-cyan-800'>{field}</label>
                                {editMode ? (
                                    <>
                                        <input 
                                            className='w-full px-4 py-3 rounded-2xl bg-cyan-50/50 border border-cyan-100 text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all'
                                            value={formData[key]}
                                            onChange={e => {
                                                const rawValue = e.target.value;
                                                if (key === 'phone') {
                                                    setFormErrors((prev) => ({
                                                        ...prev,
                                                        phone: ''
                                                    }));
                                                }
                                                const value = key === 'phone'
                                                    ? rawValue.replace(/\D/g, '').slice(0, 10)
                                                    : rawValue;
                                                setFormData({ ...formData, [key]: value });
                                            }}
                                            type={key === 'email' ? 'email' : 'text'}
                                            inputMode={key === 'phone' ? 'numeric' : undefined}
                                            pattern={key === 'phone' ? '[0-9]*' : undefined}
                                            maxLength={key === 'phone' ? 10 : undefined}
                                        />
                                        {formErrors[key] && <p className='text-xs text-rose-600 mt-1'>{formErrors[key]}</p>}
                                    </>
                                ) : (
                                    <div className='px-4 py-3 rounded-2xl bg-cyan-50/50 border border-cyan-100 text-cyan-900 font-medium break-words'>
                                        {formData[key] || 'Not Set'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className='bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-[0_20px_45px_-35px_rgba(8,145,178,0.2)] border border-cyan-200'>
                <div className='flex justify-between items-center mb-8'>
                    <h3 className='text-lg font-bold text-cyan-950 flex items-center gap-2'>
                        <MdPersonOutline className='text-cyan-500 text-2xl' />
                        Vehicle Information
                    </h3>
                    <button
                        onClick={vehicleEditMode ? handleVehicleSave : () => setVehicleEditMode(true)}
                        disabled={vehicleLoading || !vehicle}
                        className='px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:-translate-y-0.5 disabled:opacity-60'
                    >
                        {vehicleEditMode ? (vehicleLoading ? 'Saving...' : 'Save Vehicle') : (
                            <>
                                <MdEdit />
                                Edit Vehicle
                            </>
                        )}
                    </button>
                </div>

                {!vehicle && (
                    <div className='px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm'>
                        No vehicle is currently assigned to your driver profile. Please contact your fleet manager.
                    </div>
                )}

                {vehicle && (
                    <>
                    {maintenanceInfo && (
                        <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${maintenanceInfo.isDue ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-cyan-50 border-cyan-200 text-cyan-700'}`}>
                            <p className='font-semibold'>Maintenance Reminder</p>
                            <p className='mt-1'>Current Mileage: {maintenanceInfo.current.toLocaleString()} km</p>
                            <p>Last Service Mileage: {maintenanceInfo.lastService.toLocaleString()} km</p>
                            <p>Service Interval: {maintenanceInfo.interval.toLocaleString()} km</p>
                            <p>{maintenanceInfo.isDue ? 'Service is due now.' : `${maintenanceInfo.remaining.toLocaleString()} km remaining to next service.`}</p>
                            <p>Last Service Date: {formatDate(maintenanceInfo.lastServiceDate)}</p>
                            <p>Insurance Expiry: {formatDate(maintenanceInfo.insuranceExpiry)}</p>
                        </div>
                    )}

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {[
                            ['plateNumber', 'Plate Number'],
                            ['make', 'Make'],
                            ['brand', 'Brand'],
                            ['model', 'Model'],
                            ['type', 'Type'],
                            ['category', 'Category'],
                            ['year', 'Year'],
                            ['color', 'Color'],
                            ['capacity', 'Capacity']
                        ].map(([key, label]) => (
                            <div key={key} className='space-y-2'>
                                <label className='text-sm font-semibold text-cyan-800'>{label}</label>
                                {vehicleEditMode ? (
                                    <>
                                        {key === 'type' ? (
                                            <select
                                                className='w-full px-4 py-3 rounded-2xl bg-cyan-50/50 border border-cyan-100 text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all'
                                                value={vehicleFormData.type}
                                                onChange={(e) => setVehicleFormData({ ...vehicleFormData, type: e.target.value })}
                                            >
                                                <option value=''>Select vehicle type</option>
                                                {VEHICLE_TYPES.map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        ) : key === 'category' ? (
                                            <select
                                                className='w-full px-4 py-3 rounded-2xl bg-cyan-50/50 border border-cyan-100 text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all'
                                                value={vehicleFormData.category}
                                                onChange={(e) => setVehicleFormData({ ...vehicleFormData, category: e.target.value })}
                                            >
                                                <option value=''>Select vehicle category</option>
                                                {VEHICLE_CATEGORIES.map((category) => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                className='w-full px-4 py-3 rounded-2xl bg-cyan-50/50 border border-cyan-100 text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all'
                                                value={vehicleFormData[key]}
                                                onChange={(e) => {
                                                    const value = key === 'plateNumber' ? e.target.value.toUpperCase() : e.target.value;
                                                    setVehicleFormData({ ...vehicleFormData, [key]: value });
                                                }}
                                                placeholder={key === 'plateNumber' ? 'BGK-1234' : undefined}
                                            />
                                        )}
                                        {vehicleErrors[key] && <p className='text-xs text-rose-600 mt-1'>{vehicleErrors[key]}</p>}
                                    </>
                                ) : (
                                    <div className='px-4 py-3 rounded-2xl bg-cyan-50/50 border border-cyan-100 text-cyan-900 font-medium break-words'>
                                        {vehicleFormData[key] || 'Not Set'}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}