import { DIMENSIONS, RANDOM_EVENTS_TEMPLATE, FUTURE_POLICY_TEMPLATE } from './state-config';
import { extractCodeblock, parseEventsOutput, sampleEvent, formatMonthDate } from './parsing';

export async function generateFutureEvents(provider, startDate, endDate, prevState, historicalEvents = []) {
  const historicalEventsStr = historicalEvents.length > 0
    ? historicalEvents.map(([date, events]) =>
        `${date}:\n${events.map((e) => `- ${e}`).join('\n')}`
      ).join('\n')
    : '';

  const dimensions = DIMENSIONS.map((d) => d.title).join(', ');

  const prompt = `Given this fictional <state> from ${formatMonthDate(startDate)} to ${formatMonthDate(endDate)}, provide a list of potential random events that could occur within the next year and will require the government to make decisions.

<state on="${startDate}">
${prevState}
</state>

<historical-events>
${historicalEventsStr || 'No notable historical events'}
</historical-events>

<format>
\`\`\`markdown
${RANDOM_EVENTS_TEMPLATE}
\`\`\`
</format>

Reply with:
1. How the dimensions of the state (${dimensions}) impact the likelihood of the different event types.
2. <format> as a markdown codeblock. Be sure to include "No notable events" as the first event in each category.`.trim();

  const rawOutput = await provider.generateMediumReasoning(prompt);
  const output = extractCodeblock(rawOutput);

  const categories = parseEventsOutput(output);
  const sampledEvents = [];
  for (const [category, events] of Object.entries(categories)) {
    if (events.length > 0) {
      const event = sampleEvent(events);
      sampledEvents.push(`${category}: ${event}`);
    }
  }

  return sampledEvents.join('\n');
}

export async function generateFuturePolicySuggestion(provider, startDate, endDate, prevState, events) {
  const prompt = `Given this fictional <state> from ${formatMonthDate(startDate)} to ${formatMonthDate(endDate)} and the following events, provide a policy suggestion for the government to enact.

<state>
${prevState}
</state>

<events>
${events}
</events>

<format>
\`\`\`markdown
${FUTURE_POLICY_TEMPLATE}

# Government Actions
- <-- action -->
- <-- action -->
\`\`\`
</format>

Reply with <format> as a markdown codeblock.`.trim();

  const output = await provider.generateMediumReasoning(prompt);
  const lines = extractCodeblock(output).split('\n');
  return lines.filter((l) => l.trim().startsWith('-')).join('\n');
}

export async function generateDiffReport(provider, startDate, endDate, prevState, diffOutput) {
  const prompt = `Given this fictional state and the following events between ${formatMonthDate(startDate)} and ${formatMonthDate(endDate)}, provide a report on the changes in the state.

<original-state>
${prevState}
</original-state>

<state-recent-changes>
${diffOutput}
</state-recent-changes>

<report-template>
### Executive Summary

1. **Government**:
   - **<!-- Title -->**: <!-- Description -->
2. **Environment and Weather**: ...
3. **Economy**: ...
4. **Defense**: ...
5. **Health and Crime**: ...
6. **Culture and People**: ...
7. **Infrastructure and Technology**: ...
8. **International Relations**: ...
</report-template>

Reply with a markdown codeblock containing the report. Do not include xml tags.`.trim();

  try {
    const output = await provider.generateLowReasoning(prompt);
    return extractCodeblock(output, false);
  } catch {
    return '### Executive Summary\n\nThe report failed to generate.';
  }
}
