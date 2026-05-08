import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Course from '../models/Course';
import { recalculateStudentGPA } from './gpaCalculator';

/**
 * Calculate current semester credits from active enrollments
 */
export const calculateCurrentSemesterCredits = async (studentId: string): Promise<number> => {
  const student = await Student.findById(studentId);
  if (!student) return 0;

  const activeEnrollments = await Enrollment.find({
    student: studentId,
    semester: student.currentSemester,
    status: 'active',
  }).populate('course', 'credits');

  return activeEnrollments.reduce(
    (sum, e) => sum + ((e.course as any)?.credits || 0),
    0
  );
};

/**
 * Calculate total earned credits from completed/passed courses
 * A course counts if grade >= 50 (passing)
 */
export const calculateEarnedCredits = async (studentId: string): Promise<number> => {
  const completedEnrollments = await Enrollment.find({
    student: studentId,
    status: 'completed',
    grade: { $gte: 50 }, // Only count passed courses
  }).populate('course', 'credits');

  return completedEnrollments.reduce(
    (sum, e) => sum + ((e.course as any)?.credits || 0),
    0
  );
};

/**
 * Determine student level based on completed credits
 * Level 1: 0-29 credits
 * Level 2: 30-59 credits
 * Level 3: 60-89 credits
 * Level 4: 90+ credits
 */
export const determineLevelFromCredits = (completedCredits: number): number => {
  if (completedCredits >= 90) return 4;
  if (completedCredits >= 60) return 3;
  if (completedCredits >= 30) return 2;
  return 1;
};

/**
 * Auto-promote student level based on completed credits
 * Returns true if level was updated
 */
export const autoPromoteStudentLevel = async (studentId: string): Promise<{ 
  promoted: boolean; 
  oldLevel: number; 
  newLevel: number;
  completedCredits: number;
}> => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const completedCredits = await calculateEarnedCredits(studentId);
  const calculatedLevel = determineLevelFromCredits(completedCredits);
  const oldLevel = student.level;

  // Only promote, never demote
  if (calculatedLevel > oldLevel) {
    student.level = calculatedLevel;
    student.completedCreditHours = completedCredits;
    await student.save();

    return {
      promoted: true,
      oldLevel,
      newLevel: calculatedLevel,
      completedCredits,
    };
  }

  // Update completed credits even if level didn't change
  if (student.completedCreditHours !== completedCredits) {
    student.completedCreditHours = completedCredits;
    await student.save();
  }

  return {
    promoted: false,
    oldLevel,
    newLevel: oldLevel,
    completedCredits,
  };
};

/**
 * Advance to next semester
 * Automatically promotes level if student has enough credits
 */
export const advanceSemester = async (studentId: string): Promise<{
  success: boolean;
  oldSemester: string;
  newSemester: string;
  levelPromotion: {
    promoted: boolean;
    oldLevel: number;
    newLevel: number;
  };
}> => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const semesterOrder = ['Fall', 'Spring', 'Summer'];
  const oldSemester = student.currentSemester;
  const currentIndex = semesterOrder.indexOf(oldSemester);
  const newSemester = semesterOrder[(currentIndex + 1) % 3];

  // Update semester
  student.currentSemester = newSemester as any;

  // Check for level promotion
  const levelPromotion = await autoPromoteStudentLevel(studentId);

  await student.save();

  return {
    success: true,
    oldSemester,
    newSemester,
    levelPromotion: {
      promoted: levelPromotion.promoted,
      oldLevel: levelPromotion.oldLevel,
      newLevel: levelPromotion.newLevel,
    },
  };
};

/**
 * Complete current semester
 * - Marks all active enrollments as completed (with grade 0, admin will update later)
 * - Advances to next semester
 * - Recalculates GPA and completed credits
 * - Auto-promotes level if applicable
 */
export const completeSemester = async (studentId: string): Promise<{
  success: boolean;
  message: string;
  stats: {
    coursesCompleted: number;
    oldLevel: number;
    newLevel: number;
    oldSemester: string;
    newSemester: string;
    completedCredits: number;
    gpa: number;
  };
}> => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Get all active enrollments for current semester
  const activeEnrollments = await Enrollment.find({
    student: studentId,
    semester: student.currentSemester,
    status: 'active',
  });

  // Mark all as completed (admin will add grades later)
  for (const enrollment of activeEnrollments) {
    enrollment.status = 'completed';
    if (!enrollment.grade) {
      enrollment.grade = 0; // Placeholder, admin will update
    }
    await enrollment.save();
  }

  // Recalculate GPA and completed credits
  const gpaResult = await recalculateStudentGPA(studentId);

  // Advance semester and check level promotion
  const semesterResult = await advanceSemester(studentId);

  return {
    success: true,
    message: `Semester completed successfully. ${activeEnrollments.length} courses marked as completed.`,
    stats: {
      coursesCompleted: activeEnrollments.length,
      oldLevel: semesterResult.levelPromotion.oldLevel,
      newLevel: semesterResult.levelPromotion.newLevel,
      oldSemester: semesterResult.oldSemester,
      newSemester: semesterResult.newSemester,
      completedCredits: gpaResult.completedCreditHours,
      gpa: gpaResult.gpa,
    },
  };
};

/**
 * Get full academic summary for a student
 */
export const getAcademicSummary = async (studentId: string) => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  // All enrollments with course details
  const allEnrollments = await Enrollment.find({ student: studentId })
    .populate('course', 'code name credits')
    .sort({ enrolledAt: -1 });

  // Active enrollments (current semester)
  const activeEnrollments = allEnrollments.filter(e => e.status === 'active');
  const currentCredits = activeEnrollments.reduce(
    (sum, e) => sum + ((e.course as any)?.credits || 0),
    0
  );

  // Completed enrollments
  const completedEnrollments = allEnrollments.filter(e => e.status === 'completed');
  const completedCredits = completedEnrollments.reduce(
    (sum, e) => sum + ((e.course as any)?.credits || 0),
    0
  );

  // Calculate next level threshold
  const creditsPerLevel = 30;
  const creditsInCurrentLevel = student.completedCreditHours % creditsPerLevel;
  const creditsNeededForNextLevel = creditsPerLevel - creditsInCurrentLevel;

  return {
    student: {
      id: student._id,
      fullName: student.fullName,
      currentLevel: student.level,
      currentSemester: student.currentSemester,
      gpa: student.gpa,
    },
    credits: {
      currentSemester: currentCredits,
      completedTotal: student.completedCreditHours,
      earned: completedCredits, // Only passed courses
      inProgress: currentCredits,
    },
    levelProgress: {
      currentLevel: student.level,
      nextLevel: student.level < 4 ? student.level + 1 : null,
      creditsInCurrentLevel,
      creditsNeededForNextLevel,
      percentageToNextLevel: Math.round((creditsInCurrentLevel / creditsPerLevel) * 100),
    },
    enrollments: {
      active: activeEnrollments.length,
      completed: completedEnrollments.length,
      total: allEnrollments.length,
    },
  };
};
