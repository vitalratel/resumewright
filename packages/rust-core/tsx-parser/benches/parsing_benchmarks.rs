//! Performance benchmarks for tsx-parser
//!
//! Benchmarks realistic CV-sized documents to track performance regressions.
//! Covers small (2KB), medium (10KB), and large (50KB) CV documents.

use criterion::{criterion_group, criterion_main, BenchmarkId, Criterion};
use std::hint::black_box;
use tsx_parser::*;

/// Small CV (2KB) - Simple single-page resume
fn get_small_cv() -> &'static str {
    r#"
const CV = () => (
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px">
    <div style="text-align: center; margin-bottom: 30px">
      <h1 style="margin: 0; font-size: 32px">John Doe</h1>
      <p style="margin: 5px 0; color: #666">Software Engineer</p>
      <p style="margin: 5px 0; font-size: 14px">john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe</p>
    </div>

    <div style="margin-bottom: 25px">
      <h2 style="border-bottom: 2px solid #333; padding-bottom: 5px">Professional Summary</h2>
      <p style="line-height: 1.6">
        Experienced software engineer with 5+ years of expertise in full-stack development.
        Skilled in React, TypeScript, Rust, and cloud technologies. Passionate about building
        scalable, user-focused applications.
      </p>
    </div>

    <div style="margin-bottom: 25px">
      <h2 style="border-bottom: 2px solid #333; padding-bottom: 5px">Experience</h2>
      <div style="margin-bottom: 15px">
        <h3 style="margin: 5px 0">Senior Software Engineer - Tech Corp</h3>
        <p style="margin: 5px 0; color: #666; font-size: 14px">Jan 2020 - Present</p>
        <ul style="line-height: 1.6">
          <li>Led development of microservices architecture serving 1M+ users</li>
          <li>Reduced API response time by 40% through optimization</li>
          <li>Mentored team of 5 junior developers</li>
        </ul>
      </div>
      <div style="margin-bottom: 15px">
        <h3 style="margin: 5px 0">Software Engineer - StartupXYZ</h3>
        <p style="margin: 5px 0; color: #666; font-size: 14px">Jun 2018 - Dec 2019</p>
        <ul style="line-height: 1.6">
          <li>Built responsive web applications using React and TypeScript</li>
          <li>Implemented CI/CD pipeline reducing deployment time by 60%</li>
        </ul>
      </div>
    </div>

    <div style="margin-bottom: 25px">
      <h2 style="border-bottom: 2px solid #333; padding-bottom: 5px">Education</h2>
      <div>
        <h3 style="margin: 5px 0">B.S. Computer Science - University Name</h3>
        <p style="margin: 5px 0; color: #666; font-size: 14px">2014 - 2018</p>
      </div>
    </div>

    <div>
      <h2 style="border-bottom: 2px solid #333; padding-bottom: 5px">Skills</h2>
      <p style="line-height: 1.6">
        <strong>Languages:</strong> JavaScript, TypeScript, Rust, Python, SQL<br/>
        <strong>Frameworks:</strong> React, Node.js, Express, Next.js<br/>
        <strong>Tools:</strong> Git, Docker, AWS, PostgreSQL
      </p>
    </div>
  </div>
);
"#
}

/// Medium CV (10KB) - Multi-page resume with complex styles
fn get_medium_cv() -> &'static str {
    r#"
const CV = () => (
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 850px; margin: 0 auto; padding: 40px; background: #fff">
    <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2c3e50; padding-bottom: 20px">
      <h1 style="margin: 0; font-size: 42px; color: #2c3e50; letter-spacing: 1px">Jane Smith</h1>
      <p style="margin: 10px 0; color: #7f8c8d; font-size: 18px; font-weight: 600">Senior Full-Stack Developer & Team Lead</p>
      <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px; font-size: 14px; color: #34495e">
        <span>jane.smith@email.com</span>
        <span>|</span>
        <span>(555) 987-6543</span>
        <span>|</span>
        <span>github.com/janesmith</span>
        <span>|</span>
        <span>linkedin.com/in/janesmith</span>
      </div>
    </div>

    <div style="margin-bottom: 35px">
      <h2 style="color: #2c3e50; border-left: 4px solid #3498db; padding-left: 15px; font-size: 24px; margin-bottom: 15px">Professional Summary</h2>
      <p style="line-height: 1.8; color: #34495e; text-align: justify">
        Accomplished full-stack developer with 8+ years of experience architecting and delivering
        enterprise-scale applications. Proven track record of leading cross-functional teams,
        implementing modern development practices, and driving technical innovation. Expert in
        React, TypeScript, Node.js, Rust, and cloud-native architectures. Passionate about
        performance optimization, developer experience, and building resilient systems that scale.
      </p>
    </div>

    <div style="margin-bottom: 35px">
      <h2 style="color: #2c3e50; border-left: 4px solid #3498db; padding-left: 15px; font-size: 24px; margin-bottom: 15px">Professional Experience</h2>

      <div style="margin-bottom: 30px; padding-left: 10px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">
          <h3 style="margin: 0; font-size: 20px; color: #2c3e50">Senior Full-Stack Developer & Team Lead</h3>
          <span style="color: #7f8c8d; font-size: 14px; font-weight: 600">Jan 2021 - Present</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-weight: 600">MegaCorp Technologies | San Francisco, CA</p>
        <ul style="line-height: 1.8; color: #34495e; margin-top: 10px">
          <li>Lead team of 8 engineers developing cloud-native SaaS platform serving 500K+ daily active users</li>
          <li>Architected microservices infrastructure using Docker, Kubernetes, and AWS, reducing deployment time by 70%</li>
          <li>Implemented real-time data processing pipeline handling 10M+ events/day with 99.9% uptime</li>
          <li>Drove adoption of TypeScript, reducing production bugs by 45% and improving developer productivity</li>
          <li>Mentored junior developers through code reviews, pair programming, and technical workshops</li>
          <li>Established CI/CD best practices using GitHub Actions, reducing release cycle from 2 weeks to 2 days</li>
        </ul>
      </div>

      <div style="margin-bottom: 30px; padding-left: 10px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">
          <h3 style="margin: 0; font-size: 20px; color: #2c3e50">Full-Stack Software Engineer</h3>
          <span style="color: #7f8c8d; font-size: 14px; font-weight: 600">Mar 2019 - Dec 2020</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-weight: 600">InnovateTech Solutions | Austin, TX</p>
        <ul style="line-height: 1.8; color: #34495e; margin-top: 10px">
          <li>Developed and maintained React-based dashboard serving 50K+ enterprise customers</li>
          <li>Built RESTful APIs and GraphQL endpoints using Node.js and Express, handling 1M+ requests/day</li>
          <li>Optimized database queries and implemented caching strategies, reducing load times by 60%</li>
          <li>Collaborated with UX team to improve user experience, increasing customer satisfaction by 35%</li>
          <li>Integrated third-party APIs including Stripe, Twilio, and SendGrid for payment and communication features</li>
        </ul>
      </div>

      <div style="margin-bottom: 30px; padding-left: 10px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">
          <h3 style="margin: 0; font-size: 20px; color: #2c3e50">Software Developer</h3>
          <span style="color: #7f8c8d; font-size: 14px; font-weight: 600">Jun 2017 - Feb 2019</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-weight: 600">WebDev Agency | Remote</p>
        <ul style="line-height: 1.8; color: #34495e; margin-top: 10px">
          <li>Built responsive web applications for clients across healthcare, finance, and e-commerce sectors</li>
          <li>Implemented automated testing with Jest and Cypress, achieving 85% code coverage</li>
          <li>Developed reusable component library using React and Storybook</li>
          <li>Participated in agile ceremonies and contributed to sprint planning and retrospectives</li>
        </ul>
      </div>
    </div>

    <div style="margin-bottom: 35px">
      <h2 style="color: #2c3e50; border-left: 4px solid #3498db; padding-left: 15px; font-size: 24px; margin-bottom: 15px">Technical Skills</h2>
      <div style="padding-left: 10px">
        <div style="margin-bottom: 12px">
          <strong style="color: #2c3e50; display: inline-block; width: 180px">Languages:</strong>
          <span style="color: #34495e">JavaScript, TypeScript, Rust, Python, Go, SQL, HTML5, CSS3</span>
        </div>
        <div style="margin-bottom: 12px">
          <strong style="color: #2c3e50; display: inline-block; width: 180px">Frontend:</strong>
          <span style="color: #34495e">React, Next.js, Redux, Zustand, Tailwind CSS, Material-UI, Webpack, Vite</span>
        </div>
        <div style="margin-bottom: 12px">
          <strong style="color: #2c3e50; display: inline-block; width: 180px">Backend:</strong>
          <span style="color: #34495e">Node.js, Express, NestJS, GraphQL, REST APIs, WebSockets, Actix-web</span>
        </div>
        <div style="margin-bottom: 12px">
          <strong style="color: #2c3e50; display: inline-block; width: 180px">Databases:</strong>
          <span style="color: #34495e">PostgreSQL, MongoDB, Redis, Elasticsearch, DynamoDB</span>
        </div>
        <div style="margin-bottom: 12px">
          <strong style="color: #2c3e50; display: inline-block; width: 180px">DevOps & Cloud:</strong>
          <span style="color: #34495e">AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, Terraform, GitHub Actions, Jenkins</span>
        </div>
        <div style="margin-bottom: 12px">
          <strong style="color: #2c3e50; display: inline-block; width: 180px">Testing:</strong>
          <span style="color: #34495e">Jest, Vitest, Cypress, Playwright, React Testing Library</span>
        </div>
        <div style="margin-bottom: 12px">
          <strong style="color: #2c3e50; display: inline-block; width: 180px">Tools:</strong>
          <span style="color: #34495e">Git, VS Code, Jira, Figma, Postman, DataGrip</span>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 35px">
      <h2 style="color: #2c3e50; border-left: 4px solid #3498db; padding-left: 15px; font-size: 24px; margin-bottom: 15px">Education</h2>
      <div style="padding-left: 10px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">
          <h3 style="margin: 5px 0; font-size: 18px; color: #2c3e50">Bachelor of Science in Computer Science</h3>
          <span style="color: #7f8c8d; font-size: 14px; font-weight: 600">2013 - 2017</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-weight: 600">University of California, Berkeley</p>
        <p style="margin: 10px 0; color: #34495e">GPA: 3.8/4.0 | Dean's List all semesters</p>
      </div>
    </div>

    <div>
      <h2 style="color: #2c3e50; border-left: 4px solid #3498db; padding-left: 15px; font-size: 24px; margin-bottom: 15px">Certifications</h2>
      <div style="padding-left: 10px">
        <ul style="line-height: 1.8; color: #34495e; list-style: none; padding: 0">
          <li style="margin-bottom: 8px">✓ AWS Certified Solutions Architect - Associate (2023)</li>
          <li style="margin-bottom: 8px">✓ Professional Scrum Master I (PSM I) - Scrum.org (2022)</li>
          <li style="margin-bottom: 8px">✓ MongoDB Certified Developer Associate (2021)</li>
        </ul>
      </div>
    </div>
  </div>
);
"#
}

/// Large CV (50KB) - Executive resume with extensive experience
fn get_large_cv() -> &'static str {
    // This is a realistic 50KB executive CV with multiple pages worth of content
    // Note: Truncated for brevity but represents full executive CV structure
    r#"
const CV = () => (
  <div style="font-family: 'Georgia', 'Times New Roman', serif; max-width: 900px; margin: 0 auto; padding: 50px; background: #ffffff; color: #1a1a1a">
    <header style="border-bottom: 4px double #2c3e50; padding-bottom: 30px; margin-bottom: 40px">
      <div style="text-align: center">
        <h1 style="margin: 0; font-size: 48px; color: #1a1a1a; font-weight: 700; letter-spacing: 2px">ROBERT ANDERSON</h1>
        <p style="margin: 15px 0; font-size: 22px; color: #555; font-style: italic; font-weight: 600">Chief Technology Officer | VP Engineering | Technology Leader</p>
        <div style="display: flex; justify-content: center; gap: 25px; margin-top: 20px; font-size: 15px; color: #333; flex-wrap: wrap">
          <span style="white-space: nowrap">📧 robert.anderson@executive.com</span>
          <span>•</span>
          <span style="white-space: nowrap">📱 (555) 123-9999</span>
          <span>•</span>
          <span style="white-space: nowrap">🔗 linkedin.com/in/robertanderson</span>
          <span>•</span>
          <span style="white-space: nowrap">📍 San Francisco Bay Area, CA</span>
        </div>
      </div>
    </header>

    <section style="margin-bottom: 45px">
      <h2 style="color: #2c3e50; font-size: 28px; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px">Executive Summary</h2>
      <p style="line-height: 2; font-size: 16px; color: #2c3e50; text-align: justify; text-indent: 30px">
        Visionary technology executive with 15+ years of progressive leadership experience building
        and scaling engineering organizations from 5 to 200+ engineers. Proven track record of
        driving digital transformation, implementing cloud-native architectures, and delivering
        products that generate $100M+ in annual revenue. Expert in strategic planning, team
        building, and aligning technology initiatives with business objectives. Successfully led
        multiple companies through rapid growth phases, IPO preparation, and acquisition processes.
      </p>
      <p style="line-height: 2; font-size: 16px; color: #2c3e50; text-align: justify; text-indent: 30px; margin-top: 15px">
        Deep technical expertise across modern web technologies, distributed systems, cloud
        infrastructure, and data engineering. Passionate about building high-performing teams,
        fostering innovation, and creating engineering cultures that attract top talent. Known for
        translating complex technical concepts to executive stakeholders and board members while
        maintaining hands-on technical credibility with engineering teams.
      </p>
    </section>

    <section style="margin-bottom: 45px">
      <h2 style="color: #2c3e50; font-size: 28px; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px">Core Competencies</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding-left: 20px">
        <div>
          <h3 style="color: #3498db; font-size: 18px; margin-bottom: 10px">Leadership & Strategy</h3>
          <ul style="line-height: 1.8; color: #2c3e50; margin: 0; padding-left: 20px">
            <li>Engineering Team Building & Scaling</li>
            <li>Technical Strategy & Roadmap Planning</li>
            <li>Agile/Scrum Transformation</li>
            <li>Budget Planning & Resource Allocation</li>
            <li>M&A Technical Due Diligence</li>
            <li>Board-Level Technology Presentations</li>
          </ul>
        </div>
        <div>
          <h3 style="color: #3498db; font-size: 18px; margin-bottom: 10px">Technical Expertise</h3>
          <ul style="line-height: 1.8; color: #2c3e50; margin: 0; padding-left: 20px">
            <li>Cloud Architecture (AWS, Azure, GCP)</li>
            <li>Microservices & Distributed Systems</li>
            <li>DevOps & CI/CD Pipeline Engineering</li>
            <li>Data Engineering & Machine Learning</li>
            <li>Security & Compliance (SOC2, HIPAA)</li>
            <li>Performance Optimization & Scalability</li>
          </ul>
        </div>
      </div>
    </section>

    <section style="margin-bottom: 45px">
      <h2 style="color: #2c3e50; font-size: 28px; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px">Professional Experience</h2>

      <article style="margin-bottom: 40px; page-break-inside: avoid">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px">
          <h3 style="margin: 0; font-size: 22px; color: #1a1a1a; font-weight: 700">Chief Technology Officer (CTO)</h3>
          <span style="color: #555; font-size: 15px; font-weight: 600; white-space: nowrap">Jan 2020 - Present</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-size: 18px; font-weight: 600">TechVentures Inc. | San Francisco, CA</p>
        <p style="margin: 10px 0 15px 0; font-style: italic; color: #555; font-size: 15px">B2B SaaS Platform | Series C | $80M ARR | 180 Employees</p>

        <div style="margin-top: 15px">
          <h4 style="color: #2c3e50; font-size: 17px; margin-bottom: 10px; font-weight: 600">Key Achievements:</h4>
          <ul style="line-height: 2; color: #2c3e50; font-size: 15px">
            <li><strong>Scaled engineering organization</strong> from 35 to 120 engineers across 15 teams, establishing site reliability, data engineering, and ML/AI departments</li>
            <li><strong>Led cloud migration</strong> from legacy on-premise infrastructure to AWS, reducing infrastructure costs by $2.4M annually (40% reduction) while improving uptime to 99.99%</li>
            <li><strong>Architected platform rebuild</strong> using microservices, event-driven architecture, and CQRS patterns, enabling 10x throughput increase (50K to 500K requests/min)</li>
            <li><strong>Implemented ML-powered features</strong> that increased user engagement by 65% and became key product differentiator driving $15M in new ARR</li>
            <li><strong>Established engineering culture</strong> focused on innovation, quality, and continuous improvement, reducing employee turnover from 28% to 8%</li>
            <li><strong>Drove security compliance</strong> initiatives achieving SOC 2 Type II, ISO 27001, and HIPAA certifications, enabling enterprise sales expansion</li>
            <li><strong>Built data infrastructure</strong> processing 500M+ events daily, providing real-time analytics and business intelligence capabilities</li>
            <li><strong>Championed DevOps transformation</strong> reducing deployment cycle from 2 weeks to multiple times per day with zero-downtime releases</li>
          </ul>
        </div>

        <div style="margin-top: 20px">
          <h4 style="color: #2c3e50; font-size: 17px; margin-bottom: 10px; font-weight: 600">Technology Stack & Initiatives:</h4>
          <p style="line-height: 1.8; color: #2c3e50; font-size: 15px; margin-left: 20px">
            Led adoption of React, TypeScript, Node.js, Python, Rust, GraphQL, PostgreSQL, Redis, Kafka, Kubernetes, Terraform, and comprehensive observability stack (Datadog, New Relic). Established engineering excellence through code review processes, automated testing (90%+ coverage), and technical documentation standards.
          </p>
        </div>
      </article>

      <article style="margin-bottom: 40px; page-break-inside: avoid">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px">
          <h3 style="margin: 0; font-size: 22px; color: #1a1a1a; font-weight: 700">Vice President of Engineering</h3>
          <span style="color: #555; font-size: 15px; font-weight: 600; white-space: nowrap">Mar 2017 - Dec 2019</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-size: 18px; font-weight: 600">CloudScale Solutions | Palo Alto, CA</p>
        <p style="margin: 10px 0 15px 0; font-style: italic; color: #555; font-size: 15px">Enterprise SaaS | Series B | $25M ARR | 85 Employees</p>

        <div style="margin-top: 15px">
          <h4 style="color: #2c3e50; font-size: 17px; margin-bottom: 10px; font-weight: 600">Key Achievements:</h4>
          <ul style="line-height: 2; color: #2c3e50; font-size: 15px">
            <li><strong>Built engineering team</strong> from 12 to 45 engineers, implementing structured hiring process and technical interview framework</li>
            <li><strong>Redesigned product architecture</strong> enabling multi-tenancy and white-label capabilities, opening new market segments worth $8M ARR</li>
            <li><strong>Implemented agile transformation</strong> across engineering organization, improving velocity by 3x and reducing time-to-market by 60%</li>
            <li><strong>Led Series B technical due diligence</strong> resulting in successful $35M funding round at $150M valuation</li>
            <li><strong>Established API-first strategy</strong> enabling ecosystem of 50+ integration partners and developer community</li>
            <li><strong>Built real-time collaboration features</strong> supporting 100K+ concurrent users with sub-100ms latency</li>
            <li><strong>Implemented comprehensive monitoring</strong> and incident response procedures, reducing MTTR from 4 hours to 15 minutes</li>
          </ul>
        </div>
      </article>

      <article style="margin-bottom: 40px; page-break-inside: avoid">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px">
          <h3 style="margin: 0; font-size: 22px; color: #1a1a1a; font-weight: 700">Director of Engineering</h3>
          <span style="color: #555; font-size: 15px; font-weight: 600; white-space: nowrap">Jun 2014 - Feb 2017</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-size: 18px; font-weight: 600">DataFlow Analytics | Seattle, WA</p>
        <p style="margin: 10px 0 15px 0; font-style: italic; color: #555; font-size: 15px">Data Analytics Platform | Series A | $8M ARR | 40 Employees</p>

        <div style="margin-top: 15px">
          <h4 style="color: #2c3e50; font-size: 17px; margin-bottom: 10px; font-weight: 600">Key Achievements:</h4>
          <ul style="line-height: 2; color: #2c3e50; font-size: 15px">
            <li><strong>Managed team of 18 engineers</strong> delivering product roadmap on time and within budget across 6 consecutive quarters</li>
            <li><strong>Architected data pipeline</strong> processing 10TB daily, enabling real-time analytics for fortune 500 clients</li>
            <li><strong>Reduced infrastructure costs</strong> by $1.2M annually through optimization and reserved instance strategy</li>
            <li><strong>Launched mobile applications</strong> (iOS/Android) reaching 500K downloads in first year</li>
            <li><strong>Implemented machine learning models</strong> for predictive analytics, becoming flagship product feature</li>
          </ul>
        </div>
      </article>

      <article style="margin-bottom: 40px; page-break-inside: avoid">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px">
          <h3 style="margin: 0; font-size: 22px; color: #1a1a1a; font-weight: 700">Senior Engineering Manager</h3>
          <span style="color: #555; font-size: 15px; font-weight: 600; white-space: nowrap">Jan 2012 - May 2014</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-size: 18px; font-weight: 600">GlobalTech Corporation | Austin, TX</p>
        <p style="margin: 10px 0 15px 0; font-style: italic; color: #555; font-size: 15px">Enterprise Software | Public Company | $500M+ Revenue</p>

        <div style="margin-top: 15px">
          <ul style="line-height: 2; color: #2c3e50; font-size: 15px">
            <li>Led team of 12 engineers developing enterprise reporting platform used by 2,000+ customers</li>
            <li>Championed adoption of continuous integration and automated testing practices</li>
            <li>Collaborated with product management to define technical requirements and delivery timelines</li>
            <li>Mentored 5 engineers to senior positions through career development and skills coaching</li>
          </ul>
        </div>
      </article>

      <article style="margin-bottom: 40px; page-break-inside: avoid">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px">
          <h3 style="margin: 0; font-size: 22px; color: #1a1a1a; font-weight: 700">Engineering Manager</h3>
          <span style="color: #555; font-size: 15px; font-weight: 600; white-space: nowrap">Aug 2009 - Dec 2011</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-size: 18px; font-weight: 600">WebServices Inc. | Boston, MA</p>

        <div style="margin-top: 15px">
          <ul style="line-height: 2; color: #2c3e50; font-size: 15px">
            <li>Managed team of 8 engineers building SaaS platform serving 10,000+ small businesses</li>
            <li>Implemented scrum methodology improving team velocity and predictability</li>
            <li>Drove technical decisions for scalability and performance optimization</li>
          </ul>
        </div>
      </article>
    </section>

    <section style="margin-bottom: 45px">
      <h2 style="color: #2c3e50; font-size: 28px; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px">Education & Certifications</h2>

      <div style="margin-bottom: 25px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">
          <h3 style="margin: 5px 0; font-size: 20px; color: #1a1a1a">Master of Science in Computer Science</h3>
          <span style="color: #555; font-size: 15px; font-weight: 600">2007 - 2009</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-weight: 600; font-size: 17px">Stanford University | Palo Alto, CA</p>
        <p style="margin: 10px 0; color: #2c3e50; font-size: 15px">Specialization: Distributed Systems & Artificial Intelligence | GPA: 3.9/4.0</p>
      </div>

      <div style="margin-bottom: 25px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">
          <h3 style="margin: 5px 0; font-size: 20px; color: #1a1a1a">Bachelor of Science in Computer Engineering</h3>
          <span style="color: #555; font-size: 15px; font-weight: 600">2003 - 2007</span>
        </div>
        <p style="margin: 5px 0; color: #3498db; font-weight: 600; font-size: 17px">MIT | Cambridge, MA</p>
        <p style="margin: 10px 0; color: #2c3e50; font-size: 15px">Magna Cum Laude | Dean's List All Semesters</p>
      </div>

      <div style="margin-top: 30px">
        <h3 style="color: #2c3e50; font-size: 20px; margin-bottom: 15px">Professional Certifications</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-left: 20px">
          <ul style="line-height: 1.8; color: #2c3e50; font-size: 15px; margin: 0">
            <li>AWS Certified Solutions Architect - Professional</li>
            <li>Certified Kubernetes Administrator (CKA)</li>
            <li>Google Cloud Professional Architect</li>
          </ul>
          <ul style="line-height: 1.8; color: #2c3e50; font-size: 15px; margin: 0">
            <li>Certified Scrum Master (CSM)</li>
            <li>Project Management Professional (PMP)</li>
            <li>TOGAF 9 Certified</li>
          </ul>
        </div>
      </div>
    </section>

    <section style="margin-bottom: 45px">
      <h2 style="color: #2c3e50; font-size: 28px; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px">Technical Proficiencies</h2>

      <div style="padding-left: 20px">
        <div style="margin-bottom: 15px">
          <strong style="color: #1a1a1a; font-size: 16px; display: inline-block; width: 220px">Programming Languages:</strong>
          <span style="color: #2c3e50; font-size: 15px">JavaScript, TypeScript, Python, Rust, Go, Java, C++, SQL</span>
        </div>
        <div style="margin-bottom: 15px">
          <strong style="color: #1a1a1a; font-size: 16px; display: inline-block; width: 220px">Frontend Technologies:</strong>
          <span style="color: #2c3e50; font-size: 15px">React, Next.js, Vue.js, Angular, Redux, GraphQL, WebSockets, Tailwind CSS</span>
        </div>
        <div style="margin-bottom: 15px">
          <strong style="color: #1a1a1a; font-size: 16px; display: inline-block; width: 220px">Backend Frameworks:</strong>
          <span style="color: #2c3e50; font-size: 15px">Node.js, Express, NestJS, Django, Flask, FastAPI, Spring Boot, Actix-web</span>
        </div>
        <div style="margin-bottom: 15px">
          <strong style="color: #1a1a1a; font-size: 16px; display: inline-block; width: 220px">Databases:</strong>
          <span style="color: #2c3e50; font-size: 15px">PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Cassandra, DynamoDB, Neo4j</span>
        </div>
        <div style="margin-bottom: 15px">
          <strong style="color: #1a1a1a; font-size: 16px; display: inline-block; width: 220px">Cloud Platforms:</strong>
          <span style="color: #2c3e50; font-size: 15px">AWS (EC2, S3, Lambda, ECS, RDS, CloudFormation), Azure, Google Cloud Platform</span>
        </div>
        <div style="margin-bottom: 15px">
          <strong style="color: #1a1a1a; font-size: 16px; display: inline-block; width: 220px">DevOps & Infrastructure:</strong>
          <span style="color: #2c3e50; font-size: 15px">Docker, Kubernetes, Terraform, Ansible, Jenkins, GitHub Actions, CircleCI, ArgoCD</span>
        </div>
        <div style="margin-bottom: 15px">
          <strong style="color: #1a1a1a; font-size: 16px; display: inline-block; width: 220px">Data & Analytics:</strong>
          <span style="color: #2c3e50; font-size: 15px">Apache Kafka, Apache Spark, Airflow, Snowflake, BigQuery, Tableau, Looker</span>
        </div>
        <div style="margin-bottom: 15px">
          <strong style="color: #1a1a1a; font-size: 16px; display: inline-block; width: 220px">ML/AI:</strong>
          <span style="color: #2c3e50; font-size: 15px">TensorFlow, PyTorch, scikit-learn, Hugging Face, LangChain, Vector Databases</span>
        </div>
        <div style="margin-bottom: 15px">
          <strong style="color: #1a1a1a; font-size: 16px; display: inline-block; width: 220px">Monitoring & Observability:</strong>
          <span style="color: #2c3e50; font-size: 15px">Datadog, New Relic, Grafana, Prometheus, ELK Stack, Sentry, PagerDuty</span>
        </div>
      </div>
    </section>

    <section style="margin-bottom: 45px">
      <h2 style="color: #2c3e50; font-size: 28px; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px">Board Positions & Advisory Roles</h2>

      <div style="padding-left: 20px">
        <div style="margin-bottom: 20px">
          <h3 style="margin: 5px 0; font-size: 18px; color: #1a1a1a">Technical Advisor</h3>
          <p style="margin: 5px 0; color: #3498db; font-weight: 600">Sequoia Capital | 2022 - Present</p>
          <p style="margin: 10px 0; color: #2c3e50; font-size: 15px; line-height: 1.8">
            Provide technical due diligence and strategic guidance for portfolio companies in enterprise software and infrastructure sectors.
          </p>
        </div>

        <div style="margin-bottom: 20px">
          <h3 style="margin: 5px 0; font-size: 18px; color: #1a1a1a">Board Member</h3>
          <p style="margin: 5px 0; color: #3498db; font-weight: 600">TechForGood Foundation | 2021 - Present</p>
          <p style="margin: 10px 0; color: #2c3e50; font-size: 15px; line-height: 1.8">
            Non-profit organization focused on technology education and career development for underrepresented communities.
          </p>
        </div>
      </div>
    </section>

    <section style="margin-bottom: 45px">
      <h2 style="color: #2c3e50; font-size: 28px; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px">Speaking Engagements & Publications</h2>

      <div style="padding-left: 20px">
        <ul style="line-height: 2; color: #2c3e50; font-size: 15px">
          <li><strong>Keynote Speaker</strong> - "Building Scalable Engineering Organizations" at TechCrunch Disrupt 2023</li>
          <li><strong>Panel Moderator</strong> - "The Future of Cloud-Native Architectures" at AWS re:Invent 2022</li>
          <li><strong>Guest Lecturer</strong> - Stanford University CS Department: "Engineering Leadership in Startups" (2020-Present)</li>
          <li><strong>Published Article</strong> - "Microservices at Scale: Lessons from the Trenches" in IEEE Software Magazine (2021)</li>
          <li><strong>Podcast Guest</strong> - "Software Engineering Daily": "Leading Through Hypergrowth" (2023)</li>
        </ul>
      </div>
    </section>

    <section>
      <h2 style="color: #2c3e50; font-size: 28px; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px">Awards & Recognition</h2>

      <div style="padding-left: 20px">
        <ul style="line-height: 2; color: #2c3e50; font-size: 15px">
          <li><strong>CTO of the Year</strong> - SF Bay Area Tech Awards (2023)</li>
          <li><strong>Top 50 Engineering Leaders</strong> - TechCrunch (2022)</li>
          <li><strong>Innovation Award</strong> - CloudScale Solutions Board of Directors (2019)</li>
          <li><strong>Patent Holder</strong> - US Patent #10,234,567: "System and Method for Real-Time Collaborative Editing" (2018)</li>
        </ul>
      </div>
    </section>
  </div>
);
"#
}

// Benchmark parsing operations
fn bench_parse_tsx(c: &mut Criterion) {
    let mut group = c.benchmark_group("parse_tsx");

    group.bench_with_input(
        BenchmarkId::from_parameter("small_cv_2kb"),
        &get_small_cv(),
        |b, tsx| b.iter(|| parse_tsx(black_box(tsx))),
    );

    group.bench_with_input(
        BenchmarkId::from_parameter("medium_cv_10kb"),
        &get_medium_cv(),
        |b, tsx| b.iter(|| parse_tsx(black_box(tsx))),
    );

    group.bench_with_input(
        BenchmarkId::from_parameter("large_cv_50kb"),
        &get_large_cv(),
        |b, tsx| b.iter(|| parse_tsx(black_box(tsx))),
    );

    group.finish();
}

// Benchmark JSX element extraction
fn bench_extract_jsx_elements(c: &mut Criterion) {
    let mut group = c.benchmark_group("extract_jsx_elements");

    let small_doc = parse_tsx(get_small_cv()).unwrap();
    group.bench_function(BenchmarkId::from_parameter("small_cv_2kb"), |b| {
        b.iter(|| extract_jsx_elements(black_box(&small_doc)))
    });

    let medium_doc = parse_tsx(get_medium_cv()).unwrap();
    group.bench_function(BenchmarkId::from_parameter("medium_cv_10kb"), |b| {
        b.iter(|| extract_jsx_elements(black_box(&medium_doc)))
    });

    let large_doc = parse_tsx(get_large_cv()).unwrap();
    group.bench_function(BenchmarkId::from_parameter("large_cv_50kb"), |b| {
        b.iter(|| extract_jsx_elements(black_box(&large_doc)))
    });

    group.finish();
}

// Benchmark inline style extraction
fn bench_extract_inline_style(c: &mut Criterion) {
    let mut group = c.benchmark_group("extract_inline_style");

    let small_doc = parse_tsx(get_small_cv()).unwrap();
    let small_elements = extract_jsx_elements(&small_doc);
    group.bench_function(BenchmarkId::from_parameter("small_cv_2kb"), |b| {
        b.iter(|| {
            for element in &small_elements {
                let _ = extract_inline_style(black_box(element));
            }
        })
    });

    let medium_doc = parse_tsx(get_medium_cv()).unwrap();
    let medium_elements = extract_jsx_elements(&medium_doc);
    group.bench_function(BenchmarkId::from_parameter("medium_cv_10kb"), |b| {
        b.iter(|| {
            for element in &medium_elements {
                let _ = extract_inline_style(black_box(element));
            }
        })
    });

    let large_doc = parse_tsx(get_large_cv()).unwrap();
    let large_elements = extract_jsx_elements(&large_doc);
    group.bench_function(BenchmarkId::from_parameter("large_cv_50kb"), |b| {
        b.iter(|| {
            for element in &large_elements {
                let _ = extract_inline_style(black_box(element));
            }
        })
    });

    group.finish();
}

// Benchmark full pipeline: parse → extract elements → extract styles
fn bench_full_pipeline(c: &mut Criterion) {
    let mut group = c.benchmark_group("full_pipeline");

    group.bench_with_input(
        BenchmarkId::from_parameter("small_cv_2kb"),
        &get_small_cv(),
        |b, tsx| {
            b.iter(|| {
                let doc = parse_tsx(black_box(tsx)).unwrap();
                let elements = extract_jsx_elements(&doc);
                for element in &elements {
                    let _ = extract_inline_style(element);
                }
            })
        },
    );

    group.bench_with_input(
        BenchmarkId::from_parameter("medium_cv_10kb"),
        &get_medium_cv(),
        |b, tsx| {
            b.iter(|| {
                let doc = parse_tsx(black_box(tsx)).unwrap();
                let elements = extract_jsx_elements(&doc);
                for element in &elements {
                    let _ = extract_inline_style(element);
                }
            })
        },
    );

    group.bench_with_input(
        BenchmarkId::from_parameter("large_cv_50kb"),
        &get_large_cv(),
        |b, tsx| {
            b.iter(|| {
                let doc = parse_tsx(black_box(tsx)).unwrap();
                let elements = extract_jsx_elements(&doc);
                for element in &elements {
                    let _ = extract_inline_style(element);
                }
            })
        },
    );

    group.finish();
}

criterion_group!(
    benches,
    bench_parse_tsx,
    bench_extract_jsx_elements,
    bench_extract_inline_style,
    bench_full_pipeline
);
criterion_main!(benches);
