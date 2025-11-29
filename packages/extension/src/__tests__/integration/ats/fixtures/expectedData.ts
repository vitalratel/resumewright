/**
 * Expected CV Data Fixtures for ATS Testing
 * 
 * Defines the expected extracted data for each CV template.
 * Used to calculate extraction accuracy by comparing parser output to expected values.
 * 
 * Test suite runs for all 5 CV templates
 */

import type { ExpectedCVData } from '../types';

// Helper type for compile-time tuple length validation
type FiveTuple<T> = readonly [T, T, T, T, T];

/**
 * Expected data for single-page traditional CV
 * Template: test-fixtures/tsx-samples/single-page/01-single-column-traditional.tsx
 */
export const traditional: ExpectedCVData = {
  name: 'John Anderson',
  email: 'john.anderson@email.com',
  phone: '(555) 123-4567',
  location: 'Seattle, WA',
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'Tech Innovations Inc.',
      startDate: '2020',
      endDate: 'Present',
    },
    {
      title: 'Software Engineer',
      company: 'Digital Solutions Corp.',
      startDate: '2017',
      endDate: '2020',
    },
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Washington',
      graduationDate: '2017',
    },
  ],
  skills: [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'AWS',
    'Docker',
    'Kubernetes',
    'GraphQL',
    'PostgreSQL',
  ],
};

/**
 * Expected data for two-column modern CV
 * Template: test-fixtures/tsx-samples/single-page/02-two-column-modern.tsx
 */
export const twoColumn: ExpectedCVData = {
  name: 'Sarah Chen',
  email: 'sarah.chen@email.com',
  phone: '(555) 987-6543',
  location: 'San Francisco, CA',
  experience: [
    {
      title: 'Senior Product Manager',
      company: 'CloudTech Solutions',
      startDate: '2021',
      endDate: 'Present',
    },
    {
      title: 'Product Manager',
      company: 'StartupHub Inc.',
      startDate: '2019',
      endDate: '2021',
    },
    {
      title: 'Associate Product Manager',
      company: 'TechCorp',
      startDate: '2018',
      endDate: '2019',
    },
  ],
  education: [
    {
      degree: 'MBA, Product Management',
      institution: 'Stanford Graduate School of Business',
      graduationDate: '2018',
    },
    {
      degree: 'BS, Computer Science',
      institution: 'UC Berkeley',
      graduationDate: '2016',
    },
  ],
  skills: [
    'Product Strategy',
    'Data Analysis',
    'A/B Testing',
    'User Research',
    'Roadmap Planning',
    'SQL & Python',
    'Agile/Scrum',
    'Stakeholder Mgmt',
  ],
};

/**
 * Expected data for minimal simple CV
 * Template: test-fixtures/tsx-samples/single-page/03-minimal-simple.tsx
 */
export const minimal: ExpectedCVData = {
  name: 'MICHAEL RODRIGUEZ',
  email: 'michael.rodriguez@email.com',
  phone: '(555) 246-8135',
  location: 'Boston, MA',
  experience: [
    {
      title: 'Senior Data Scientist',
      company: 'DataCorp Analytics',
      startDate: '2021-01',
      endDate: 'Present',
    },
    {
      title: 'Data Scientist',
      company: 'Analytics Inc',
      startDate: '2019-06',
      endDate: '2020-12',
    },
    {
      title: 'Data Analyst',
      company: 'TechStart',
      startDate: '2018-07',
      endDate: '2019-05',
    },
  ],
  education: [
    {
      degree: 'Master of Science in Data Science',
      institution: 'MIT',
      graduationDate: '2018',
    },
    {
      degree: 'Bachelor of Science in Mathematics',
      institution: 'Boston University',
      graduationDate: '2016',
    },
  ],
  skills: [
    'Python',
    'R',
    'SQL',
    'TensorFlow',
    'Scikit-learn',
    'Pandas',
    'NumPy',
    'Tableau',
    'Power BI',
    'AWS',
    'Git',
    'Machine Learning',
    'Statistical Analysis',
    'Data Visualization',
    'A/B Testing',
    'Predictive Modeling',
  ],
};

/**
 * Expected data for technical developer CV
 * Template: test-fixtures/tsx-samples/single-page/04-technical-developer.tsx
 */
export const technical: ExpectedCVData = {
  name: 'Alex Kumar',
  email: 'alex.kumar@dev.io',
  phone: undefined,
  location: 'Austin, TX',
  experience: [
    {
      title: 'Senior Engineer',
      company: 'CloudScale Technologies',
      startDate: '2020',
      endDate: 'Present',
    },
    {
      title: 'Software Engineer',
      company: 'DevHub Inc',
      startDate: '2017',
      endDate: '2020',
    },
  ],
  education: [
    {
      degree: 'BS Computer Science',
      institution: 'University of Texas at Austin',
      graduationDate: '2017',
    },
  ],
  skills: [
    'JavaScript',
    'TypeScript',
    'Python',
    'Go',
    'React',
    'Next.js',
    'Vue',
    'Tailwind CSS',
    'Node.js',
    'Express',
    'GraphQL',
    'REST APIs',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'AWS',
    'Docker',
    'Kubernetes',
    'Terraform',
  ],
};

/**
 * Expected data for multi-page traditional CV
 * Template: test-fixtures/tsx-samples/multi-page/01-two-page-traditional.tsx
 */
export const multiPage: ExpectedCVData = {
  name: 'Sarah Williams',
  email: 'sarah.williams@professional.com',
  phone: '+1-555-222-1111',
  location: 'Boston, MA',
  experience: [
    {
      title: 'Engineering Manager',
      company: 'Enterprise Corp',
      startDate: '2020-01',
      endDate: 'Present',
    },
    {
      title: 'Senior Software Engineer',
      company: 'Tech Giant',
      startDate: '2017-06',
      endDate: '2019-12',
    },
    {
      title: 'Software Engineer',
      company: 'Medium Company',
      startDate: '2015-03',
      endDate: '2017-05',
    },
    {
      title: 'Junior Developer',
      company: 'Small Startup',
      startDate: '2013-09',
      endDate: '2015-02',
    },
  ],
  education: [
    {
      degree: 'Master of Business Administration',
      institution: 'Harvard Business School',
      graduationDate: '2013-05',
    },
    {
      degree: 'Bachelor of Science in Computer Engineering',
      institution: 'Georgia Tech',
      graduationDate: '2011-05',
    },
  ],
  skills: [
    'Team Leadership',
    'Agile',
    'Scrum',
    'Java',
    'Spring Boot',
    'Microservices',
    'AWS',
    'Azure',
    'DevOps',
    'CI/CD',
    'Project Management',
    'Stakeholder Management',
    'Hiring',
    'Mentoring',
  ],
};

/**
 * CV template fixture mapping
 * Maps template names to their expected data
 */
export const CV_FIXTURES = {
  '01-single-column-traditional': traditional,
  '02-two-column-modern': twoColumn,
  '03-minimal-simple': minimal,
  '04-technical-developer': technical,
  '01-two-page-traditional': multiPage,
} as const;

/**
 * List of CV templates to test (5 templates)
 */
export const TEST_TEMPLATES = [
  {
    name: '01-single-column-traditional',
    path: 'single-page/01-single-column-traditional.tsx',
    expectedData: traditional,
  },
  {
    name: '02-two-column-modern',
    path: 'single-page/02-two-column-modern.tsx',
    expectedData: twoColumn,
  },
  {
    name: '03-minimal-simple',
    path: 'single-page/03-minimal-simple.tsx',
    expectedData: minimal,
  },
  {
    name: '04-technical-developer',
    path: 'single-page/04-technical-developer.tsx',
    expectedData: technical,
  },
  {
    name: '01-two-page-traditional',
    path: 'multi-page/01-two-page-traditional.tsx',
    expectedData: multiPage,
  },
] as const;

// Compile-time validation: Ensure exactly 5 templates (AC15)
TEST_TEMPLATES satisfies FiveTuple<{
  name: string;
  path: string;
  expectedData: ExpectedCVData;
}>;
