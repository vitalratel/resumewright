/**
 * Test Fixture: Two-Page Traditional Resume
 *
 * Description: Extended single-column resume with enough content to span 2 pages
 * Layout Type: single-column
 * Estimated Pages: 2
 * Font Complexity: Simple (1-2 fonts)
 * Special Features: Tests pagination, orphan prevention, bullet lists
 * Test Objectives:
 *   - Verify content flows correctly across 2 pages
 *   - Ensure headings don't orphan at bottom of page 1
 *   - Validate page breaks don't split bullet points
 */

export default function TwoPageTraditionalResume() {
  return (
    <div style={{ fontFamily: 'Helvetica', fontSize: '11px', padding: '36px', maxWidth: '612px', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#000000' }}>
          Jennifer Martinez
        </h1>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px' }}>
          Senior Product Manager
        </div>
        <div style={{ fontSize: '10px', color: '#666666' }}>
          San Francisco, CA • jennifer.martinez@email.com • (555) 987-6543 • linkedin.com/in/jennifermartinez
        </div>
      </div>

      {/* Professional Summary */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '4px' }}>
          PROFESSIONAL SUMMARY
        </h2>
        <p style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333' }}>
          Strategic Product Manager with 10+ years of experience driving product vision and execution for B2B SaaS platforms.
          Proven expertise in user research, roadmap planning, and cross-functional leadership. Track record of launching
          products that achieve 150%+ revenue targets and improve customer satisfaction scores by 40+ points.
        </p>
      </div>

      {/* Core Competencies */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '4px' }}>
          CORE COMPETENCIES
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '10px', color: '#333333' }}>
          <span>• Product Strategy & Roadmapping</span>
          <span>• Agile/Scrum Methodologies</span>
          <span>• User Experience Design</span>
          <span>• Data-Driven Decision Making</span>
          <span>• Stakeholder Management</span>
          <span>• Go-to-Market Strategy</span>
          <span>• A/B Testing & Analytics</span>
          <span>• Cross-Functional Team Leadership</span>
        </div>
      </div>

      {/* Professional Experience */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '4px' }}>
          PROFESSIONAL EXPERIENCE
        </h2>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>Senior Product Manager</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2021 - Present</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '6px' }}>
            CloudTech Solutions, San Francisco, CA
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>Led product strategy for enterprise analytics platform serving 500+ B2B customers with $25M ARR</li>
            <li style={{ marginBottom: '4px' }}>Launched AI-powered insights feature that increased user engagement by 65% and reduced churn by 28%</li>
            <li style={{ marginBottom: '4px' }}>Managed cross-functional team of 12 (engineering, design, data science) through complete product redesign</li>
            <li style={{ marginBottom: '4px' }}>Implemented data-driven experimentation framework resulting in 40% faster feature validation cycles</li>
            <li style={{ marginBottom: '4px' }}>Drove pricing strategy optimization that increased average contract value by 35% year-over-year</li>
            <li style={{ marginBottom: '4px' }}>Established product-led growth initiatives contributing to 120% net revenue retention</li>
          </ul>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>Product Manager</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2018 - 2021</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '6px' }}>
            DataFlow Systems, Palo Alto, CA
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>Owned end-to-end product development for workflow automation tool with 200K+ monthly active users</li>
            <li style={{ marginBottom: '4px' }}>Conducted 50+ user interviews and synthesized insights to inform product roadmap priorities</li>
            <li style={{ marginBottom: '4px' }}>Launched mobile app that achieved 4.8-star rating and 30% adoption within first quarter</li>
            <li style={{ marginBottom: '4px' }}>Collaborated with engineering to reduce technical debt by 40% while maintaining feature velocity</li>
            <li style={{ marginBottom: '4px' }}>Built product analytics dashboard enabling real-time monitoring of key performance metrics</li>
            <li style={{ marginBottom: '4px' }}>Facilitated quarterly business reviews with C-level executives demonstrating product impact on revenue</li>
          </ul>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>Associate Product Manager</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2016 - 2018</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '6px' }}>
            StartupHub Inc., San Jose, CA
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>Supported senior PM in defining product requirements and managing backlog for collaboration platform</li>
            <li style={{ marginBottom: '4px' }}>Coordinated beta testing program with 100+ early adopters resulting in 85% feature satisfaction rate</li>
            <li style={{ marginBottom: '4px' }}>Created detailed product documentation and go-to-market materials for sales and customer success teams</li>
            <li style={{ marginBottom: '4px' }}>Analyzed competitive landscape and presented strategic recommendations to executive leadership</li>
            <li style={{ marginBottom: '4px' }}>Managed relationships with key enterprise customers to gather feedback and validate product direction</li>
          </ul>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>Business Analyst</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2014 - 2016</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '6px' }}>
            Enterprise Software Corp., San Francisco, CA
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>Gathered and documented business requirements for CRM system enhancement projects</li>
            <li style={{ marginBottom: '4px' }}>Performed data analysis to identify trends and opportunities for product optimization</li>
            <li style={{ marginBottom: '4px' }}>Created user stories and acceptance criteria in collaboration with development teams</li>
            <li style={{ marginBottom: '4px' }}>Facilitated workshops with stakeholders to align on project scope and success metrics</li>
          </ul>
        </div>
      </div>

      {/* Education */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '4px' }}>
          EDUCATION
        </h2>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000' }}>Master of Business Administration (MBA)</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2014</span>
          </div>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            Stanford Graduate School of Business, Stanford, CA
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px' }}>
            Concentration: Technology Product Management
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000' }}>Bachelor of Science in Computer Science</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2012</span>
          </div>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            University of California, Berkeley
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px' }}>
            GPA: 3.8/4.0 • Dean's List
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '4px' }}>
          CERTIFICATIONS & TRAINING
        </h2>
        <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '4px' }}>Certified Scrum Product Owner (CSPO), Scrum Alliance</li>
          <li style={{ marginBottom: '4px' }}>Product Management Certificate, Product School</li>
          <li style={{ marginBottom: '4px' }}>Data Analytics Professional Certificate, Google</li>
        </ul>
      </div>

      {/* Awards & Recognition */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#000000', borderBottom: '2px solid #000000', paddingBottom: '4px' }}>
          AWARDS & RECOGNITION
        </h2>
        <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '4px' }}>Product Innovation Award, CloudTech Solutions (2023)</li>
          <li style={{ marginBottom: '4px' }}>Top 40 Under 40 Product Leaders, Product Management Today (2022)</li>
          <li style={{ marginBottom: '4px' }}>Excellence in Product Development, DataFlow Systems (2020)</li>
        </ul>
      </div>
    </div>
  );
}
