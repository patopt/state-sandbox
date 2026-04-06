import { DIMENSIONS, STATE_CONFIG_FORMAT_TEMPLATE } from './state-config';
import { extractCodeblock, extractMarkdownSection, formatMonthDate } from './parsing';

async function generateNextStateDimension(provider, startDate, endDate, prevState, dimension, diffOutput) {
  let prevStateDimsText = '';
  const dimsToInclude = [...(dimension.diffRequiresDimensions || []), dimension.title];

  for (const dimTitle of dimsToInclude) {
    const dimContent = extractMarkdownSection(prevState, dimTitle);
    prevStateDimsText += `\n<prev-state-dimension on="${startDate}" title="${dimTitle}">
\`\`\`markdown
${dimContent}
\`\`\`
</prev-state-dimension>`;
  }

  const prompt = `Given this fictional state and the following events between ${formatMonthDate(startDate)} and ${formatMonthDate(endDate)}, provide an updated dimension for ${dimension.title} in ${formatMonthDate(endDate)} with the changes from <state-recent-changes> applied.

${prevStateDimsText.trim()}

<state-recent-changes>
${diffOutput}
</state-recent-changes>

<template>
\`\`\`markdown
${STATE_CONFIG_FORMAT_TEMPLATE}

${dimension.template}
\`\`\`
</template>

Reply with:
(1) Brief discussion for how <state-recent-changes> impacted "${dimension.title}" at a high level.
(2) For ALL OTHER values in "${dimension.title}", determine the before/after changes.
- For all values directly mentioned or clearly implied in <state-recent-changes>, use those values for the after values.
- Reflect on how the recent events mentioned interact with parts of the dimension.
- ALL non-zero numerical fields should change at least slightly over the course of a year.
- Consider both the recent events mentioned and year-over-year variance to compute the new values.
- Compute the new values for major metrics like GDP and population using <state-recent-changes> and known growth rates. Show your reasoning.
(4) The new <template> in a markdown codeblock.
- ALL non-zero numerical fields should change.
- Systems, features, and policies should update as needed to reflect any updated policies.
- For challenges, lean towards adding a challenge and only remove a challenge if it's no longer relevant.`.trim();

  const rawOutput = await provider.generateMediumReasoning(prompt);
  const mdNew = extractCodeblock(rawOutput);
  return `# ${dimension.title}\n${mdNew}`;
}

export async function generateNextState(
  provider,
  startDate,
  endDate,
  prevState,
  events,
  reasonablePolicy,
  historicalEvents = []
) {
  const historicalEventsStr = historicalEvents.length > 0
    ? historicalEvents.map(([date, evts]) =>
        `${date}:\n${evts.map((e) => `- ${e}`).join('\n')}`
      ).join('\n')
    : 'No notable historical events';

  const eventsStr = [reasonablePolicy, events]
    .join('\n')
    .split('\n')
    .map((e) => `- ${e}`)
    .join('\n');

  const dimensions = DIMENSIONS.map((d) => d.title).join(', ');

  const diffPrompt = `Given this fictional state and the following events between ${formatMonthDate(startDate)} and ${formatMonthDate(endDate)}, simulate the key changes that will occur to the state.

<state on="${startDate}">
${prevState}
</state>

<historical-events>
${historicalEventsStr}
</historical-events>

<events start="${startDate}" end="${endDate}">
${eventsStr}
</events>

You must jointly consider the complex relationships between:
- All recent <events> along with their impact on all aspects of the <state>.
- All <historical-events> and their long-term effects on the <state>.
- The unique characteristics, systems, and values of the <state>.
- Natural changes in production, distributions, infrastructure, facilities, and other metrics over the course of a year.
- The actual ability of the government to enact change.

Reply with (in plain text):
1. For each non-government <event>, state the high-level expected impact on the <state>.
- Consider that some events will be very impactful and others might have minimal change.
- Consider the intersectionality of recent events, historical events, the state, and policies.
- Event impacts can span several state dimensions with complex higher-order consequences.
  - State the 2nd order effects of the event on across all dimensions.
  - State the 3rd order effects of the event on across all dimensions.
2. For EACH new policy in "Government Events", state the high-level expected impact on the <state>.
- Consider the actual resources the government has to enact the policy.
- Policy impacts can span several state dimensions with complex higher-order consequences.
- Government actions should, no matter how positive, include thought provoking negative consequences.
3. For each dimension (${dimensions}) list out the explicit changes.
- Weave in the dimension specific 1st, 2nd, and 3rd order effects of the events and policies.
- Noting in great detail what changed (before/after) and why.
- Noting how the top challenges in each dimension have evolved.
- Include relative changes to GDP, growth rates, population, and other metrics.`.trim();

  const diffOutput = await provider.generateHighReasoning(diffPrompt);

  // Generate all dimension updates in parallel
  const dimensionOutputs = await Promise.all(
    DIMENSIONS.map((dim) =>
      generateNextStateDimension(provider, startDate, endDate, prevState, dim, diffOutput)
    )
  );

  const newStateOutput = dimensionOutputs.join('\n\n').trim();
  return { diff: diffOutput, newState: newStateOutput, simulatedEvents: eventsStr };
}

export async function generateStateAdvice(provider, state, question, events) {
  const prompt = `You are an expert advisor for the government of a fictional country. Given the user's question (the head of state), provide advice for their policies and upcoming events.

<state>
${state}
</state>

<upcoming-events>
${events}
</upcoming-events>

<question>
${JSON.stringify(question)}
</question>

Reply with a markdown codeblock containing the advice. Do not include xml tags.

Format policy advice in an imperative format:
- "Create a restriction on ..."
- "Ban the use of ..."
- "Increase the minimum wage to ..."

Be brief, technical, and concise. If writing out suggested policies, limit it to the top 3 most effective ones.`.trim();

  const output = await provider.generateLowReasoning(prompt);
  return extractCodeblock(output, false);
}
