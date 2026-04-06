export const STATE_CONFIG_FORMAT_TEMPLATE = `<!--
- Follow the template exactly. Filling in {values}, keeping text outside of brackets, and replacing ...s.
- You are expected to fill out ALL the fields in the template and keep ALL default attributes.
- Format {Number} like: 123, 123 million, 0.12. Do not use a percentage or relative values. Prefer "million" over several trailing zeros.
- Format {Percentage} like: 12%, 0.01%.
- Format {Description} with 1-3 concise sentences. Use technical terms and avoid filler words.
- Format {AmountUSD} monetary amounts in USD like $123, $123 million, $0.12.
- Format {Challenge}, {PolicyType}, etc. like "Topic Name" (no styling or quotes)
- Do not use *italic* or **bold**.
- Do not add nested lists or headings not specified in the template.
- Do not include <!-- comments --> in the final output but use them as key guidance.
-->`;

export const RANDOM_EVENTS_TEMPLATE = `<!--
These are random events the government will need to make decisions on.
- Events are mutually exclusive within their category.
- Events must start with a % probability.
- Events should be caused by nature, citizens, businesses, or other states.
- Events can be controversial, bad, or mixed. All should be expected to invoke an opinionated response from the government.
- Events can tip the scales of various dimensions of the state.
- Events should be concise and unambiguous.
- Events that last longer than a year should be stated as "starts" (or "ends").
- Event categories must include a first no-event category.
- Event probabilities should be realistic and influenced by the state.
- Be specific with variants and severity of events.
- Do not re-use events that occurred in the previous years.
- Do not add nested lists or headings not specified in the template.
- Do not include <!-- comments --> in the final output.
- Do not use *italic* or **bold**.
-->

# Environmental and Weather Events
- x% No notable events
...

# Economic Events
- x% No notable events
...

# Defense and Military Events
- x% No notable events
...

# Health and Crime Events
- x% No notable events
...

# Cultural and People Events
- x% No notable events
...

# Infrastructure and Technology Events
- x% No notable events
...

# International Relations Events
- x% No notable events
...`;

export const FUTURE_POLICY_TEMPLATE = `<!--
Provide a list of at most 3 actions to respond to the events.
- Action examples: "Ban the use of social media", "Increase funding for anti-cybercrime programs", etc.
- Actions should be specific, realistic, and target the events.
- Actions should have non-obvious negative consequences (don't state this explicitly).
- Actions should not include the effects or risks of the action.
- Actions should be at most 2 sentences. Keep it technical, dense, and concise.
- Actions should reflect the type of state and cultural values.
- Events should have at most 1 action each.
- Events that are obviously positive should not have any actions.
- Do not add nested lists or headings not specified in the template.
- Do not include <!-- comments --> in the final output.
- Do not use *italic* or **bold**.
IMPORTANT: Include implicitly flawed actions that will make the state worse.
-->`;

export const DIFF_EXECUTIVE_TEMPLATE = `<!--
- This is a report to state leadership on the changes to the state over the last year.
- Include both what happened, what changed, and how it was mitigated (if at all) by the state.
- You should include what changes, why it changes, and notable metrics that will reflect the change.
- Focus on the most important events, some might not be that important for the leadership.
- Some sections may be empty if nothing relevant changed.
- Do not add nested lists or headings not specified in the template.
- Do not include <!-- comments --> in the final output.
- Do not include a greeting or a summary at the end.
-->

### Executive Summary

1. **Government**:
   - **<!-- Title -->**: <!-- Description -->
   - ...
2. **Environment and Weather**:
...
3. **Economy**:
...
4. **Defense**:
...
5. **Health and Crime**:
...
6. **Culture and People**:
...
7. **Infrastructure and Technology**:
...
8. **International Relations**:
...`;

export const DIMENSIONS = [
  {
    title: 'People',
    seedAssumptions: [
      'Assume a population of 25.68 million',
      'Assume a single fictional country-specific ethnic group and several real groups for the others in the country',
      'Assume a single fictional country-specific religious group and several real religions for the others in the country',
    ],
    diffRequiresDimensions: [],
    template: `## Population Distribution
### Age Composition
- 0-4 years: {Percentage}
- 5-17 years: {Percentage}
- 18-24 years: {Percentage}
- 25-44 years: {Percentage}
- 45-64 years: {Percentage}
- 65-74 years: {Percentage}
- 75+ years: {Percentage}

### Gender Composition
- Male: {Percentage}
- Female: {Percentage}
- Other: {Percentage}

### Urban-Rural Composition
- Urban Population: {Percentage}
- Rural Population: {Percentage}

### Economic Composition
- Upper Class: {Percentage}
- Upper Middle Class: {Percentage}
- Middle Class: {Percentage}
- Lower Middle Class: {Percentage}
- Working Class: {Percentage}
- Below Poverty Line: {Percentage}

### Education Composition
- No Schooling: {Percentage}
- Primary Education Complete: {Percentage}
- Secondary Education Complete: {Percentage}
- Tertiary Education Complete: {Percentage}
- Graduate Degree Complete: {Percentage}

### Ethnic Composition
- {EthnicGroup}: {Percentage}
- Two or more ethnicities: {Percentage}
- Others: {Percentage}

### Language Composition
- {Language}: {Percentage}
- Multilingual: {Percentage}

### Religious Composition
- {Religion}: {Percentage}
- Unaffiliated/No Religion: {Percentage}

### Housing Composition
- Owned: {Percentage}
- Rented: {Percentage}
- Homeless: {Percentage}
- Other: {Percentage}

### Population Growth
- Population Annual Growth Rate: {Percentage} per year
- Ethnic Population Growth: {Description}
- Religious Population Growth: {Description}
- Economic Class Population Growth: {Description}

## Migration
<!-- describe migration patterns in detail -->

## People Metrics
- Total Population: {Number} people
- Gallup World Happiness Score: {Number} out of 10
- Human Development Index (HDI): {Number}
- Gender Inequality Index (GII): {Number} out of 1.0
- Female Labor Force Participation Rate: {Percentage}
- Social Mobility Index: {Number} out of 100
- LGBTQ+ Legal Equality Index: {Number} out of 100

## Top People Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Education',
    seedAssumptions: [],
    diffRequiresDimensions: [],
    template: `## Education System
<!-- describe the education system in detail -->

## Literacy
- Adult Literacy Rate: {Percentage}
- Ethnic Literacy: {Description}

## Education Metrics
- Average Years of Schooling: {Number} years
- Gender Parity Index in Education: {Number}
- University Enrollment Rate: {Percentage}
- Primary Schools: {Number}
- Secondary Schools: {Number}
- Universities: {Number}

## Top Education Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Health',
    seedAssumptions: [],
    diffRequiresDimensions: [],
    template: `## Health System
<!-- describe the health system in detail -->

## Life Expectancy
- Average Life Expectancy at Birth: {Number} years
- Male Life Expectancy: {Number} years
- Female Life Expectancy: {Number} years

## Health Statistics
### Diseases
- Obesity: {Percentage}
- Mental Health: {Percentage}
- Diabetes: {Percentage}
- Hypertension: {Percentage}
- Heart Disease: {Percentage}
- Cancer: {Percentage}

### Causes of Death Composition
- Heart Disease: {Percentage}
- Cancer: {Percentage}
- Other Causes: {Percentage}

## Health Metrics
- Infant Mortality Rate: {Number} per 1,000 live births
- Total Fertility Rate: {Number} children per woman
- Maternal Mortality Rate: {Number} per 100,000 live births
- Physician Density: {Number} per 1,000 population
- Hospital Bed Density: {Number} per 1,000 population

## Top Health Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Crime',
    seedAssumptions: [],
    diffRequiresDimensions: [],
    template: `## Justice System
<!-- describe the justice system in detail -->

## Crime Metrics
- Population Incarcerated: {Percentage}
- Prison Capacity: {Percentage}
- Gun Ownership Rate: {Percentage}
- Violent Crimes: {Number} per 100,000 population
- Property Crimes: {Number} per 100,000 population
- Financial Crimes: {Number} per 100,000 population
- Drug-Related Crimes: {Number} per 100,000 population
- Cybercrime: {Number} per 100,000 population
- Organized Crime: {Number} per 100,000 population

## Black Market
<!-- describe the black market in detail -->

## Top Crime Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Economy',
    seedAssumptions: [
      'Assume an initial GDP of 2,700,000,000 USD (2.7 billion USD)',
      'Assume all real countries for import and export partners',
    ],
    diffRequiresDimensions: [],
    template: `## Economic System
<!-- describe the economic system in detail -->

## Sectors
### Industries
- Agriculture: {Description}
- Services: {Description}
- Manufacturing: {Description}
- Technology: {Description}
- {Sector}: {Description}

### Sector Contributions to GDP Composition
- Agriculture: {Percentage}
- Services: {Percentage}
- Manufacturing: {Percentage}
- Technology: {Percentage}
- {Sector}: {Percentage}

### Employment by Sector Composition
- Agriculture: {Percentage}
- Services: {Percentage}
- Manufacturing: {Percentage}
- Technology: {Percentage}
- {Sector}: {Percentage}

## Government Budget
### Government Revenue Composition
- Income Tax: {Percentage}
- Corporate Tax: {Percentage}
- Sales Tax/VAT: {Percentage}
- Other Revenue Sources: {Percentage}

### Government Expenditure Composition
- Healthcare Expenditure: {Percentage}
- Education Expenditure: {Percentage}
- Defense and Military Expenditure: {Percentage}
- Infrastructure Expenditure: {Percentage}
- Social Welfare Expenditure: {Percentage}
- Other Expenditure: {Percentage}

### Government Budget Metrics
- Total Annual Revenue: {AmountUSD}
- Total Annual Expenditure: {AmountUSD}

## Credit Ratings
- Standard & Poor's: {RatingLetters}
- Moody's: {RatingLetters}
- Fitch: {RatingLetters}

## Economic Metrics
- Gross Domestic Product (GDP): {AmountUSD}
- GDP Annual Growth Rate: {Percentage} per year
- Currency: {CurrencyName} ({CurrencyCode})
- Unemployment Rate: {Percentage}
- Labor Force Participation Rate: {Percentage}
- Poverty Rate: {Percentage}
- Inflation Rate: {Percentage}
- Gini Coefficient: {Number} out of 1.0
- Average Annual Income: {AmountUSD} per person
- Exchange Rate ({LocalCurrency}/USD): {ExchangeRate}
- Optimistic Perception of Economic Future: {Percentage}

## Top Economic Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'International Relations',
    seedAssumptions: [
      'Assume all real good types for imports/exports',
      'Assume all real countries for partners, allies, and rivals',
    ],
    diffRequiresDimensions: [],
    template: `## Diplomatic Relations
<!-- describe diplomatic relations in detail including major allies, rivals, agreements, and foreign policy -->

## Trade
### Export Goods Composition
- {GoodType}: {Percentage}
- Other Export Goods: {Percentage}

### Import Goods Composition
- {GoodType}: {Percentage}
- Other Import Goods: {Percentage}

### Export Partner Composition
- {Country}: {Percentage}
- Other Export Partners: {Percentage}

### Import Partner Composition
- {Country}: {Percentage}
- Other Import Partners: {Percentage}

### Trade Metrics
- Total Exports: {AmountUSD}
- Total Imports: {AmountUSD}

## Top International Relations Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Defense',
    seedAssumptions: ['Assume no current nuclear weapons'],
    diffRequiresDimensions: [],
    template: `## Military System
<!-- describe the military system including structure, branches, capabilities -->

## Military Personnel
- Active Duty Personnel: {Number}
- Reserve Personnel: {Number}

## Military Assets
- Advanced Combat Aircraft (5th/4th gen): {Number}
- Basic Combat Aircraft (3rd/2nd gen): {Number}
- Transport/Support Aircraft: {Number}
- Combat Helicopters: {Number}
- Unmanned Aerial Systems: {Number}
- Major Combat Ships: {Number}
- Minor Combat Ships: {Number}
- Submarines: {Number}
- Modern Main Battle Tanks: {Number}
- Legacy Tanks: {Number}
- Armored Combat Vehicles: {Number}
- Artillery Systems: {Number}
- Ballistic Missile Systems: {Number}
- Air Defense Systems: {Number}
- Satellite Systems: {Number}
- Cyber/Electronic Warfare Units: {Number}
- Special Forces Units: {Number}
- Strategic Nuclear Warheads: {Number}
- Tactical Nuclear Warheads: {Number}
- Nuclear Delivery Systems: {Number}

## Top Defense Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Media',
    seedAssumptions: [],
    diffRequiresDimensions: [],
    template: `## Media Landscape
<!-- describe the media landscape including state control, ownership, press freedom, digital adoption -->

## Media Source Composition
- Online News: {Percentage}
- Print News: {Percentage}
- TV News: {Percentage}
- Radio News: {Percentage}
- Social Media: {Percentage}

## News Coverage Composition
- {MediaIssue}: {Percentage}

## Media Metrics
- Press Freedom Index: {Number} out of 100
- Digital Divide Index (Infrastructure): {Number} out of 100
- Digital Divide Index (Socioeconomic): {Number} out of 100
- Social Media Usage: {Percentage}
- Average Daily Media Consumption: {Number} hours`,
  },
  {
    title: 'Culture',
    seedAssumptions: [],
    diffRequiresDimensions: [],
    template: `## Cultural Identity
<!-- describe cultural identity including traditional values, national identity, individualism vs collectivism -->

## Cultural Practices
<!-- describe cultural practices including cuisine, music, art, sports -->

## Cultural Metrics
- Soft Power Index: {Number} of 100
- International Cultural Centers: {Number}
- Protected Cultural Sites: {Number}
- Published Books per Year: {Number}
- Art Galleries: {Number}
- Museums: {Number}
- Theaters: {Number}
- Concert Venues: {Number}

## Top Cultural Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Geography and Environment',
    seedAssumptions: ['Assume an area of 520k sq km'],
    diffRequiresDimensions: [],
    template: `## Geographic Features
<!-- describe geographic features including mountains, rivers, coastlines, natural resources -->

## Natural Resource Production
- Oil and Gas: {Number} barrels of oil equivalent per day
- Coal: {Number} tons per day
- Precious Metals (Gold/Silver): {Number} ounces per day
- Industrial Metals (Copper/Iron): {Number} tons per day
- Strategic Metals (Uranium/Rare Earth): {Number} tons per day

## Environmental Metrics
- Total Land Area: {Number} sq km
- CO2 Emissions: {Number} metric tons per capita
- Particulate Matter (PM2.5): {Number} μg/m3
- Air Quality Index: {Number} out of 500
- Number of Endangered Species: {Number}

## Top Environmental Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Infrastructure and Technology',
    seedAssumptions: [],
    diffRequiresDimensions: [],
    template: `## Infrastructure
<!-- describe transportation, energy, and communication infrastructure -->

## Energy Source Composition
- Natural Gas: {Percentage}
- Renewable Energy: {Percentage}
- Nuclear Energy: {Percentage}
- Coal: {Percentage}
- Hydroelectric: {Percentage}
- {EnergySource}: {Percentage}

## Technologies
<!-- describe AI, Quantum Computing, Robotics, Space Program, Biotechnology capabilities -->

## Infrastructure Metrics
- Total Electricity Generation: {Megawatts}
- Mobile Phone Subscriptions: {Percentage}
- Highspeed Internet Access: {Percentage}
- Access to Improved Water Sources: {Percentage}
- Access to Improved Sanitation: {Percentage}
- Access to Electricity: {Percentage}
- Roads: {Number} km
- Railways: {Number} km
- Airports: {Number}
- Ports and Harbors: {Number}

## Infrastructure Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Government',
    seedAssumptions: [],
    diffRequiresDimensions: [],
    template: `## Government System
<!-- describe government structure, branches, governing documents, political parties, electoral system -->

## Government Metadata
- Government Type: {GovernmentType}
- Head of State/Government: {Title}
- Country Official Name: {StateName}
- Capital City: {CapitalCity}

## Political Participation
<!-- describe political participation by age, gender, ethnicity, religion -->

## Policies
### Civil Rights and Democracy Policies
- {PolicyType}: {Description}

### Economic and Monetary Policies
- {PolicyType}: {Description}

### Fiscal and Tax Policies
- {PolicyType}: {Description}

### Healthcare and Public Health Policies
- {PolicyType}: {Description}

### Education and Research Policies
- {PolicyType}: {Description}

### Social Welfare Policies
- {PolicyType}: {Description}

### Defense and Security Policies
- {PolicyType}: {Description}

### Foreign Relations Policies
- {PolicyType}: {Description}

### Environmental and Climate Policies
- {PolicyType}: {Description}

### Technology and Digital Policies
- {PolicyType}: {Description}

## Government Metrics
- Corruption Perception Index (CPI): {Number} out of 100
- Direction of Country: {Percentage} believe country is on right track
- Overall Head of State/Government Approval Rating: {Percentage}
- Democracy Index: {Number} out of 10.0

## Top Government Challenges
- {Challenge}: {Description}`,
  },
  {
    title: 'Public Opinion',
    seedAssumptions: [],
    diffRequiresDimensions: ['People'],
    template: `## Recent Citizen Quotes
- {Name} ({Number} years old, {Gender}, {Ethnicity}, {Religion}, {Occupation}, {AmountUSD} annual income) - "{Quote}"
...

## Recent Headlines
- "{Headline}"
...`,
  },
];
