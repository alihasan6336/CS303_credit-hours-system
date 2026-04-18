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
            });
        }

        res.status(200).json({
            success: true,
            settings: {
                currentSemester: settings.currentSemester,
                academicYear: settings.academicYear,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/settings
// Super Admin only
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentSemester, academicYear } = req.body;

        if (!currentSemester && !academicYear) {
            res.status(400).json({ success: false, message: 'Must provide currentSemester or academicYear' });
            return;
        }

        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({
                currentSemester: currentSemester || 'Spring',
                academicYear: academicYear || '2024-2025',
            });
        } else {
            if (currentSemester) settings.currentSemester = currentSemester;
            if (academicYear) settings.academicYear = academicYear;
            await settings.save();
        }

        // Audit log
        if (req.adminUser && req.adminUser.role === 'superadmin') {
            await AuditLog.create({
                actor: req.adminUser._id,
                action: 'system:settings_update',
                details: { currentSemester: settings.currentSemester, academicYear: settings.academicYear },
                ipAddress: req.ip,
            });
        }

        res.status(200).json({
            success: true,
            message: 'System settings updated successfully',
            settings: {
                currentSemester: settings.currentSemester,
                academicYear: settings.academicYear,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
