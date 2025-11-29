# ATS Compatibility Test Report

**Date:** {{DATE}}  
**Test Suite:** ATS Compliance Enhancement  
**CV Templates Tested:** 5  
**Parsers Tested:** {{PARSER_COUNT}}  

---

## Executive Summary

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Overall Extraction Accuracy | {{OVERALL_ACCURACY}}% | 90%+ | {{OVERALL_STATUS}} |
| Workday Accuracy (AC12) | {{WORKDAY_ACCURACY}}% | 90%+ | {{WORKDAY_STATUS}} |
| Greenhouse Accuracy (AC13) | {{GREENHOUSE_ACCURACY}}% | 90%+ | {{GREENHOUSE_STATUS}} |
| PDF/A-1b Compliance (AC14) | {{PDFA_COMPLIANCE}}% | 100% | {{PDFA_STATUS}} |
| Templates Tested (AC15) | 5/5 | 5/5 | ✅ PASS |

**Overall Status:** {{FINAL_STATUS}}

---

## Extraction Accuracy by Template

| Template | Workday | Greenhouse | PDF/A | Overall | Status |
|----------|---------|------------|-------|---------|--------|
| Single-column Traditional | {{T1_WORKDAY}}% | {{T1_GREENHOUSE}}% | {{T1_PDFA}} | {{T1_AVG}}% | {{T1_STATUS}} |
| Two-column Modern | {{T2_WORKDAY}}% | {{T2_GREENHOUSE}}% | {{T2_PDFA}} | {{T2_AVG}}% | {{T2_STATUS}} |
| Minimal Simple | {{T3_WORKDAY}}% | {{T3_GREENHOUSE}}% | {{T3_PDFA}} | {{T3_AVG}}% | {{T3_STATUS}} |
| Technical Developer | {{T4_WORKDAY}}% | {{T4_GREENHOUSE}}% | {{T4_PDFA}} | {{T4_AVG}}% | {{T4_STATUS}} |
| Two-page Traditional | {{T5_WORKDAY}}% | {{T5_GREENHOUSE}}% | {{T5_PDFA}} | {{T5_AVG}}% | {{T5_STATUS}} |

---

## Field Extraction Success Rates

| Field | Success Rate | Notes |
|-------|--------------|-------|
| Name | {{NAME_RATE}}% ({{NAME_COUNT}}/{{TOTAL_TESTS}}) | {{NAME_NOTES}} |
| Email | {{EMAIL_RATE}}% ({{EMAIL_COUNT}}/{{TOTAL_TESTS}}) | {{EMAIL_NOTES}} |
| Phone | {{PHONE_RATE}}% ({{PHONE_COUNT}}/{{TOTAL_TESTS}}) | {{PHONE_NOTES}} |
| Job Titles | {{TITLE_RATE}}% ({{TITLE_COUNT}}/{{TOTAL_TESTS}}) | {{TITLE_NOTES}} |
| Companies | {{COMPANY_RATE}}% ({{COMPANY_COUNT}}/{{TOTAL_TESTS}}) | {{COMPANY_NOTES}} |
| Education | {{EDU_RATE}}% ({{EDU_COUNT}}/{{TOTAL_TESTS}}) | {{EDU_NOTES}} |
| Skills | {{SKILLS_RATE}}% ({{SKILLS_COUNT}}/{{TOTAL_TESTS}}) | {{SKILLS_NOTES}} |

---

## PDF/A-1b Compliance Details

**Compliant PDFs:** {{PDFA_COMPLIANT_COUNT}}/5  
**Total Errors:** {{PDFA_ERROR_COUNT}}  
**Total Warnings:** {{PDFA_WARNING_COUNT}}  

### Compliance by Template

{{PDFA_DETAILS}}

### PDF/A-1b Requirements Validated

- {{FONT_EMBEDDING}} All fonts embedded (no subsetting issues)
- {{NO_ENCRYPTION}} No encryption or passwords
- {{NO_JAVASCRIPT}} No JavaScript or executable content
- {{METADATA}} Valid XMP metadata
- {{COLOR_SPACE}} Color space compliance (RGB/CMYK)
- {{NO_EXTERNAL}} No external dependencies

---

## Known Issues & Recommendations

{{ISSUES_SECTION}}

### Issue 1: {{ISSUE_1_TITLE}}
**Cause:** {{ISSUE_1_CAUSE}}  
**Recommendation:** {{ISSUE_1_RECOMMENDATION}}

### Issue 2: {{ISSUE_2_TITLE}}
**Cause:** {{ISSUE_2_CAUSE}}  
**Recommendation:** {{ISSUE_2_RECOMMENDATION}}

---

## Test Environment

- **Parser:** Affinda API (Workday/Greenhouse proxy)
- **PDF/A Validator:** VeraPDF CLI
- **Test Framework:** Playwright
- **Node Version:** {{NODE_VERSION}}
- **OS:** {{OS_INFO}}

---

## Conclusion

{{CONCLUSION}}

**Recommended Actions:**
{{ACTIONS}}

---

## Sign-Off

**Product Owner:** _________________ Date: _______  
**QA Lead:** _________________ Date: _______  
**Tech Lead:** _________________ Date: _______  

---

**Report Generated:** {{TIMESTAMP}}  
**Report Path:** `packages/extension/tests/ats/reports/ats-compatibility-report.md`
