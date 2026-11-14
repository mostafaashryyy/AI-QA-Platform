// ARABIC TOOLTIP CONTENT — the ⓘ explanations, in Egyptian Arabic with technical terms in English, as in
// reports/AIPromptOutputHistory.html. Each text says what the item is, what it contains, how it is calculated,
// why it matters and which artifact / skill provides it. Latin runs are wrapped in Unicode isolates (LRI … PDI)
// so English terms and IDs keep their order inside right-to-left text, exactly like the reference page.

const T = {
  // header
  h1: 'ده تقرير الـ QA النهائي للتاسك: بيجمّع مخرجات كل مراحل الـ workflow (الـ PRD، الـ ProjectContext، الـ Exploration، الـ TestCases، الـ TestReview، الـ Manual Execution، الـ Automation، والـ Self-Healing) في تقرير واحد مبني على الأدلة، وفي الآخر بيدي توصية QA للإصدار. كل رقم هنا محسوب من ملفات التاسك والـ journal، مش متكتب بالإيد.',
  status: 'الحالة دي بتقول إن الصفحة دي اتولّدت بالـ renderer بتاع الـ qa-final-report skill من بيانات التاسك الحقيقية، بس من غير ما الـ stage يتسجل في الـ journal ومن غير الـ QA_FINAL_REPORT_APPROVED. يعني دي Draft للمراجعة، مش التقرير الرسمي المعتمد.',
  run: 'الـ Workflow Run ID هو رقم الـ run اللي كل الأحداث والموافقات متسجلة تحته في journal/workflow-run.json. الـ skill بيقراه بس، عمره ما بيعمله. كل الأرقام في التقرير محسوبة من أحداث الـ run ده بس.',
  prereq: 'دي الشروط السبعة اللي الـ skill لازم يتأكد منها قبل أي تحليل (QFR-E01 لـ QFR-E08): فولدر التاسك، الـ run النشط، الـ journal سليم، الـ TestCases موجودة، وموافقات الـ TEST_DESIGN_APPROVED والـ TEST_REVIEW_APPROVED لسه current. لو شرط واحد وقع، التقرير مبيتكتبش أصلًا.',

  // sections
  s1: 'القسم ده بيدي ملخص سريع لحالة الاختبار بالكامل: عدد حالات الاختبار المعتمدة، ونتائج الـ PASS والـ FAIL والـ BLOCKED والـ NOT EXECUTED، وآخر نتيجة Automation لكل framework، والـ Open Defects، وأهم المخاطر، والتوصية النهائية للإصدار. كل كارت هنا متاخد من نفس الـ data object اللي باقي التقرير مبني عليه.',
  s2: 'القسم ده بيعرّفك بالمشروع والتاسك: الـ scope وإيه اللي برّه الـ scope، والـ environment اللي اتعمل عليه الاختبار، وفترة الاختبار، وكل مرحلة في الـ workflow اتعملت ولا لأ، ونسختها، والـ hash بتاعها، وهل الموافقة عليها لسه current. مصدره الـ journal والـ TaskContext والـ workflow YAML.',
  s3: 'القسم ده بيوضح مدى تغطية الاختبارات للـ Requirements والـ Features الموجودة في الـ PRD والـ ProjectContext، من الـ Traceability Matrix المعتمدة في TestCases.md بس. بيوضح إيه اللي اتغطى، وإيه اللي اتنفذ، وإيه اللي لسه من غير Test Coverage وليه (CG-###).',
  s4: 'القسم ده بيعرض نتائج الـ Manual Execution من ExecutionReport.md المعتمد: كل حالة ظاهرة مرة واحدة بآخر حالة ليها. بيتأكد من المعادلتين Executed = PASS + FAIL + BLOCKED و Approved = Executed + NOT EXECUTED، وبيقارن §3 بـ §4 وبالـ test_results في الـ journal.',
  s5: 'القسم ده بيعرض نتائج الـ Automation Execution الفعلية لكل framework (binding) لوحده، من غير ما يجمعهم. بيفرّق بين الـ tests اللي اتولدت والـ tests اللي اتنفذت فعلًا، وبيعرض الـ Passed والـ Failed والـ Not run والـ Harness failed، مع التمييز بين مشاكل الـ Automation Script والـ Application Bugs.',
  s6: 'القسم ده بيلخّص الـ Defects من BugReports.md: العدد الكلي، والتوزيع حسب الـ Severity لوحده والـ Priority لوحده، وتصنيف كل bug (Confirmed ولا Suspected) زي ما هو متسجل من غير ما نغيّره. الـ bug اللي اتشاف في الـ manual والـ automation بيتحسب مرة واحدة بس.',
  s7: 'القسم ده بيحلل كل run للـ Automation منجحش: سببه إيه بالظبط (test_script، configuration، environment، framework_defect، test_data، application، unknown). التصنيف متاخد من الـ journal أو من آخر Self-Healing attempt صنّفه، وده اللي بيفرّق بين مشكلة في كود الاختبار ومشكلة حقيقية في التطبيق.',
  s8: 'القسم ده بيعرض محاولات الـ Self-Healing: كل محاولة صلّحت إيه، وتصنيفها، وهل الـ verification run بعدها نجح ولا لأ. المحاولة مبتتحسبش fixed غير لو فيه verification run صالح نتيجته passed. الفشل الأصلي بيفضل ظاهر حتى لو اتصلّح بعدين.',
  s9: 'القسم ده بيجمع المخاطر والمشاكل المعروفة: مخاطر التقرير نفسه (QRSK-###) وكل واحدة ليها مصدر أو مكتوب جنبها analysis-derived، ومخاطر المراحل اللي قبل كده بأرقامها الأصلية، والمشاكل المعروفة، والتناقضات بين المصادر (QINC-###)، والمراحل الناقصة.',
  s10: 'القسم ده بيوضح توصية فريق الـ QA بشأن جاهزية الإصدار، بناءً على نتائج الاختبارات والـ Defects والمخاطر والأدلة المتاحة. القواعد الأربعة بتتطبق بالترتيب وأول قاعدة تنطبق هي اللي بتحكم. التوصية مش بديل عن موافقة الـ Business أو Release Management.',
  s11: 'القسم ده بيربط كل نتيجة بمصدرها: كل ملف التقرير اتبنى عليه بنسخته والـ SHA-256 والحدث اللي عمله والموافقة عليه، وسلاسل الـ traceability من الـ Requirement للـ TestCase للنتيجة للدليل للـ bug، ومن فشل الـ Automation للـ healing للـ verification run.',

  // §1 cards
  'c-approved': 'عدد حالات الاختبار الـ Active في TestCases.md المعتمد والـ current (الـ withdrawn مش محسوبة). ده المقام الأساسي لكل نسب التغطية في التقرير. المصدر: test-design، بموافقة TEST_DESIGN_APPROVED.',
  'c-inscope': 'الحالات اللي Valid in Scope = TRUE وليها Expected Result متحدد (established). الحالات الـ Exploratory اللي الـ Expected Result بتاعها "Not established" برّه الرقم ده، لأنها مبتاخدش حكم PASS أو FAIL.',
  'c-executed': 'عدد الحالات اللي اتنفذت يدويًا = PASS + FAIL + BLOCKED، من جدول §4 في ExecutionReport.md. النسبة بتتحسب مرة على الـ Approved ومرة على الـ In scope، والبسط والمقام مكتوبين قدامك.',
  'c-pass': 'عدد الحالات اللي آخر نتيجة manual ليها PASS في ExecutionReport.md المعتمد. نسبة نجاح عالية لوحدها عمرها ما بتبرر GO؛ لازم كمان يكون مفيش defects مفتوحة ولا مخاطر مش محلولة.',
  'c-fail': 'عدد الحالات اللي آخر نتيجة manual ليها FAIL. الـ FAIL مش معناها bug أوتوماتيك: لازم bug report في BugReports.md علشان تتحسب defect.',
  'c-blocked': 'عدد الحالات اللي اتمنعت من التنفيذ (BLOCKED) بسبب حاجة زي environment أو data أو مشكلة في الـ test case. الحالة دي بتتحسب executed بس من غير حكم على التطبيق.',
  'c-notexec': 'الحالات المعتمدة اللي ملهاش نتيجة PASS/FAIL/BLOCKED. هنا هي الحالات الـ Exploratory: اتجرّبت واتسجلت ملاحظاتها، بس من غير حكم لأن الـ Expected Result مش متحدد.',
  'c-auto': 'آخر نتيجة صالحة للـ test ده في الـ framework ده: آخر run صالح (مش warm-up ولا demo) فيه الحالة دي، من الـ automation_runs في الـ journal. كل framework بيتعرض لوحده ومبيتجمعش مع التاني ولا مع الـ manual.',
  'c-defects': 'عدد الـ BUG-### المختلفة في BugReports.md من غير الـ withdrawn، ومعاه عدد الـ Open وأعلى Severity. التصنيف (Confirmed / Suspected) بيتعرض زي ما هو؛ التقرير عمره ما بيرقّي Suspected لـ Confirmed.',
  'c-qinc': 'عدد التناقضات اللي لقيناها بين المصادر (QINC-###). الـ unreconciled منها هو اللي بيأثر على النتايج وممكن يخلّي التوصية INSUFFICIENT EVIDENCE؛ الـ informational زي فرق الـ line endings مبيأثرش.',
  'c-risks': 'عدد مخاطر الـ QA اللي التقرير سجّلها (QRSK-###)، وكام واحدة منها تأثيرها High أو Medium. التفاصيل ومصدر كل خطر في قسم 9.',
  reco: 'دي التوصية الوحيدة اللي التقرير بيديها، واحدة من أربعة: GO أو CONDITIONAL GO أو NO-GO أو INSUFFICIENT EVIDENCE، حسب أول قاعدة تنطبق بالترتيب. دي نصيحة QA جوّه الـ scope اللي اتختبر بس، مش موافقة إصدار.',

  // §2
  stages: 'كل مرحلة في default-qa-workflow بترتيبها: اتنفذت كام مرة في الـ run، وآخر حدث ليها، والـ skill ونسخته، والـ artifact الأساسي ونسخته والـ hash، وحالة الموافقة. Current معناها إن الـ hash الحالي هو نفس اللي اتوافق عليه ومفيش تنفيذ بعد الموافقة.',
  env: 'الـ environment والـ build والـ browser زي ما ExecutionReport.md سجّلهم. لو مفيش environment مخصص (زي الـ demo site المشترك)، ده بيتعرض كقيد على النتايج لأن الداتا ممكن تتغير بين run والتاني.',
  period: 'فترة الاختبار من أوقات التنفيذ المسجلة: بداية ونهاية الـ manual execution، وأي re-execution، وأول وآخر automation run. مفيش وقت بيتقدّر؛ اللي مش متسجل بيتكتب unavailable.',
  scope: 'الـ In scope والـ Out of scope زي ما TestCases.md المعتمد كاتبهم في §2. أي حاجة برّه الـ scope مش متختبرة، وده بيتعرض تاني في حدود التوصية في قسم 10.',

  // §3
  'cov-table': 'جدول التغطية: كل نسبة مكتوبة كـ بسط / مقام (النسبة %)، ولو المقام صفر بتظهر N/A. Executed / Approved بتقيس قد إيه من الـ scope المعتمد كله اتنفذ، و Executed / In scope بتقيس قد إيه من الحالات اللي ممكن تاخد حكم اتنفذ فعلًا.',
  'req-cov': 'تغطية الـ PRD Requirements من صفوف الـ "PRD FR-###" في الـ Traceability Matrix المعتمدة بس. Covered يعني فيه test case واحدة على الأقل مربوطة بيه، و Executed يعني واحدة منهم على الأقل اتنفذت. الـ Requirements اللي مش في الـ matrix تغطيتها Evidence Not Available، مش صفر.',
  'src-cov': 'كل المصادر اللي في الـ Traceability Matrix (PRD FR، PC BR/EB/DEP/SA): كام واحد ليه test cases، وكام واحد ملهوش وليه، مجمّعين حسب الـ Coverage Gap (CG-###) اللي TestCases.md كاتبه.',
  matrix: 'جدول لكل حالة اختبار: الـ priority، وهل هي in scope، ونتيجة الـ manual، وآخر نتيجة automation لكل framework، والـ bugs المفتوحة المربوطة بيها، والـ healing IDs، والـ Derived QA status. تقدر تدوّر بـ TC-### أو BUG-### وتفلتر وترتّب.',
  derived: 'الـ Derived QA case status بيتحسب بالقاعدة المكتوبة فوق الجدول بالحرف من الـ SKILL.md. أي bug مفتوح مش withdrawn بيربط الحالة بيخليها FAIL (defect) حتى لو الـ manual كان PASS (لأن الـ bug ممكن يكون في precondition)، والـ classification (زي Suspected) بيفضل ظاهر جنبها.',
  'chart-manual': 'رسم بيوضح نتايج الـ manual على كل الحالات المعتمدة: PASS و FAIL و BLOCKED و NOT EXECUTED. الأرقام نفسها موجودة في الجدول اللي جنبه، والألوان مش لوحدها: كل جزء مكتوب اسمه ورقمه.',
  'out-scope': 'الحالات المعتمدة اللي برّه الـ execution scope وسبب كل واحدة: Valid in Scope = FALSE، أو الـ Expected Result مش متحدد (Exploratory مع الـ open question TQ-### بتاعها).',

  // §4
  'm-identity': 'المعادلتين الأساسيتين: Executed = PASS + FAIL + BLOCKED و Approved = Executed + NOT EXECUTED. لو واحدة منهم مش مظبوطة، الفرق بيتسجل كـ QINC والأرقام بتتعلّم unreconciled.',
  'm-xcheck': 'مقارنة 3 مصادر لنفس النتايج: جدول §4 (الأساس)، وملخص §3 في نفس التقرير، والـ test_results في آخر stage_execution للـ manual-execution في الـ journal. لو اختلفوا بيتسجل QINC بدل ما نختار واحد بصمت.',
  'm-history': 'النتايج اللي اتغيرت في revisions الـ ExecutionReport. دي history: الحالة بتتحسب مرة واحدة بآخر نتيجة ليها، والنتيجة القديمة بتفضل متسجلة هنا علشان محدش يفتكر إنها اختفت.',
  notexec: 'الحالات اللي متنفذتش وسبب كل واحدة، زي ما ExecutionReport.md كاتبه. "observed" معناها إن الخطوات اتعملت والملاحظات اتسجلت، بس من غير حكم PASS/FAIL.',
  tci: 'الـ Test Case Issues: مشاكل في الـ test case نفسه (افتراض غلط، خطوة مش قابلة للتنفيذ، داتا ناقصة)، مش في التطبيق. بتتحل عن طريق test-design، والمحلول منها مكتوب Resolved.',
  dev: 'الـ Deviations: كل مرة التنفيذ خرج عن الخطوات المكتوبة وليه، وهل الانحراف اتعمل فعلًا. ده بيوضح إن النتيجة اتاخدت إزاي بالظبط.',

  // §5
  'gen-table': 'لكل framework: عدد الـ Automation candidates (Needs Automation = TRUE)، وكام test اتولد فعلًا (من automated_cases في حدث الـ automation-generation)، وكام واحد ليه run صالح. Generated مش معناها Executed: test اتولد ومتنفذش بيتعرض Not run.',
  latest: 'آخر run صالح لكل حالة في كل framework، بآخر started_at. بعد أي healing، ده بيكون الـ verification run. النتيجة متاخدة من الـ automation_runs في الـ journal ومتراجعة على ملفات النتايج.',
  history: 'كل الـ runs الصالحة لكل framework بنتايجها. الـ history بتتعرض للـ traceability بس، ومبتتجمعش أبدًا على عدد الحالات: حالة اتنفذت 10 مرات لسه حالة واحدة.',
  excluded: 'الـ runs اللي متعلّمة warm-up أو demo أو benchmark-only، أو اللي ملفات نتايجها مش موجودة. بتتعرض علشان الشفافية، بس مبتتحسبش كآخر نتيجة.',
  durations: 'المدة من execution-metrics.json بس: الـ mean والـ median للـ runs الصالحة اللي نجحت، ومعاهم عدد العينات n. الأرقام دي للمعلومة؛ مفيش استنتاج من عينة واحدة، والمقارنة بين الـ frameworks شغل تقرير الـ reporting.',
  'chart-auto': 'رسم لآخر نتيجة لكل حالة في كل framework (عدد حالات، مش عدد runs). كل framework ليه لون ثابت ومكتوب اسمه.',
  'chart-hist': 'رسم لنتايج كل الـ runs الصالحة لكل framework. ده history (عدد runs)، مش عدد حالات، ومبيدخلش في أي نسبة تغطية.',
  bindings: 'كل binding هو مشروع automation مستقل (framework + لغة + runner) في automation/<project-dir>/. الـ bindings عمرها ما بتتجمع مع بعض؛ كل واحد ليه نتايجه وفشله وhealing بتاعه.',

  // §6
  sev: 'عدد الـ Defects حسب الـ Severity (Critical / High / Medium / Low) زي ما BugReports.md كاتبها. الـ Severity بتقيس حجم التأثير على التطبيق، ومتعرضة في جدول ورسم منفصلين عن الـ Priority.',
  prio: 'عدد الـ Defects حسب الـ Priority زي ما BugReports.md كاتبها. الـ Priority بتقيس قد إيه الإصلاح مستعجل، وده مختلف عن الـ Severity، علشان كده عمرهم ما بيتجمعوا في bucket واحد.',
  buglist: 'كل الـ Defects بالتفاصيل: العنوان، والتصنيف، والـ Severity، والـ Priority، والـ Status، والحالات المتأثرة، والأدلة. ده نقل من BugReports.md من غير أي تعديل.',
  suspected: 'Suspected معناها إن السلوك شكله غلط بس مفيش Expected Result معتمد يحسم، فمحتاج قرار من الـ Business أو الـ Design قبل ما يتعامل كـ defect. التقرير بيعرضها زي ما هي ومبيحوّلهاش لـ Confirmed.',
  unconfirmed: 'فشل automation متصنّف application من غير BUG-### مربوط بيه. ده مش defect لحد ما حد يعمله bug report؛ بيتعرض هنا علشان يروح لعملية الـ bug.',
  pb: 'الـ POTENTIAL BUGs (PB-###) اللي اتلاحظت في الـ Exploration. لو ليها bug report بتظهر مربوطة بيه، ولو ملهاش بتتعامل كـ risk مش كـ defect.',
  envissues: 'مشاكل الـ environment والـ test data اللي BugReports.md قال صراحة إنها مش application bugs، مع السبب والدليل.',

  // §7
  fclass: 'عدد الـ runs الصالحة اللي منجحتش، لكل framework، حسب الـ failure class. المقام هو عدد الـ non-passing runs في الـ framework ده. الـ test_script والـ configuration والـ environment والـ framework_defect مشاكل في الـ automation نفسها، أما الـ application فهي اللي ممكن تكون bug حقيقي.',
  signatures: 'الفشل متجمّع حسب الـ signature (نوع الفشل + أول جزء من رسالة الخطأ)، علشان تشوف لو نفس المشكلة اتكررت في كذا run، ومين الـ healing attempt اللي اشتغل عليها.',
  'chart-fclass': 'رسم لتوزيع الـ failure classes في كل framework على الـ runs الصالحة اللي منجحتش. نفس الأرقام موجودة في الجدول اللي فوقه، وكل framework ليه لون ثابت. لو مفيش ولا عمود application، يبقى مفيش run فشل بسبب سلوك التطبيق نفسه.',

  // §8
  'h-inv': 'عدد الـ run IDs المختلفة اللي فشلت واتعمل عليها healing attempt واحدة على الأقل. المصدر: healing_attempts في الـ journal، ومتراجع على self-healing/healing-log.md.',
  'h-att': 'عدد محاولات الـ healing المسجلة (E-### و H-###). محاولة واحدة ممكن تغطي كذا run فاشل بنفس السبب.',
  'h-fixed': 'المحاولات اللي result بتاعها fixed وكمان ليها verification run صالح نتيجته passed. لو مكتوب fixed من غير verification ناجح بتتحسب not fixed وبيتسجل QINC.',
  'h-notfixed': 'المحاولات اللي متصلحتش (not_fixed)، أو اتكتبت fixed من غير verification run ناجح.',
  'h-esc': 'المحاولات اللي اتصعّدت لإنسان (escalated) بعد ما الحدود المسموحة خلصت أو السبب محتاج قرار.',
  'h-remaining': 'الـ runs اللي آخر healing attempt عليها مش fixed، زائد أي آخر run فاشل ملهوش أي attempt. ده اللي لسه مفتوح في الـ automation.',
  'h-table': 'كل محاولة healing: الـ run الفاشل الأصلي (بيفضل ظاهر)، والتصنيف، والتغيير اللي اتعمل، وهل الـ assertion اتغير (لازم يكون لأ)، والـ verification run ونتيجته.',

  // §9
  risks: 'مخاطر الـ QA اللي التقرير سجّلها (QRSK-###): كل واحدة ليها category وimpact ومصدر (BUG-### أو run ID أو CG-### أو QINC-###)، أو مكتوب analysis-derived مع السبب. الأرقام ثابتة بين الـ revisions.',
  'upstream-risks': 'المخاطر اللي اتسجلت في المراحل اللي قبل كده (الـ ProjectContext والـ AutomationGeneration) بأرقامها الأصلية. التقرير مبيعيدش ترقيمها ومبيحكمش هي اتحلت ولا لأ.',
  known: 'المشاكل المعروفة من المصادر: مشاكل environment وtest data، والـ Test Case Issues اللي لسه مفتوحة، والـ Advisory findings المفتوحة في الـ TestReview.',
  qinc: 'كل تناقض بين المصادر (QINC-###): المصادر، والقيم المختلفة، والقيمة اللي التقرير عرضها وليه، والتأثير. الـ skill ممنوع يختار قيمة بصمت.',
  gaps: 'المراحل اللي متعملتش أو الـ artifacts الناقصة أو اللي placeholder. الغياب عمره ما بيتحسب نتيجة: مفيش ExecutionReport يعني الـ manual متعملش، مش "مفيش حاجة فشلت".',

  // §10
  rule: 'القاعدة اللي حكمت التوصية. القواعد بتتطبق بالترتيب: 1 INSUFFICIENT EVIDENCE، 2 NO-GO، 3 CONDITIONAL GO، 4 GO، وأول واحدة تنطبق هي اللي بتكسب. تحت كل قاعدة مكتوب إيه اللي انطبق منها ومصدره.',
  policy: 'لو التاسك أو المشروع عنده release policy معتمدة (في الـ PRD أو الـ ProjectContext أو الـ TaskContext) بتتقدّم على القواعد الافتراضية وبتتنقل بالحرف. لو مفيش، القواعد الافتراضية بتاعة الـ platform هي اللي بتتطبق.',
  supporting: 'الأدلة اللي بتدعم التوصية، كل واحدة بمصدرها (event ID أو run ID أو artifact): الـ manual execution المعتمد، وحالة الـ defects، وآخر نتيجة لكل framework، وحالة الموافقات. ده اللي يخليك تراجع التوصية بنفسك من غير ما تثق في الرقم وخلاص.',
  conditions: 'شروط الـ CONDITIONAL GO: شروط واضحة تقدر تتأكد منها (زي "BUG-002 اتقرر فيه والحالات اتعادت PASS"). لما كلها تتحقق ومفيش حاجة جديدة، التوصية ممكن تبقى GO.',
  blocking: 'المشاكل اللي بتمنع الإصدار (بتظهر مع NO-GO أو INSUFFICIENT EVIDENCE). لو مفيش، مكتوب None.',
  actions: 'الخطوات المطلوبة من الفريق، ومين المرحلة المسؤولة عنها، علشان المخاطر المفتوحة تتقفل.',
  change: 'إيه اللي ممكن يغيّر التوصية: إيه اللي يخليها GO، وإيه اللي يخليها NO-GO، وإيه اللي يخليها INSUFFICIENT EVIDENCE.',
  limits: 'حدود الـ scope: اللي برّه الـ scope، والحالات اللي من غير حكم، وفجوات التغطية اللي محتاجة متابعة. بتتعرض دايمًا مهما كانت التوصية.',

  // §11
  bound: 'كل ملف التقرير اتربط بيه: المسار، والنسخة، والـ SHA-256 الحالي، والحدث اللي عمله، والموافقة وحالتها، واتلقى إزاي (journal أو workflow). لو أي ملف منهم اتغير بعد كده، التقرير بيبقى stale.',
  chains: 'سلاسل الـ traceability بالأرقام الموجودة بس: Requirement ← TestCase، و TestCase ← نتيجة manual ← دليل ← bug، و TestCase ← automated test ← run ← نتيجة ← دليل، وفشل ← healing ← verification run. أي علاقة مش متأكدين منها بتتكتب unavailable.',
  withheld: 'أدلة اتعلّمت إنها فيها secret (زي قيمة credential لقاها secret scan). بتتعرض بالمسار بس من غير لينك، مع السبب، لحد ما تتعملها redaction.',
  context: 'تقارير تانية موجودة في reports/ (زي framework comparison). دي context بس: مشتقة من المصادر ومش مرجع لأي نتيجة في التقرير ده.',
  evidence: 'لينكات الأدلة نسبية لملفات التاسك نفسها (screenshots وlogs وreports). الدليل بيتلينك ومبيتنسخش جوه التقرير، والدليل الممنوع (withheld) مبيتلينكش.',
  data: 'كل الأرقام في الصفحة متولدة من data object واحد متخزن جوه الصفحة نفسها (script id="qa-final-report-data")، فالجداول والرسومات والكروت مستحيل يختلفوا عن بعض.',
};

// Wrap each Latin run (letters, digits and the punctuation that joins them) in LRI … PDI.
const iso = s => s.replace(/[A-Za-z0-9_][A-Za-z0-9_ .,:;=+\-/#%()&<>"']*[A-Za-z0-9_)%"]|[A-Za-z0-9]/g, m => `⁦${m}⁩`);
module.exports = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, iso(v)]));
