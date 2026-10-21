(function(){
  'use strict';
  const graph = window.NHO_GRAPH;
  if(!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)){
    throw new Error('NHO graph data was not loaded.');
  }

  const nodeById = new Map(graph.nodes.map(n => [n.id, n]));
  const adjacency = new Map();
  const addAdj = (id, value) => {
    if(!adjacency.has(id)) adjacency.set(id, []);
    adjacency.get(id).push(value);
  };
  graph.edges.forEach(edge => {
    addAdj(edge.source, {nodeId: edge.target, edge, direction: 'out'});
    addAdj(edge.target, {nodeId: edge.source, edge, direction: 'in'});
  });

  const PROFILE_RELATION_MATRIX = {
    er: {
      HAS_SPECIMEN:1.00, HAS_OBSERVATION:0.95, DIGITIZED_AS:0.78,
      HAS_FILE:0.66, DOCUMENTED_BY:0.48, DESIGNATED_AS:0.42,
      INCLUDES_SPECIMEN:0.36, PRODUCED_INSTANCE:0.34
    },
    cc: {
      HAS_SPECIMEN:0.58, HAS_OBSERVATION:0.38, DIGITIZED_AS:0.98,
      HAS_FILE:1.00, DOCUMENTED_BY:0.70, DESIGNATED_AS:0.55,
      INCLUDES_SPECIMEN:0.55, PRODUCED_INSTANCE:0.82
    },
    cs: {
      HAS_SPECIMEN:0.52, HAS_OBSERVATION:1.00, DIGITIZED_AS:0.34,
      HAS_FILE:0.28, DOCUMENTED_BY:0.58, DESIGNATED_AS:0.72,
      INCLUDES_SPECIMEN:0.24, PRODUCED_INSTANCE:0.22
    },
    hi: {
      HAS_SPECIMEN:0.44, HAS_OBSERVATION:0.62, DIGITIZED_AS:0.42,
      HAS_FILE:0.36, DOCUMENTED_BY:1.00, DESIGNATED_AS:0.98,
      INCLUDES_SPECIMEN:0.30, PRODUCED_INSTANCE:0.32
    }
  };

  /*
   * Operational priorities derived from the Kano–QFD requirement classes.
   * They are isolated in configuration so final normalized QFD values can
   * replace them without changing the graph-search algorithm.
   */
  const QFD_NODE_PRIORITY = {
    Nature:0.675, Specimen:0.675, Observation:0.675, Heritage:0.783,
    Resource:0.783, Project:0.675, Instance:0.800, Item:0.800
  };

  const DEFAULTS = {
    maxDepth:3, topK:24, maxPerType:8, eta:0.55, lambda:0.25, beta:0.20
  };

  const EXPANDABLE_TYPES = new Set(['Nature','Specimen','Instance']);

  function normalizeProfileScores(rawScores){
    const keys = Object.keys(PROFILE_RELATION_MATRIX);
    const positive = Object.fromEntries(keys.map(k => [k, Math.max(0, Number(rawScores[k] || 0))]));
    const total = Object.values(positive).reduce((a,b) => a+b, 0);
    if(total <= 0){
      return {er:0.25, cc:0.25, cs:0.25, hi:0.25};
    }
    return Object.fromEntries(keys.map(k => [k, positive[k] / total]));
  }

  function relationWeights(profileAlpha){
    const weights = {};
    const relationTypes = new Set(graph.edges.map(e => e.type));
    relationTypes.forEach(type => {
      let value = 0;
      Object.entries(profileAlpha).forEach(([profile, alpha]) => {
        value += alpha * (PROFILE_RELATION_MATRIX[profile]?.[type] || 0);
      });
      weights[type] = value;
    });
    return weights;
  }

  function nodePriority(node){
    return QFD_NODE_PRIORITY[node?.type] ?? 0.70;
  }

  function pathScore(pathEdges, candidateNode, relWeights, options){
    if(!pathEdges.length) return 1;
    const meanRelation = pathEdges.reduce(
      (sum, edge) => sum + (relWeights[edge.type] || 0), 0
    ) / pathEdges.length;
    const distance = pathEdges.length;
    return options.eta * meanRelation
      + options.lambda * (1 / (1 + distance))
      + options.beta * nodePriority(candidateNode);
  }

  function retrieve(centerId, profileAlpha, suppliedOptions){
    const options = Object.assign({}, DEFAULTS, suppliedOptions || {});
    if(!nodeById.has(centerId)) throw new Error(`Unknown graph node: ${centerId}`);
    const relWeights = relationWeights(profileAlpha);
    const best = new Map();
    const stack = [{
      nodeId:centerId,
      nodePath:[centerId],
      edgePath:[]
    }];

    while(stack.length){
      const current = stack.pop();
      const currentNode = nodeById.get(current.nodeId);
      const depth = current.edgePath.length;

      if(depth > 0){
        const score = pathScore(current.edgePath, currentNode, relWeights, options);
        const prior = best.get(current.nodeId);
        if(!prior || score > prior.score){
          best.set(current.nodeId, {
            node:currentNode,
            score,
            distance:depth,
            nodePath:[...current.nodePath],
            edgePath:[...current.edgePath]
          });
        }
      }

      if(depth >= options.maxDepth || !EXPANDABLE_TYPES.has(currentNode.type)){
        continue;
      }

      (adjacency.get(current.nodeId) || []).forEach(step => {
        if(current.nodePath.includes(step.nodeId)) return;
        const nextNode = nodeById.get(step.nodeId);
        if(!nextNode) return;
        stack.push({
          nodeId:step.nodeId,
          nodePath:[...current.nodePath, step.nodeId],
          edgePath:[...current.edgePath, step.edge]
        });
      });
    }

    const allRanked = [...best.values()]
      .sort((a,b) => b.score - a.score || a.distance - b.distance || a.node.id.localeCompare(b.node.id));
    const typeQuota = {};
    const ranked = [];
    for(const item of allRanked){
      const type = item.node.type;
      if((typeQuota[type] || 0) >= options.maxPerType) continue;
      ranked.push(item);
      typeQuota[type] = (typeQuota[type] || 0) + 1;
      if(ranked.length >= options.topK) break;
    }

    const selectedNodeIds = new Set([centerId]);
    const selectedEdgeIds = new Set();
    ranked.forEach(item => {
      item.nodePath.forEach(id => selectedNodeIds.add(id));
      item.edgePath.forEach(edge => selectedEdgeIds.add(edge.id));
    });

    const selectedNodes = [...selectedNodeIds].map(id => nodeById.get(id)).filter(Boolean);
    const selectedEdges = graph.edges.filter(edge => selectedEdgeIds.has(edge.id));

    const domainBuckets = {Biodiversity:[], Heritage:[], Digitization:[]};
    ranked.forEach(item => {
      const domain = item.node.domain === 'Provenance' ? 'Digitization' : item.node.domain;
      if(domainBuckets[domain]) domainBuckets[domain].push(item.score);
    });
    const domainRaw = Object.fromEntries(Object.entries(domainBuckets).map(([domain,values]) => {
      const top = values.sort((a,b)=>b-a).slice(0,5);
      return [domain, top.length ? top.reduce((a,b)=>a+b,0)/top.length : 0];
    }));
    const domainTotal = Object.values(domainRaw).reduce((a,b) => a+b, 0) || 1;
    const domainScores = Object.fromEntries(
      Object.entries(domainRaw).map(([k,v]) => [k, v / domainTotal])
    );

    const typeBuckets = {};
    ranked.forEach(item => {
      (typeBuckets[item.node.type]??=[]).push(item.score);
    });
    const typeScores = Object.fromEntries(Object.entries(typeBuckets).map(([type,values]) => [
      type, values.reduce((a,b)=>a+b,0)/values.length
    ]));

    return {
      center:nodeById.get(centerId),
      profileAlpha,
      relationWeights:relWeights,
      ranked,
      nodes:selectedNodes,
      edges:selectedEdges,
      domainScores,
      typeScores,
      options
    };
  }

  function pathText(item){
    const parts = [];
    item.nodePath.forEach((nodeId, index) => {
      const node = nodeById.get(nodeId);
      parts.push(node?.label || nodeId);
      if(index < item.edgePath.length){
        parts.push(`—${item.edgePath[index].type}→`);
      }
    });
    return parts.join(' ');
  }

  function rankNature(profileAlpha, query){
    const relWeights = relationWeights(profileAlpha);
    const term = String(query || '').trim().toLowerCase();
    return graph.nodes
      .filter(node => node.type === 'Nature')
      .filter(node => {
        if(!term) return true;
        const haystack = [
          node.label,
          node.properties?.['영명'],
          node.properties?.['학명(Binomial name)']
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(term);
      })
      .map(node => {
        const incident = adjacency.get(node.id) || [];
        const relationScore = incident.reduce(
          (sum, step) => sum + (relWeights[step.edge.type] || 0), 0
        );
        const diversity = new Set(incident.map(step => step.edge.type)).size;
        const score = relationScore + diversity * 0.15 + nodePriority(node);
        return {node, score, degree:incident.length};
      })
      .sort((a,b) => b.score-a.score || b.degree-a.degree || a.node.id.localeCompare(b.node.id));
  }

  function featureScores(result){
    const scoreByType = result.typeScores;
    return {
      biodiversity:(scoreByType.Nature||0)+(scoreByType.Specimen||0)+(scoreByType.Observation||0),
      viewer:(scoreByType.Instance||0)+(scoreByType.Item||0),
      story:(scoreByType.Heritage||0)+(scoreByType.Resource||0),
      map:(scoreByType.Observation||0)+(scoreByType.Heritage||0)*0.15,
      filter:Object.values(scoreByType).reduce((a,b)=>a+b,0)*0.20
    };
  }

  function defaultTab(result){
    const primary = Object.entries(result.profileAlpha || {})
      .sort((a,b)=>b[1]-a[1])[0]?.[0];
    const profileTab = {er:'specimen',cc:'asset',cs:'observation',hi:'heritage'};
    if(profileTab[primary]) return profileTab[primary];
    const candidates = {
      specimen:(result.typeScores.Specimen||0)+(result.typeScores.Nature||0)*0.2,
      observation:(result.typeScores.Observation||0),
      heritage:(result.typeScores.Heritage||0)+(result.typeScores.Resource||0),
      asset:(result.typeScores.Instance||0)+(result.typeScores.Item||0)
    };
    return Object.entries(candidates).sort((a,b)=>b[1]-a[1])[0][0];
  }

  window.NEXUS_GRAPH_ENGINE = {
    graph,
    nodeById,
    adjacency,
    PROFILE_RELATION_MATRIX,
    QFD_NODE_PRIORITY,
    normalizeProfileScores,
    relationWeights,
    retrieve,
    pathText,
    rankNature,
    featureScores,
    defaultTab
  };
})();
