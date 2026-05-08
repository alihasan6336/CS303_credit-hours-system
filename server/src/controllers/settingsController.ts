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
                enrollmentOpenLevels: settings.enrollmentOpenLevels || [],
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
        const { currentSemester, academicYear, isRegistrationOpen, tableVisible, enrollmentOpenLevels, enrollmentStartDate, enrollmentEndDate } = req.body;

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
            if (enrollmentOpenLevels !== undefined) settings.enrollmentOpenLevels = enrollmentOpenLevels;
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
                enrollmentOpenLevels: settings.enrollmentOpenLevels || [],
                enrollmentStartDate: settings.enrollmentStartDate,
                enrollmentEndDate: settings.enrollmentEndDate,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/settings/open-registration
// Table Admin: Open registration period (optionally for specific levels)
// Body: { levels?: number[] } — if omitted, opens for ALL levels [1,2,3,4]
export const openRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
        const { levels } = req.body;
        const targetLevels = Array.isArray(levels) && levels.length > 0
            ? levels.filter((l: number) => [1, 2, 3, 4].includes(l))
            : [1, 2, 3, 4];

        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                currentSemester: 'Spring',
                academicYear: '2024-2025',
            });
        }

        settings.isRegistrationOpen = true;
        // Merge with already-open levels
        const current = new Set(settings.enrollmentOpenLevels || []);
        targetLevels.forEach((l: number) => current.add(l));
        settings.enrollmentOpenLevels = Array.from(current).sort();
        await settings.save();

        // Audit log
        if (req.adminUser) {
            await AuditLog.create({
                actor: req.adminUser._id,
                action: 'registration:open',
                details: { semester: settings.currentSemester, academicYear: settings.academicYear, openedLevels: targetLevels },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({
            success: true,
            message: `Registration opened for Year ${targetLevels.join(', ')}`,
            isRegistrationOpen: true,
            enrollmentOpenLevels: settings.enrollmentOpenLevels,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/settings/close-registration
// Table Admin: Close registration period (optionally for specific levels)
// Body: { levels?: number[] } — if omitted, closes ALL levels
export const closeRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
        const { levels } = req.body;

        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                currentSemester: 'Spring',
                academicYear: '2024-2025',
            });
        }

        if (Array.isArray(levels) && levels.length > 0) {
            // Close only specified levels
            const toClose = new Set(levels.filter((l: number) => [1, 2, 3, 4].includes(l)));
            settings.enrollmentOpenLevels = (settings.enrollmentOpenLevels || []).filter(
                (l: number) => !toClose.has(l)
            );
            if (settings.enrollmentOpenLevels.length === 0) {
                settings.isRegistrationOpen = false;
            }
        } else {
            // Close all
            settings.isRegistrationOpen = false;
            settings.enrollmentOpenLevels = [];
        }
        await settings.save();

        // Audit log
        if (req.adminUser) {
            await AuditLog.create({
                actor: req.adminUser._id,
                action: 'registration:close',
                details: { semester: settings.currentSemester, academicYear: settings.academicYear, closedLevels: levels || 'all' },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({
            success: true,
            message: Array.isArray(levels) && levels.length > 0
                ? `Registration closed for Year ${levels.join(', ')}`
                : 'Registration closed for all levels',
            isRegistrationOpen: settings.isRegistrationOpen,
            enrollmentOpenLevels: settings.enrollmentOpenLevels,
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
