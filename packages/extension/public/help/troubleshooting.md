# Troubleshooting Guide

Common problems and how to fix them.

---

## Can't Find CV on Page

**Problem:** Extension says "No CV detected" even though Claude generated one.

**Solutions:**
- Make sure you're on a Claude.ai conversation where you asked for a CV
- Scroll to where Claude displayed the CV code (it should be in a code block)
- Refresh the page and try again
- Ask Claude to regenerate the CV if it's not visible

---

## Syntax Error in CV Code

**Problem:** Error says "We couldn't read your CV code" or mentions a syntax error.

**What this means:** The CV code has a formatting issue (missing tag, typo, etc.)

**Solutions:**
- Check the line number shown in the error - that's where the problem is
- Look for missing closing tags (e.g., missing `</Experience>`)
- Ask Claude to regenerate your CV - this usually fixes it
- Copy the code again from Claude carefully
- If the error persists, contact support with the error details

---

## Converter Won't Start

**Problem:** Error says "The converter couldn't start" or mentions loading issues.

**What this means:** The PDF converter is having trouble initializing.

**Solutions:**
1. Wait a few seconds and click "Try Again"
2. Refresh the page
3. Check your internet connection
4. Restart your browser
5. If using incognito/private mode, try in regular mode
6. Update your browser to the latest version

**Technical note:** This happens when WebAssembly (the technology we use for PDF generation) can't load properly.

---

## CV Too Large

**Problem:** Error says "Your CV is too large to process."

**What this means:** Your CV exceeds our size limits (usually 10 pages or 10 MB).

**Why we have limits:** Processing very large CVs can freeze your browser. We limit size to keep things fast and reliable.

**Solutions:**
- Remove some sections to reduce length
- Split your CV into multiple documents:
  - Main CV (1-2 pages)
  - Extended CV with publications/projects
  - Portfolio or additional materials
- Remove or compress images if you have any
- Simplify complex formatting
- Use a smaller font size in Settings

**Tip:** Most recruiters prefer 1-2 page CVs anyway!

---

## Conversion Taking Too Long

**Problem:** Error says "Conversion is taking longer than expected."

**What this means:** Your CV is very detailed and processing is slow.

**Solutions:**
- Remove some sections or reduce detail
- Simplify complex formatting
- Remove images or graphics
- Wait a moment and try again
- Close other browser tabs to free up resources
- Split very long CVs into multiple documents

**What's "too long"?** We timeout after 30 seconds to prevent freezing. Most CVs convert in under 10 seconds.

---

## Content Doesn't Fit on Page

**Problem:** Error says "We couldn't fit your content on the page."

**What this means:** Some content is too wide or too tall for the selected page size.

**Solutions:**
- Increase page margins in Settings
- Use a larger page size (Letter instead of A4)
- Reduce font size in Settings
- Simplify complex formatting
- Break long text into smaller paragraphs
- Remove very wide tables or content

---

## Extension Needs Permission

**Problem:** Error says "Extension needs page access."

**What this means:** The extension doesn't have permission to read content from Claude.ai.

**How to fix:**
1. Click the ResumeWright icon in your browser toolbar
2. Look for permission options in the popup
3. Select "Allow on this site" or grant permissions
4. Reload the page after granting permission

**Alternative method:**
1. Right-click the ResumeWright icon
2. Go to "Manage Extension" or "Extension Options"
3. Find "Site Permissions" or similar
4. Add `claude.ai` to allowed sites

---

## Fonts Won't Load

**Problem:** Error says "We couldn't load the fonts."

**What this means:** Custom fonts failed to download.

**Solutions:**
- Check your internet connection
- Try using a standard font instead (Arial, Times New Roman)
- Disable custom fonts in Settings
- Refresh the page and try again

---

## Browser Storage Full

**Problem:** Error says "Browser storage is full."

**What this means:** Your browser's local storage is at capacity.

**Solutions:**
- Clear conversion history in Settings
- Clear your browser cache and cookies
- Free up storage space in browser settings
- Try using a private/incognito window

**Where is data stored?** Conversion history and settings are saved in your browser's local storage. No data is sent to external servers.

---

## Settings Not Saving

**Problem:** Settings reset when you close the extension.

**Solutions:**
- Make sure to click "Save Settings" before closing
- Check browser console for errors (F12)
- Try resetting to defaults, then saving
- Check browser storage permissions
- Disable browser extensions that might interfere

---

## PDF Quality Issues

**Problem:** PDF looks different from what Claude showed.

**What this means:** PDF conversion may not perfectly match the web preview.

**Common issues and fixes:**
- **Fonts different:** Use standard fonts (Arial, Times New Roman) in Settings
- **Spacing off:** Adjust margins in Settings
- **Content cut off:** Reduce font size or increase margins
- **Colors wrong:** Custom colors may not convert perfectly - ask Claude to use standard colors

**Tip:** Always preview the PDF before sending it to employers!

---

## Unknown Errors

**Problem:** Error says "Something unexpected happened."

**What this means:** We encountered an error we didn't anticipate (might be a bug).

**What to do:**
1. Try refreshing the page
2. Restart the browser
3. Clear browser cache
4. Try converting a different CV to see if it's specific to this one
5. Contact support with:
   - Error code (if shown)
   - Browser version
   - What you were doing when it happened
   - Screenshot if possible

---

## Still Having Problems?

### Check Browser Compatibility
**Supported browsers:**
- Chrome 90+
- Edge 90+
- Firefox 90+ (coming soon)

**Not supported:**
- Safari (WebAssembly limitations)
- Internet Explorer (discontinued)
- Mobile browsers (desktop only)

### Contact Support
If none of these solutions work:

1. **GitHub Issues:** [github.com/resumewright/issues](https://github.com/resumewright/issues)
   - Check if someone else reported the same issue
   - Create a new issue with details

2. **Email Support:** support@resumewright.com
   - Include error code/screenshot
   - Describe what you were trying to do
   - Mention your browser and version

3. **Discord Community:** [discord.gg/resumewright](https://discord.gg/resumewright)
   - Get help from other users
   - Share tips and tricks

---

## Preventive Tips

**To avoid common issues:**
- ✅ Use latest browser version
- ✅ Keep CVs under 10 pages
- ✅ Use standard fonts when possible
- ✅ Test with a simple CV first
- ✅ Ask Claude to use standard formatting
- ✅ Check error messages carefully (they tell you what's wrong!)

---

**Last Updated:** 2025-10-18  
**Version:** 1.0.0
