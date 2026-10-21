// ============================================================
// SUR ontology schema graph for Neo4j
// Semantic User Representation
// ============================================================

// Optional reset: uncomment only when you want to remove the SUR graph.
// MATCH (n:SUR) DETACH DELETE n;

CREATE CONSTRAINT sur_id_unique IF NOT EXISTS
FOR (n:SUR) REQUIRE n.id IS UNIQUE;

// ------------------------------------------------------------
// 1. Core user and profile classes
// ------------------------------------------------------------
MERGE (user:SUR:UserCore {id:'sur:User'})
SET user.name = 'User',
    user.koreanName = '사용자',
    user.definition = 'A person who explores and uses digital natural-heritage information.';

MERGE (knowledge:SUR:ProfileClass {id:'sur:KnowledgeProfile'})
SET knowledge.name = 'KnowledgeProfile',
    knowledge.koreanName = '전문성 프로파일',
    knowledge.definition = 'The user’s knowledge level and domain familiarity.';

MERGE (purposeProfile:SUR:ProfileClass {id:'sur:PurposeProfile'})
SET purposeProfile.name = 'PurposeProfile',
    purposeProfile.koreanName = '목적 프로파일',
    purposeProfile.definition = 'The current purpose of information exploration.';

MERGE (preference:SUR:ProfileClass {id:'sur:PreferenceProfile'})
SET preference.name = 'PreferenceProfile',
    preference.koreanName = '정보 선호 프로파일',
    preference.definition = 'The types and forms of information preferred by the user.';

MERGE (behavior:SUR:ProfileClass {id:'sur:ExplorationBehavior'})
SET behavior.name = 'ExplorationBehavior',
    behavior.koreanName = '탐색 행동',
    behavior.definition = 'Behavioral characteristics shown during information exploration.';

MERGE (contextual:SUR:ProfileClass {id:'sur:ContextualExplorationProfile'})
SET contextual.name = 'ContextualExplorationProfile',
    contextual.koreanName = '맥락적 탐색 프로파일',
    contextual.definition = 'An inferred exploration profile activated by user context.';

// ------------------------------------------------------------
// 2. Profile dimensions
// ------------------------------------------------------------
MERGE (expertise:SUR:ProfileDimension {id:'sur:ExpertiseLevel'})
SET expertise.name = 'ExpertiseLevel',
    expertise.koreanName = '전문성 수준';

MERGE (purpose:SUR:ProfileDimension {id:'sur:ExplorationPurpose'})
SET purpose.name = 'ExplorationPurpose',
    purpose.koreanName = '탐색 목적';

MERGE (infoPreference:SUR:ProfileDimension {id:'sur:InformationPreference'})
SET infoPreference.name = 'InformationPreference',
    infoPreference.koreanName = '정보 선호';

MERGE (behaviorType:SUR:ProfileDimension {id:'sur:BehaviorType'})
SET behaviorType.name = 'BehaviorType',
    behaviorType.koreanName = '탐색 행동 유형';

// ------------------------------------------------------------
// 3. Expertise values
// ------------------------------------------------------------
MERGE (novice:SUR:ProfileValue:ExpertiseValue {id:'sur:Novice'})
SET novice.name = 'Novice', novice.koreanName = '기초';
MERGE (intermediate:SUR:ProfileValue:ExpertiseValue {id:'sur:Intermediate'})
SET intermediate.name = 'Intermediate', intermediate.koreanName = '중급';
MERGE (expert:SUR:ProfileValue:ExpertiseValue {id:'sur:Expert'})
SET expert.name = 'Expert', expert.koreanName = '고급';

// ------------------------------------------------------------
// 4. Purpose values
// ------------------------------------------------------------
MERGE (analysis:SUR:ProfileValue:PurposeValue {id:'sur:ResearchAnalysis'})
SET analysis.name = 'ResearchAnalysis', analysis.koreanName = '연구·분석';
MERGE (education:SUR:ProfileValue:PurposeValue {id:'sur:EducationInterpretation'})
SET education.name = 'EducationInterpretation', education.koreanName = '교육·해설';
MERGE (content:SUR:ProfileValue:PurposeValue {id:'sur:ContentCreation'})
SET content.name = 'ContentCreation', content.koreanName = '콘텐츠 제작';
MERGE (participation:SUR:ProfileValue:PurposeValue {id:'sur:CitizenParticipation'})
SET participation.name = 'CitizenParticipation', participation.koreanName = '시민 참여';

// ------------------------------------------------------------
// 5. Information-preference values
// ------------------------------------------------------------
MERGE (bioPref:SUR:ProfileValue:PreferenceValue {id:'sur:BiodiversityInformationPreference'})
SET bioPref.name = 'BiodiversityInformationPreference', bioPref.koreanName = '생물다양성 정보 선호';
MERGE (heritagePref:SUR:ProfileValue:PreferenceValue {id:'sur:HeritageContextPreference'})
SET heritagePref.name = 'HeritageContextPreference', heritagePref.koreanName = '유산 맥락 선호';
MERGE (assetPref:SUR:ProfileValue:PreferenceValue {id:'sur:ThreeDAssetPreference'})
SET assetPref.name = 'ThreeDAssetPreference', assetPref.koreanName = '3D 자원 선호';
MERGE (spatialPref:SUR:ProfileValue:PreferenceValue {id:'sur:SpatiotemporalPreference'})
SET spatialPref.name = 'SpatiotemporalPreference', spatialPref.koreanName = '시공간 정보 선호';

// ------------------------------------------------------------
// 6. Behavior values
// ------------------------------------------------------------
MERGE (comparative:SUR:ProfileValue:BehaviorValue {id:'sur:ComparativeExploration'})
SET comparative.name = 'ComparativeExploration', comparative.koreanName = '비교 탐색';
MERGE (relational:SUR:ProfileValue:BehaviorValue {id:'sur:RelationshipExploration'})
SET relational.name = 'RelationshipExploration', relational.koreanName = '관계 중심 탐색';
MERGE (narrative:SUR:ProfileValue:BehaviorValue {id:'sur:StoryBasedExploration'})
SET narrative.name = 'StoryBasedExploration', narrative.koreanName = '스토리 중심 탐색';
MERGE (reuse:SUR:ProfileValue:BehaviorValue {id:'sur:VisualReuse'})
SET reuse.name = 'VisualReuse', reuse.koreanName = '시각 자원 활용';

// ------------------------------------------------------------
// 7. Inferred contextual exploration profiles
// ------------------------------------------------------------
MERGE (analyticalProfile:SUR:ContextualProfile {id:'sur:AnalyticalExplorationProfile'})
SET analyticalProfile.name = 'AnalyticalExplorationProfile',
    analyticalProfile.koreanName = '연구·분석 탐색 프로파일';

MERGE (contentProfile:SUR:ContextualProfile {id:'sur:ContentCreationProfile'})
SET contentProfile.name = 'ContentCreationProfile',
    contentProfile.koreanName = '콘텐츠 제작 프로파일';

MERGE (citizenProfile:SUR:ContextualProfile {id:'sur:CitizenParticipationProfile'})
SET citizenProfile.name = 'CitizenParticipationProfile',
    citizenProfile.koreanName = '시민 참여 프로파일';

MERGE (heritageProfile:SUR:ContextualProfile {id:'sur:HeritageInterpretationProfile'})
SET heritageProfile.name = 'HeritageInterpretationProfile',
    heritageProfile.koreanName = '유산 해설 프로파일';

// ------------------------------------------------------------
// 8. Core profile relationships
// ------------------------------------------------------------
MATCH (user:SUR {id:'sur:User'}),
      (knowledge:SUR {id:'sur:KnowledgeProfile'}),
      (purposeProfile:SUR {id:'sur:PurposeProfile'}),
      (preference:SUR {id:'sur:PreferenceProfile'}),
      (behavior:SUR {id:'sur:ExplorationBehavior'}),
      (contextual:SUR {id:'sur:ContextualExplorationProfile'}),
      (expertise:SUR {id:'sur:ExpertiseLevel'}),
      (purpose:SUR {id:'sur:ExplorationPurpose'}),
      (infoPreference:SUR {id:'sur:InformationPreference'}),
      (behaviorType:SUR {id:'sur:BehaviorType'})
MERGE (user)-[:HAS_KNOWLEDGE_PROFILE]->(knowledge)
MERGE (user)-[:HAS_PURPOSE_PROFILE]->(purposeProfile)
MERGE (user)-[:HAS_PREFERENCE_PROFILE]->(preference)
MERGE (user)-[:EXHIBITS_BEHAVIOR]->(behavior)
MERGE (user)-[:MAY_ACTIVATE]->(contextual)
MERGE (knowledge)-[:HAS_EXPERTISE_LEVEL]->(expertise)
MERGE (purposeProfile)-[:HAS_EXPLORATION_PURPOSE]->(purpose)
MERGE (preference)-[:HAS_INFORMATION_PREFERENCE]->(infoPreference)
MERGE (behavior)-[:HAS_BEHAVIOR_TYPE]->(behaviorType);

// ------------------------------------------------------------
// 9. Connect dimensions to values
// ------------------------------------------------------------
MATCH (expertise:SUR {id:'sur:ExpertiseLevel'}),
      (novice:SUR {id:'sur:Novice'}),
      (intermediate:SUR {id:'sur:Intermediate'}),
      (expert:SUR {id:'sur:Expert'}),
      (purpose:SUR {id:'sur:ExplorationPurpose'}),
      (analysis:SUR {id:'sur:ResearchAnalysis'}),
      (education:SUR {id:'sur:EducationInterpretation'}),
      (content:SUR {id:'sur:ContentCreation'}),
      (participation:SUR {id:'sur:CitizenParticipation'}),
      (infoPreference:SUR {id:'sur:InformationPreference'}),
      (bioPref:SUR {id:'sur:BiodiversityInformationPreference'}),
      (heritagePref:SUR {id:'sur:HeritageContextPreference'}),
      (assetPref:SUR {id:'sur:ThreeDAssetPreference'}),
      (spatialPref:SUR {id:'sur:SpatiotemporalPreference'}),
      (behaviorType:SUR {id:'sur:BehaviorType'}),
      (comparative:SUR {id:'sur:ComparativeExploration'}),
      (relational:SUR {id:'sur:RelationshipExploration'}),
      (narrative:SUR {id:'sur:StoryBasedExploration'}),
      (reuse:SUR {id:'sur:VisualReuse'})
MERGE (expertise)-[:HAS_VALUE]->(novice)
MERGE (expertise)-[:HAS_VALUE]->(intermediate)
MERGE (expertise)-[:HAS_VALUE]->(expert)
MERGE (purpose)-[:HAS_VALUE]->(analysis)
MERGE (purpose)-[:HAS_VALUE]->(education)
MERGE (purpose)-[:HAS_VALUE]->(content)
MERGE (purpose)-[:HAS_VALUE]->(participation)
MERGE (infoPreference)-[:HAS_VALUE]->(bioPref)
MERGE (infoPreference)-[:HAS_VALUE]->(heritagePref)
MERGE (infoPreference)-[:HAS_VALUE]->(assetPref)
MERGE (infoPreference)-[:HAS_VALUE]->(spatialPref)
MERGE (behaviorType)-[:HAS_VALUE]->(comparative)
MERGE (behaviorType)-[:HAS_VALUE]->(relational)
MERGE (behaviorType)-[:HAS_VALUE]->(narrative)
MERGE (behaviorType)-[:HAS_VALUE]->(reuse);

// ------------------------------------------------------------
// 10. Contextual profiles and activation conditions
// ------------------------------------------------------------
MATCH (contextual:SUR {id:'sur:ContextualExplorationProfile'}),
      (analyticalProfile:SUR {id:'sur:AnalyticalExplorationProfile'}),
      (contentProfile:SUR {id:'sur:ContentCreationProfile'}),
      (citizenProfile:SUR {id:'sur:CitizenParticipationProfile'}),
      (heritageProfile:SUR {id:'sur:HeritageInterpretationProfile'}),
      (intermediate:SUR {id:'sur:Intermediate'}),
      (expert:SUR {id:'sur:Expert'}),
      (analysis:SUR {id:'sur:ResearchAnalysis'}),
      (education:SUR {id:'sur:EducationInterpretation'}),
      (content:SUR {id:'sur:ContentCreation'}),
      (participation:SUR {id:'sur:CitizenParticipation'}),
      (bioPref:SUR {id:'sur:BiodiversityInformationPreference'}),
      (heritagePref:SUR {id:'sur:HeritageContextPreference'}),
      (assetPref:SUR {id:'sur:ThreeDAssetPreference'}),
      (spatialPref:SUR {id:'sur:SpatiotemporalPreference'}),
      (comparative:SUR {id:'sur:ComparativeExploration'}),
      (relational:SUR {id:'sur:RelationshipExploration'}),
      (narrative:SUR {id:'sur:StoryBasedExploration'}),
      (reuse:SUR {id:'sur:VisualReuse'})
MERGE (analyticalProfile)-[:SUBCLASS_OF]->(contextual)
MERGE (contentProfile)-[:SUBCLASS_OF]->(contextual)
MERGE (citizenProfile)-[:SUBCLASS_OF]->(contextual)
MERGE (heritageProfile)-[:SUBCLASS_OF]->(contextual)
MERGE (analyticalProfile)-[:ACTIVATED_BY]->(analysis)
MERGE (analyticalProfile)-[:ASSOCIATED_WITH]->(intermediate)
MERGE (analyticalProfile)-[:ASSOCIATED_WITH]->(expert)
MERGE (analyticalProfile)-[:PREFERS]->(bioPref)
MERGE (analyticalProfile)-[:EXHIBITS]->(comparative)
MERGE (contentProfile)-[:ACTIVATED_BY]->(content)
MERGE (contentProfile)-[:PREFERS]->(assetPref)
MERGE (contentProfile)-[:EXHIBITS]->(reuse)
MERGE (citizenProfile)-[:ACTIVATED_BY]->(participation)
MERGE (citizenProfile)-[:PREFERS]->(spatialPref)
MERGE (citizenProfile)-[:EXHIBITS]->(narrative)
MERGE (heritageProfile)-[:ACTIVATED_BY]->(education)
MERGE (heritageProfile)-[:PREFERS]->(heritagePref)
MERGE (heritageProfile)-[:EXHIBITS]->(relational);

// ------------------------------------------------------------
// 11. Visualization query
// ------------------------------------------------------------
MATCH p=(n:SUR)-[r]->(m:SUR)
RETURN p;
