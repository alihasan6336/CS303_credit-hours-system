import OpenAI from 'openai';
import { ICourse } from '../models/Course';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIAdvice {
  summary: string;
  reasoning: string;
  tips: string[];
}

/**
 * Uses OpenAI to analyze a generated schedule and provide academic advice.
 * This handles the "logic" of why a schedule is good and provides tips for the student.
 */
export const getAIAdviceForSchedule = async (
  schedule: ICourse[],
  credits: number,
  days: string[]
): Promise<AIAdvice | null> => {
  if (!process.env.OPENAI_API_KEY) return null;

  const courseList = schedule.map(c => `${c.code}: ${c.name} (${c.credits} cr) on ${c.day} at ${c.time}`).join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Academic Advisor for a University. Your goal is to review a student's schedule and provide encouraging, helpful advice."
        },
        {
          role: "user",
          content: `Here is my optimized course schedule for this semester:
Total Credits: ${credits}
Unique Days on Campus: ${days.join(', ')}

Selected Courses:
${courseList}

Please provide:
1. A brief summary of the schedule's balance.
2. The reasoning why this is a good choice for someone looking to minimize days on campus.
3. 3-4 specific academic tips for handling this specific workload (e.g. if many classes are on one day, advise on time management).

Format the response as a JSON object with keys: "summary", "reasoning", "tips" (array of strings).`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    return JSON.parse(content) as AIAdvice;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return null;
  }
};

/**
 * Uses OpenAI to intelligently select the best courses from a list.
 * This complements the algorithmic solver by handling more complex preferences.
 */
export const generateAIScheduleSelection = async (
  availableCourses: ICourse[],
  minCredits: number,
  maxCredits: number
): Promise<string[] | null> => {
  if (!process.env.OPENAI_API_KEY) return null;

  const simplifiedCourses = availableCourses.map(c => ({
    code: c.code,
    name: c.name,
    credits: c.credits,
    day: c.day,
    time: c.time,
    startTime: c.startTime,
    endTime: c.endTime
  }));

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a logic engine for a college scheduling system. You must select a set of courses that: 1. Sum to between " + minCredits + " and " + maxCredits + " credits. 2. Have ZERO time overlaps. 3. Minimize the total number of unique days of the week."
        },
        {
          role: "user",
          content: `Select the optimal courses from this list:
${JSON.stringify(simplifiedCourses, null, 2)}

Return ONLY a JSON array of course codes. Focus on minimizing days on campus.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    const data = JSON.parse(content);
    return data.selected_codes || data.codes || Object.values(data)[0];
  } catch (error) {
    console.error("OpenAI AI Selection Error:", error);
    return null;
  }
};
