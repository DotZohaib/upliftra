const fs = require('fs');
let code = fs.readFileSync('src/lib/storage.ts', 'utf8');

// Inject imports
if (!code.includes('import { opportunitiesApi, applicationsApi')) {
  code = code.replace(
    /import \{[^}]+\} from '\.\.\/data\/seedData';/,
    match => match + "\nimport { opportunitiesApi, applicationsApi, mentorsApi, communityApi, eventsApi, startupsApi, coursesApi, notificationsApi, connectionsApi, usersApi } from './api';"
  );
}

const patches = [
  {
    find: /export function addOpportunity\(opportunity: Opportunity\): void \{\s*const list = getOpportunities\(\);\s*list\.unshift\(opportunity\);\s*saveOpportunities\(list\);\s*\}/,
    replace: `export function addOpportunity(opportunity: Opportunity): void {
  const list = getOpportunities();
  list.unshift(opportunity);
  saveOpportunities(list);
  opportunitiesApi.create(opportunity).catch(console.error);
}`
  },
  {
    find: /export function updateOpportunity\(opportunity: Opportunity\): void \{\s*const list = getOpportunities\(\);\s*const index = list\.findIndex\(\(o\) => o\.id === opportunity\.id\);\s*if \(index !== -1\) \{\s*list\[index\] = opportunity;\s*saveOpportunities\(list\);\s*\}\s*\}/,
    replace: `export function updateOpportunity(opportunity: Opportunity): void {
  const list = getOpportunities();
  const index = list.findIndex((o) => o.id === opportunity.id);
  if (index !== -1) {
    list[index] = opportunity;
    saveOpportunities(list);
    opportunitiesApi.update(opportunity.id, opportunity).catch(console.error);
  }
}`
  },
  {
    find: /export function deleteOpportunity\(id: string\): void \{\s*const list = getOpportunities\(\);\s*const filtered = list\.filter\(\(o\) => o\.id !== id\);\s*saveOpportunities\(filtered\);\s*\}/,
    replace: `export function deleteOpportunity(id: string): void {
  const list = getOpportunities();
  const filtered = list.filter((o) => o.id !== id);
  saveOpportunities(filtered);
  opportunitiesApi.delete(id).catch(console.error);
}`
  },
  {
    find: /export function submitApplication\(app: Omit<Application, 'id' | 'appliedDate'>\): Application \{\s*const list = getApplications\(\);\s*const newApp: Application = \{\s*\.\.\.app,\s*id: `app_\$\{Date\.now\(\)\}`,\s*appliedDate: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\],\s*status: 'Submitted',\s*\};\s*list\.unshift\(newApp\);\s*saveApplications\(list\);\s*return newApp;\s*\}/,
    replace: `export function submitApplication(app: Omit<Application, 'id' | 'appliedDate'>): Application {
  const list = getApplications();
  const newApp: Application = {
    ...app,
    id: \`app_\${Date.now()}\`,
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'Submitted',
  };
  list.unshift(newApp);
  saveApplications(list);
  applicationsApi.create(app).catch(console.error);
  return newApp;
}`
  },
  {
    find: /export function updateApplicationStatus\(id: string, status: Application\['status'\]\): void \{\s*const list = getApplications\(\);\s*const idx = list\.findIndex\(\(a\) => a\.id === id\);\s*if \(idx !== -1\) \{\s*list\[idx\]\.status = status;\s*list\[idx\]\.reviewedDate = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];\s*saveApplications\(list\);\s*\}\s*\}/,
    replace: `export function updateApplicationStatus(id: string, status: Application['status']): void {
  const list = getApplications();
  const idx = list.findIndex((a) => a.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    list[idx].reviewedDate = new Date().toISOString().split('T')[0];
    saveApplications(list);
    applicationsApi.update(id, { status }).catch(console.error);
  }
}`
  }
];

let modified = code;
patches.forEach(p => {
  if (p.find.test(modified)) {
    modified = modified.replace(p.find, p.replace);
  } else {
    console.log("Failed to match:", p.find);
  }
});

fs.writeFileSync('src/lib/storage.ts', modified);
console.log("Refactored storage.ts successfully.");
