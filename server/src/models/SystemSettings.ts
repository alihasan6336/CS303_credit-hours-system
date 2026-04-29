import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
    currentSemester: 'Fall' | 'Spring' | 'Summer';
    academicYear: string;
    minCreditHoursDefault: number;
    maxCreditHoursDefault: number;
    isRegistrationOpen: boolean;
    tableVisible: boolean;
    enrollmentStartDate?: Date;
    enrollmentEndDate?: Date;
}

const SystemSettingsSchema: Schema = new Schema(
    {
        currentSemester: {
            type: String,
            required: true,
            enum: ['Fall', 'Spring', 'Summer'],
            default: 'Spring',
        },
        academicYear: {
            type: String,
            required: true,
            default: '2024-2025',
        },
        minCreditHoursDefault: {
            type: Number,
            default: 14,
        },
        maxCreditHoursDefault: {
            type: Number,
            default: 19,
        },
        isRegistrationOpen: {
            type: Boolean,
            default: false,
        },
        tableVisible: {
            type: Boolean,
            default: false,
        },
        enrollmentStartDate: {
            type: Date,
        },
        enrollmentEndDate: {
            type: Date,
        },
    },
    { timestamps: true }
);


// We need a singleton. We can enforce this if needed, or just always update the first document.
export default mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
