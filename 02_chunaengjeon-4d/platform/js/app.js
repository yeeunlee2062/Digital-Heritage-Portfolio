import { createSplatPlayer } from "./splat-player.js";

// ---------------------------------------------------------------- SVG Icons (1.65px monoline, anti-AI-slop)
const ICONS = {
  play: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4.5 2.8a.7.7 0 011.06-.6l8 5.2a.7.7 0 010 1.2l-8 5.2a.7.7 0 01-1.06-.6V2.8z"/></svg>`,
  pause: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3.5" y="2.5" width="3.2" height="11" rx="0.8"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="0.8"/></svg>`,
  flag: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2.5v11M3 3h8.5l-1.8 3 1.8 3H3"/></svg>`,
  ext: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 11L11 5M11 5H6M11 5V10"/></svg>`,
  chev: `<svg class="chev" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>`,
  dl: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2.5v8M5 7.5l3 3 3-3M3 13h10"/></svg>`,
};

// ---------------------------------------------------------------- Janggu Drum Notation Glossary
const JANGGU_GLOSS = {
  "⦶": { ko: "합(合) — 양손으로 북편과 채편을 동시에 치는 첫 박의 기둥 소리", en: "Hap — strike both drumheads together on the downbeat" },
  "○": { ko: "동 / 쿵 — 왼손 손바닥으로 북편을 치는 깊고 울림 있는 저음", en: "Dong / Kung — strike left drumhead with palm for deep resonance" },
  "ʘ": { ko: "기덕 — 오른손 채로 채편을 겹쳐 치는 경쾌한 겹박 소리", en: "Gideok — double tap on right drumhead with stick" },
  "i": { ko: "더 / 단타 — 오른손 채로 채편을 가볍게 한 번 치는 소리", en: "Deo / single strike on right drumhead" },
  "⋮": { ko: "더러러럭 — 채를 굴려 여음을 길게 이어 주는 장식 연주 기법", en: "Deoreoreoreok — roll stick on right drumhead" },
  "—": { ko: "채편 또는 호흡 유지 — 장단의 여백과 무용수의 굴신 호흡이 이어지는 구간", en: "Sustained beat / breath extension" },
  "·": { ko: "잔박 — 다음 장단으로 넘어가기 전 호흡을 고르는 예비 박", en: "Sub-beat / preparation" },
  "|": { ko: "채편 세로 기호 — 정간보 기준 채편 단타 표기", en: "Vertical stick stroke notation" },
};

// ---------------------------------------------------------------- Heritage Entity Dictionary (for Origin-Aware Popover)
const ENTITY_DICT = {
  "화문석": {
    badge: "SPACE · SPC_001",
    title_ko: "화문석 (花紋席) — 춘앵전의 절대 공간",
    title_en: "Hwamunseok (Flower-Patterned Rush Mat)",
    body_ko: "강화도 왕골로 꽃무늬를 엮어 만든 돗자리(약 180×240cm). 춘앵전은 궁중 정재 중 유일하게 이 화문석 한 장 위에서만 추는 독무로, 무용수의 모든 전진·후퇴·회전 반경이 이 경계 안에서 절제됩니다.",
    body_en: "Woven sedge mat (approx. 1.8m × 2.4m) adorned with floral motifs. Chunaengjeon is uniquely performed entirely within the boundaries of a single Hwamunseok mat.",
    foot: "『진찬의궤』(1828) · 국립국악원 『궁중무용무보』 제2집",
  },
  "한삼": {
    badge: "COSTUME PROP · CST_001",
    title_ko: "오색 한삼 (五色汗衫) — 소매 끝의 율동",
    title_en: "Osaek Hansam (Five-Coloured Silk Sleeves)",
    body_ko: "손을 가리고 소매 끝에 길게 드리운 오방색(청·홍·황·백·흑) 비단 한삼. 손을 직접 드러내지 않는 궁중 예법을 지키면서도, 뿌리고 거두는 궤적을 통해 봄 꾀꼬리의 날갯짓을 시각화합니다.",
    body_en: "Long five-coloured silk sleeve extensions concealing the hands in accordance with court etiquette while visualizing the flight of the spring oriole.",
    foot: "275개 장면 중 42개 장면에서 한삼 뿌림·거둠 직접 지시",
  },
  "앵삼": {
    badge: "COURT ATTIRE · CST_001",
    title_ko: "황색 앵삼 (黃色鶯衫) — 꾀꼬리를 상징하는 예복",
    title_en: "Yellow Aengsam (Oriole Court Robe)",
    body_ko: "봄 버드나무 사이를 노니는 노란 꾀꼬리(春鶯)를 상징하는 선명한 황색 비단 겉옷. 홍색 스란치마와 녹색 하피, 오색 한삼과 대비되어 정재 미학의 정수를 이룹니다.",
    body_en: "Vibrant yellow silk outer robe symbolizing the golden spring oriole, worn over a crimson skirt with a green ceremonial chest sash.",
    foot: "효명세자(익종) 창제 · 1828년 무자 진작의궤",
  },
  "화전태": {
    badge: "SIGNATURE MOTIF · MVM_019",
    title_ko: "화전태 (花前態) — 꽃 앞에서 짓는 미소",
    title_en: "Hwajeontae (Graceful Demeanor Before Flowers)",
    body_ko: "춘앵전의 백미(白眉). 시종일관 감정을 절제하던 무용수가 꽃 앞에서 살짝 미소를 머금는 유일한 순간으로, 정중동(靜中動)의 궁중 무용 미학이 최고조에 달하는 대목입니다.",
    body_en: "The aesthetic climax of Chunaengjeon where the dancer, otherwise composed and expressionless throughout the dance, parts her lips in a subtle smile before the flowers.",
    foot: "MVM_019 · SNE_144–153 (한복 04:24.8 / 연습복 04:32.1)",
  },
  "효명세자": {
    badge: "CREATOR · 1828",
    title_ko: "효명세자 (孝明世子, 1809–1830)",
    title_en: "Crown Prince Hyomyeong (1809–1830)",
    body_ko: "조선 순조의 세자(사후 익종 추존). 1828년(순조 28) 모친 순원왕후의 40세 탄신을 축하하기 위해 당나라 고종 대의 고사를 재해석하여 향악정재 『춘앵전』을 직접 창제하고 창사를 지었습니다.",
    body_en: "Crown Prince of Joseon who choreographed Chunaengjeon and composed its classical Chinese verse in 1828 to celebrate the 40th birthday of his mother, Queen Sunwon.",
    foot: "『순조무자진작의궤』(1828) · 『익종어제(翼宗御製)』",
  },
  "김천흥": {
    badge: "LINEAGE · TRM_003",
    title_ko: "김천흥 (金千興, 1909–2007)",
    title_en: "Kim Cheon-heung (Master Court Dancer, 1909–2007)",
    body_ko: "이왕직아악부 제2기생 출신으로 조선 마지막 궁중 무동을 지낸 국가무형유산 처용무·종묘제례악 예능보유자. 1987년 국립국악원 『궁중무용무보』 춘앵전 기록의 핵심 구술·감수자입니다.",
    body_en: "Trained at the Royal Conservatory (Iwangjik Aakbu) in 1922, Kim transmitted the court dance repertoire into the modern National Gugak Center notation.",
    foot: "TRM_001 하규일 → TRM_003 김천흥 → TRM_004 박은영 계보",
  },
};

// ---------------------------------------------------------------- UI Strings
const UI = {
  en: {
    title: "Chunaengjeon in 4D",
    subtitle: "Volumetric 4D Gaussian Splatting Heritage Workstation & Scene-Centred Archive",
    wsSplit: "Split Studio",
    wsCinema: "Cinema 4D",
    wsEditorial: "Editorial Dossier",
    cmdPlaceholder: "Search movements, paths, cameras…",
    source: "GitHub",
    stageTitle: "4D VOLUMETRIC STAGE",
    radarTitle: "HOLOSYS 32-Camera Calibration Ring",
    capture: "Capture",
    sequence: "Sequence",
    range: "Frames",
    model: "Model",
    registration: "Registration",
    reset: "Reset view",
    camLabel: "Camera View",
    freeOrbit: "Free orbit (3D)",
    matGuide: "Mat & Rig",
    openFolder: "Open .gsq",
    hint: "Drag to orbit · right-drag/Shift to pan · wheel to zoom · Space play · C cycle cameras · ⌘K search",
    tabMovement: "Movement",
    tabThemes: "10 Curated Paths",
    tabMatrix: "9 Sequences & Matrix",
    tabData: "4DGS Pipeline",
    timeline: "The 35 choreographed movements & Pyeongjo-hoesang accompaniment across the 4D sequences",
    music: "Accompaniment",
    musicSub: "via scene links",
    noPiece: "Unaccompanied (verse / bow)",
    hanbok: "Hanbok",
    hanbokSub: "h_slow_high · 15,490 fr.",
    practice: "Practice clothes",
    practiceSub: "b_slow · 15,970 fr.",
    inRecordings: "In the 4D recordings",
    recording: "Recording",
    frames: "Frames",
    time: "Time",
    duration: "Duration",
    ratio: (r) => `The practice-clothes performance takes ${r} the time of the hanbok performance for this movement.`,
    recurs: "Recurs in the performance",
    once: "This movement occurs once in the choreography.",
    accompaniment: "Accompaniment",
    verse: "Sung verse (changsa)",
    steps: (n) => `Scenes · ${n} steps`,
    stepsNote: "Step descriptions follow the source notation (National Gugak Center, Gungjung Muyong Mubo vol. 2, 1987). Click any scene to inspect its estimated frame position.",
    jangguLegend: "Janggu drum notation (click any symbol to inspect)",
    provenance: "Provenance & transmission",
    lineage: "Line of transmission",
    needsCheck: "Paradata · open question in the record",
    prev: "← Prev",
    next: "Next →",
    of: "of",
    JumpMvm: "Jump to movement",
    altNames: "Also recorded as",
    noClip: "A 4D excerpt for this movement is not bundled in the lightweight web edition (full slow sequences are 49–51 GB each). Use 'Open .gsq' to load a local sequence folder.",
    playClip: (s) => `Play in 4D · ${s}`,
    backToSample: "Return to H_fast excerpt",
    loading: "Decoding 4D Gaussian Splatting frames…",
    webgl: "This browser does not support WebGL2. Please open the page in a current Chrome, Edge, Firefox or Safari.",
    localErr: "No frame_XXXXX.gsq or .png files found in the selected folder.",
    selected: "Selected movement",
    openMovement: "Inspect movement",
    classes: "Classes combined",
    pieceCols: ["Piece", "Suite", "Tempo", "Beats / cycle", "Cycles", "Scenes"],
    suiteFilterAll: "All 3 Yeongsan-hoesang suites (14)",
    suiteFilterPerf: "Chunaengjeon accompaniment (Pyeongjo-hoesang, 6)",
    pieceOrigin: "Historical origin",
    pieceStructure: "Section layout",
    instrumentCols: ["Instrument", "Variant", "Type", "Range", "How it sounds & timbre"],
    instFilterAll: "All 20 documented instruments & variants",
    instFilterPerf: "Pyeongjo-hoesang ensemble (9 core)",
    hansam: (n) => `${n} scene descriptions explicitly direct the five-coloured hansam sleeves:`,
    lineageNote: "Scene descriptions derive from Kim Cheon-heung's line of transmission and the 1987 court-dance notation; the volumetric capture is an independent performance record. The platform keeps both sources distinct.",
    perfRecord: "Volumetric performance record",
    cmpNote: "Duration of all 35 movements across both recordings (gold: hanbok, warm grey: practice clothes). Select any row to inspect the movement.",
    record: "The 4D reconstruction pipeline",
    edition: "In this web edition",
    seqArchive: "Captured 4DGS sequences (9 sequences · 58,843 frames)",
    calibVerify: "32-camera geometric registration & silhouette verification (IoU 0.960)",
    modelTitle: "Scene-centred knowledge model (v12)",
    paradata: "Paradata: open questions kept visible",
    sources: "Primary sources",
    dataFiles: "Dataset & specifications",
    matDiagramTitle: "Spatial path on the Hwamunseok mat",
    entityHint: "Interactive Heritage Glossary (click to inspect)",
    pipeline: [
      "Volumetric capture: 4DViews HOLOSYS, 32 synchronised cameras at 2448×2048 and 30 fps; per-frame textured meshes (Alembic) with 2880×2880 textures.",
      "Camera registration to the mesh frame: rendered mesh matched against each camera via SIFT, 2D–3D correspondences lifted from rendered depth, PnP + calibration (focal, principal point, k1). Reprojection error 1.40–1.61 px; silhouette vs chroma-key mask IoU 0.960.",
      "Per-frame 3D Gaussian Splatting (gsplat 1.5.3): 200k flat surfels initialised from the textured mesh, optimised against 32 undistorted, chroma-keyed views (L1 + SSIM + alpha). Mean training-view PSNR ≈ 32 dB (vs 26.7 dB for textured mesh alone).",
      "Nine sequences (58,843 frames total) delivered as standard 3DGS PLY per frame and as quantised web sequences (.gsq, ≈3.4 MB/frame).",
      "Movement annotation: 35 movement occurrences (MVM_001–MVM_035) marked by start and end frame in both slow sequences and linked to the 275 scenes (SNE) of the database.",
    ],
    editionText: "The stage plays frames 2242–2540 of the H_fast sequence (hanbok, 150 frames at 15 fps), decoded in a Web Worker from PNG-packed .gsq bytes. You can also open any downloaded .gsq folder directly from disk or snap the 3D stage to any of the 32 physical HOLOSYS cameras.",
    clipsReady: (n) => `${n} movement excerpts are available.`,
    download: "Download scene database (db.json)",
    downloadCams: "Download 32-camera calibration (cameras.json)",
    buildNote: "Compiled from the Chunaengjeon interpretation workbook (해설자료집_보완본.xlsm) and frame annotations via tools/build_data.py.",
  },
  ko: {
    title: "4D로 보는 춘앵전",
    subtitle: "볼류메트릭 기록을 장면 중심으로 해설하는 디지털 헤리티지 워크스테이션",
    wsSplit: "스튜디오 분할",
    wsCinema: "4D 시네마",
    wsEditorial: "에디토리얼 도록",
    cmdPlaceholder: "춤사위 · 해설 · 카메라 검색…",
    source: "GitHub",
    stageTitle: "4D 볼류메트릭 스테이지",
    radarTitle: "HOLOSYS 32대 카메라 정합 링 맵",
    capture: "볼류메트릭 촬영",
    sequence: "재생 시퀀스",
    range: "프레임 구간",
    model: "복원 모델",
    registration: "기하 정합",
    reset: "시점 초기화",
    camLabel: "카메라 시점",
    freeOrbit: "자유 궤도 시점 (3D)",
    matGuide: "화문석 · 리그",
    openFolder: ".gsq 열기",
    hint: "드래그 회전 · 우클릭/Shift 이동 · 휠 줌 · Space 재생 · C 카메라 순환 · ⌘K 통합 검색",
    tabMovement: "춤사위 해부",
    tabThemes: "10대 해설 경로",
    tabMatrix: "9개 시퀀스 · 비교",
    tabData: "4DGS 파이프라인",
    timeline: "4D 시퀀스에 주석된 35개 춤사위와 평조회상 반주 흐름",
    music: "반주 악곡",
    musicSub: "장면 연결 기준",
    noPiece: "무반주 (창사 · 인사)",
    hanbok: "한복 (여령)",
    hanbokSub: "h_slow_high · 15,490 fr.",
    practice: "연습복",
    practiceSub: "b_slow · 15,970 fr.",
    inRecordings: "4D 기록 속 위치",
    recording: "기록 시퀀스",
    frames: "프레임 구간",
    time: "시작 시각",
    duration: "소요 시간",
    ratio: (r) => `이 춤사위에서 연습복 실연은 한복 실연 시간의 ${r}입니다.`,
    recurs: "공연 안에서 다시 나오는 곳",
    once: "이 춤사위는 전체 공연에서 한 번 등장합니다.",
    accompaniment: "반주 악곡",
    verse: "창사 (唱詞)",
    steps: (n) => `장면 구성 · ${n}단계`,
    stepsNote: "장면 설명은 국립국악원 『궁중무용무보』 제2집(1987)에 근거합니다. 각 장면을 누르면 해당 구간의 추정 프레임 위치를 확인합니다.",
    jangguLegend: "장구 악상기호 범례 (기호를 누르면 상세 해설 팝오버가 열립니다)",
    provenance: "전승 근거 및 출처",
    lineage: "전승 계보",
    needsCheck: "파라데이터 · 데이터에 남아 있는 확인 사항",
    prev: "← 이전",
    next: "다음 →",
    of: "/",
    JumpMvm: "춤사위 바로가기",
    altNames: "이명칭",
    noClip: "이 춤사위의 개별 4D 발췌는 경량 웹판에 포함하지 않았습니다(느린 시퀀스 전체는 각 49–51 GB). 좌측 하단 '.gsq 열기'로 로컬 시퀀스를 직접 불러올 수 있습니다.",
    playClip: (s) => `4D 재생 · ${s}`,
    backToSample: "H_fast 발췌로 돌아가기",
    loading: "4D Gaussian Splatting 프레임을 복원하는 중…",
    webgl: "이 브라우저는 WebGL2를 지원하지 않습니다. 최신 Chrome, Edge, Firefox, Safari에서 열어 주세요.",
    localErr: "선택한 폴더에 frame_XXXXX.gsq 또는 .png 파일이 없습니다.",
    selected: "선택한 춤사위",
    openMovement: "이 춤사위 열기",
    classes: "결합하는 클래스",
    pieceCols: ["악곡", "계통", "속도", "정간", "장단수", "장면수"],
    suiteFilterAll: "영산회상 3계통 전체 비교 (14)",
    suiteFilterPerf: "춘앵전 반주 악곡 (평조회상, 6)",
    pieceOrigin: "문헌 유래",
    pieceStructure: "장단 구조",
    instrumentCols: ["악기", "세부 종류", "유형", "음역", "주법 및 음향적 특징"],
    instFilterAll: "수록 국악기 및 세부 변종 전체 (20)",
    instFilterPerf: "평조회상 반주 편성 기본 악기 (9)",
    hansam: (n) => `오색 한삼의 움직임을 직접 기술하는 장면 설명 ${n}개:`,
    lineageNote: "장면 설명은 김천흥의 인적 계보와 1987년 무보를 근거로 작성되었으며, 볼류메트릭 촬영은 별도의 현대 실연 기록입니다. 플랫폼은 해설의 전승 근거와 실연의 출처를 구분해 제시합니다.",
    perfRecord: "볼류메트릭 실연 기록",
    cmpNote: "두 기록에서 35개 춤사위 각각의 수행 길이 비교(금색: 한복, 회백색: 연습복). 행을 누르면 해당 춤사위로 즉시 이동합니다.",
    record: "4D 복원 파이프라인",
    edition: "이 웹판에 담긴 내용",
    seqArchive: "구축된 4DGS 시퀀스 아카이브 (9개 시퀀스 · 58,843 프레임)",
    calibVerify: "32대 카메라 기하 정합 및 실루엣 검증 (IoU 0.960)",
    modelTitle: "장면 중심 지식 모델 (NoSQL v12)",
    paradata: "파라데이터: 임의로 메우지 않고 드러내 두는 확인 사항",
    sources: "문헌 및 영상 출처",
    dataFiles: "데이터셋 내려받기",
    matDiagramTitle: "화문석(花紋席) 위 공간 동선",
    entityHint: "핵심 개념 인터랙티브 사전 (클릭하여 상세 보기)",
    pipeline: [
      "볼류메트릭 촬영: 4DViews HOLOSYS 동기 카메라 32대, 2448×2048, 30 fps. 프레임별 텍스처 메시(Alembic)와 2880×2880 텍스처.",
      "메시 기준 카메라 정합: 렌더한 메시와 각 카메라 영상을 SIFT로 매칭하고, 렌더 깊이로 2D–3D 대응점을 구해 PnP 및 내부 파라미터(초점거리, 주점, k1) 보정. 재투영 오차 1.40–1.61 px, 실루엣 IoU 0.960.",
      "프레임별 3D Gaussian Splatting(gsplat 1.5.3): 텍스처 메시 표면에서 서펠 20만 개로 초기화 후 왜곡 보정·크로마키 처리한 32개 시점으로 최적화(L1 + SSIM + 알파). 학습 시점 평균 PSNR 약 32 dB(메시 텍스처 단독 26.7 dB).",
      "총 9개 시퀀스(58,843 프레임) 학습 완료. 표준 3DGS PLY 및 웹 실시간 스트리밍용 양자화 시퀀스(.gsq, 프레임당 약 3.4 MB) 산출.",
      "동작 주석: 느린 시퀀스(한복·연습복)마다 35개 춤사위(MVM)의 시작·끝 프레임을 주석하고 데이터베이스의 275개 장면(SNE)과 연결.",
    ],
    editionText: "무대는 H_fast(한복) 시퀀스의 2242–2540 프레임을 15 fps(150프레임)로 재생합니다. 또한 좌측 하단 툴바에서 로컬 디스크의 .gsq 시퀀스 폴더를 직접 열거나, 32대 실제 HOLOSYS 카메라 시점으로 즉시 스냅할 수 있습니다.",
    clipsReady: (n) => `춤사위 발췌 ${n}개를 바로 재생할 수 있습니다.`,
    download: "장면 중심 데이터베이스 내려받기 (db.json)",
    downloadCams: "32대 카메라 정합 파라미터 내려받기 (cameras.json)",
    buildNote: "춘앵전 콘텐츠 해설집(해설자료집_보완본.xlsm)과 프레임 주석 CSV에서 tools/build_data.py로 생성되었습니다.",
  },
};

const PIECE_ORDER = ["상령산", "중령산", "세령산", "염불도드리", "빠른 도드리", "타령"];
const FPS = 30;

// 9 sequences documented in chunangzen_4DGS
const ARCHIVE_SEQS = [
  { id: "h_slow_high", costume_ko: "한복 (여령)", costume_en: "Hanbok (court costume)", tempo_ko: "느린 춤 (본공연)", tempo_en: "Slow (full choreography)", frames: 15490, dur: "8:36.3", webGb: "49.0 GB", iou: "0.946", img: "media/stills/h_slow_high_cam001_mid.jpg" },
  { id: "b_slow", costume_ko: "검은 연습복", costume_en: "Practice clothes", tempo_ko: "느린 춤 (본공연)", tempo_en: "Slow (full choreography)", frames: 15970, dur: "8:52.3", webGb: "50.6 GB", iou: "0.881", img: "media/stills/b_slow_cam001_mid.jpg" },
  { id: "m_slow", costume_ko: "모션캡처 슈트", costume_en: "MoCap marker suit", tempo_ko: "느린 춤 (본공연)", tempo_en: "Slow (full choreography)", frames: 15539, dur: "8:38.0", webGb: "49.2 GB", iou: "—", img: "media/stills/m_slow_cam001_mid.jpg" },
  { id: "H_fast", costume_ko: "한복 (여령)", costume_en: "Hanbok (court costume)", tempo_ko: "빠른 춤 (웹 발췌 내장)", tempo_en: "Fast (excerpt bundled)", frames: 3594, dur: "1:59.8", webGb: "11.1 GB", iou: "0.960", img: "media/stills/H_fast_cam001_mid.jpg" },
  { id: "b_fast", costume_ko: "검은 연습복", costume_en: "Practice clothes", tempo_ko: "빠른 춤", tempo_en: "Fast", frames: 4598, dur: "2:36.0", webGb: "14.5 GB", iou: "0.888", img: "media/stills/b_fast_cam001_mid.jpg" },
  { id: "m_fast", costume_ko: "모션캡처 슈트", costume_en: "MoCap marker suit", tempo_ko: "빠른 춤", tempo_en: "Fast", frames: 3440, dur: "1:54.7", webGb: "10.9 GB", iou: "—", img: "media/stills/m_fast_cam001_mid.jpg" },
  { id: "h_T-pose", costume_ko: "한복 (여령)", costume_en: "Hanbok (court costume)", tempo_ko: "T-포즈 보정", tempo_en: "T-pose calibration", frames: 125, dur: "0:04.2", webGb: "0.4 GB", iou: "0.947", img: "media/stills/h_T-pose_cam001_mid.jpg" },
  { id: "m_T-pose", costume_ko: "모션캡처 슈트", costume_en: "MoCap marker suit", tempo_ko: "T-포즈 보정", tempo_en: "T-pose calibration", frames: 67, dur: "0:02.2", webGb: "0.2 GB", iou: "0.870", img: "media/stills/m_T-pose_cam001_mid.jpg" },
  { id: "m_A-pose", costume_ko: "모션캡처 슈트", costume_en: "MoCap marker suit", tempo_ko: "A-포즈 보정", tempo_en: "A-pose calibration", frames: 20, dur: "0:00.7", webGb: "0.1 GB", iou: "0.878", img: "media/stills/m_A-pose_cam001_mid.jpg" },
];

// ---------------------------------------------------------------- State
const state = {
  lang: "ko",
  theme: "dark",       // "dark" (open-design/linear-app) | "editorial" (open-design/warm-editorial)
  workspace: "split",  // "split" | "cinema" | "editorial"
  sel: null,
  selScene: null,
  tab: "move",         // "move" | "theme" | "matrix" | "data"
  clip: null,
  suiteAll: false,
  instAll: false,
  cmdOpen: false,
  cmdIdx: 0,
  cmdItems: [],
};

try {
  const params = new URLSearchParams(location.search);
  const l = params.get("lang") || localStorage.getItem("c4d-lang");
  if (l === "ko" || l === "en") state.lang = l;
  const th = params.get("theme") || localStorage.getItem("c4d-theme");
  if (th === "dark" || th === "editorial") state.theme = th;
} catch {}

const t = (k, ...a) => { const v = UI[state.lang][k]; return typeof v === "function" ? v(...a) : v; };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = (s) => document.querySelector(s);

let db, en, M, S, P, I, SEQ, clips = {}, cams = {};
const fmt = (frame) => { const s = Math.max(0, (frame - 1) / FPS); return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`; };
const dur = (seg) => (seg.end - seg.start + 1) / FPS;

function mvName(m, { withHanja = false } = {}) {
  const e = en.movements[m.name] || {};
  const main = state.lang === "en" ? (e.roman || m.name) : m.name;
  const hj = m.hanja || e.hanja;
  return withHanja && hj ? `${main} ${hj}` : main;
}
function pieceName(p) {
  const e = en.pieces[p.name];
  return state.lang === "en" && e ? e.roman : p.name;
}
function pieceVar(p) {
  const i = PIECE_ORDER.indexOf(p?.name);
  return i < 0 ? "var(--p0)" : `var(--p${i + 1})`;
}
function movementPiece(m) {
  const c = {};
  for (const s of m.scenes || []) {
    const p = S[s]?.piece;
    if (p) c[p] = (c[p] || 0) + 1;
  }
  const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  return best ? P[best[0]] : null;
}
function flagged(v) {
  return typeof v === "string" && /(확인 필요|자문 필요|확인 전)/.test(v);
}

// ============================================================================
// EMIL KOWALSKI RECIPE 1: DUAL-LAYER CLIP-PATH TAB INDICATOR
// ============================================================================
function updateClipPathTabs(baseContainer, overlayEl, activeSelector, borderRadius = "6px", instant = false) {
  if (!baseContainer || !overlayEl) return;
  const activeBtn = baseContainer.querySelector(activeSelector);
  if (!activeBtn) return;
  const totalW = baseContainer.offsetWidth;
  if (!totalW) return;
  const leftPct = (activeBtn.offsetLeft / totalW) * 100;
  const rightPct = Math.max(0, 100 - ((activeBtn.offsetLeft + activeBtn.offsetWidth) / totalW) * 100);
  if (instant) {
    overlayEl.style.transition = "none";
  } else {
    overlayEl.style.transition = "";
  }
  overlayEl.style.clipPath = `inset(0 ${rightPct.toFixed(2)}% 0 ${leftPct.toFixed(2)}% round ${borderRadius})`;
  if (instant) {
    void overlayEl.offsetWidth;
    overlayEl.style.transition = "";
  }
}

function syncAllClipPathTabs(instant = false) {
  updateClipPathTabs($("#dossierTabsBase"), $("#dossierTabsOverlay"), 'button[aria-selected="true"]', "6px", instant);
  updateClipPathTabs($(".ws-tabs-base"), $("#wsOverlay"), 'button[aria-pressed="true"]', "5px", instant);
}
window.addEventListener("resize", () => syncAllClipPathTabs(true));

// ============================================================================
// EMIL KOWALSKI RECIPE 2: INSTANT-SUBSEQUENT FLOATING TOOLTIP (data-instant)
// ============================================================================
const tooltipEl = $("#floatingTooltip");
let tooltipWarmTimer = null;
let tooltipIsWarm = false;

function showEmilTooltip(targetEl, { kicker = "", title = "", meta = "" }) {
  if (!tooltipEl || !targetEl) return;
  clearTimeout(tooltipWarmTimer);
  $("#ttKicker").textContent = kicker;
  $("#ttTitle").textContent = title;
  $("#ttMeta").textContent = meta;

  tooltipEl.hidden = false;
  if (tooltipIsWarm) {
    tooltipEl.setAttribute("data-instant", "true");
    tooltipEl.removeAttribute("data-starting-style");
  } else {
    tooltipEl.removeAttribute("data-instant");
    tooltipEl.setAttribute("data-starting-style", "");
    requestAnimationFrame(() => {
      tooltipEl.removeAttribute("data-starting-style");
    });
  }
  tooltipIsWarm = true;

  const rect = targetEl.getBoundingClientRect();
  const ttRect = tooltipEl.getBoundingClientRect();
  const left = Math.min(window.innerWidth - ttRect.width - 12, Math.max(12, rect.left + rect.width / 2 - ttRect.width / 2));
  const top = Math.max(12, rect.top - ttRect.height - 8);
  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

function hideEmilTooltip() {
  if (!tooltipEl) return;
  tooltipEl.hidden = true;
  clearTimeout(tooltipWarmTimer);
  tooltipWarmTimer = setTimeout(() => {
    tooltipIsWarm = false;
    tooltipEl.removeAttribute("data-instant");
  }, 380);
}

// ============================================================================
// EMIL KOWALSKI RECIPE 3: ORIGIN-AWARE ENTITY INSPECTOR POPOVER
// ============================================================================
const popoverEl = $("#entityPopover");

function openEntityPopover(triggerEl, data) {
  if (!popoverEl || !triggerEl || !data) return;
  const ko = state.lang === "ko";
  $("#popBadge").textContent = data.badge || "HERITAGE ENTITY";
  $("#popTitle").textContent = ko ? data.title_ko : (data.title_en || data.title_ko);
  $("#popBody").textContent = ko ? data.body_ko : (data.body_en || data.body_ko);
  $("#popFoot").textContent = data.foot || "";

  popoverEl.hidden = false;
  popoverEl.setAttribute("data-starting-style", "");

  const trigRect = triggerEl.getBoundingClientRect();
  const popRect = popoverEl.getBoundingClientRect();
  const left = Math.min(window.innerWidth - popRect.width - 14, Math.max(14, trigRect.left + trigRect.width / 2 - popRect.width / 2));
  const showAbove = trigRect.bottom + popRect.height + 16 > window.innerHeight;
  const top = showAbove ? Math.max(14, trigRect.top - popRect.height - 8) : trigRect.bottom + 8;

  const originX = Math.round(trigRect.left + trigRect.width / 2 - left);
  const originY = showAbove ? popRect.height : 0;
  popoverEl.style.setProperty("--transform-origin", `${originX}px ${originY}px`);
  popoverEl.style.left = `${left}px`;
  popoverEl.style.top = `${top}px`;

  requestAnimationFrame(() => {
    popoverEl.removeAttribute("data-starting-style");
  });
}

function closeEntityPopover() {
  if (!popoverEl || popoverEl.hidden) return;
  popoverEl.hidden = true;
}
$("#popClose").onclick = closeEntityPopover;

// ============================================================================
// WORKSPACE MODE & DESIGN SYSTEM THEME SWITCHERS
// ============================================================================
function setWorkspaceMode(mode, { instant = false } = {}) {
  state.workspace = mode;
  document.documentElement.dataset.workspace = mode;
  document.querySelectorAll(".ws-btn[data-ws]").forEach(b => {
    b.setAttribute("aria-pressed", String(b.dataset.ws === mode));
  });
  syncAllClipPathTabs(instant);
  window.dispatchEvent(new Event("resize"));
}

document.querySelectorAll(".ws-btn[data-ws]").forEach(btn => {
  btn.onclick = () => setWorkspaceMode(btn.dataset.ws);
});

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  const label = $("#themeLabel");
  if (label) {
    label.textContent = theme === "editorial" ? "Warm Editorial" : "Linear Dark";
  }
  try { localStorage.setItem("c4d-theme", theme); } catch {}
}

$("#themeToggle").onclick = () => {
  applyTheme(state.theme === "dark" ? "editorial" : "dark");
};

// ============================================================================
// SPLAT PLAYER & 32-CAMERA INTERACTIVE RADAR
// ============================================================================
const msgEl = $("#msg");
const camSelect = $("#camSelect");
const player = createSplatPlayer({
  canvas: $("#c"),
  onMessage: (k, d) => {
    msgEl.hidden = !k;
    msgEl.textContent = k === "loading" ? t("loading") : k === "webgl" ? t("webgl") : k ? `${k} ${d || ""}` : "";
  },
  onFrame: ({ index, count, source, splats }) => {
    $("#seek").max = count - 1;
    $("#seek").value = index;
    $("#stat").textContent = `${String(source).padStart(5, "0")} · ${index + 1}/${count} · ${(splats / 1000).toFixed(0)}k`;
  },
  onBuffer: (f) => {
    $("#buf").style.width = (100 * f).toFixed(1) + "%";
  },
  onPlayState: (p) => {
    $("#play").innerHTML = p ? ICONS.pause : ICONS.play;
  },
  onCameraChange: (camId) => {
    if (camSelect) camSelect.value = camId || "";
    updateRadarActiveCamera(camId);
  },
});

if (player) {
  $("#play").onclick = () => player.toggle();
  $("#reset").onclick = () => player.resetView();
  $("#stepPrev").onclick = () => { player.pause(); player.step(-1); };
  $("#stepNext").onclick = () => { player.pause(); player.step(1); };
  $("#seek").addEventListener("input", e => { player.pause(); player.seek(+e.target.value); });

  $("#toggleGuide").onclick = (e) => {
    const on = player.toggleGuide();
    e.currentTarget.setAttribute("aria-pressed", String(on));
  };

  camSelect.onchange = (e) => {
    player.snapToCamera(e.target.value || null);
  };

  document.querySelectorAll("[data-cam-preset]").forEach(btn => {
    btn.onclick = () => {
      const keys = Object.keys(cams).sort();
      if (!keys.length) return;
      const map = { front: keys[0], side: keys[Math.min(8, keys.length - 1)], overhead: keys[Math.min(27, keys.length - 1)] };
      const targetCam = map[btn.dataset.camPreset];
      if (targetCam) player.snapToCamera(targetCam);
    };
  });

  $("#dirInput").addEventListener("change", async (e) => {
    if (!e.target.files?.length) return;
    const info = await player.loadLocalFiles(e.target.files);
    if (!info) {
      msgEl.hidden = false;
      msgEl.textContent = t("localErr");
      setTimeout(() => { msgEl.hidden = true; }, 3500);
      return;
    }
    state.clip = { local: true };
    $("#seqLabel").textContent = `${info.folder} · local`;
    $("#range").textContent = `${info.first}–${info.last} · ${info.count} fr. @ ${info.fps} fps`;
    renderStageNote();
  });

  $("#c").tabIndex = 0;
}

// Collapsible HUD plate & 32-Camera Radar Toggle
$("#togglePlate").onclick = (e) => {
  const plate = $("#hudPlate");
  const open = plate.dataset.collapsed !== "true";
  plate.dataset.collapsed = String(open);
  e.currentTarget.setAttribute("aria-expanded", String(!open));
};

$("#toggleRadar").onclick = (e) => {
  const box = $("#camRadarBox");
  const plate = $("#hudPlate");
  plate.dataset.collapsed = "false";
  $("#togglePlate").setAttribute("aria-expanded", "true");
  const nextOpen = box.hidden;
  box.hidden = !nextOpen;
  e.currentTarget.setAttribute("aria-expanded", String(nextOpen));
};

function camWorldPos(c) {
  if (Array.isArray(c?.position)) return c.position;
  const w = c?.w2c;
  if (!w) return [0, 0, 0];
  const R = [w[0].slice(0, 3), w[1].slice(0, 3), w[2].slice(0, 3)];
  const tVec = [w[0][3], w[1][3], w[2][3]];
  return [
    -(R[0][0] * tVec[0] + R[1][0] * tVec[1] + R[2][0] * tVec[2]),
    -(R[0][1] * tVec[0] + R[1][1] * tVec[1] + R[2][1] * tVec[2]),
    -(R[0][2] * tVec[0] + R[1][2] * tVec[1] + R[2][2] * tVec[2]),
  ];
}

function renderCameraRadar() {
  const wrap = $("#camRadarSvgWrap");
  if (!wrap || !Object.keys(cams).length) return;
  const entries = Object.entries(cams).sort((a, b) => a[0].localeCompare(b[0])).map(([id, c]) => [id, c, camWorldPos(c)]);
  // Compute world bounds in X and Z (Y-down capture world: X is left-right, Z is front-back, Y is height)
  const xs = entries.map(([, , pos]) => pos[0]);
  const zs = entries.map(([, , pos]) => pos[2]);
  const maxR = Math.max(...xs.map(Math.abs), ...zs.map(Math.abs), 2.5);
  const mapCoord = (v) => 100 + (v / maxR) * 76;

  const nodes = entries.map(([id, c, pos]) => {
    const cx = mapCoord(pos[0]).toFixed(1);
    const cy = mapCoord(pos[2]).toFixed(1);
    const heightM = (-pos[1]).toFixed(2);
    return `<circle class="radar-cam-node" data-cam="${esc(id)}" data-reproj="${(c.reproj_px || 0).toFixed(2)}" data-z="${heightM}" cx="${cx}" cy="${cy}" r="4.2" fill="#6e9bc5" stroke="#08090a" stroke-width="1"/>`;
  }).join("");

  wrap.innerHTML = `<svg class="radar-svg" viewBox="0 0 200 200" role="img" aria-label="32 HOLOSYS Camera Ring">
    <circle cx="100" cy="100" r="76" fill="none" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 3"/>
    <circle cx="100" cy="100" r="52" fill="none" stroke="rgba(255,255,255,0.05)"/>
    <rect x="82" y="76" width="36" height="48" rx="2" fill="rgba(214,162,74,0.12)" stroke="#d6a24a" stroke-opacity="0.6" stroke-width="1.1"/>
    <text x="100" y="103" text-anchor="middle" fill="#d6a24a" font-size="7.5" font-family="var(--font-data)">花紋席</text>
    ${nodes}
  </svg>`;

  wrap.querySelectorAll(".radar-cam-node").forEach(node => {
    node.addEventListener("pointerenter", () => {
      const id = node.dataset.cam;
      showEmilTooltip(node, {
        kicker: `HOLOSYS CAMERA #${id}`,
        title: `Cam ${id} · Height ${node.dataset.z}m`,
        meta: `Reproj. error: ${node.dataset.reproj} px · Click to snap 3D stage`,
      });
    });
    node.addEventListener("pointerleave", hideEmilTooltip);
  });
}

function updateRadarActiveCamera(camId) {
  const info = $("#radarActiveInfo");
  if (info) {
    info.textContent = camId && cams[camId]
      ? `Cam ${camId} (${cams[camId].reproj_px.toFixed(2)}px)`
      : (state.lang === "ko" ? "자유 궤도" : "Free Orbit");
  }
  document.querySelectorAll(".radar-cam-node").forEach(n => {
    n.classList.toggle("active", n.dataset.cam === camId);
  });
}

async function loadSample() {
  state.clip = null;
  if (!player) return;
  const man = await player.loadManifest("media/sample/manifest.json").catch(() => null);
  $("#seqLabel").textContent = `H_fast · ${t("hanbok")}`;
  if (man) {
    const a = man.frames[0].match(/(\d+)\.png$/)[1], b = man.frames.at(-1).match(/(\d+)\.png$/)[1];
    $("#range").textContent = `${+a}–${+b} · ${man.frames.length} fr. @ ${man.fps} fps`;
  }
  renderStageNote();
}

async function loadClip(seqId, mvmId) {
  const url = clips[seqId]?.[mvmId];
  if (!url || !player) return;
  state.clip = { seqId, mvmId };
  const man = await player.loadManifest(url);
  const seq = SEQ.find(s => s.id === seqId), seg = seq.segments.find(g => g.movement === mvmId);
  $("#seqLabel").textContent = `${seqId} · ${mvName(M[mvmId])}`;
  $("#range").textContent = `${seg.start}–${seg.end} · ${man.frames.length} fr. @ ${man.fps} fps`;
  renderStageNote();
}

// ============================================================================
// SELECTION & DOSSIER TABS (WITH BLUR-MASKED CROSSFADE & CLIP-PATH SYNC)
// ============================================================================
function select(id, { tab = true, sceneId = null, instant = false } = {}) {
  if (!M[id]) return;
  state.sel = id;
  state.selScene = sceneId || M[id].scenes?.[0] || null;
  try { history.replaceState(null, "", `#${id}`); } catch {}
  renderMovement();
  renderLaneState();
  renderStageNote();
  updateCinemaOverlay();
  if (tab) showTab("move", { instant });
}

function updateCinemaOverlay() {
  const m = M[state.sel];
  if (!m) return;
  const titleEl = $("#cinemaTitle");
  const subEl = $("#cinemaSub");
  if (titleEl) titleEl.textContent = mvName(m, { withHanja: true });
  if (subEl) {
    const e = en.movements[m.name] || {};
    subEl.textContent = state.lang === "en" ? (e.definition || m.definition) : m.definition;
  }
}

function showTab(k, { instant = false } = {}) {
  const prev = state.tab;
  state.tab = k;
  const tabDefs = [
    ["move", "#t-move", "#p-move"],
    ["theme", "#t-theme", "#p-theme"],
    ["matrix", "#t-matrix", "#p-matrix"],
    ["data", "#t-data", "#p-data"],
  ];
  for (const [key, tid, pid] of tabDefs) {
    $(tid)?.setAttribute("aria-selected", String(key === k));
    const panel = $(pid);
    if (!panel) continue;
    if (key === k) {
      panel.hidden = false;
      if (prev !== k && !instant) {
        panel.classList.remove("panel-enter");
        void panel.offsetWidth;
        panel.classList.add("panel-enter");
      }
    } else {
      panel.hidden = true;
    }
  }
  syncAllClipPathTabs(instant);
}

$("#t-move").onclick = () => showTab("move");
$("#t-theme").onclick = () => showTab("theme");
$("#t-matrix").onclick = () => showTab("matrix");
$("#t-data").onclick = () => showTab("data");

// Delegated Click Handler
document.addEventListener("click", e => {
  // Close entity popover if clicking outside
  if (popoverEl && !popoverEl.hidden && !e.target.closest("#entityPopover") && !e.target.closest("[data-entity]") && !e.target.closest("[data-jg]")) {
    closeEntityPopover();
  }

  const entBtn = e.target.closest("[data-entity]");
  if (entBtn) {
    const key = entBtn.dataset.entity;
    if (ENTITY_DICT[key]) openEntityPopover(entBtn, ENTITY_DICT[key]);
    return;
  }

  const jgBtn = e.target.closest("[data-jg]");
  if (jgBtn) {
    const sym = jgBtn.dataset.jg;
    const gloss = JANGGU_GLOSS[sym];
    if (gloss) {
      openEntityPopover(jgBtn, {
        badge: `JANGGU NOTATION · ${sym}`,
        title_ko: `장구 기호 「${sym}」`,
        title_en: `Janggu Drum Symbol "${sym}"`,
        body_ko: gloss.ko,
        body_en: gloss.en,
        foot: "국립국악원 『궁중무용무보』 제2집(1987) 정간보 장구 부호",
      });
    }
    return;
  }

  const sc = e.target.closest("[data-scene]");
  if (sc) {
    state.selScene = sc.dataset.scene;
    document.querySelectorAll(".steps li").forEach(li => li.setAttribute("aria-current", String(li.dataset.scene === state.selScene)));
    renderStageNote();
    renderLaneState();
    return;
  }
  const b = e.target.closest("[data-mvm]");
  if (b) { select(b.dataset.mvm); return; }
  const c = e.target.closest("[data-clip]");
  if (c) { const [s, m] = c.dataset.clip.split("|"); loadClip(s, m); return; }
  if (e.target.closest("[data-sample]")) { loadSample(); return; }
  const camBtn = e.target.closest("[data-cam]");
  if (camBtn && player) {
    player.snapToCamera(camBtn.dataset.cam || null);
    return;
  }
});

// ============================================================================
// SYNCHRONIZED MULTI-TRACK CHOREOGRAPHY TIMELINE
// ============================================================================
function renderLegend() {
  const used = PIECE_ORDER.filter(n => db.scenes.some(s => P[s.piece]?.name === n));
  $("#legend").innerHTML = used.map(n => `<span class="leg-item"><i class="piece-dot" style="background:${pieceVar({ name: n })}"></i>${esc(state.lang === "en" ? en.pieces[n]?.roman || n : n)}</span>`).join("")
    + `<span class="leg-item"><i class="piece-dot" style="background:var(--p0)"></i>${esc(t("noPiece"))}</span>`
    + `<span class="leg-item"><i class="piece-dot verse-dot"></i>${esc(t("verse"))}</span>`;
}

function renderLanes() {
  const total = Math.max(...SEQ.map(s => s.frames));
  const pct = (f) => ((f - 1) / total * 100).toFixed(3) + "%";
  const w = (a, b) => ((b - a + 1) / total * 100).toFixed(3) + "%";
  const verseMvms = new Set(db.scenes.filter(s => s.lyrics).map(s => s.movement));
  const hb = SEQ[0];

  const blocks = [];
  for (const g of hb.segments) {
    const p = movementPiece(M[g.movement]);
    const last = blocks.at(-1);
    if (last && last.p === p) last.end = g.end;
    else blocks.push({ p, start: g.start, end: g.end });
  }
  const music = `<div class="lane"><div class="lane-label"><div><span class="lane-title">${esc(t("music"))}</span><small>${esc(t("musicSub"))}</small></div></div>
    <div class="bar music">${blocks.map(b => `<div class="seg-m" title="${esc(b.p ? pieceName(b.p) : t("noPiece"))}" style="left:${pct(b.start)};width:${w(b.start, b.end)};background:${pieceVar(b.p)}"></div>`).join("")}</div></div>`;

  const lanes = SEQ.map((seq, k) => {
    const label = k === 0 ? [t("hanbok"), t("hanbokSub")] : [t("practice"), t("practiceSub")];
    const still = { h_slow_high: 7745, b_slow: 7985 }[seq.id];
    const segs = seq.segments.map((g, i) => {
      const m = M[g.movement], p = movementPiece(m), wide = (g.end - g.start) / total > 0.028;
      const titleStr = `${i + 1}. ${mvName(m, { withHanja: true })}`;
      const metaStr = `${label[0]} · ${fmt(g.start)}–${fmt(g.end)} (${dur(g).toFixed(1)}s · fr. ${g.start}–${g.end})`;
      const hoverTxt = `${titleStr} · ${metaStr}`;
      return `<button class="seg-b${verseMvms.has(g.movement) ? " has-verse" : ""}" data-mvm="${g.movement}" data-seq="${seq.id}"
        data-tt-kicker="${esc(`${m.id} · ${p ? pieceName(p) : t("noPiece")}`)}"
        data-tt-title="${esc(titleStr)}"
        data-tt-meta="${esc(metaStr)}"
        data-hover="${esc(hoverTxt)}"
        style="left:${pct(g.start)};width:${w(g.start, g.end)};background:${pieceVar(p)}"
        aria-label="${esc(hoverTxt)}">${wide ? `<span>${esc(mvName(m))}</span>` : ""}</button>`;
    }).join("");
    const pre = seq.preroll ? `<div class="preroll" title="pre-roll, frames ${seq.preroll[0]}–${seq.preroll[1]}" style="left:${pct(seq.preroll[0])};width:${w(...seq.preroll)}"></div>` : "";
    const mark = still ? `<div class="mark" title="cam-001 mid-frame ${still}" style="left:${pct(still)}"></div>` : "";
    return `<div class="lane"><div class="lane-label"><img src="media/stills/${seq.id}.jpg" alt="${esc(`${label[0]}: camera 1, frame ${still}`)}" loading="lazy">
      <div><span class="lane-title">${esc(label[0])}</span><small>${esc(label[1])}</small></div></div><div class="bar" data-seq-bar="${seq.id}">${pre}${segs}${mark}<div class="scene-pin" id="pin-${seq.id}" hidden></div></div></div>`;
  }).join("");

  const ticks = [];
  for (let s = 0; s * FPS <= total; s += 60) {
    ticks.push(`<span style="left:${(s * FPS / total * 100).toFixed(2)}%">${s / 60}:00</span>`);
  }
  $("#lanes").innerHTML = music + lanes + `<div class="lane"><div class="lane-label"></div><div class="scale">${ticks.join("")}</div></div>`;

  // Wire Emil Kowalski Instant-Subsequent Tooltip + Header Readout
  const hoverEl = $("#tlHoverInfo");
  document.querySelectorAll(".seg-b").forEach(btn => {
    btn.addEventListener("pointerenter", () => {
      if (hoverEl) hoverEl.textContent = btn.dataset.hover || "";
      showEmilTooltip(btn, {
        kicker: btn.dataset.ttKicker,
        title: btn.dataset.ttTitle,
        meta: btn.dataset.ttMeta,
      });
    });
    btn.addEventListener("pointerleave", () => {
      if (hoverEl) hoverEl.textContent = "";
      hideEmilTooltip();
    });
  });

  renderLaneState();
}

function renderLaneState() {
  const sel = M[state.sel];
  const total = Math.max(...SEQ.map(s => s.frames));
  document.querySelectorAll(".seg-b").forEach(b => {
    const m = M[b.dataset.mvm];
    b.setAttribute("aria-current", String(b.dataset.mvm === state.sel));
    b.classList.toggle("same", !!sel && b.dataset.mvm !== state.sel && m.name === sel.name);
  });

  document.querySelectorAll(".mv-pill").forEach(pill => {
    pill.setAttribute("aria-current", String(pill.dataset.mvm === state.sel));
  });

  for (const seq of SEQ) {
    const pin = document.getElementById(`pin-${seq.id}`);
    if (!pin) continue;
    const seg = seq.segments.find(g => g.movement === state.sel);
    const scList = sel?.scenes || [];
    const scIdx = scList.indexOf(state.selScene);
    if (seg && scIdx >= 0 && scList.length > 0) {
      const frac = (scIdx + 0.5) / scList.length;
      const estFrame = Math.round(seg.start + frac * (seg.end - seg.start));
      pin.style.left = ((estFrame - 1) / total * 100).toFixed(3) + "%";
      pin.hidden = false;
    } else {
      pin.hidden = true;
    }
  }
}

// ============================================================================
// STAGE NOTE HUD
// ============================================================================
function renderStageNote() {
  const el = $("#stageNote"), m = M?.[state.sel];
  if (!el) return;
  if (!m) { el.innerHTML = ""; return; }
  const scList = m.scenes || [];
  const scIdx = Math.max(0, scList.indexOf(state.selScene));
  const curScene = S[state.selScene];

  const rows = SEQ.map(seq => {
    const g = seq.segments.find(x => x.movement === m.id);
    if (!g) return "";
    const estStart = Math.round(g.start + (scIdx / Math.max(1, scList.length)) * (g.end - g.start));
    const estEnd = Math.round(g.start + ((scIdx + 1) / Math.max(1, scList.length)) * (g.end - g.start));
    const label = seq.id === "h_slow_high" ? t("hanbok") : t("practice");
    return `<div class="sn-row"><span>${esc(label)}</span><span class="mono">${g.start}–${g.end}${curScene ? ` <em>(${curScene.id} ≈ ${estStart}–${estEnd})</em>` : ""}</span></div>`;
  }).filter(Boolean).join("");

  const avail = SEQ.filter(seq => clips[seq.id]?.[m.id]);
  const btns = avail.map(seq => `<button class="btn" type="button" data-clip="${seq.id}|${m.id}">${esc(t("playClip", seq.id === "h_slow_high" ? t("hanbok") : t("practice")))}</button>`).join("")
    + (state.clip ? `<button class="btn" type="button" data-sample>${esc(t("backToSample"))}</button>` : "");

  el.innerHTML = `<div class="sn-kicker"><span class="mono">${esc(t("selected"))} · ${m.id}</span></div>
    <strong class="sn-title">${esc(mvName(m, { withHanja: true }))}</strong>
    <div class="sn-metrics">${rows}</div>
    ${avail.length ? "" : `<p class="long">${esc(t("noClip"))}</p>`}
    ${btns ? `<div class="row">${btns}</div>` : ""}`;
}

// ============================================================================
// SPATIAL PATH DIAGRAM ON HWAMUNSEOK MAT (SVG)
// ============================================================================
function movementMatSvg(mName) {
  const paths = {
    "향섭족도": { label_ko: "화문석 중앙 전진 (4보)", label_en: "Forward stepping along center axis (4 steps)", svg: `<line x1="60" y1="68" x2="60" y2="22" stroke="var(--gold)" stroke-width="2" stroke-dasharray="3 2"/><polygon points="60,16 55,25 65,25" fill="var(--gold)"/><circle cx="60" cy="68" r="3.5" fill="var(--text)"/>` },
    "탑탑고": { label_ko: "세 걸음 전진하며 양팔 거수", label_en: "Three steps advancing forward", svg: `<line x1="60" y1="66" x2="60" y2="24" stroke="var(--gold)" stroke-width="2"/><polygon points="60,18 55,27 65,27" fill="var(--gold)"/><circle cx="60" cy="66" r="3.5" fill="var(--text)"/>` },
    "소섬수": { label_ko: "전진 및 후퇴 동선", label_en: "Linear advance along the mat", svg: `<line x1="60" y1="65" x2="60" y2="25" stroke="var(--gold)" stroke-width="2"/><polygon points="60,19 55,27 65,27" fill="var(--gold)"/><circle cx="60" cy="65" r="3.5" fill="var(--text)"/>` },
    "사예거": { label_ko: "좌우 대칭 이동 (우 2보 왕복 · 좌 2보 왕복)", label_en: "Symmetrical lateral travel (right 2 steps & back, left 2 steps & back)", svg: `<path d="M60 44 L96 44 M60 44 L24 44" stroke="var(--gold)" stroke-width="2"/><polygon points="100,44 92,40 92,48" fill="var(--gold)"/><polygon points="20,44 28,40 28,48" fill="var(--gold)"/><circle cx="60" cy="44" r="4" fill="var(--text)"/>` },
    "회란": { label_ko: "우회전 1바퀴 · 좌회전 1바퀴 대칭 선회", label_en: "Full rotation right (360°), then left (360°)", svg: `<path d="M44 44 A14 14 0 1 1 56 57" fill="none" stroke="var(--gold)" stroke-width="1.8"/><polygon points="58,57 51,53 53,61" fill="var(--gold)"/><path d="M76 44 A14 14 0 1 0 64 57" fill="none" stroke="var(--text)" stroke-width="1.5" stroke-dasharray="2 2"/><circle cx="60" cy="44" r="3" fill="var(--gold)"/>` },
    "회파신": { label_ko: "사방(四方)을 향하며 우·좌 회전", label_en: "Turning toward the four cardinal directions", svg: `<circle cx="60" cy="44" r="18" fill="none" stroke="var(--gold)" stroke-width="1.8" stroke-dasharray="4 3"/><path d="M60 20v48M36 44h48" stroke="var(--line)" stroke-width="1"/><circle cx="60" cy="44" r="3.5" fill="var(--text)"/>` },
    "과교선": { label_ko: "좌우 큰 원 그리며 회전", label_en: "Wide sweeping turn left and right", svg: `<ellipse cx="60" cy="44" rx="26" ry="16" fill="none" stroke="var(--gold)" stroke-width="1.8"/><polygon points="86,44 82,37 90,37" fill="var(--gold)"/><circle cx="60" cy="44" r="3.5" fill="var(--text)"/>` },
    "낙화유수": { label_ko: "좌우 한삼 뿌린 후 제자리 회전", label_en: "Flinging sleeves side to side & turning on the spot", svg: `<circle cx="60" cy="44" r="14" fill="none" stroke="var(--gold)" stroke-width="1.8"/><path d="M34 44h10M76 44h10" stroke="var(--text)" stroke-width="1.8"/><circle cx="60" cy="44" r="3.5" fill="var(--gold)"/>` },
    "당퇴립": { label_ko: "화문석 뒤쪽으로 번갈아 물러섬", label_en: "Alternating retreat toward the rear of the mat", svg: `<line x1="60" y1="22" x2="60" y2="64" stroke="var(--gold)" stroke-width="2" stroke-dasharray="3 2"/><polygon points="60,70 55,61 65,61" fill="var(--gold)"/><circle cx="60" cy="22" r="3.5" fill="var(--text)"/>` },
    "비금사": { label_ko: "뒷짐 진 채 후진 후 전진", label_en: "Retreating with hands behind back, then advancing", svg: `<path d="M55 24v40M65 64V24" stroke="var(--gold)" stroke-width="1.8"/><polygon points="55,68 51,61 59,61" fill="var(--gold)"/><polygon points="65,20 61,27 69,27" fill="var(--text)"/>` },
    "연귀소": { label_ko: "제비가 집으로 돌아가듯 화문석 맨 끝으로 후퇴", label_en: "Swallow returning to nest: retreating to rear edge of mat", svg: `<line x1="60" y1="20" x2="60" y2="68" stroke="var(--gold)" stroke-width="2"/><polygon points="60,74 55,65 65,65" fill="var(--gold)"/><circle cx="60" cy="20" r="3.5" fill="var(--text)"/>` },
  };
  const info = paths[mName] || {
    label_ko: "화문석 정중앙 제자리 호흡·굴신 및 상체 한삼 무작",
    label_en: "In-place knee flexion (gulsin) & upper-body sleeve choreography on the mat",
    svg: `<circle cx="60" cy="44" r="11" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="2 2"/><circle cx="60" cy="44" r="4" fill="var(--gold)"/>`,
  };
  const desc = state.lang === "ko" ? info.label_ko : info.label_en;
  return `<div class="mat-card">
    <svg class="mat-svg" viewBox="0 0 120 88" role="img" aria-label="${esc(desc)}">
      <rect x="14" y="8" width="92" height="72" rx="3" fill="var(--bg)" stroke="var(--gold)" stroke-opacity="0.45" stroke-width="1.2"/>
      <rect x="19" y="13" width="82" height="62" rx="1.5" fill="none" stroke="var(--line)" stroke-width="0.8"/>
      <line x1="19" y1="44" x2="101" y2="44" stroke="var(--line)" stroke-width="0.6" stroke-dasharray="2 2"/>
      <line x1="60" y1="13" x2="60" y2="75" stroke="var(--line)" stroke-width="0.6" stroke-dasharray="2 2"/>
      ${info.svg}
    </svg>
    <div class="mat-meta">
      <span class="mat-tag mono">${esc(t("matDiagramTitle"))}</span>
      <p>${esc(desc)}</p>
    </div>
  </div>`;
}

// ============================================================================
// TAB 1: MOVEMENT ANATOMY (#p-move)
// ============================================================================
function renderMovement() {
  const m = M[state.sel], el = $("#p-move");
  if (!m) { el.innerHTML = ""; return; }
  const e = en.movements[m.name] || {}, idx = db.movements.indexOf(m);
  const def = state.lang === "en" ? (e.definition || m.definition) : m.definition;
  const hj = m.hanja || e.hanja || "";
  const alts = m.alt?.length ? `<div class="mv-alt"><span class="note">${esc(t("altNames"))}:</span> ${m.alt.map(a => `<span class="badge-subtle">${esc(a)}</span>`).join(" ")}</div>` : "";

  // Horizontal 35-Movement Quick-Switch Ribbon
  const ribbon = `<div class="mv-ribbon" role="navigation" aria-label="35 Movements Ribbon">
    ${db.movements.map((x, i) => {
      const mp = movementPiece(x);
      return `<button type="button" class="mv-pill" data-mvm="${x.id}" aria-current="${String(x.id === m.id)}">
        <i style="background:${pieceVar(mp)}"></i>
        <span class="mono">${i + 1}</span>
        <span>${esc(mvName(x))}</span>
      </button>`;
    }).join("")}
  </div>`;

  // Top selector + Prev/Next bar
  const options = db.movements.map((x, i) => `<option value="${x.id}"${x.id === m.id ? " selected" : ""}>${i + 1}. ${esc(mvName(x, { withHanja: true }))} (${x.id})</option>`).join("");
  const topBar = `<div class="mv-topbar">
    <div class="mv-jump">
      <label for="mvmJump" class="sr-only">${esc(t("JumpMvm"))}</label>
      <select id="mvmJump" class="mvm-select">${options}</select>
    </div>
    <div class="mv-pager">
      <button class="btn-icon" type="button" ${idx > 0 ? `data-mvm="${db.movements[idx - 1].id}"` : "disabled"} aria-label="${esc(t("prev"))}">←</button>
      <span class="mono pager-count">${idx + 1} / ${db.movements.length}</span>
      <button class="btn-icon" type="button" ${idx < db.movements.length - 1 ? `data-mvm="${db.movements[idx + 1].id}"` : "disabled"} aria-label="${esc(t("next"))}">→</button>
    </div>
  </div>`;

  // Interactive Heritage Glossary Pills (Origin-Aware Popover triggers)
  const glossaryBar = `<div class="chips" aria-label="${esc(t("entityHint"))}">
    ${Object.keys(ENTITY_DICT).map(k => `<button type="button" class="entity-chip" data-entity="${esc(k)}">✦ ${esc(k)}</button>`).join("")}
  </div>`;

  const head = `<div class="mv-head">
    <div class="mv-kicker">
      <span class="mv-id mono">${m.id} · ${m.scenes?.[0] || ""}–${m.scenes?.at(-1) || ""}</span>
    </div>
    <h2 class="mv-name">${esc(state.lang === "en" ? e.roman || m.name : m.name)}${hj ? `<span class="hanja" lang="zh-Hant">${esc(hj)}</span>` : ""}</h2>
    <span class="mv-gloss">${esc(state.lang === "en" ? `${m.name} · “${e.gloss || ""}”` : `${e.roman || ""}${e.gloss ? ` · “${e.gloss}”` : ""}`)}</span>
    ${alts}
  </div>`;

  const flag = flagged(m.definition)
    ? `<div class="flag">${ICONS.flag}<div><strong>${esc(t("needsCheck"))}</strong><br>${esc(m.definition.match(/[^.]*?(확인 필요|자문 필요)[^.]*/)?.[0] || m.definition)}</div></div>`
    : "";

  const segs = SEQ.map(seq => ({ seq, g: seq.segments.find(x => x.movement === m.id) })).filter(x => x.g);
  const rec = `<div class="table-scroll"><table class="rec-table"><thead><tr><th>${t("recording")}</th><th class="num">${t("frames")}</th><th class="num">${t("time")}</th><th class="num">${t("duration")}</th></tr></thead><tbody>
    ${segs.map(({ seq, g }) => `<tr><td><span class="rec-badge ${seq.id === "h_slow_high" ? "hb" : "pr"}"></span>${esc(seq.id === "h_slow_high" ? t("hanbok") : t("practice"))}</td><td class="num">${g.start}–${g.end}</td><td class="num">${fmt(g.start)}–${fmt(g.end)}</td><td class="num">${dur(g).toFixed(1)} s</td></tr>`).join("")}</tbody></table></div>`;
  const ratio = segs.length === 2 ? `<p class="note">${esc(t("ratio", (dur(segs[1].g) / dur(segs[0].g)).toFixed(2) + "×"))}</p>` : "";

  const same = db.movements.filter(x => x.name === m.name && x.id !== m.id);
  const recurs = same.length
    ? `<div class="chips">${same.map(x => `<button class="chip" type="button" data-mvm="${x.id}">#${db.movements.indexOf(x) + 1} · ${fmt(SEQ[0].segments.find(g => g.movement === x.id).start)}</button>`).join("")}</div>`
    : `<p class="note">${esc(t("once"))}</p>`;

  const p = movementPiece(m);
  const pe = p ? `<div class="piece-card">
    <div class="piece-head"><i class="piece-dot" style="background:${pieceVar(p)}"></i><b>${esc(pieceName(p))}</b> ${p.hanja ? `<span class="hanja-sm" lang="zh-Hant">${esc(p.hanja)}</span>` : ""} <span class="note">· ${esc(state.lang === "en" ? en.suites[p.suite] || p.suite : p.suite)}</span></div>
    <p class="note">${esc(state.lang === "en" ? en.pieces[p.name]?.definition || p.definition : p.definition)}</p>
    <p class="note mono">${esc([p.jeonggan, p.tempo, p.cycles].filter(Boolean).join(" · "))}</p>
  </div>` : "";

  const scenes = (m.scenes || []).map(id => S[id]).filter(Boolean);
  const lyr = scenes.some(s => s.lyrics) ? `<h3>${t("verse")}</h3>${verseHtml()}` : "";

  const usedSymbols = [...new Set(scenes.flatMap(s => (s.janggu || "").split(",").map(x => x.trim())).filter(x => x && JANGGU_GLOSS[x]))];
  const jangguNote = usedSymbols.length
    ? `<div class="janggu-legend">${usedSymbols.map(sym => `<button type="button" class="jg-chip" data-jg="${esc(sym)}"><b class="mono">${esc(sym)}</b> ${esc(JANGGU_GLOSS[sym][state.lang].split("—")[0].split("(")[0].trim())}</button>`).join("")}</div>`
    : "";

  const steps = `<h3><span>${esc(t("steps", scenes.length))}</span><span class="mono" style="font-size:10px">${m.scenes?.[0] || ""}–${m.scenes?.at(-1) || ""}</span></h3>
    <p class="note">${esc(t("stepsNote"))}</p>
    ${jangguNote}
    <ol class="steps">${scenes.map((s, idxStep) => {
      const jg = s.janggu && s.janggu !== "—" ? s.janggu : "";
      const delay = Math.min(idxStep * 22, 200);
      return `<li data-scene="${s.id}" aria-current="${String(s.id === state.selScene)}" style="--stagger:${delay}ms">
        <div class="meta">
          <b>${s.id}</b>
          <span>${esc(s.jangdan || "")}</span>
          <div class="meta-badges">
            ${jg ? `<span class="jg-badge mono" data-jg="${esc(jg.split(",")[0].trim())}">${esc(jg)}</span>` : ""}
            ${s.order ? `<span class="ord-badge mono">#${s.order}</span>` : ""}
          </div>
        </div>
        <div class="txt" lang="ko">${esc(s.detail || "")}</div>
      </li>`;
    }).join("")}</ol>`;

  const refs = [...new Set(scenes.map(s => s.reference).filter(Boolean))];
  const trm = [...new Set(scenes.map(s => s.transmitter).filter(Boolean))].map(id => db.transmitters.find(x => x.id === id)).filter(Boolean);
  const prov = `<h3>${t("provenance")}</h3>
    <div class="prov-box">
      <p class="src">${esc(m.source || "")}</p>
      ${refs.map(r => `<p class="src">${esc(r)}</p>`).join("")}
      ${trm.length ? `<p class="src">${esc(t("lineage"))}: ${trm.map(x => `${esc(state.lang === "en" ? en.transmitters[x.id] : x.name)} ${esc(x.hanja || "")} (${esc(x.life || "")})`).join(", ")} · ${esc(scenes[0]?.lineage_type || "")}</p>` : ""}
    </div>`;

  const nav = `<div class="mv-footer-nav">
    ${idx > 0 ? `<button class="btn" type="button" data-mvm="${db.movements[idx - 1].id}">${t("prev")}: ${esc(mvName(db.movements[idx - 1]))}</button>` : "<span></span>"}
    ${idx < db.movements.length - 1 ? `<button class="btn" type="button" data-mvm="${db.movements[idx + 1].id}">${t("next")}: ${esc(mvName(db.movements[idx + 1]))}</button>` : ""}
  </div>`;

  el.innerHTML = ribbon + topBar + head + `<p class="def">${esc(def)}</p>` + glossaryBar + flag
    + movementMatSvg(m.name)
    + `<h3>${t("inRecordings")}</h3>${rec}${ratio}`
    + `<h3>${t("recurs")}</h3>${recurs}`
    + (pe ? `<h3>${t("accompaniment")}</h3>${pe}` : "")
    + lyr + steps + prov + nav;

  const jumpSel = $("#mvmJump");
  if (jumpSel) jumpSel.onchange = (ev) => select(ev.target.value);

  // Scroll active pill into view inside the ribbon
  const activePill = el.querySelector('.mv-pill[aria-current="true"]');
  if (activePill) activePill.scrollIntoView({ block: "nearest", inline: "center" });
}

function verseHtml() {
  return `<div class="verse-list">` + [...db.lyrics].sort((a, b) => a.order - b.order).map(l => `<blockquote class="verse">
    <div class="verse-head">
      <span class="orig" lang="zh-Hant">${esc(l.original)}</span>
      <span class="phonetic">(${esc(l.line)})</span>
    </div>
    <p class="tr">${esc(state.lang === "en" ? en.lyrics[l.order] : l.translation)}</p>
    ${state.lang === "en" ? `<p class="tr-ko note" lang="ko">${esc(l.translation)}</p>` : ""}
    <div class="verse-commentary" lang="ko">
      <span class="sym">${esc(l.symbolic)}</span> — ${esc(l.extended)}
      <span class="ref mono">${esc(l.reference)}</span>
    </div>
  </blockquote>`).join("") + `</div><p class="src">${esc(db.lyrics[0].form)} · ${esc([...new Set(db.lyrics.map(l => l.reference))].join(" / "))}</p>`;
}

// ============================================================================
// TAB 2: 10 CURATED INTERPRETIVE PATHS (THM_01 – THM_10)
// ============================================================================
const themeBody = {
  THM_01: () => {
    const d = db.dance[0], de = en.dance, ko = state.lang === "ko";
    return `<div class="thm-card">
      <div class="thm-lead"><b>${esc(ko ? d.name : de.title)}</b> <span class="hanja-sm" lang="zh-Hant">${esc(d.hanja)}</span></div>
      ${d.alt?.length ? `<p class="note">${esc(t("altNames"))}: ${esc(d.alt.join(", "))} · ${esc(ko ? d.creator : de.creator)}</p>` : ""}
      <p>${esc(ko ? (d.definition || "") : de.definition)}</p>
      <p>${esc(ko ? d.description : de.description)}</p>
      <p class="note mono">${esc(ko ? d.classification : de.classification)} · ${esc(ko ? d.period : de.period)}</p>
    </div>
    <div class="thm-grid-2">
      ${db.spaces.map(s => `<div class="thm-subcard">
        <b>${esc(ko ? s.name : en.spaces[s.id].name)}</b> <span class="hanja-sm" lang="zh-Hant">${esc(s.hanja || "")}</span>
        <span class="badge-subtle">${esc(ko ? s.type : en.spaces[s.id].type)}</span>
        <p class="note">${esc(ko ? s.description : en.spaces[s.id].description)}</p>
      </div>`).join("")}
    </div>`;
  },
  THM_02: () => {
    const m = M.MVM_002;
    const scenes = (m.scenes || []).slice(0, 8).map(id => S[id]).filter(Boolean);
    return `<div class="steps-preview">
      <p class="note">${esc(m.definition)}</p>
      <ol class="steps compact">${scenes.map(s => `<li data-scene="${s.id}"><div class="meta"><b>${s.id}</b><span>${esc(s.jangdan)} · ${esc(s.janggu)} · #${s.order}</span></div><div class="txt" lang="ko">${esc(s.detail)}</div></li>`).join("")}</ol>
    </div>` + openBtn("MVM_002");
  },
  THM_03: () => {
    const groups = {};
    db.movements.forEach((m, i) => (groups[m.name] ||= []).push({ m, i }));
    return `<div class="recur-grid">` + Object.values(groups).filter(g => g.length > 1).map(g => `<div class="recur-row">
      <div class="recur-title"><b>${esc(mvName(g[0].m, { withHanja: true }))}</b> <span class="mono">×${g.length}</span></div>
      <div class="chips">${g.map(({ m, i }) => `<button class="chip" type="button" data-mvm="${m.id}">#${i + 1} · ${fmt(SEQ[0].segments.find(x => x.movement === m.id).start)}</button>`).join("")}</div>
    </div>`).join("") + `</div>`;
  },
  THM_04: () => {
    const c = t("pieceCols");
    const list = state.suiteAll
      ? db.pieces
      : PIECE_ORDER.map(n => db.pieces.find(p => p.name === n && db.scenes.some(s => s.piece === p.id))).filter(Boolean);
    const toggle = `<div class="filter-bar">
      <button type="button" class="chip ${!state.suiteAll ? "active" : ""}" data-suite-toggle="perf">${esc(t("suiteFilterPerf"))}</button>
      <button type="button" class="chip ${state.suiteAll ? "active" : ""}" data-suite-toggle="all">${esc(t("suiteFilterAll"))}</button>
    </div>`;
    return toggle + `<div class="table-scroll"><table class="rec-table"><thead><tr>${c.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>
      ${list.map(p => `<tr title="${esc(p.origin || "")}">
        <td><i class="piece-dot" style="background:${pieceVar(p)}"></i><b>${esc(pieceName(p))}</b> ${p.hanja ? `<span class="note" lang="zh-Hant">${esc(p.hanja)}</span>` : ""}</td>
        <td>${esc(state.lang === "en" ? en.suites[p.suite] || p.suite : p.suite)}${p.suite_alias ? `<br><small class="note">${esc(p.suite_alias.slice(0, 2).join(", "))}</small>` : ""}</td>
        <td class="mono">${esc(p.tempo || "—")}</td>
        <td class="mono">${esc(p.jeonggan || "—")}</td>
        <td class="mono">${esc(p.cycles || "—")}</td>
        <td class="num">${p.scenes ? p.scenes.length : "—"}</td>
      </tr>
      <tr class="sub-row"><td colspan="6"><span class="note"><b>${esc(t("pieceStructure"))}:</b> ${esc(p.structure || "—")}</span>${p.origin ? `<br><span class="note"><b>${esc(t("pieceOrigin"))}:</b> ${esc(p.origin)}</span>` : ""}</td></tr>`).join("")}
    </tbody></table></div>`;
  },
  THM_05: () => verseHtml() + `<div class="row-btns">${openBtn("MVM_006")}${openBtn("MVM_016")}</div>`,
  THM_06: () => {
    const s = db.spaces[0], ko = state.lang === "ko";
    return `<p><b>${esc(ko ? s.name : en.spaces[s.id].name)}</b> <span class="hanja-sm" lang="zh-Hant">${esc(s.hanja)}</span></p>
      <p class="note">${esc(ko ? s.description : en.spaces[s.id].description)}</p>
      <div class="flag">${ICONS.flag}<span>${esc(ko ? s.location : en.spaces[s.id].location)}</span></div>
      <div class="thm-grid-2">${movementMatSvg("사예거")}${movementMatSvg("회란")}</div>
      <div class="row-btns">${openBtn("MVM_008")}${openBtn("MVM_009")}</div>`;
  },
  THM_07: () => {
    const ko = state.lang === "ko";
    const cos = `<div class="thm-grid-2">` + db.costumes.map(c => `<div class="thm-subcard">
      <b>${esc(ko ? c.wearer : en.costumes[c.id].wearer)}</b> <span class="mono note">${c.id}</span>
      <p class="note">${esc(ko ? [c.upper, c.lower, c.belt, c.headwear, c.shoes, c.props].filter(Boolean).join(" · ") : en.costumes[c.id].summary)}</p>
      ${flagged(c.shoes) ? `<div class="flag">${ICONS.flag}<span>신발: ${esc(c.shoes)}</span></div>` : ""}
    </div>`).join("") + `</div>`;
    const hs = db.scenes.filter(s => (s.detail || "").includes("한삼"));
    const mv = [...new Set(hs.map(s => s.movement))];
    return cos + `<p class="note">${esc(t("hansam", hs.length))}</p><div class="chips">${mv.map(id => `<button class="chip" type="button" data-mvm="${id}">${esc(mvName(M[id]))}</button>`).join("")}</div>`;
  },
  THM_08: () => {
    const p = P.PCE_001, c = t("instrumentCols"), seen = new Set();
    const list = state.instAll
      ? db.instruments
      : (p.instruments || []).map(id => I[id]).filter(x => x && !seen.has(x.name) && seen.add(x.name));
    const toggle = `<div class="filter-bar">
      <button type="button" class="chip ${!state.instAll ? "active" : ""}" data-inst-toggle="perf">${esc(t("instFilterPerf"))}</button>
      <button type="button" class="chip ${state.instAll ? "active" : ""}" data-inst-toggle="all">${esc(t("instFilterAll"))}</button>
    </div>`;
    return toggle + `<div class="table-scroll"><table class="rec-table"><thead><tr>${c.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>
      ${list.map(x => `<tr>
        <td><b>${esc(state.lang === "en" ? en.instruments[x.name] || x.name : x.name)}</b>${x.hanja ? `<br><small class="note" lang="zh-Hant">${esc(x.hanja)}</small>` : ""}${x.alt ? `<br><small class="note">${esc(x.alt.slice(0, 3).join(", "))}</small>` : ""}</td>
        <td><span class="badge-subtle">${esc(x.variant || "기본")}</span></td>
        <td>${esc(x.type || "")}</td>
        <td class="note" lang="ko">${esc(x.range || "—")}</td>
        <td lang="ko"><div>${esc(x.technique || "")}</div>${x.timbre ? `<div class="note">${esc(x.timbre)}</div>` : ""}</td>
      </tr>`).join("")}
    </tbody></table></div>`;
  },
  THM_09: () => {
    const ko = state.lang === "ko", pr = db.performances[0], pe = en.performances[pr.id];
    const trm = db.transmitters.map(x => `<li class="trm-item">
      <div><b>${esc(ko ? x.name : en.transmitters[x.id])}</b> ${x.hanja ? `<span lang="zh-Hant">${esc(x.hanja)}</span>` : ""} ${x.life ? `<span class="mono note">(${esc(x.life)})</span>` : ""}</div>
      <div class="note">${[x.status, x.domain, x.region, x.recognised ? `인정: ${x.recognised}` : ""].filter(Boolean).map(esc).join(" · ")}${x.students ? ` → 제자: ${esc(x.students.join(", "))}` : ""} · <a href="${esc(x.source)}" target="_blank" rel="noopener">출처 ${ICONS.ext}</a></div>
    </li>`).join("");
    return `<p class="note">${esc(t("lineageNote"))}</p>
      <h3>${t("lineage")}</h3><ul class="trm-list">${trm}</ul>
      <h3>${t("perfRecord")}</h3>
      <div class="thm-subcard">
        <b>${esc(ko ? pr.name : pe.name)}</b> · <span class="mono">${esc(pr.date)}</span>
        <p class="note">${esc(ko ? `${pr.place} · ${pr.custodian} (${pr.role})` : `${pe.place} · ${pe.custodian} (${pe.role})`)}</p>
      </div>`;
  },
  THM_10: () => {
    const max = Math.max(...SEQ.flatMap(s => s.segments.map(dur)));
    return `<p class="note">${esc(t("cmpNote"))}</p><div class="compare">${db.movements.map((m, i) => {
      const h = SEQ[0].segments.find(g => g.movement === m.id), b = SEQ[1].segments.find(g => g.movement === m.id);
      const dh = dur(h), dbDur = dur(b);
      return `<button class="cmp-row" type="button" data-mvm="${m.id}">
        <span class="nm">${i + 1}. ${esc(mvName(m))}</span>
        <span class="cmp-bars">
          <i class="h" style="width:${(dh / max * 100).toFixed(1)}%"></i>
          <i class="b" style="width:${(dbDur / max * 100).toFixed(1)}%"></i>
        </span>
        <span class="cmp-val mono">${dh.toFixed(1)}s / ${dbDur.toFixed(1)}s</span>
      </button>`;
    }).join("")}</div>`;
  },
};

function openBtn(id) {
  return `<button class="btn" type="button" data-mvm="${id}">${esc(t("openMovement"))}: ${esc(mvName(M[id], { withHanja: true }))}</button>`;
}

function renderThemes() {
  const el = $("#p-theme");
  const open = new Set([...el.querySelectorAll('.theme[data-open="true"]')].map(x => x.dataset.id));
  if (!open.size && !el.innerHTML) open.add("THM_01");

  const quickBar = `<div class="theme-filter-pills">
    ${db.themes.map((th, idx) => `<button type="button" class="chip" data-open-thm="${th.id}">#${String(idx + 1).padStart(2, "0")} ${esc((state.lang === "ko" ? th.title : en.themes[th.id].title).split(/[:·—]/)[0].trim().slice(0, 14))}</button>`).join("")}
  </div>`;

  el.innerHTML = quickBar + db.themes.map(th => {
    const e = en.themes[th.id], ko = state.lang === "ko", isOpen = open.has(th.id);
    return `<section class="theme" id="card-${th.id}" data-id="${th.id}" data-open="${isOpen}">
      <button type="button" aria-expanded="${isOpen}">
        <div class="theme-head-left">
          <span class="g mono">${esc(ko ? th.group : e.group)} · ${th.id}</span>
          <span class="t">${esc(ko ? th.title : e.title)}</span>
        </div>
        ${ICONS.chev}
      </button>
      <div class="body">
        <p class="ex">${esc(ko ? th.example : e.example)}</p>
        <div class="chips" aria-label="${esc(t("classes"))}">${th.classes.map(c => `<span class="chip static">${esc(c === "Custume" ? "Costume" : c)}</span>`).join("")}</div>
        <div class="theme-dynamic">${isOpen ? themeBody[th.id]?.() || "" : ""}</div>
      </div>
    </section>`;
  }).join("");

  el.querySelectorAll("[data-open-thm]").forEach(pill => {
    pill.onclick = () => {
      const targetId = pill.dataset.openThm;
      const card = el.querySelector(`.theme[data-id="${targetId}"]`);
      if (!card) return;
      card.dataset.open = "true";
      card.querySelector("button").setAttribute("aria-expanded", "true");
      card.querySelector(".theme-dynamic").innerHTML = themeBody[targetId]?.() || "";
      wireThemeFilters(el);
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  });

  el.querySelectorAll(".theme > button").forEach(b => b.onclick = () => {
    const s = b.parentElement, o = s.dataset.open !== "true";
    s.dataset.open = String(o);
    b.setAttribute("aria-expanded", String(o));
    const dyn = s.querySelector(".theme-dynamic");
    dyn.innerHTML = o ? themeBody[s.dataset.id]?.() || "" : "";
    wireThemeFilters(el);
  });
  wireThemeFilters(el);
}

function wireThemeFilters(container) {
  container.querySelectorAll("[data-suite-toggle]").forEach(btn => {
    btn.onclick = () => {
      state.suiteAll = btn.dataset.suiteToggle === "all";
      const dyn = container.querySelector('.theme[data-id="THM_04"] .theme-dynamic');
      if (dyn) { dyn.innerHTML = themeBody.THM_04(); wireThemeFilters(container); }
    };
  });
  container.querySelectorAll("[data-inst-toggle]").forEach(btn => {
    btn.onclick = () => {
      state.instAll = btn.dataset.instToggle === "all";
      const dyn = container.querySelector('.theme[data-id="THM_08"] .theme-dynamic');
      if (dyn) { dyn.innerHTML = themeBody.THM_08(); wireThemeFilters(container); }
    };
  });
}

// ============================================================================
// TAB 3: 9-SEQUENCE ARCHIVE & 35-MOVEMENT COMPARATIVE MATRIX (#p-matrix)
// ============================================================================
function renderMatrix() {
  const el = $("#p-matrix");
  if (!el) return;
  const ko = state.lang === "ko";
  const seqCards = `<div class="seq-grid">${ARCHIVE_SEQS.map(sq => `<div class="seq-card">
    <img src="${sq.img}" alt="${esc(sq.id)}" loading="lazy">
    <div class="seq-meta">
      <div class="seq-title"><b class="mono">${esc(sq.id)}</b> <span>${esc(ko ? sq.costume_ko : sq.costume_en)}</span></div>
      <div class="note">${esc(ko ? sq.tempo_ko : sq.tempo_en)}</div>
      <div class="mono seq-stats">${sq.frames.toLocaleString()} fr. · ${sq.dur} · ${sq.webGb}${sq.iou !== "—" ? ` · IoU ${sq.iou}` : ""}</div>
    </div>
  </div>`).join("")}</div>`;

  el.innerHTML = `<h3>${t("seqArchive")}</h3>
    <p class="note">${ko
      ? "chunangzen_4DGS 실험에서 구축한 9개 볼류메트릭 시퀀스(총 58,843 프레임). 여령 복식(한복), 검은 연습복, 모션캡처 슈트의 3가지 의상 조건과 느린 춤·빠른 춤·보정 포즈로 구성됩니다."
      : "Nine volumetric sequences (58,843 frames total) reconstructed in the chunangzen_4DGS experiments across court Hanbok, practice clothes, and MoCap marker suits."}</p>
    ${seqCards}
    <h3>${ko ? "한복(여령) vs 연습복 35개 춤사위 수행 시간 매트릭스" : "35-Movement Duration Comparison Matrix (Hanbok vs Practice)"}</h3>
    ${themeBody.THM_10()}`;
}

// ============================================================================
// TAB 4: 4DGS PIPELINE, 32-CAM CALIBRATION & RELATIONAL SCHEMA (#p-data)
// ============================================================================
function renderData() {
  const counts = {
    Dance: db.dance.length, Scene: db.scenes.length, Movement: db.movements.length, Piece: db.pieces.length,
    Instrument: db.instruments.length, Lyrics: db.lyrics.length, Space: db.spaces.length,
    Costume: db.costumes.length, Performance: db.performances.length, Transmitter: db.transmitters.length,
  };
  const nClips = Object.values(clips).reduce((a, v) => a + Object.keys(v).length, 0);
  const flags = [];
  for (const [, rows] of Object.entries(db)) {
    if (Array.isArray(rows)) {
      for (const r of rows) {
        for (const [k, v] of Object.entries(r)) {
          if (flagged(v)) flags.push({ id: r.id, k, v });
        }
      }
    }
  }
  const srcs = [...new Set([...db.scenes.map(s => s.reference), ...db.movements.map(m => m.source)].filter(Boolean))];
  const ko = state.lang === "ko";

  const calibBox = `<div class="calib-card">
    <a href="media/stills/verify_f01500.jpg" target="_blank" rel="noopener" title="Inspect full 32-camera silhouette verification grid">
      <img src="media/stills/verify_f01500.jpg" alt="32-camera silhouette overlay verification at frame 1500" loading="lazy">
    </a>
    <p class="note">${ko
      ? "H_fast 프레임 1500에서 32대 카메라 영상 위에 렌더링된 메시 실루엣을 겹쳐 검증한 결과(평균 IoU 0.960, 재투영 오차 1.40–1.61 px). 좌측 3D 뷰어의 32-CAM RIG 맵에서 각 카메라 시점으로 즉시 스냅할 수 있습니다."
      : "Silhouette registration overlay across all 32 HOLOSYS cameras at frame 1500 of H_fast (mean IoU 0.960, reprojection error 1.40–1.61 px). Use the 32-CAM RIG radar in the 3D stage to snap to any camera."}</p>
  </div>`;

  $("#p-data").innerHTML = `<h3>${t("record")}</h3>
    <ol class="pipeline-list">${t("pipeline").map(x => `<li>${esc(x)}</li>`).join("")}</ol>
    <h3>${t("calibVerify")}</h3>${calibBox}
    <h3>${t("modelTitle")}</h3>${modelSvg(counts)}
    <h3>${t("edition")}</h3><p class="note">${esc(t("editionText"))}</p>${nClips ? `<p class="note">${esc(t("clipsReady", nClips))}</p>` : ""}
    <h3>${t("paradata")}</h3>
    <ul class="paradata-list">${flags.map(f => `<li><span class="mono">${esc(f.id)}.${esc(f.k)}</span> — <span lang="ko">${esc(f.v)}</span></li>`).join("")}</ul>
    <h3>${t("sources")}</h3><ul class="note">${srcs.map(s => `<li lang="ko">${esc(s)}</li>`).join("")}</ul>
    <h3>${t("dataFiles")}</h3>
    <div class="dl-links">
      <a class="btn" href="data/db.json" download>${ICONS.dl} <span>${esc(t("download"))}</span></a>
      <a class="btn" href="data/cameras.json" download>${ICONS.dl} <span>${esc(t("downloadCams"))}</span></a>
    </div>
    <p class="note" style="margin-top:8px">${esc(t("buildNote"))}</p>`;
}

function modelSvg(c) {
  const box = (x, y, name, n, k = "") => `<g><rect class="${k}" x="${x}" y="${y}" width="104" height="36" rx="5"/><text x="${x + 52}" y="${y + 16}" text-anchor="middle">${name}</text><text class="cnt" x="${x + 52}" y="${y + 29}" text-anchor="middle">${n}</text></g>`;
  const L = (x1, y1, x2, y2, k = "") => `<line class="${k}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  return `<svg class="model" viewBox="0 0 470 300" role="img" aria-label="Scene-centred knowledge model">
    ${L(235, 150, 70, 40)}${L(235, 150, 235, 40)}${L(235, 150, 400, 40)}${L(235, 150, 70, 150)}${L(235, 150, 400, 150)}${L(235, 150, 70, 260)}${L(235, 150, 400, 260)}${L(400, 40, 400, 95)}${L(235, 150, 235, 262, "lnk")}
    ${box(18, 22, "Dance", c.Dance)}${box(183, 22, "Movement", c.Movement)}${box(348, 22, "Piece", c.Piece)}${box(348, 92, "Instrument", c.Instrument)}
    ${box(18, 132, "Lyrics", c.Lyrics)}${box(183, 132, "Scene", c.Scene, "k")}${box(348, 132, "Space", c.Space)}
    ${box(18, 242, "Transmitter", c.Transmitter)}${box(348, 242, "Costume · Perf.", `${c.Costume} · ${c.Performance}`)}${box(183, 262, "4D segment", "2 × 35", "k")}
    <text class="cnt" x="240" y="215">frame range ↔ scene range</text></svg>`;
}

// ============================================================================
// LINEAR-GRADE COMMAND PALETTE (⌘K / /)
// ============================================================================
const cmdBackdrop = $("#cmdBackdrop");
const cmdModal = $("#cmdModal");
const cmdInput = $("#cmdInput");
const cmdResults = $("#cmdResults");

function buildCommandItems(query = "") {
  if (!db) return [];
  const q = query.trim().toLowerCase();
  const ko = state.lang === "ko";
  const items = [];

  // 1. Workspace & Design System Actions
  items.push(
    { group: ko ? "워크스페이스 & 디자인 시스템" : "Workspace & Design System", tag: "THEME", title: ko ? "디자인 시스템 전환: Linear Dark ↔ Warm Editorial" : "Toggle Design System: Linear Dark ↔ Warm Editorial", right: state.theme, run: () => applyTheme(state.theme === "dark" ? "editorial" : "dark") },
    { group: ko ? "워크스페이스 & 디자인 시스템" : "Workspace & Design System", tag: "VIEW", title: ko ? "스튜디오 분할 모드 (Split Studio)" : "Split Studio Mode", right: "Workspace", run: () => setWorkspaceMode("split", { instant: true }) },
    { group: ko ? "워크스페이스 & 디자인 시스템" : "Workspace & Design System", tag: "VIEW", title: ko ? "4D 시네마 풀스크린 모드 (WebGL Experience)" : "Cinema 4D Fullscreen Mode", right: "Workspace", run: () => setWorkspaceMode("cinema", { instant: true }) },
    { group: ko ? "워크스페이스 & 디자인 시스템" : "Workspace & Design System", tag: "VIEW", title: ko ? "에디토리얼 도록 모드 (Editorial Archive)" : "Editorial Publication Mode", right: "Workspace", run: () => setWorkspaceMode("editorial", { instant: true }) },
  );

  // 2. 35 Choreography Movements
  db.movements.forEach((m, i) => {
    const seg = SEQ[0].segments.find(g => g.movement === m.id);
    items.push({
      group: ko ? "35개 춤사위 (Movements)" : "35 Choreography Movements",
      tag: m.id,
      title: `${i + 1}. ${mvName(m, { withHanja: true })} — ${(ko ? m.definition : en.movements[m.name]?.definition || m.definition).slice(0, 42)}…`,
      right: seg ? `${fmt(seg.start)}–${fmt(seg.end)}` : "",
      run: () => select(m.id, { tab: true, instant: true }),
    });
  });

  // 3. 10 Interpretive Paths
  db.themes.forEach((th, i) => {
    const e = en.themes[th.id];
    items.push({
      group: ko ? "10대 해설 경로 (Curated Paths)" : "10 Interpretive Paths",
      tag: th.id,
      title: `#${String(i + 1).padStart(2, "0")} ${ko ? th.title : e.title}`,
      right: ko ? th.group : e.group,
      run: () => {
        showTab("theme", { instant: true });
        const pill = document.querySelector(`[data-open-thm="${th.id}"]`);
        if (pill) pill.click();
      },
    });
  });

  // 4. 32 HOLOSYS Cameras
  Object.keys(cams).sort().forEach(camId => {
    const c = cams[camId];
    items.push({
      group: ko ? "32대 HOLOSYS 물리 카메라" : "32 HOLOSYS Cameras",
      tag: `CAM ${camId}`,
      title: `Snap 3D Stage to Camera ${camId}`,
      right: `reproj ${c.reproj_px.toFixed(2)}px`,
      run: () => { if (player) player.snapToCamera(camId); },
    });
  });

  if (!q) return items.slice(0, 28);
  return items.filter(it => `${it.tag} ${it.title} ${it.right}`.toLowerCase().includes(q)).slice(0, 35);
}

function renderCommandPalette() {
  state.cmdItems = buildCommandItems(cmdInput.value);
  state.cmdIdx = Math.min(state.cmdIdx, Math.max(0, state.cmdItems.length - 1));
  let lastGroup = "";
  const html = [];
  state.cmdItems.forEach((it, idx) => {
    if (it.group !== lastGroup) {
      lastGroup = it.group;
      html.push(`<div class="cmd-group-label">${esc(it.group)}</div>`);
    }
    html.push(`<button type="button" class="cmd-item" role="option" data-cmd-idx="${idx}" aria-selected="${String(idx === state.cmdIdx)}">
      <div class="cmd-item-left">
        <span class="cmd-tag mono">${esc(it.tag)}</span>
        <span class="cmd-title">${esc(it.title)}</span>
      </div>
      <span class="cmd-right mono">${esc(it.right)}</span>
    </button>`);
  });
  cmdResults.innerHTML = html.join("") || `<div class="cmd-group-label">검색 결과가 없습니다 / No matching results</div>`;
  cmdResults.querySelectorAll(".cmd-item").forEach(btn => {
    btn.onclick = () => {
      const item = state.cmdItems[+btn.dataset.cmdIdx];
      if (item) { item.run(); closeCommandPalette(); }
    };
  });
}

function openCommandPalette() {
  state.cmdOpen = true;
  cmdBackdrop.hidden = false;
  cmdModal.setAttribute("data-starting-style", "");
  cmdInput.value = "";
  state.cmdIdx = 0;
  renderCommandPalette();
  requestAnimationFrame(() => {
    cmdModal.removeAttribute("data-starting-style");
    cmdInput.focus();
  });
}

function closeCommandPalette() {
  state.cmdOpen = false;
  cmdBackdrop.hidden = true;
}

$("#cmdTrigger").onclick = openCommandPalette;
cmdBackdrop.addEventListener("click", (e) => {
  if (e.target === cmdBackdrop) closeCommandPalette();
});
cmdInput.addEventListener("input", () => {
  state.cmdIdx = 0;
  renderCommandPalette();
});

// Global Keyboard Ergonomics (Emil Kowalski rule: zero animation latency on keyboard shortcuts)
window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    state.cmdOpen ? closeCommandPalette() : openCommandPalette();
    return;
  }
  if (state.cmdOpen) {
    if (e.key === "Escape") { e.preventDefault(); closeCommandPalette(); }
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      state.cmdIdx = (state.cmdIdx + 1) % Math.max(1, state.cmdItems.length);
      renderCommandPalette();
      cmdResults.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.cmdIdx = (state.cmdIdx - 1 + Math.max(1, state.cmdItems.length)) % Math.max(1, state.cmdItems.length);
      renderCommandPalette();
      cmdResults.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = state.cmdItems[state.cmdIdx];
      if (it) { it.run(); closeCommandPalette(); }
    }
    return;
  }

  // Ignore shortcuts when typing in an input/select
  if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

  if (e.key === "/") {
    e.preventDefault();
    openCommandPalette();
  } else if (e.code === "Space" && player) {
    e.preventDefault();
    player.toggle();
  } else if (e.code === "ArrowRight" && player) {
    player.pause();
    player.step(1);
  } else if (e.code === "ArrowLeft" && player) {
    player.pause();
    player.step(-1);
  } else if (e.code === "KeyR" && player) {
    player.resetView();
  } else if (e.code === "KeyH" && player) {
    $("#toggleGuide")?.click();
  } else if (e.code === "KeyC" && player) {
    const keys = Object.keys(cams).sort();
    if (!keys.length) return;
    const curIdx = keys.indexOf(player.activeCamera);
    const nextKey = keys[(curIdx + 1) % keys.length];
    player.snapToCamera(nextKey);
  } else if (e.key >= "1" && e.key <= "9" && db) {
    const idx = parseInt(e.key, 10) - 1;
    const th = db.themes[idx];
    if (th) {
      showTab("theme", { instant: true });
      const pill = document.querySelector(`[data-open-thm="${th.id}"]`);
      if (pill) pill.click();
    }
  }
});

// ============================================================================
// LANGUAGE & INITIALISATION
// ============================================================================
function populateCameraSelect() {
  if (!camSelect) return;
  const curVal = camSelect.value;
  const keys = Object.keys(cams).sort();
  camSelect.innerHTML = `<option value="">${esc(t("freeOrbit"))}</option>`
    + keys.map(k => `<option value="${k}">Cam ${k} (reproj ${cams[k].reproj_px.toFixed(2)}px)</option>`).join("");
  camSelect.value = curVal;
}

function applyLang() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach(n => {
    const v = t(n.dataset.i18n);
    if (typeof v === "string") n.textContent = v;
  });
  document.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
  document.title = t("title");
  populateCameraSelect();
  renderCameraRadar();
  renderLegend();
  renderLanes();
  renderMovement();
  renderThemes();
  renderMatrix();
  renderData();
  renderStageNote();
  updateCinemaOverlay();
  requestAnimationFrame(() => syncAllClipPathTabs(true));
}

document.querySelectorAll("[data-lang]").forEach(b => b.onclick = () => {
  state.lang = b.dataset.lang;
  try { localStorage.setItem("c4d-lang", state.lang); } catch {}
  applyLang();
});

(async () => {
  applyTheme(state.theme);
  // Start 4DGS volumetric sample loading immediately in parallel with DB fetch
  const samplePromise = loadSample();
  db = await fetch("data/db.json").then(r => r.json());
  en = db.en;
  const by = (a) => Object.fromEntries(a.map(x => [x.id, x]));
  M = by(db.movements); S = by(db.scenes); P = by(db.pieces); I = by(db.instruments); SEQ = db.sequences;
  clips = await fetch("media/clips.json").then(r => r.ok ? r.json() : {}).catch(() => ({}));
  cams = await fetch("data/cameras.json").then(r => r.ok ? r.json() : {}).catch(() => ({}));
  if (player && Object.keys(cams).length) player.setCameras(cams);

  const start = location.hash.slice(1);
  state.sel = M[start] ? start : "MVM_008";
  state.selScene = M[state.sel]?.scenes?.[0] || null;
  applyLang();
  await samplePromise;
  renderStageNote();
})();
