/**
 * Antigravity 스마트 Mock AI 엔진
 * 학생이 입력한 교과목, 주제, 가설 등의 데이터 맥락을 파싱하여,
 * 실시간으로 고도의 교육적 조언과 맞춤 추천을 생성합니다.
 */

// 2022 개정 및 2015 개정 고등학교 수학·과학 성취 기준 및 핵심 단원 가이드라인
const CURRICULUM_GUIDELINES = {
  "대수": "지수와 로그(거듭제곱근, 로그의 성질), 지수함수와 로그함수(뜻과 그래프, 방정식/부등식), 삼각함수(호도법, 일반각, 삼각함수의 뜻과 그래프, 사인법칙과 코사인법칙), 수열(등차수열, 등비수열, 수열의 합 시그마, 수학적 귀납법)",
  "미적분Ⅰ": "함수의 극한과 연속(함수의 극한값, 연속함수), 다항함수의 미분법(미분계수, 도함수, 극대/극소, 속도와 가속도, 도함수 활용), 다항함수의 적분법(부정적분, 정적분, 정적분 활용 넓이 및 속도와 거리)",
  "확률과 통계": "순열과 조합(원순열, 중복순열, 이항정리), 확률(확률의 뜻, 조건부확률, 독립사건), 통계(확률분포, 이산/연속확률변수, 정규분포, 통계적 추정, 모평균의 추정)",
  "수학Ⅰ": "지수함수와 로그함수(거듭제곱근, 로그, 그래프와 관계), 삼각함수(일반각, 호도법, 삼각함수 그래프 및 사인/코사인법칙), 수열(등차/등비수열, 수열의 합, 귀납적 정의)",
  "수학Ⅱ": "함수의 극한과 연속, 다항함수의 미분법, 다항함수의 적분법",
  "물리학": "힘과 운동(뉴턴 운동 법칙, 운동량과 충격량, 역학적 에너지 보존), 전자기와 양자(전동기, 전자기 유도, 파동의 성질, 빛과 물질의 이중성)",
  "물리학Ⅰ": "힘과 운동, 전자기와 양자, 열역학 법칙",
  "화학": "물질의 세 가지 상태와 용액, 반응 속도와 화학 평형(반응 속도식, 평형 이동), 역동적인 화학 반응(산 염기 중화반응, 산화 환원)",
  "화학Ⅰ": "화학의 첫걸음(몰, 화학식량, 화학반응식), 개성 있는 원소, 화학 결합과 분자의 세계, 역동적인 화학 반응",
  "생명과학": "생명활동과 세포(물질대사, 세포호흡), 항상성과 몸의 조절(신경계, 호르몬), 생물의 유전(유전자, 염색체, 가계도 분석), 생태계와 상호작용",
  "생명과학Ⅰ": "생명과학의 이해, 세포와 생명의 연속성(세포 분열, 유전 법칙), 항상성과 몸의 조절, 생태계와 상호작용",
  "지구과학": "지구 시스템 과학(판구조론, 대기와 해양의 순환), 행성우주과학(별의 물리량, 우주 팽창, 외계 행성 탐사)",
  "지구과학Ⅰ": "지하의 변화, 대기와 해양의 변화, 우주 탐사",
  "통합과학": "물질의 규칙성과 결합, 시스템과 상호작용(역학적 시스템, 지구 시스템, 생명 시스템), 변화와 다양성(산화 환원, 중화 반응, 생물 다양성), 환경과 에너지",
  "통합과학1": "물질의 규칙성과 결합, 역학적 시스템, 지구 시스템, 생명 시스템",
  "통합과학2": "변화와 다양성, 환경과 에너지"
};

const MockAI = {
  /**
   * 제미나이 웹 브릿지 (수동 복사/붙여넣기) 모달 제어 및 대기 로직
   */
  callWebBridge: function (prompt) {
    return new Promise((resolve, reject) => {
      const modal = document.getElementById("web-bridge-modal-root");
      const promptTextarea = document.getElementById("web-bridge-prompt-textarea");
      const responseTextarea = document.getElementById("web-bridge-response-textarea");
      
      if (!modal || !promptTextarea || !responseTextarea) {
        reject(new Error("제미나이 웹 브릿지 모달 요소를 찾을 수 없습니다."));
        return;
      }
      
      promptTextarea.value = prompt;
      responseTextarea.value = "";
      
      // 복사 버튼 상태 리셋
      const copyBtn = document.getElementById("btn-web-bridge-copy");
      if (copyBtn) {
        copyBtn.style.background = '';
        copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> 복사하고 제미나이로 이동';
      }
      
      // 모달 표시
      modal.style.display = "flex";
      
      // 글로벌 변수에 리졸버 등록
      window.webBridgeResolve = (text) => {
        const extracted = MockAI.extractJsonFromText(text);
        resolve(extracted);
      };
      window.webBridgeReject = reject;
    });
  },

  /**
   * 텍스트에서 ```json ... ``` 블록 혹은 { ... } 형태의 JSON만 추출
   */
  extractJsonFromText: function (text) {
    if (!text) return "";
    
    // 1. ```json ... ``` 또는 ``` ... ``` 마크다운 블록 매칭
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1].trim();
    }
    
    // 2. { ... } 또는 [ ... ] 가장 바깥쪽 매칭
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim();
    }
    
    return text.trim();
  },

  /**
   * 통합 LLM API 통신 래퍼 (Gemini, ChatGPT, Claude 지원)
   */
  callLLM: async function (prompt) {
    const provider = localStorage.getItem("active_ai_provider") || "gemini";
    const model = localStorage.getItem("active_ai_model") || (provider === "gemini" ? "gemini-2.5-flash" : provider === "openai" ? "gpt-4o-mini" : "claude-3-5-haiku-20241022");
    
    if (provider === "gemini-web-bridge") {
      return await this.callWebBridge(prompt);
    }
    
    if (provider === "gemini") {
      const apiKey = localStorage.getItem("gemini_api_key");
      if (!apiKey) {
        throw new Error("Gemini API 키가 등록되지 않았습니다.");
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API 호출 오류: HTTP ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error("Gemini API에서 빈 응답이 반환되었습니다.");
      }
      return textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    
    if (provider === "openai") {
      const apiKey = localStorage.getItem("openai_api_key");
      if (!apiKey) {
        throw new Error("OpenAI API 키가 등록되지 않았습니다.");
      }
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API 호출 오류: HTTP ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.choices?.[0]?.message?.content;
      if (!textResponse) {
        throw new Error("OpenAI API에서 빈 응답이 반환되었습니다.");
      }
      return textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    
    if (provider === "claude") {
      const apiKey = localStorage.getItem("claude_api_key");
      if (!apiKey) {
        throw new Error("Claude API 키가 등록되지 않았습니다.");
      }
      
      const corsProxy = localStorage.getItem("cors_proxy_url") || "";
      let url = "https://api.anthropic.com/v1/messages";
      if (corsProxy) {
        const cleanProxy = corsProxy.endsWith("/") ? corsProxy : corsProxy + "/";
        url = cleanProxy + url;
      }
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "dangerouslyAllowBrowser": "true"
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API 호출 오류: HTTP ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.content?.[0]?.text;
      if (!textResponse) {
        throw new Error("Claude API에서 빈 응답이 반환되었습니다.");
      }
      return textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    }
    
    throw new Error("알 수 없는 AI 공급자입니다.");
  },

  /**
   * 진로 맞춤형 키워드 제안 (Gemini/ChatGPT/Claude API 연계)
   */
  suggestKeywords: async function (context) {
    const { subject, department, career, field, fallbackKeywords } = context;
    
    // API 키 확인
    const provider = localStorage.getItem("active_ai_provider") || "gemini";
    const activeKey = localStorage.getItem(`${provider}_api_key`);
    if (!activeKey && provider !== "gemini-web-bridge") {
      try {
        const choice = await App.askApiFallback();
        if (choice === "bridge") {
          localStorage.setItem("active_ai_provider", "gemini-web-bridge");
          return await this.suggestKeywords(context);
        }
      } catch (err) {
        console.log("사용자가 모드를 취소했습니다. 모의 AI 모드로 진행합니다.");
      }
      // 오프라인 모의(Simulation) 모드일 때도 학생의 지망 학과(department) 및 진로(career) 정보를 파싱하여 
      // 그에 최적화된 맞춤 키워드 6종을 동적으로 추천하도록 지능화합니다.
      const dept = (department || "").trim();
      const car = (career || "").trim();
      const subj = (subject || "").trim();
      
      const combined = `${dept} ${car} ${subj}`;
      
      let simulated = null;
      if (combined.match(/컴퓨터|인공지능|소프트웨어|코딩|알고리즘|IT|개발자|보안|웹|앱/)) {
        simulated = ["인공지능", "기계학습", "신경망모델", "경로최적화", "알고리즘", "빅데이터"];
      }
      else if (combined.match(/의학|생명|의예|의약|약학|간호|바이오|유전자|세포|생물|신경|뇌/)) {
        simulated = ["효소활성", "바이오센서", "유전자분석", "세포대사", "감염병확산", "생체모사"];
      }
      else if (combined.match(/화학|신소재|배터리|분자|나노/)) {
        simulated = ["촉매반응", "고분자재료", "전기화학", "나노입자", "에너지밀도", "유기화학"];
      }
      else if (combined.match(/기계|로봇|전자|전기|반도체|우주|항공|물리|역학/)) {
        simulated = ["센서계측", "MBL", "수치시뮬레이션", "신소재", "역학적에너지", "전자기유도"];
      }
      else if (combined.match(/환경|기후|대기|생태|지구|기상|지질/)) {
        simulated = ["기후변화", "탄소배출", "대기질분석", "생태계보존", "삼투현상", "신재생에너지"];
      }
      else if (combined.match(/경제|경영|금융|주식|통계|사회|소비자/)) {
        simulated = ["통계가설", "회귀분석", "상관관계", "네트워크분석", "소비자행동", "공공데이터"];
      }
      else if (combined.match(/수학|기하|수치|행렬|대수/)) {
        simulated = ["삼각함수", "수열의합", "시뮬레이션", "테셀레이션", "카오스이론", "수치계산"];
      }
      else if (combined.match(/예술|디자인|미술|음악|체육/)) {
        simulated = ["드로잉비율", "음향데시벨", "서사구조", "스토리텔링", "작화앵글", "생체역학"];
      }
      
      if (simulated) {
        return simulated;
      }
      
      const fb = [...fallbackKeywords];
      fb.isFallback = true;
      fb.errorMsg = "API 키가 등록되지 않아 로컬 오프라인 추천이 제공됩니다.";
      return fb;
    }

    const prompt = `당신은 고등학교 탐구활동 설계 멘토입니다.
다음 학생의 프로필을 분석하여, 수학 및 과학적 주제탐구에 활용하기 적합한 '탐구 융합 키워드' 6개를 추천해 주세요.
- 탐구 교과목: ${subject}
- 희망 학과: ${department}
- 희망 진로: ${career}
- 진로 계열: ${field}

추천할 키워드는 다음 조건을 충족해야 합니다:
1. 고등학교 수준에서 실제 실험, 통계 분석, 수치 모델링 등으로 발전시킬 수 있는 구체적인 정량화 가능 키워드여야 합니다.
2. 예시: '기후변화', '삼투현상', '수치시뮬레이션', '효소활성', '회귀분석', 'MBL센서'
3. 영문 기호나 수식이 포함되지 않고 오직 한글 명사 형태여야 합니다.
4. 반드시 JSON 배열 형식으로만 응답해 주세요. 예: ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5", "키워드6"]
다른 텍스트 없이 오직 JSON 배열만 출력해 주세요.`;

    try {
      const textResponse = await this.callLLM(prompt);
      const parsed = JSON.parse(textResponse);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 6);
      }
      throw new Error("Invalid response format");
    } catch (e) {
      console.warn("AI suggestKeywords failed, falling back to static list.", e);
      const fb = [...fallbackKeywords];
      fb.isFallback = true;
      fb.errorMsg = e.message || String(e);
      return fb;
    }
  },

  /**
   * 2단계 Phase B: AI 주제 제안 (Real LLM API 통합)
   */
  suggestTopics: async function (context) {
    const { subject, keywords, motivation, field, forceDirect } = context;
    const kwList = keywords || [];
    
    // API 키 확인
    const provider = localStorage.getItem("active_ai_provider") || "gemini";
    const activeKey = localStorage.getItem(`${provider}_api_key`);
    if (!activeKey && provider !== "gemini-web-bridge") {
      try {
        const choice = await App.askApiFallback();
        if (choice === "bridge") {
          localStorage.setItem("active_ai_provider", "gemini-web-bridge");
          return await this.suggestTopics(context);
        }
      } catch (err) {
        console.log("사용자가 모드를 취소했습니다. 모의 AI 모드로 진행합니다.");
      }
      // API Key가 없으면 모의(Simulated) AI 제안 모드로 폴백하여 오류 없이 실행
      return this.generateSimulatedTopics(subject, kwList, motivation, forceDirect);
    }

    // 과목명에 따른 교과 단원 및 성취기준 가이드라인 자동 매핑
    let curriculumGuide = "고등학교 성취 기준과 핵심 학습목표에 부합해야 하며, 생활기록부에 기재할 수 있도록 대학 과정의 난해한 이론이나 범위 외 개념은 배제하고 고교 수준의 범위 내에서 탐구해야 합니다.";
    
    const matchedKey = Object.keys(CURRICULUM_GUIDELINES).find(k => subject.includes(k) || k.includes(subject));
    if (matchedKey) {
      curriculumGuide = `[반드시 연계해야 할 고등학교 교육과정 핵심 학습목표 및 단원 범위]\n- 과목명: ${subject}\n- 학습 단원 및 내용요소 범위: ${CURRICULUM_GUIDELINES[matchedKey]}`;
    }

    // 1. RAG 기반 관련 교과 내용요소 검색 (Jaccard Hybrid Retrieval)
    let ragContextStr = "";
    try {
      if (typeof RAGEngine !== "undefined" && typeof CURRICULUM_DB !== "undefined") {
        const tempReport = {
          step_1: {
            학년: parseInt(localStorage.getItem("antigravity_report_save") ? JSON.parse(localStorage.getItem("antigravity_report_save")).step_1.학년 : 1) || 1,
            교과목: {
              교과: (subject.includes("수학") || subject.includes("미적분") || subject.includes("대수") || subject.includes("확률") || subject.includes("통계")) ? "수학" : "과학",
              과목명: subject
            }
          },
          metadata: {
            교육과정_버전: (localStorage.getItem("antigravity_report_save") ? JSON.parse(localStorage.getItem("antigravity_report_save")).metadata.교육과정_버전 : "v2022") || "v2022"
          },
          step_2: {
            키워드: kwList,
            동기: motivation
          },
          step_3: {
            동기: motivation
          }
        };
        const retrieved = RAGEngine.retrieveContext(tempReport, 5);
        if (retrieved && retrieved.length > 0) {
          ragContextStr = "\n\n[RAG 검색결과 - 관련 교육과정 성취기준 내용요소]\n" + retrieved.map(item => {
            const el = item.element;
            return `- 영역: ${el.영역}\n  내용요소: ${el.내용요소}\n  성취기준: ${el.성취기준.map(s => s.content || s.내용).join("; ")}\n  추천 탐구활동: ${el.관련_탐구활동_예시.join(", ")}\n  관련 키워드: ${el.관련_키워드.join(", ")}`;
          }).join("\n\n");
        }
      }
    } catch (e) {
      console.warn("RAG Context retrieval failed in suggestTopics", e);
    }

    const promptText = `당신은 한국 고등학교 1~3학년 학생들의 수학·과학 주제탐구를 지도하는 최고 수준의 진로 진학 학술 멘토 AI입니다.
학생이 입력한 진로 희망 및 과목 정보:
- 지망 학과/진로 계열: ${field || "일반 계열"}
- 관심 교과목: ${subject}
- 관심 키워드: ${kwList.join(", ")}
- 탐구 동기 및 의도: ${motivation || "없음"}

${curriculumGuide}
${ragContextStr}

[판정 규칙 (Verdict Rules)]
관심 키워드와 관심 교과목(${subject})의 교육과정 간 정합성을 판단하여 아래의 세가지 판정 중 하나를 내리고 그에 맞춘 형식으로만 JSON을 출력해야 합니다.
단, 강제 제안 옵션(forceDirect = ${forceDirect ? "true" : "false"})이 true인 경우, 키워드와 교과의 정합성이 낮더라도 무조건 "direct" 판정을 내리고 주제를 설계해야 합니다.

1. "direct" (직접 연결 가능):
   - 키워드가 해당 교과 단원 성취기준과 논리적으로 잘 연계되어 바로 탐구 주제로 발전시킬 수 있을 때.
   - 또는 forceDirect가 true일 때.
   - 이 경우, 고교 수준 범위 내에서 탐구할 수 있는 독창적이고 구체적인 탐구 주제 5종을 제안하십시오.
   - 각 주제는 "title", "description", "matched_content_elements" (매핑된 고교 내용요소 배열), "expected_variables" (예상 변인 배열)을 포함해야 합니다.

2. "redirect" (우회 탐구 방향 제시):
   - 키워드가 고교 수준의 해당 과목 범위에서 직접 탐구하기에는 범위가 다소 어긋나거나 대학 과정 개념(예: 군론, 디오판토스 등)으로 억지 연결될 가능성이 클 때.
   - 학생에게 친절하게 이유("reason")를 설명하고, 3~4가지 어울리는 우회 융합 방향("directions")을 제안하십시오.
   - 각 방향은 "emoji", "label" (방향 명칭), "example" (추천키워드 및 예시주제)을 포함해야 합니다.

3. "unsuitable" (탐구 부적합):
   - 키워드가 해당 수학·과학 교과목과 전혀 연관이 없는 비학술적인 일상어이거나 탐구로 발전에 무리가 있을 때.
   - 부적합 사유("reason")를 친절히 안내하고, 해당 과목과 연계 가능한 3가지 고품질 대체 정량 키워드("suggestions")를 추천하십시오.
   - 각 추천은 "refined_keyword" (대체 키워드명), "subject_area" (연계교과단원명)를 포함해야 합니다.

[⚠️ 절대 규칙 - 필수 준수 사항]
- 대학 과정의 어려운 개념(군론, 대칭군, 환론, 디오판토스, 복소평면 등)은 절대 배제하여 순수 고교 범위 내의 주제로만 candidates를 설계하십시오.
- 응답은 마크다운 코드블록(\`\`\`json) 기호 없이 반드시 아래 JSON 형식으로만 완벽하게 반환하세요.

응답 예시 JSON 형식:
{
  "verdict": "direct" | "redirect" | "unsuitable",
  "candidates": [ // verdict가 "direct"일 때만 포함
    {
      "title": "주제명",
      "description": "상세설명",
      "matched_content_elements": ["내용요소1"],
      "expected_variables": ["변인1", "변인2"]
    },
    ... (5개)
  ],
  "reason": "우회/부적합 판정 사유", // verdict가 "redirect" 또는 "unsuitable"일 때 포함
  "directions": [ // verdict가 "redirect"일 때만 포함 (3~4개)
    { "emoji": "🎯", "label": "융합 방향 1", "example": "상용로그 (#키워드)" }
  ],
  "suggestions": [ // verdict가 "unsuitable"일 때만 포함 (3개)
    { "refined_keyword": "빛의굴절", "subject_area": "물리학Ⅰ 파동" }
  ]
}`;

    try {
      const textOutput = await this.callLLM(promptText);
      const parsed = JSON.parse(textOutput);
      return parsed;

    } catch (e) {
      console.warn("실시간 AI 제안 API 호출 실패. 모의 AI 모드로 안전하게 전환합니다.", e);
      const fallbackTopics = this.generateSimulatedTopics(subject, kwList, motivation, forceDirect);
      fallbackTopics.isFallback = true;
      fallbackTopics.errorMsg = e.message;
      return fallbackTopics;
    }
  },

  /**
   * 6.2 AI 답변 추천 패턴 (각 텍스트 필드별 3개 추천 제공)
   */
  getSuggestions: async function (step, field, report) {
    const provider = localStorage.getItem("active_ai_provider") || "gemini";
    const activeKey = localStorage.getItem(`${provider}_api_key`);
    if (!activeKey || provider === "gemini-web-bridge") {
      return this.simulateGetSuggestions(step, field, report);
    }

    const subject = report.step_1?.교과목?.과목명 || "물리학Ⅰ";
    const topic = report.step_2?.선택_주제 || "자유 탐구";
    const type = report.step_2?.탐구유형 || "experiment";
    const keywords = (report.step_2?.키워드 || []).join(", ");
    
    const promptText = `당신은 한국 고등학교 1~3학년 학생들의 수학·과학 주제탐구 보고서 작성을 지도하는 최상위 학술 멘토 AI입니다.
현재 학생은 [${step}단계]의 [${field}] 입력 영역을 작성 중입니다.

[학생의 이전 단계 기입 정보]
- 과목명: ${subject}
- 탐구 주제: ${topic}
- 탐구 유형: ${type}
- 관련 키워드: ${keywords}
- 탐구 동기(Step 3): ${report.step_3?.동기 || ""}
- 탐구 목적(Step 3): ${report.step_3?.목적 || ""}
- 핵심 질문(Step 3): ${report.step_3?.핵심질문 || ""}
- 가설 명제(Step 4): ${report.step_4?.가설 || ""}
- 변수 설계(Step 4): ${JSON.stringify(report.step_4?.변수 || {})}
- 절차 설계(Step 5): ${report.step_5?.절차_방법 || ""}

[가이드 및 답변 규칙 - 필수 사항]
1. 현재 작성하려는 영역([${step}단계] - [${field}])에 기입하기에 가장 어울리고 학술적이며 문장력이 뛰어난 완성형 추천 예문 '3가지'를 리스트 형식으로 생성해 주십시오.
2. 예문은 절대로 고정된 템플릿이어선 안 되며, 학생이 앞서 입력한 구체적인 주제(${topic}), 관심사, 유형, 가설을 유기적이고 명확하게 반영한 구체적인 맞춤 문장이어야 합니다.
3. 고교 교육과정 범위 내의 정확한 학술 용어를 사용하되, 고등학생 수준에 맞고 즉시 수정해서 활용할 수 있는 현실적이고 매력적인 문장으로 작성하십시오.
4. 응답은 마크다운 코드블록(\`\`\`json) 표식 없이 반드시 아래 구조를 만족하는 순수 JSON 형식으로만 완벽하게 출력하십시오.

응답 예시 JSON 형식:
[
  "구체적이고 매력적인 추천 문장 후보 1",
  "구체적이고 매력적인 추천 문장 후보 2",
  "구체적이고 매력적인 추천 문장 후보 3"
]`;

    try {
      const textOutput = await this.callLLM(promptText);
      const parsed = JSON.parse(textOutput);
      return parsed;

    } catch (e) {
      console.warn("실시간 AI 예문 추천 생성 실패. 모의 모드로 전환합니다.", e);
      return this.simulateGetSuggestions(step, field, report);
    }
  },

  simulateGetSuggestions: function (step, field, report) {
    const subject = report.step_1?.교과목?.과목명 || "물리학Ⅰ";
    const topic = report.step_2?.선택_주제 || "자유 탐구";
    const type = report.step_2?.탐구유형 || "experiment";
    const keywords = report.step_2?.키워드 || [];
    const mainKw = keywords[0] || "실생활 현상";
    const secKw = keywords[1] || "기본 데이터";

    const typeLabel = typeof EXPLORATION_TYPES !== 'undefined' ? (EXPLORATION_TYPES.find(t => t.id === type)?.label || "탐구") : "탐구";

    if (step === 3) {
      if (field === "동기") {
        return [
          `평소 수업 시간에 배우던 ${subject}의 핵심 개념들이 실생활이나 학과 연구 분야에서 어떻게 나타나는지 깊은 호기심이 생겼습니다. 특히 최근 학습한 ${subject} 개념을 구체적인 사례인 '${topic}' 현상에 대입하여 심화 관찰하고자 탐구를 기획했습니다.`,
          `최근 다양한 공학 및 자연과학 매체에서 화제가 되고 있는 '${mainKw}' 현상에 대한 학술적 보고서를 접하게 되었습니다. 이를 평소 관심 있던 ${subject} 교과 내용과 융합하여 정량적으로 규명해 보고자 강한 동기를 가지게 되었습니다.`,
          `진로로 희망하는 연구 계열의 기초 지식을 다지고, 단순한 이론 암기를 넘어 실증 분석 능력을 기르고자 했습니다. 이에 따라 ${subject}의 원리를 직접적으로 응용하여 수집 분석할 수 있는 '${topic}'을 탐구 주제로 선정하였습니다.`
        ];
      } else if (field === "목적") {
        return [
          `본 탐구의 주된 목적은 '${topic}' 과정에서 발생할 수 있는 주요 정량적 변인들 간의 상관관계를 통계적으로 정밀 검증하고, 이를 통해 교과 단원에서 배운 이론적 공식과의 오차 및 일치율을 정량화하는 것입니다.`,
          `${subject} 교과서의 핵심 공식과 이론을 실제 실험 환경 또는 수치 분석을 통해 작동시키고, '${mainKw}' 요인의 조작 변화에 따른 종속 반응 데이터를 수집하여 그 변동 법칙을 물리/수학적으로 규명하는 데 목적이 있습니다.`,
          `단순히 정성적으로 현상을 묘사하는 것에서 나아가, '${secKw}' 등을 통제 조건으로 삼고 여러 수집 데이터를 체계적으로 전처리하여 학술적으로 신뢰할 수 있는 수학적 최적 모델을 유도하는 것을 최종 목표로 삼습니다.`
        ];
      } else if (field === "핵심질문") {
        return [
          `과연 조작 조건인 '${mainKw}'의 크기나 강도를 선형적으로 변화시킬 때, 종속 결과로 나타나는 반응 측정값은 비선형적 임계 수렴 경향을 보일 것인가?`,
          `${subject} 교과에 나타나는 핵심 인과 법칙이 현실의 복잡한 마찰 및 오차 요인을 적용한 '${topic}' 모델에서도 90% 이상의 유의미한 일치성을 유지하는가?`,
          `탐구 환경의 통제 조건들이 설정되어 있을 때, '${topic}'에서 가장 우수한 물리적/화학적 효율을 달성할 수 있는 최적의 한계 파라미터 영역은 어디인가?`
        ];
      }
    }

    if (step === 4) {
      if (field === "가설") {
        return [
          `만약 독립 변수 역할을 하는 '${mainKw}' 조건의 크기를 2배 이상 점진적으로 증가시킨다면, 종속 반응인 측정값은 교과 이론에 따라 비선형 지수함수적 수렴 곡선을 나타낼 것이다.`,
          `설정한 '${topic}' 모델에서 외부 마찰 저항 요인들이 철저하게 통제되는 실험실 환경이라면, 조작 조건의 변화량과 최종 관찰 데이터는 통계적으로 유의미한 양의 상관계수(R² ≥ 0.85)를 가지며 비례할 것이다.`,
          `이전 연구와 ${subject}의 지식을 종합해 볼 때, '${secKw}'이 증가할수록 화학 반응/역학 충돌 거동 시간은 지연될 것이며, 이는 특정한 포화 곡선 형태로 수렴할 것이다.`
        ];
      } else if (field === "근거") {
        return [
          `${subject} 교과서의 대단원 성취기준 및 관련 이론적 공식에 의하면, 이 현상은 이론상 특정한 물리적/수학적 상수 상호작용에 지배를 받으므로 해당 방향으로 수렴할 수밖에 없는 명확한 논리적 근거가 성립합니다.`,
          `선행 학술 논문 및 문헌 자료 조사에 따르면, 유사 계열의 시스템에서 '${mainKw}'의 변동은 물리적 마찰 손실 및 에너지 변동을 기하급수적으로 유도하는 성향을 가진다고 입증되었기 때문입니다.`,
          `수행하고자 하는 '${typeLabel}' 탐구의 조작 요인들은 교과 내의 상호 유기적인 에너지 보존 법칙 또는 반응 속도론 이론에 비추어 볼 때 인과적 타당성이 완벽히 대조되는 합리적인 추측입니다.`
        ];
      }
    }

    if (step === 5) {
      if (field === "절차_방법") {
        return [
          `1단계: 통제 변인인 환경 온도와 물리적 트랙 수평도를 일정하게 보존 및 고정한다.\n2단계: 조작 변인인 '${mainKw}'을 3개 이상의 측정 조건 구간으로 등간격 설정하여 세팅한다.\n3단계: 5회 이상 반복 실행하여 정량화된 수치 데이터를 소수점 둘째 자리까지 기록한다.\n4단계: Excel 통계 기법을 적용해 오차 분산을 규명하고 최종 그래프로 가공한다.`,
          `1단계: 공공 데이터 포털 또는 학술 데이터셋에서 '${topic}'과 연관된 최근 5개년 로우 데이터를 다운로드한다.\n2단계: 수치 누락 및 결측치를 클렌징하는 정제 알고리즘 처리를 구현한다.\n3단계: 가설에서 설정한 독립 변인과 종속 결과 간의 선형 회귀 상관계수 및 p-value를 연산한다.`,
          `1단계: 선행 문헌 3편을 기준으로 삼고, '${mainKw}'에 대한 대조 분석 프레임워크를 수립한다.\n2단계: 도출된 정성 자료들을 교과 성취기준에 명시된 이론 모델과 1대1 비교 분석한다.\n3단계: 한계점과 오차 범위의 공통 분모를 찾아내어 최종 결론을 연역적으로 아카이빙한다.`
        ];
      } else if (field === "도구_자료") {
        return [
          `실시간 MBL 센서 장치 및 데이터 수집 분석 전용 소프트웨어 프로그램, 수평 활주 트랙, '${mainKw}' 정밀 가공 도구`,
          `KOSIS 국가통계포털 및 기상청 기후정보 분석 자료, Excel 스프레드시트 분석 도구 및 통계 패키지 R`,
          `DBpia 학술 논문 데이터베이스 검색 연동망, 국립중앙도서관 아카이브 문헌, 고등학교 ${subject} 성취기준 안내서`
        ];
      } else if (field === "신뢰성_타당성") {
        return [
          `수행 시 모든 무작위 환경 잡음을 차단하기 위해 동일 조건에서 총 5회 이상 정성 반복 계측을 수행하고, 최댓값과 최솟값을 배제한 절단평균을 도출하여 데이터 오차를 극복합니다.`,
          `기기의 계통 오차를 잡기 위해 탐구 시작 전 센서 0점 조정을 완벽히 선행하며, 측정자가 바뀔 때 생길 수 있는 주관적 판독 오차를 완전히 배제하여 타당성을 확보합니다.`,
          `공신력 있는 국가 기관의 공인된 원시 로우 데이터셋을 사용하고, 정제 과정에서 중복값과 이상치를 수학적 사분위수(IQR) 기준선으로 제거함으로써 통계적 신뢰 수준을 보증합니다.`
        ];
      }
    }

    if (step === 6) {
      const designProc = report.step_5?.절차_방법 || "절차 진행";
      const designTools = report.step_5?.도구_자료 || "기자재 수용";
      return [
        `[계획 기반 실측 기록]\n설계했던 '${designTools}'을 완벽히 준비한 뒤 가이드에 따라 총 5회 측정을 실시하였음. 그 결과 독립 요인의 변화량에 비례하여 데이터가 등간격으로 이동하는 수치 표를 안정적으로 획득함.`,
        `[자료 정제 및 변환]\n다운로드한 원시 데이터 속 결측치를 평균값 대체법으로 깔끔히 정제하고, 단위 변환을 거쳐 상관관계 연산이 용이한 3가지 분석 테이블로 가공 및 시계열 그룹화를 완료하였음.`,
        `[특이 관찰 사실]\n실측 수행 과정에서 '${mainKw}' 변수가 특정 조건 이상으로 증가할 때, 교과 이론 예측치보다 오차가 다소 증가하는 구간이 포착되었으며, 이는 바닥면의 미세한 마찰 마모에 기인한 물리적 오차 요인으로 유추 기록함.`
      ];
    }

    if (step === 7) {
      const hyp = report.step_4?.가설 || "인과 상관관계";
      if (field === "사실_정리") {
        return [
          `측정 결과, 조작 변수가 수치적으로 2배, 3배 상승할 때 종속 결과 데이터 역시 1.5배, 2.9배로 거의 유사하게 곡선 비례하여 급등하는 사실을 통계적으로 포착함 (결정계수 R² = 0.94 확인).`,
          `수치 시뮬레이션 모델 검증 결과, 교과 이론에 기반한 지수함수적 하강 경향성과 실제 수집한 측정 로그 데이터의 꺾임 형태가 전체 구간에서 약 3.8% 수준의 극소 오차만을 남긴 채 일치함을 확인함.`,
          `표본 집단 대조 분석 결과, A 조건은 평균 4.2점의 높은 피드백 반응을 나타낸 반면, B 조건은 2.1점에 그쳐 두 독립 그룹 간에 매우 뚜렷한 통계적 유의성(p < 0.05)이 존재함을 규명함.`
        ];
      } else if (field === "가설_검증_근거") {
        return [
          `초기에 수립했던 가설 [${hyp}] 명제에서 예측한 비선형적 증가 추이가 실제 실측 데이터 그래프 상에서도 높은 통계적 결정계수(R² = 0.94)를 나타내며 입증되었으므로 가설을 완벽히 '지지'합니다.`,
          `저온 및 중온 영역 조건에서는 가설의 선형적 인과 관계가 명료하게 입증되었으나, 고온 구간에서는 마찰 손실 및 공기 저항 오차로 인해 일부 예측 편차가 관찰되었으므로 부분적으로 타당함을 고려하여 '부분지지'합니다.`,
          `개별 로우 데이터 분석 결과, 조작 조건의 증감 방향과 종속 반응의 상관계수는 무의미한 제로 수준에 가까웠으며, p-value가 유의수준 0.05보다 훨씬 컸기 때문에 과학적 인과를 증명하지 못하여 가설을 '기각(불지지)'합니다.`
        ];
      } else if (field === "한계_후속") {
        return [
          `실험실의 물리적 기압 환경과 센서 부착 패널의 정밀 마찰 제어가 완벽히 통제되지 못해 미세 오차가 누적된 한계가 있습니다. 향후에는 미적분Ⅰ 단원의 극한 보정 수식을 추가하여 이를 통계적 정밀 모델로 고도화하는 2차 탐구를 수행하고 싶습니다.`,
          `시간적 제약으로 인해 교내 표본 50명만을 조사 대상으로 삼았기 때문에 데이터의 일반성 보완 측면에서 표본 오차가 있을 수 있습니다. 다음 학기 기회가 된다면 학년 전체로 모집단을 확대하고 t-검정 통계 기법을 적용하여 신뢰도를 공고히 다지고자 합니다.`,
          `단순한 고교 범위 내의 1차원 선형 모델을 대입하다 보니 현실의 다변수 복합 요인들을 반영하기 어려웠습니다. 후속 연구로 다변수 미분 방정식을 컴퓨터 언어로 수치 시뮬레이션 코딩하여 정밀성을 비약적으로 높이는 공학적 탐구로 발전시키고 싶습니다.`
        ];
      }
    }

    return [
      "AI 추천 예문 후보 1: 입력 정보를 교과와 융합한 구체적인 내용으로 나만의 보고서를 구성해 보세요.",
      "AI 추천 예문 후보 2: 탐구 동기와 주제를 연결하여 생활기록부에 기재 가능한 깊이 있는 문장으로 가공해 보세요.",
      "AI 추천 예문 후보 3: 측정 과정의 한계점이나 오차 발생 요인을 솔직하게 수치와 함께 기록하면 신뢰성이 상승합니다."
    ];
  },

  checkHypothesis: function (hyp, rationale, variables) {
    const hasIfThen = hyp.includes("한다면") || hyp.includes("할 것이다") || hyp.includes("되면");
    const hasVars = Object.values(variables || {}).every(v => v && v.trim().length > 0);
    const hasRationale = rationale && rationale.length > 20;

    let verifiability = {
      strength: "가설이 정량화가 가능하거나 명확한 결과 예측을 담고 있어 긍정적입니다.",
      improvement: "결과 측정이 수치나 뚜렷한 예/아니오의 형태로 계량될 수 있는지 한 번 더 다듬어 보세요."
    };

    if (hasIfThen) {
      verifiability.strength = "조건절('~한다면')과 결과절('~할 것이다')의 인과적 구조를 훌륭하게 갖추고 있어, 실험이나 데이터를 통한 참/거짓 판단이 매우 용이한 훌륭한 가설입니다.";
    } else {
      verifiability.improvement = "'만약 [조작/독립 조건]을 ~하게 변화시킨다면, [종속 결과]는 ~하게 변할 것이다' 형태로 문장을 재구성하면 검증가능성이 비약적으로 상승합니다.";
    }

    let variableClarity = {
      strength: "탐구 유형에 걸맞은 핵심 변수들이 올바르게 추출되어 각 슬롯에 잘 배정되었습니다.",
      improvement: "변수 이름이 추상적일 수 있습니다. 좀 더 명확한 물리량(예: 속도가 아니라 '주행 속도 m/s')이나 통계 데이터 수치 명칭으로 지정해 주세요."
    };

    if (!hasVars) {
      variableClarity.improvement = "현재 작성 중인 변수 슬롯에 공란이 있습니다. 탐구를 통제하고 데이터를 측정하기 위해서는 모든 핵심 변수와 조건을 명확하게 기입해 주세요.";
    } else {
      variableClarity.strength = "조작/독립 변수와 측정하고자 하는 종속 결과 변수가 1:1로 대응되고 있으며 상호 섞이지 않고 잘 정돈되어 있습니다.";
    }

    let causality = {
      strength: "두 요인 간의 원인과 결과를 유추할 수 있도록 흐름이 잡혀 있습니다.",
      improvement: "변수들이 그저 단순히 '동시에 존재하는 사실'인지, 아니면 하나가 '원인'이 되어 다른 '결과'를 일으키는 관계인지 명확히 구별해야 합니다."
    };

    let scopeSuitability = {
      strength: "고등학생 수준에서 1~2주 내에 학교 실험실이나 데이터 포털로 충분히 수집 가능한 현실적 탐구 범위입니다.",
      improvement: "탐구하고자 하는 물리적 조건이나 모집단 데이터의 범위가 너무 광범위하지 않은지 점검하고, 실험실에서 핸들링할 수 있는 변수 영역으로 범위를 좁히는 것이 좋습니다."
    };

    if (hasRationale) {
      scopeSuitability.strength = "가설을 제안한 타당한 과학적/논리적 근거가 풍부하게 제시되어 있어, 단순한 추측이 아닌 합리적 가설의 기틀을 완성하고 있습니다.";
    } else {
      scopeSuitability.improvement = "왜 이 가설이 도출되었는지 교과서 지식이나 선행 지식을 1~2줄 더 서술하여 논리적 근거를 탄탄히 채워주세요.";
    }

    return {
      "검증가능성": verifiability,
      "변수_명확성": variableClarity,
      "인과_상관_구분": causality,
      "범위_적절성": scopeSuitability
    };
  },

  /**
   * 5단계 끝: 교과 연결 자기점검 모달용 AI 평가
   * 절대 규정: 별점 금지, 점수 금지, '세특' 단어 사용 절대 금지
   */
  selfCheckConnection: async function (subject, report) {
    const provider = localStorage.getItem("active_ai_provider") || "gemini";
    const activeKey = localStorage.getItem(`${provider}_api_key`);
    if (!activeKey && provider !== "gemini-web-bridge") {
      try {
        const choice = await App.askApiFallback();
        if (choice === "bridge") {
          localStorage.setItem("active_ai_provider", "gemini-web-bridge");
          return await this.selfCheckConnection(subject, report);
        }
      } catch (err) {
        console.log("사용자가 모드를 취소했습니다. 모의 AI 모드로 진행합니다.");
      }
      return this.simulateSelfCheckConnection(subject, report);
    }

    const promptText = `당신은 고등학교 수학·과학 탐구-교과 연결성 검정용 AI입니다.
학생이 선택한 교과목(${subject})과 2~5단계의 탐구 보고서 내용을 읽고, 성취기준 및 단원과 실제 얼마나 유기적으로 정밀 연계되어 있는지 분석해 주세요.

[학생 탐구 보고서 내용]
- 관심 과목: ${subject}
- 관심 키워드: ${(report.step_2?.키워드 || []).join(", ")}
- 최종 주제: ${report.step_2?.선택_주제 || ""}
- 탐구 유형: ${report.step_2?.탐구유형 || ""}
- 탐구 동기: ${report.step_3?.동기 || ""}
- 탐구 목적: ${report.step_3?.목적 || ""}
- 핵심 질문: ${report.step_3?.핵심질문 || ""}
- 가설: ${report.step_4?.가설 || ""}
- 근거: ${report.step_4?.근거 || ""}
- 변수: ${JSON.stringify(report.step_4?.변수 || {})}
- 절차: ${report.step_5?.절차_방법 || ""}
- 도구: ${report.step_5?.도구_자료 || ""}

[⚠️ 절대 규칙 - 필수 사항]
1. 응답 텍스트에 절대로 별표 문자(★)나 그 외의 별점 기호를 출력하지 마십시오.
2. 응답 텍스트에 '세특', '세부능력', '특기사항', '생활기록부', '생기부' 단어를 절대로 사용하지 마십시오. 학생이 세특을 지나치게 의식하면 학술적 탐구 본질이 왜곡되기 때문입니다.
3. 긍정적이고 지지하는 어조로 메타인지 자가 성찰을 도와주는 학술적 피드백을 제공해 주세요.

응답은 반드시 마크다운 코드블록(\`\`\`json) 표식 없이 아래의 순수 JSON 구조만 출력하십시오.
{
  "wellConnected": ["✓ 잘 연결됨 요소 1", "✓ 잘 연결됨 요소 2"],
  "needsImprovement": ["△ 조금 더 보강 가능 요소 1", "△ 조금 더 보강 가능 요소 2"],
  "notRelated": ["· 다루지 않는 영역 1", "· 다루지 않는 영역 2"],
  "overallComment": "전체 메타인지 피드백 코멘트 (세특, 생활기록부 단어 절대 금지)"
}`;

    try {
      const textOutput = await this.callLLM(promptText);
      const parsed = JSON.parse(textOutput);
      return parsed;

    } catch (e) {
      console.warn("실시간 AI 자기점검 평가 실패. 모의 AI 모드로 전환합니다.", e);
      return this.simulateSelfCheckConnection(subject, report);
    }
  },

  simulateSelfCheckConnection: function (subject, report) {
    const reportText = JSON.stringify(report);
    let wellConnected = [];
    let needsImprovement = [];
    let notRelated = [];
    let overallComment = "";

    if (subject.includes("물리") || subject.includes("역학") || subject.includes("에너지")) {
      wellConnected = ["힘과 운동 분석", "역학적 에너지 수지 보존 검토"];
      needsImprovement = ["마찰력 및 주변 환경으로 인한 열손실 계산 보강", "MBL 센서의 해상도 한계 보정"];
      notRelated = ["유기 화학 결합 구조 분석", "확률적 소비자 심리 분포 모델링"];
      overallComment = `작성하신 탐구 과정은 물리학 교과의 힘과 운동 단원에서 다루는 주요 핵심 지식을 정밀하게 적용하고 있습니다. 실험 과정에서 발생할 수 있는 마찰 저항이나 에너지 손실 원인을 좀 더 교과서 공식과 연계하여 수식화하면 메타인지적 완성도가 한층 높아질 것입니다.`;
    } else if (subject.includes("화학") || subject.includes("물질")) {
      wellConnected = ["반응 속도 영향 변인 통제", "화학적 변화 측정 설계"];
      needsImprovement = ["반응 촉매 및 활성화 에너지 장벽 개념 매핑", "pH 정밀 보정 및 측정 횟수 확대"];
      notRelated = ["우주 배경 복사 분석", "삼각함수의 기하학적 파형 합성"];
      overallComment = `본 설계는 화학 교과의 물질 대사 및 화학반응 속도 조절 개념을 훌륭히 담아내고 있습니다. 온도나 농도 같은 조작 변인이 분자 충돌 이론과 어떤 분자적 메커니즘으로 교과 내에서 해설되는지 배경 지식에 연결해 보면 훨씬 논리적인 탐구가 완성될 것입니다.`;
    } else if (subject.includes("미적분") || subject.includes("대수") || subject.includes("함수") || subject.includes("수학")) {
      wellConnected = ["함수적 모델링 구축", "도함수를 활용한 변화율 극대값 탐색"];
      needsImprovement = ["실제 물리 환경 제약 요소를 반영한 도메인 범위 설정", "독립 변인의 불연속성 극복을 위한 수치적 이산화 보강"];
      notRelated = ["생명체 삼투압 조절 메커니즘 분석", "지진파 P파 S파 전파 거동 측정"];
      overallComment = `본 주제는 수학적 모델을 구축하고 변화율을 정량화하려는 노력이 돋보입니다. 교과서에서 다루는 미분 계수 또는 수열의 극한 수렴성이 실제 현실 데이터의 복잡성과 만났을 때 생기는 격차를 분석에 명시해 주면, 더욱 입체적인 탐구가 될 것입니다.`;
    } else {
      wellConnected = ["독립 변인과 종속 결과의 인과 모델링", "측정 데이터를 바탕으로 한 추론 전개"];
      needsImprovement = ["선행 지식(교과 성취기준 내용)의 핵심 용어를 가설 근거에 추가 명시", "오차를 줄이기 위한 통제 장치 정밀화"];
      notRelated = ["관련성 없는 인문 사회적 역사 사례의 단순 연대기 나열", "수학/과학적 분석 모델 배제"];
      overallComment = `선택하신 [${subject}] 과목과 핵심 탐구 동기가 유기적으로 잘 엮여 있습니다. 탐구 과정 전반에 걸쳐 교과 이론에서 강조하는 핵심 정의와 법칙을 명시적으로 사용함으로써 탐구의 학술적 연결고리를 단단하게 묶어보세요.`;
    }

    return {
      wellConnected,
      needsImprovement,
      notRelated,
      overallComment
    };
  },

  /**
   * 6.1과 7.2 단계 등에서 AI 도움말 분석 결과를 받아와 각 텍스트 영역의 오차 진단 및 대안 제시
   * 절대 규정: 별점 금지, 점수 금지, '세특' 단어 사용 절대 금지
   */
  checkReportDraft: async function (subject, report) {
    const provider = localStorage.getItem("active_ai_provider") || "gemini";
    const activeKey = localStorage.getItem(`${provider}_api_key`);
    if (!activeKey && provider !== "gemini-web-bridge") {
      try {
        const choice = await App.askApiFallback();
        if (choice === "bridge") {
          localStorage.setItem("active_ai_provider", "gemini-web-bridge");
          return await this.checkReportDraft(subject, report);
        }
      } catch (err) {
        console.log("사용자가 모드를 취소했습니다. 모의 AI 모드로 진행합니다.");
      }
      return this.simulateCheckReportDraft(subject, report);
    }

    const promptText = `당신은 고등학교 수학·과학 탐구 보고서 초안 진단용 AI입니다.
학생이 작성한 보고서 초안의 내용을 상세히 검증하고, 특히 정량적 실측 결과와 초기의 가설/설계가 어떻게 어우러져 한계를 노출했는지 진단하십시오.

[학생 탐구 보고서 내용]
- 관심 과목: ${subject}
- 최종 주제: ${report.step_2?.선택_주제 || ""}
- 가설 명제: ${report.step_4?.가설 || ""}
- 실측 결과(Step 6): ${report.step_6?.실측_기록 || ""}
- 사실 정리(Step 7): ${report.step_7?.사실_정리 || ""}
- 가설 검증(Step 7): ${report.step_7?.가설_검증_근거 || ""}
- 한계/후속(Step 7): ${report.step_7?.한계_후속 || ""}

[⚠️ 절대 규칙 - 필수 준수 사항]
1. 별표 문자(★)나 그 외의 별점 기호는 절대로 출력하지 마십시오.
2. '세특', '세부능력', '특기사항', '생활기록부', '생기부' 단어를 절대로 사용하지 마십시오.
3. 학생들이 자신의 탐구 활동에서 발생한 오차를 두려워하지 않고, '오차의 원인 규명'이 학술적으로 매우 가치 있는 일임을 깨달을 수 있게 긍정적인 메타인지 코멘트를 제공해 주십시오.

응답은 마크다운 코드블록(\`\`\`json) 표식 없이 반드시 아래 구조를 만족하는 순수 JSON 형식으로만 완벽하게 출력하십시오.
{
  "strength": "가장 논리적으로 훌륭하고 잘 작성된 부분에 대한 격려 및 분석",
  "weakness": "실험 오차 발생 요인 혹은 정량적 서술 보강이 필요한 점 진단",
  "actionPlan": "이 오차를 수학적/과학적 원인으로 분석하여 결론에 채워 넣을 수 있는 구체적인 가이드",
  "overallEvaluation": "전체 초안 검토 메타인지 코멘트 (세특, 생활기록부 단어 절대 금지)"
}`;

    try {
      const textOutput = await this.callLLM(promptText);
      const parsed = JSON.parse(textOutput);
      return parsed;

    } catch (e) {
      console.warn("실시간 AI 보고서 진단 평가 실패. 모의 AI 모드로 전환합니다.", e);
      return this.simulateCheckReportDraft(subject, report);
    }
  },

  simulateCheckReportDraft: function (subject, report) {
    const draftText = JSON.stringify(report);
    let strength = "초기에 설정한 가설과 실측 결과를 1대1로 비교하여 데이터를 유도해 낸 과정의 정직성과 정량성이 매우 모범적입니다.";
    let weakness = "현실 실험실이나 외부 데이터셋에는 마찰 저항, 통계적 표본 편차 등 수많은 오차 요인이 개입하지만, 현재 초안에는 그 구체적 물리화학적 혹은 통계적 메커니즘 분석이 다소 생략되어 있습니다.";
    let actionPlan = "측정 데이터 표를 기준으로 이론 공식 대입 시 발생한 수치적 격차(예: 평균 오차율)를 계산하여 추가하고, 이를 '수행 절차상의 한계(예: 센서 해상도 부족 등)'와 결부하여 결론 7단계 한계 항목에 기입해 보세요.";
    let overallEvaluation = "전체적으로 탐구 보고서의 흐름이 잘 잡혀 있으며, 데이터에 기반한 추론이 명확하게 녹아들어 있습니다. 오차의 발생 요인을 과학적인 원리로 담담히 풀어낸다면 심화 학술 탐구 보고서로서 훌륭한 수준으로 거듭날 것입니다.";

    return {
      strength,
      weakness,
      actionPlan,
      overallEvaluation
    };
  },

  validateThemeCurriculum: function (subject, theme) {
    const text = theme.toLowerCase();
    
    // 1. 고등학교 교육과정 이탈 개념 (대학 수학/과학 등) 필터
    const outOfScopeTerms = [
      { term: "대수적 군론", name: "대수적 군론 (Group Theory)" },
      { term: "군론", name: "군론 (Group Theory)" },
      { term: "point group", name: "점군 (Point Group)" },
      { term: "wallpaper group", name: "벽지군 (Wallpaper Group)" },
      { term: "symmetry group", name: "대칭군 (Symmetry Group)" },
      { term: "대칭 그룹", name: "대칭군 (Symmetry Group)" },
      { term: "환론", name: "환론 (Ring Theory)" },
      { term: "추상 대수학", name: "추상 대수학 (Abstract Algebra)" },
      { term: "추상대수학", name: "추상 대수학 (Abstract Algebra)" },
      { term: "복소 평면", name: "복소평면 (Complex Plane)" },
      { term: "복소평면", name: "복소평면 (Complex Plane)" },
      { term: "오일러 공식", name: "오일러 공식 (Euler's Formula - 고급 기하/해석학)" },
      { term: "디오판토스", name: "디오판토스 방정식 (정수론)" },
      { term: "정수론", name: "정수론 (Number Theory - 일반 고교 대수 외 범위)" },
      { term: "힐 암호", name: "힐 암호 (Hill Cipher - 대학 선형대수학 행렬 연산)" },
      { term: "행렬 대수", name: "행렬 대수 (Matrix Algebra - 현재 일반 고교 교육과정 외)" },
      { term: "행렬대수", name: "행렬 대수 (Matrix Algebra - 현재 일반 고교 교육과정 외)" }
    ];

    for (let item of outOfScopeTerms) {
      if (text.includes(item.term.toLowerCase())) {
        return {
          status: "warning",
          message: `해당 주제는 고교 교육과정 범위 외 대학 수준의 개념인 [${item.name}]을 포함하고 있습니다. 생활기록부 기재 시 법적 위반 경고 또는 기재 불인정 대상이 될 수 있으므로 수정을 강력 권장합니다.`
        };
      }
    }

    // 2. 고등학교 교육과정 정규 매핑 검증
    const lowerSub = subject.toLowerCase();
    
    if (lowerSub.includes("대수") || lowerSub.includes("수학1") || lowerSub.includes("수학i")) {
      const mathTerms = ["지수", "로그", "삼각함수", "수열", "사인", "코사인", "등차", "등비", "귀납", "드로잉", "서사", "수열", "비율"];
      const matched = mathTerms.filter(t => text.includes(t));
      
      if (matched.length > 0) {
        return {
          status: "success",
          message: `고등학교 '대수(수학Ⅰ)' 교육과정의 핵심 내용요소인 [${matched[0]}] 단원과 완벽하게 정합하는 훌륭한 탐구 주제입니다.`
        };
      } else {
        return {
          status: "warning",
          message: `이 주제는 고등학교 '대수' 과목의 핵심내용(지수, 로그, 삼각함수, 수열 등) 중 어느 단원과 연계되는지 명확하지 않습니다. 생활기록부 기재를 위해 핵심 단원 개념어가 드러나게 주제명을 보완해 주세요.`
        };
      }
    }

    if (lowerSub.includes("물리")) {
      const physTerms = ["운동량", "충격량", "역학", "에너지", "뉴턴", "가속도", "속도", "힘", "전자기", "파동", "양자", "열역학"];
      const matched = physTerms.filter(t => text.includes(t));
      
      if (matched.length > 0) {
        return {
          status: "success",
          message: `고등학교 '물리학' 교육과정의 핵심 성취기준 내용요소인 [${matched[0]}] 단원과 완벽하게 정합하는 훌륭한 탐구 주제입니다.`
        };
      }
    }

    if (lowerSub.includes("화학")) {
      const chemTerms = ["반응 속도", "반응속도", "촉매", "평형", "몰", "화학식", "원소", "결합", "중화", "산화", "환원", "용액", "상태"];
      const matched = chemTerms.filter(t => text.includes(t));
      
      if (matched.length > 0) {
        return {
          status: "success",
          message: `고등학교 '화학' 교육과정의 핵심 성취기준 내용요소인 [${matched[0]}] 단원과 완벽하게 정합하는 훌륭한 탐구 주제입니다.`
        };
      }
    }

    if (lowerSub.includes("생명과학")) {
      const bioTerms = ["세포", "물질대사", "물질 대사", "항상성", "호르몬", "신경", "유전", "염색체", "생태계", "상호작용"];
      const matched = bioTerms.filter(t => text.includes(t));
      
      if (matched.length > 0) {
        return {
          status: "success",
          message: `고등학교 '생명과학' 교육과정의 핵심 성취기준 내용요소인 [${matched[0]}] 단원과 완벽하게 정합하는 훌륭한 탐구 주제입니다.`
        };
      }
    }

    if (lowerSub.includes("지구과학") || lowerSub.includes("통합과학")) {
      return {
        status: "success",
        message: `선택하신 '${subject}' 교과의 성취기준 및 단원 학습목표에 부합하는 탐구 주제입니다.`
      };
    }

    return {
      status: "success",
      message: `고등학교 교육과정 범위 내의 개념들을 적절히 탐구하는 융합 주제입니다.`
    };
  }
};
