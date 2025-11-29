/**
 * Test Fixture: Single-Column Traditional Resume
 *
 * Description: Classic single-column resume layout with clear sections
 * Layout Type: single-column
 * Estimated Pages: 1
 * Font Complexity: Simple (1-2 fonts)
 * Special Features: Basic text formatting, bullet lists
 */

import React from 'react';

export default function TraditionalResume() {
  return (
    <div style={{ fontFamily: 'Helvetica', fontSize: '12px', padding: '36px', maxWidth: '612px', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#000000' }}>
          John Anderson
        </h1>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          Senior Software Engineer
        </div>
        <div style={{ fontSize: '10px', color: '#666666' }}>
          Seattle, WA • john.anderson@email.com • (555) 123-4567 • linkedin.com/in/johnanderson
        </div>
      </div>

      {/* Professional Summary */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '1px solid #000000', paddingBottom: '4px' }}>
          PROFESSIONAL SUMMARY
        </h2>
        <p style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333' }}>
          Results-driven Senior Software Engineer with 8+ years of experience designing and implementing scalable web applications.
          Expertise in full-stack development with React, Node.js, and cloud infrastructure. Proven track record of leading teams
          and delivering high-impact solutions that drive business growth.
        </p>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '1px solid #000000', paddingBottom: '4px' }}>
          PROFESSIONAL EXPERIENCE
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>Senior Software Engineer</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2020 - Present</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '6px' }}>
            Tech Innovations Inc., Seattle, WA
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>Led development of microservices architecture serving 2M+ daily active users</li>
            <li style={{ marginBottom: '4px' }}>Reduced API response time by 45% through performance optimization and caching strategies</li>
            <li style={{ marginBottom: '4px' }}>Mentored team of 5 junior engineers, improving code quality and team velocity by 30%</li>
          </ul>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>Software Engineer</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2017 - 2020</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '6px' }}>
            Digital Solutions Corp., Portland, OR
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>Built responsive web applications using React and Redux for enterprise clients</li>
            <li style={{ marginBottom: '4px' }}>Implemented CI/CD pipelines reducing deployment time from 4 hours to 20 minutes</li>
            <li style={{ marginBottom: '4px' }}>Collaborated with UX team to redesign flagship product, increasing user engagement by 25%</li>
          </ul>
        </div>
      </div>

      {/* Education */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '1px solid #000000', paddingBottom: '4px' }}>
          EDUCATION
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>Bachelor of Science in Computer Science</span>
          <span style={{ fontSize: '10px', color: '#666666' }}>2013 - 2017</span>
        </div>
        <div style={{ fontSize: '11px', color: '#333333' }}>
          University of Washington, Seattle, WA • GPA: 3.8/4.0
        </div>
      </div>

      {/* Skills */}
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '1px solid #000000', paddingBottom: '4px' }}>
          TECHNICAL SKILLS
        </h2>
        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333' }}>
          <strong>Languages:</strong> JavaScript, TypeScript, Python, Java, SQL<br />
          <strong>Frameworks:</strong> React, Node.js, Express, Django, Spring Boot<br />
          <strong>Tools & Platforms:</strong> AWS, Docker, Kubernetes, Git, Jenkins, PostgreSQL<br />
          <strong>Methodologies:</strong> Agile/Scrum, TDD, CI/CD, Microservices
        </div>
      </div>
    </div>
  );
}
