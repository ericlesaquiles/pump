// Brazilian Portuguese text. Same shape as en.ts.
import type { DayKey, Equipment, Joint, Movement, Msg, Muscle, Pattern, PriorityGroup, Why } from "../lib/types.ts";
import { PATTERNS } from "../lib/constants.ts";
import type { CueKind } from "../lib/progression.ts";
import type { EquipmentNeed, QuickFilter, SwapReason } from "../lib/swap.ts";
import type { Dict } from "./en.ts";
import { exNamePt } from "./exercises.ts";

const lc = (s: string) => s.toLowerCase();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const and = (items: string[]) => new Intl.ListFormat("pt-BR", { type: "conjunction" }).format(items);
const or = (items: string[]) => new Intl.ListFormat("pt-BR", { type: "disjunction" }).format(items);
const num = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const letter = (i: number) => String.fromCharCode(65 + i);
const plural = (n: number, one: string, many: string) => `${num(n)} ${n === 1 ? one : many}`;

const muscles: Record<Muscle, string> = {
  chest: "Peito",
  front_delt: "Deltoide anterior",
  side_delt: "Deltoide lateral",
  rear_delt: "Deltoide posterior",
  lats: "Dorsais",
  upper_back: "Costas (parte alta)",
  biceps: "Bíceps",
  triceps: "Tríceps",
  quads: "Quadríceps",
  hamstrings: "Posteriores de coxa",
  glutes: "Glúteos",
  calves: "Panturrilhas",
  abs: "Abdômen",
};

const joints: Record<Joint, string> = {
  shoulder: "Ombro",
  elbow: "Cotovelo",
  wrist: "Punho",
  lower_back: "Lombar",
  hip: "Quadril",
  knee: "Joelho",
  ankle: "Tornozelo",
};
/** Only "lombar" is feminine. */
const fem = (j: Joint) => j === "lower_back";
const your = (j: Joint) => `${fem(j) ? "sua" : "seu"} ${lc(joints[j])}`;
const the = (j: Joint) => `${fem(j) ? "a" : "o"} ${lc(joints[j])}`;
const injured = (j: Joint) => (fem(j) ? "lesionada" : "lesionado");

const movements: Record<Movement, string> = {
  overhead: "Empurrar acima da cabeça",
  deep_knee: "Flexão profunda do joelho",
  spinal_load: "Carga pesada na coluna",
  heavy_grip: "Pegada forte / ficar pendurado",
};

const patterns: Record<Pattern, string> = {
  horizontal_push: "Supino",
  incline_push: "Supino inclinado",
  vertical_push: "Desenvolvimento",
  chest_fly: "Crucifixo",
  triceps_ext: "Tríceps",
  horizontal_pull: "Remada",
  vertical_pull: "Puxada / barra fixa",
  rear_delt: "Deltoide posterior",
  lateral_raise: "Elevação lateral",
  biceps_curl: "Bíceps",
  squat: "Agachamento",
  lunge: "Unilateral (afundo)",
  hinge: "Dobradiça de quadril (terra, stiff)",
  hip_thrust: "Elevação pélvica",
  knee_ext: "Extensora",
  knee_flex: "Flexora",
  calf_raise: "Panturrilha",
  core: "Core",
};

const days: Record<DayKey, { name: string; focus: string }> = {
  full_a: { name: "Corpo inteiro", focus: "Agachamento, supino, puxada" },
  full_b: { name: "Corpo inteiro", focus: "Terra/stiff, supino inclinado, remada" },
  full_c: { name: "Corpo inteiro", focus: "Pernas, desenvolvimento, remada" },
  upper: { name: "Superior", focus: "Peito, costas, ombros, braços" },
  lower: { name: "Inferior", focus: "Quadríceps, posteriores, glúteos, panturrilhas" },
  push: { name: "Empurrar", focus: "Peito, ombros, tríceps" },
  pull: { name: "Puxar", focus: "Costas, deltoide posterior, bíceps" },
  legs: { name: "Pernas", focus: "Quadríceps, posteriores, glúteos, panturrilhas" },
};
const workoutFull = (i: number, key: DayKey) => `Treino ${letter(i)} · ${days[key].name}`;
const workoutParen = (i: number, key: DayKey) => `Treino ${letter(i)} (${days[key].name})`;

const EQUIP_WORDS: Record<Equipment, string> = {
  barbell: "barra", dumbbell: "halteres", cable: "polia", machine: "máquina", bands: "elásticos",
  kettlebell: "kettlebell", pullup_bar: "barra fixa", dip_bars: "paralelas", bench: "banco", rack: "rack",
};

const why = (w: Why): string => {
  switch (w.k) {
    case "dislike": return "está na sua lista de exercícios a evitar";
    case "injured": return `sobrecarrega ${your(w.joint)} ${injured(w.joint)}`;
    case "avoid": return `sobrecarrega ${your(w.joint)}`;
    case "move": return `envolve ${lc(movements[w.move])}`;
    case "skill": return "exige mais experiência";
    case "equipment": return "precisa de equipamento que você não tem";
  }
};

export const pt: Dict = {
  locale: "pt-BR",
  langName: "Português (Brasil)",

  // ---------- vocabulary ----------
  muscles,
  joints,
  severity: { none: "Sem problema", mild: "Desconforto leve", avoid: "Evitar carga", injured: "Lesionado / em tratamento" },
  movements,
  goals: { muscle: "Ganhar massa muscular", strength: "Ficar mais forte", fat_loss: "Perder gordura", general: "Condicionamento geral" },
  experience: {
    beginner: "Iniciante (menos de ~6 meses)",
    intermediate: "Intermediário (6 meses a 2+ anos)",
    advanced: "Avançado (vários anos)",
  },
  equipment: {
    barbell: "Barra (e anilhas)",
    rack: "Rack de agachamento",
    bench: "Banco",
    dumbbell: "Halteres",
    kettlebell: "Kettlebells",
    cable: "Polia (cabo)",
    machine: "Máquinas (leg press, supino máquina, flexora…)",
    pullup_bar: "Barra fixa",
    dip_bars: "Paralelas",
    bands: "Elásticos",
  },
  priorities: {
    chest: "Peito", back: "Costas", shoulders: "Ombros", arms: "Braços", quads: "Quadríceps",
    hamstrings: "Posteriores de coxa", glutes: "Glúteos", calves: "Panturrilhas", abs: "Abdômen",
  } satisfies Record<PriorityGroup, string>,
  patterns,
  days,
  splits: { 2: "Corpo inteiro", 3: "Corpo inteiro", 4: "Superior / Inferior", 5: "Superior / Inferior / Empurrar / Puxar / Pernas", 6: "Empurrar / Puxar / Pernas ×2" },
  skill: { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" },
  exType: { compound: "multiarticular", isolation: "isolado" },
  stress: { 1: "baixa", 2: "média", 3: "alta" },
  workoutFull,
  rir: { compound: "pare 1–2 repetições antes da falha", iso: "pare 1–2 repetições antes da falha; a última série pode ir até a falha" },

  // ---------- messages stored in plans ----------
  msg: (m: Msg): string => {
    switch (m.k) {
      case "reason.fallback": return `Nenhum exercício de ${lc(patterns[m.want])} se encaixa no seu equipamento ou limitações, então este usa ${lc(patterns[m.got])} no lugar.`;
      case "reason.slot": return `Exercício de ${lc(patterns[m.pattern])} para ${lc(muscles[PATTERNS[m.pattern].main])}${m.staple ? "; um clássico bem comprovado" : ""}.`;
      case "reason.insteadOf": return `Em vez de ${exNamePt(m.ex)}: ${why(m.why)}.`;
      case "reason.lighter": return `Carga mais leve e 3 repetições a mais por série para poupar ${and(m.joints.map(the))}.`;
      case "reason.swapped": return `Escolhido por você (substituiu ${exNamePt(m.ex)}).`;
      case "reason.replacedSkipped": return `Substitui ${exNamePt(m.ex)}, que você decidiu evitar.`;
      case "notice.injured": return `${cap(your(m.joint))} está marcad${fem(m.joint) ? "a" : "o"} como ${injured(m.joint)}, então todo exercício que sobrecarrega essa região fica de fora. Mostre este plano a um fisioterapeuta ou médico antes de voltar a treiná-la.`;
      case "notice.slotMissing": return `${workoutParen(m.day, m.key)}: nenhum exercício de ${lc(patterns[m.pattern])} se encaixa no seu equipamento e limitações, então essa parte fica de fora.`;
      case "notice.dayEmpty": return m.days.length > 1
        ? `Os treinos ${and(m.days.map(letter))} (${days[m.key].name}) não têm exercícios que se encaixem no seu equipamento e limitações. Uma barra fixa, elásticos ou halteres resolveriam isso.`
        : `O ${workoutParen(m.days[0] ?? 0, m.key).replace("Treino", "treino")} não tem exercícios que se encaixem no seu equipamento e limitações. Uma barra fixa, elásticos ou halteres resolveriam isso.`;
      case "warn.volume": return `${muscles[m.muscle]}: ${num(m.sets)} séries por semana, abaixo do mínimo de ${m.floor}.`;
      case "warn.pushPull": return `Empurrar (${m.push} séries) supera puxar (${m.pull} séries). Procure fazer pelo menos o mesmo volume de puxadas.`;
      case "warn.hamQuad": return `Posteriores de coxa (${num(m.h)} séries) recebem menos da metade do trabalho dos quadríceps (${num(m.q)} séries).`;
      case "warn.time": return `${workoutParen(m.day, m.key)} leva cerca de ${m.minutes} min, mais que os seus ${m.limit} min.`;
      case "warn.full": return "Todas as sessões já estão cheias, por isso vários músculos ficam abaixo do mínimo. Sessões mais longas ou um treino a mais por semana resolveriam.";
    }
  },
  ex: exNamePt,

  // ---------- layout ----------
  nav: { plan: "Plano", log: "Treino", history: "Histórico", settings: "Ajustes", home: "Pump, início", main: "Principal", offline: "Offline" },
  close: "Fechar",
  cancel: "Cancelar",

  // ---------- questionnaire ----------
  setup: {
    eyebrowEdit: "Edite suas respostas",
    eyebrowNew: "Leva uns dois minutos",
    titleEdit: "Suas respostas",
    titleNew: "Monte seu plano",
    backToPlan: "Voltar ao plano",
    keepsWorkouts: "Salvar monta um plano novo. Seus treinos registrados são mantidos.",
    planReady: "Plano pronto",
    q1: "1. Treinos por semana",
    perWeek: (n: number) => `${n}×`,
    split: (name: string) => `Divisão: ${name}. Cada músculo é treinado cerca de duas vezes por semana.`,
    rotation: "Os treinos não ficam presos a dias da semana: você faz em ordem (A, B, C…) nos dias que preferir, e o app sugere o próximo.",
    q2: "2. Duração do treino",
    q3: "3. Objetivo principal",
    q4: "4. Experiência",
    q4hint: "Há quanto tempo você treina com regularidade, pelo menos duas vezes por semana?",
    q5: "5. Equipamento disponível",
    presets: { gym: "Academia completa", db: "Halteres e banco", none: "Só peso corporal" },
    q6: "6. Lesões ou limitações",
    q6hint: "O Pump só evita ou alivia exercícios. Ele não faz diagnóstico. Se uma articulação estiver lesionada agora, consulte um fisioterapeuta ou médico antes de treiná-la.",
    hurts: "Movimentos que doem:",
    q7: "7. Músculos prioritários",
    q7hint: "Até 3. Eles recebem cerca de 40% mais séries por semana; os outros, um pouco menos.",
    q8: "8. Exercícios a evitar (opcional)",
    q9: "9. Idade (opcional)",
    q9hint: "A partir de uns 50 anos, as séries semanais ficam um pouco menores para dar mais tempo de recuperação.",
    age: "Idade",
    submitEdit: "Salvar e montar o plano de novo",
    submitNew: "Montar meu plano",
    search: "Busque exercícios, ex.: agachamento",
    searchLabel: "Buscar exercícios a evitar",
    remove: (name: string) => `Remover ${name}`,
  },

  // ---------- plan ----------
  plan: {
    eyebrow: (split: string, days: number, minutes: number, goal: string) => `${split} · ${days}× por semana · ${minutes} min · ${goal}`,
    title: "Seu plano",
    editAnswers: "Editar respostas",
    rebuild: "Montar de novo",
    rebuilt: "Plano montado de novo",
    warningsTitle: "O que saber sobre este plano",
    weeklySets: "Séries por semana por músculo",
    weeklyNote: "Verde: séries salvas nesta semana (de segunda a domingo). Barra clara: séries do plano. Números: feito · planejado/meta. O músculo principal conta 1 série; os secundários, ½.",
    swappedIn: (name: string) => `Trocado por ${name}`,
    thisWeek: "Esta semana",
    weekCount: (done: number, goal: number) => `${done} de ${goal} treinos`,
    upNext: "Próximo",
    startWorkout: (l: string) => `Começar treino ${l}`,
    start: "Começar treino",
    next: "próximo",
    about: (focus: string, min: number) => `${focus} · cerca de ${min} min`,
    emptyDay: "Nenhum exercício se encaixa no seu equipamento e limitações para este treino.",
    showExercises: (n: number) => `Ver os ${n} exercícios`,
    hideExercises: "Esconder exercícios",
    rest: "descanso",
    lighter: "carga mais leve",
    swap: "Trocar",
    why: "Por que este exercício?",
    progressTitle: "Como progredir",
    progressTips: [
      "Quando todas as séries chegarem ao topo da faixa de repetições, aumente a carga na próxima vez: cerca de 2,5 kg / 5 lb para membros superiores e 5 kg / 10 lb para inferiores.",
      "Caso contrário, mantenha a carga e tente fazer mais repetições.",
      "A cada 6–8 semanas, ou depois de duas semanas sem progresso, faça uma semana mais leve com cerca de metade das séries.",
    ],
    chartLabel: "Séries por semana por músculo, comparadas com as metas",
    chartRow: (muscle: string, v: number, target: number, floor: number, done: number) => `${muscle}: ${num(done)} séries registradas esta semana; o plano tem ${num(v)} por semana, meta ${target}, mínimo ${floor}`,
    legend: { done: "feito esta semana", sets: "planejado", target: "meta", floor: "mínimo", priority: "prioridade" },
  },

  // ---------- AI review ----------
  review: {
    panel: "Revisão por IA (opcional)",
    suggestion: "Sugestão:",
    severity: { high: "alta", medium: "média", low: "baixa", info: "info" },
    done: "Feito",
    ignored: "Ignorado",
    undo: "Desfazer",
    markDone: "Marcar como feito",
    ignore: "Ignorar",
    meta: (date: string, model: string) => `Revisado em ${date} por ${model}. As sugestões não são aplicadas automaticamente; use Trocar para fazer mudanças.`,
    introAi: "Peça ao Claude para verificar o equilíbrio, o volume, as lesões e a escolha de exercícios deste plano. Antes, você vê exatamente o que será enviado.",
    introOff: "Você pode pedir a uma IA para revisar este plano. Ative nos Ajustes, ou copie um texto para colar em qualquer chatbot.",
    again: "Revisar de novo",
    get: "Pedir revisão por IA",
    turnOn: "Ativar nos Ajustes",
    copy: "Copiar texto da revisão",
    copied: "Texto da revisão copiado",
    offline: "Você está offline. A revisão precisa de internet.",
    ready: "Revisão pronta",
    promptTitle: "Texto da revisão",
    promptHint: "Copie este texto e cole em qualquer chatbot.",
    before: "Antes de enviar",
    title: "Revisão por IA",
    send: "Enviar para revisão",
    sending: "Revisando…",
    willSend: "O Pump vai enviar o texto abaixo para a API do Claude, da Anthropic, usando a sua chave. Nada além disso é enviado.",
    health: " Inclui suas respostas sobre lesões e dores.",
    wait: "Revisando… isso pode levar até um minuto.",
    errors: {
      offline: "Você está offline. Use “Copiar texto da revisão”, ou tente de novo quando estiver conectado.",
      sdk: "Não foi possível carregar o módulo de revisão. Reabra o app e tente de novo.",
      auth: "A chave da API foi recusada, ou não tem permissão para usar este modelo. Confira nos Ajustes.",
      rate: "Muitas solicitações agora. Espere um minuto e tente de novo.",
      request: "O pedido de revisão foi recusado.",
      network: "Não foi possível acessar a API do Claude. Verifique sua conexão.",
      api: "A API do Claude retornou um erro. Tente mais tarde.",
      unknown: "Algo deu errado ao pedir a revisão.",
      refusal: "O modelo se recusou a revisar este plano.",
      truncated: "A revisão veio cortada. Tente de novo.",
      parse: "A revisão veio num formato inesperado. Tente de novo.",
    },
    replyIn: "Write every text field of your reply in Brazilian Portuguese.",
  },

  // ---------- exercise dialogs ----------
  exercise: {
    main: "principal",
    none: "Nenhum",
    lowOverall: "Baixa no geral",
    muscles: "Músculos",
    equipment: "Equipamento",
    joints: "Exigência nas articulações",
    how: "Como fazer",
    topSet: "Sua melhor série ao longo do tempo",
    video: "Procurar um vídeo no YouTube",
    videoQuery: "execução",
    needsNet: "(precisa de internet)",
    credit: "Instruções do free-exercise-db (domínio público), traduzidas pelo Pump. Classificação dos exercícios pelo Pump.",
    gifAlt: (name: string) => `Animação: ${name}`,
    or: (items: string[]) => or(items),
    sparkSingle: (date: string, w: string, unit: string) => `${date}: ${w} ${unit}`,
    sparkLabel: (from: string, to: string, unit: string) => `Melhor série de ${from} para ${to} ${unit}`,
  },
  swap: {
    tiers: { 1: "Mesmo movimento", 2: "Mesmo músculo, outro movimento", 3: "Passa o trabalho para outros músculos" },
    filters: { all: "Todos", dumbbells: "Só halteres", no_bench: "Sem banco", machines: "Máquinas e polia" } satisfies Record<QuickFilter | "all", string>,
    filter: "Filtro",
    todayEyebrow: "Trocar só neste treino",
    planEyebrow: "Trocar exercício",
    useToday: "Usar hoje",
    swap: "Trocar",
    listLabel: "Exercício substituto",
    nothing: "Nada se encaixa aqui com esse filtro. Tente outro filtro.",
    weeklySets: "Séries por semana: ",
    same: "As séries semanais por músculo continuam iguais.",
    drop: (muscle: string, after: string, floor: number) => `${muscle} cairia para ${after} séries por semana, abaixo do mínimo de ${floor}.`,
    dropHint: "Você pode adicionar uma série em outro lugar ou escolher outra opção.",
    scope: "Alcance da troca",
    scopePlan: "No resto do plano",
    scopeNever: (name: string) => `Nunca mais sugerir ${name}`,
    todayNote: "Seu plano continua igual. O registro guarda o que você realmente fez.",
    reason: (r: SwapReason): string => {
      const equip = (e: EquipmentNeed) => e.kind === "none" ? "sem equipamento" : e.kind === "bench" ? "usa banco" : `usa ${or(e.items.map((x) => EQUIP_WORDS[x]))}`;
      const parts = [
        r.tier === 1 ? `Mesmo movimento, ${equip(r.equipment)}` : r.tier === 2 ? `Outro movimento (${lc(patterns[r.pattern])}), mesmo músculo principal` : `Trabalha ${lc(muscles[r.main])} de forma menos direta`,
      ];
      if (r.easier.length) parts.push(`mais leve para ${and(r.easier.map(the))}`);
      if (r.more) parts.push(`mais trabalho de ${lc(muscles[r.more])}`);
      return parts.join("; ");
    },
  },

  // ---------- workout ----------
  workout: {
    eyebrow: "Treino",
    pick: "Treino",
    date: "Data",
    option: (l: string, name: string, next: boolean) => `${l} · ${name}${next ? " (próximo)" : ""}`,
    empty: "Este treino não tem exercícios. Escolha outro.",
    notes: "Anotações",
    notesHint: "Sono, disposição, qualquer coisa fora do normal",
    save: "Salvar treino",
    update: "Atualizar treino",
    saved: "Salvo.",
    savedToast: "Treino salvo",
    draft: "As mudanças não salvas ficam guardadas neste aparelho como rascunho.",
    needReps: "Nada para salvar ainda: preencha as repetições de uma série ou toque em Feito num exercício.",
    insteadOf: (name: string) => `hoje no lugar de ${name}`,
    rest: (time: string) => `Descanso ${time}`,
    swap: "Trocar",
    last: (date: string, sets: string) => `Último (${date}): ${sets}`,
    noPrevious: "Nenhuma série anterior",
    addSet: "+ Adicionar série",
    details: "Detalhes",
    skip: "Pular",
    done: "Feito",
    doneLabel: "Feito",
    skippedLabel: "Pulado desta vez · toque para reabrir",
    reopen: (name: string) => `Reabrir ${name}`,
    prefilled: "Preenchido com os valores da última vez. Ajuste o que mudou e toque em Feito.",
    saveHint: "São salvos os exercícios marcados como Feito ou que você alterou; os pulados e os pré-preenchidos sem alteração, não.",
    cue: (kind: CueKind, c: { reps?: number; step?: number; unit?: string }): string => ({
      first: `Ainda sem histórico. Comece leve e encontre uma carga que você levante ${c.reps} vezes com 2 repetições de sobra.`,
      add: `Aumente ${num(c.step ?? 0)} ${c.unit}`,
      hold: "Mesma carga, tente mais repetições",
      stall: "Parado há 2+ semanas: considere uma semana mais leve ou trocar este exercício",
    })[kind],
    reps: "reps",
    hurt: "Doeu",
    setWeight: (name: string, n: number) => `${name}, carga da série ${n}`,
    setReps: (name: string, n: number) => `${name}, repetições da série ${n}`,
    hurtTitle: (names: string[]) => `Você marcou dor em: ${and(names)}.`,
    hurtText: "Se continuar doendo, troque o exercício ou adicione uma limitação para o plano evitá-lo. Procure um fisioterapeuta ou médico se a dor persistir.",
    hurtSwap: (name: string) => `Trocar ${name} no plano`,
    addLimitation: "Adicionar limitação",
    dismiss: "Dispensar",
    restLabel: "Descanso",
    restOver: "Fim do descanso",
    timerDone: "Pronto",
    notifTitle: "Fim do descanso",
    notifBody: "Hora da próxima série.",
  },

  // ---------- history ----------
  history: {
    title: "Histórico",
    logged: (n: number) => `${plural(n, "treino registrado", "treinos registrados")}`,
    workouts: "Treinos",
    deleted: "Treino apagado",
    empty: "Nenhum treino ainda. Abra a aba Treino, preencha suas séries e toque em Salvar; eles aparecem aqui.",
    meta: (sets: number, volume: string, unit: string) => `${plural(sets, "série", "séries")} · ${volume} ${unit} levantados`,
    delete: "Apagar",
    confirm: "Confirmar",
    earlier: (date: string) => `${date} · de um plano anterior`,
    progress: "Progresso por exercício",
    exercise: "Exercício",
    noCharts: "Os gráficos aparecem depois que você registrar um exercício.",
    calendar: "Dias de treino",
    inMonth: (n: number) => plural(n, "treino", "treinos"),
    prevMonth: "Mês anterior",
    nextMonth: "Próximo mês",
    dayLabel: (date: string, letters: string) => `${date}: treino ${letters}`,
    backup: "Backup",
    backupText: "Seus dados ficam só neste aparelho. Exporte um arquivo de backup de vez em quando. As chaves de API não vão no backup.",
    export: "Exportar backup",
    import: "Importar backup",
    imported: "Backup importado",
    badJson: "Esse arquivo não é um JSON válido.",
    notBackup: "Esse arquivo não é um backup do Pump.",
    importFailed: "Não foi possível importar esse arquivo.",
    exportFailed: "Não foi possível exportar o backup. Tente de novo.",
    shareTitle: "Backup do Pump",
    shareDialog: "Salvar o backup do Pump",
  },

  // ---------- ask Claude (context shared to the Claude app) ----------
  ask: {
    button: "Perguntar ao Claude",
    aboutExercise: "Perguntar ao Claude sobre este exercício",
    aboutWorkout: "Perguntar ao Claude sobre este treino",
    panel: "Perguntar ao Claude",
    hint: "Abre o menu de compartilhar do celular com seu plano e seus treinos recentes em texto. Escolha o app do Claude e escreva sua pergunta depois do texto. Usa a sua assinatura do Claude; o Pump não envia nada sozinho.",
    shareTitle: "Perguntar ao Claude",
    copied: "Contexto copiado. Cole no Claude e escreva sua pergunta.",
    failed: "Não foi possível abrir o menu de compartilhar.",
    intro: "Uso um app de musculação chamado Pump. Abaixo está o meu contexto nele; leve isso em conta na resposta.",
    me: "Sobre mim",
    goal: "Objetivo",
    experience: "Experiência",
    schedule: (days: number, min: number) => `${days} treinos por semana, cerca de ${min} min cada, feitos em rotação (A, B, C…) nos dias que eu puder`,
    equipment: "Equipamento",
    limits: "Lesões ou limitações",
    hurts: "Movimentos que doem",
    priorities: "Músculos prioritários",
    age: "Idade",
    recent: (n: number) => `Treinos registrados nas últimas 4 semanas: ${n}`,
    none: "nenhum",
    plan: (split: string) => `Meu plano atual (${split})`,
    exercise: (name: string) => `O exercício sobre o qual quero perguntar: ${name}`,
    inPlan: "No meu plano",
    notInPlan: "Não está no meu plano atual",
    history: "Minhas séries recentes (carga × repetições)",
    noHistory: "ainda não registrado",
    nextStep: "Sugestão do app para a próxima vez",
    hurtMark: "(marcado com dor)",
    workout: (label: string, date: string) => `O treino sobre o qual quero perguntar: ${label}, ${date}`,
    planned: "previsto",
    insteadOf: (name: string) => `(no lugar de ${name})`,
    notLogged: "não registrado",
    skipped: "pulado desta vez",
    notes: "Minhas anotações",
    question: "Minha pergunta",
  },

  // ---------- settings ----------
  settings: {
    eyebrow: "Guardado só neste aparelho",
    title: "Ajustes",
    language: "Idioma",
    units: "Unidades",
    unitsHint: "Vale para os próximos treinos. Os treinos já registrados mantêm a unidade deles.",
    ai: "Revisão por IA (opcional)",
    aiShow: "Mostrar o botão “Pedir revisão por IA” no plano",
    key: "Chave da API da Anthropic",
    keyHint: "Sua chave fica guardada só neste aparelho e é enviada só para api.anthropic.com. As revisões são cobradas na sua conta da Anthropic, geralmente alguns centavos de dólar cada. Antes de enviar, você vê exatamente o que vai sair. Crie uma chave em",
    noKeyHint: "Sem chave, você ainda pode usar “Copiar texto da revisão” no plano e colar em qualquer chatbot.",
    needKey: "Adicione uma chave de API para usar a revisão por IA, ou desative a opção.",
    save: "Salvar ajustes",
    saved: "Salvo.",
    credits: "Créditos",
    creditsText: "(domínio público). Classificação dos exercícios, notas de exigência nas articulações e o algoritmo do plano: Pump. As notas de exigência são estimativas iniciais e ainda não foram revisadas por um profissional.",
    creditsInstr: "Instruções dos exercícios:",
    translation: "A tradução das instruções para o português é do Pump e ainda não foi revisada por um profissional.",
    medical: "O Pump dá orientações gerais de treino, não conselhos médicos.",
    erase: "Apagar tudo",
    eraseHint: "Apaga suas respostas, plano, treinos e ajustes deste aparelho. Exporte um backup antes se quiser guardá-los.",
    eraseConfirm: "Sim, apagar tudo",
    eraseAll: "Apagar todos os dados",
    erased: "Todos os dados foram apagados",
  },
};
