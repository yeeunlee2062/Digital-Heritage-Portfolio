# 검증 결과 — 빌드 c5f14121ce52 (fe63222)

노드 705, 관계 2216(KG v4.3 2216 + 주석 관계 0)

| 구분 | 역량질문 | 질의 결과 | 기대값 | 판정 |
|---|---|---|---|---|
| CQ0 | 전체 개체와 관계의 참조 무결성과 연결 완전성이 확보되는가 | `{"nodes": 705, "relationships": 2216, "duplicate_ids": 0, "broken_references": 0, "missing_required_fields": 0, "orphan_nodes": 0, "annotationRelationships": 0, "totalRelationships": 2216}` | `{"nodes": 705, "relationships": 2216, "duplicate_ids": 0, "broken_references": 0, "missing_required_fields": 0, "orphan_nodes": 0}` | PASS |
| CQ1 | 제작공정이 실제 수행 순서에 따라 복원되는가 | `{"processes": 11, "sequence": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}` | `{"processes": 11, "sequence": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}` | PASS |
| CQ2 | Movement 중심 참조만으로 직물짜기 공정의 동작, 도구 및 재료 관계가 복원되는가 | `{"movementCount": 8, "toolCount": 22, "inputMaterialCount": 2, "outputMaterialCount": 1}` | `{"movementCount": 8, "toolCount": 22, "inputMaterialCount": 2, "outputMaterialCount": 1}` | PASS |
| CQ3 | 4D 기록화 사업(DGP_002)의 실연, 애셋 및 아이템 생산계보가 복원되는가 | `{"performanceCount": 4, "assetCount": 19, "itemCount": 41}` | `{"performanceCount": 4, "assetCount": 19, "itemCount": 41}` | PASS |
| CQ4 | 개별 3D 아이템(ITM_016)에서 실제 실연자와 관련 공정까지 역방향으로 추적할 수 있는가 | `{"asset": "AST_010", "project": "DGP_002", "performance": "PER_003", "transmitter": "TRM_009", "agent": "AGT_009", "process": "PRC_010"}` | `{"asset": "AST_010", "project": "DGP_002", "performance": "PER_003", "transmitter": "TRM_009", "agent": "AGT_009", "process": "PRC_010"}` | PASS |
| CQ5 | 디지털 애셋(AST_005)에서 권리자와 적용 이용허락을 조회할 수 있는가 | `{"rightCount": 6, "licenceCount": 1, "licences": ["LIC_002"], "holders": ["AGT_009", "AGT_014"], "basisRights": ["RGT_005", "RGT_006"]}` | `{"rightCount": 6, "licenceCount": 1, "licences": ["LIC_002"], "holders": ["AGT_009", "AGT_014"]}` | PASS |
| CQ6 | 4D 아이템의 시간 기반 기록이 세부 동작과 연결되는가(동작 주석 후 충족) | `{"fourDItemCount": 2, "annotatedItemCount": 2, "timedSegments": 0, "unannotatedItems": [], "status": "PARTIAL"}` | `{"fourDItemCount": 2, "annotatedItemCount": 2}` | PARTIAL |
| CQ7 | 공정별 입력재료와 산출재료를 통해 재료의 상태 변화를 추적할 수 있는가 | `{"processesWithInputAndOutput": 11}` | `{"processesWithInputAndOutput": 11}` | PASS |
| CQ8 | 스키마 4차의 관계 정의가 데이터 인스턴스와 일관되게 대응하는가 | `{"schemaRelationDefinitions": 56, "uniqueRelationshipTypes": 55, "materializedDefinitions": 54, "definitionsWithoutInstance": ["Agent-[RECEIVES_LICENCE]->Licence", "Licence-[HAS_GRANTEE]->Agent"], "undefinedTypes": []}` | `{"schemaRelationDefinitions": 56, "uniqueRelationshipTypes": 55, "materializedDefinitions": 54, "definitionsWithoutInstance": ["Agent-[RECEIVES_LICENCE]->Licence", "Licence-[HAS_GRANTEE]->Agent"]}` | PASS_WITH_EMPTY_OPTIONAL_RELATIONS |

CQ8 주석 포함: 관계 정의 56건 중 인스턴스가 있는 정의 54건(빈 정의: Agent-[RECEIVES_LICENCE]->Licence, Licence-[HAS_GRANTEE]->Agent). CQ6 판정: 시간 구간이 있으면 PASS, 프레임 없는 동작 참조만 있으면 PARTIAL.

## 웹 보조 데이터

- W1 4D 직조 도구 역할표: 19행, 제직 단계 [1, 2, 3, 4, 5, 6], 도구 15개 (PRC_010.weaving_tool_roles)
- W2 웹 레이어 아이템: {"space": "ITM_001", "motion": "ITM_008", "loom:line": "ITM_016", "loom:noline": "ITM_021"}
- W3 직물짜기 동작 8개의 제직 단계: {"1": "제직 준비 및 장력 설정", "2": "날실개구", "3": "씨실투입", "4": "바디치기", "5": "날실풀기", "6": "직물감기"}

## 무결성

- 오류 없음
