import { Request, Response } from 'express';
import SystemSettings from '../models/SystemSettings';
import AuditLog from '../models/AuditLog';

// GET /api/settings
export const getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                currentSemester: 'Spring',
                academicYear: '2024-2025',
                isRegistrationOpen: false,
                tableVisible: false,
            });
        }

        res.status(200).json({
            success: true,
            settings: {
                currentSemester: settings.currentSemester,
                academicYear: settings.academicYear,
                isRegistrationOpen: settings.isRegistrationOpen,
                tableVisible: settings.tableVisible,
                enrollmentStartDate: settings.enrollmentStartDate,
                enrollmentEndDate: settings.enrollmentEndDate,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/settings
// Super Admin + Table Admin can update settings
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentSemester, academicYear, isRegistrationOpen, tableVisible, enrollmentStartDate, enrollmentEndDate } = req.body;

        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                currentSemester: currentSemester || 'Spring',
                academicYear: academicYear || '2024-2025',
                isRegistrationOpen: isRegistrationOpen ?? false,
                tableVisible: tableVisible ?? false,
                enrollmentStartDate: enrollmentStartDate,
                enrollmentEndDate: enrollmentEndDate,
            });
        } else {
            if (currentSemester) settings.currentSemester = currentSemester;
            if (academicYear) settings.academicYear = academicYear;
            if (isRegistrationOpen !== undefined) settings.isRegistrationOpen = isRegistrationOpen;
            if (tableVisible !== undefined) settings.tableVisible = tableVisible;
            if (enrollmentStartDate) settings.enrollmentStartDate = new Date(enrollmentStartDate);
            if (enrollmentEndDate) settings.enrollmentEndDate = new Date(enrollmentEndDate);
            await settings.save();
        }

        // Audit log
        if (req.adminUser) {
            await AuditLog.create({
                actor: req.adminUser._id,
                action: 'system:settings_update',
                details: { 
                    currentSemester: settings.currentSemester, 
                    academicYear: settings.academicYear,
                    isRegistrationOpen: settings.isRegistrationOpen,
                    tableVisible: settings.tableVisible,
                },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({
            success: true,
            message: 'System settings updated successfully',
            settings: {
                currentSemester: settings.currentSemester,
                academicYear: settings.academicYear,
                isRegistrationOpen: settings.isRegistrationOpen,
                tableVisible: settings.tableVisible,
                enrollmentStartDate: settings.enrollmentStartDate,
                enrollmentEndDate: settings.enrollmentEndDate,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/settings/open-registration
// Table Admin: Open registration period
export const openRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                currentSemester: 'Spring',
                academicYear: '2024-2025',
            });
        }
        
        settings.isRegistrationOpen = true;
        await settings.save();

        // Audit log
        if (req.adminUser) {
            await AuditLog.create({
                actor: req.adminUser._id,
                action: 'registration:open',
                details: { semester: settings.currentSemester, academicYear: settings.academicYear },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Registration opened successfully',
            isRegistrationOpen: true,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/settings/close-registration
// Table Admin: Close registration period
export const closeRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                currentSemester: 'Spring',
                academicYear: '2024-2025',
            });
        }
        
        settings.isRegistrationOpen = false;
        await settings.save();

        // Audit log
        if (req.adminUser) {
            await AuditLog.create({
                actor: req.adminUser._id,
                action: 'registration:close',
                details: { semester: settings.currentSemester, academicYear: settings.academicYear },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Registration closed successfully',
            isRegistrationOpen: false,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/settings/show-table
// Table Admin: Make enrollment table visible to students
export const showTable = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                currentSemester: 'Spring',
                academicYear: '2024-2025',
            });
        }
        
        settings.tableVisible = true;
        await settings.save();

        // Audit log
        if (req.adminUser) {
            await AuditLog.create({
                actor: req.adminUser._id,
                action: 'table:show',
                details: { semester: settings.currentSemester },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Enrollment table is now visible to students',
            tableVisible: true,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/settings/hide-table
// Table Admin: Hide enrollment table from students
export const hideTable = async (req: Request, res: Response): Promise<void> => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                currentSemester: 'Spring',
                academicYear: '2024-2025',
            });
        }
        
        settings.tableVisible = false;
        await settings.save();

        // Audit log
        if (req.adminUser) {
            await AuditLog.create({
                actor: req.adminUser._id,
                action: 'table:hide',
                details: { semester: settings.currentSemester },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Enrollment table is now hidden from students',
            tableVisible: false,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
