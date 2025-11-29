/**
 * Test Fixture: Two-Column Modern Resume
 *
 * Description: Modern two-column layout with sidebar
 * Layout Type: two-column
 * Estimated Pages: 1
 * Font Complexity: Simple (2 fonts)
 * Special Features: Sidebar with contact info, color accents
 */

import React from 'react';

export default function ModernResume() {
  return (
    <div style={{ display: 'flex', fontFamily: 'Helvetica', fontSize: '11px', maxWidth: '612px', backgroundColor: '#ffffff' }}>
      {/* Left Sidebar */}
      <div style={{ width: '200px', backgroundColor: '#2c3e50', color: '#ffffff', padding: '36px 20px' }}>
        {/* Contact Info */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', color: '#3498db', textTransform: 'uppercase' }}>
            Contact
          </h3>
          <div style={{ fontSize: '10px', lineHeight: '1.6', marginBottom: '8px' }}>
            <strong>Email:</strong><br />
            sarah.chen@email.com
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.6', marginBottom: '8px' }}>
            <strong>Phone:</strong><br />
            (555) 987-6543
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.6', marginBottom: '8px' }}>
            <strong>Location:</strong><br />
            San Francisco, CA
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.6' }}>
            <strong>LinkedIn:</strong><br />
            /in/sarahchen
          </div>
        </div>

        {/* Skills */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', color: '#3498db', textTransform: 'uppercase' }}>
            Skills
          </h3>
          <div style={{ fontSize: '10px', lineHeight: '1.8' }}>
            • Product Strategy<br />
            • Data Analysis<br />
            • A/B Testing<br />
            • User Research<br />
            • Roadmap Planning<br />
            • SQL & Python<br />
            • Agile/Scrum<br />
            • Stakeholder Mgmt
          </div>
        </div>

        {/* Languages */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', color: '#3498db', textTransform: 'uppercase' }}>
            Languages
          </h3>
          <div style={{ fontSize: '10px', lineHeight: '1.8' }}>
            English (Native)<br />
            Mandarin (Fluent)<br />
            Spanish (Basic)
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div style={{ flex: 1, padding: '36px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '6px', color: '#2c3e50' }}>
            Sarah Chen
          </h1>
          <div style={{ fontSize: '13px', color: '#3498db', fontWeight: 'bold', marginBottom: '8px' }}>
            Senior Product Manager
          </div>
          <p style={{ fontSize: '10px', lineHeight: '1.5', color: '#555555' }}>
            Strategic product leader with 6+ years driving user-centric solutions in SaaS. Expert in data-driven decision
            making and cross-functional collaboration.
          </p>
        </div>

        {/* Experience */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '4px' }}>
            Experience
          </h2>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2c3e50' }}>Senior Product Manager</div>
            <div style={{ fontSize: '10px', color: '#7f8c8d', marginBottom: '6px' }}>
              CloudTech Solutions • 2021 - Present
            </div>
            <ul style={{ fontSize: '10px', lineHeight: '1.5', color: '#555555', marginLeft: '16px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '3px' }}>Led product strategy for B2B platform serving 500+ enterprise clients</li>
              <li style={{ marginBottom: '3px' }}>Increased user retention by 35% through data-driven feature prioritization</li>
              <li style={{ marginBottom: '3px' }}>Managed cross-functional team of 12 across engineering, design, and marketing</li>
            </ul>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2c3e50' }}>Product Manager</div>
            <div style={{ fontSize: '10px', color: '#7f8c8d', marginBottom: '6px' }}>
              StartupHub Inc. • 2019 - 2021
            </div>
            <ul style={{ fontSize: '10px', lineHeight: '1.5', color: '#555555', marginLeft: '16px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '3px' }}>Launched mobile app that reached 100K downloads in first 6 months</li>
              <li style={{ marginBottom: '3px' }}>Conducted 50+ user interviews to inform product roadmap</li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2c3e50' }}>Associate Product Manager</div>
            <div style={{ fontSize: '10px', color: '#7f8c8d', marginBottom: '6px' }}>
              TechCorp • 2018 - 2019
            </div>
            <ul style={{ fontSize: '10px', lineHeight: '1.5', color: '#555555', marginLeft: '16px', paddingLeft: '0' }}>
              <li style={{ marginBottom: '3px' }}>Supported product initiatives for analytics dashboard</li>
              <li style={{ marginBottom: '3px' }}>Analyzed user metrics to identify optimization opportunities</li>
            </ul>
          </div>
        </div>

        {/* Education */}
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '4px' }}>
            Education
          </h2>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2c3e50' }}>MBA, Product Management</div>
          <div style={{ fontSize: '10px', color: '#7f8c8d', marginBottom: '8px' }}>
            Stanford Graduate School of Business • 2016 - 2018
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#2c3e50' }}>BS, Computer Science</div>
          <div style={{ fontSize: '10px', color: '#7f8c8d' }}>
            UC Berkeley • 2012 - 2016
          </div>
        </div>
      </div>
    </div>
  );
}
