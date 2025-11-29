/**
 * Test Fixture: Multi-Page Executive CV
 *
 * Description: Comprehensive executive CV with extensive career history and achievements
 * Layout Type: single-column
 * Estimated Pages: 4 (actual pages generated with current layout algorithm)
 * Font Complexity: Simple (1-2 fonts)
 * Special Features: Tests multi-page pagination length, performance at scale
 * Test Objectives:
 *   - Verify content flows correctly across multiple pages (generates 4 pages: 163 boxes)
 *   - Test performance target: <15s on high-end devices, <25s on low-end
 *   - Ensure all pagination logic handles extended CV length
 * Note: Despite filename, generates 4 pages with current layout (163 boxes → 39/37/56/31 per page)
 */

export default function SixPageExecutiveCV() {
  return (
    <div style={{ fontFamily: 'Georgia', fontSize: '11px', padding: '36px', maxWidth: '612px', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a' }}>
          Patricia Williams
        </h1>
        <div style={{ fontSize: '12px', color: '#333333', marginBottom: '6px', fontWeight: 'bold' }}>
          Chief Technology Officer | Technology Executive | Digital Transformation Leader
        </div>
        <div style={{ fontSize: '10px', color: '#666666', lineHeight: '1.4' }}>
          New York, NY • patricia.williams@email.com • +1 (212) 555-0199
        </div>
        <div style={{ fontSize: '10px', color: '#666666' }}>
          linkedin.com/in/patriciawilliams • github.com/pwilliams
        </div>
      </div>

      {/* Executive Summary */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          EXECUTIVE SUMMARY
        </h2>
        <p style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333' }}>
          Visionary technology executive with 20+ years of progressive leadership experience driving digital transformation,
          scaling engineering organizations, and delivering innovative technology solutions that generate measurable business impact.
          Proven track record of building high-performing teams of 500+ engineers, architecting enterprise-scale platforms serving
          100M+ users, and leading companies through successful IPOs and acquisitions valued at $500M+. Expertise spans cloud
          infrastructure, AI/ML systems, cybersecurity, and agile transformation. Board member and advisor to Fortune 500 companies
          and venture-backed startups.
        </p>
      </div>

      {/* Core Competencies */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          CORE COMPETENCIES
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', color: '#333333' }}>
          <div>• Technology Strategy & Roadmapping</div>
          <div>• Digital Transformation Leadership</div>
          <div>• Engineering Team Building & Scaling</div>
          <div>• Cloud Architecture (AWS, Azure, GCP)</div>
          <div>• AI/ML & Data Science Platforms</div>
          <div>• Cybersecurity & Risk Management</div>
          <div>• Agile & DevOps Transformation</div>
          <div>• M&A Technology Due Diligence</div>
          <div>• Product Development Lifecycle</div>
          <div>• P&L Management ($100M+ Budgets)</div>
          <div>• Board & C-Suite Communication</div>
          <div>• Vendor & Partner Negotiations</div>
        </div>
      </div>

      {/* Professional Experience */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          PROFESSIONAL EXPERIENCE
        </h2>

        {/* Position 1 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a' }}>Chief Technology Officer</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2020 - Present</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '2px' }}>
            GlobalTech Corporation (NYSE: GTECH) • New York, NY
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px' }}>
            Fortune 500 fintech company with $5B+ annual revenue and 10,000+ employees globally
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>
              Lead global technology organization of 500+ engineers across 15 countries, managing $150M annual technology budget
            </li>
            <li style={{ marginBottom: '4px' }}>
              Architected and delivered cloud-native platform migration from legacy on-premise infrastructure to AWS, reducing infrastructure
              costs by 40% ($25M annually) while improving system reliability to 99.99% uptime
            </li>
            <li style={{ marginBottom: '4px' }}>
              Spearheaded AI/ML initiative implementing predictive analytics and fraud detection systems that prevented $100M+ in fraudulent
              transactions and improved customer experience scores by 35 points
            </li>
            <li style={{ marginBottom: '4px' }}>
              Drove digital transformation roadmap resulting in 3x increase in mobile transaction volume (50M to 150M monthly) and
              45% improvement in API response times
            </li>
            <li style={{ marginBottom: '4px' }}>
              Established company-wide DevOps practices and CI/CD pipelines, accelerating deployment frequency from monthly to daily
              releases while reducing production incidents by 60%
            </li>
            <li style={{ marginBottom: '4px' }}>
              Led security transformation initiative achieving SOC 2 Type II, ISO 27001, and PCI DSS Level 1 certifications,
              strengthening enterprise security posture and enabling $500M in new enterprise contracts
            </li>
            <li style={{ marginBottom: '4px' }}>
              Built strategic partnerships with AWS, Microsoft, and Google, securing $10M in technology credits and co-innovation opportunities
            </li>
            <li style={{ marginBottom: '4px' }}>
              Mentored C-suite executives on technology strategy and served as key technical advisor during board meetings and
              investor presentations
            </li>
          </ul>
        </div>

        {/* Position 2 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a' }}>Senior Vice President of Engineering</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2017 - 2020</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '2px' }}>
            DataStream Technologies • San Francisco, CA
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px' }}>
            Series D SaaS company providing enterprise data analytics platform, successfully acquired by Oracle for $800M (2020)
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>
              Scaled engineering organization from 80 to 300 engineers during hypergrowth phase, establishing scalable hiring processes,
              technical career ladders, and performance management frameworks
            </li>
            <li style={{ marginBottom: '4px' }}>
              Architected next-generation real-time analytics platform processing 10TB+ daily data volumes with sub-second query latency,
              becoming competitive differentiator cited by 85% of enterprise customers
            </li>
            <li style={{ marginBottom: '4px' }}>
              Led company through successful SOC 2 audit and GDPR compliance initiatives, enabling expansion into European market
              generating $50M ARR within 18 months
            </li>
            <li style={{ marginBottom: '4px' }}>
              Implemented engineering excellence program including automated testing, code review standards, and technical debt reduction,
              improving code quality metrics by 70% and reducing production bugs by 55%
            </li>
            <li style={{ marginBottom: '4px' }}>
              Directed technical due diligence during acquisition process, coordinating with Oracle integration teams and ensuring
              smooth technology transition post-acquisition
            </li>
            <li style={{ marginBottom: '4px' }}>
              Drove platform reliability improvements achieving 99.95% uptime SLA, reducing customer churn by 25% and
              increasing NPS scores from 42 to 68
            </li>
            <li style={{ marginBottom: '4px' }}>
              Built data science team of 25 engineers developing machine learning models for predictive analytics features that
              increased average contract value by 40%
            </li>
          </ul>
        </div>

        {/* Position 3 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a' }}>Vice President of Platform Engineering</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2014 - 2017</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '2px' }}>
            CloudScale Systems • Seattle, WA
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px' }}>
            Enterprise cloud infrastructure company serving 5,000+ customers across healthcare, finance, and retail sectors
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>
              Led platform engineering team of 120 engineers responsible for core infrastructure serving 100M+ API calls daily
              across multi-tenant SaaS architecture
            </li>
            <li style={{ marginBottom: '4px' }}>
              Designed and implemented microservices architecture using Kubernetes and Docker, improving deployment flexibility
              and enabling 10x faster feature releases
            </li>
            <li style={{ marginBottom: '4px' }}>
              Established site reliability engineering (SRE) practice with on-call rotation, incident management processes, and
              blameless post-mortems, reducing MTTR from 4 hours to 30 minutes
            </li>
            <li style={{ marginBottom: '4px' }}>
              Drove cost optimization initiatives through auto-scaling, reserved instances, and resource right-sizing,
              achieving 35% reduction in cloud infrastructure spend ($8M annual savings)
            </li>
            <li style={{ marginBottom: '4px' }}>
              Led technical evaluation and migration to Kafka-based event streaming architecture, enabling real-time data
              processing capabilities that unlocked $20M in new product revenue
            </li>
            <li style={{ marginBottom: '4px' }}>
              Implemented comprehensive observability stack (Datadog, Grafana, PagerDuty) providing real-time insights into
              system performance and proactive issue detection
            </li>
            <li style={{ marginBottom: '4px' }}>
              Championed engineering culture initiatives including quarterly hackathons, tech talks, and 20% innovation time,
              improving employee engagement scores by 40% and reducing attrition to 8%
            </li>
          </ul>
        </div>

        {/* Position 4 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a' }}>Director of Engineering</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2011 - 2014</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '2px' }}>
            InnovateTech Solutions • Boston, MA
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '6px' }}>
            B2B software company providing CRM and marketing automation platforms to mid-market enterprises
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>
              Managed engineering team of 45 developers building cloud-based CRM platform processing 50M+ customer interactions monthly
            </li>
            <li style={{ marginBottom: '4px' }}>
              Architected RESTful API platform enabling third-party integrations, leading to ecosystem of 200+ partner applications
              and 30% increase in customer retention
            </li>
            <li style={{ marginBottom: '4px' }}>
              Led agile transformation from waterfall to scrum methodology, implementing two-week sprints, sprint planning, and
              retrospectives that improved delivery predictability by 60%
            </li>
            <li style={{ marginBottom: '4px' }}>
              Established technical interview process and university recruiting pipeline, successfully hiring 30+ engineers
              while maintaining hiring bar and improving diversity metrics by 25%
            </li>
            <li style={{ marginBottom: '4px' }}>
              Collaborated with product management on multi-year roadmap planning, balancing feature development with
              technical infrastructure investments
            </li>
            <li style={{ marginBottom: '4px' }}>
              Implemented automated testing framework reducing QA cycle time from 2 weeks to 3 days and improving
              release quality by 45%
            </li>
          </ul>
        </div>

        {/* Position 5 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a' }}>Engineering Manager</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2008 - 2011</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '2px' }}>
            TechCorp Industries • Austin, TX
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>
              Led cross-functional team of 15 engineers developing e-commerce platform generating $100M+ annual revenue
            </li>
            <li style={{ marginBottom: '4px' }}>
              Migrated legacy monolithic application to service-oriented architecture, improving system scalability by 5x
              and reducing deployment risks
            </li>
            <li style={{ marginBottom: '4px' }}>
              Implemented continuous integration practices using Jenkins and automated deployment pipelines, reducing
              production deployment time from 8 hours to 1 hour
            </li>
            <li style={{ marginBottom: '4px' }}>
              Mentored senior engineers on technical leadership, architecture design, and code review practices
            </li>
            <li style={{ marginBottom: '4px' }}>
              Collaborated with product team to define technical requirements and estimate project timelines
            </li>
          </ul>
        </div>

        {/* Position 6 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a' }}>Senior Software Engineer</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2005 - 2008</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '2px' }}>
            Digital Media Corp • San Diego, CA
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>
              Developed high-traffic web applications using Java, Spring, and MySQL serving 10M+ monthly users
            </li>
            <li style={{ marginBottom: '4px' }}>
              Optimized database queries and implemented caching strategies improving page load times by 60%
            </li>
            <li style={{ marginBottom: '4px' }}>
              Led technical design reviews and code quality initiatives establishing engineering best practices
            </li>
            <li style={{ marginBottom: '4px' }}>
              Participated in on-call rotation providing 24/7 production support and incident resolution
            </li>
          </ul>
        </div>

        {/* Position 7 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a' }}>Software Engineer</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2003 - 2005</span>
          </div>
          <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#333333', marginBottom: '2px' }}>
            StartupLabs Inc • Palo Alto, CA
          </div>
          <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
            <li style={{ marginBottom: '4px' }}>
              Built web applications using PHP, JavaScript, and PostgreSQL in fast-paced startup environment
            </li>
            <li style={{ marginBottom: '4px' }}>
              Contributed to full software development lifecycle from requirements gathering to production deployment
            </li>
            <li style={{ marginBottom: '4px' }}>
              Collaborated with designers and product managers to implement user-facing features
            </li>
          </ul>
        </div>
      </div>

      {/* Board & Advisory Roles */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          BOARD & ADVISORY ROLES
        </h2>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a1a1a' }}>
            Board of Directors, TechVentures Inc.
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px' }}>
            2022 - Present
          </div>
          <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333' }}>
            Serve on board of Series B SaaS company providing technology governance oversight and strategic guidance
            on product roadmap and go-to-market strategy
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a1a1a' }}>
            Technology Advisory Board, Fortune 100 Retail Company
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px' }}>
            2021 - Present
          </div>
          <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333' }}>
            Advise C-suite on digital transformation initiatives, cloud strategy, and technology vendor selection
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a1a1a' }}>
            Venture Partner, Innovation Capital Partners
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginBottom: '4px' }}>
            2020 - Present
          </div>
          <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333' }}>
            Evaluate technology investments, conduct technical due diligence, and mentor portfolio company CTOs
          </div>
        </div>
      </div>

      {/* Education */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          EDUCATION
        </h2>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a1a1a' }}>Executive MBA</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2013</span>
          </div>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            Harvard Business School, Boston, MA
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px' }}>
            Focus: Technology Strategy & Innovation Management
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a1a1a' }}>Master of Science in Computer Science</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2003</span>
          </div>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            Stanford University, Stanford, CA
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px' }}>
            Specialization: Distributed Systems & Databases
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a1a1a' }}>Bachelor of Science in Computer Engineering</span>
            <span style={{ fontSize: '10px', color: '#666666' }}>2001</span>
          </div>
          <div style={{ fontSize: '11px', color: '#333333' }}>
            Massachusetts Institute of Technology, Cambridge, MA
          </div>
          <div style={{ fontSize: '10px', color: '#666666', marginTop: '2px' }}>
            Magna Cum Laude • GPA: 3.9/4.0
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          CERTIFICATIONS
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: '#333333' }}>
          <div>• AWS Certified Solutions Architect Professional</div>
          <div>• Certified Information Security Manager (CISM)</div>
          <div>• Project Management Professional (PMP)</div>
          <div>• Certified Scrum Master (CSM)</div>
          <div>• Google Cloud Professional Architect</div>
          <div>• TOGAF 9 Certified Enterprise Architect</div>
        </div>
      </div>

      {/* Speaking Engagements */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          SPEAKING ENGAGEMENTS & PUBLICATIONS
        </h2>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px', fontWeight: 'bold' }}>
          Conference Keynotes:
        </div>
        <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0', marginBottom: '8px' }}>
          <li style={{ marginBottom: '3px' }}>
            "Leading Digital Transformation at Scale" - Technology Leadership Summit 2024
          </li>
          <li style={{ marginBottom: '3px' }}>
            "Building AI-First Organizations" - AI Conference 2023
          </li>
          <li style={{ marginBottom: '3px' }}>
            "Cloud Architecture Best Practices" - AWS re:Invent 2022
          </li>
          <li style={{ marginBottom: '3px' }}>
            "Scaling Engineering Teams Through Hypergrowth" - SaaStr Annual 2021
          </li>
        </ul>
        <div style={{ fontSize: '11px', color: '#333333', marginBottom: '4px', fontWeight: 'bold' }}>
          Publications:
        </div>
        <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '3px' }}>
            "The CTO's Guide to Cloud Migration Strategy" - Harvard Business Review, 2023
          </li>
          <li style={{ marginBottom: '3px' }}>
            "Building High-Performance Engineering Cultures" - Tech Leadership Journal, 2022
          </li>
          <li style={{ marginBottom: '3px' }}>
            "Security in the Age of AI" - IEEE Computer Society, 2021
          </li>
        </ul>
      </div>

      {/* Awards & Recognition */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          AWARDS & RECOGNITION
        </h2>
        <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '3px' }}>
            Top 50 Women in Tech - Forbes (2024)
          </li>
          <li style={{ marginBottom: '3px' }}>
            CTO of the Year - Tech Excellence Awards (2023)
          </li>
          <li style={{ marginBottom: '3px' }}>
            Most Influential Women in Technology - Fast Company (2022)
          </li>
          <li style={{ marginBottom: '3px' }}>
            Innovation Leadership Award - Technology Council (2021)
          </li>
          <li style={{ marginBottom: '3px' }}>
            40 Under 40 Technology Leaders - Business Insider (2018)
          </li>
        </ul>
      </div>

      {/* Professional Affiliations */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          PROFESSIONAL AFFILIATIONS
        </h2>
        <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '3px' }}>
            Member, Forbes Technology Council (2020-Present)
          </li>
          <li style={{ marginBottom: '3px' }}>
            Advisory Board Member, Women in Technology International (2019-Present)
          </li>
          <li style={{ marginBottom: '3px' }}>
            Member, Association for Computing Machinery (ACM)
          </li>
          <li style={{ marginBottom: '3px' }}>
            Member, Institute of Electrical and Electronics Engineers (IEEE)
          </li>
          <li style={{ marginBottom: '3px' }}>
            Member, Chief Technology Officers Association (CTOA)
          </li>
        </ul>
      </div>

      {/* Technical Expertise */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          TECHNICAL EXPERTISE
        </h2>
        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginBottom: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>Cloud Platforms:</span> AWS (EC2, S3, Lambda, RDS, ECS, EKS), Azure, Google Cloud Platform,
          Kubernetes, Docker, Terraform, CloudFormation
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginBottom: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>Programming & Frameworks:</span> Java, Python, JavaScript/TypeScript, Go, Node.js, React,
          Spring Boot, Django, Flask
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginBottom: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>Data & Analytics:</span> PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Kafka, Spark,
          Hadoop, Snowflake, Databricks
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginBottom: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>AI/ML:</span> TensorFlow, PyTorch, Scikit-learn, NLP, Computer Vision, Recommendation Systems,
          MLOps, Model Deployment
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginBottom: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>DevOps & SRE:</span> Jenkins, GitLab CI, CircleCI, Datadog, Grafana, Prometheus, PagerDuty,
          New Relic, Splunk
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginBottom: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>Security:</span> OAuth 2.0, SAML, Encryption, Penetration Testing, Vulnerability Management,
          SOC 2, ISO 27001, GDPR, CCPA
        </div>
        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333' }}>
          <span style={{ fontWeight: 'bold' }}>Methodologies:</span> Agile/Scrum, Kanban, SAFe, Lean, Design Thinking, Six Sigma
        </div>
      </div>

      {/* Patents */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          PATENTS
        </h2>
        <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '3px' }}>
            US Patent 10,234,567: "System and Method for Distributed Data Processing in Cloud Environments" (2021)
          </li>
          <li style={{ marginBottom: '3px' }}>
            US Patent 9,876,543: "Machine Learning-Based Fraud Detection System" (2019)
          </li>
          <li style={{ marginBottom: '3px' }}>
            US Patent 9,345,678: "Real-Time Analytics Processing Architecture" (2018)
          </li>
        </ul>
      </div>

      {/* Community Involvement */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          COMMUNITY INVOLVEMENT
        </h2>
        <ul style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333', marginLeft: '20px', paddingLeft: '0' }}>
          <li style={{ marginBottom: '3px' }}>
            Mentor, TechWomen Leadership Program - Supporting emerging women technology leaders (2018-Present)
          </li>
          <li style={{ marginBottom: '3px' }}>
            Board Member, Code for Good - Non-profit teaching coding to underserved youth (2016-Present)
          </li>
          <li style={{ marginBottom: '3px' }}>
            Judge, MIT Startup Competition - Evaluating student technology ventures (2019-Present)
          </li>
          <li style={{ marginBottom: '3px' }}>
            Guest Lecturer, Stanford Graduate School of Business - Technology Strategy course (2020-Present)
          </li>
        </ul>
      </div>

      {/* Languages */}
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1a', borderBottom: '2px solid #1a1a1a', paddingBottom: '4px' }}>
          LANGUAGES
        </h2>
        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333333' }}>
          English (Native), Spanish (Professional Working Proficiency), Mandarin Chinese (Conversational)
        </div>
      </div>
    </div>
  );
}
