const fs = require("fs");
const filepath = "c:/Users/fnazaret/dev/event-ops/src/components/wise-prototype.tsx";
const content = fs.readFileSync(filepath, "utf8");

const replacements = [
  ["GTG", "W"],
  ["42 days to launch</small>", "42 days to launch · Doha</small>"],
  ["Content Curator drafted “From Conviction to Capital” session", "Content Curator drafted “From Evidence to Adoption” session"],
  ["Good to Grow is moving on plan.", "WISE Summit is moving on plan."],
  ["Live readiness across strategy, talent, content, and summit operations.", "Live readiness across strategy, global education leaders, content, and summit operations."],
  ["Access · conviction · iteration", "Innovation · evidence · global impact"],
  ["“We already hold the creativity and resourcefulness needed to bring ideas to life. The summit converts those strengths into action.”", "“WISE advances evidence-driven solutions that strengthen learning systems, expand opportunity, and create practical pathways to adoption.”"],
  ["[\"North America\",\"Europe\",\"Latin America\"]", "[\"MENA\",\"Africa\",\"Asia Pacific\"]"],
  ["From Conviction to Capital", "From Evidence to Adoption"],
  ["Venture · Content Curator", "Policy · Content Curator"],
  ["Access to capital", "Evidence to adoption"],
  ["Advocacy & networks", "Policy & coalitions"],
  ["Learn by doing", "Innovation at scale"],
  ["Courage to iterate", "Equity & opportunity"],
  ["Add one session connecting advocacy to early-stage capital.", "Add one session connecting evidence, policy, and practical adoption."]
];

for (const [orig, dest] of replacements) {
  const occurrences = content.split(orig).length - 1;
  console.log(`Original: "${orig}" -> Count: ${occurrences}`);
}

