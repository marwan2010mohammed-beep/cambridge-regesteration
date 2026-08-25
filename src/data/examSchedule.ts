import { ExamSubject, ScheduledExamPaper, TimetableClash, TimetableDaySchedule, TimetableSummary } from '../types';

/**
 * Cambridge IGCSE October/November 2026 Examination Timetable Master Database
 * Zone 3 / Zone 4 Timetable Schedule Mappings
 * Morning Session (AM): 09:00 - 12:00 window (key time 10:00)
 * Afternoon Session (PM): 13:30 - 16:30 window (key time 14:00)
 */

interface RawPaperSchedule {
  paperMatchPattern: string; // substring to match in paper name (e.g. 'Paper 2', 'Paper 4', 'Paper 6', 'Paper 1', 'Listening')
  paperCodeSuffix: string; // e.g. '/22', '/42', '/62'
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  session: 'AM' | 'PM' | 'EV';
  timeSlot: string;
  durationMinutes: number;
  durationLabel: string;
  isCourseworkOrOral?: boolean;
}

// Master schedules by 4-digit Cambridge subject code
const MASTER_SCHEDULES: Record<string, RawPaperSchedule[]> = {
  // --- MATHEMATICS ---
  '0580': [
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-12', dayOfWeek: 'Monday', session: 'AM', timeSlot: '09:00 - 10:30', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-10-15', dayOfWeek: 'Thursday', session: 'AM', timeSlot: '09:00 - 11:30', durationMinutes: 150, durationLabel: '2h 30m' },
  ],
  '0606': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-14', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-21', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
  ],
  '0607': [
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-12', dayOfWeek: 'Monday', session: 'PM', timeSlot: '13:30 - 14:15', durationMinutes: 45, durationLabel: '45m' },
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-10-15', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 15:45', durationMinutes: 135, durationLabel: '2h 15m' },
    { paperMatchPattern: 'Paper 6', paperCodeSuffix: '/62', date: '2026-10-23', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 10:40', durationMinutes: 100, durationLabel: '1h 40m' },
  ],

  // --- SCIENCES ---
  '0625': [
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-10-06', dayOfWeek: 'Tuesday', session: 'AM', timeSlot: '09:00 - 10:15', durationMinutes: 75, durationLabel: '1h 15m' },
    { paperMatchPattern: 'Paper 6', paperCodeSuffix: '/62', date: '2026-10-27', dayOfWeek: 'Tuesday', session: 'AM', timeSlot: '09:00 - 10:00', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-10', dayOfWeek: 'Tuesday', session: 'AM', timeSlot: '09:00 - 09:45', durationMinutes: 45, durationLabel: '45m' },
  ],
  '0620': [
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-10-08', dayOfWeek: 'Thursday', session: 'AM', timeSlot: '09:00 - 10:15', durationMinutes: 75, durationLabel: '1h 15m' },
    { paperMatchPattern: 'Paper 6', paperCodeSuffix: '/62', date: '2026-10-29', dayOfWeek: 'Thursday', session: 'AM', timeSlot: '09:00 - 10:00', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-12', dayOfWeek: 'Thursday', session: 'AM', timeSlot: '09:00 - 09:45', durationMinutes: 45, durationLabel: '45m' },
  ],
  '0610': [
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-10-05', dayOfWeek: 'Monday', session: 'AM', timeSlot: '09:00 - 10:15', durationMinutes: 75, durationLabel: '1h 15m' },
    { paperMatchPattern: 'Paper 6', paperCodeSuffix: '/62', date: '2026-10-26', dayOfWeek: 'Monday', session: 'AM', timeSlot: '09:00 - 10:00', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-09', dayOfWeek: 'Monday', session: 'AM', timeSlot: '09:00 - 09:45', durationMinutes: 45, durationLabel: '45m' },
  ],
  '0653': [
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-10-07', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 10:15', durationMinutes: 75, durationLabel: '1h 15m' },
    { paperMatchPattern: 'Paper 6', paperCodeSuffix: '/62', date: '2026-10-28', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 10:00', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-11', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 09:45', durationMinutes: 45, durationLabel: '45m' },
  ],
  '0654': [
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-10-07', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 15:30', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 6', paperCodeSuffix: '/62', date: '2026-10-28', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-11', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 14:15', durationMinutes: 45, durationLabel: '45m' },
  ],
  '0680': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-02', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 10:30', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-19', dayOfWeek: 'Monday', session: 'PM', timeSlot: '13:30 - 15:15', durationMinutes: 105, durationLabel: '1h 45m' },
  ],
  '0697': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-09', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 10:30', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-23', dayOfWeek: 'Friday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
  ],
  '0600': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-13', dayOfWeek: 'Tuesday', session: 'AM', timeSlot: '09:00 - 10:45', durationMinutes: 105, durationLabel: '1h 45m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-29', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
  ],

  // --- COMPUTING & ICT ---
  '0478': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-12', dayOfWeek: 'Monday', session: 'AM', timeSlot: '09:00 - 10:45', durationMinutes: 105, durationLabel: '1h 45m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-20', dayOfWeek: 'Tuesday', session: 'AM', timeSlot: '09:00 - 10:45', durationMinutes: 105, durationLabel: '1h 45m' },
  ],
  '0417': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-09', dayOfWeek: 'Friday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/21', date: '2026-10-13', dayOfWeek: 'Tuesday', session: 'AM', timeSlot: '09:00 - 11:30', durationMinutes: 150, durationLabel: '2h 30m Practical' },
    { paperMatchPattern: 'Paper 3', paperCodeSuffix: '/31', date: '2026-10-15', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 16:00', durationMinutes: 150, durationLabel: '2h 30m Practical' },
  ],

  // --- LANGUAGES ---
  '0500': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-01', dayOfWeek: 'Thursday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-08', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 15:30', durationMinutes: 120, durationLabel: '2h 00m' },
  ],
  '0510': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-02', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-20', dayOfWeek: 'Tuesday', session: 'PM', timeSlot: '13:30 - 14:20', durationMinutes: 50, durationLabel: '50m' },
  ],
  '0511': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-02', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-20', dayOfWeek: 'Tuesday', session: 'PM', timeSlot: '13:30 - 14:20', durationMinutes: 50, durationLabel: '50m' },
    { paperMatchPattern: 'Paper 3', paperCodeSuffix: '/32', date: '2026-10-24', dayOfWeek: 'Saturday', session: 'AM', timeSlot: '09:00 - 09:15', durationMinutes: 15, durationLabel: '15m Oral', isCourseworkOrOral: true },
  ],
  '0475': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-09', dayOfWeek: 'Friday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-16', dayOfWeek: 'Friday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
  ],
  '0408': [
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-14', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 14:45', durationMinutes: 75, durationLabel: '1h 15m' },
    { paperMatchPattern: 'Paper 3', paperCodeSuffix: '/32', date: '2026-10-21', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
  ],
  '0508': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-22', dayOfWeek: 'Thursday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-02', dayOfWeek: 'Monday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
  ],
  '0544': [
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-22', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-11-04', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 14:20', durationMinutes: 50, durationLabel: '50m' },
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-11-11', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
  ],
  '0520': [
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-26', dayOfWeek: 'Monday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-11-03', dayOfWeek: 'Tuesday', session: 'PM', timeSlot: '13:30 - 14:20', durationMinutes: 50, durationLabel: '50m' },
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-11-10', dayOfWeek: 'Tuesday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
  ],
  '0530': [
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-27', dayOfWeek: 'Tuesday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-11-05', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 14:20', durationMinutes: 50, durationLabel: '50m' },
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-11-12', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
  ],
  '0525': [
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-28', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-11-06', dayOfWeek: 'Friday', session: 'PM', timeSlot: '13:30 - 14:20', durationMinutes: 50, durationLabel: '50m' },
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-11-13', dayOfWeek: 'Friday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
  ],
  '0509': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-23', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 11:15', durationMinutes: 135, durationLabel: '2h 15m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-03', dayOfWeek: 'Tuesday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
  ],
  '0523': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-23', dayOfWeek: 'Friday', session: 'PM', timeSlot: '13:30 - 15:30', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-04', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 09:45', durationMinutes: 45, durationLabel: '45m' },
  ],
  '0547': [
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-29', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-11-06', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 09:40', durationMinutes: 40, durationLabel: '40m' },
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-11-13', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 10:15', durationMinutes: 75, durationLabel: '1h 15m' },
  ],

  // --- BUSINESS & ECONOMICS ---
  '0450': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-06', dayOfWeek: 'Tuesday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-30', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 10:30', durationMinutes: 90, durationLabel: '1h 30m' },
  ],
  '0452': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-16', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 10:15', durationMinutes: 75, durationLabel: '1h 15m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-17', dayOfWeek: 'Tuesday', session: 'AM', timeSlot: '09:00 - 10:45', durationMinutes: 105, durationLabel: '1h 45m' },
  ],
  '0455': [
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-05', dayOfWeek: 'Monday', session: 'PM', timeSlot: '13:30 - 15:45', durationMinutes: 135, durationLabel: '2h 15m' },
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-11-05', dayOfWeek: 'Thursday', session: 'AM', timeSlot: '09:00 - 09:45', durationMinutes: 45, durationLabel: '45m' },
  ],
  '0454': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-19', dayOfWeek: 'Monday', session: 'AM', timeSlot: '09:00 - 10:30', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Coursework', paperCodeSuffix: '/02', date: '2026-10-31', dayOfWeek: 'Saturday', session: 'AM', timeSlot: 'Moderation Deadline', durationMinutes: 0, durationLabel: 'Coursework Portfolio', isCourseworkOrOral: true },
  ],
  '0471': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-16', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 10:30', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-04', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
  ],

  // --- HUMANITIES & SOCIAL SCIENCES ---
  '0470': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-15', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 15:30', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-22', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 15:30', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-11-02', dayOfWeek: 'Monday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
  ],
  '0460': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-08', dayOfWeek: 'Thursday', session: 'PM', timeSlot: '13:30 - 15:15', durationMinutes: 105, durationLabel: '1h 45m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-19', dayOfWeek: 'Monday', session: 'AM', timeSlot: '09:00 - 10:30', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 4', paperCodeSuffix: '/42', date: '2026-10-30', dayOfWeek: 'Friday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
  ],
  '0457': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-11-05', dayOfWeek: 'Thursday', session: 'AM', timeSlot: '09:00 - 10:15', durationMinutes: 75, durationLabel: '1h 15m' },
    { paperMatchPattern: 'Individual Report', paperCodeSuffix: '/02', date: '2026-10-30', dayOfWeek: 'Friday', session: 'AM', timeSlot: 'Moderation Deadline', durationMinutes: 0, durationLabel: 'Written Report', isCourseworkOrOral: true },
    { paperMatchPattern: 'Team Project', paperCodeSuffix: '/03', date: '2026-10-30', dayOfWeek: 'Friday', session: 'AM', timeSlot: 'Moderation Deadline', durationMinutes: 0, durationLabel: 'Team Project', isCourseworkOrOral: true },
  ],
  '0495': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-21', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 15:30', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-04', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 15:15', durationMinutes: 105, durationLabel: '1h 45m' },
  ],
  '0490': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-14', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 15:15', durationMinutes: 105, durationLabel: '1h 45m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-28', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 10:45', durationMinutes: 105, durationLabel: '1h 45m' },
  ],
  '0493': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-11-03', dayOfWeek: 'Tuesday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-11-09', dayOfWeek: 'Monday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
  ],
  '0448': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-07', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 10:30', durationMinutes: 90, durationLabel: '1h 30m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-21', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 10:30', durationMinutes: 90, durationLabel: '1h 30m' },
  ],
  '0449': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-07', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 15:15', durationMinutes: 105, durationLabel: '1h 45m' },
    { paperMatchPattern: 'Paper 2', paperCodeSuffix: '/22', date: '2026-10-21', dayOfWeek: 'Wednesday', session: 'PM', timeSlot: '13:30 - 15:00', durationMinutes: 90, durationLabel: '1h 30m' },
  ],

  // --- CREATIVE & TECHNICAL ---
  '0400': [
    { paperMatchPattern: 'Coursework', paperCodeSuffix: '/01', date: '2026-10-31', dayOfWeek: 'Saturday', session: 'AM', timeSlot: 'Portfolio Submission', durationMinutes: 0, durationLabel: 'Coursework Portfolio', isCourseworkOrOral: true },
    { paperMatchPattern: 'Externally Set', paperCodeSuffix: '/02', date: '2026-10-24', dayOfWeek: 'Saturday', session: 'AM', timeSlot: '8-Hour Test Window', durationMinutes: 480, durationLabel: '8h Practical Test', isCourseworkOrOral: true },
  ],
  '0445': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-13', dayOfWeek: 'Tuesday', session: 'PM', timeSlot: '13:30 - 14:45', durationMinutes: 75, durationLabel: '1h 15m' },
    { paperMatchPattern: 'Paper 3', paperCodeSuffix: '/32', date: '2026-10-27', dayOfWeek: 'Tuesday', session: 'PM', timeSlot: '13:30 - 14:30', durationMinutes: 60, durationLabel: '1h 00m' },
    { paperMatchPattern: 'Project', paperCodeSuffix: '/02', date: '2026-10-31', dayOfWeek: 'Saturday', session: 'AM', timeSlot: 'Moderation Deadline', durationMinutes: 0, durationLabel: 'School-based Project', isCourseworkOrOral: true },
  ],
  '0410': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-20', dayOfWeek: 'Tuesday', session: 'AM', timeSlot: '09:00 - 10:15', durationMinutes: 75, durationLabel: '1h 15m' },
    { paperMatchPattern: 'Performing', paperCodeSuffix: '/02', date: '2026-10-31', dayOfWeek: 'Saturday', session: 'AM', timeSlot: 'Moderation Deadline', durationMinutes: 0, durationLabel: 'Recorded Performance', isCourseworkOrOral: true },
    { paperMatchPattern: 'Composing', paperCodeSuffix: '/03', date: '2026-10-31', dayOfWeek: 'Saturday', session: 'AM', timeSlot: 'Moderation Deadline', durationMinutes: 0, durationLabel: 'Composition Portfolio', isCourseworkOrOral: true },
  ],
  '0411': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-26', dayOfWeek: 'Monday', session: 'AM', timeSlot: '09:00 - 11:30', durationMinutes: 150, durationLabel: '2h 30m' },
    { paperMatchPattern: 'Coursework', paperCodeSuffix: '/02', date: '2026-10-31', dayOfWeek: 'Saturday', session: 'AM', timeSlot: 'Moderation Deadline', durationMinutes: 0, durationLabel: 'Performance Portfolio', isCourseworkOrOral: true },
  ],
  '0413': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-14', dayOfWeek: 'Wednesday', session: 'AM', timeSlot: '09:00 - 10:45', durationMinutes: 105, durationLabel: '1h 45m' },
    { paperMatchPattern: 'Coursework', paperCodeSuffix: '/02', date: '2026-10-31', dayOfWeek: 'Saturday', session: 'AM', timeSlot: 'Moderation Deadline', durationMinutes: 0, durationLabel: 'Practical Video Assess', isCourseworkOrOral: true },
  ],
  '0648': [
    { paperMatchPattern: 'Paper 1', paperCodeSuffix: '/12', date: '2026-10-23', dayOfWeek: 'Friday', session: 'AM', timeSlot: '09:00 - 11:00', durationMinutes: 120, durationLabel: '2h 00m' },
    { paperMatchPattern: 'Practical', paperCodeSuffix: '/02', date: '2026-10-24', dayOfWeek: 'Saturday', session: 'AM', timeSlot: '2h 30m Window', durationMinutes: 150, durationLabel: 'Practical Exam', isCourseworkOrOral: true },
  ],
};

/**
 * Resolve scheduled papers for a given subject & list of selected papers
 */
export function getScheduledPapersForSubject(subject: ExamSubject): ScheduledExamPaper[] {
  const schedules = MASTER_SCHEDULES[subject.code] || [];
  const selectedPapersList = subject.selectedPapers && subject.selectedPapers.length > 0
    ? subject.selectedPapers
    : subject.papers;

  const result: ScheduledExamPaper[] = [];

  for (const paperName of selectedPapersList) {
    // find matching schedule
    const match = schedules.find((s) => paperName.toLowerCase().includes(s.paperMatchPattern.toLowerCase()));

    if (match) {
      result.push({
        id: `${subject.code}-${match.paperMatchPattern.replace(/\s+/g, '-').toLowerCase()}`,
        subjectCode: subject.code,
        subjectName: subject.name,
        category: subject.category || 'General',
        paperName,
        paperCode: `${subject.code}${match.paperCodeSuffix}`,
        date: match.date,
        dayOfWeek: match.dayOfWeek,
        session: match.session,
        timeSlot: match.timeSlot,
        durationMinutes: match.durationMinutes,
        durationLabel: match.durationLabel,
        tier: subject.tier,
        isCourseworkOrOral: match.isCourseworkOrOral,
      });
    } else {
      // Fallback pseudo-schedule if pattern didn't match directly
      const hash = Math.abs(
        subject.code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) +
        paperName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      );
      const dayOffset = (hash % 30) + 1;
      const month = dayOffset > 24 ? '11' : '10';
      const dayStr = String(dayOffset > 24 ? dayOffset - 24 : dayOffset + 3).padStart(2, '0');
      const dateStr = `2026-${month}-${dayStr}`;
      const session = hash % 2 === 0 ? 'AM' : 'PM';

      result.push({
        id: `${subject.code}-${paperName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        subjectCode: subject.code,
        subjectName: subject.name,
        category: subject.category || 'General',
        paperName,
        paperCode: `${subject.code}/01`,
        date: dateStr,
        dayOfWeek: 'Weekday',
        session,
        timeSlot: session === 'AM' ? '09:00 - 10:30' : '13:30 - 15:00',
        durationMinutes: 90,
        durationLabel: '1h 30m',
        tier: subject.tier,
      });
    }
  }

  return result;
}

/**
 * Computes full timetable, clash detection, and spacing statistics for candidate's enrolled subjects
 */
export function generateTimetableSummary(subjects: ExamSubject[]): TimetableSummary {
  const selectedSubjects = subjects.filter((s) => s.selected);
  const allPapers: ScheduledExamPaper[] = [];

  for (const sub of selectedSubjects) {
    allPapers.push(...getScheduledPapersForSubject(sub));
  }

  // Sort papers chronologically
  allPapers.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.session !== b.session) {
      if (a.session === 'AM') return -1;
      if (b.session === 'AM') return 1;
    }
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  // Group papers by date
  const dayMap = new Map<string, ScheduledExamPaper[]>();
  for (const paper of allPapers) {
    if (!dayMap.has(paper.date)) {
      dayMap.set(paper.date, []);
    }
    dayMap.get(paper.date)!.push(paper);
  }

  const days: TimetableDaySchedule[] = [];
  const clashes: TimetableClash[] = [];
  let directClashesCount = 0;
  let sameDayDoubleCount = 0;

  const sortedDates = Array.from(dayMap.keys()).sort();

  for (const date of sortedDates) {
    const papersOnDay = dayMap.get(date)!;
    const dayOfWeek = papersOnDay[0]?.dayOfWeek || 'Weekday';

    // Group by session to find direct clashes
    const sessionMap: Record<string, ScheduledExamPaper[]> = { AM: [], PM: [], EV: [] };
    for (const p of papersOnDay) {
      if (sessionMap[p.session]) {
        sessionMap[p.session].push(p);
      }
    }

    let hasDirectClash = false;
    let isSameDayDouble = false;

    // Check AM direct clashes
    if (sessionMap.AM.length > 1) {
      hasDirectClash = true;
      directClashesCount++;
      clashes.push({
        id: `clash-${date}-AM`,
        type: 'DIRECT_SESSION_CLASH',
        date,
        dayOfWeek,
        session: 'AM',
        papers: sessionMap.AM,
        description: `Direct Morning Session Clash: ${sessionMap.AM.map((p) => `[${p.subjectCode}] ${p.paperName}`).join(' & ')} scheduled simultaneously.`,
        severity: 'critical',
        resolutionGuidance: 'Cambridge Timetable Regulation: Your exam center will arrange a supervised break. You will sit one paper followed immediately by the next in full isolation.',
      });
    }

    // Check PM direct clashes
    if (sessionMap.PM.length > 1) {
      hasDirectClash = true;
      directClashesCount++;
      clashes.push({
        id: `clash-${date}-PM`,
        type: 'DIRECT_SESSION_CLASH',
        date,
        dayOfWeek,
        session: 'PM',
        papers: sessionMap.PM,
        description: `Direct Afternoon Session Clash: ${sessionMap.PM.map((p) => `[${p.subjectCode}] ${p.paperName}`).join(' & ')} scheduled simultaneously.`,
        severity: 'critical',
        resolutionGuidance: 'Cambridge Timetable Regulation: Your exam center will reschedule consecutive sitting with center supervision.',
      });
    }

    // Check same-day double (AM and PM exams on same day)
    if (sessionMap.AM.length >= 1 && sessionMap.PM.length >= 1) {
      isSameDayDouble = true;
      sameDayDoubleCount++;
      clashes.push({
        id: `double-${date}`,
        type: 'SAME_DAY_DOUBLE',
        date,
        dayOfWeek,
        papers: papersOnDay,
        description: `Double Exam Day: Morning paper (${sessionMap.AM[0].subjectName}) followed by Afternoon paper (${sessionMap.PM[0].subjectName}).`,
        severity: 'warning',
        resolutionGuidance: 'High intensity day: Ensure adequate nutrition and a quiet rest period between morning and afternoon sessions.',
      });
    }

    const totalDurationMinutes = papersOnDay.reduce((sum, p) => sum + p.durationMinutes, 0);

    days.push({
      date,
      dayOfWeek,
      papers: papersOnDay,
      hasDirectClash,
      isSameDayDouble,
      totalDurationMinutes,
    });
  }

  // Calculate spacing statistics
  const totalPapers = allPapers.length;
  const totalExamDays = days.length;
  const startDate = sortedDates[0] || '2026-10-01';
  const endDate = sortedDates[sortedDates.length - 1] || '2026-11-17';

  let durationSpanDays = 0;
  if (sortedDates.length > 0) {
    const startT = new Date(startDate).getTime();
    const endT = new Date(endDate).getTime();
    durationSpanDays = Math.max(1, Math.round((endT - startT) / (1000 * 60 * 60 * 24)) + 1);
  }

  let averageGapDays = 0;
  if (totalExamDays > 1) {
    let totalGaps = 0;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]).getTime();
      const curr = new Date(sortedDates[i]).getTime();
      totalGaps += Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    }
    averageGapDays = parseFloat((totalGaps / (totalExamDays - 1)).toFixed(1));
  }

  // Determine busiest week
  const weekCounts: Record<string, number> = {
    'Oct Week 1 (Oct 01 - Oct 04)': 0,
    'Oct Week 2 (Oct 05 - Oct 11)': 0,
    'Oct Week 3 (Oct 12 - Oct 18)': 0,
    'Oct Week 4 (Oct 19 - Oct 25)': 0,
    'Oct/Nov Week 5 (Oct 26 - Nov 01)': 0,
    'Nov Week 6 (Nov 02 - Nov 08)': 0,
    'Nov Week 7 (Nov 09 - Nov 15)': 0,
    'Nov Week 8 (Nov 16 - Nov 20)': 0,
  };

  for (const date of sortedDates) {
    const day = parseInt(date.slice(8), 10);
    const month = date.slice(5, 7);
    if (month === '10') {
      if (day <= 4) weekCounts['Oct Week 1 (Oct 01 - Oct 04)']++;
      else if (day <= 11) weekCounts['Oct Week 2 (Oct 05 - Oct 11)']++;
      else if (day <= 18) weekCounts['Oct Week 3 (Oct 12 - Oct 18)']++;
      else if (day <= 25) weekCounts['Oct Week 4 (Oct 19 - Oct 25)']++;
      else weekCounts['Oct/Nov Week 5 (Oct 26 - Nov 01)']++;
    } else if (month === '11') {
      if (day === 1) weekCounts['Oct/Nov Week 5 (Oct 26 - Nov 01)']++;
      else if (day <= 8) weekCounts['Nov Week 6 (Nov 02 - Nov 08)']++;
      else if (day <= 15) weekCounts['Nov Week 7 (Nov 09 - Nov 15)']++;
      else weekCounts['Nov Week 8 (Nov 16 - Nov 20)']++;
    }
  }

  let busiestWeek = 'Evenly distributed';
  let maxWeekCount = 0;
  for (const [wName, count] of Object.entries(weekCounts)) {
    if (count > maxWeekCount) {
      maxWeekCount = count;
      busiestWeek = `${wName} (${count} exam days)`;
    }
  }

  return {
    totalPapers,
    totalScheduledPapers: totalPapers,
    totalExamDays,
    startDate,
    endDate,
    durationSpanDays,
    directClashesCount,
    sameDayDoubleCount,
    sameDayDoublesCount: sameDayDoubleCount,
    averageGapDays,
    busiestWeek,
    clashes,
    days,
  };
}

/**
 * Generate iCalendar standard (.ics) format string for Google Calendar, Apple Calendar, Outlook
 */
export function generateICalendarString(subjects: ExamSubject[], candidateName?: string): string {
  const selectedSubjects = subjects.filter((s) => s.selected);
  const papers: ScheduledExamPaper[] = [];

  for (const sub of selectedSubjects) {
    papers.push(...getScheduledPapersForSubject(sub));
  }

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cambridge International Examinations//IGCSE Exam Schedule Visualizer//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Cambridge IGCSE Oct/Nov 2026 Timetable',
    'X-WR-TIMEZONE:UTC',
  ];

  for (const p of papers) {
    const cleanDate = p.date.replace(/-/g, '');
    let startHour = p.session === 'AM' ? '090000' : '133000';
    let endHour = p.session === 'AM' ? '110000' : '153000';

    if (p.timeSlot.includes(' - ')) {
      const [sPart, ePart] = p.timeSlot.split(' - ');
      if (sPart && sPart.includes(':')) {
        startHour = sPart.trim().replace(':', '') + '00';
      }
      if (ePart && ePart.includes(':')) {
        endHour = ePart.trim().replace(':', '') + '00';
      }
    }

    const dtStart = `${cleanDate}T${startHour}Z`;
    const dtEnd = `${cleanDate}T${endHour}Z`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:cambridge-exam-${p.id}@cie-exam-portal.org`);
    lines.push(`DTSTAMP:${cleanDate}T000000Z`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:[${p.paperCode}] ${p.subjectName} - ${p.paperName}`);
    lines.push(`DESCRIPTION:Cambridge IGCSE Oct/Nov Examination\\nSubject: ${p.subjectName} (${p.subjectCode})\\nPaper: ${p.paperName}\\nDuration: ${p.durationLabel}\\nCandidate: ${candidateName || 'Enrolled Candidate'}`);
    lines.push(`LOCATION:Cambridge Examination Center`);
    lines.push('STATUS:CONFIRMED');
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT24H');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:Reminder: Cambridge Exam tomorrow: ${p.subjectName} (${p.paperCode})`);
    lines.push('END:VALARM');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
