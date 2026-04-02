import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

// GET /api/admin/audit - List all audit logs (super_admin only)
export const listAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Pagination
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    // Filters
    const { action, actorId } = req.query;
    const filter: any = {};
    if (action) filter.action = action;
    if (actorId) filter.actor = actorId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'fullName email role')
        .populate('targetUser', 'fullName email role')
        .populate('targetCourse', 'code name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/audit/mine - Current admin's own action history
export const myAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUser = req.adminUser!;

    // Pagination
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ actor: adminUser._id })
        .populate('targetUser', 'fullName email role')
        .populate('targetCourse', 'code name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments({ actor: adminUser._id }),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/audit/user/:id - All logs for a specific user (as actor or target)
export const userAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Pagination
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const filter = {
      $or: [{ actor: id }, { targetUser: id }],
    };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'fullName email role')
        .populate('targetUser', 'fullName email role')
        .populate('targetCourse', 'code name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
