import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import Student from '../models/Student';
import AdminUser from '../models/AdminUser';

/**
 * POST /api/photos/upload
 * Upload a user profile photo to Cloudinary and save the URL in MongoDB.
 * Expects multipart/form-data with field name "photo".
 */
export const uploadPhoto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No photo provided. Please upload an image.',
      });
      return;
    }

    // Determine user from protect middleware
    const userId = req.student?._id || req.adminUser?._id;
    const isAdmin = !!req.adminUser;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Convert buffer to base64 data URI for Cloudinary upload
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    // Upload to Cloudinary using the user id as the public_id so it overwrites on re-upload
    const result = await cloudinary.uploader.upload(dataURI, {
      public_id: `${userId.toString()}`,
      overwrite: true,
      folder: 'credit-hours-system/users',
      resource_type: 'image',
      transformation: [{ width: 500, height: 500, crop: 'limit' }],
    });

    // Save URL to MongoDB
    let user: any;
    if (isAdmin) {
      user = await AdminUser.findByIdAndUpdate(
        userId,
        { photoUrl: result.secure_url },
        { new: true }
      );
    } else {
      user = await Student.findByIdAndUpdate(
        userId,
        { photoUrl: result.secure_url },
        { new: true }
      );
    }

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: result.secure_url,
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload photo',
    });
  }
};

/**
 * GET /api/photos/me
 * Retrieve the current user's photo URL from MongoDB.
 */
export const getMyPhoto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.student?._id || req.adminUser?._id;
    const isAdmin = !!req.adminUser;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    let user2: any;
    if (isAdmin) {
      user2 = await AdminUser.findById(userId).select('photoUrl fullName');
    } else {
      user2 = await Student.findById(userId).select('photoUrl fullName');
    }

    if (!user2) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      photoUrl: user2.photoUrl || '',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve photo',
    });
  }
};

/**
 * DELETE /api/photos/me
 * Remove the user's photo from Cloudinary and clear the URL in MongoDB.
 */
export const deletePhoto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.student?._id || req.adminUser?._id;
    const isAdmin = !!req.adminUser;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    let user3: any;
    if (isAdmin) {
      user3 = await AdminUser.findById(userId);
    } else {
      user3 = await Student.findById(userId);
    }

    if (!user3) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Delete from Cloudinary if a photo exists
    if (user3.photoUrl) {
      await cloudinary.uploader.destroy(
        `credit-hours-system/users/${userId.toString()}`
      );
    }

    user3.photoUrl = '';
    await user3.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      photoUrl: '',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete photo',
    });
  }
};
