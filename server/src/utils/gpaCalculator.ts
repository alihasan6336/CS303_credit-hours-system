import Enrollment from '../models/Enrollment';
import Student from '../models/Student';

/**
 * Converts a percentage grade (0-100) to a 4.0 scale GPA value.
 */
export const percentageToGradePoints = (percentage: number): number => {
  if (percentage >= 90) return 4.0;
  if (percentage >= 85) return 3.7;
  if (percentage >= 80) return 3.3;
  if (percentage >= 75) return 3.0;
  if (percentage >= 70) return 2.7;
  if (percentage >= 65) return 2.3;
  if (percentage >= 60) return 2.0;
  if (percentage >= 55) return 1.7;
  if (percentage >= 50) return 1.0;
  return 0.0;
};

/**
 * Calculates and updates a student's GPA and completed credit hours in the database.
 * @param studentId The MongoDB ID of the student.
 */
export const recalculateStudentGPA = async (studentId: string): Promise<{ gpa: number; completedCreditHours: number }> => {
  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Find all completed enrollments with populated course credits
  const completedEnrollments = await Enrollment.find({
    student: studentId,
    status: 'completed',
    grade: { $ne: null },
  }).populate('course', 'credits passingGrade');

  if (completedEnrollments.length === 0) {
    student.gpa = 0;
    student.completedCreditHours = 0;
    await student.save();
    return { gpa: 0, completedCreditHours: 0 };
  }

  let totalQualityPoints = 0;
  let totalCreditsForGpa = 0; // Credits that count towards GPA (exclude courses with grade 0?)
  let totalCompletedCredits = 0; // All credits for passed courses? Usually if grade > 0 they count? Or if they just took it?

  for (const enrollment of completedEnrollments) {
    const course = enrollment.course as any;
    if (!course || typeof course.credits !== 'number') continue;

    const credits = course.credits;
    const passingGrade = typeof course.passingGrade === 'number' ? course.passingGrade : 50;
    const grade = enrollment.grade || 0;
    const gradePoints = percentageToGradePoints(grade);

    totalQualityPoints += (gradePoints * credits);
    totalCreditsForGpa += credits;
    
    // In many systems, you only get credit if you pass (grade >= passingGrade)
    if (grade >= passingGrade) {
      totalCompletedCredits += credits;
    }
  }

  const finalGPA = totalCreditsForGpa > 0 ? Number((totalQualityPoints / totalCreditsForGpa).toFixed(2)) : 0;
  
  student.gpa = finalGPA;
  student.completedCreditHours = totalCompletedCredits;
  await student.save();

  return { gpa: finalGPA, completedCreditHours: totalCompletedCredits };
};
