import { Request, Response } from 'express';
import AdminUser from '../models/AdminUser';
import AdminPermission, { ALL_PERMISSIONS, PermissionKey } from '../models/AdminPermission';
import AuditLog from '../models/AuditLog';

// GET /api/admin/permissions - List all admins with their permissions
export const listAllPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find all admin users (role: admin)
    const admins = await AdminUser.find({ role: 'admin' })
      .select('fullName email role isActive')
      .sort({ createdAt: -1 })
      .lean();

    // Find all permission docs
    const permissionDocs = await AdminPermission.find()
      .populate('grantedBy', 'fullName email')
      .lean();

    // Merge: every admin appears even if no permission doc
    const result = admins.map(admin => {
      const permDoc = permissionDocs.find(p => p.admin.toString() === admin._id.toString());
      return {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        isActive: admin.isActive,
        permissions: permDoc?.permissions || [],
        grantedBy: permDoc?.grantedBy || null,
        note: permDoc?.note || '',
        updatedAt: permDoc?.updatedAt || null,
      };
    });

    res.status(200).json({
      success: true,
      allKeys: ALL_PERMISSIONS,
      count: result.length,
      admins: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/permissions/:adminId - Get one admin's permissions
export const getAdminPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;

    const admin = await AdminUser.findById(adminId).select('fullName email role isActive').lean();
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }

    // super_admin has all permissions
    if (admin.role === 'superadmin') {
      res.status(200).json({
        success: true,
        admin: {
          _id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
        },
        permissions: ALL_PERMISSIONS,
        note: 'super_admin always has all permissions',
      });
      return;
    }

    const permDoc = await AdminPermission.findOne({ admin: adminId })
      .populate('grantedBy', 'fullName email')
      .lean();

    res.status(200).json({
      success: true,
      admin: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
      },
      permissions: permDoc?.permissions || [],
      grantedBy: permDoc?.grantedBy || null,
      note: permDoc?.note || '',
      updatedAt: permDoc?.updatedAt || null,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/permissions/:adminId - Set full permission list
export const setPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;
    const { permissions, note } = req.body;
    const caller = req.adminUser!;

    // Validate permissions array
    if (!Array.isArray(permissions)) {
      res.status(400).json({ success: false, message: 'Permissions must be an array' });
      return;
    }

    // Validate all keys
    const invalidKeys = permissions.filter((p: string) => !ALL_PERMISSIONS.includes(p as PermissionKey));
    if (invalidKeys.length > 0) {
      res.status(400).json({
        success: false,
        message: `Invalid permission keys: ${invalidKeys.join(', ')}`,
      });
      return;
    }

    // Check target admin
    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }

    // Cannot modify super_admin
    if (admin.role === 'superadmin') {
      res.status(403).json({ success: false, message: 'Cannot modify super_admin permissions' });
      return;
    }

    // Must be admin role
    if (admin.role !== 'admin') {
      res.status(400).json({ success: false, message: 'Target user is not an admin' });
      return;
    }

    // Upsert permission doc
    const permDoc = await AdminPermission.findOneAndUpdate(
      { admin: adminId },
      { permissions, grantedBy: caller._id, note: note || '' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('grantedBy', 'fullName email');

    // Audit log
    await AuditLog.create({
      actor: caller._id,
      action: 'permissions:set',
      targetUser: admin._id,
      details: { permissions, note },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Permissions updated',
      permission: permDoc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/permissions/:adminId/grant - Add specific permissions
export const grantPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;
    const caller = req.adminUser!;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      res.status(400).json({ success: false, message: 'Permissions array is required' });
      return;
    }

    // Validate keys
    const invalidKeys = permissions.filter((p: string) => !ALL_PERMISSIONS.includes(p as PermissionKey));
    if (invalidKeys.length > 0) {
      res.status(400).json({
        success: false,
        message: `Invalid permission keys: ${invalidKeys.join(', ')}`,
      });
      return;
    }

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }

    if (admin.role === 'superadmin') {
      res.status(403).json({ success: false, message: 'Cannot modify super_admin permissions' });
      return;
    }

    // Use $addToSet with $each for idempotent add
    const permDoc = await AdminPermission.findOneAndUpdate(
      { admin: adminId },
      {
        $addToSet: { permissions: { $each: permissions } },
        $set: { grantedBy: caller._id },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('grantedBy', 'fullName email');

    // Audit log
    await AuditLog.create({
      actor: caller._id,
      action: 'permissions:grant',
      targetUser: admin._id,
      details: { permissions },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Permissions granted',
      permission: permDoc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/permissions/:adminId/revoke - Remove specific permissions
export const revokePermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;
    const caller = req.adminUser!;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      res.status(400).json({ success: false, message: 'Permissions array is required' });
      return;
    }

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }

    if (admin.role === 'superadmin') {
      res.status(403).json({ success: false, message: 'Cannot modify super_admin permissions' });
      return;
    }

    // Use $pull with $in
    const permDoc = await AdminPermission.findOneAndUpdate(
      { admin: adminId },
      { $pull: { permissions: { $in: permissions } } },
      { new: true }
    ).populate('grantedBy', 'fullName email');

    // Audit log
    await AuditLog.create({
      actor: caller._id,
      action: 'permissions:revoke',
      targetUser: admin._id,
      details: { permissions },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Permissions revoked',
      permission: permDoc || { admin: adminId, permissions: [] },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/permissions/:adminId - Clear all permissions
export const clearPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adminId } = req.params;
    const caller = req.adminUser!;

    const admin = await AdminUser.findById(adminId);
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }

    if (admin.role === 'superadmin') {
      res.status(403).json({ success: false, message: 'Cannot modify super_admin permissions' });
      return;
    }

    // Set permissions to empty array
    const permDoc = await AdminPermission.findOneAndUpdate(
      { admin: adminId },
      { permissions: [], grantedBy: caller._id },
      { new: true, upsert: true }
    );

    // Audit log
    await AuditLog.create({
      actor: caller._id,
      action: 'permissions:clear',
      targetUser: admin._id,
      details: {},
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'All permissions cleared',
      permission: permDoc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
