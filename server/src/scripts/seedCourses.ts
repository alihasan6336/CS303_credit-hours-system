/**
 * Course Seeding Script
 * 
 * This script seeds courses for all majors (CS, SE, IT, CE, CY, DS)
 * across 4 levels with lectures and labs, including prerequisites.
 * 
 * Prerequisites:
 *  1. Run `npm run create-super-admin` first to create the superadmin account
 *  2. Set up your .env with MONGO_URI or pass --url flag
 * 
 * Usage:
 *  npm run seed:courses              # Seed to localhost
 *  npm run seed:courses -- --url=https://your-api.com  # Seed to remote
 *  npm run seed:courses -- --dry-run # Preview without creating
 * 
 * Output:
 *  - Creates ~144 lectures (6 majors × 4 years × 6 courses)
 *  - Creates ~120 labs (6 majors × 4 years × 5 labs, capstone has no lab)
 *  - Total: ~264 courses with proper prerequisites
 */

import https from "https";
import http from "http";
import { URL } from "url";

// ─── Runtime Config ───────────────────────────────────────────────
const BASE_URL: string =
  process.argv.find((a) => a.startsWith("--url="))?.split("=")[1] ??
  (process.argv.includes("--url")
    ? process.argv[process.argv.indexOf("--url") + 1]
    : "http://localhost:5000");

const DRY_RUN = process.argv.includes("--dry-run");
const DELAY_MS = 600; // ms between API calls (avoid rate limiting)

const USE_ADMIN_API = true;
const ADMIN_EMAIL = "superadmin@uni.com";
const ADMIN_PASSWORD = "123456";

// ─── Types ────────────────────────────────────────────────────────
interface CoursePayload {
  code: string;
  name: string;
  major: string;
  level: number;
  credits: number;
  day: string;
  time: string;
  room: string;
  instructor: string;
  group: string;
  type: "Lecture" | "Lab" ;
  capacity: number;
  prerequisites: string[];
}

interface CreatedCourse {
  _id: string;
  code: string;
  name: string;
}

interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  course?: T;
}

// ─── Majors & Abbreviations ───────────────────────────────────────
const MAJOR_ABBREVIATIONS: Record<string, string> = {
  "Computer Science": "CS",
  "Software Engineering": "SE",
  "Information Technology": "IT",
  "Computer Engineering": "CE",
  "Cybersecurity": "CY",
  "Data Science": "DS",
};

const MAJORS = Object.keys(MAJOR_ABBREVIATIONS);

// ─── Course Templates (10 per major, picked by year) ──────────────
const COURSE_TEMPLATES: Record<string, string[]> = {
  "Computer Science": [
    "Intro to Programming",       // Y1-1
    "Discrete Mathematics",       // Y1-2
    "Data Structures",            // Y1-3
    "Object-Oriented Programming",// Y1-4
    "Database Systems",           // Y2-1
    "Algorithms",                 // Y2-2
    "Operating Systems",          // Y2-3
    "Computer Networks",          // Y2-4
    "Software Engineering",       // Y3-1
    "Web Development",            // Y3-2
    "AI Fundamentals",            // Y3-3
    "Compiler Design",            // Y3-4
    "Machine Learning",           // Y4-1
    "Distributed Systems",        // Y4-2
    "Cloud Computing",            // Y4-3
    "Capstone Project",           // Y4-4
  ],
  "Software Engineering": [
    "Programming Fundamentals",
    "Software Design Principles",
    "Requirements Engineering",
    "UML & Modeling",
    "Testing & QA",
    "Design Patterns",
    "Project Management",
    "Agile Methods",
    "DevOps & CI/CD",
    "Mobile Development",
    "System Architecture",
    "Software Metrics",
    "Cloud Engineering",
    "Microservices",
    "Software Security",
    "SE Capstone",
  ],
  "Information Technology": [
    "IT Fundamentals",
    "Computer Hardware",
    "Network Basics",
    "Operating Systems Admin",
    "Network Administration",
    "Database Administration",
    "Cybersecurity Basics",
    "Cloud Services",
    "System Administration",
    "Web Technologies",
    "IT Governance",
    "Data Analytics",
    "Enterprise Architecture",
    "IT Support Management",
    "IT Project Management",
    "IT Capstone",
  ],
  "Computer Engineering": [
    "Digital Logic Design",
    "Circuit Analysis",
    "Computer Organization",
    "Embedded C Programming",
    "Computer Architecture",
    "Microprocessors",
    "Embedded Systems",
    "Hardware Design",
    "VLSI Design",
    "Signal Processing",
    "IoT Systems",
    "Real-Time Systems",
    "Robotics",
    "Computer Graphics",
    "FPGA Design",
    "CE Capstone",
  ],
  "Cybersecurity": [
    "Security Fundamentals",
    "Linux for Security",
    "Network Security",
    "Ethical Hacking",
    "Cryptography",
    "Web Application Security",
    "Digital Forensics",
    "Malware Analysis",
    "Risk Management",
    "Penetration Testing",
    "Incident Response",
    "Compliance & Standards",
    "Reverse Engineering",
    "Security Architecture",
    "Threat Intelligence",
    "Cyber Capstone",
  ],
  "Data Science": [
    "Statistics for Data Science",
    "Python for Data",
    "Data Wrangling",
    "Exploratory Data Analysis",
    "Machine Learning Basics",
    "Database for Data Science",
    "Data Visualization",
    "Big Data Technologies",
    "Deep Learning",
    "NLP Fundamentals",
    "Time Series Analysis",
    "Feature Engineering",
    "MLOps",
    "Data Engineering",
    "Advanced Analytics",
    "DS Capstone",
  ],
};

// ─── Schedule: Days, Times, Rooms ────────────────────────────────
const LECTURE_DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const LAB_DAYS     = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

const LECTURE_TIMES = [
  "08:00 - 09:30",
  "09:45 - 11:15",
  "11:30 - 13:00",
  "13:15 - 14:45",
  "15:00 - 16:30",
  "16:45 - 18:15",
];

const LAB_TIMES = [
  "08:00 - 10:00",
  "10:15 - 12:15",
  "12:30 - 14:30",
  "14:45 - 16:45",
  "17:00 - 19:00",
];

const LECTURE_ROOMS = [
  "Hall A-101", "Hall A-102", "Hall B-201", "Hall B-202",
  "Hall C-301", "Hall C-302", "Auditorium 1", "Auditorium 2",
  "Hall D-401", "Hall D-402", "Hall E-101", "Hall E-102",
];

const LAB_ROOMS = [
  "Lab 1-01", "Lab 1-02", "Lab 2-01", "Lab 2-02",
  "Lab 3-01", "Lab 3-02", "Lab 4-01", "Lab 4-02",
  "Cyber Lab", "Data Lab", "HW Lab", "Network Lab",
];

const INSTRUCTORS = [
  "Dr. Ahmed Hassan",    "Dr. Sara Mohamed",   "Prof. Omar Khalil",
  "Dr. Layla Ibrahim",   "Prof. Karim Nasser",  "Dr. Mona Farouk",
  "Dr. Yasser Saleh",    "Prof. Dina Aziz",     "Dr. Hossam Mostafa",
  "Dr. Rania Tawfik",    "Prof. Amr Badawi",    "Dr. Iman Rashad",
];

// ─── Credit Hours by course type & year ───────────────────────────
// Y1: lighter loads; Y4: heavy theoretical + capstone
const LECTURE_CREDITS: Record<number, number[]> = {
  1: [3, 3, 2, 3, 2, 3],      // 16 total
  2: [3, 3, 3, 3, 3, 3],      // 18 total
  3: [3, 4, 3, 3, 4, 3],      // 20 total
  4: [3, 3, 4, 3, 4, 2],      // 19 total
};

const LAB_CREDITS: Record<number, number[]> = {
  1: [1, 1, 1, 1, 1, 1],
  2: [1, 1, 1, 1, 1, 1],
  3: [2, 1, 2, 1, 2, 1],
  4: [2, 2, 2, 2, 2, 0], // last Y4 course (capstone) has no lab
};

// ─── Prerequisite Logic ───────────────────────────────────────────
/**
 * Returns prerequisite course codes for a given course.
 *
 * Rules:
 *  - Y1 courses: no prerequisites
 *  - Y2 courses 1-3: require 2 courses from Y1 (courses 1 & 2)
 *  - Y2 courses 4-6: require 1 course from Y1 (course 3)
 *  - Y3 courses 1-3: require 2 courses from Y2 (courses 1 & 2)
 *  - Y3 courses 4-6: require 1 course from Y2 (course 3)
 *  - Y4 courses 1-3: require 2 courses from Y2 & Y3 (cross-year)
 *  - Y4 courses 4-6: require 2 courses from Y3 only
 */
function buildPrerequisites(
  majorAbbr: string,
  level: number,
  courseIndex: number   // 1-based
): string[] {
  if (level === 1) return [];

  const code = (yr: number, idx: number) =>
    `${majorAbbr}${yr}${String(idx).padStart(2, "0")}`;

  if (level === 2) {
    if (courseIndex <= 3) return [code(1, 1), code(1, 2)];
    return [code(1, courseIndex - 2)];
  }

  if (level === 3) {
    if (courseIndex <= 3) return [code(2, 1), code(2, 2)];
    return [code(2, courseIndex - 2)];
  }

  // level === 4 — at least 2 prerequisites, spanning Y2 and Y3
  if (courseIndex <= 3) {
    // Cross-year: one Y2, one Y3
    return [code(2, courseIndex), code(3, courseIndex)];
  }
  // Y3 only for courses 4-6
  return [code(3, courseIndex - 2), code(3, courseIndex - 1)];
}

// ─── HTTP Helper ──────────────────────────────────────────────────
function httpRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: ApiResponse<T> }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === "https:";
    const payload = body ? JSON.stringify(body) : undefined;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const lib = isHttps ? https : http;
    const req = lib.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode ?? 0, data: { message: raw } });
        }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Colour Logger ────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m",
  cyan: "\x1b[36m", blue: "\x1b[34m", magenta: "\x1b[35m", white: "\x1b[37m",
};

const ok    = (m: string) => console.log(`  ${C.green}✓${C.reset} ${m}`);
const fail  = (m: string) => console.log(`  ${C.red}✗${C.reset} ${m}`);
const info  = (m: string) => console.log(`  ${C.cyan}→${C.reset} ${m}`);
const warn  = (m: string) => console.log(`  ${C.yellow}⚠${C.reset} ${m}`);
const skip  = (m: string) => console.log(`  ${C.dim}⊘ ${m}${C.reset}`);
const head  = (m: string) => console.log(`\n${C.bold}${C.blue}▶ ${m}${C.reset}`);
const sub   = (m: string) => console.log(`  ${C.magenta}◆${C.reset} ${m}`);

// ─── Auth ─────────────────────────────────────────────────────────
async function adminLogin(): Promise<string> {
  head("Admin Login");
  info(`POST /api/auth/login  →  ${ADMIN_EMAIL}`);

  if (DRY_RUN) { ok("DRY RUN — skipped login"); return "dry-run-token"; }

  const res = await httpRequest<{ token?: string; accessToken?: string }>(
    "POST", "/api/auth/login",
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  );

  const token =
    res.data.data?.token ??
    res.data.data?.accessToken ??
    (res.data as Record<string, string>).token ??
    (res.data as Record<string, string>).accessToken;

  if ((res.status === 200 || res.status === 201) && token) {
    ok(`Token acquired  (${String(token).slice(0, 24)}…)`);
    return token;
  }
  throw new Error(`Login failed ${res.status}: ${res.data.message ?? res.data.error}`);
}

// ─── Fetch existing courses for a major+level ─────────────────────
async function fetchExisting(
  level: number,
  major: string,
  token: string
): Promise<Set<string>> {
  try {
    const qs = `?level=${level}&major=${encodeURIComponent(major)}&limit=200`;
    const res = await httpRequest<{ courses?: CreatedCourse[] }>(
      "GET", `/api/courses${qs}`, undefined, token
    );

    const list: CreatedCourse[] =
      res.data.data?.courses ??
      (Array.isArray(res.data.data) ? (res.data.data as CreatedCourse[]) : []) ??
      [];

    return new Set(list.map((c) => c.code));
  } catch {
    return new Set();
  }
}

// ─── Create single course ─────────────────────────────────────────
async function createCourse(
  token: string,
  payload: CoursePayload
): Promise<string | null> {
  if (DRY_RUN) {
    ok(`[DRY] Would create ${payload.code} — ${payload.name} (${payload.type}, ${payload.credits}cr)`);
    return `dry-${payload.code}`;
  }

  const res = await httpRequest<CreatedCourse>(
    "POST", "/api/courses", payload, token
  );

  // Accept 200 or 201
  if (res.status === 200 || res.status === 201) {
    const created: CreatedCourse | undefined =
      (res.data.data as CreatedCourse) ??
      (res.data as unknown as { course: CreatedCourse }).course;
    const id = created?._id ?? (res.data as unknown as { _id: string })._id;
    ok(`${payload.code}  ${payload.type.padEnd(8)}  "${payload.name}"  ${payload.credits}cr  ${payload.day}  ${payload.time}`);
    return id ?? "unknown-id";
  }

  if (
    res.status === 409 ||
    res.data.message?.toLowerCase().includes("duplicate") ||
    res.data.message?.toLowerCase().includes("already")
  ) {
    skip(`${payload.code} already exists`);
    return null;
  }

  fail(`${payload.code} → HTTP ${res.status}: ${res.data.message ?? res.data.error}`);
  return null;
}

// ─── Build full payload for one course slot ───────────────────────
function buildLecturePayload(
  major: string,
  majorAbbr: string,
  level: number,
  idx: number,       // 0-based (0..5)
  courseName: string,
  existingCodes: Set<string>
): CoursePayload {
  const courseNum = idx + 1;
  const code = `${majorAbbr}${level}${String(courseNum).padStart(2, "0")}`;
  const credits = LECTURE_CREDITS[level][idx];

  // Spread days/times to avoid collisions inside the same level
  const dayIndex  = (idx + level) % LECTURE_DAYS.length;
  const timeIndex = idx % LECTURE_TIMES.length;
  const roomIndex = (idx + (level - 1) * 6 + MAJORS.indexOf(major) * 2) % LECTURE_ROOMS.length;
  const instrIdx  = (idx + (level - 1) * 3 + MAJORS.indexOf(major)) % INSTRUCTORS.length;

  const prereqs = buildPrerequisites(majorAbbr, level, courseNum).filter((c) =>
    existingCodes.has(c)
  );

  return {
    code,
    name: courseName,
    major,
    level,
    credits,
    day: LECTURE_DAYS[dayIndex],
    time: LECTURE_TIMES[timeIndex],
    room: LECTURE_ROOMS[roomIndex],
    instructor: INSTRUCTORS[instrIdx],
    group: "A",
    type: "Lecture",
    capacity: 40,
    prerequisites: prereqs,
  };
}

function buildLabPayload(
  major: string,
  majorAbbr: string,
  level: number,
  idx: number,
  courseName: string,
  lecCode: string
): CoursePayload | null {
  const labCredits = LAB_CREDITS[level][idx];
  if (labCredits === 0) return null; // capstone — no lab

  const courseNum = idx + 1;
  const labCode = `${majorAbbr}${level}${String(courseNum).padStart(2, "0")}L`;

  // Labs go on the day AFTER the lecture
  const dayIndex  = (idx + level + 1) % LAB_DAYS.length;
  const timeIndex = idx % LAB_TIMES.length;
  const roomIndex = (idx + MAJORS.indexOf(major)) % LAB_ROOMS.length;
  const instrIdx  = (idx + level + MAJORS.indexOf(major) * 2) % INSTRUCTORS.length;

  return {
    code: labCode,
    name: `${courseName} Lab`,
    major,
    level,
    credits: labCredits,
    day: LAB_DAYS[dayIndex],
    time: LAB_TIMES[timeIndex],
    room: LAB_ROOMS[roomIndex],
    instructor: INSTRUCTORS[instrIdx],
    group: "A",
    type: "Lab",
    capacity: 20,
    prerequisites: [lecCode], // lab requires its own lecture
  };
}

// ─── Main seeding logic for one major ────────────────────────────
async function seedMajor(
  major: string,
  token: string,
  stats: SeedStats
): Promise<void> {
  const majorAbbr = MAJOR_ABBREVIATIONS[major];
  const templates = COURSE_TEMPLATES[major];

  head(`${major}  (${majorAbbr})`);

  // Track all created codes for this major (used for prerequisite validation)
  const allCreatedCodes = new Set<string>();

  // Process levels in order: 1 → 2 → 3 → 4
  for (let level = 1; level <= 4; level++) {
    sub(`Year ${level}`);

    // Fetch already-existing codes so we can skip + reference them as prereqs
    const existingCodes = await fetchExisting(level, major, token);
    // Also merge in codes we created in earlier levels this run
    for (const c of allCreatedCodes) existingCodes.add(c);

    // Pick 6 course names for this level (offset by (level-1)*4 to spread templates)
    const baseOffset = (level - 1) * 4;
    const courseNames: string[] = [];
    for (let i = 0; i < 6; i++) {
      courseNames.push(templates[(baseOffset + i) % templates.length]);
    }

    for (let i = 0; i < 6; i++) {
      const courseName = courseNames[i];
      const lecCode = `${majorAbbr}${level}${String(i + 1).padStart(2, "0")}`;

      // ── Lecture ──────────────────────────────────────────────
      if (existingCodes.has(lecCode)) {
        skip(`${lecCode} (lecture) already exists`);
        allCreatedCodes.add(lecCode);
        stats.skipped++;
      } else {
        const payload = buildLecturePayload(major, majorAbbr, level, i, courseName, existingCodes);
        const id = await createCourse(token, payload);
        if (id) {
          allCreatedCodes.add(lecCode);
          existingCodes.add(lecCode); // so lab can reference it
          stats.created++;
        } else {
          // 409 → still treat as existing
          allCreatedCodes.add(lecCode);
          existingCodes.add(lecCode);
          stats.skipped++;
        }
        await delay(DELAY_MS);
      }

      // ── Lab ──────────────────────────────────────────────────
      const labCode = `${lecCode}L`;
      if (existingCodes.has(labCode)) {
        skip(`${labCode} (lab) already exists`);
        stats.skipped++;
      } else {
        const labPayload = buildLabPayload(major, majorAbbr, level, i, courseName, lecCode);
        if (!labPayload) {
          info(`${lecCode} — no lab (capstone)`);
        } else {
          const id = await createCourse(token, labPayload);
          if (id) {
            existingCodes.add(labCode);
            stats.created++;
          } else {
            stats.skipped++;
          }
          await delay(DELAY_MS);
        }
      }
    }
  }
}

// ─── Stats ────────────────────────────────────────────────────────
interface SeedStats {
  created: number;
  skipped: number;
  failed: number;
}

// ─── Summary Table ────────────────────────────────────────────────
function printPrereqMap(): void {
  console.log(`\n${C.bold}${C.cyan}═══ Prerequisite Structure (example: CS major) ═══${C.reset}`);
  console.log(`
  Year 1  CS101 CS102 CS103 CS104 CS105 CS106
          (no prerequisites)

  Year 2  CS201 ← [CS101, CS102]   CS204 ← [CS101]
          CS202 ← [CS101, CS102]   CS205 ← [CS102]
          CS203 ← [CS101, CS102]   CS206 ← [CS103]

  Year 3  CS301 ← [CS201, CS202]   CS304 ← [CS201]
          CS302 ← [CS201, CS202]   CS305 ← [CS202]
          CS303 ← [CS201, CS202]   CS306 ← [CS203]

  Year 4  CS401 ← [CS201, CS301]   ★ cross-year (Y2+Y3)
          CS402 ← [CS202, CS302]   ★ cross-year (Y2+Y3)
          CS403 ← [CS203, CS303]   ★ cross-year (Y2+Y3)
          CS404 ← [CS302, CS303]   ★ within Y3
          CS405 ← [CS303, CS304]   ★ within Y3
          CS406 ← [CS304, CS305]   ★ within Y3

  Labs:   CS101L ← [CS101]   (always requires parent lecture)
  `);
}

// ─── Main ─────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`\n${C.bold}${C.magenta}╔══════════════════════════════════════════════════════════╗`);
  console.log(`║   Credit Hours AI — Course Seeder                        ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`  ${C.dim}API: ${BASE_URL}${C.reset}`);
  console.log(`  ${C.dim}Mode: ${DRY_RUN ? "DRY RUN (no API calls)" : "LIVE"}${C.reset}`);
  console.log(`  ${C.dim}Majors: ${MAJORS.length}  ×  4 years  ×  6 lectures + 6 labs  =  ~${MAJORS.length * 4 * 11} courses${C.reset}`);

  printPrereqMap();

  const token = await adminLogin();
  const stats: SeedStats = { created: 0, skipped: 0, failed: 0 };

  for (const major of MAJORS) {
    await seedMajor(major, token, stats);
  }

  // ── Final summary ───────────────────────────────────────────────
  console.log(`\n${C.bold}${C.blue}═══ SEED COMPLETE ══════════════════════════════════════════${C.reset}`);
  console.log(`\n  ${C.green}✓ Created : ${stats.created}${C.reset}`);
  console.log(`  ${C.dim}⊘ Skipped : ${stats.skipped} (already existed)${C.reset}`);
  console.log(`  ${C.red}✗ Failed  : ${stats.failed}${C.reset}`);

  const expected = MAJORS.length * 4 * 6; // lectures only
  const expectedWithLabs = MAJORS.length * 4 * 6 + MAJORS.length * 4 * 5; // 5 labs/year (capstone has none)
  console.log(`\n  Expected lectures : ${expected}`);
  console.log(`  Expected with labs: ~${expectedWithLabs}`);

  console.log(`\n  ${C.dim}Accounts seeded with:${C.reset}`);
  console.log(`  ${C.dim}  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}${C.reset}`);

  if (stats.failed > 0) {
    console.log(`\n  ${C.yellow}Some courses failed — check output above.${C.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${C.green}${C.bold}  ✓ All courses seeded successfully!${C.reset}\n`);
  }
}

main().catch((err) => {
  console.error(`\n${C.red}Fatal: ${(err as Error).message}${C.reset}`);
  process.exit(1);
});
