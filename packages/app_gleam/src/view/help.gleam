// ABOUTME: Full-screen help view — Getting Started, Keyboard Shortcuts, Troubleshooting, FAQ, Support.
// ABOUTME: Replaces the old modal dialog with a routed page matching the original React Help component.

import app/model.{type Msg}
import gleam/list
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/element/svg
import lustre/event

pub fn view() -> Element(Msg) {
  html.div(
    [attribute.class("flex flex-col min-h-screen bg-background text-foreground")],
    [
      help_header(),
      html.div(
        [attribute.class("flex-1 overflow-y-auto p-4 space-y-6")],
        [
          html.div(
            [attribute.class("max-w-prose mx-auto space-y-6")],
            [
              toc(),
              getting_started(),
              keyboard_shortcuts(),
              troubleshooting(),
              faq(),
              support(),
            ],
          ),
        ],
      ),
    ],
  )
}

fn help_header() -> Element(Msg) {
  html.header(
    [attribute.class("w-full bg-primary text-primary-foreground")],
    [
      html.div(
        [attribute.class("flex items-center gap-3 px-4 py-4")],
        [
          html.button(
            [
              attribute.type_("button"),
              attribute.aria_label("Back to main view"),
              attribute.class(
                "p-2 hover:bg-primary-foreground/20 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/50",
              ),
              event.on_click(model.CloseHelp),
            ],
            [back_icon()],
          ),
          html.h1(
            [attribute.class("text-lg font-semibold")],
            [html.text("Help & Documentation")],
          ),
        ],
      ),
    ],
  )
}

fn toc() -> Element(Msg) {
  html.nav(
    [
      attribute.class("p-6 bg-card border border-border rounded-lg"),
      attribute.aria_label("Table of contents"),
    ],
    [
      html.h2(
        [attribute.class("text-base font-semibold text-foreground mb-3")],
        [html.text("On this page")],
      ),
      html.ul(
        [attribute.class("space-y-2 text-sm")],
        [
          toc_link("#getting-started", "Getting Started"),
          toc_link("#keyboard-shortcuts", "Keyboard Shortcuts"),
          toc_link("#troubleshooting", "Troubleshooting"),
          toc_link("#faq", "FAQ"),
          toc_link("#support", "Support"),
        ],
      ),
    ],
  )
}

fn toc_link(href: String, label: String) -> Element(Msg) {
  html.li(
    [],
    [
      html.a(
        [
          attribute.href(href),
          attribute.class(
            "text-primary hover:text-primary/80 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
          ),
        ],
        [html.text(label)],
      ),
    ],
  )
}

fn getting_started() -> Element(Msg) {
  html.section(
    [attribute.id("getting-started")],
    [
      section_heading(question_icon(), "Getting Started"),
      html.div(
        [attribute.class("p-6 bg-card border border-border rounded-lg space-y-6")],
        [
          html.div(
            [],
            [
              html.h3(
                [attribute.class("text-xl font-medium text-foreground mb-3")],
                [html.text("1. Get Your CV from Claude.ai")],
              ),
              html.ol(
                [attribute.class("list-decimal list-inside space-y-2 text-sm text-muted-foreground")],
                [
                  html.li([], [html.text("Ask Claude to create your CV in TSX format")]),
                  html.li([], [html.text("Copy the TSX code from Claude's response")]),
                  html.li(
                    [],
                    [
                      html.text("Save it as a "),
                      html.code([attribute.class("code-inline")], [html.text(".tsx")]),
                      html.text(" file on your computer"),
                    ],
                  ),
                ],
              ),
            ],
          ),
          html.div(
            [],
            [
              html.h3(
                [attribute.class("text-xl font-medium text-foreground mb-3")],
                [html.text("2. Import & Convert")],
              ),
              html.ol(
                [attribute.class("list-decimal list-inside space-y-2 text-sm text-muted-foreground")],
                [
                  html.li([], [html.text("Click the ResumeWright icon in your browser toolbar")]),
                  html.li([], [html.text("Drag and drop your TSX file, or click \"Browse Files\"")]),
                  html.li([], [html.text("Your CV will be validated and converted to PDF automatically")]),
                  html.li([], [html.text("Download your professional PDF resume")]),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}

fn keyboard_shortcuts() -> Element(Msg) {
  html.section(
    [attribute.id("keyboard-shortcuts")],
    [
      section_heading(terminal_icon(), "Keyboard Shortcuts"),
      html.div(
        [attribute.class("p-6 bg-card border border-border rounded-lg")],
        [
          html.table(
            [attribute.class("w-full text-sm")],
            [
              html.thead(
                [],
                [
                  html.tr(
                    [attribute.class("border-b border-border")],
                    [
                      html.th(
                        [attribute.class("text-left py-2 text-muted-foreground font-medium")],
                        [html.text("Action")],
                      ),
                      html.th(
                        [attribute.class("text-right py-2 text-muted-foreground font-medium")],
                        [html.text("Shortcut")],
                      ),
                    ],
                  ),
                ],
              ),
              html.tbody(
                [attribute.class("divide-y divide-border")],
                [
                  shortcut_row("Open settings", "Ctrl ,"),
                  shortcut_row("Convert CV", "Ctrl E"),
                  shortcut_row("Back / Close", "Esc"),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}

fn shortcut_row(action: String, keys: String) -> Element(Msg) {
  html.tr(
    [],
    [
      html.td([attribute.class("py-2 text-foreground")], [html.text(action)]),
      html.td(
        [attribute.class("text-right")],
        [
          html.kbd(
            [
              attribute.class(
                "px-2 py-1 bg-muted text-foreground rounded border border-border font-mono text-xs",
              ),
            ],
            [html.text(keys)],
          ),
        ],
      ),
    ],
  )
}

fn troubleshooting() -> Element(Msg) {
  html.section(
    [attribute.id("troubleshooting")],
    [
      section_heading(wrench_icon(), "Troubleshooting"),
      html.div(
        [attribute.class("p-6 bg-card border border-border rounded-lg space-y-6")],
        [
          troubleshooting_item(
            "File validation errors",
            "If your TSX file won't import:",
            [
              "Ensure the file has a .tsx extension",
              "File size must be under 1MB",
              "Check that the file contains valid TSX code from Claude",
              "Try regenerating the CV in Claude and exporting again",
            ],
          ),
          troubleshooting_item(
            "Conversion taking too long",
            "If conversion seems stuck:",
            [
              "Wait at least 30 seconds — complex CVs take longer",
              "Close other browser tabs to free up memory",
              "Try simplifying your CV content",
              "Refresh the page and try again",
            ],
          ),
          troubleshooting_item(
            "PDF quality issues",
            "If the PDF doesn't look right:",
            [
              "Adjust page size in Settings (A4, Letter, or Legal)",
              "Customize margins using Settings",
              "Ensure your original TSX code has proper formatting",
              "Try different margin values",
            ],
          ),
        ],
      ),
    ],
  )
}

fn troubleshooting_item(
  heading: String,
  intro: String,
  items: List(String),
) -> Element(Msg) {
  html.div(
    [],
    [
      html.h3(
        [attribute.class("text-xl font-medium text-foreground mb-3")],
        [html.text(heading)],
      ),
      html.p(
        [attribute.class("text-sm text-foreground mb-3")],
        [html.text(intro)],
      ),
      html.ul(
        [attribute.class("list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4")],
        list.map(items, fn(item) { html.li([], [html.text(item)]) }),
      ),
    ],
  )
}

fn faq() -> Element(Msg) {
  html.section(
    [attribute.id("faq")],
    [
      html.h2(
        [attribute.class("text-2xl font-semibold text-foreground mb-4")],
        [html.text("Frequently Asked Questions")],
      ),
      html.div(
        [attribute.class("p-6 bg-card border border-border rounded-lg space-y-6")],
        [
          faq_item(
            "Is my data secure?",
            "Yes! ResumeWright processes everything locally in your browser. Your CV data never leaves your device and is not sent to any servers.",
          ),
          faq_item(
            "What file formats are supported?",
            "ResumeWright accepts TSX files from Claude.ai and converts them to professional PDF resumes. The output is always PDF/A format for maximum compatibility.",
          ),
          faq_item(
            "Can I customize the PDF output?",
            "Yes! Use Settings to adjust page size (A4, Letter, Legal) and margins.",
          ),
          faq_item(
            "Why does it need Claude.ai?",
            "ResumeWright is designed to work with Claude.ai's CV generation capabilities. Claude creates structured TSX code that ResumeWright converts to beautiful PDFs.",
          ),
        ],
      ),
    ],
  )
}

fn faq_item(question: String, answer: String) -> Element(Msg) {
  html.div(
    [],
    [
      html.h3(
        [attribute.class("text-xl font-medium text-foreground mb-3")],
        [html.text(question)],
      ),
      html.p(
        [attribute.class("text-sm text-foreground")],
        [html.text(answer)],
      ),
    ],
  )
}

fn support() -> Element(Msg) {
  html.section(
    [attribute.id("support")],
    [
      html.h2(
        [attribute.class("text-2xl font-semibold text-foreground mb-4")],
        [html.text("Need More Help?")],
      ),
      html.div(
        [attribute.class("p-6 bg-info/10 border border-info/20 rounded-lg")],
        [
          html.p(
            [attribute.class("text-sm text-foreground mb-3")],
            [html.text("For additional support, bug reports, or feature requests:")],
          ),
          html.ul(
            [attribute.class("space-y-2 text-sm text-foreground")],
            [
              html.li(
                [],
                [
                  html.strong([], [html.text("GitHub Issues: ")]),
                  html.a(
                    [
                      attribute.href("https://github.com/vitalratel/resumewright/issues"),
                      attribute.attribute("target", "_blank"),
                      attribute.attribute("rel", "noopener noreferrer"),
                      attribute.class(
                        "text-primary hover:text-primary/80 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                      ),
                    ],
                    [html.text("github.com/vitalratel/resumewright/issues")],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}

fn section_heading(icon: Element(Msg), title: String) -> Element(Msg) {
  html.div(
    [attribute.class("flex items-center gap-2 mb-4")],
    [
      icon,
      html.h2(
        [attribute.class("text-2xl font-semibold text-foreground")],
        [html.text(title)],
      ),
    ],
  )
}

fn back_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "24"),
      attribute.attribute("height", "24"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "2"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
    ],
    [svg.path([attribute.attribute("d", "m15 18-6-6 6-6")])],
  )
}

fn question_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "32"),
      attribute.attribute("height", "32"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "2"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
      attribute.class("text-info"),
    ],
    [
      svg.circle([attribute.attribute("cx", "12"), attribute.attribute("cy", "12"), attribute.attribute("r", "10")]),
      svg.path([attribute.attribute("d", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3")]),
      svg.line([attribute.attribute("x1", "12"), attribute.attribute("y1", "17"), attribute.attribute("x2", "12.01"), attribute.attribute("y2", "17")]),
    ],
  )
}

fn terminal_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "32"),
      attribute.attribute("height", "32"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "2"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
      attribute.class("text-info"),
    ],
    [
      svg.polyline([attribute.attribute("points", "4 17 10 11 4 5")]),
      svg.line([attribute.attribute("x1", "12"), attribute.attribute("y1", "19"), attribute.attribute("x2", "20"), attribute.attribute("y2", "19")]),
    ],
  )
}

fn wrench_icon() -> Element(Msg) {
  svg.svg(
    [
      attribute.attribute("width", "32"),
      attribute.attribute("height", "32"),
      attribute.attribute("viewBox", "0 0 24 24"),
      attribute.attribute("fill", "none"),
      attribute.attribute("stroke", "currentColor"),
      attribute.attribute("stroke-width", "2"),
      attribute.attribute("stroke-linecap", "round"),
      attribute.attribute("stroke-linejoin", "round"),
      attribute.aria_hidden(True),
      attribute.class("text-info"),
    ],
    [
      svg.path([
        attribute.attribute(
          "d",
          "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
        ),
      ]),
    ],
  )
}
