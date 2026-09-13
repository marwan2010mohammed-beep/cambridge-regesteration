import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import {
  validateEmail,
  validateDiscordHandle,
  validateCandidateName,
  validateCenterNumber,
  validateRegistrationPayload,
} from '../src/utils/validation';
import { ALL_OCT_NOV_SUBJECTS as initialSubjects } from '../src/data/subjects';
import { generateTimetableSummary } from '../src/data/examSchedule';
import { generateClientCambridgeAcademicResponse } from '../src/components/CambridgeNightmareSupportModal';
import { ExamSubject } from '../src/types';

afterEach(() => {
  cleanup();
});

describe('Negative-Path & Form Validation Coverage', () => {
  describe('validateEmail', () => {
    it('rejects empty and whitespace-only email inputs', () => {
      const emptyResult = validateEmail('');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.error).toMatch(/required/i);

      const whitespaceResult = validateEmail('   ');
      expect(whitespaceResult.isValid).toBe(false);
      expect(whitespaceResult.error).toMatch(/required/i);
    });

    it('rejects emails missing the @ symbol', () => {
      const result = validateEmail('candidate.cie-portal.org');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/valid email/i);
    });

    it('rejects emails missing the domain name or username', () => {
      expect(validateEmail('@domain.com').isValid).toBe(false);
      expect(validateEmail('user@').isValid).toBe(false);
      expect(validateEmail('user@.com').isValid).toBe(false);
    });

    it('rejects emails missing a top-level domain extension', () => {
      const result = validateEmail('user@localhost');
      expect(result.isValid).toBe(false);
    });

    it('rejects emails with consecutive dots in domain', () => {
      const result = validateEmail('student@gmail..com');
      expect(result.isValid).toBe(false);
    });

    it('rejects emails with single-letter top-level domain extensions', () => {
      const result = validateEmail('student@domain.c');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/at least 2 characters/i);
    });

    it('rejects emails exceeding 254 characters', () => {
      const longUsername = 'a'.repeat(250);
      const result = validateEmail(`${longUsername}@domain.com`);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/maximum 254/i);
    });

    it('rejects disposable or temporary email providers', () => {
      const disposables = [
        'candidate@mailinator.com',
        'student@tempmail.com',
        'tester@10minutemail.com',
        'user@guerrillamail.com',
        'user@trashmail.com',
      ];
      for (const email of disposables) {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/disposable|temporary/i);
      }
    });

    it('flags common email domain typos and provides appropriate correction suggestions', () => {
      const typoCases = [
        { input: 'candidate@gmai.com', expected: 'candidate@gmail.com' },
        { input: 'student@yaho.com', expected: 'student@yahoo.com' },
        { input: 'alex@hotmial.com', expected: 'alex@hotmail.com' },
        { input: 'cie@outlok.com', expected: 'cie@outlook.com' },
        { input: 'user@icould.com', expected: 'user@icloud.com' },
        { input: 'candidate@gmail.con', expected: 'candidate@gmail.com' },
      ];

      for (const { input, expected } of typoCases) {
        const result = validateEmail(input);
        expect(result.isValid).toBe(true);
        expect(result.warning).toBeDefined();
        expect(result.suggestion).toBe(expected);
      }
    });

    it('accepts valid official and personal academic email addresses', () => {
      const validEmails = [
        'student@gmail.com',
        'candidate123@yahoo.co.uk',
        'cie.officer@cambridge.org',
        'exam.candidate+cie2026@outlook.com',
        'private.candidate@proton.me',
      ];
      for (const email of validEmails) {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.warning).toBeUndefined();
        expect(result.normalized).toBe(email.toLowerCase());
      }
    });
  });

  describe('validateDiscordHandle', () => {
    it('rejects empty or whitespace-only discord handle', () => {
      expect(validateDiscordHandle('').isValid).toBe(false);
      expect(validateDiscordHandle('   ').isValid).toBe(false);
    });

    it('rejects bare @ symbol with no username', () => {
      const result = validateDiscordHandle('@');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/after the @ symbol/i);
    });

    it('rejects handles shorter than 2 characters', () => {
      const result = validateDiscordHandle('a');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/at least 2 characters/i);
    });

    it('rejects handles longer than 32 characters', () => {
      const longHandle = 'a'.repeat(33);
      const result = validateDiscordHandle(longHandle);
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/cannot exceed 32/i);
    });

    it('rejects handles containing whitespace', () => {
      const result = validateDiscordHandle('john doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/spaces/i);
    });

    it('rejects handles with consecutive dots', () => {
      const result = validateDiscordHandle('john..doe');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/consecutive dots/i);
    });

    it('rejects handles with forbidden special characters', () => {
      const invalid = ['user$name', 'alex!cie', 'candidate*test', 'name#abc'];
      for (const handle of invalid) {
        const result = validateDiscordHandle(handle);
        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/invalid characters/i);
      }
    });

    it('accepts valid discord usernames with or without leading @, and legacy tags', () => {
      const valid = ['cambridge_student', '@alex.exams', 'cie_candidate-2026', 'legacy_user#1234'];
      for (const handle of valid) {
        const result = validateDiscordHandle(handle);
        expect(result.isValid).toBe(true);
        expect(result.normalized?.startsWith('@')).toBe(true);
      }
    });
  });

  describe('validateCandidateName & validateCenterNumber', () => {
    it('validates candidate legal name length boundaries', () => {
      expect(validateCandidateName('').isValid).toBe(true);
      expect(validateCandidateName('A').isValid).toBe(false);
      expect(validateCandidateName('a'.repeat(81)).isValid).toBe(false);
      expect(validateCandidateName('Johnathan Doe-Smith').isValid).toBe(true);
    });

    it('rejects candidate names with invalid script/code injection characters', () => {
      expect(validateCandidateName('John <script>alert(1)</script>').isValid).toBe(false);
      expect(validateCandidateName('Candidate {test}').isValid).toBe(false);
    });

    it('validates Cambridge center number format', () => {
      expect(validateCenterNumber('').isValid).toBe(true); // defaults to EG042
      expect(validateCenterNumber('EG042').isValid).toBe(true);
      expect(validateCenterNumber('GB100').isValid).toBe(true);
      expect(validateCenterNumber('PK999').isValid).toBe(true);

      // Invalid lengths or formats
      expect(validateCenterNumber('123').isValid).toBe(false);
      expect(validateCenterNumber('EG042X_TOO_LONG').isValid).toBe(false);
      expect(validateCenterNumber('12ABC').isValid).toBe(false);
    });
  });

  describe('validateRegistrationPayload (Unified Validation & Edge Cases)', () => {
    it('flags an error when zero subjects are selected', () => {
      const result = validateRegistrationPayload({
        email: 'candidate@cie.org',
        discord: '@cie_student',
        selectedSubjectsCount: 0,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.subjects).toBeDefined();
    });

    it('rejects duplicate registration attempts', () => {
      const existing = [
        { email: 'registered@cie.org', discord: '@existing_user' },
      ];

      // Duplicate by email
      const dupEmail = validateRegistrationPayload({
        email: 'registered@cie.org',
        discord: '@new_handle',
        selectedSubjectsCount: 3,
        existingEnrollments: existing,
      });
      expect(dupEmail.isValid).toBe(false);
      expect(dupEmail.errors.duplicate).toBeDefined();

      // Duplicate by discord
      const dupDiscord = validateRegistrationPayload({
        email: 'unique@cie.org',
        discord: '@existing_user',
        selectedSubjectsCount: 2,
        existingEnrollments: existing,
      });
      expect(dupDiscord.isValid).toBe(false);
      expect(dupDiscord.errors.duplicate).toBeDefined();
    });

    it('passes completely valid registration data', () => {
      const result = validateRegistrationPayload({
        email: 'candidate.valid@cambridge.org',
        discord: '@valid_candidate',
        candidateName: 'Cambridge Scholar',
        centerNumber: 'EG042',
        selectedSubjectsCount: 4,
        existingEnrollments: [],
      });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });
  });
});

describe('Search & Subject Catalog Edge Cases', () => {
  it('handles zero-match subject searches gracefully', () => {
    const query = 'xyz999nonexistent';
    const matches = initialSubjects.filter((sub) => {
      const q = query.toLowerCase();
      return (
        sub.code.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        sub.papers.some((p) => p.toLowerCase().includes(q))
      );
    });
    expect(matches.length).toBe(0);
  });

  it('correctly matches subjects by 4-digit syllabus code and subject name', () => {
    const mathMatch = initialSubjects.filter((s) => s.code === '0580');
    expect(mathMatch.length).toBe(1);
    expect(mathMatch[0].name).toMatch(/Mathematics/i);

    const physicsMatch = initialSubjects.filter((s) => s.code === '0625');
    expect(physicsMatch.length).toBe(1);
    expect(physicsMatch[0].name).toMatch(/Physics/i);
  });

  it('filters by category and handles empty category filters safely', () => {
    const stemSubjects = initialSubjects.filter((s) => s.category === 'Sciences');
    expect(stemSubjects.length).toBeGreaterThan(0);

    const unknownCategory = initialSubjects.filter((s) => s.category === 'NonExistentCategory');
    expect(unknownCategory.length).toBe(0);
  });
});

describe('Timetable & Schedule Edge-Case Scenarios', () => {
  it('produces safe zero-state metrics when no subjects are selected', () => {
    const emptySubjects: ExamSubject[] = initialSubjects.map((s) => ({
      ...s,
      selected: false,
      selectedPapers: [],
    }));

    const summary = generateTimetableSummary(emptySubjects);
    expect(summary.totalPapers).toBe(0);
    expect(summary.totalExamDays).toBe(0);
    expect(summary.days.length).toBe(0);
    expect(summary.clashes.length).toBe(0);
    expect(summary.directClashesCount).toBe(0);
  });

  it('calculates scheduled days and spacing gap when subjects are selected', () => {
    // Select Mathematics (0580) and Physics (0625)
    const selectedSubjects: ExamSubject[] = initialSubjects.map((s) => ({
      ...s,
      selected: s.code === '0580' || s.code === '0625',
      selectedPapers: s.papers,
    }));

    const summary = generateTimetableSummary(selectedSubjects);
    expect(summary.totalPapers).toBeGreaterThan(0);
    expect(summary.totalExamDays).toBeGreaterThan(0);
    expect(summary.startDate).toBeDefined();
    expect(summary.endDate).toBeDefined();
    expect(summary.averageGapDays).toBeGreaterThanOrEqual(0);
  });

  it('detects exam clashes or double sessions appropriately', () => {
    // Select all science subjects (0610, 0620, 0625)
    const heavySubjects: ExamSubject[] = initialSubjects.map((s) => ({
      ...s,
      selected: ['0610', '0620', '0625', '0580'].includes(s.code),
      selectedPapers: s.papers,
    }));

    const summary = generateTimetableSummary(heavySubjects);
    expect(summary.totalPapers).toBeGreaterThan(6);
    expect(typeof summary.directClashesCount).toBe('number');
    expect(typeof summary.sameDayDoubleCount).toBe('number');
  });
});

describe('Resilience & Fallback Engine', () => {
  it('academic AI advisor client fallback generates meaningful advice during network/backend failure', () => {
    const mockContext = {
      selectedSubjects: ['0580 Mathematics [Extended]', '0625 Physics [Extended]'],
      email: 'candidate@cie.org',
      discord: '@cie_student',
      clashesCount: 0,
      sameDayDoublesCount: 1,
      totalPapers: 5,
      firstExamDate: '2026-10-06',
      lastExamDate: '2026-11-12',
    };

    const prompt = 'How do I prepare for my Cambridge Physics Paper 4 exam?';
    const fallbackReply = generateClientCambridgeAcademicResponse(prompt, mockContext);

    expect(typeof fallbackReply).toBe('string');
    expect(fallbackReply.length).toBeGreaterThan(50);
    expect(fallbackReply).toMatch(/cambridge|physics|0625|examination|syllabus/i);
  });

  it('academic engine handles unexpected, empty, or missing prompt gracefully', () => {
    const fallbackReply = generateClientCambridgeAcademicResponse('', {});
    expect(typeof fallbackReply).toBe('string');
    expect(fallbackReply.length).toBeGreaterThan(20);
  });
});

describe('UI Empty States & Negative Interaction Paths', () => {
  it('SubjectCatalogModal displays clear empty state when search produces no matching subjects', async () => {
    const { render, screen } = await import('@testing-library/react');
    const { SubjectCatalogModal } = await import('../src/components/SubjectCatalogModal');

    render(
      <SubjectCatalogModal
        subjects={initialSubjects}
        onToggleSubject={() => {}}
        onTogglePaper={() => {}}
        onSelectOnlyPaper={() => {}}
        onSelectAllPapers={() => {}}
        onSelectMultiple={() => {}}
        onClose={() => {}}
        initialSearch="XYZ999NONEXISTENT"
      />
    );

    expect(screen.getByText(/No subjects match "XYZ999NONEXISTENT"/i)).toBeDefined();
    expect(screen.getByText(/Reset Search Filters/i)).toBeDefined();
  });

  it('ExamScheduleVisualizer renders dedicated empty state when 0 papers are selected', async () => {
    const { render, screen } = await import('@testing-library/react');
    const ExamScheduleVisualizer = (await import('../src/components/ExamScheduleVisualizer')).default;

    const unselectedSubjects = initialSubjects.map((s) => ({
      ...s,
      selected: false,
      selectedPapers: [],
    }));

    render(
      <ExamScheduleVisualizer
        subjects={unselectedSubjects}
        onOpenSubjectCatalog={() => {}}
      />
    );

    expect(screen.getByText(/No Subjects Selected for Timetable/i)).toBeDefined();
    expect(screen.getByText(/Open Subject Catalog & Choose Papers/i)).toBeDefined();
  });

  it('AdminRegistryModal enforces authentication lock and rejects unauthorized access', async () => {
    const { render, screen, fireEvent, waitFor } = await import('@testing-library/react');
    const { AdminRegistryModal } = await import('../src/components/AdminRegistryModal');

    sessionStorage.removeItem('cambridge_admin_auth_user_v1');

    render(
      <AdminRegistryModal
        enrollments={[]}
        onClose={() => {}}
        onUpdateStatus={() => {}}
        onDeleteRecord={() => {}}
        onClearAll={() => {}}
        subjects={initialSubjects}
        preApprovedRoster={[]}
        onUpdatePreApprovedRoster={() => {}}
      />
    );

    // Expect the admin terminal lock screen to be present
    expect(screen.getByText(/RESTRICTED ACCESS/i)).toBeDefined();

    // Attempt login with invalid credentials
    const userInput = screen.getByPlaceholderText(/Enter username/i);
    fireEvent.change(userInput, { target: { value: 'unauthorized_user' } });

    const passwordInput = screen.getByPlaceholderText(/Enter password/i);
    fireEvent.change(passwordInput, { target: { value: 'wrong_password_xyz' } });
    
    const unlockBtn = screen.getByRole('button', { name: /Unlock Candidate Registry/i });
    fireEvent.click(unlockBtn);

    // Should display invalid credentials rejection
    await waitFor(() => {
      expect(screen.getByText(/Invalid administrator username or password/i)).toBeDefined();
    }, { timeout: 2000 });
  });

  it('AdminRegistryModal renders empty candidate roster state when authenticated with no records', async () => {
    const { render, screen } = await import('@testing-library/react');
    const { AdminRegistryModal } = await import('../src/components/AdminRegistryModal');

    // Authenticate session
    sessionStorage.setItem('cambridge_admin_auth_user_v1', 'examiner_admin');

    render(
      <AdminRegistryModal
        enrollments={[]}
        onClose={() => {}}
        onUpdateStatus={() => {}}
        onDeleteRecord={() => {}}
        onClearAll={() => {}}
        subjects={initialSubjects}
        preApprovedRoster={[]}
        onUpdatePreApprovedRoster={() => {}}
      />
    );

    expect(screen.getByText(/No matching candidate registration records found/i)).toBeDefined();
  });
});

