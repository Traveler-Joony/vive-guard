import * as vscode from 'vscode';

type Locale = 'en' | 'ko' | 'ja' | 'zh-cn' | 'zh-tw' | 'de' | 'fr' | 'es' | 'pt' | 'ru';

const SUPPORTED_LOCALES: Locale[] = ['en', 'ko', 'ja', 'zh-cn', 'zh-tw', 'de', 'fr', 'es', 'pt', 'ru'];

let currentLocale: Locale = 'en';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Dashboard
    'dashboard.complexity': 'Complexity',
    'dashboard.duplication': 'Duplication',
    'dashboard.patterns': 'Patterns',
    'dashboard.dependencies': 'Dependencies',
    'dashboard.warnings': 'Warnings',
    'dashboard.highComplexity': 'High Complexity',
    'dashboard.projectFiles': 'Project Files',
    'dashboard.refreshAnalysis': 'Refresh Analysis',
    'dashboard.copyAiPrompt': 'Copy AI Prompt',
    'dashboard.copied': 'Copied!',
    'dashboard.noHighComplexity': 'No high-complexity functions found.',
    'dashboard.noFilesAnalyzed': 'No files analyzed yet.',
    'dashboard.notEnoughData': 'Not enough data for trend chart',
    'dashboard.language': 'Language',
    'dashboard.noFunctions': 'No functions',
    'dashboard.noWarnings': 'No warnings — looking good!',
    'dashboard.max': 'max',
    'dashboard.blocks': 'blocks',
    'dashboard.rules': 'rules',
    'dashboard.cycles': 'cycles',
    'dashboard.score': 'Score',
    // Warnings
    'warning.highComplexity': '"{name}" has high complexity and may be hard to maintain.',
    'warning.duplicated': 'About {rate}% of the code appears to be duplicated. Consider reusing shared logic.',
    'warning.inconsistentPatterns': 'Coding styles are inconsistent across files. Aligning on a single style improves readability.',
    'warning.circular': 'Some files depend on each other in a circular way, which can cause unexpected issues.',
    // Notifications
    'notification.complexityIncreased': 'VibeGuard: Your project complexity increased significantly. Consider committing your current working state before making more changes.',
    'notification.gotIt': 'Got it',
    'notification.healthDropped': 'VibeGuard: Code health dropped to grade {grade} ({score}/100).',
    'notification.showDashboard': 'Show Dashboard',
    'notification.dismiss': 'Dismiss',
    // CodeLens
    'codelens.complexity': 'Complexity: {value} {icon}',
    // Diagnostics
    'diagnostics.complexity': "Function '{name}' has complexity {value} (threshold: {threshold})",
    'diagnostics.highComplexity': "Function '{name}' has high complexity {value} (threshold: {threshold})",
  },
  ko: {
    'dashboard.complexity': '복잡도',
    'dashboard.duplication': '중복률',
    'dashboard.patterns': '패턴',
    'dashboard.dependencies': '의존도',
    'dashboard.warnings': '경고',
    'dashboard.highComplexity': '높은 복잡도',
    'dashboard.projectFiles': '프로젝트 파일',
    'dashboard.refreshAnalysis': '분석 새로고침',
    'dashboard.copyAiPrompt': 'AI 프롬프트 복사',
    'dashboard.copied': '복사됨!',
    'dashboard.noHighComplexity': '높은 복잡도 함수가 없습니다.',
    'dashboard.noFilesAnalyzed': '아직 분석된 파일이 없습니다.',
    'dashboard.notEnoughData': '추세 차트 데이터 부족',
    'dashboard.language': '언어',
    'dashboard.noFunctions': '함수 없음',
    'dashboard.noWarnings': '경고 없음 — 좋습니다!',
    'dashboard.max': '최대',
    'dashboard.blocks': '블록',
    'dashboard.rules': '규칙',
    'dashboard.cycles': '순환',
    'dashboard.score': '점수',
    'warning.highComplexity': '"{name}"의 복잡도가 높습니다 ({value}).',
    'warning.duplicated': '코드의 약 {rate}%가 중복된 것으로 보입니다. 공유 로직 재사용을 고려하세요.',
    'warning.inconsistentPatterns': '파일 간 코딩 스타일이 일관되지 않습니다. 하나의 스타일로 통일하면 가독성이 향상됩니다.',
    'warning.circular': '일부 파일이 순환적으로 서로 의존하고 있어 예기치 않은 문제가 발생할 수 있습니다.',
    'notification.complexityIncreased': 'VibeGuard: 프로젝트 복잡도가 크게 증가했습니다. 추가 변경 전에 현재 상태를 커밋하는 것을 고려하세요.',
    'notification.gotIt': '확인',
    'notification.healthDropped': 'VibeGuard: 코드 건강도가 등급 {grade} ({score}/100)로 하락했습니다.',
    'notification.showDashboard': '대시보드 보기',
    'notification.dismiss': '닫기',
    'codelens.complexity': '복잡도: {value} {icon}',
    'diagnostics.complexity': "함수 '{name}'의 복잡도 {value} (임계값: {threshold})",
    'diagnostics.highComplexity': "함수 '{name}'의 높은 복잡도 {value} (임계값: {threshold})",
  },
  ja: {
    'dashboard.complexity': '複雑度',
    'dashboard.duplication': '重複率',
    'dashboard.patterns': 'パターン',
    'dashboard.dependencies': '依存関係',
    'dashboard.warnings': '警告',
    'dashboard.highComplexity': '高複雑度',
    'dashboard.projectFiles': 'プロジェクトファイル',
    'dashboard.refreshAnalysis': '分析を更新',
    'dashboard.copyAiPrompt': 'AIプロンプトをコピー',
    'dashboard.copied': 'コピー完了!',
    'dashboard.noHighComplexity': '高複雑度の関数は見つかりませんでした。',
    'dashboard.noFilesAnalyzed': 'まだファイルが分析されていません。',
    'dashboard.notEnoughData': 'トレンドチャートのデータ不足',
    'dashboard.language': '言語',
    'dashboard.noFunctions': '関数なし',
    'dashboard.noWarnings': '警告なし — 良好です！',
    'dashboard.max': '最大',
    'dashboard.blocks': 'ブロック',
    'dashboard.rules': 'ルール',
    'dashboard.cycles': '循環',
    'dashboard.score': 'スコア',
    'warning.highComplexity': '"{name}"は複雑度が高く、保守が困難になる可能性があります。',
    'warning.duplicated': 'コードの約{rate}%が重複しているようです。共有ロジックの再利用を検討してください。',
    'warning.inconsistentPatterns': 'ファイル間でコーディングスタイルが一貫していません。統一すると可読性が向上します。',
    'warning.circular': '一部のファイルが循環的に依存しており、予期しない問題が発生する可能性があります。',
    'notification.complexityIncreased': 'VibeGuard: プロジェクトの複雑度が大幅に増加しました。変更を続ける前に現在の状態をコミットすることを検討してください。',
    'notification.gotIt': '了解',
    'notification.healthDropped': 'VibeGuard: コード健全性がグレード{grade} ({score}/100)に低下しました。',
    'notification.showDashboard': 'ダッシュボードを表示',
    'notification.dismiss': '閉じる',
    'codelens.complexity': '複雑度: {value} {icon}',
    'diagnostics.complexity': "関数'{name}'の複雑度 {value} (閾値: {threshold})",
    'diagnostics.highComplexity': "関数'{name}'の高い複雑度 {value} (閾値: {threshold})",
  },
  'zh-cn': {
    'dashboard.complexity': '复杂度',
    'dashboard.duplication': '重复率',
    'dashboard.patterns': '模式',
    'dashboard.dependencies': '依赖',
    'dashboard.warnings': '警告',
    'dashboard.highComplexity': '高复杂度',
    'dashboard.projectFiles': '项目文件',
    'dashboard.refreshAnalysis': '刷新分析',
    'dashboard.copyAiPrompt': '复制AI提示',
    'dashboard.copied': '已复制!',
    'dashboard.noHighComplexity': '未发现高复杂度函数。',
    'dashboard.noFilesAnalyzed': '尚未分析任何文件。',
    'dashboard.notEnoughData': '趋势图数据不足',
    'dashboard.language': '语言',
    'dashboard.noFunctions': '无函数',
    'dashboard.noWarnings': '无警告 — 状态良好！',
    'dashboard.max': '最大',
    'dashboard.blocks': '个块',
    'dashboard.rules': '条规则',
    'dashboard.cycles': '个循环',
    'dashboard.score': '分数',
    'warning.highComplexity': '"{name}"复杂度较高，可能难以维护。',
    'warning.duplicated': '约{rate}%的代码存在重复。请考虑复用共享逻辑。',
    'warning.inconsistentPatterns': '文件间编码风格不一致。统一风格可提高可读性。',
    'warning.circular': '部分文件存在循环依赖，可能导致意外问题。',
    'notification.complexityIncreased': 'VibeGuard: 项目复杂度显著增加。建议在继续更改前提交当前工作状态。',
    'notification.gotIt': '知道了',
    'notification.healthDropped': 'VibeGuard: 代码健康度降至等级 {grade} ({score}/100)。',
    'notification.showDashboard': '显示仪表板',
    'notification.dismiss': '关闭',
    'codelens.complexity': '复杂度: {value} {icon}',
    'diagnostics.complexity': "函数'{name}'的复杂度为 {value} (阈值: {threshold})",
    'diagnostics.highComplexity': "函数'{name}'的高复杂度为 {value} (阈值: {threshold})",
  },
  'zh-tw': {
    'dashboard.complexity': '複雜度',
    'dashboard.duplication': '重複率',
    'dashboard.patterns': '模式',
    'dashboard.dependencies': '依賴',
    'dashboard.warnings': '警告',
    'dashboard.highComplexity': '高複雜度',
    'dashboard.projectFiles': '專案檔案',
    'dashboard.refreshAnalysis': '重新分析',
    'dashboard.copyAiPrompt': '複製AI提示',
    'dashboard.copied': '已複製!',
    'dashboard.noHighComplexity': '未發現高複雜度函數。',
    'dashboard.noFilesAnalyzed': '尚未分析任何檔案。',
    'dashboard.notEnoughData': '趨勢圖資料不足',
    'dashboard.language': '語言',
    'dashboard.noFunctions': '無函數',
    'dashboard.noWarnings': '無警告 — 狀態良好！',
    'dashboard.max': '最大',
    'dashboard.blocks': '個區塊',
    'dashboard.rules': '條規則',
    'dashboard.cycles': '個循環',
    'dashboard.score': '分數',
    'warning.highComplexity': '"{name}"複雜度較高，可能難以維護。',
    'warning.duplicated': '約{rate}%的程式碼存在重複。請考慮複用共用邏輯。',
    'warning.inconsistentPatterns': '檔案間編碼風格不一致。統一風格可提高可讀性。',
    'warning.circular': '部分檔案存在循環依賴，可能導致意外問題。',
    'notification.complexityIncreased': 'VibeGuard: 專案複雜度顯著增加。建議在繼續更改前提交當前工作狀態。',
    'notification.gotIt': '知道了',
    'notification.healthDropped': 'VibeGuard: 程式碼健康度降至等級 {grade} ({score}/100)。',
    'notification.showDashboard': '顯示儀表板',
    'notification.dismiss': '關閉',
    'codelens.complexity': '複雜度: {value} {icon}',
    'diagnostics.complexity': "函數'{name}'的複雜度為 {value} (閾值: {threshold})",
    'diagnostics.highComplexity': "函數'{name}'的高複雜度為 {value} (閾值: {threshold})",
  },
  de: {
    'dashboard.complexity': 'Komplexität',
    'dashboard.duplication': 'Duplizierung',
    'dashboard.patterns': 'Muster',
    'dashboard.dependencies': 'Abhängigkeiten',
    'dashboard.warnings': 'Warnungen',
    'dashboard.highComplexity': 'Hohe Komplexität',
    'dashboard.projectFiles': 'Projektdateien',
    'dashboard.refreshAnalysis': 'Analyse aktualisieren',
    'dashboard.copyAiPrompt': 'KI-Prompt kopieren',
    'dashboard.copied': 'Kopiert!',
    'dashboard.noHighComplexity': 'Keine Funktionen mit hoher Komplexität gefunden.',
    'dashboard.noFilesAnalyzed': 'Noch keine Dateien analysiert.',
    'dashboard.notEnoughData': 'Nicht genügend Daten für Trenddiagramm',
    'dashboard.language': 'Sprache',
    'dashboard.noFunctions': 'Keine Funktionen',
    'dashboard.noWarnings': 'Keine Warnungen — sieht gut aus!',
    'dashboard.max': 'max',
    'dashboard.blocks': 'Blöcke',
    'dashboard.rules': 'Regeln',
    'dashboard.cycles': 'Zyklen',
    'dashboard.score': 'Punktzahl',
    'warning.highComplexity': '"{name}" hat eine hohe Komplexität und kann schwer wartbar sein.',
    'warning.duplicated': 'Etwa {rate}% des Codes scheint dupliziert zu sein. Erwägen Sie die Wiederverwendung gemeinsamer Logik.',
    'warning.inconsistentPatterns': 'Codierungsstile sind dateiübergreifend inkonsistent. Eine Vereinheitlichung verbessert die Lesbarkeit.',
    'warning.circular': 'Einige Dateien hängen zirkulär voneinander ab, was zu unerwarteten Problemen führen kann.',
    'notification.complexityIncreased': 'VibeGuard: Die Projektkomplexität hat deutlich zugenommen. Erwägen Sie, den aktuellen Stand zu committen.',
    'notification.gotIt': 'Verstanden',
    'notification.healthDropped': 'VibeGuard: Codegesundheit auf Grad {grade} ({score}/100) gesunken.',
    'notification.showDashboard': 'Dashboard anzeigen',
    'notification.dismiss': 'Schließen',
    'codelens.complexity': 'Komplexität: {value} {icon}',
    'diagnostics.complexity': "Funktion '{name}' hat Komplexität {value} (Schwellenwert: {threshold})",
    'diagnostics.highComplexity': "Funktion '{name}' hat hohe Komplexität {value} (Schwellenwert: {threshold})",
  },
  fr: {
    'dashboard.complexity': 'Complexité',
    'dashboard.duplication': 'Duplication',
    'dashboard.patterns': 'Modèles',
    'dashboard.dependencies': 'Dépendances',
    'dashboard.warnings': 'Avertissements',
    'dashboard.highComplexity': 'Haute complexité',
    'dashboard.projectFiles': 'Fichiers du projet',
    'dashboard.refreshAnalysis': "Rafraîchir l'analyse",
    'dashboard.copyAiPrompt': 'Copier le prompt IA',
    'dashboard.copied': 'Copié!',
    'dashboard.noHighComplexity': 'Aucune fonction à haute complexité trouvée.',
    'dashboard.noFilesAnalyzed': 'Aucun fichier analysé.',
    'dashboard.notEnoughData': 'Données insuffisantes pour le graphique',
    'dashboard.language': 'Langue',
    'dashboard.noFunctions': 'Aucune fonction',
    'dashboard.noWarnings': 'Aucun avertissement — tout va bien !',
    'dashboard.max': 'max',
    'dashboard.blocks': 'blocs',
    'dashboard.rules': 'règles',
    'dashboard.cycles': 'cycles',
    'dashboard.score': 'Score',
    'warning.highComplexity': '"{name}" a une complexité élevée et peut être difficile à maintenir.',
    'warning.duplicated': "Environ {rate}% du code semble dupliqué. Envisagez de réutiliser la logique partagée.",
    'warning.inconsistentPatterns': "Les styles de codage sont incohérents entre les fichiers. L'alignement améliore la lisibilité.",
    'warning.circular': 'Certains fichiers dépendent les uns des autres de manière circulaire, ce qui peut causer des problèmes.',
    'notification.complexityIncreased': 'VibeGuard: La complexité du projet a considérablement augmenté. Envisagez de committer votre état actuel.',
    'notification.gotIt': 'Compris',
    'notification.healthDropped': 'VibeGuard: La santé du code a chuté au grade {grade} ({score}/100).',
    'notification.showDashboard': 'Afficher le tableau de bord',
    'notification.dismiss': 'Fermer',
    'codelens.complexity': 'Complexité: {value} {icon}',
    'diagnostics.complexity': "La fonction '{name}' a une complexité de {value} (seuil: {threshold})",
    'diagnostics.highComplexity': "La fonction '{name}' a une complexité élevée de {value} (seuil: {threshold})",
  },
  es: {
    'dashboard.complexity': 'Complejidad',
    'dashboard.duplication': 'Duplicación',
    'dashboard.patterns': 'Patrones',
    'dashboard.dependencies': 'Dependencias',
    'dashboard.warnings': 'Advertencias',
    'dashboard.highComplexity': 'Alta complejidad',
    'dashboard.projectFiles': 'Archivos del proyecto',
    'dashboard.refreshAnalysis': 'Actualizar análisis',
    'dashboard.copyAiPrompt': 'Copiar prompt IA',
    'dashboard.copied': '¡Copiado!',
    'dashboard.noHighComplexity': 'No se encontraron funciones de alta complejidad.',
    'dashboard.noFilesAnalyzed': 'Aún no se han analizado archivos.',
    'dashboard.notEnoughData': 'Datos insuficientes para el gráfico',
    'dashboard.language': 'Idioma',
    'dashboard.noFunctions': 'Sin funciones',
    'dashboard.noWarnings': 'Sin advertencias — ¡todo bien!',
    'dashboard.max': 'máx',
    'dashboard.blocks': 'bloques',
    'dashboard.rules': 'reglas',
    'dashboard.cycles': 'ciclos',
    'dashboard.score': 'Puntuación',
    'warning.highComplexity': '"{name}" tiene alta complejidad y puede ser difícil de mantener.',
    'warning.duplicated': 'Aproximadamente el {rate}% del código parece estar duplicado. Considere reutilizar lógica compartida.',
    'warning.inconsistentPatterns': 'Los estilos de codificación son inconsistentes entre archivos. Unificarlos mejora la legibilidad.',
    'warning.circular': 'Algunos archivos dependen entre sí de forma circular, lo que puede causar problemas inesperados.',
    'notification.complexityIncreased': 'VibeGuard: La complejidad del proyecto aumentó significativamente. Considere hacer commit de su estado actual.',
    'notification.gotIt': 'Entendido',
    'notification.healthDropped': 'VibeGuard: La salud del código bajó al grado {grade} ({score}/100).',
    'notification.showDashboard': 'Mostrar panel',
    'notification.dismiss': 'Cerrar',
    'codelens.complexity': 'Complejidad: {value} {icon}',
    'diagnostics.complexity': "La función '{name}' tiene complejidad {value} (umbral: {threshold})",
    'diagnostics.highComplexity': "La función '{name}' tiene alta complejidad {value} (umbral: {threshold})",
  },
  pt: {
    'dashboard.complexity': 'Complexidade',
    'dashboard.duplication': 'Duplicação',
    'dashboard.patterns': 'Padrões',
    'dashboard.dependencies': 'Dependências',
    'dashboard.warnings': 'Avisos',
    'dashboard.highComplexity': 'Alta complexidade',
    'dashboard.projectFiles': 'Arquivos do projeto',
    'dashboard.refreshAnalysis': 'Atualizar análise',
    'dashboard.copyAiPrompt': 'Copiar prompt IA',
    'dashboard.copied': 'Copiado!',
    'dashboard.noHighComplexity': 'Nenhuma função de alta complexidade encontrada.',
    'dashboard.noFilesAnalyzed': 'Nenhum arquivo analisado ainda.',
    'dashboard.notEnoughData': 'Dados insuficientes para o gráfico',
    'dashboard.language': 'Idioma',
    'dashboard.noFunctions': 'Sem funções',
    'dashboard.noWarnings': 'Sem avisos — tudo certo!',
    'dashboard.max': 'máx',
    'dashboard.blocks': 'blocos',
    'dashboard.rules': 'regras',
    'dashboard.cycles': 'ciclos',
    'dashboard.score': 'Pontuação',
    'warning.highComplexity': '"{name}" tem alta complexidade e pode ser difícil de manter.',
    'warning.duplicated': 'Cerca de {rate}% do código parece estar duplicado. Considere reutilizar lógica compartilhada.',
    'warning.inconsistentPatterns': 'Estilos de codificação inconsistentes entre arquivos. Unificá-los melhora a legibilidade.',
    'warning.circular': 'Alguns arquivos dependem uns dos outros de forma circular, o que pode causar problemas inesperados.',
    'notification.complexityIncreased': 'VibeGuard: A complexidade do projeto aumentou significativamente. Considere fazer commit do estado atual.',
    'notification.gotIt': 'Entendi',
    'notification.healthDropped': 'VibeGuard: A saúde do código caiu para grau {grade} ({score}/100).',
    'notification.showDashboard': 'Mostrar painel',
    'notification.dismiss': 'Fechar',
    'codelens.complexity': 'Complexidade: {value} {icon}',
    'diagnostics.complexity': "A função '{name}' tem complexidade {value} (limite: {threshold})",
    'diagnostics.highComplexity': "A função '{name}' tem alta complexidade {value} (limite: {threshold})",
  },
  ru: {
    'dashboard.complexity': 'Сложность',
    'dashboard.duplication': 'Дублирование',
    'dashboard.patterns': 'Шаблоны',
    'dashboard.dependencies': 'Зависимости',
    'dashboard.warnings': 'Предупреждения',
    'dashboard.highComplexity': 'Высокая сложность',
    'dashboard.projectFiles': 'Файлы проекта',
    'dashboard.refreshAnalysis': 'Обновить анализ',
    'dashboard.copyAiPrompt': 'Копировать ИИ-промпт',
    'dashboard.copied': 'Скопировано!',
    'dashboard.noHighComplexity': 'Функции с высокой сложностью не найдены.',
    'dashboard.noFilesAnalyzed': 'Файлы еще не проанализированы.',
    'dashboard.notEnoughData': 'Недостаточно данных для графика',
    'dashboard.language': 'Язык',
    'dashboard.noFunctions': 'Нет функций',
    'dashboard.noWarnings': 'Нет предупреждений — всё хорошо!',
    'dashboard.max': 'макс',
    'dashboard.blocks': 'блоков',
    'dashboard.rules': 'правил',
    'dashboard.cycles': 'циклов',
    'dashboard.score': 'Оценка',
    'warning.highComplexity': '"{name}" имеет высокую сложность и может быть трудным в поддержке.',
    'warning.duplicated': 'Около {rate}% кода дублируется. Рассмотрите повторное использование общей логики.',
    'warning.inconsistentPatterns': 'Стили кодирования несогласованны между файлами. Унификация улучшает читаемость.',
    'warning.circular': 'Некоторые файлы зависят друг от друга циклически, что может вызвать непредвиденные проблемы.',
    'notification.complexityIncreased': 'VibeGuard: Сложность проекта значительно возросла. Рекомендуем зафиксировать текущее состояние.',
    'notification.gotIt': 'Понятно',
    'notification.healthDropped': 'VibeGuard: Здоровье кода упало до уровня {grade} ({score}/100).',
    'notification.showDashboard': 'Показать панель',
    'notification.dismiss': 'Закрыть',
    'codelens.complexity': 'Сложность: {value} {icon}',
    'diagnostics.complexity': "Функция '{name}' имеет сложность {value} (порог: {threshold})",
    'diagnostics.highComplexity': "Функция '{name}' имеет высокую сложность {value} (порог: {threshold})",
  },
};

function resolveLocale(lang: string): Locale {
  const lower = lang.toLowerCase() as Locale;
  if (SUPPORTED_LOCALES.includes(lower)) {
    return lower;
  }
  const prefix = lower.split('-')[0] as Locale;
  if (SUPPORTED_LOCALES.includes(prefix)) {
    return prefix;
  }
  return 'en';
}

export function initLanguage(workspaceState: vscode.Memento): void {
  const stored = workspaceState.get<string>('vibeGuard.language', 'auto');
  if (stored && stored !== 'auto') {
    currentLocale = resolveLocale(stored);
  } else {
    currentLocale = resolveLocale(vscode.env.language);
  }
}

export function t(key: string, vars?: Record<string, string>): string {
  let text = translations[currentLocale]?.[key] ?? translations.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return text;
}

export function setLanguage(lang: string, workspaceState: vscode.Memento): void {
  if (lang === 'auto') {
    currentLocale = resolveLocale(vscode.env.language);
  } else {
    currentLocale = resolveLocale(lang);
  }
  workspaceState.update('vibeGuard.language', lang);
}

export function getLanguage(): string {
  return currentLocale;
}

export function getStoredLanguagePref(workspaceState: vscode.Memento): string {
  return workspaceState.get<string>('vibeGuard.language', 'auto') ?? 'auto';
}

export function getTranslationsForWebview(): Record<string, string> {
  const result: Record<string, string> = {};
  const locale = translations[currentLocale] ?? translations.en;
  const en = translations.en;
  for (const key of Object.keys(en)) {
    if (key.startsWith('dashboard.')) {
      result[key] = locale[key] ?? en[key];
    }
  }
  return result;
}
