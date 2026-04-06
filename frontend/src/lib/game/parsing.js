/**
 * Extract content from a markdown code block
 */
export function extractCodeblock(text, fixMarkdown = true) {
  if (!text) return '';
  const match = text.match(/```(?:markdown|svg|json)?\n?([\s\S]*?)```/);
  if (match) return match[1].trim();
  // Fallback: return the text as-is
  if (fixMarkdown) return text.trim();
  return text.trim();
}

/**
 * Extract a specific top-level markdown section (# Title)
 */
export function extractMarkdownSection(text, sectionTitle) {
  if (!text) return '';
  const pattern = new RegExp(
    `^# ${sectionTitle}\\s*\\n([\\s\\S]*?)(?=\\n# |$)`,
    'm'
  );
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

/**
 * Parse event output from the random events template
 * Returns: { categoryName: [[probability, eventText], ...], ... }
 */
export function parseEventsOutput(text) {
  const categories = {};
  const lines = text.split('\n');
  let currentCategory = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      currentCategory = trimmed.slice(2).trim();
      categories[currentCategory] = [];
    } else if (trimmed.startsWith('-') && currentCategory) {
      const eventLine = trimmed.slice(1).trim();
      // Match "x% event text"
      const probMatch = eventLine.match(/^(\d+(?:\.\d+)?)%\s+(.+)$/);
      if (probMatch) {
        const prob = parseFloat(probMatch[1]);
        const event = probMatch[2].trim();
        categories[currentCategory].push([prob, event]);
      }
    }
  }

  return categories;
}

/**
 * Sample a single event from a list of [probability, event] pairs
 */
export function sampleEvent(events) {
  if (!events || events.length === 0) return 'No notable events';
  const total = events.reduce((sum, [prob]) => sum + prob, 0);
  let r = Math.random() * total;
  for (const [prob, event] of events) {
    r -= prob;
    if (r <= 0) return event;
  }
  return events[events.length - 1][1];
}

/**
 * Parse the state markdown into a structured JSON object
 * This extracts key metrics from the markdown sections
 */
export function parseState(markdownState, onlyKeys = null) {
  if (!markdownState) return {};

  const result = {};

  // Helper to extract key-value pairs from a section
  function extractMetrics(text) {
    const metrics = {};
    const lines = text.split('\n');
    for (const line of lines) {
      const match = line.match(/^-\s+([^:]+):\s*(.+)$/);
      if (match) {
        const key = match[1]
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_');
        metrics[key] = match[2].trim();
      }
    }
    return metrics;
  }

  // Parse each major section
  const sections = [
    'People',
    'Education',
    'Health',
    'Crime',
    'Economy',
    'International Relations',
    'Defense',
    'Media',
    'Culture',
    'Geography and Environment',
    'Infrastructure and Technology',
    'Government',
    'Public Opinion',
  ];

  for (const section of sections) {
    const key = section.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (onlyKeys && !onlyKeys.includes(key)) continue;

    const sectionText = extractMarkdownSection(markdownState, section);
    if (!sectionText) continue;

    result[key] = {};

    // Extract subsections (## headers)
    const subSections = sectionText.split(/^## /m).filter(Boolean);
    for (const sub of subSections) {
      const lines = sub.split('\n');
      const subTitle = lines[0]
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const subContent = lines.slice(1).join('\n');
      result[key][subTitle] = {
        text: subContent.trim(),
        metrics: extractMetrics(subContent),
      };
    }
  }

  // Also extract Government Metadata specifically for name/capital
  const govSection = extractMarkdownSection(markdownState, 'Government');
  if (govSection) {
    const metadataSection = govSection.match(/## Government Metadata\n([\s\S]*?)(?=\n## |$)/);
    if (metadataSection) {
      const metrics = extractMetrics(metadataSection[1]);
      if (!result.government) result.government = {};
      result.government.government_metadata = { value: metrics.country_official_name || 'Unknown', metrics };
    }
  }

  return result;
}

/**
 * Sanitize user input to prevent prompt injection
 */
export function sanitizeUserInput(text, maxLength = 10000) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s.,!?'"-]/g, ' ') // Keep only safe chars
    .slice(0, maxLength)
    .trim();
}

export function simplifyUserInput(text, maxLength = 30) {
  if (!text) return '';
  return text.replace(/[^a-zA-Z0-9]/g, '').slice(0, maxLength);
}

export function formatMonthDate(dateStr) {
  // dateStr format: "2022-01"
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export function addMonths(dateStr, months) {
  const [year, month] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
