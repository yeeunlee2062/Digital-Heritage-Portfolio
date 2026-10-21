# Traditional dance metadata specification (NoSQL, v12)

Scene-centred document model behind the Chunaengjeon platform: one collection per class, with JSON paths, input types, keys and references, obligation, and an example value from Chunaengjeon. Exported from the specification workbook (`전통춤_메타데이터_정의서_NoSQL_v12`); field names and descriptions are kept in the original Korean.

| # | Collection | Purpose (Korean original) | Fields |
|---|---|---|---|
| 1 | [Scene 컬렉션 (장면)](#1) | 장면 단위에서 종목, 동작, 악곡, 창사, 공간, 실연자 및 전승 근거의 관계를 연결하는 장면 중심 컬렉션 | 16 |
| 2 | [dances 컬렉션 (전통춤 종목)](#2) | 전통춤 종목의 명칭, 분류, 성립 배경 및 국가유산 지정 정보를 관리하는 종목 중심 컬렉션 | 18 |
| 3 | [Transmitter 컬렉션 (전승자)](#3) | 전통춤 전승에 참여한 개인 또는 단체의 지위, 활동 정보 및 장면 연계를 관리하는 전승자 컬렉션 | 13 |
| 4 | [movements 컬렉션 (춤사위)](#4) | 여러 종목에서 공유되는 춤사위의 명칭, 정의 및 출처를 관리하는 동작 어휘 컬렉션 | 7 |
| 5 | [pieces 컬렉션 (악곡)](#5) | 전통공연에 사용되는 악곡의 기본 정보와 계통별 형식, 속도 및 편성 정보를 관리하는 악곡 컬렉션 | 14 |
| 6 | [Instrument 컬렉션 (국악기)](#6) | 전통공연에 사용되는 국악기의 명칭, 유형, 음역, 연주 방식 및 음향 특성을 관리하는 국악기 컬렉션 | 11 |
| 7 | [lyrics 컬렉션](#7) | 전통공연에서 사용되는 창사의 구성, 구절, 번역 및 해석 근거를 관리하는 창사 컬렉션 | 13 |
| 8 | [Space 컬렉션 (공간 컬렉션)](#8) | 전통공연이 연행, 전승 또는 재현되는 장소의 명칭, 유형, 위치 및 역사적 맥락을 관리하는 공간 컬렉션 | 9 |
| 9 | [Ritual Event 컬렉션 (제례 컬렉션)](#9) | 제례의 절차와 행례, 의물, 제물 및 의례 공간의 관계를 관리하는 제례 컬렉션 | 12 |
| 10 | [Custume 컬렉션 (복식 컬렉션)](#10) | 전통공연의 등장인물 또는 실연자가 착용하는 복식 구성과 무구 정보를 관리하는 복식 컬렉션 | 9 |
| 11 | [Performance 컬렉션 (실연)](#11) | 공연, 시연 또는 촬영에서 발생한 실연 활동과 참여자, 장소 및 관리 정보를 관리하는 실연 컬렉션 | 14 |
| 12 | [Digital Project 컬렉션 (디지털화 사업)](#12) | 디지털 기록화와 변환 사업의 유형, 수행 기간, 장소, 생산기관 및 관리기관 정보를 관리하는 디지털화 사업 컬렉션 | 8 |
| 13 | [assets 컬렉션 — ④ 디지털 자산](#13) | 디지털화 사업에서 생산된 논리적 디지털 자산의 식별, 연계, 유형 및 내용을 관리하는 디지털 자산 컬렉션 | 8 |
| 14 | [Item 컬렉션 — Asset의 물리적 및 포맷별 표현](#14) | 하나의 Asset에서 파생되는 파일별 포맷, 용량, 저장 위치, 3D 및 4D 기술 사양과 접근 조건을 관리하는 Item 컬렉션 | 86 |

## <a id="1"></a>1. Scene 컬렉션 (장면)

장면 단위에서 종목, 동작, 악곡, 창사, 공간, 실연자 및 전승 근거의 관계를 연결하는 장면 중심 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 장면ID | _id | string | _id | 필수 | SNE_001 |
| 종목참조 | dance_ref | string | 참조 | 필수 | TIH_0001 |
| 동작참조 | movement_ref | string | 참조 | 선택 | MVM_001 |
| 악곡참조 | piece_ref | string | 참조 | 선택 | PCE_001 |
| 창사참조 | lyrics_ref | string | 참조 | 선택 | LYR_001 |
| 공간참조 | space_ref | string | 참조 | 선택 | SPC_001 |
| 실연자참조 | performer_ref | array<string> | 참조 | 선택 |  |
| 제례참조 | ritual_event_ref | string | 참조 | 선택 |  |
| 장면명칭 | scene_name | string | - | 선택 |  |
| 장단 | jangdan | string | - | 선택 | 인사장단 (반 장단) |
| 장구 악상기호 | janggu_symbol | string | - | 선택 | ⦶ |
| 동작순서 | motion_order | integer | - | 선택 | 1.0 |
| 세부동작 | detail_motion | text | - | 선택 | 가지고 있는 호흡을 한 번 더 이용해 포물선의 형식으로 단아하게 인사한다 |
| 전승자참조 | transmitter_ref | string | 참조 | 선택 | TRM_0001 |
| 전승계보유형 | lineage_basis_type | string | - | 선택 | 인적계보 |
| 참고문헌 | source_refs | array<string> | - | 선택 | ["국립국악원 『궁중무용무보』 제2집, 1987"] |

## <a id="2"></a>2. dances 컬렉션 (전통춤 종목)

전통춤 종목의 명칭, 분류, 성립 배경 및 국가유산 지정 정보를 관리하는 종목 중심 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 종목ID | _id | string | _id | 필수 | TIH_0001 |
| 장면ID | scene_refs | array<string> | 참조 | 필수 | ["SNE_001", "SNE_002"] |
| 전승자참조 | transmitter_refs | array<string> | 참조 | 선택 | ["TRM_0001", "TRM_0002"] |
| 명칭 | name.ko | string | - | 필수 | 춘앵전 |
| 한자명 | name.hanja | string | - | 선택 | 春鶯囀 |
| 영문명 | name.en | string | - | 선택 |  |
| 이칭 | name.alt | array<string> | - | 선택 | ["춘앵무", "춘앵전무"] |
| 분류체계 | classification | array<string> | - | 필수 | ["무용", "전통무용", "향악정재", "독무"] |
| 정의 | definition | text | - | 필수 | 봄날 꾀꼬리가 지저귀는 정취를 형상화한 춤 |
| 설명 | origin | text | - | 선택 | 1828년(순조 28) 효명세자가 창덕궁 연경당 진작에서 처음 추게 한 궁중정재 |
| 원작자 | creator | string | - | 선택 | 효명세자 |
| 시대 | period | string | - | 선택 | 조선시대 |
| 지정종목 | Heritage[].designation_title | string | - | 선택 | 국가무형유산 종묘제례악 (구 중요무형문화재 제1호) |
| 지정일 | Heritage[].designated_date | Date | - | 선택 | 1964-12-07 00:00:00 |
| 유형분류 | Heritage[].heritage_category | array<string> | - | 선택 | ["무형유산", "전통 공연·예술", "음악"] |
| 소재지 | Heritage[].location | string | - | 선택 | 서울특별시 |
| 시대 | Heritage[].period | string | - | 선택 | 조선시대 |
| 관리자 | Heritage[].administrator | string | - | 선택 | (사)국가무형문화재 종묘제례악보존회 |

## <a id="3"></a>3. Transmitter 컬렉션 (전승자)

전통춤 전승에 참여한 개인 또는 단체의 지위, 활동 정보 및 장면 연계를 관리하는 전승자 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 전승자ID | _id | string | _id | 필수 | TRM_0001 |
| 장면참조 | scene_refs | array<string> | 참조 | 선택 | ["SNE_001", "SNE_002"] |
| 전승자명 | name.ko | string | - | 필수 | 김천흥 |
| 한자명 | name.hanja | string | - | 선택 | 金千興 |
| 생몰기간 | lifespan | string | - | 선택 | 1909~2007 |
| 보유구분 | holder_type | string | - | 선택 |  |
| 성별 | gender | string | - | 선택 | 남 |
| 기예능 | specialty | array<string> | - | 선택 | ["예능"] |
| 지역 | region | string | - | 선택 |  |
| 인정일 | recognized_date | Date | - | 선택 |  |
| 해제일 | released_date | Date | - | 선택 |  |
| 제자 | disciples | array<string> | - | 선택 | ["황옥선", "박은영", "이홍구"] |
| 전승근거 | evidence | text | - | 선택 | 이왕직아악부와 국악사양성소를 통해 이어진 춘앵전 전승 이력 |

## <a id="4"></a>4. movements 컬렉션 (춤사위)

여러 종목에서 공유되는 춤사위의 명칭, 정의 및 출처를 관리하는 동작 어휘 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 춤사위ID | _id | string | _id | 필수 | MVT_0012 |
| 장면ID | scene_refs | array<string> | 역참조 | 선택 | ["SNE_001", "SNE_002"] |
| 춤사위명 | name.ko | string | - | 필수 | 회두 |
| 한자명 | name.hanja | string | - | 선택 | 回頭 |
| 이명칭 | variants | array<string> | - | 선택 | ["희두"] |
| 정의 | definition | text | - | 필수 | 들어진 팔을 안으로 돌려 사선 아래 방향으로 살짝 뿌리며 반대 팔도 반복하는 동작 |
| 출처 | source | string | - | 선택 | 정재무도홀기 계열 무보 |

## <a id="5"></a>5. pieces 컬렉션 (악곡)

전통공연에 사용되는 악곡의 기본 정보와 계통별 형식, 속도 및 편성 정보를 관리하는 악곡 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 악곡ID | _id | string | _id | 필수 | PCE_001 |
| 국악기참조 | realizations[].instrument_refs | array<string> | 참조 | 선택 | ["INS_001", "INS_004", "INS_008"] |
| 악곡명 | name.ko | string | - | 필수 | 상령산 |
| 한자명 | name.hanja | string | - | 선택 | 上靈山 |
| 이명 | alt_names | array<string> | - | 선택 | ["본령산", "대령산", "만령산"] |
| 정의 | definition | text | - | 필수 | 《영산회상》 계통의 첫 번째 악곡으로 느린 장단의 대표적 정악곡 |
| 유래 | historical_origin | text | - | 선택 | 원형은 1493년 『악학궤범』에 기록된 단일곡 〈영산회상〉 |
| 악곡 계통별 정보 | realizations[] | array<struct> | - | 선택 |  |
| 계통 | realizations[].system | string | - | 필수 | 삼현영산회상 |
| 계통이명 | realizations[].alias | string | - | 선택 | 대풍류 |
| 곡내순서 | order_in_suite | integer | - | 선택 | 1 |
| 장구성 | realizations[].section_layout | array<integer> | - | 선택 | [4, 4, 3, 4] |
| 총장단수 | realizations[].total_jangdan | integer | - | 선택 | 14 |
| 속도 | realizations[].tempo | string | - | 선택 | 분당 약 20~25정간 |

## <a id="6"></a>6. Instrument 컬렉션 (국악기)

전통공연에 사용되는 국악기의 명칭, 유형, 음역, 연주 방식 및 음향 특성을 관리하는 국악기 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 국악기ID | _id | string | _id | 필수 | INS_001 |
| 악곡참조 | piece_refs | array<string> | 참조 | 선택 | ["PCE_001", "PCE_004"] |
| 국악기명 | name.ko | string | - | 필수 | 가야금 |
| 종류 | subtype | string | - | 선택 | 기본 |
| 한자명 | name.hanja | array<string> | - | 선택 | ["伽倻琴", "加耶琴"] |
| 이명 | name.alt | array<string> | - | 선택 | ["가야고", "가얏고"] |
| 정의 | definition | text | - | 필수 | 안족 위에 놓인 명주실 줄을 손가락으로 연주하는 현악기 |
| 유형 | instrument_type | string | - | 필수 | 현악기 |
| 음역 | range | text | - | 선택 | 풍류 및 산조 모두 약 2옥타브 반이며 음높이는 종류에 따라 다름 |
| 연주방법 | playing_method | text | - | 선택 | 오른손으로 줄을 뜯거나 튕기고 왼손으로 줄을 눌러 시김새를 표현함 |
| 음향적 특징 | acoustic_features | text | - | 선택 | 줄을 뜯어 낸 소리의 높이와 울림을 왼손 주법으로 변화시킴 |

## <a id="7"></a>7. lyrics 컬렉션

전통공연에서 사용되는 창사의 구성, 구절, 번역 및 해석 근거를 관리하는 창사 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 창사ID | _id | string | _id | 필수 | LYR_001 |
| 창사 순서 | changsa[].set_no | integer | - | 필수 | 1 |
| 창사 형식 | changsa[].form | string | - | 선택 | 오언절구 |
| 창사 명칭 | changsa[].title | string | - | 선택 | 빙정월하보 |
| 창사 구절 | changsa[].verses | array<struct> | - | 선택 |  |
| 구절ID | changsa.verses[].verse_no | integer | - | 선택 | 1 |
| 가사구절 | changsa.verses[].verse_title | string | - | 선택 | 빙정월하보 |
| 원문 | changsa.verses[].original_text | string | - | 선택 | 娉婷月下步 |
| 번역문 | changsa.verses[].translation | text | - | 선택 | 아름다운 달빛 아래 걸음이여 |
| 상징적의미 | changsa.verses[].symbolic_meaning | text | - | 선택 | 부모 앞에서 갖추어야 할 경건함, 정성(誠)과 절제된 예법의 체득 |
| 확장된의미 | changsa.verses[].extended_meaning | text | - | 선택 | 수양된 내면의 질서가 외적 위엄으로 안착한 효의 실천적 단초 |
| 참고문헌 | changsa.verses[].sources[].text | string | - | 선택 | 『예기』 |
| 인용구 | changsa.verses[].sources[].phrase | string | - | 선택 | 보리필정(步立必正) |

## <a id="8"></a>8. Space 컬렉션 (공간 컬렉션)

전통공연이 연행, 전승 또는 재현되는 장소의 명칭, 유형, 위치 및 역사적 맥락을 관리하는 공간 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 공간 ID | _id | string | _id | 필수 | SPC_0001 |
| 장면 참조 | scene_refs | array<string> | 역참조 | 선택 | ["SNE_001"] |
| 공간명 | name.ko | string | - | 필수 | 창덕궁 연경당 |
| 한자명 | name.hanja | string | - | 선택 | 昌德宮 演慶堂 |
| 영문명 | name.en | string | - | 선택 | Yeongyeongdang Hall, Changdeokgung Palace |
| 이칭 | name.alt | array<string> | - | 선택 | ["연경당"] |
| 공간유형 | space_type | string | 통제어휘 | 필수 | 궁궐 전각 |
| 위치정보 | location | struct | - | 선택 | {"region":"서울특별시","parent_place":"창덕궁","detail":"연경당"} |
| 설명 | historical_context | text | - | 선택 | 1828년(순조 28) 창덕궁 연경당 진작에서 춘앵전이 처음 연행됨. |

## <a id="9"></a>9. Ritual Event 컬렉션 (제례 컬렉션)

제례의 절차와 행례, 의물, 제물 및 의례 공간의 관계를 관리하는 제례 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| Event ID | _id | string | _id | 필수 | RIE_001 |
| 장면 참조 | scene_ref | string | 참조 | 필수 | SNE_001 |
| 절차명 | procedure.name.ko | string | - | 필수 | 신관례 |
| 절차 설명 | procedure.description | text | - | 필수 | 신을 제례에 모시기 위해 향을 올리고 울창주와 폐백을 사용하는 절차 |
| 행례명 | rite.name.ko | string | - | 필수 | 전폐 |
| 행례 설명 | rite.description | text | - | 필수 | 대축이 신위 앞에 폐백을 올려 신을 맞이하는 행위 |
| 의물 및 제물 정보 | ritual_objects[] | array<struct> | - | 선택 | [{…}, {…}] |
| 의물 및 제물명 | ritual_objects[].name.ko | string | - | 조건부 필수 | 울창주 / 폐백 |
| 의물 및 제물 유형 | ritual_objects[].type | string | - | 조건부 필수 | 제물 / 의물 |
| 의물 사용 방식 | ritual_objects[].use_method | string | - | 조건부 필수 | 울창주를 땅에 붓기 / 폐백을 신위 앞에 올리기 |
| 의물 사용 설명 | ritual_objects[].use_description | text | - | 선택 | 울창주를 땅에 부어 신의 강림을 청하고, 폐백을 올려 예를 표함 |
| 의례 공간 | ritual_spaces[] | string | - | 필수 | [{…}] |

## <a id="10"></a>10. Custume 컬렉션 (복식 컬렉션)

전통공연의 등장인물 또는 실연자가 착용하는 복식 구성과 무구 정보를 관리하는 복식 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 복식ID | _id | string | _id | 필수 | Cot_001 |
| 장면 참조 | scene_refs | array<string> | 참조 | 필수 | ["SNE_001"] |
| 착용대상 | wearer_type | string | - | 필수 | 무동 |
| 상의 | upper_garment | array<string> | - | 선택 | ["백질흑선착수의", "녹색쾌자"] |
| 하의 | lower_garment | array<string> | - | 선택 | ["옥색질흑선상"] |
| 대 | belt | array<string> | - | 선택 | ["오사대"] |
| 관모 | headwear | array<string> | - | 선택 | ["야견모"] |
| 신발 | footwear | array<string> | - | 선택 | ["호화"] |
| 무구 | props | array<string> | - | 선택 | ["홍한삼"] |

## <a id="11"></a>11. Performance 컬렉션 (실연)

공연, 시연 또는 촬영에서 발생한 실연 활동과 참여자, 장소 및 관리 정보를 관리하는 실연 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 활동ID | _id | string | _id | 필수 | PRF_001 |
| 실연대상 | dance_ref | string | 참조 | 필수 | TIH_0001 |
| 활동명 | title | string | - | 필수 | 볼류메트릭 촬영 시연 1차 |
| 활동유형 | category | string | - | 필수 | 디지털 촬영 |
| 활동일자 | date | Date | - | 필수 | 2026-08-25 |
| 활동장소 | venue | string | - | 선택 | 한국기술교육대학교 다담학습관 메타스튜디오 |
| 관리기관 | managing_org | string | - | 선택 | 세종대학교 |
| 실연대상의상 | costume_ref | array<string> | 참조 | 선택 | ["CST_001"] |
| 실연자ID | performers[].performer_id | string | _id | 조건부 필수 | PFM_001 |
| 사람명 | performers[].person_name | string | - | 선택 |  |
| 기관명 | performers[].org_name | string | - | 선택 | 세종대학교 |
| 세부역할 | performers[].role | string | - | 선택 | 무용수 |
| 노랑 = 문서 식별자(_id) | 초록 = 참조 또는 역참조 |  |  |  |  |
| [] 표기는 배열을 의미하며, 하위 요소는 JSON 경로에서 []로 표현 |  |  |  |  |  |

## <a id="12"></a>12. Digital Project 컬렉션 (디지털화 사업)

디지털 기록화와 변환 사업의 유형, 수행 기간, 장소, 생산기관 및 관리기관 정보를 관리하는 디지털화 사업 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example (Chunaengjeon) |
|---|---|---|---|---|---|
| 디지털화 ID | _id | string | _id | 필수 | DGP_0001 |
| 생산디지털자원 | asset_refs | array<string> | 참조 | 필수 | ["AST_0001", "AST_0002"] |
| 디지털화 유형 | project_type | string | - | 선택 | 아날로그 자료 디지털화 |
| 생산기간 | period | string | - | 선택 | 2007 ~ (계속) |
| 사업장소 | location | string | - | 선택 | 국립국악원 국악아카이브 |
| 사업기관 | producer_org | string | - | 선택 | 국립국악원 |
| 관리기관 | managing_org | string | - | 선택 | 국립국악원 국악아카이브 |
| 설명 | description | text | - | 선택 | 국악아카이브 소장 아날로그 자료의 디지털화 및 온라인 서비스 구축 사업, 종묘제례악 관련 음원 및 영상 기록물 포함 |

## <a id="13"></a>13. assets 컬렉션 — ④ 디지털 자산

디지털화 사업에서 생산된 논리적 디지털 자산의 식별, 연계, 유형 및 내용을 관리하는 디지털 자산 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example |
|---|---|---|---|---|---|
| 디지털자산ID | _id | string(UUID) | _id | 필수 | 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d |
| 관리코드 | internal_management_code | string | - | 필수 | DH-2026-ICH-001 |
| 관련사업 | project_ref | string | 참조 | 필수 | DGP_0001 |
| 관련공연참조 | performance_ref | string | 참조 | 필수 | PRF_001 |
| 대상종목참조 | dance_ref | string | 참조 | 필수 | TIH_0001 |
| 자산명 | title | string | - | 필수 | 춘앵전_전막_4D |
| 생성파일 | asset_type | array<string> | - | 필수 | VOLUMETRIC_4D |
| 설명 | description | text | - | 선택 | 춘앵전 전막 실연을 기록한 4D 디지털 자산 |

## <a id="14"></a>14. Item 컬렉션 — Asset의 물리적 및 포맷별 표현

하나의 Asset에서 파생되는 파일별 포맷, 용량, 저장 위치, 3D 및 4D 기술 사양과 접근 조건을 관리하는 Item 컬렉션

| Field | JSON path | Type | Key / reference | Obligation | Example |
|---|---|---|---|---|---|
| 아이템ID | _id | string | _id | 필수 | ITEM_SERVICE_001 |
| 자산참조 | asset_ref | string | 참조 | 필수 | AST_0001 |
| 아이템명 | file_name | string | - | 필수 | chunaengjeon_service.4ds |
| 아이템역할 | role | string | - | 필수 | SERVICE |
| 아이템유형 | media_type | string | - | 필수 | VOLUMETRIC_4D |
| 아이템형식 | format | string | - | 필수 | 4DS |
| 아이템크기 | size_bytes | integer | - | 필수 | 128629369.0 |
| 접근 권한 | access_rights | struct | - | 필수 | {…} |
| 이미지해상도 | type_metadata.image.resolution | struct | - | 조건부 | {"width":6000,"height":4000} |
| 색공간 | type_metadata.image.color_space | string | - | 선택 | sRGB |
| 비트심도 | type_metadata.image.bit_depth | integer | - | 선택 | 8.0 |
| 재생시간 | type_metadata.video.duration_seconds | number | - | 조건부 | 600.0 |
| 영상해상도 | type_metadata.video.resolution | struct | - | 조건부 | {"width":3840,"height":2160} |
| 프레임률 | type_metadata.video.fps | number | - | 선택 | 29.97 |
| 영상코덱 | type_metadata.video.codec | string | - | 선택 | H.265 |
| 자막유무 | type_metadata.video.has_subtitles | boolean | - | 선택 | True |
| 해설유무 | type_metadata.video.has_narration | boolean | - | 선택 | False |
| 대본참조 | type_metadata.video.transcript_uri | string | - | 선택 | s3://…/transcript.vtt |
| 재생시간 | type_metadata.audio.duration_seconds | number | - | 조건부 | 600.0 |
| 샘플레이트 | type_metadata.audio.sample_rate_hz | integer | - | 선택 | 48000.0 |
| 비트심도 | type_metadata.audio.bit_depth | integer | - | 선택 | 24.0 |
| 채널수 | type_metadata.audio.channels | integer | - | 선택 | 2.0 |
| 오디오코덱 | type_metadata.audio.codec | string | - | 선택 | PCM |
| 표현구조 | type_metadata.model_3d.representation_type | string | - | 조건부 | MESH |
| 세부유형 | type_metadata.model_3d_type | string | - | 선택 |  |
| 매핑소스참조 | type_metadata.model_3d.texture_source_item_refs | array<string> | 참조 | 선택 | ["ITEM_IMG_001"] |
| 좌표계 | type_metadata.model_3d.coordinate_system | string | - | 선택 | Y-Up |
| 공간단위 | type_metadata.model_3d.spatial_unit | string | - | 선택 | meter |
| 바운딩박스 | type_metadata.model_3d.bounding_box | struct | - | 선택 | {"min":[-1,-1,0],"max":[1,1,2]} |
| 텍스처매핑여부 | type_metadata.model_3d.texture_mapped | boolean | - | 선택 | True |
| 점밀도 | type_metadata.model_3d.point_density | number | - | 선택 | 1250.5 |
| 포인트수 | type_metadata.model_3d.point_count | integer | - | 선택 | 12500000.0 |
| 폴리곤수 | type_metadata.model_3d.polygon_count | integer | - | 선택 | 1200000.0 |
| 삼각형수 | type_metadata.model_3d.triangle_count | integer | - | 선택 | 2400000.0 |
| 스케일 | type_metadata.model_3d.scale | string | - | 선택 | 1:1 |
| 시간표현구조 | type_metadata.volumetric_4d.representation_type | string | - | 조건부 | GAUSSIAN_SEQUENCE |
| 재생시간 | type_metadata.volumetric_4d.duration_seconds | number | - | 필수 | 5.6 |
| 총프레임 | type_metadata.volumetric_4d.total_frames | integer | - | 필수 | 168.0 |
| 프레임률 | type_metadata.volumetric_4d.fps | number | - | 필수 | 30.0 |
| 프레임인덱스기준 | type_metadata.volumetric_4d.frame_index_base | integer | - | 필수 | 0.0 |
| 좌표계 | type_metadata.volumetric_4d.coordinate_system | string | - | 선택 | Y-Up |
| 공간단위 | type_metadata.volumetric_4d.spatial_unit | string | - | 선택 | meter |
| 바운딩박스 | type_metadata.volumetric_4d.bounding_box | struct | - | 선택 | {"min":[-1.2,0,-1.2],"max":[1.2,2.1,1.2]} |
| Gaussian사양 | type_metadata.volumetric_4d.gaussian | struct | - | 조건부 | {"average_splats_per_frame":850000,"max_splats_per_frame":920000,"sh_degree":2,"attributes":["position","scale","rotation","opacity","sh"]} |
| Mesh사양 | type_metadata.volumetric_4d.mesh | struct | - | 조건부 | {"max_vertices_per_frame":65453,"max_triangles_per_frame":97762,"texture_resolution":{"width":2880,"height":2880}} |
| 압축상태 | type_metadata.volumetric_4d.compression | struct | - | 필수 | {…} |
| 동작구간 | type_metadata.volumetric_4d.motion_segments | array<struct> | - | 필수 | [{…}] |
| 재생특성 | type_metadata.volumetric_4d.playback | struct | - | 선택 | {"seek_unit":"GROUP","supports_random_seek":true,"segment_seek_policy":"GROUP_START_DECODE"} |
| 가우시안 수 | type_metadata.volumetric_4d.gaussian_spec.gaussian_count | Integer | - | 조건부 | 825000.0 |
| 프레임당 평균 가우시안 수 | type_metadata.volumetric_4d.gaussian_spec.average_gaussians_per_frame | Number | - | 선택 | 812450.5 |
| 프레임당 최대 가우시안 수 | type_metadata.volumetric_4d.gaussian_spec.max_gaussians_per_frame | Integer | - | 선택 | 865320.0 |
| SH 차수 | type_metadata.volumetric_4d.gaussian_spec.sh_degree | Integer | - | 선택 | 3.0 |
| 가우시안 속성 | type_metadata.volumetric_4d.gaussian_spec.attributes | Array<String> | - | 조건부 | ["POSITION","SCALE","ROTATION","OPACITY","COLOR_SH"] |
| 위치 정밀도 | type_metadata.volumetric_4d.gaussian_spec.position_precision | String | - | 선택 | "FLOAT32" |
| 시간 속성 포함 여부 | type_metadata.volumetric_4d.gaussian_spec.has_temporal_attributes | Boolean | - | 선택 | True |
| 압축적용여부 | type_metadata.volumetric_4d.compression.applied | boolean | - | 필수 | True |
| 압축방법 | type_metadata.volumetric_4d.compression.methods | array<struct> | - | 선택 | [{"scope":"ATTRIBUTE","technique":"QUANTIZATION","parameters":{"position_bits":16}}] |
| 시간압축모델 | type_metadata.volumetric_4d.compression.temporal_model | string | - | 선택 | GROUPED |
| 프레임그룹구조 | type_metadata.volumetric_4d.compression.grouping | struct | - | 선택 | {"group_type":"BLOCK","group_count":23} |
| 인코더/코덱 | type_metadata.volumetric_4d.compression.codec | string | - | 선택 | 4DS Encoder |
| 인코더/코덱버전 | type_metadata.volumetric_4d.compression.codec_version | string | - | 선택 | 20.0 |
| 압축전용량 | type_metadata.volumetric_4d.compression.original_size_bytes | integer | - | 선택 | 858993459.0 |
| 압축률 | type_metadata.volumetric_4d.compression.compression_ratio | number | - | 선택 | 6.68 |
| 압축범위 | type_metadata.volumetric_4d.compression.methods[].scope | string | - | 조건부 |  |
| 압축기법 | type_metadata.volumetric_4d.compression.methods[].technique | string | - | 조건부 |  |
| 압축기법파라미터 | type_metadata.volumetric_4d.compression.methods[].parameters | struct | - | 선택 |  |
| 그룹유형 | type_metadata.volumetric_4d.compression.grouping.group_type | string | - | 조건부 | BLOCK |
| 그룹수 | type_metadata.volumetric_4d.compression.grouping.group_count | integer | - | 조건부 | 23.0 |
| 그룹인덱스 | type_metadata.volumetric_4d.compression.grouping.groups | array<struct> | - | 선택 | [{"group_id":0,"start_frame":0,"end_frame":3,"key_frame_id":0}] |
| 그룹ID | type_metadata.volumetric_4d.compression.grouping.groups[].group_id | integer | - | 조건부 | 0.0 |
| 그룹시작프레임 | type_metadata.volumetric_4d.compression.grouping.groups[].start_frame | integer | - | 조건부 | 0.0 |
| 그룹종료프레임 | type_metadata.volumetric_4d.compression.grouping.groups[].end_frame | integer | - | 조건부 | 3.0 |
| 키프레임ID | type_metadata.volumetric_4d.compression.grouping.groups[].key_frame_id | integer | - | 선택 | 0.0 |
| 인터프레임수 | type_metadata.volumetric_4d.compression.grouping.groups[].inter_frame_count | integer | - | 선택 | 3.0 |
| 구간ID | type_metadata.volumetric_4d.motion_segments.[]_id | string | - | 필수 | SEG_0001 |
| 동작참조 | type_metadata.volumetric_4d.motion_segmentst[].motion_ref | string | 참조 | 필수 | MOT_00001 |
| 구간순서 | type_metadata.volumetric_4d.motion_segments[].order | integer | - | 선택 | 1.0 |
| 시작프레임 | type_metadata.volumetric_4d.motion_segment[].start_frame | integer | - | 필수 | 300.0 |
| 종료프레임 | type_metadata.volumetric_4d.motion_segment[].end_frame | integer | - | 필수 | 599.0 |
| 랜덤 탐색 지원 여부 | type_metadata.volumetric_4d.playback.random_seek_supported | Boolean | - | 선택 | True |
| 탐색 단위 | type_metadata.volumetric_4d.playback.seek_unit | String | - | 조건부 | "FRAME" |
| 접근등급 | access_rights.level | string | - | 필수 | RESTRICTED |
| 이용조건 | access_rights.conditions | string | - | 조건부 | 연구; 교육 |
| 접근주소 | access_url | string(URI) | - | 조건부 | https://{도메인}/files/3f2a6c1e-8b0d-4e57-9a2c-6d1f0b7e4a91 |
| 접근절차 | access_rights.access_procedure | string | - | 조건부 | 이용 신청서 제출 후 관리기관 승인 |
| 접근문의처 | access_rights.contact_point | string | - | 필수 | {관리기관 이메일} |

## OAI-PMH provision (입력체계)

Harvesting interface specified for the FAIR accessibility (A) and findability (F4) indicators.


**OAI-PMH 메타데이터 제공 명세**


**1. 제공 기본 정보**

- 명세 항목 · OAI-PMH 요소 · 명세 값 · 설명
- 제공 주소 · baseURL · https://{도메인}/oai · OAI-PMH 요청 수신 단일 주소(HTTPS)
- 프로토콜 버전 · protocolVersion · 2.0 · OAI-PMH 2.0 규격 준수
- 저장소명 · repositoryName · {저장소 공식 명칭} · 수집기에 표시되는 저장소 공식 명칭
- 관리자 이메일 · adminEmail · {관리자 이메일} · 수집 오류 문의 담당 연락처
- 최초 레코드 일시 · earliestDatestamp · 시스템 자동 산출 (가장 오래된 _meta.modified) · 저장소 내 가장 오래된 레코드 변경일시
- 삭제 레코드 정책 · deletedRecord · persistent · 삭제 및 철회 레코드의 삭제 상태 지속 응답
- 시간 단위 · granularity · YYYY-MM-DDThh:mm:ssZ · UTC 기준 초 단위 일시 표기
- 지원 요청 · verb · Identify, ListMetadataFormats, ListSets, ListIdentifiers, ListRecords, GetRecord · OAI-PMH 표준 요청 6종
- OAI 레코드 식별자 · identifier · oai:{도메인}:{컬렉션}/{_id} · OAI-PMH 헤더용 레코드 식별자
- 분할 응답 · resumptionToken · 1회 응답 100건, 토큰 유효 24시간 · 대량 목록의 분할 응답 및 이어받기 토큰
- 문자 인코딩 · - · UTF-8 · 한글 및 한자 표기용 UTF-8 XML 응답
- 접근 조건 · - · 인증 없음, 무료 · 메타데이터 수집의 무인증 및 무료 제공

**2. 제공 형식**

- metadataPrefix · 형식 · 스키마 / 네임스페이스 · 적용 기준
- oai_dc · Dublin Core (단순 DC 15개 요소) · http://www.openarchives.org/OAI/2.0/oai_dc.xsd http://www.openarchives.org/OAI/2.0/oai_dc/ · Dublin Core 매핑표 기준 변환, OAI-PMH 필수 형식
- lido · LIDO (CIDOC-CRM 기반 문화유산 기술 형식) · http://www.lido-schema.org · CIDOC-CRM 매핑표 기반 문화유산 포털 연계 형식

**3. Set 구성**

- setSpec · setName · 대상 컬렉션 · 구성 기준 및 비고
- dances · 전통춤 종목 · 2. dances · 종목 대표 레코드
- movements · 춤사위 · 4. movements · 동작 용어 어휘
- pieces · 악곡 · 5. pieces · 반주 악곡 어휘
- lyrics · 창사 · 7. lyrics · 창사 및 구절
- spaces · 공간 · 8. Space · 연행 장소
- ritual_events · 제례 · 9.Ritual Event · 제례 절차 및 행례
- performances · 실연 · 11. Performance · 공연 및 스튜디오 실연
- digital_projects · 디지털화 사업 · 12. Digital Project · 디지털화 사업 정보
- assets · 디지털 자산 · 13. Asset · 디지털 자산 대표 레코드

**4. 제공 대상 기준**

- 기준 · 조건 · 처리 방식 · 설명
- 컬렉션 · 3절의 '제공' Set에 속한 컬렉션 · 제공 · 제공 Set 소속 컬렉션 한정
- 레코드 상태 · _meta.record_status = ACTIVE · 전체 메타데이터 제공 · 공개 확정 레코드
- 레코드 상태 · _meta.record_status = DRAFT · 제공하지 않음 · 작성 및 검수 중 레코드
- 레코드 상태 · _meta.record_status = WITHDRAWN / DELETED · 헤더만 제공 (status="deleted") · 수집기의 삭제 반영용 식별자 및 변경일시 응답
- 제외 필드 · transmitters.gender · 출력 제외 · 개인 전승자 개인정보
- 제외 필드 · assets.internal_management_code · 출력 제외 · 기관 내부 관리코드
- 제외 필드 · item.uri (s3:// 저장경로) · 출력 제외 · 내부 보존 경로(외부 접근은 access_url)
- 접근 제한 자산 · assets.access_rights.level = RESTRICTED / CLOSED · 메타데이터는 제공 · 파일 접근 제한 시에도 메타데이터 공개(dc:rights 표시)
