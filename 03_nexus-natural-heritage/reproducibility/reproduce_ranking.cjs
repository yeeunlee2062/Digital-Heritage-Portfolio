'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const directory = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(directory, 'analysis_config.json'), 'utf8'));
const graph = JSON.parse(fs.readFileSync(path.join(directory, 'data/ranking_graph_minimal.json'), 'utf8'));
const source = fs.readFileSync(path.join(directory, 'nexus_graph_engine_qfd_final.js'), 'utf8');
const marker = '      ranked,\n';
assert(source.includes(marker), 'Engine output shape has changed');
// Exposes the engine's existing, pre-quota candidate list; scoring is unchanged.
const context = {window: {NHO_GRAPH: graph}};
vm.runInNewContext(source.replace(marker, marker + '      allRanked,\n'), context);
const engine = context.window.NEXUS_GRAPH_ENGINE;
const ids = config.focal_ids;
const profiles = config.profiles;
const originalMatrix = JSON.parse(JSON.stringify(engine.PROFILE_RELATION_MATRIX));

const mean = items => items.reduce((a, b) => a + b, 0) / items.length;
const round = x => Math.round((x + Number.EPSILON) * 1000) / 1000;
const overlap = (a, b, k) => b.slice(0, k).filter(x => new Set(a.slice(0, k)).has(x)).length / k;
function jaccard(a, b) {
  const common = new Set(a.filter(x => b.includes(x))).size;
  return common / (a.length + b.length - common);
}
function kendall(a, b) {
  assert(a.length === b.length && a.every(x => b.includes(x)), 'Kendall tau requires identical returned node sets');
  const positions = new Map(b.map((x, i) => [x, i]));
  let concordant = 0, discordant = 0;
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
    if (positions.get(a[i]) < positions.get(a[j])) concordant++;
    else discordant++;
  }
  return (concordant - discordant) / (concordant + discordant);
}
function retrieve(id, p, options = {}) {
  return engine.retrieve(id, {[p]: 1}, options);
}
const list = result => result.ranked.map(item => item.node.id);
const base = new Map();
const conditions = [];
for (const id of ids) for (const p of profiles) {
  const value = retrieve(id, p);
  base.set(`${id}:${p}`, value);
  conditions.push({id, p, eligible: value.allRanked.length, size: value.ranked.length});
}
const report = {config: {focal_ids: ids, profiles, cases: conditions.length, comparison_pairs: ids.length * 6}};
report.coverage = {
  eligible_mean: round(mean(conditions.map(x => x.eligible))),
  eligible_range: [Math.min(...conditions.map(x => x.eligible)), Math.max(...conditions.map(x => x.eligible))],
  cases_above_K: conditions.filter(x => x.eligible > 24).length,
  returned_mean: round(mean(conditions.map(x => x.size))),
  cases_returning_K: conditions.filter(x => x.size === 24).length,
};
function contextMeans(options = {}) {
  const o5 = [], o10 = [], tau = [];
  for (const id of ids) {
    const ranks = profiles.map(p => list(retrieve(id, p, options)));
    for (let i = 0; i < ranks.length; i++) for (let j = i + 1; j < ranks.length; j++) {
      o5.push(overlap(ranks[i], ranks[j], 5));
      o10.push(overlap(ranks[i], ranks[j], 10));
      tau.push(kendall(ranks[i], ranks[j]));
    }
  }
  return {overlap5: round(mean(o5)), overlap10: round(mean(o10)), kendall: round(mean(tau))};
}
function uniformMatrix(active) {
  for (const p of profiles) for (const r of Object.keys(originalMatrix[p])) {
    engine.PROFILE_RELATION_MATRIX[p][r] = active ? 1 : originalMatrix[p][r];
  }
}
function evaluateVariant(options = {}, uniform = false) {
  uniformMatrix(uniform);
  const agreement10 = [], agreementTau = [], o5 = [], o10 = [], tau = [];
  for (const id of ids) {
    const ranks = profiles.map(p => {
      const current = list(retrieve(id, p, options));
      const initial = list(base.get(`${id}:${p}`));
      agreement10.push(overlap(current, initial, 10));
      agreementTau.push(kendall(current, initial));
      return current;
    });
    for (let i = 0; i < ranks.length; i++) for (let j = i + 1; j < ranks.length; j++) {
      o5.push(overlap(ranks[i], ranks[j], 5));
      o10.push(overlap(ranks[i], ranks[j], 10));
      tau.push(kendall(ranks[i], ranks[j]));
    }
  }
  uniformMatrix(false);
  return {agreement_overlap10: round(mean(agreement10)), agreement_kendall: round(mean(agreementTau)), context_overlap5: round(mean(o5)), context_overlap10: round(mean(o10)), context_kendall: round(mean(tau))};
}
report.table8 = {
  full: contextMeans(),
  no_relational_compatibility: evaluateVariant({eta: 0, lambda: .25 / .45, beta: .20 / .45}),
  no_proximity: evaluateVariant({eta: .55 / .75, lambda: 0, beta: .20 / .75}),
  no_design_prior: evaluateVariant({eta: .55 / .8, lambda: .25 / .8, beta: 0}),
  uniform_affinities: evaluateVariant({}, true),
};
function parameterVariant(options) {
  const jj = [], tt = [], sizes = [], classes = [];
  for (const id of ids) for (const p of profiles) {
    const current = retrieve(id, p, options);
    const a = list(base.get(`${id}:${p}`)), b = list(current);
    jj.push(jaccard(a, b));
    if (a.length === b.length && a.every(x => b.includes(x))) tt.push(kendall(a, b));
    sizes.push(b.length);
    classes.push(new Set(current.ranked.map(x => x.node.type)).size);
  }
  return {jaccard: round(mean(jj)), kendall: tt.length === 48 ? round(mean(tt)) : null, mean_size: round(mean(sizes)), mean_classes: round(mean(classes))};
}
report.tableC3 = {
  depth: Object.fromEntries([1, 2, 3].map(v => [v, parameterVariant({maxDepth: v})])),
  coefficients: Object.fromEntries([
    [.45, .30, .25], [.50, .28, .22], [.55, .25, .20], [.60, .23, .17], [.65, .20, .15]
  ].map(([eta, lambda, beta]) => [`${eta}/${lambda}/${beta}`, parameterVariant({eta, lambda, beta})])),
  quota: Object.fromEntries([4, 6, 12, 24].map(v => [v, parameterVariant({maxPerType: v})])),
};

// Affected profile only for perturbation agreement; all six profile pairs per
// focal node for each perturbed setting's cross-context range.
const sensitivity = {10: [], 20: []};
for (const affected of profiles) for (const relation of Object.keys(originalMatrix[affected])) {
  for (const delta of [-.10, +.10, -.20, +.20]) {
    const original = originalMatrix[affected][relation];
    engine.PROFILE_RELATION_MATRIX[affected][relation] = Math.max(0, Math.min(1, original * (1 + delta)));
    const a5 = [], a10 = [], at = [], top1 = [], c5 = [], c10 = [], ct = [];
    for (const id of ids) {
      const ranks = profiles.map(p => list(retrieve(id, p)));
      const reference = list(base.get(`${id}:${affected}`));
      const current = ranks[profiles.indexOf(affected)];
      a5.push(overlap(current, reference, 5));
      a10.push(overlap(current, reference, 10));
      at.push(kendall(current, reference));
      top1.push(Number(current[0] === reference[0]));
      for (let i = 0; i < ranks.length; i++) for (let j = i + 1; j < ranks.length; j++) {
        c5.push(overlap(ranks[i], ranks[j], 5));
        c10.push(overlap(ranks[i], ranks[j], 10));
        ct.push(kendall(ranks[i], ranks[j]));
      }
    }
    sensitivity[Math.abs(delta) * 100].push({agreement5: mean(a5), agreement10: mean(a10), agreementTau: mean(at), top1: mean(top1), context5: mean(c5), context10: mean(c10), contextTau: mean(ct)});
    engine.PROFILE_RELATION_MATRIX[affected][relation] = original;
  }
}
report.tableC3.affinity_sensitivity = Object.fromEntries(Object.entries(sensitivity).map(([magnitude, settings]) => [magnitude, {
  settings: settings.length,
  agreement_overlap5: round(mean(settings.map(x => x.agreement5))),
  agreement_overlap10: round(mean(settings.map(x => x.agreement10))),
  agreement_kendall: round(mean(settings.map(x => x.agreementTau))),
  top1_retained_percent: round(100 * mean(settings.map(x => x.top1))),
  cross_profile_overlap5_range: [round(Math.min(...settings.map(x => x.context5))), round(Math.max(...settings.map(x => x.context5)))],
  cross_profile_overlap10_range: [round(Math.min(...settings.map(x => x.context10))), round(Math.max(...settings.map(x => x.context10)))],
  cross_profile_kendall_range: [round(Math.min(...settings.map(x => x.contextTau))), round(Math.max(...settings.map(x => x.contextTau)))],
}]));

function expected(value, target, label) {
  assert(Math.abs(value - target) <= .001, `${label}: ${value} != ${target}`);
}
assert(report.coverage.cases_above_K === 48 && report.coverage.cases_returning_K === 8);
expected(report.coverage.eligible_mean, 49.333, 'candidate mean (49.33 at two decimals)');
expected(report.coverage.returned_mean, 16.75, 'returned mean');
expected(report.table8.full.overlap5, .303, 'context overlap 5');
expected(report.table8.full.overlap10, .625, 'context overlap 10');
expected(report.table8.full.kendall, .180, 'context kendall');
expected(report.table8.uniform_affinities.context_overlap10, 1, 'uniform baseline');
expected(report.tableC3.coefficients['0.55/0.25/0.2'].kendall, 1, 'true reference coefficient');
expected(report.tableC3.coefficients['0.6/0.23/0.17'].kendall, 1, 'other identical ranking coefficient');
expected(report.tableC3.affinity_sensitivity['20'].agreement_overlap10, .978, 'affinity agreement');
expected(report.tableC3.affinity_sensitivity['20'].agreement_kendall, .951, 'affinity tau');

fs.writeFileSync(path.join(directory, 'results_reproduced.json'), JSON.stringify(report, null, 2) + '\n');
process.stdout.write('ALL_CHECKS_PASSED; results_reproduced.json written\n');
process.stdout.write(JSON.stringify({coverage: report.coverage, table8: report.table8, affinity_sensitivity: report.tableC3.affinity_sensitivity}, null, 2) + '\n');
