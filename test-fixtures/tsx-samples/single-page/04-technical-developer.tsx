/**
 * Test Fixture: Technical Developer Resume
 *
 * Description: Technical resume for software developers with code-like formatting
 * Layout Type: single-column
 * Estimated Pages: 1
 * Font Complexity: Simple (Courier for code blocks, Helvetica for text)
 * Special Features: Code-style formatting, technical emphasis
 */

import React from 'react';

export default function TechnicalResume() {
  return (
    <div style={{ fontFamily: 'Helvetica', fontSize: '11px', padding: '36px', maxWidth: '612px', backgroundColor: '#fafafa' }}>
      {/* Header with code-like style */}
      <div style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: '16px', marginBottom: '20px', fontFamily: 'Courier' }}>
        <div style={{ fontSize: '16px', color: '#4ec9b0', marginBottom: '4px' }}>
          &lt;Developer&gt;
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginLeft: '16px', marginBottom: '4px' }}>
          Alex Kumar
        </div>
        <div style={{ fontSize: '12px', color: '#ce9178', marginLeft: '16px', marginBottom: '4px' }}>
          Full Stack Engineer | Open Source Contributor
        </div>
        <div style={{ fontSize: '10px', color: '#9cdcfe', marginLeft: '16px' }}>
          github.com/alexkumar | alex.kumar@dev.io | Austin, TX
        </div>
        <div style={{ fontSize: '16px', color: '#4ec9b0', marginTop: '4px' }}>
          &lt;/Developer&gt;
        </div>
      </div>

      {/* About */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0066cc', marginBottom: '8px', fontFamily: 'Courier' }}>
          // ABOUT
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.5', paddingLeft: '12px' }}>
          Passionate full-stack engineer with 7 years building scalable web applications. Specialized in JavaScript
          ecosystem (React, Node.js, TypeScript) and cloud-native architectures. Active open-source contributor with
          10K+ GitHub stars across projects.
        </div>
      </div>

      {/* Technical Stack */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0066cc', marginBottom: '8px', fontFamily: 'Courier' }}>
          // TECH_STACK
        </div>
        <div style={{ fontSize: '10px', backgroundColor: '#ffffff', border: '1px solid #e0e0e0', padding: '12px', fontFamily: 'Courier', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          <span style={{ color: '#0066cc' }}>const</span> techStack = &#123;<br />
          &nbsp;&nbsp;languages: [<span style={{ color: '#a31515' }}>'JavaScript'</span>, <span style={{ color: '#a31515' }}>'TypeScript'</span>, <span style={{ color: '#a31515' }}>'Python'</span>, <span style={{ color: '#a31515' }}>'Go'</span>],<br />
          &nbsp;&nbsp;frontend: [<span style={{ color: '#a31515' }}>'React'</span>, <span style={{ color: '#a31515' }}>'Next.js'</span>, <span style={{ color: '#a31515' }}>'Vue'</span>, <span style={{ color: '#a31515' }}>'Tailwind CSS'</span>],<br />
          &nbsp;&nbsp;backend: [<span style={{ color: '#a31515' }}>'Node.js'</span>, <span style={{ color: '#a31515' }}>'Express'</span>, <span style={{ color: '#a31515' }}>'GraphQL'</span>, <span style={{ color: '#a31515' }}>'REST APIs'</span>],<br />
          &nbsp;&nbsp;database: [<span style={{ color: '#a31515' }}>'PostgreSQL'</span>, <span style={{ color: '#a31515' }}>'MongoDB'</span>, <span style={{ color: '#a31515' }}>'Redis'</span>],<br />
          &nbsp;&nbsp;cloud: [<span style={{ color: '#a31515' }}>'AWS'</span>, <span style={{ color: '#a31515' }}>'Docker'</span>, <span style={{ color: '#a31515' }}>'Kubernetes'</span>, <span style={{ color: '#a31515' }}>'Terraform'</span>]<br />
          &#125;;
        </div>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0066cc', marginBottom: '8px', fontFamily: 'Courier' }}>
          // PROFESSIONAL_EXPERIENCE
        </div>

        <div style={{ marginBottom: '12px', paddingLeft: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
            <span style={{ color: '#a31515', fontFamily: 'Courier' }}>function</span> seniorEngineer() &#123; // 2020-Present &#125;
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px' }}>
            CloudScale Technologies, Austin, TX
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.5' }}>
            • Architected microservices platform handling 5M requests/day with 99.9% uptime<br />
            • Reduced infrastructure costs by 40% through optimization and auto-scaling<br />
            • Implemented GraphQL API serving 50+ frontend applications<br />
            • Open sourced internal CLI tool gaining 8K+ GitHub stars
          </div>
        </div>

        <div style={{ marginBottom: '12px', paddingLeft: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
            <span style={{ color: '#a31515', fontFamily: 'Courier' }}>function</span> softwareEngineer() &#123; // 2017-2020 &#125;
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px' }}>
            DevHub Inc, San Francisco, CA
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.5' }}>
            • Built real-time collaboration features using WebSockets and Redis<br />
            • Migrated monolith to microservices architecture<br />
            • Improved page load times by 60% through performance optimization
          </div>
        </div>
      </div>

      {/* Open Source */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0066cc', marginBottom: '8px', fontFamily: 'Courier' }}>
          // OPEN_SOURCE_PROJECTS
        </div>
        <div style={{ paddingLeft: '12px', fontSize: '10px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>react-data-grid</strong> - High-performance data grid component (8.5K ⭐)
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>node-task-queue</strong> - Distributed task queue for Node.js (3.2K ⭐)
          </div>
          <div>
            <strong>Contributing:</strong> TypeScript, React, Webpack (500+ merged PRs)
          </div>
        </div>
      </div>

      {/* Education */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0066cc', marginBottom: '8px', fontFamily: 'Courier' }}>
          // EDUCATION
        </div>
        <div style={{ paddingLeft: '12px', fontSize: '11px' }}>
          <div style={{ fontWeight: 'bold' }}>BS Computer Science</div>
          <div style={{ fontSize: '10px', color: '#666666' }}>
            University of Texas at Austin, 2013-2017
          </div>
        </div>
      </div>
    </div>
  );
}
